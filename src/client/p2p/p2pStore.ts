import { v4 as uuid } from 'uuid'
import { UserSettings, ColorMode } from './models/settings'
import { Message, InlineMedia, Peer, SystemMessage, AudioState, VideoState, ScreenShareState, StreamType } from './models/chat'
import { PeerConnectionType } from './lib/PeerRoom'
import { encryption } from './services/Encryption'
import { serialization, SerializedUserSettings } from './services/Serialization'
import { DEFAULT_SOUND } from './config/soundNames'

export interface FileOfferEntry {
  id: string
  fileName: string
  fileSize: number
  fromPeerId: string
  fromName: string
  magnetURI: string
  direction: 'sent' | 'received'
  status: 'pending' | 'accepted' | 'downloading' | 'complete' | 'error'
  progress: number
  blobUrl?: string
}

type AlertColor = 'success' | 'info' | 'warning' | 'error'
type Listener = () => void

export interface P2PState {
  initialized: boolean
  errorMessage: string | null
  userSettings: UserSettings | null

  // Room
  roomId: string | undefined
  password: string | undefined
  peerList: Peer[]
  peerConnectionTypes: Record<string, PeerConnectionType>
  messageLog: Array<Message | InlineMedia | SystemMessage>

  // Media
  selfAudioState: AudioState
  selfVideoState: VideoState
  selfScreenShareState: ScreenShareState
  localAudioStream: MediaStream | null
  localVideoStream: MediaStream | null
  localScreenStream: MediaStream | null
  peerStreams: Record<string, { peerId: string; stream: MediaStream; type: StreamType }[]>

  // File Transfer
  fileOffers: FileOfferEntry[]
  isFileTransferOpen: boolean

  // Direct Messages
  directMessages: Record<string, Array<Message | SystemMessage>>
  activeDmPeerId: string | null
  dmUnreadCounts: Record<string, number>

  // P2P rooms list (joined rooms for sidebar)
  joinedRooms: Array<{ id: string; name: string; isPrivate: boolean }>
  activeRoomName: string | null

  // UI
  title: string
  alertText: string
  alertSeverity: AlertColor
  isAlertShowing: boolean
  unreadCount: number
}

class P2PStore {
  private state: P2PState = {
    initialized: false,
    errorMessage: null,
    userSettings: null,
    roomId: undefined,
    password: undefined,
    peerList: [],
    peerConnectionTypes: {},
    messageLog: [],
    selfAudioState: AudioState.STOPPED,
    selfVideoState: VideoState.STOPPED,
    selfScreenShareState: ScreenShareState.NOT_SHARING,
    localAudioStream: null,
    localVideoStream: null,
    localScreenStream: null,
    peerStreams: {},
    fileOffers: [],
    isFileTransferOpen: false,
    directMessages: {},
    activeDmPeerId: null,
    dmUnreadCounts: {},
    joinedRooms: [],
    activeRoomName: null,
    title: 'P2P Chat',
    alertText: '',
    alertSeverity: 'info',
    isAlertShowing: false,
    unreadCount: 0,
  }

  private listeners: Set<Listener> = new Set()

  getState(): P2PState { return this.state }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  notify() {
    for (const listener of this.listeners) listener()
  }

  private setState(partial: Partial<P2PState>) {
    this.state = { ...this.state, ...partial }
    this.notify()
  }

  // --- Init ---

  async init() {
    try {
      const { publicKey, privateKey } = await encryption.generateKeyPair()

      const defaultSettings: UserSettings = {
        userId: uuid(),
        customUsername: '',
        colorMode: ColorMode.DARK,
        playSoundOnNewMessage: true,
        showNotificationOnNewMessage: true,
        showActiveTypingStatus: true,
        isEnhancedConnectivityEnabled: true,
        publicKey,
        privateKey,
        selectedSound: DEFAULT_SOUND,
      }

      const raw = localStorage.getItem('chitchatter:settings')
      let userSettings = defaultSettings

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SerializedUserSettings
          const deserialized = await serialization.deserializeUserSettings(parsed)
          userSettings = { ...defaultSettings, ...deserialized }
        } catch (e) {
          console.warn('Failed to load P2P settings, using defaults', e)
        }
      }

      this.setState({ userSettings, initialized: true })
      await this.persistSettings(userSettings)

      if (userSettings.showNotificationOnNewMessage && typeof Notification !== 'undefined') {
        Notification.requestPermission().catch(() => {})
      }
    } catch (e: any) {
      console.error(e)
      this.setState({ errorMessage: 'P2P chat failed to initialize.', initialized: true })
    }
  }

  private async persistSettings(settings: UserSettings) {
    try {
      const serialized = await serialization.serializeUserSettings(settings)
      localStorage.setItem('chitchatter:settings', JSON.stringify(serialized))
    } catch (e) {
      console.warn('Failed to persist P2P settings', e)
    }
  }

  async updateSettings(changes: Partial<UserSettings>) {
    if (!this.state.userSettings) return
    const newSettings = { ...this.state.userSettings, ...changes }
    this.setState({ userSettings: newSettings })
    await this.persistSettings(newSettings)
  }

  // --- Room ---

  setRoomId(roomId: string | undefined) { this.setState({ roomId }) }
  setPassword(password: string | undefined) { this.setState({ password }) }

  setPeerList(peerList: Peer[]) { this.setState({ peerList }) }

  addPeer(peer: Peer) {
    this.setState({ peerList: [...this.state.peerList, peer] })
  }

  removePeer(peerId: string) {
    this.setState({ peerList: this.state.peerList.filter(p => p.peerId !== peerId) })
  }

  updatePeer(peerId: string, updates: Partial<Peer>) {
    const idx = this.state.peerList.findIndex(p => p.peerId === peerId)
    if (idx === -1) return
    const list = [...this.state.peerList]
    list[idx] = { ...list[idx], ...updates }
    this.setState({ peerList: list })
  }

  setMessageLog(messages: Array<Message | InlineMedia | SystemMessage>) {
    this.setState({ messageLog: messages })
  }

  addMessage(message: Message | InlineMedia | SystemMessage) {
    const newLog = [...this.state.messageLog, message]
    const updates: Partial<P2PState> = { messageLog: newLog }
    if (document.hidden) {
      const count = this.state.unreadCount + 1
      updates.unreadCount = count
    }
    this.setState(updates)
  }

  addSystemMessage(text: string) {
    const msg: SystemMessage = {
      id: uuid(),
      type: 'system',
      text,
      timeSent: Date.now(),
      authorId: '__system__',
    }
    this.addMessage(msg)
  }

  resetUnread() {
    if (this.state.unreadCount > 0) this.setState({ unreadCount: 0 })
  }

  setPeerConnectionTypes(types: Record<string, PeerConnectionType>) {
    this.setState({ peerConnectionTypes: types })
  }

  // --- Media ---

  setSelfAudioState(state: AudioState) { this.setState({ selfAudioState: state }) }
  setSelfVideoState(state: VideoState) { this.setState({ selfVideoState: state }) }
  setSelfScreenShareState(state: ScreenShareState) { this.setState({ selfScreenShareState: state }) }
  setLocalAudioStream(stream: MediaStream | null) { this.setState({ localAudioStream: stream }) }
  setLocalVideoStream(stream: MediaStream | null) { this.setState({ localVideoStream: stream }) }
  setLocalScreenStream(stream: MediaStream | null) { this.setState({ localScreenStream: stream }) }

  addPeerStream(peerId: string, stream: MediaStream, type: StreamType) {
    const current = { ...this.state.peerStreams }
    if (!current[peerId]) current[peerId] = []
    current[peerId] = current[peerId].filter(s => s.type !== type)
    current[peerId].push({ peerId, stream, type })
    this.setState({ peerStreams: current })
  }

  removePeerStream(peerId: string, type: StreamType) {
    const current = { ...this.state.peerStreams }
    if (!current[peerId]) return
    current[peerId] = current[peerId].filter(s => s.type !== type)
    if (current[peerId].length === 0) delete current[peerId]
    this.setState({ peerStreams: current })
  }

  removePeerStreams(peerId: string) {
    const current = { ...this.state.peerStreams }
    delete current[peerId]
    this.setState({ peerStreams: current })
  }

  // --- File Transfer ---

  addFileOffer(offer: FileOfferEntry) {
    this.setState({ fileOffers: [...this.state.fileOffers, offer] })
  }

  updateFileOffer(id: string, updates: Partial<FileOfferEntry>) {
    const offers = this.state.fileOffers.map(o => o.id === id ? { ...o, ...updates } : o)
    this.setState({ fileOffers: offers })
  }

  removeFileOffer(id: string) {
    this.setState({ fileOffers: this.state.fileOffers.filter(o => o.id !== id) })
  }

  toggleFileTransfer() {
    this.setState({ isFileTransferOpen: !this.state.isFileTransferOpen })
  }

  // --- Direct Messages ---

  openDm(peerId: string) {
    const counts = { ...this.state.dmUnreadCounts }
    delete counts[peerId]
    this.setState({ activeDmPeerId: peerId, dmUnreadCounts: counts })
  }

  closeDm() { this.setState({ activeDmPeerId: null }) }

  addDirectMessage(peerId: string, message: Message | SystemMessage) {
    const dms = { ...this.state.directMessages }
    if (!dms[peerId]) dms[peerId] = []
    dms[peerId] = [...dms[peerId], message]
    const counts = { ...this.state.dmUnreadCounts }
    if (this.state.activeDmPeerId !== peerId) {
      counts[peerId] = (counts[peerId] || 0) + 1
    }
    this.setState({ directMessages: dms, dmUnreadCounts: counts })
  }

  clearDirectMessages(peerId: string) {
    const dms = { ...this.state.directMessages }
    delete dms[peerId]
    const counts = { ...this.state.dmUnreadCounts }
    delete counts[peerId]
    this.setState({ directMessages: dms, dmUnreadCounts: counts })
  }

  resetMediaState() {
    this.state.localAudioStream?.getTracks().forEach(t => t.stop())
    this.state.localVideoStream?.getTracks().forEach(t => t.stop())
    this.state.localScreenStream?.getTracks().forEach(t => t.stop())
    this.setState({
      selfAudioState: AudioState.STOPPED,
      selfVideoState: VideoState.STOPPED,
      selfScreenShareState: ScreenShareState.NOT_SHARING,
      localAudioStream: null,
      localVideoStream: null,
      localScreenStream: null,
      peerStreams: {},
    })
  }

  // --- Rooms list ---

  addJoinedRoom(name: string, isPrivate: boolean) {
    const id = `${isPrivate ? 'private' : 'public'}:${name}`
    if (this.state.joinedRooms.some(r => r.id === id)) return
    this.setState({
      joinedRooms: [...this.state.joinedRooms, { id, name, isPrivate }],
      activeRoomName: name,
    })
  }

  removeJoinedRoom(name: string) {
    this.setState({
      joinedRooms: this.state.joinedRooms.filter(r => r.name !== name),
      activeRoomName: this.state.activeRoomName === name ? null : this.state.activeRoomName,
    })
  }

  setActiveRoom(name: string | null) {
    this.setState({ activeRoomName: name })
  }

  // --- UI ---

  setTitle(title: string) { this.setState({ title }) }

  private alertTimer: ReturnType<typeof setTimeout> | null = null

  showAlert(text: string, severity: AlertColor = 'info') {
    if (this.alertTimer) clearTimeout(this.alertTimer)
    this.setState({ alertText: text, alertSeverity: severity, isAlertShowing: true })
    this.alertTimer = setTimeout(() => this.hideAlert(), 3000)
  }

  hideAlert() {
    if (this.alertTimer) { clearTimeout(this.alertTimer); this.alertTimer = null }
    this.setState({ isAlertShowing: false })
  }
}

export const p2pStore = new P2PStore()

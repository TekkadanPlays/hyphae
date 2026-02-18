import { v4 as uuid } from 'uuid'
import { p2pStore, type FileOfferEntry } from './p2pStore'
import {
  PeerRoom,
  PeerHookType,
  PeerStreamType,
  ActionNamespace,
  type RoomConfig,
} from './lib/PeerRoom'
import { PeerAction } from './models/network'
import {
  type Peer,
  type UnsentMessage,
  type ReceivedMessage,
  type ReceivedInlineMedia,
  type Message,
  type InlineMedia,
  isMessageReceived,
  AudioChannelName,
  AudioState,
  VideoState,
  ScreenShareState,
  StreamType,
  PeerVerificationState,
} from './models/chat'
import { time } from './lib/Time'
import { encryption, AllowedKeyType } from './services/Encryption'
import { rtcConfig } from './config/rtcConfig'
import { trackerUrls } from './config/trackerUrls'
import { messageTranscriptSizeLimit } from './config/messaging'
import { getPeerName, getDisplayUsername } from './lib/getPeerName'
import { type TypingStatus, type FileOfferMetadata } from './models/chat'
import { Audio as AudioPlayer } from './lib/Audio'

interface UserMetadata extends Record<string, any> {
  userId: string
  customUsername: string
  publicKeyString: string
}

interface AudioChangePayload extends Record<string, any> {
  state: AudioState
}

interface VideoChangePayload extends Record<string, any> {
  state: VideoState
}

interface ScreenSharePayload extends Record<string, any> {
  state: ScreenShareState
}

interface VerificationTokenEncryptedPayload extends Record<string, any> {
  encryptedToken: string // base64-encoded encrypted token
}

interface VerificationTokenRawPayload extends Record<string, any> {
  rawToken: string
}

interface FileDataPayload extends Record<string, any> {
  offerId: string
  chunkIndex: number
  totalChunks: number
  data: string // base64 chunk
}

let currentPeerRoom: PeerRoom | null = null
let sendPeerMetadataFn: ((data: UserMetadata, peerId?: string) => Promise<any>) | null = null
let sendPeerMessageFn: ((data: UnsentMessage, peerId?: string) => Promise<any>) | null = null
let sendMessageTranscriptFn: ((data: Array<ReceivedMessage | ReceivedInlineMedia>, peerId?: string) => Promise<any>) | null = null
let sendTypingStatusFn: ((data: TypingStatus, peerId?: string) => Promise<any>) | null = null
let typingDebounceTimer: ReturnType<typeof setTimeout> | null = null
let audioPlayer: AudioPlayer | null = null
let sendAudioChangeFn: ((data: AudioChangePayload) => Promise<any>) | null = null
let sendVideoChangeFn: ((data: VideoChangePayload) => Promise<any>) | null = null
let sendScreenShareFn: ((data: ScreenSharePayload) => Promise<any>) | null = null
let sendFileOfferFn: ((data: FileOfferMetadata) => Promise<any>) | null = null
let sendFileDataFn: ((data: FileDataPayload) => Promise<any>) | null = null
let sendDirectMessageFn: ((data: UnsentMessage, peerId?: string) => Promise<any>) | null = null

// Buffer for incoming file chunks: offerId -> { chunks, totalChunks, fileName }
const incomingFileChunks: Record<string, { chunks: string[], received: number, totalChunks: number }> = {}

const FILE_CHUNK_SIZE = 64 * 1024 // 64KB chunks

let sendVerificationTokenEncryptedFn: ((data: VerificationTokenEncryptedPayload, peerId?: string) => Promise<any>) | null = null
let sendVerificationTokenRawFn: ((data: VerificationTokenRawPayload, peerId?: string) => Promise<any>) | null = null

const VERIFICATION_TIMEOUT_MS = 10_000

export function getCurrentPeerRoom() {
  return currentPeerRoom
}

export async function joinRoom(roomId: string, password?: string) {
  const state = p2pStore.getState()
  if (!state.userSettings) return

  // Leave existing room first
  leaveRoom()

  const { userId, customUsername, publicKey } = state.userSettings
  const appId = `${encodeURI(window.location.origin)}_chitchatter`

  // For private rooms, derive a hashed room ID from the password
  let effectiveRoomId = roomId
  if (password) {
    effectiveRoomId = await encryption.encodePassword(roomId, password)
  }

  const config: RoomConfig = {
    appId,
    relayUrls: trackerUrls,
    password: password ?? roomId,
    relayRedundancy: 4,
    rtcConfig,
  }

  const peerRoom = new PeerRoom(config, effectiveRoomId)
  currentPeerRoom = peerRoom

  p2pStore.setRoomId(roomId)
  if (password) p2pStore.setPassword(password)
  p2pStore.setTitle(`Room: ${roomId.slice(0, 8)}…`)

  // --- Set up actions ---

  const namespace = ActionNamespace.GROUP

  // Peer metadata action
  const [sendMetadata, receiveMetadata, , detachMetadata] = peerRoom.makeAction<UserMetadata>(
    PeerAction.PEER_METADATA,
    namespace,
  )
  sendPeerMetadataFn = sendMetadata

  receiveMetadata(async (metadata: UserMetadata, peerId: string) => {
    const { userId: peerUserId, customUsername: peerCustomUsername, publicKeyString } = metadata

    let parsedPublicKey: CryptoKey
    try {
      parsedPublicKey = await encryption.parseCryptoKeyString(publicKeyString, AllowedKeyType.PUBLIC)
    } catch (e) {
      console.error('Failed to parse peer public key', e)
      return
    }

    const currentState = p2pStore.getState()
    const existingIdx = currentState.peerList.findIndex(p => p.peerId === peerId)

    if (existingIdx === -1) {
      const verificationToken = uuid()
      const newPeer: Peer = {
        peerId,
        userId: peerUserId,
        publicKey: parsedPublicKey,
        customUsername: peerCustomUsername,
        audioChannelState: {
          [AudioChannelName.MICROPHONE]: AudioState.STOPPED,
          [AudioChannelName.SCREEN_SHARE]: AudioState.STOPPED,
        },
        videoState: VideoState.STOPPED,
        screenShareState: ScreenShareState.NOT_SHARING,
        offeredFileId: null,
        isTypingGroupMessage: false,
        isTypingDirectMessage: false,
        verificationToken,
        encryptedVerificationToken: new ArrayBuffer(0),
        verificationState: PeerVerificationState.VERIFYING,
        verificationTimer: null,
      }
      p2pStore.addPeer(newPeer)

      // Initiate verification: encrypt our token with peer's public key and send it
      try {
        const encryptedBuffer = await encryption.encryptString(parsedPublicKey, verificationToken)
        const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)))
        sendVerificationTokenEncryptedFn?.({ encryptedToken: encryptedBase64 }, peerId)

        // Set a timeout — if peer doesn't respond, mark as unverified
        const timer = setTimeout(() => {
          const s = p2pStore.getState()
          const p = s.peerList.find(pp => pp.peerId === peerId)
          if (p && p.verificationState === PeerVerificationState.VERIFYING) {
            p2pStore.updatePeer(peerId, { verificationState: PeerVerificationState.UNVERIFIED, verificationTimer: null })
          }
        }, VERIFICATION_TIMEOUT_MS)
        p2pStore.updatePeer(peerId, { verificationTimer: timer as any })
      } catch (e) {
        console.error('Failed to encrypt verification token for peer', peerId, e)
        p2pStore.updatePeer(peerId, { verificationState: PeerVerificationState.UNVERIFIED })
      }
    } else {
      const oldPeer = currentState.peerList[existingIdx]
      const oldName = oldPeer.customUsername || getPeerName(oldPeer.userId)
      const newName = peerCustomUsername || getPeerName(peerUserId)

      p2pStore.updatePeer(peerId, {
        userId: peerUserId,
        customUsername: peerCustomUsername,
      })

      if (oldName !== newName) {
        p2pStore.showAlert(`${oldName} is now ${newName}`)
      }
    }
  })

  // Message action
  const [sendMsg, receiveMsg, , detachMsg] = peerRoom.makeAction<UnsentMessage>(
    PeerAction.MESSAGE,
    namespace,
  )
  sendPeerMessageFn = sendMsg

  receiveMsg((message: UnsentMessage, peerId: string) => {
    const currentState = p2pStore.getState()
    const newMsg = { ...message, timeReceived: time.now() }

    const trimmed = [...currentState.messageLog, newMsg].slice(-messageTranscriptSizeLimit)
    p2pStore.setMessageLog(trimmed)

    p2pStore.updatePeer(peerId, { isTypingGroupMessage: false })

    const displayName = getDisplayUsername(
      message.authorId,
      currentState.peerList,
      currentState.userSettings?.userId,
      currentState.userSettings?.customUsername,
    )
    // Play sound
    if (currentState.userSettings?.playSoundOnNewMessage && audioPlayer) {
      audioPlayer.play()
    }

    // Browser notification if tab not focused
    if (document.hidden && currentState.userSettings?.showNotificationOnNewMessage) {
      try {
        new Notification(`${displayName}: ${message.text}`)
      } catch (_) {}
    }
  })

  // Message transcript action (for syncing history to new peers)
  const [sendTranscript, receiveTranscript, , detachTranscript] = peerRoom.makeAction<
    Array<ReceivedMessage | ReceivedInlineMedia>
  >(
    PeerAction.MESSAGE_TRANSCRIPT,
    namespace,
  )
  sendMessageTranscriptFn = sendTranscript

  receiveTranscript((transcript: Array<ReceivedMessage | ReceivedInlineMedia>) => {
    const currentState = p2pStore.getState()
    if (currentState.messageLog.length > 0) return
    p2pStore.setMessageLog(transcript.slice(-messageTranscriptSizeLimit))
  })

  // Typing status action
  const [sendTyping, receiveTyping, , detachTyping] = peerRoom.makeAction<TypingStatus>(
    PeerAction.TYPING_STATUS_CHANGE,
    namespace,
  )
  sendTypingStatusFn = sendTyping

  receiveTyping((status: TypingStatus, peerId: string) => {
    p2pStore.updatePeer(peerId, { isTypingGroupMessage: status.isTyping })
  })

  // --- Audio/Video/Screen change actions ---

  const [sendAudioChange, receiveAudioChange, , detachAudioChange] = peerRoom.makeAction<AudioChangePayload>(
    PeerAction.AUDIO_CHANGE,
    namespace,
  )
  sendAudioChangeFn = sendAudioChange

  receiveAudioChange((payload: AudioChangePayload, peerId: string) => {
    p2pStore.updatePeer(peerId, {
      audioChannelState: {
        ...p2pStore.getState().peerList.find(p => p.peerId === peerId)?.audioChannelState!,
        [AudioChannelName.MICROPHONE]: payload.state,
      },
    })
  })

  const [sendVideoChange, receiveVideoChange, , detachVideoChange] = peerRoom.makeAction<VideoChangePayload>(
    PeerAction.VIDEO_CHANGE,
    namespace,
  )
  sendVideoChangeFn = sendVideoChange

  receiveVideoChange((payload: VideoChangePayload, peerId: string) => {
    p2pStore.updatePeer(peerId, { videoState: payload.state })
  })

  const [sendScreenShare, receiveScreenShare, , detachScreenShare] = peerRoom.makeAction<ScreenSharePayload>(
    PeerAction.SCREEN_SHARE,
    namespace,
  )
  sendScreenShareFn = sendScreenShare

  receiveScreenShare((payload: ScreenSharePayload, peerId: string) => {
    p2pStore.updatePeer(peerId, { screenShareState: payload.state })
    if (payload.state === ScreenShareState.NOT_SHARING) {
      p2pStore.removePeerStream(peerId, StreamType.SCREEN_SHARE)
    }
  })

  // --- Verification token actions ---

  const [sendVerifEncrypted, receiveVerifEncrypted, , detachVerifEncrypted] = peerRoom.makeAction<VerificationTokenEncryptedPayload>(
    PeerAction.VERIFICATION_TOKEN_ENCRYPTED,
    namespace,
  )
  sendVerificationTokenEncryptedFn = sendVerifEncrypted

  const [sendVerifRaw, receiveVerifRaw, , detachVerifRaw] = peerRoom.makeAction<VerificationTokenRawPayload>(
    PeerAction.VERIFICATION_TOKEN_RAW,
    namespace,
  )
  sendVerificationTokenRawFn = sendVerifRaw

  // When we receive an encrypted token from a peer, decrypt it with our private key and send back the raw token
  receiveVerifEncrypted(async (payload: VerificationTokenEncryptedPayload, peerId: string) => {
    try {
      const currentState = p2pStore.getState()
      const privateKey = currentState.userSettings?.privateKey
      if (!privateKey) return

      const binaryString = atob(payload.encryptedToken)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i)

      const rawToken = await encryption.decryptString(privateKey, bytes.buffer)
      sendVerifRaw({ rawToken }, peerId)
    } catch (e) {
      console.error('Failed to decrypt verification token from peer', peerId, e)
    }
  })

  // When we receive a raw token back, check if it matches what we sent
  receiveVerifRaw((payload: VerificationTokenRawPayload, peerId: string) => {
    const currentState = p2pStore.getState()
    const peer = currentState.peerList.find(p => p.peerId === peerId)
    if (!peer) return

    if (peer.verificationTimer) {
      clearTimeout(peer.verificationTimer)
    }

    if (payload.rawToken === peer.verificationToken) {
      p2pStore.updatePeer(peerId, {
        verificationState: PeerVerificationState.VERIFIED,
        verificationTimer: null,
      })
    } else {
      p2pStore.updatePeer(peerId, {
        verificationState: PeerVerificationState.UNVERIFIED,
        verificationTimer: null,
      })
    }
  })

  // --- File offer action ---

  const [sendFileOffer, receiveFileOffer, , detachFileOffer] = peerRoom.makeAction<FileOfferMetadata>(
    PeerAction.FILE_OFFER,
    namespace,
  )
  sendFileOfferFn = sendFileOffer

  receiveFileOffer((payload: FileOfferMetadata, peerId: string) => {
    const currentState = p2pStore.getState()
    const peer = currentState.peerList.find(p => p.peerId === peerId)
    const fromName = peer
      ? (peer.customUsername || getDisplayUsername(peer.userId, currentState.peerList, currentState.userSettings?.userId || '', currentState.userSettings?.customUsername || ''))
      : 'Someone'

    // Use the magnetURI field as the offerId for chunk matching
    const offerId = payload.magnetURI

    const offer: FileOfferEntry = {
      id: offerId,
      fileName: payload.fileName || 'file',
      fileSize: payload.fileSize || 0,
      fromPeerId: peerId,
      fromName,
      magnetURI: offerId,
      direction: 'received',
      status: 'downloading',
      progress: 0,
    }
    p2pStore.addFileOffer(offer)
    p2pStore.addSystemMessage(`${fromName} is sending: ${offer.fileName}`)

    // Initialize chunk buffer
    incomingFileChunks[offerId] = { chunks: [], received: 0, totalChunks: 0 }

    // Auto-open file transfer panel
    if (!currentState.isFileTransferOpen) p2pStore.toggleFileTransfer()
  })

  // --- File data (chunked transfer) action ---

  const [sendFileData, receiveFileData, , detachFileData] = peerRoom.makeAction<FileDataPayload>(
    PeerAction.FILE_DATA,
    namespace,
  )
  sendFileDataFn = sendFileData

  receiveFileData((payload: FileDataPayload, _peerId: string) => {
    const { offerId, chunkIndex, totalChunks, data } = payload
    const buffer = incomingFileChunks[offerId]
    if (!buffer) return

    buffer.totalChunks = totalChunks
    buffer.chunks[chunkIndex] = data
    buffer.received++

    // Update progress
    const progress = Math.round((buffer.received / totalChunks) * 100)
    p2pStore.updateFileOffer(offerId, { progress, status: 'downloading' })

    // Check if all chunks received
    if (buffer.received === totalChunks) {
      // Reassemble the file
      const binaryChunks = buffer.chunks.map(b64 => {
        const bin = atob(b64)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        return bytes
      })
      const blob = new Blob(binaryChunks)
      const blobUrl = URL.createObjectURL(blob)
      p2pStore.updateFileOffer(offerId, { status: 'complete', progress: 100, blobUrl })
      delete incomingFileChunks[offerId]
    }
  })

  // --- Direct message action ---

  const [sendDm, receiveDm, , detachDm] = peerRoom.makeAction<UnsentMessage>(
    PeerAction.DIRECT_MESSAGE,
    ActionNamespace.DIRECT_MESSAGE,
  )
  sendDirectMessageFn = sendDm

  receiveDm((message: UnsentMessage, peerId: string) => {
    const newMsg = { ...message, timeReceived: time.now() }
    p2pStore.addDirectMessage(peerId, newMsg)

    const currentState = p2pStore.getState()
    // Play sound
    if (currentState.userSettings?.playSoundOnNewMessage && audioPlayer) {
      audioPlayer.play()
    }

    // Browser notification if tab not focused or DM not open
    if ((document.hidden || currentState.activeDmPeerId !== peerId) && currentState.userSettings?.showNotificationOnNewMessage) {
      const peer = currentState.peerList.find(p => p.peerId === peerId)
      const displayName = peer
        ? (peer.customUsername || getDisplayUsername(peer.userId, currentState.peerList, currentState.userSettings?.userId || '', currentState.userSettings?.customUsername || ''))
        : 'Someone'
      try {
        new Notification(`DM from ${displayName}: ${message.text}`)
      } catch (_) {}
    }
  })

  // --- Peer stream handler ---

  peerRoom.onPeerStream(PeerStreamType.AUDIO, (stream: MediaStream, peerId: string, metadata: any) => {
    const streamType: StreamType = metadata?.type || StreamType.MICROPHONE
    p2pStore.addPeerStream(peerId, stream, streamType)

    // Auto-play audio streams
    if (streamType === StreamType.MICROPHONE || streamType === StreamType.SCREEN_SHARE) {
      const audio = new Audio()
      audio.srcObject = stream
      audio.autoplay = true
      audio.play().catch(() => {})
    }
  })

  // --- Audio notification ---
  const currentSettings = p2pStore.getState().userSettings
  if (currentSettings?.selectedSound) {
    audioPlayer = new AudioPlayer(currentSettings.selectedSound)
  }

  // --- Peer join/leave ---

  peerRoom.onPeerJoin(PeerHookType.NEW_PEER, (peerId: string) => {
    p2pStore.addSystemMessage('Someone has joined the room')
    p2pStore.showAlert('Someone has joined the room', 'success')

    ;(async () => {
      try {
        const currentState = p2pStore.getState()
        if (!currentState.userSettings) return

        const publicKeyString = await encryption.stringifyCryptoKey(currentState.userSettings.publicKey)

        await sendMetadata(
          {
            userId: currentState.userSettings.userId,
            customUsername: currentState.userSettings.customUsername,
            publicKeyString,
          },
          peerId,
        )

        // Send message transcript to new peer
        const receivedMessages = currentState.messageLog.filter(isMessageReceived) as Array<ReceivedMessage | ReceivedInlineMedia>
        if (receivedMessages.length > 0) {
          await sendTranscript(receivedMessages, peerId)
        }
      } catch (e) {
        console.error('Error sending metadata to new peer', e)
      }
    })()
  })

  peerRoom.onPeerLeave(PeerHookType.NEW_PEER, (peerId: string) => {
    const currentState = p2pStore.getState()
    const peer = currentState.peerList.find(p => p.peerId === peerId)
    const name = peer
      ? (peer.customUsername || getPeerName(peer.userId))
      : 'Someone'

    p2pStore.addSystemMessage(`${name} has left the room`)
    p2pStore.showAlert(`${name} has left the room`, 'warning')
    p2pStore.removePeerStreams(peerId)
    p2pStore.removePeer(peerId)
  })

  // Broadcast our metadata to all existing peers
  try {
    const publicKeyString = await encryption.stringifyCryptoKey(publicKey)
    await sendMetadata({ userId, customUsername, publicKeyString })
  } catch (e) {
    console.error('Error broadcasting initial metadata', e)
  }
}

export async function sendMessage(text: string) {
  if (!sendPeerMessageFn) return
  const state = p2pStore.getState()
  if (!state.userSettings) return

  const unsentMessage: UnsentMessage = {
    authorId: state.userSettings.userId,
    text,
    timeSent: time.now(),
    id: uuid(),
  }

  // Optimistically add to log
  const withUnsent = [...state.messageLog, unsentMessage].slice(-messageTranscriptSizeLimit)
  p2pStore.setMessageLog(withUnsent)

  // Send to peers
  await sendPeerMessageFn(unsentMessage)

  // Mark as received locally
  const currentState = p2pStore.getState()
  const updatedLog = currentState.messageLog.map(m =>
    m.id === unsentMessage.id ? { ...m, timeReceived: time.now() } : m
  )
  p2pStore.setMessageLog(updatedLog)
}

export function sendTypingStatus(isTyping: boolean) {
  if (!sendTypingStatusFn) return
  const state = p2pStore.getState()
  if (!state.userSettings?.showActiveTypingStatus) return

  sendTypingStatusFn({ isTyping })
}

export function handleMessageInputChange() {
  if (!sendTypingStatusFn) return
  const state = p2pStore.getState()
  if (!state.userSettings?.showActiveTypingStatus) return

  sendTypingStatus(true)

  if (typingDebounceTimer) clearTimeout(typingDebounceTimer)
  typingDebounceTimer = setTimeout(() => {
    sendTypingStatus(false)
  }, 3000)
}

export async function toggleAudio() {
  if (!currentPeerRoom) return
  const state = p2pStore.getState()

  if (state.selfAudioState === AudioState.PLAYING) {
    // Stop audio
    state.localAudioStream?.getTracks().forEach(t => t.stop())
    if (state.localAudioStream) currentPeerRoom.removeStream(state.localAudioStream)
    p2pStore.setLocalAudioStream(null)
    p2pStore.setSelfAudioState(AudioState.STOPPED)
    sendAudioChangeFn?.({ state: AudioState.STOPPED })
  } else {
    // Start audio
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      p2pStore.setLocalAudioStream(stream)
      p2pStore.setSelfAudioState(AudioState.PLAYING)
      currentPeerRoom.addStream(stream, undefined, { type: StreamType.MICROPHONE })
      sendAudioChangeFn?.({ state: AudioState.PLAYING })
    } catch (e) {
      p2pStore.showAlert('Could not access microphone', 'error')
    }
  }
}

export async function toggleVideo() {
  if (!currentPeerRoom) return
  const state = p2pStore.getState()

  if (state.selfVideoState === VideoState.PLAYING) {
    // Stop video
    state.localVideoStream?.getTracks().forEach(t => t.stop())
    if (state.localVideoStream) currentPeerRoom.removeStream(state.localVideoStream)
    p2pStore.setLocalVideoStream(null)
    p2pStore.setSelfVideoState(VideoState.STOPPED)
    sendVideoChangeFn?.({ state: VideoState.STOPPED })
  } else {
    // Start video
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
      p2pStore.setLocalVideoStream(stream)
      p2pStore.setSelfVideoState(VideoState.PLAYING)
      currentPeerRoom.addStream(stream, undefined, { type: StreamType.WEBCAM })
      sendVideoChangeFn?.({ state: VideoState.PLAYING })
    } catch (e) {
      p2pStore.showAlert('Could not access camera', 'error')
    }
  }
}

export async function toggleScreenShare() {
  if (!currentPeerRoom) return
  const state = p2pStore.getState()

  if (state.selfScreenShareState === ScreenShareState.SHARING) {
    // Stop screen share
    state.localScreenStream?.getTracks().forEach(t => t.stop())
    if (state.localScreenStream) currentPeerRoom.removeStream(state.localScreenStream)
    p2pStore.setLocalScreenStream(null)
    p2pStore.setSelfScreenShareState(ScreenShareState.NOT_SHARING)
    sendScreenShareFn?.({ state: ScreenShareState.NOT_SHARING })
  } else {
    // Start screen share
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      p2pStore.setLocalScreenStream(stream)
      p2pStore.setSelfScreenShareState(ScreenShareState.SHARING)
      currentPeerRoom.addStream(stream, undefined, { type: StreamType.SCREEN_SHARE })
      sendScreenShareFn?.({ state: ScreenShareState.SHARING })

      // Handle browser-native stop (user clicks "Stop sharing")
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        p2pStore.setLocalScreenStream(null)
        p2pStore.setSelfScreenShareState(ScreenShareState.NOT_SHARING)
        sendScreenShareFn?.({ state: ScreenShareState.NOT_SHARING })
      })
    } catch (e) {
      // User cancelled the picker — not an error
    }
  }
}

export async function sendDirectMessage(peerId: string, text: string) {
  if (!sendDirectMessageFn) return
  const state = p2pStore.getState()
  if (!state.userSettings) return

  const message: UnsentMessage = {
    id: uuid(),
    text,
    timeSent: time.now(),
    authorId: state.userSettings.userId,
  }

  // Add to our own DM log
  p2pStore.addDirectMessage(peerId, message)

  // Send to the specific peer
  await sendDirectMessageFn(message, peerId)
}

export async function sendFileToRoom(file: File) {
  if (!sendFileOfferFn || !sendFileDataFn) return
  const state = p2pStore.getState()
  if (!state.userSettings) return

  const offerId = uuid()
  const userName = state.userSettings.customUsername || getPeerName(state.userSettings.userId)
  const blobUrl = URL.createObjectURL(file)

  // Add to our own file offers as sent
  const offer: FileOfferEntry = {
    id: offerId,
    fileName: file.name,
    fileSize: file.size,
    fromPeerId: 'self',
    fromName: userName,
    magnetURI: offerId,
    direction: 'sent',
    status: 'downloading',
    progress: 0,
    blobUrl,
  }
  p2pStore.addFileOffer(offer)

  // Broadcast file offer to peers (offerId in magnetURI field for chunk matching)
  const metadata: FileOfferMetadata = {
    magnetURI: offerId,
    isAllInlineMedia: false,
    fileName: file.name,
    fileSize: file.size,
  }
  await sendFileOfferFn(metadata)

  // Read file and send in chunks
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const totalChunks = Math.ceil(bytes.length / FILE_CHUNK_SIZE)

  for (let i = 0; i < totalChunks; i++) {
    const start = i * FILE_CHUNK_SIZE
    const end = Math.min(start + FILE_CHUNK_SIZE, bytes.length)
    const chunk = bytes.slice(start, end)
    const b64 = btoa(String.fromCharCode(...chunk))

    await sendFileDataFn({
      offerId,
      chunkIndex: i,
      totalChunks,
      data: b64,
    })

    // Update our own progress
    const progress = Math.round(((i + 1) / totalChunks) * 100)
    p2pStore.updateFileOffer(offerId, { progress, status: progress === 100 ? 'complete' : 'downloading' })
  }

  p2pStore.addSystemMessage(`File sent: ${file.name}`)
}

export function leaveRoom() {
  p2pStore.resetMediaState()
  if (currentPeerRoom) {
    currentPeerRoom.leaveRoom()
    currentPeerRoom = null
  }
  sendPeerMetadataFn = null
  sendPeerMessageFn = null
  sendMessageTranscriptFn = null
  sendTypingStatusFn = null
  sendAudioChangeFn = null
  sendVideoChangeFn = null
  sendScreenShareFn = null
  sendFileOfferFn = null
  sendFileDataFn = null
  sendDirectMessageFn = null
  // Clear any pending chunk buffers
  for (const key of Object.keys(incomingFileChunks)) delete incomingFileChunks[key]
  sendVerificationTokenEncryptedFn = null
  sendVerificationTokenRawFn = null
  audioPlayer = null
  if (typingDebounceTimer) clearTimeout(typingDebounceTimer)
  p2pStore.setPeerList([])
  p2pStore.setMessageLog([])
  p2pStore.setRoomId(undefined)
  p2pStore.setPassword(undefined)
}

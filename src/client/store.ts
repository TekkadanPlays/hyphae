// Client-side state store for the IRC client
import type {
  IrcNetwork, IrcChannel, IrcMessage, IrcUser,
  ServerEvent, ConnectOptions,
} from '../shared/types';
import { socket } from './socket';

type Listener = () => void;

export interface UserSettings {
  // Appearance
  showSeconds: boolean;
  use12hClock: boolean;
  coloredNicks: boolean;
  showMotd: boolean;
  statusMessages: 'shown' | 'condensed' | 'hidden';
  nickPostfix: string;
  // Notifications
  desktopNotifications: boolean;
  notificationSound: boolean;
  notifyAllMessages: boolean;
  highlights: string;
  highlightExceptions: string;
  // General
  autocomplete: boolean;
  awayMessage: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  showSeconds: false,
  use12hClock: false,
  coloredNicks: true,
  showMotd: true,
  statusMessages: 'shown',
  nickPostfix: ', ',
  desktopNotifications: false,
  notificationSound: true,
  notifyAllMessages: false,
  highlights: '',
  highlightExceptions: '',
  autocomplete: true,
  awayMessage: '',
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem('hyphae:settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export type AppMode = 'home' | 'irc';

export type SettingsPage = 'app-general' | 'irc-appearance' | 'irc-notifications' | 'irc-general';

export interface AppState {
  appMode: AppMode;
  previousMode: AppMode;
  networks: IrcNetwork[];
  activeNetworkId: string | null;
  activeChannelName: string | null;
  sidebarOpen: boolean;
  sidebarWidth: number;
  userlistOpen: boolean;
  connectFormOpen: boolean;
  settingsOpen: boolean;
  settingsPage: SettingsPage;
  nostrPubkey: string | null;
  profilePanelPubkey: string | null;
  settings: UserSettings;
}

class Store {
  private state: AppState = {
    appMode: 'home',
    previousMode: 'home',
    networks: [],
    activeNetworkId: null,
    activeChannelName: null,
    sidebarOpen: true,
    sidebarWidth: parseInt(localStorage.getItem('hyphae:sidebarWidth') || '240', 10),
    userlistOpen: true,
    connectFormOpen: false,
    settingsOpen: false,
    settingsPage: 'app-general',
    nostrPubkey: null,
    profilePanelPubkey: null,
    settings: loadSettings(),
  };

  private listeners: Set<Listener> = new Set();

  constructor() {
    socket.onEvent((event) => this.handleServerEvent(event));
  }

  getState(): AppState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  private setState(partial: Partial<AppState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  // --- Actions ---

  connect(options: ConnectOptions) {
    socket.send({ type: 'connect', network: options });
    this.setState({ connectFormOpen: false });
  }

  disconnect(networkId: string) {
    socket.send({ type: 'disconnect', networkId });
  }

  sendMessage(text: string) {
    const { activeNetworkId, activeChannelName } = this.state;
    if (!activeNetworkId || !activeChannelName) return;
    socket.send({ type: 'message', networkId: activeNetworkId, target: activeChannelName, text });
  }

  joinChannel(channel: string, key?: string) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId) return;
    socket.send({ type: 'join', networkId: activeNetworkId, channel, key });
  }

  partChannel(channel: string) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId) return;
    socket.send({ type: 'part', networkId: activeNetworkId, channel });
  }

  setActiveChannel(networkId: string, channelName: string) {
    // Clear unread for the channel we're switching to
    const network = this.state.networks.find(n => n.id === networkId);
    if (network) {
      const channel = network.channels.find(c => c.name === channelName);
      if (channel) {
        channel.unread = 0;
        channel.highlight = 0;
      }
    }
    this.setState({ activeNetworkId: networkId, activeChannelName: channelName });
  }

  toggleSidebar() {
    // Prevent collapsing while settings page is open (it needs the sidebar)
    if (this.state.settingsOpen && this.state.sidebarOpen) return;
    this.setState({ sidebarOpen: !this.state.sidebarOpen });
  }

  setSidebarWidth(width: number) {
    const clamped = Math.max(160, Math.min(420, width));
    localStorage.setItem('hyphae:sidebarWidth', String(clamped));
    this.setState({ sidebarWidth: clamped });
  }

  toggleUserlist() {
    this.setState({ userlistOpen: !this.state.userlistOpen });
  }

  openConnectForm() {
    this.setState({ connectFormOpen: true });
  }

  closeConnectForm() {
    this.setState({ connectFormOpen: false });
  }

  setAppMode(mode: AppMode) {
    if (mode !== this.state.appMode) {
      this.setState({ appMode: mode, previousMode: this.state.appMode, settingsOpen: false });
    }
  }

  setNostrPubkey(pubkey: string | null) {
    this.setState({ nostrPubkey: pubkey });
  }

  openProfile(pubkey: string) {
    this.setState({ profilePanelPubkey: pubkey });
  }

  closeProfile() {
    this.setState({ profilePanelPubkey: null });
  }

  openSettings(page?: SettingsPage) {
    let target = page;
    if (!target) {
      // Smart routing based on current mode
      if (this.state.appMode === 'home') target = 'app-general';
      else if (this.state.appMode === 'irc') target = 'irc-appearance';
      else target = this.state.settingsPage;
    }
    this.setState({
      settingsOpen: true,
      settingsPage: target,
    });
  }

  setSettingsPage(page: SettingsPage) {
    this.setState({ settingsPage: page });
  }

  closeSettings() {
    this.setState({ settingsOpen: false });
  }

  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    const settings = { ...this.state.settings, [key]: value };
    localStorage.setItem('hyphae:settings', JSON.stringify(settings));
    this.setState({ settings });
  }

  nostrRegister(password: string, nostrId: string) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId) return;
    socket.send({ type: 'nostr_register', networkId: activeNetworkId, password, nostrId });
  }

  nostrVerify(account: string, code: string) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId) return;
    socket.send({ type: 'nostr_verify', networkId: activeNetworkId, account, code });
  }

  nostrIdentify(account: string, password: string) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId) return;
    socket.send({ type: 'nostr_identify', networkId: activeNetworkId, account, password });
  }

  sendWhois(nick: string) {
    const { activeNetworkId } = this.state;
    if (!activeNetworkId) return;
    socket.send({ type: 'whois', networkId: activeNetworkId, nick });
  }

  // --- Helpers ---

  getActiveNetwork(): IrcNetwork | undefined {
    return this.state.networks.find(n => n.id === this.state.activeNetworkId);
  }

  getActiveChannel(): IrcChannel | undefined {
    const network = this.getActiveNetwork();
    if (!network) return undefined;
    return network.channels.find(c => c.name === this.state.activeChannelName);
  }

  // --- Server event handling ---

  private handleServerEvent(event: ServerEvent) {
    switch (event.type) {
      case 'network:new':
        this.onNetworkNew(event.network);
        break;
      case 'network:status':
        this.onNetworkStatus(event.networkId, event.connected);
        break;
      case 'network:remove':
        this.onNetworkRemove(event.networkId);
        break;
      case 'channel:new':
        this.onChannelNew(event.networkId, event.channel);
        break;
      case 'channel:remove':
        this.onChannelRemove(event.networkId, event.channelName);
        break;
      case 'channel:topic':
        this.onChannelTopic(event.networkId, event.channelName, event.topic, event.setBy);
        break;
      case 'channel:users':
        this.onChannelUsers(event.networkId, event.channelName, event.users);
        break;
      case 'channel:user_join':
        this.onChannelUserJoin(event.networkId, event.channelName, event.user);
        break;
      case 'channel:user_part':
        this.onChannelUserPart(event.networkId, event.channelName, event.nick);
        break;
      case 'channel:user_quit':
        this.onUserQuit(event.networkId, event.nick);
        break;
      case 'channel:user_nick':
        this.onUserNick(event.networkId, event.oldNick, event.newNick);
        break;
      case 'message':
        this.onMessage(event.networkId, event.channelName, event.message);
        break;
      case 'motd':
        this.onMotd(event.networkId, event.text);
        break;
      case 'error':
        this.onError(event.networkId, event.text);
        break;
      case 'nickserv':
        this.onNickServ(event.networkId, event.text);
        break;
      case 'whois':
        this.onWhois(event.networkId, event.nick, event.lines);
        break;
    }
  }

  private findNetwork(id: string): IrcNetwork | undefined {
    return this.state.networks.find(n => n.id === id);
  }

  private findChannel(networkId: string, channelName: string): IrcChannel | undefined {
    const network = this.findNetwork(networkId);
    return network?.channels.find(c => c.name === channelName);
  }

  private onNetworkNew(network: IrcNetwork) {
    this.state.networks.push(network);
    // Auto-select the lobby
    if (network.channels.length > 0) {
      this.state.activeNetworkId = network.id;
      this.state.activeChannelName = network.channels[0].name;
    }
    this.notify();
  }

  private onNetworkStatus(networkId: string, connected: boolean) {
    const network = this.findNetwork(networkId);
    if (network) {
      network.connected = connected;
      this.notify();
    }
  }

  private onNetworkRemove(networkId: string) {
    this.state.networks = this.state.networks.filter(n => n.id !== networkId);
    if (this.state.activeNetworkId === networkId) {
      if (this.state.networks.length > 0) {
        this.state.activeNetworkId = this.state.networks[0].id;
        this.state.activeChannelName = this.state.networks[0].channels[0]?.name || null;
      } else {
        this.state.activeNetworkId = null;
        this.state.activeChannelName = null;
        this.state.connectFormOpen = true;
      }
    }
    this.notify();
  }

  private onChannelNew(networkId: string, channel: IrcChannel) {
    const network = this.findNetwork(networkId);
    if (!network) return;
    // Don't add duplicate
    if (network.channels.find(c => c.name === channel.name)) return;
    network.channels.push(channel);
    // Auto-switch to the new channel
    this.state.activeNetworkId = networkId;
    this.state.activeChannelName = channel.name;
    this.notify();
  }

  private onChannelRemove(networkId: string, channelName: string) {
    const network = this.findNetwork(networkId);
    if (!network) return;
    network.channels = network.channels.filter(c => c.name !== channelName);
    if (this.state.activeChannelName === channelName && this.state.activeNetworkId === networkId) {
      this.state.activeChannelName = network.channels[0]?.name || null;
    }
    this.notify();
  }

  private onChannelTopic(networkId: string, channelName: string, topic: string, setBy?: string) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      channel.topic = topic;
      if (setBy) channel.topicSetBy = setBy;
      this.notify();
    }
  }

  private onChannelUsers(networkId: string, channelName: string, users: Record<string, IrcUser>) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      channel.users = users;
      this.notify();
    }
  }

  private onChannelUserJoin(networkId: string, channelName: string, user: IrcUser) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      channel.users[user.nick] = user;
      this.notify();
    }
  }

  private onChannelUserPart(networkId: string, channelName: string, nick: string) {
    const channel = this.findChannel(networkId, channelName);
    if (channel) {
      delete channel.users[nick];
      this.notify();
    }
  }

  private onUserQuit(networkId: string, nick: string) {
    const network = this.findNetwork(networkId);
    if (!network) return;
    for (const channel of network.channels) {
      delete channel.users[nick];
    }
    this.notify();
  }

  private onUserNick(networkId: string, oldNick: string, newNick: string) {
    const network = this.findNetwork(networkId);
    if (!network) return;
    for (const channel of network.channels) {
      if (channel.users[oldNick]) {
        const user = channel.users[oldNick];
        delete channel.users[oldNick];
        user.nick = newNick;
        channel.users[newNick] = user;
      }
    }
    this.notify();
  }

  private onMessage(networkId: string, channelName: string, message: IrcMessage) {
    const network = this.findNetwork(networkId);
    if (!network) return;

    // Find or create channel (for queries)
    let channel = network.channels.find(c => c.name === channelName);
    if (!channel) {
      // Auto-create query channel
      channel = {
        name: channelName,
        type: 'query' as any,
        topic: '',
        joined: true,
        unread: 0,
        highlight: 0,
        users: {},
        messages: [],
        muted: false,
      };
      network.channels.push(channel);
    }

    channel.messages.push(message);

    // Cap messages at 500
    if (channel.messages.length > 500) {
      channel.messages = channel.messages.slice(-500);
    }

    // Update unread if not the active channel
    const isActive = this.state.activeNetworkId === networkId && this.state.activeChannelName === channelName;
    if (!isActive && !message.self) {
      channel.unread++;
      if (message.highlight) channel.highlight++;
    }

    this.notify();
  }

  private onMotd(networkId: string, text: string) {
    const network = this.findNetwork(networkId);
    if (!network) return;
    const lobby = network.channels.find(c => c.type === 'lobby');
    if (lobby) {
      lobby.messages.push({
        id: `motd_${Date.now()}`,
        time: Date.now(),
        type: 'motd' as any,
        from: '',
        text,
        self: false,
      });
      this.notify();
    }
  }

  private onError(networkId: string, text: string) {
    const network = this.findNetwork(networkId);
    if (!network) return;
    // Push error to active channel or lobby
    const target = this.state.activeChannelName && this.state.activeNetworkId === networkId
      ? this.findChannel(networkId, this.state.activeChannelName)
      : network.channels[0];
    if (target) {
      target.messages.push({
        id: `err_${Date.now()}`,
        time: Date.now(),
        type: 'error' as any,
        from: '',
        text,
        self: false,
      });
      this.notify();
    }
  }

  private onNickServ(networkId: string, text: string) {
    // Push NickServ messages to the lobby
    const network = this.findNetwork(networkId);
    if (!network) return;
    const lobby = network.channels.find(c => c.type === 'lobby');
    if (lobby) {
      lobby.messages.push({
        id: `ns_${Date.now()}`,
        time: Date.now(),
        type: 'notice' as any,
        from: 'NickServ',
        text,
        self: false,
      });
      this.notify();
    }
  }

  private onWhois(networkId: string, nick: string, lines: string[]) {
    const network = this.findNetwork(networkId);
    if (!network) return;
    // Show WHOIS in the active channel or lobby
    const target = (this.state.activeNetworkId === networkId && this.state.activeChannelName)
      ? this.findChannel(networkId, this.state.activeChannelName)
      : network.channels[0];
    if (!target) return;

    const text = `WHOIS ${nick}:\n${lines.join('\n')}`;
    target.messages.push({
      id: `whois_${Date.now()}`,
      time: Date.now(),
      type: 'whois' as any,
      from: '',
      text,
      self: false,
    });
    this.notify();
  }
}

export const store = new Store();

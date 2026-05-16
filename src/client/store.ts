// Client-side state store — Preact Signals architecture
// Every signal change surgically re-renders only the S() subtrees that read it.
// No more store.subscribe(() => mount()) — the entire-app-re-render is dead.

import { signal, computed, batch } from '@preact/signals-core';
import type {
  IrcNetwork, IrcChannel, IrcMessage, IrcUser,
  ServerEvent, ConnectOptions,
} from '../shared/types';
import { socket } from './socket';

// ─── Types ───

export type AppMode = 'home' | 'irc';

export type SettingsPage = 'app-general' | 'irc-appearance' | 'irc-notifications' | 'irc-general';

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

// ─── Signals (granular reactive state) ───

const appMode = signal<AppMode>('home');
const previousMode = signal<AppMode>('home');
const networks = signal<IrcNetwork[]>([]);
const activeNetworkId = signal<string | null>(null);
const activeChannelName = signal<string | null>(null);
const sidebarOpen = signal(true);
const sidebarWidth = signal(
  parseInt(localStorage.getItem('hyphae:sidebarWidth') || '240', 10),
);
const userlistOpen = signal(true);
const connectFormOpen = signal(false);
const settingsOpen = signal(false);
const settingsPage = signal<SettingsPage>('app-general');
const nostrPubkey = signal<string | null>(null);
const profilePanelPubkey = signal<string | null>(null);
const settings = signal<UserSettings>(loadSettings());

// Bumped by nostr profile store to trigger re-renders in profile-reading components
export const profileTick = signal(0);

// ─── Computed ───

const activeNetwork = computed(() => {
  return networks.value.find(n => n.id === activeNetworkId.value);
});

const activeChannel = computed(() => {
  const net = activeNetwork.value;
  if (!net) return undefined;
  return net.channels.find(c => c.name === activeChannelName.value);
});

// ─── Internal helpers ───

function findNetwork(id: string): IrcNetwork | undefined {
  return networks.value.find(n => n.id === id);
}

function findChannel(networkId: string, channelName: string): IrcChannel | undefined {
  return findNetwork(networkId)?.channels.find(c => c.name === channelName);
}

// Mutate-then-touch: since we mutate network objects in-place, we must
// create a new array reference so computed signals re-evaluate.
function touchNetworks() {
  networks.value = [...networks.value];
}

// ─── Server event handling ───

function handleServerEvent(event: ServerEvent) {
  switch (event.type) {
    case 'network:new': {
      const net = event.network;
      batch(() => {
        networks.value = [...networks.value, net];
        if (net.channels.length > 0) {
          activeNetworkId.value = net.id;
          activeChannelName.value = net.channels[0].name;
        }
      });
      break;
    }
    case 'network:status': {
      const net = findNetwork(event.networkId);
      if (net) {
        net.connected = event.connected;
        touchNetworks();
      }
      break;
    }
    case 'network:remove': {
      batch(() => {
        networks.value = networks.value.filter(n => n.id !== event.networkId);
        if (activeNetworkId.value === event.networkId) {
          if (networks.value.length > 0) {
            activeNetworkId.value = networks.value[0].id;
            activeChannelName.value = networks.value[0].channels[0]?.name || null;
          } else {
            activeNetworkId.value = null;
            activeChannelName.value = null;
            connectFormOpen.value = true;
          }
        }
      });
      break;
    }
    case 'channel:new': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      if (net.channels.find(c => c.name === event.channel.name)) break;
      net.channels.push(event.channel);
      batch(() => {
        touchNetworks();
        activeNetworkId.value = event.networkId;
        activeChannelName.value = event.channel.name;
      });
      break;
    }
    case 'channel:remove': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      net.channels = net.channels.filter(c => c.name !== event.channelName);
      batch(() => {
        if (activeChannelName.value === event.channelName && activeNetworkId.value === event.networkId) {
          activeChannelName.value = net.channels[0]?.name || null;
        }
        touchNetworks();
      });
      break;
    }
    case 'channel:topic': {
      const ch = findChannel(event.networkId, event.channelName);
      if (ch) {
        ch.topic = event.topic;
        if (event.setBy) ch.topicSetBy = event.setBy;
        touchNetworks();
      }
      break;
    }
    case 'channel:users': {
      const ch = findChannel(event.networkId, event.channelName);
      if (ch) {
        ch.users = event.users;
        touchNetworks();
      }
      break;
    }
    case 'channel:user_join': {
      const ch = findChannel(event.networkId, event.channelName);
      if (ch) {
        ch.users[event.user.nick] = event.user;
        touchNetworks();
      }
      break;
    }
    case 'channel:user_part': {
      const ch = findChannel(event.networkId, event.channelName);
      if (ch) {
        delete ch.users[event.nick];
        touchNetworks();
      }
      break;
    }
    case 'channel:user_quit': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      for (const ch of net.channels) delete ch.users[event.nick];
      touchNetworks();
      break;
    }
    case 'channel:user_nick': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      for (const ch of net.channels) {
        if (ch.users[event.oldNick]) {
          const user = ch.users[event.oldNick];
          delete ch.users[event.oldNick];
          user.nick = event.newNick;
          ch.users[event.newNick] = user;
        }
      }
      touchNetworks();
      break;
    }
    case 'message': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      let ch = net.channels.find(c => c.name === event.channelName);
      if (!ch) {
        ch = {
          name: event.channelName, type: 'query' as any, topic: '',
          joined: true, unread: 0, highlight: 0, users: {}, messages: [], muted: false,
        };
        net.channels.push(ch);
      }
      ch.messages.push(event.message);
      if (ch.messages.length > 500) ch.messages = ch.messages.slice(-500);
      const isActive = activeNetworkId.value === event.networkId
        && activeChannelName.value === event.channelName;
      if (!isActive && !event.message.self) {
        ch.unread++;
        if (event.message.highlight) ch.highlight++;
      }
      touchNetworks();
      break;
    }
    case 'motd': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      const lobby = net.channels.find(c => c.type === 'lobby');
      if (lobby) {
        lobby.messages.push({
          id: `motd_${Date.now()}`, time: Date.now(), type: 'motd' as any,
          from: '', text: event.text, self: false,
        });
        touchNetworks();
      }
      break;
    }
    case 'error': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      const target = activeChannelName.value && activeNetworkId.value === event.networkId
        ? findChannel(event.networkId, activeChannelName.value) : net.channels[0];
      if (target) {
        target.messages.push({
          id: `err_${Date.now()}`, time: Date.now(), type: 'error' as any,
          from: '', text: event.text, self: false,
        });
        touchNetworks();
      }
      break;
    }
    case 'nickserv': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      const lobby = net.channels.find(c => c.type === 'lobby');
      if (lobby) {
        lobby.messages.push({
          id: `ns_${Date.now()}`, time: Date.now(), type: 'notice' as any,
          from: 'NickServ', text: event.text, self: false,
        });
        touchNetworks();
      }
      break;
    }
    case 'whois': {
      const net = findNetwork(event.networkId);
      if (!net) break;
      const target = (activeNetworkId.value === event.networkId && activeChannelName.value)
        ? findChannel(event.networkId, activeChannelName.value) : net.channels[0];
      if (!target) break;
      target.messages.push({
        id: `whois_${Date.now()}`, time: Date.now(), type: 'whois' as any,
        from: '', text: `WHOIS ${event.nick}:\n${event.lines.join('\n')}`, self: false,
      });
      touchNetworks();
      break;
    }
  }
}

// Wire up WebSocket → signals
socket.onEvent((event) => handleServerEvent(event));

// ─── Public store ───

export const store = {
  // Signals — read .value inside S() for reactive updates
  appMode,
  previousMode,
  networks,
  activeNetworkId,
  activeChannelName,
  sidebarOpen,
  sidebarWidth,
  userlistOpen,
  connectFormOpen,
  settingsOpen,
  settingsPage,
  nostrPubkey,
  profilePanelPubkey,
  settings,

  // Computed signals
  activeNetwork,
  activeChannel,

  // ─── Actions ───

  connect(options: ConnectOptions) {
    socket.send({ type: 'connect', network: options });
    connectFormOpen.value = false;
  },

  disconnect(networkId: string) {
    socket.send({ type: 'disconnect', networkId });
  },

  sendMessage(text: string) {
    const netId = activeNetworkId.value;
    const chanName = activeChannelName.value;
    if (!netId || !chanName) return;
    socket.send({ type: 'message', networkId: netId, target: chanName, text });
  },

  joinChannel(channel: string, key?: string) {
    const netId = activeNetworkId.value;
    if (!netId) return;
    socket.send({ type: 'join', networkId: netId, channel, key });
  },

  partChannel(channel: string) {
    const netId = activeNetworkId.value;
    if (!netId) return;
    socket.send({ type: 'part', networkId: netId, channel });
  },

  setActiveChannel(networkId: string, channelName: string) {
    const network = findNetwork(networkId);
    if (network) {
      const ch = network.channels.find(c => c.name === channelName);
      if (ch) { ch.unread = 0; ch.highlight = 0; }
    }
    batch(() => {
      activeNetworkId.value = networkId;
      activeChannelName.value = channelName;
      touchNetworks();
    });
  },

  toggleSidebar() {
    if (settingsOpen.value && sidebarOpen.value) return;
    sidebarOpen.value = !sidebarOpen.value;
  },

  setSidebarWidth(width: number) {
    const clamped = Math.max(160, Math.min(420, width));
    localStorage.setItem('hyphae:sidebarWidth', String(clamped));
    sidebarWidth.value = clamped;
  },

  toggleUserlist() { userlistOpen.value = !userlistOpen.value; },
  openConnectForm() { connectFormOpen.value = true; },
  closeConnectForm() { connectFormOpen.value = false; },

  setAppMode(mode: AppMode) {
    if (mode !== appMode.value) {
      batch(() => {
        previousMode.value = appMode.value;
        appMode.value = mode;
        settingsOpen.value = false;
      });
    }
  },

  setNostrPubkey(pubkey: string | null) { nostrPubkey.value = pubkey; },
  openProfile(pubkey: string) { profilePanelPubkey.value = pubkey; },
  closeProfile() { profilePanelPubkey.value = null; },

  openSettings(page?: SettingsPage) {
    let target = page;
    if (!target) {
      if (appMode.value === 'home') target = 'app-general';
      else if (appMode.value === 'irc') target = 'irc-appearance';
      else target = settingsPage.value;
    }
    batch(() => { settingsOpen.value = true; settingsPage.value = target!; });
  },

  setSettingsPage(page: SettingsPage) { settingsPage.value = page; },
  closeSettings() { settingsOpen.value = false; },

  updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    const updated = { ...settings.value, [key]: value };
    localStorage.setItem('hyphae:settings', JSON.stringify(updated));
    settings.value = updated;
  },

  nostrRegister(password: string, nostrId: string) {
    const netId = activeNetworkId.value;
    if (!netId) return;
    socket.send({ type: 'nostr_register', networkId: netId, password, nostrId });
  },

  nostrVerify(account: string, code: string) {
    const netId = activeNetworkId.value;
    if (!netId) return;
    socket.send({ type: 'nostr_verify', networkId: netId, account, code });
  },

  nostrIdentify(account: string, password: string) {
    const netId = activeNetworkId.value;
    if (!netId) return;
    socket.send({ type: 'nostr_identify', networkId: netId, account, password });
  },

  sendWhois(nick: string) {
    const netId = activeNetworkId.value;
    if (!netId) return;
    socket.send({ type: 'whois', networkId: netId, nick });
  },
};

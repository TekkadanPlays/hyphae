// Keyboard navigation — inspired by TheLounge keybinds
// Alt+Up/Down: switch channels, Alt+A: jump to unread, auto-focus input

import { store } from './store';

function getAllChannels(): { networkId: string; channelName: string }[] {
  const state = store.getState();
  const result: { networkId: string; channelName: string }[] = [];
  for (const network of state.networks) {
    for (const channel of network.channels) {
      result.push({ networkId: network.id, channelName: channel.name });
    }
  }
  return result;
}

function navigateChannel(direction: number) {
  const state = store.getState();
  const channels = getAllChannels();
  if (channels.length === 0) return;

  let index = channels.findIndex(
    (c) => c.networkId === state.activeNetworkId && c.channelName === state.activeChannelName,
  );

  const length = channels.length;
  index = (((index + direction) % length) + length) % length;

  const target = channels[index];
  store.setActiveChannel(target.networkId, target.channelName);
}

function jumpToUnread() {
  const state = store.getState();
  let target: { networkId: string; channelName: string } | null = null;

  for (const network of state.networks) {
    for (const chan of network.channels) {
      if (chan.highlight > 0) {
        target = { networkId: network.id, channelName: chan.name };
        break;
      }
      if (chan.unread > 0 && !target) {
        target = { networkId: network.id, channelName: chan.name };
      }
    }
    if (target && state.networks.some(n => n.channels.some(c => c.highlight > 0))) break;
  }

  if (target) {
    store.setActiveChannel(target.networkId, target.channelName);
  }
}

const ignoredKeys: Record<number, boolean> = {
  8: true, 9: true, 12: true, 16: true, 17: true, 18: true,
  19: true, 20: true, 27: true, 35: true, 36: true, 37: true,
  38: true, 39: true, 40: true, 45: true, 46: true,
  112: true, 113: true, 114: true, 115: true, 116: true, 117: true,
  118: true, 119: true, 120: true, 121: true, 122: true, 123: true,
  144: true, 145: true, 224: true,
};

export function initKeybinds() {
  document.addEventListener('keydown', (e) => {
    // Alt+Up / Alt+Down: navigate channels
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      navigateChannel(e.key === 'ArrowUp' ? -1 : 1);
      return;
    }

    // Alt+A: jump to first unread/highlighted channel
    if (e.altKey && e.key === 'a') {
      e.preventDefault();
      jumpToUnread();
      return;
    }

    // Escape: close modals
    if (e.key === 'Escape') {
      const state = store.getState();
      if (state.profilePanelPubkey) {
        store.closeProfile();
        return;
      }
      if (state.connectFormOpen && state.networks.length > 0) {
        store.closeConnectForm();
        return;
      }
    }

    // Auto-focus input on typing (like TheLounge)
    if (e.altKey || ignoredKeys[e.which]) return;
    if ((e.ctrlKey || e.metaKey) && e.which !== 86) return; // Allow Ctrl+V

    // Page up/down: scroll messages
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      const chat = document.getElementById('messages-scroll');
      if (chat) chat.focus();
      return;
    }

    const tagName = (e.target as HTMLElement).tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;

    const input = document.querySelector('input[name="message"]') as HTMLInputElement | null;
    if (input) {
      input.focus();
      if (e.key === 'Enter') e.preventDefault();
    }
  });
}

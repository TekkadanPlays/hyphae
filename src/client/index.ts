// Client entry point — boots InfernoJS app and connects WebSocket
import { createElement } from 'inferno-create-element';
import { render } from 'inferno';
import { socket } from './socket';
import { store } from './store';
import { nostr } from './nostr';
import { initKeybinds } from './keybinds';
import { App } from './components/App';
import { p2pStore } from './p2p/p2pStore';

// Connect WebSocket
socket.connect();

// Initialize keyboard shortcuts
initKeybinds();

// Initialize P2P store (generates crypto keys, loads settings)
p2pStore.init();

// Re-render when nostr profiles update
nostr.subscribe(() => mount());

// Mount the app
function mount() {
  const root = document.getElementById('app');
  if (root) {
    render(createElement(App, null), root);
  }
}

// Re-render on state changes from either store
store.subscribe(() => mount());
p2pStore.subscribe(() => mount());

// Initial render
mount();

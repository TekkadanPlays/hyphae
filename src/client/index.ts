// Client entry point — boots InfernoJS app and connects WebSocket
import { createElement } from 'inferno-create-element';
import { render } from 'inferno';
import { socket } from './socket';
import { store } from './store';
import { nostr } from './nostr';
import { initKeybinds } from './keybinds';
import { App } from './components/App';

// Connect WebSocket
socket.connect();

// Initialize keyboard shortcuts
initKeybinds();

// Re-render when nostr profiles update
nostr.subscribe(() => mount());

// Mount the app
function mount() {
  const root = document.getElementById('app');
  if (root) {
    render(createElement(App, null), root);
  }
}

// Re-render on state changes
store.subscribe(() => mount());

// Initial render
mount();

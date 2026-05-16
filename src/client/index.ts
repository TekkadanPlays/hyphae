// Client entry point — boots InfernoJS app and connects WebSocket
// With Preact Signals, we mount ONCE. S() wrappers inside components
// handle all re-renders surgically — no more full-tree re-render on every event.

import { createElement } from 'inferno-create-element';
import { render } from 'inferno';
import { socket } from './socket';
import { profileTick } from './store';
import { nostr } from './nostr';
import { initKeybinds } from './keybinds';
import { App } from './components/App';

// Connect WebSocket
socket.connect();

// Initialize keyboard shortcuts
initKeybinds();

// Bridge nostr profile updates into the signal graph.
// Components that read profileTick.value inside S() will re-render
// when profiles are fetched/updated.
nostr.subscribe(() => { profileTick.value++; });

// Mount once — signals handle all subsequent re-renders
const root = document.getElementById('app');
if (root) {
  render(createElement(App, null), root);
}

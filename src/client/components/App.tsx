import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { p2pStore } from '../p2p/p2pStore';
import { NetworkList } from './NetworkList';
import { ChannelSidebar } from './ChannelSidebar';
import { ChatArea } from './ChatArea';
import { UserList } from './UserList';
import { ConnectForm } from './ConnectForm';
import { ProfilePanel } from './ProfilePanel';
import { SettingsPage } from './SettingsPage';
import { HomePage } from './HomePage';
import { P2PSidebar } from './P2PSidebar';
import { P2PChatArea } from './P2PChatArea';
import { P2PPeerList } from './P2PPeerList';
import { joinRoom } from '../p2p/roomManager';
import { communityRoomNames } from '../p2p/config/communityRooms';

// ─── Shared helpers ───

function ResizeHandle() {
  return createElement('div', {
    className: 'relative flex-shrink-0 z-10',
    style: { width: '0px' },
  },
    createElement('div', {
      className: 'absolute inset-y-0 -left-[3px] w-[6px] cursor-col-resize hover:bg-ring/40 active:bg-ring/60 transition-colors duration-150',
      onMouseDown: (e: MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = store.getState().sidebarWidth;
        const onMove = (ev: MouseEvent) => {
          store.setSidebarWidth(startWidth + (ev.clientX - startX));
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      },
    }),
  );
}

// ─── Top tab bar ───

function ModeTabBar() {
  const state = store.getState();
  const p2p = p2pStore.getState();

  function Tab({ mode, label, icon, badge }: { mode: 'home' | 'irc' | 'p2p'; label: string; icon: string; badge?: number }) {
    const active = state.appMode === mode;
    return createElement('button', {
      className: cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
      ),
      onClick: () => store.setAppMode(mode),
    },
      createElement('span', { className: 'material-symbols-rounded text-base' }, icon),
      label,
      badge && badge > 0
        ? createElement('span', {
            className: 'ml-1 min-w-[18px] h-[18px] rounded-full bg-online text-white text-[10px] font-bold flex items-center justify-center px-1',
          }, String(badge))
        : null,
    );
  }

  const connectedCount = state.networks.filter((n: any) => n.connected).length;
  const peerCount = p2p.roomId ? p2p.peerList.length : 0;

  return createElement('div', {
    className: 'flex items-center gap-1 px-3 py-1.5 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0',
  },
    createElement(Tab, { mode: 'home', label: 'Home', icon: 'home' }),
    createElement(Tab, { mode: 'irc', label: 'IRC', icon: 'dns', badge: connectedCount }),
    createElement(Tab, { mode: 'p2p', label: 'P2P Chat', icon: 'hub', badge: peerCount }),
  );
}

// ─── IRC content area ───

function IrcContent() {
  const state = store.getState();

  // No networks yet — show inline welcome
  if (state.networks.length === 0 && !state.connectFormOpen) {
    return createElement('div', {
      className: 'flex flex-1 min-w-0 items-center justify-center bg-surface-low',
    },
      createElement('div', { className: 'text-center max-w-sm px-6' },
        createElement('span', { className: 'material-symbols-rounded text-5xl text-muted-foreground/30 mb-4 block' }, 'dns'),
        createElement('h2', { className: 'text-lg font-semibold text-foreground mb-2' }, 'No IRC servers'),
        createElement('p', { className: 'text-sm text-muted-foreground mb-4' },
          'Connect to an IRC server to start chatting. Click the + button in the sidebar or use the button below.',
        ),
        createElement('button', {
          className: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer',
          onClick: () => store.openConnectForm(),
        },
          createElement('span', { className: 'material-symbols-rounded text-base' }, 'add'),
          'Connect to Server',
        ),
      ),
    );
  }

  // Connect form open inline
  if (state.connectFormOpen) {
    return createElement('div', {
      className: 'flex flex-1 min-w-0 items-center justify-center bg-surface-low',
    },
      createElement(ConnectForm, null),
    );
  }

  // Normal IRC layout
  return createElement('div', { className: 'flex flex-1 min-w-0 overflow-hidden' },
    state.sidebarOpen ? createElement(ChannelSidebar, null) : null,
    state.sidebarOpen ? createElement(ResizeHandle, null) : null,
    createElement('div', {
      className: 'flex flex-1 min-w-0 flex-col bg-surface-low',
    },
      createElement(ChatArea, null),
    ),
    state.userlistOpen && state.activeChannelName?.startsWith('#')
      ? createElement(UserList, null)
      : null,
  );
}

// ─── P2P content area ───

let _p2pJoinInput = '';

function P2PLander() {
  const p2p = p2pStore.getState();

  return createElement('div', {
    className: 'flex flex-1 min-w-0 items-start justify-center bg-surface-low overflow-y-auto',
  },
    createElement('div', { className: 'max-w-lg w-full px-6 py-10' },
      createElement('h2', { className: 'text-lg font-semibold text-foreground mb-1' }, 'P2P Chat'),
      createElement('p', { className: 'text-sm text-muted-foreground mb-6' },
        'Join or create a room to start chatting peer-to-peer. No server required.',
      ),

      // Join by name
      createElement('form', {
        className: 'flex gap-2 mb-6',
        onSubmit: (e: Event) => {
          e.preventDefault();
          const name = _p2pJoinInput.trim();
          if (name) {
            joinRoom(name);
            p2pStore.addJoinedRoom(name, false);
            _p2pJoinInput = '';
          }
        },
      },
        createElement('input', {
          type: 'text',
          className: 'flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
          placeholder: 'Enter room name...',
          oninput: (e: Event) => { _p2pJoinInput = (e.target as HTMLInputElement).value; },
        }),
        createElement('button', {
          type: 'submit',
          className: 'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-online text-white hover:bg-online/90 transition-colors cursor-pointer',
        },
          createElement('span', { className: 'material-symbols-rounded text-base' }, 'add'),
          'Join',
        ),
      ),

      // Community rooms
      createElement('h3', { className: 'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2' }, 'Community Rooms'),
      createElement('div', { className: 'flex flex-col gap-1' },
        ...communityRoomNames.map(name =>
          createElement('button', {
            key: name,
            className: cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-left',
              p2p.roomId === name
                ? 'bg-online/10 text-online font-medium'
                : 'text-on-surface-variant hover:bg-accent/50 hover:text-foreground',
            ),
            onClick: () => {
              joinRoom(name);
              p2pStore.addJoinedRoom(name, false);
            },
          },
            createElement('span', { className: 'material-symbols-rounded text-base flex-shrink-0' }, 'tag'),
            name,
          ),
        ),
      ),
    ),
  );
}

function P2PContent() {
  const state = store.getState();
  const p2p = p2pStore.getState();

  // No active room — show lander with join/browse
  if (!p2p.roomId) {
    return createElement('div', { className: 'flex flex-1 min-w-0 overflow-hidden' },
      state.sidebarOpen ? createElement(P2PSidebar, null) : null,
      state.sidebarOpen ? createElement(ResizeHandle, null) : null,
      createElement(P2PLander, null),
    );
  }

  return createElement('div', { className: 'flex flex-1 min-w-0 overflow-hidden' },
    state.sidebarOpen ? createElement(P2PSidebar, null) : null,
    state.sidebarOpen ? createElement(ResizeHandle, null) : null,
    createElement('div', {
      className: 'flex flex-1 min-w-0 flex-col bg-surface-low',
    },
      createElement(P2PChatArea, null),
    ),
    createElement(P2PPeerList, null),
  );
}

// ─── Main App ───

export function App() {
  const state = store.getState();
  const isHome = state.appMode === 'home';
  const isIrc = state.appMode === 'irc';
  const isP2P = state.appMode === 'p2p';

  return createElement('div', {
    className: 'flex flex-col h-screen w-screen overflow-hidden bg-background',
  },
    // Top tab bar — always visible
    createElement(ModeTabBar, null),

    // Main content row
    createElement('div', {
      className: 'flex flex-1 min-h-0 overflow-hidden',
    },
      // Orb sidebar — always visible
      createElement(NetworkList, null),

      // Settings page (full-width, replaces content area)
      state.settingsOpen
        ? createElement(SettingsPage, { key: 'settings' })
        : null,

      // Home
      !state.settingsOpen && isHome
        ? createElement(HomePage, { key: 'home' })
        : null,

      // IRC
      !state.settingsOpen && isIrc
        ? createElement(IrcContent, { key: 'irc' })
        : null,

      // P2P
      !state.settingsOpen && isP2P
        ? createElement(P2PContent, { key: 'p2p' })
        : null,
    ),

    // Overlays
    state.profilePanelPubkey
      ? createElement(ProfilePanel, {
          pubkey: state.profilePanelPubkey,
          onClose: () => store.closeProfile(),
        })
      : null,
  );
}

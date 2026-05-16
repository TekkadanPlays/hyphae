import { createElement } from 'inferno-create-element';
import { S } from 'blazecn';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { NetworkList } from './NetworkList';
import { ChannelSidebar } from './ChannelSidebar';
import { ChatArea } from './ChatArea';
import { UserList } from './UserList';
import { ConnectForm } from './ConnectForm';
import { ProfilePanel } from './ProfilePanel';
import { SettingsPage } from './SettingsPage';
import { HomePage } from './HomePage';

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
        const startWidth = store.sidebarWidth.value;
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
  return S(() => {
    const mode = store.appMode.value;
    const nets = store.networks.value;

    function Tab({ tabMode, label, icon, badge }: { tabMode: 'home' | 'irc'; label: string; icon: string; badge?: number }) {
      const active = mode === tabMode;
      return createElement('button', {
        className: cn(
          'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
        ),
        onClick: () => store.setAppMode(tabMode),
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

    const connectedCount = nets.filter((n: any) => n.connected).length;

    return createElement('div', {
      className: 'flex items-center gap-1 px-3 py-1.5 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0',
    },
      createElement(Tab, { tabMode: 'home', label: 'Home', icon: 'home' }),
      createElement(Tab, { tabMode: 'irc', label: 'IRC', icon: 'dns', badge: connectedCount }),
    );
  });
}

// ─── IRC content area ───

function IrcContent() {
  return S(() => {
    const nets = store.networks.value;
    const formOpen = store.connectFormOpen.value;
    const sbOpen = store.sidebarOpen.value;
    const ulOpen = store.userlistOpen.value;
    const chanName = store.activeChannelName.value;

    // No networks yet — show inline welcome
    if (nets.length === 0 && !formOpen) {
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
    if (formOpen) {
      return createElement('div', {
        className: 'flex flex-1 min-w-0 items-center justify-center bg-surface-low',
      },
        createElement(ConnectForm, null),
      );
    }

    // Normal IRC layout
    return createElement('div', { className: 'flex flex-1 min-w-0 overflow-hidden' },
      sbOpen ? createElement(ChannelSidebar, null) : null,
      sbOpen ? createElement(ResizeHandle, null) : null,
      createElement('div', {
        className: 'flex flex-1 min-w-0 flex-col bg-surface-low',
      },
        createElement(ChatArea, null),
      ),
      ulOpen && chanName?.startsWith('#')
        ? createElement(UserList, null)
        : null,
    );
  });
}

// ─── Main App ───

export function App() {
  return S(() => {
    const mode = store.appMode.value;
    const isHome = mode === 'home';
    const isIrc = mode === 'irc';
    const isSettingsOpen = store.settingsOpen.value;
    const panelPubkey = store.profilePanelPubkey.value;

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
        isSettingsOpen
          ? createElement(SettingsPage, { key: 'settings' })
          : null,

        // Home
        !isSettingsOpen && isHome
          ? createElement(HomePage, { key: 'home' })
          : null,

        // IRC
        !isSettingsOpen && isIrc
          ? createElement(IrcContent, { key: 'irc' })
          : null,
      ),

      // Overlays
      panelPubkey
        ? createElement(ProfilePanel, {
            pubkey: panelPubkey,
            onClose: () => store.closeProfile(),
          })
        : null,
    );
  });
}

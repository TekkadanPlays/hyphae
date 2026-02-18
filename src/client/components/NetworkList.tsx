import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { nostr } from '../nostr';
import { p2pStore } from '../p2p/p2pStore';
import { Separator } from 'blazecn/Separator';

// Reusable orb wrapper
function Orb({ pill, onClick, title, children }: {
  pill?: 'full' | 'dot' | 'hover'; onClick?: () => void; title?: string; children?: any;
}) {
  const pillH = pill === 'full' ? 'h-8' : pill === 'dot' ? 'h-2' : 'h-0 group-hover:h-4';
  return createElement('div', {
    className: 'relative w-14 h-14 flex-shrink-0 flex items-center justify-center group cursor-pointer',
    onClick, title,
  },
    createElement('div', {
      className: cn('absolute left-0 w-1 rounded-r-full bg-foreground transition-all duration-200', pillH),
    }),
    children,
  );
}

function OrbIcon({ active, className, children }: { active?: boolean; className?: string; children?: any }) {
  return createElement('div', {
    className: cn(
      'size-[42px] rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200',
      active ? 'rounded-2xl' : 'hover:rounded-2xl',
      className,
    ),
  }, children);
}

function Badge({ count, color }: { count: number; color?: string }) {
  if (count <= 0) return null;
  return createElement('div', {
    className: cn(
      'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1',
      color || 'bg-primary',
    ),
  }, count > 99 ? '99+' : String(count));
}

function SectionLabel({ text }: { text: string }) {
  return createElement('div', {
    className: 'w-full text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 text-center mt-1 mb-0.5 select-none',
  }, text);
}

export function NetworkList() {
  const state = store.getState();
  const p2p = p2pStore.getState();
  const isHome = state.appMode === 'home';
  const isIrc = state.appMode === 'irc';
  const isP2P = state.appMode === 'p2p';

  // Profile image from Nostr
  const profile = state.nostrPubkey ? nostr.getProfile(state.nostrPubkey) : null;
  const displayName = profile?.displayName || profile?.name || null;

  return createElement('div', {
    className: 'flex flex-col w-[72px] flex-shrink-0 bg-background border-r border-border/30',
  },
    createElement('div', {
      className: 'flex flex-col items-center flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-3 pb-3 gap-1',
    },

      // ─── Profile orb (Home) ───
      createElement(Orb, {
        pill: isHome ? 'full' : 'hover',
        onClick: () => store.setAppMode('home'),
        title: displayName ? `${displayName} — Home` : 'Home',
      },
        profile?.picture
          ? createElement('img', {
              src: profile.picture,
              className: cn(
                'size-[42px] rounded-full object-cover transition-all duration-200',
                isHome ? 'rounded-2xl ring-2 ring-primary' : 'hover:rounded-2xl',
              ),
              onError: (e: any) => { e.target.style.display = 'none'; },
            })
          : createElement(OrbIcon, {
              active: isHome,
              className: isHome
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-variant text-on-surface-variant hover:bg-primary/80 hover:text-primary-foreground',
            },
              state.nostrPubkey
                ? (displayName ? displayName.charAt(0).toUpperCase() : '?')
                : createElement('span', { className: 'material-symbols-rounded text-lg' }, 'person'),
            ),
        // Online indicator
        state.nostrPubkey
          ? createElement('div', {
              className: 'absolute bottom-1 right-1 size-3 rounded-full border-2 border-background bg-online',
            })
          : null,
      ),

      // ─── P2P hub orb (right below profile) ───
      createElement(Orb, {
        pill: isP2P && !p2p.roomId ? 'full' : isP2P ? 'dot' : 'hover',
        onClick: () => store.setAppMode('p2p'),
        title: 'P2P Chat',
      },
        createElement(OrbIcon, {
          active: isP2P,
          className: cn(
            isP2P
              ? 'bg-online text-white'
              : 'bg-surface-variant text-on-surface-variant hover:bg-online/80 hover:text-white',
          ),
        },
          createElement('span', { className: 'material-symbols-rounded text-xl' }, 'hub'),
        ),
        p2p.roomId && p2p.peerList.length > 0
          ? createElement(Badge, { count: p2p.peerList.length, color: 'bg-online' })
          : null,
      ),

      createElement(Separator, { className: 'w-8 my-1 flex-shrink-0 mx-auto' }),

      // ─── IRC section ───
      state.networks.length > 0
        ? createElement(SectionLabel, { text: 'IRC' })
        : null,

      ...state.networks.map(network => {
        const isActive = isIrc && network.id === state.activeNetworkId;
        const totalUnread = network.channels.reduce((sum: number, ch: any) => sum + ch.unread, 0);
        const totalHighlight = network.channels.reduce((sum: number, ch: any) => sum + ch.highlight, 0);
        const initial = network.name.charAt(0).toUpperCase();

        return createElement(Orb, {
          key: network.id,
          pill: isActive ? 'full' : totalUnread > 0 ? 'dot' : 'hover',
          title: `${network.name} (${network.host})`,
          onClick: () => {
            if (!isIrc) store.setAppMode('irc');
            if (isActive && state.sidebarOpen) {
              store.toggleSidebar();
            } else {
              const firstChan = network.channels[0];
              if (firstChan) store.setActiveChannel(network.id, firstChan.name);
              if (!state.sidebarOpen) store.toggleSidebar();
            }
          },
        },
          createElement(OrbIcon, {
            active: isActive,
            className: cn(
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-variant text-on-surface-variant hover:bg-primary/80 hover:text-primary-foreground',
              !network.connected && 'opacity-50',
            ),
          }, initial),
          createElement('div', {
            className: cn(
              'absolute bottom-1 right-1 size-3 rounded-full border-2 border-background',
              network.connected ? 'bg-online' : 'bg-destructive',
            ),
          }),
          totalHighlight > 0
            ? createElement(Badge, { count: totalHighlight, color: 'bg-destructive' })
            : createElement(Badge, { count: totalUnread }),
        );
      }),

      // Add IRC server button
      createElement(Orb, {
        pill: 'hover',
        onClick: () => {
          if (!isIrc) store.setAppMode('irc');
          store.openConnectForm();
        },
        title: 'Add IRC server',
      },
        createElement(OrbIcon, {
          className: 'bg-surface-variant text-online hover:bg-online hover:text-white',
        },
          createElement('span', { className: 'material-symbols-rounded text-xl' }, 'add'),
        ),
      ),

      // ─── P2P rooms section ───
      p2p.joinedRooms.length > 0
        ? createElement(Separator, { className: 'w-8 my-1 flex-shrink-0 mx-auto' })
        : null,

      p2p.joinedRooms.length > 0
        ? createElement(SectionLabel, { text: 'Rooms' })
        : null,

      ...p2p.joinedRooms.map(room => {
        const isActive = isP2P && p2p.roomId === room.name;
        const initial = room.name.charAt(0).toUpperCase();
        return createElement(Orb, {
          key: room.id,
          pill: isActive ? 'full' : 'hover',
          title: room.name + (room.isPrivate ? ' (private)' : ''),
          onClick: () => {
            if (!isP2P) store.setAppMode('p2p');
            p2pStore.setActiveRoom(room.name);
          },
        },
          createElement(OrbIcon, {
            active: isActive,
            className: isActive
              ? 'bg-online text-white'
              : 'bg-surface-variant text-on-surface-variant hover:bg-online/80 hover:text-white',
          },
            room.isPrivate
              ? createElement('span', { className: 'material-symbols-rounded text-lg' }, 'lock')
              : initial,
          ),
          isActive && p2p.peerList.length > 0
            ? createElement(Badge, { count: p2p.peerList.length, color: 'bg-online' })
            : null,
        );
      }),
    ),

    // ─── Settings orb (pinned bottom) ───
    createElement(Separator, { className: 'w-8 mx-auto' }),
    createElement('div', {
      className: 'flex flex-col items-center py-2',
    },
      createElement(Orb, {
        pill: state.settingsOpen ? 'full' : 'hover',
        onClick: () => state.settingsOpen ? store.closeSettings() : store.openSettings(),
        title: 'Settings',
      },
        createElement(OrbIcon, {
          active: state.settingsOpen,
          className: state.settingsOpen
            ? 'bg-primary text-primary-foreground'
            : 'bg-surface-variant text-on-surface-variant hover:bg-surface-variant hover:text-foreground',
        },
          createElement('span', { className: 'material-symbols-rounded text-xl' }, 'settings'),
        ),
      ),
    ),
  );
}

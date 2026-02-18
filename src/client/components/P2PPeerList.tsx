import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { p2pStore } from '../p2p/p2pStore';
import { PeerVerificationState } from '../p2p/models/chat';
import { getDisplayUsername } from '../p2p/lib/getPeerName';

function VerificationBadge({ state }: { state: PeerVerificationState }) {
  if (state === PeerVerificationState.VERIFIED) {
    return createElement('span', {
      className: 'material-symbols-rounded text-sm text-online',
      title: 'Verified',
    }, 'verified');
  }
  if (state === PeerVerificationState.VERIFYING) {
    return createElement('span', {
      className: 'material-symbols-rounded text-sm text-idle animate-pulse',
      title: 'Verifying...',
    }, 'pending');
  }
  return createElement('span', {
    className: 'material-symbols-rounded text-sm text-muted-foreground',
    title: 'Unverified',
  }, 'help');
}

export function P2PPeerList() {
  const p2p = p2pStore.getState();

  if (!p2p.roomId) return null;

  return createElement('div', {
    className: 'w-[220px] flex-shrink-0 bg-surface-low overflow-y-auto border-l border-border',
  },
    // Header
    createElement('div', {
      className: 'flex items-center gap-1.5 px-4 pt-3 pb-1',
    },
      createElement('span', { className: 'material-symbols-rounded text-sm text-primary' }, 'hub'),
      createElement('span', {
        className: 'text-[11px] font-medium text-on-surface-variant',
      }, `${p2p.peerList.length} peer${p2p.peerList.length !== 1 ? 's' : ''} connected`),
    ),

    // Self
    p2p.userSettings
      ? createElement('div', { className: 'mb-1' },
          createElement('div', {
            className: 'px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
          }, 'You'),
          createElement('div', {
            className: 'flex items-center gap-2 px-3 py-1 mx-2 rounded-lg bg-accent/20',
          },
            createElement('div', {
              className: 'size-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary flex-shrink-0',
            }, (p2p.userSettings.customUsername || 'U').charAt(0).toUpperCase()),
            createElement('span', {
              className: 'text-sm truncate text-on-surface',
            }, p2p.userSettings.customUsername || 'Anonymous'),
          ),
        )
      : null,

    // Peers
    p2p.peerList.length > 0
      ? createElement('div', { className: 'mb-1' },
          createElement('div', {
            className: 'px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
          }, `Peers — ${p2p.peerList.length}`),
          ...p2p.peerList.map(peer => {
            const displayName = peer.customUsername || getDisplayUsername(
              peer.userId,
              p2p.peerList,
              p2p.userSettings?.userId,
              p2p.userSettings?.customUsername,
            );

            return createElement('div', {
              key: peer.peerId,
              className: cn(
                'flex items-center gap-2 px-3 py-1 mx-2 rounded-lg cursor-pointer transition-colors',
                'hover:bg-accent/40',
              ),
              onClick: () => p2pStore.openDm(peer.peerId),
              title: `Click to DM ${displayName}`,
            },
              createElement('div', {
                className: 'size-7 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-semibold text-on-surface-variant flex-shrink-0',
              }, displayName.charAt(0).toUpperCase()),
              createElement('span', {
                className: 'text-sm truncate flex-1 text-on-surface',
              }, displayName),
              createElement(VerificationBadge, { state: peer.verificationState }),
              // Unread DM badge
              p2p.dmUnreadCounts[peer.peerId]
                ? createElement('span', {
                    className: 'min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0',
                  }, String(p2p.dmUnreadCounts[peer.peerId]))
                : null,
            );
          }),
        )
      : null,

    createElement('div', { className: 'h-4' }),
  );
}

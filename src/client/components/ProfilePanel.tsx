import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { nostr } from '../nostr';

export function ProfilePanel({ pubkey, onClose }: { pubkey: string; onClose: () => void }) {
  const profile = nostr.getProfile(pubkey);
  const shortPubkey = pubkey.slice(0, 8) + '…' + pubkey.slice(-8);

  // Trigger fetch if we don't have it yet
  if (!profile) {
    nostr.fetchProfile(pubkey);
  }

  return createElement('div', {
    className: 'fixed inset-0 bg-black/60 flex items-center justify-center z-50',
    onClick: (e: any) => { if (e.target === e.currentTarget) onClose(); },
  },
    createElement('div', {
      className: 'w-full max-w-md bg-surface-high rounded-2xl border border-border shadow-2xl overflow-hidden',
    },
      // Banner
      profile?.banner
        ? createElement('div', {
            className: 'h-32 bg-cover bg-center',
            style: { backgroundImage: `url(${profile.banner})` },
          })
        : createElement('div', {
            className: 'h-32 bg-gradient-to-br from-primary/30 to-primary/10',
          }),

      // Avatar + name area
      createElement('div', { className: 'px-6 -mt-12 relative' },
        // Avatar
        createElement('div', {
          className: 'size-24 rounded-full border-4 border-surface-high overflow-hidden bg-surface-variant flex items-center justify-center',
        },
          profile?.picture
            ? createElement('img', {
                src: profile.picture,
                alt: profile.displayName || profile.name || 'Avatar',
                className: 'size-full object-cover',
                onError: (e: any) => { e.target.style.display = 'none'; },
              })
            : createElement('span', {
                className: 'text-3xl font-bold text-on-surface-variant',
              }, (profile?.name || pubkey).charAt(0).toUpperCase()),
        ),
      ),

      // Profile info
      createElement('div', { className: 'px-6 pt-3 pb-6 space-y-3' },
        // Display name + name
        createElement('div', null,
          profile?.displayName
            ? createElement('h2', {
                className: 'text-xl font-bold text-on-surface',
              }, profile.displayName)
            : null,
          profile?.name
            ? createElement('p', {
                className: cn(
                  'text-sm',
                  profile?.displayName ? 'text-muted-foreground' : 'text-lg font-semibold text-on-surface',
                ),
              }, profile.displayName ? `@${profile.name}` : profile.name)
            : null,
          !profile?.displayName && !profile?.name
            ? createElement('h2', {
                className: 'text-lg font-semibold text-on-surface',
              }, shortPubkey)
            : null,
        ),

        // NIP-05 verified
        profile?.nip05
          ? createElement('div', {
              className: 'flex items-center gap-1.5 text-sm',
            },
              createElement('span', {
                className: 'material-symbols-rounded text-base text-primary',
              }, 'verified'),
              createElement('span', { className: 'text-primary' }, profile.nip05),
            )
          : null,

        // Pubkey
        createElement('div', {
          className: 'flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-variant/50 text-xs font-mono text-muted-foreground cursor-pointer hover:bg-surface-variant transition-colors',
          title: 'Click to copy pubkey',
          onClick: () => {
            navigator.clipboard?.writeText(pubkey);
          },
        },
          createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0' }, 'key'),
          createElement('span', { className: 'truncate' }, pubkey),
          createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0 ml-auto' }, 'content_copy'),
        ),

        // About
        profile?.about
          ? createElement('div', { className: 'space-y-1' },
              createElement('p', {
                className: 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
              }, 'About'),
              createElement('p', {
                className: 'text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words',
              }, profile.about),
            )
          : null,

        // Lightning address
        profile?.lud16
          ? createElement('div', { className: 'flex flex-wrap gap-3' },
              createElement('div', {
                className: 'flex items-center gap-1 text-sm text-idle',
              },
                createElement('span', null, '⚡'),
                createElement('span', null, profile.lud16),
              ),
            )
          : null,

        // Loading state
        !profile
          ? createElement('div', {
              className: 'flex items-center justify-center py-4 text-muted-foreground',
            },
              createElement('span', {
                className: 'material-symbols-rounded text-xl animate-spin mr-2',
              }, 'progress_activity'),
              createElement('span', { className: 'text-sm' }, 'Loading profile…'),
            )
          : null,

        // Close button
        createElement('button', {
          className: 'w-full mt-2 px-4 py-2.5 rounded-lg border border-border text-sm text-on-surface-variant font-medium hover:bg-accent/30 transition-colors cursor-pointer',
          onClick: onClose,
        }, 'Close'),
      ),
    ),
  );
}

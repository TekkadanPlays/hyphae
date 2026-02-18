import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { nostr } from '../nostr';
import { Separator } from 'blazecn/Separator';

// Track which home tab is active
let _homeTab: 'lander' | 'profile' = 'lander';

// ─── Lander tab ───

function FeatureCard({ icon, title, description, action, actionLabel, color }: {
  icon: string; title: string; description: string; action: () => void; actionLabel: string; color: string;
}) {
  return createElement('div', {
    className: 'flex flex-col rounded-xl border border-border/50 bg-surface-high/50 p-5 hover:border-border transition-colors',
  },
    createElement('div', {
      className: `size-10 rounded-lg flex items-center justify-center mb-3 ${color}`,
    },
      createElement('span', { className: 'material-symbols-rounded text-xl' }, icon),
    ),
    createElement('h3', { className: 'text-base font-semibold text-foreground mb-1' }, title),
    createElement('p', { className: 'text-sm text-muted-foreground leading-relaxed mb-4 flex-1' }, description),
    createElement('button', {
      className: `inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${color} hover:opacity-90`,
      onClick: action,
    },
      createElement('span', { className: 'material-symbols-rounded text-base' }, 'arrow_forward'),
      actionLabel,
    ),
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return createElement('div', {
    className: 'flex items-center gap-3 rounded-lg border border-border/30 bg-surface-high/30 px-4 py-3',
  },
    createElement('span', { className: 'material-symbols-rounded text-lg text-muted-foreground' }, icon),
    createElement('div', null,
      createElement('p', { className: 'text-xs text-muted-foreground' }, label),
      createElement('p', { className: 'text-sm font-medium text-foreground' }, value),
    ),
  );
}

function LanderContent() {
  const state = store.getState();
  const profile = state.nostrPubkey ? nostr.getProfile(state.nostrPubkey) : null;
  const displayName = profile?.displayName || profile?.name || null;

  const connectedNetworks = state.networks.filter(n => n.connected).length;
  const totalChannels = state.networks.reduce((sum, n) => sum + n.channels.length, 0);

  return createElement('div', { className: 'max-w-2xl mx-auto px-6 py-10' },
    // Welcome header
    createElement('div', { className: 'mb-8' },
      createElement('h1', { className: 'text-2xl font-bold text-foreground mb-1' }, 'Hyphae'),
      createElement('p', { className: 'text-[10px] text-muted-foreground/30 font-mono select-none mb-3' }, '𓍊𓋼𓆏𓋼𓍊'),
      displayName
        ? createElement('p', { className: 'text-muted-foreground' },
            'Hey, ',
            createElement('span', { className: 'text-foreground font-medium' }, displayName),
            '! What would you like to do?',
          )
        : createElement('p', { className: 'text-muted-foreground' },
            'IRC chat with Nostr identity, woven together.',
          ),
    ),

    // Feature cards
    createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8' },
      createElement(FeatureCard, {
        icon: 'dns',
        title: 'IRC Chat',
        description: 'Connect to IRC servers, join channels, and chat with communities. Supports SASL, NickServ, and Nostr identity.',
        action: () => store.setAppMode('irc'),
        actionLabel: 'Open IRC',
        color: 'bg-primary/10 text-primary',
      }),
    ),

    // Quick stats
    connectedNetworks > 0
      ? createElement('div', { className: 'mb-8' },
          createElement(Separator, { className: 'mb-4' }),
          createElement('h2', { className: 'text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3' }, 'Active Sessions'),
          createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3' },
            createElement(StatCard, { icon: 'dns', label: 'IRC Networks', value: `${connectedNetworks} connected` }),
            createElement(StatCard, { icon: 'tag', label: 'Channels', value: `${totalChannels} joined` }),
          ),
        )
      : null,

    // Footer
    createElement('div', { className: 'text-center' },
      createElement('p', { className: 'text-[10px] text-muted-foreground/25 font-mono select-none' },
        '⋆˙𓍊₊ ⊹˚ 𖥧𓋼˖°𓆑˙⋆',
      ),
    ),
  );
}

// ─── Profile tab ───

function ProfileContent() {
  const state = store.getState();
  const profile = state.nostrPubkey ? nostr.getProfile(state.nostrPubkey) : null;
  const displayName = profile?.displayName || profile?.name || null;

  if (!state.nostrPubkey) {
    // Not signed in — prompt
    return createElement('div', { className: 'max-w-md mx-auto px-6 py-16 text-center' },
      createElement('div', {
        className: 'size-20 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-6',
      },
        createElement('span', { className: 'material-symbols-rounded text-4xl text-muted-foreground' }, 'person'),
      ),
      createElement('h2', { className: 'text-xl font-semibold text-foreground mb-2' }, 'Sign in with Nostr'),
      createElement('p', { className: 'text-sm text-muted-foreground mb-6 leading-relaxed' },
        'Connect a Nostr identity (NIP-07) to use your profile across IRC and P2P. Your keys stay in your browser extension.',
      ),
      createElement('button', {
        className: cn(
          'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer',
          (window as any).nostr
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-surface-variant text-muted-foreground cursor-not-allowed',
        ),
        onClick: async () => {
          try {
            if ((window as any).nostr) {
              const pubkey = await (window as any).nostr.getPublicKey();
              store.setNostrPubkey(pubkey);
              nostr.fetchProfile(pubkey);
            }
          } catch {}
        },
        disabled: !(window as any).nostr,
      },
        createElement('span', { className: 'material-symbols-rounded text-lg' }, 'key'),
        (window as any).nostr ? 'Connect Nostr Extension' : 'No Nostr extension detected',
      ),
      createElement('p', { className: 'text-xs text-muted-foreground/50 mt-4' },
        'Supported extensions: nos2x, Alby, Flamingo, etc.',
      ),
    );
  }

  // Signed in — show profile
  return createElement('div', { className: 'max-w-md mx-auto px-6 py-10' },
    // Avatar + name
    createElement('div', { className: 'flex flex-col items-center mb-8' },
      profile?.picture
        ? createElement('img', {
            src: profile.picture,
            className: 'size-20 rounded-full object-cover mb-4 ring-2 ring-primary/30',
            onError: (e: any) => { e.target.style.display = 'none'; },
          })
        : createElement('div', {
            className: 'size-20 rounded-full bg-surface-variant flex items-center justify-center mb-4 text-2xl font-bold text-on-surface-variant',
          }, displayName ? displayName.charAt(0).toUpperCase() : '?'),
      createElement('h2', { className: 'text-lg font-semibold text-foreground' }, displayName || 'Anonymous'),
      profile?.nip05
        ? createElement('p', { className: 'text-sm text-primary mt-0.5' }, profile.nip05)
        : null,
      createElement('div', { className: 'flex items-center gap-1.5 mt-1' },
        createElement('div', { className: 'size-2 rounded-full bg-online' }),
        createElement('span', { className: 'text-xs text-muted-foreground' }, 'Connected'),
      ),
    ),

    // Pubkey
    createElement('div', {
      className: 'rounded-lg border border-border/50 bg-surface-high/30 p-3 mb-4 cursor-pointer hover:bg-surface-high/50 transition-colors',
      title: 'Click to copy',
      onClick: () => navigator.clipboard?.writeText(state.nostrPubkey!),
    },
      createElement('p', { className: 'text-[10px] text-muted-foreground uppercase tracking-wider mb-1' }, 'Public Key'),
      createElement('p', { className: 'text-xs text-foreground font-mono break-all leading-relaxed' }, state.nostrPubkey),
    ),

    // Bio
    profile?.about
      ? createElement('div', { className: 'rounded-lg border border-border/50 bg-surface-high/30 p-3 mb-4' },
          createElement('p', { className: 'text-[10px] text-muted-foreground uppercase tracking-wider mb-1' }, 'About'),
          createElement('p', { className: 'text-sm text-foreground leading-relaxed' }, profile.about),
        )
      : null,

    createElement('p', { className: 'text-[10px] text-muted-foreground/25 font-mono select-none text-center mt-8' },
      '𓍊𓋼𓆏𓋼𓍊',
    ),
  );
}

// ─── Home sidebar + content ───

function HomeSidebar() {
  const state = store.getState();
  const sidebarWidth = state.sidebarWidth;

  function NavBtn({ id, icon, label }: { id: 'lander' | 'profile'; icon: string; label: string }) {
    const active = _homeTab === id;
    return createElement('button', {
      className: cn(
        'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
        active
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
      ),
      onClick: () => { _homeTab = id; store['notify'](); },
    },
      createElement('span', { className: 'material-symbols-rounded text-base flex-shrink-0' }, icon),
      label,
    );
  }

  return createElement('div', {
    className: 'flex-shrink-0 border-r border-border overflow-y-auto bg-surface-high flex flex-col',
    style: { width: `${sidebarWidth}px` },
  },
    createElement('div', { className: 'flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2' },
      createElement('h2', { className: 'text-sm font-semibold text-on-surface flex-1' }, 'Hyphae'),
    ),
    createElement('div', { className: 'p-2 space-y-0.5 flex-1' },
      createElement(NavBtn, { id: 'lander', icon: 'home', label: 'Home' }),
      createElement(NavBtn, { id: 'profile', icon: 'person', label: 'Profile' }),
    ),
  );
}

export function HomePage() {
  const state = store.getState();

  return createElement('div', { className: 'flex flex-1 min-w-0 overflow-hidden' },
    state.sidebarOpen
      ? createElement(HomeSidebar, null)
      : null,
    createElement('div', { className: 'flex-1 overflow-y-auto' },
      _homeTab === 'lander'
        ? createElement(LanderContent, null)
        : createElement(ProfileContent, null),
    ),
  );
}

import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { nostr } from '../nostr';
import { nickColor } from '../helpers/colorClass';
import type { IrcUser } from '../../shared/types';

const modeOrder: Record<string, number> = { q: 0, a: 1, o: 2, h: 3, v: 4 };
const modeSymbol: Record<string, string> = { q: '~', a: '&', o: '@', h: '%', v: '+' };
const modeLabel: Record<string, string> = { q: 'Owner', a: 'Admin', o: 'Operator', h: 'Half-Op', v: 'Voiced' };
const modeColor: Record<string, string> = { q: 'text-red-400', a: 'text-purple-400', o: 'text-online', h: 'text-idle', v: 'text-on-surface' };

function getUserPrimaryMode(user: IrcUser): string | null {
  if (!user.modes || user.modes.length === 0) return null;
  const sorted = [...user.modes].sort((a, b) => (modeOrder[a] ?? 99) - (modeOrder[b] ?? 99));
  return sorted[0];
}

function groupUsers(users: Record<string, IrcUser>): { label: string; mode: string | null; users: IrcUser[] }[] {
  const groups: Map<string | null, IrcUser[]> = new Map();

  for (const user of Object.values(users)) {
    const mode = getUserPrimaryMode(user);
    if (!groups.has(mode)) groups.set(mode, []);
    groups.get(mode)!.push(user);
  }

  // Sort each group alphabetically
  for (const [, list] of groups) {
    list.sort((a, b) => a.nick.toLowerCase().localeCompare(b.nick.toLowerCase()));
  }

  const result: { label: string; mode: string | null; users: IrcUser[] }[] = [];

  // Add mode groups in order
  for (const mode of ['q', 'a', 'o', 'h', 'v']) {
    const list = groups.get(mode);
    if (list && list.length > 0) {
      result.push({ label: `${modeLabel[mode]} — ${list.length}`, mode, users: list });
    }
  }

  // Add users with no mode
  const noMode = groups.get(null);
  if (noMode && noMode.length > 0) {
    result.push({ label: `Members — ${noMode.length}`, mode: null, users: noMode });
  }

  return result;
}

function UserEntry({ user, mode }: { user: IrcUser; mode: string | null }) {
  const prefix = mode ? modeSymbol[mode] || '' : '';
  const modeColorClass = mode ? modeColor[mode] || 'text-on-surface' : 'text-on-surface';
  const color = nickColor(user.nick);

  // Check if user has a nostr profile picture
  const profile = user.nostrPubkey ? nostr.getProfile(user.nostrPubkey) : undefined;
  const avatarUrl = profile?.picture || undefined;

  return createElement('div', {
    className: cn(
      'flex items-center gap-2 px-3 py-1 mx-2 rounded-lg cursor-pointer transition-colors',
      'hover:bg-accent/40',
      user.away && 'opacity-40',
    ),
    title: user.away ? `${user.nick} (away: ${user.away})` : user.nick,
    onClick: () => {
      if (user.nostrPubkey) {
        store.openProfile(user.nostrPubkey);
      }
    },
  },
    // Avatar
    avatarUrl
      ? createElement('img', {
          src: avatarUrl,
          className: 'size-7 rounded-full object-cover flex-shrink-0',
          onError: (e: any) => { e.target.style.display = 'none'; },
        })
      : createElement('div', {
          className: 'size-7 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-semibold flex-shrink-0',
          style: { color },
        }, user.nick.charAt(0).toUpperCase()),
    // Nick
    createElement('span', {
      className: cn('text-sm truncate', modeColorClass),
    },
      prefix ? createElement('span', { className: 'opacity-60 mr-0.5' }, prefix) : null,
      user.nick,
    ),
  );
}

export function UserList() {
  const channel = store.getActiveChannel();
  if (!channel || !channel.users) return null;

  const userCount = Object.keys(channel.users).length;
  const groups = groupUsers(channel.users);

  return createElement('div', {
    className: 'w-[220px] flex-shrink-0 bg-surface-low overflow-y-auto border-l border-border',
  },
    // Header
    createElement('div', {
      className: 'flex items-center gap-1.5 px-4 pt-3 pb-1',
    },
      createElement('span', { className: 'material-symbols-rounded text-sm text-on-surface-variant' }, 'group'),
      createElement('span', {
        className: 'text-[11px] font-medium text-on-surface-variant',
      }, `${userCount} user${userCount !== 1 ? 's' : ''}`),
    ),

    // Groups
    ...groups.map(group =>
      createElement('div', { key: group.label, className: 'mb-1' },
        createElement('div', {
          className: 'px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
        }, group.label),
        ...group.users.map(user =>
          createElement(UserEntry, { key: user.nick, user, mode: group.mode }),
        ),
      ),
    ),

    createElement('div', { className: 'h-4' }),
  );
}

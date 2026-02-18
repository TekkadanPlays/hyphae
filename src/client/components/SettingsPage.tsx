import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store, type SettingsPage as SettingsPageType } from '../store';
import { nostr } from '../nostr';
import { Button } from 'blazecn/Button';
import { Input } from 'blazecn/Input';
import { Label } from 'blazecn/Label';
import { Switch } from 'blazecn/Switch';
import { Separator } from 'blazecn/Separator';
import { RadioGroup, RadioGroupItem } from 'blazecn/RadioGroup';

// ─── Shared layout helpers ───

function SettingRow({ label, description, children }: { label: string; description?: string; children?: any }) {
  return createElement('div', { className: 'flex items-center justify-between gap-4 py-2' },
    createElement('div', { className: 'flex-1 min-w-0' },
      createElement(Label, { className: 'text-sm font-medium text-foreground' }, label),
      description
        ? createElement('p', { className: 'text-xs text-muted-foreground mt-0.5' }, description)
        : null,
    ),
    children,
  );
}

function SectionHeader({ icon, title, description }: { icon: string; title: string; description?: string }) {
  return createElement('div', { className: 'flex items-center gap-3 pb-2' },
    createElement('div', { className: 'size-8 rounded-lg bg-primary/10 flex items-center justify-center' },
      createElement('span', { className: 'material-symbols-rounded text-base text-primary' }, icon),
    ),
    createElement('div', null,
      createElement('h3', { className: 'text-sm font-semibold text-foreground' }, title),
      description
        ? createElement('p', { className: 'text-xs text-muted-foreground' }, description)
        : null,
    ),
  );
}

function RadioOption({ label, value, name, checked, onChange }: {
  label: string; value: string; name: string; checked: boolean; onChange: () => void;
}) {
  const id = `${name}-${value}`;
  return createElement('div', {
    className: cn(
      'flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors',
      checked ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
    ),
    onClick: onChange,
  },
    createElement(RadioGroupItem, { value, checked, id, onClick: onChange }),
    createElement(Label, { htmlFor: id, className: 'text-sm cursor-pointer' }, label),
  );
}

// ─── Application Settings ───

function AppGeneral() {
  const state = store.getState();
  return createElement('div', { className: 'space-y-6' },
    createElement(SectionHeader, { icon: 'info', title: 'Hyphae' }),
    createElement('div', { className: 'pl-1 space-y-3' },
      createElement('p', { className: 'text-sm text-muted-foreground leading-relaxed' },
        'IRC chat with Nostr identity, woven together.',
      ),
      createElement('p', { className: 'text-[10px] text-muted-foreground/30 font-mono select-none' }, '\u22c6\u02d9\ud80c\udf4a\u208a \u2039\u02da \ud80d\ude67\ud80c\udefc\u02d6\u00b0\ud80c\udd91\u02d9\u22c6'),
    ),
    createElement(Separator, null),
    createElement(SectionHeader, { icon: 'bolt', title: 'Nostr Identity', description: 'NIP-07 browser extension' }),
    createElement('div', { className: 'pl-1 space-y-3' },
      createElement(Button, {
        variant: state.nostrPubkey ? 'secondary' : 'outline',
        className: state.nostrPubkey ? 'w-full border-online/30 text-online bg-online/10 hover:bg-online/15' : 'w-full',
        onClick: async () => {
          if (state.nostrPubkey) return;
          try {
            const pubkey = await nostr.loginWithExtension();
            store.setNostrPubkey(pubkey);
          } catch (err: any) { alert(`Error: ${err.message}`); }
        },
      },
        createElement('span', null, '\u26a1'),
        state.nostrPubkey ? `Connected: ${state.nostrPubkey.slice(0, 16)}\u2026` : 'Connect Nostr Identity',
      ),
      state.nostrPubkey
        ? createElement('div', {
            className: 'flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground cursor-pointer hover:bg-accent/30 transition-colors',
            title: 'Click to copy',
            onClick: () => navigator.clipboard?.writeText(state.nostrPubkey!),
          },
            createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0' }, 'key'),
            createElement('span', { className: 'truncate' }, state.nostrPubkey),
            createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0 ml-auto' }, 'content_copy'),
          )
        : null,
    ),
    createElement(Separator, null),
    createElement(SectionHeader, { icon: 'palette', title: 'Theme' }),
    createElement('div', { className: 'pl-1' },
      createElement('p', { className: 'text-xs text-muted-foreground' }, 'Dark mode is currently the only theme. More coming soon.'),
    ),
  );
}

// ─── IRC Settings Sections ───

function IrcAppearance() {
  const { settings } = store.getState();
  return createElement('div', { className: 'space-y-6' },
    createElement(SectionHeader, { icon: 'chat', title: 'Messages' }),
    createElement('div', { className: 'space-y-1 pl-1' },
      createElement(SettingRow, { label: 'Show seconds in timestamps', description: 'Display seconds alongside hours and minutes' },
        createElement(Switch, { checked: settings.showSeconds, onChange: (v: boolean) => store.updateSetting('showSeconds', v) }),
      ),
      createElement(SettingRow, { label: 'Use 12-hour clock', description: 'Show AM/PM instead of 24-hour time' },
        createElement(Switch, { checked: settings.use12hClock, onChange: (v: boolean) => store.updateSetting('use12hClock', v) }),
      ),
      createElement(SettingRow, { label: 'Show MOTD', description: 'Display the Message of the Day on connect' },
        createElement(Switch, { checked: settings.showMotd, onChange: (v: boolean) => store.updateSetting('showMotd', v) }),
      ),
    ),
    createElement(Separator, null),
    createElement(SectionHeader, { icon: 'info', title: 'Status Messages', description: 'Joins, parts, quits, nick changes' }),
    createElement(RadioGroup, { value: settings.statusMessages, className: 'gap-1 pl-1' },
      createElement(RadioOption, { label: 'Show all', value: 'shown', name: 'statusMessages', checked: settings.statusMessages === 'shown', onChange: () => store.updateSetting('statusMessages', 'shown') }),
      createElement(RadioOption, { label: 'Condense', value: 'condensed', name: 'statusMessages', checked: settings.statusMessages === 'condensed', onChange: () => store.updateSetting('statusMessages', 'condensed') }),
      createElement(RadioOption, { label: 'Hide all', value: 'hidden', name: 'statusMessages', checked: settings.statusMessages === 'hidden', onChange: () => store.updateSetting('statusMessages', 'hidden') }),
    ),
    createElement(Separator, null),
    createElement(SectionHeader, { icon: 'palette', title: 'Visual Aids' }),
    createElement('div', { className: 'space-y-1 pl-1' },
      createElement(SettingRow, { label: 'Colored nicknames', description: 'Unique color per nick' },
        createElement(Switch, { checked: settings.coloredNicks, onChange: (v: boolean) => store.updateSetting('coloredNicks', v) }),
      ),
      createElement(SettingRow, { label: 'Autocomplete', description: 'Tab-completion for nicks and commands' },
        createElement(Switch, { checked: settings.autocomplete, onChange: (v: boolean) => store.updateSetting('autocomplete', v) }),
      ),
      createElement('div', { className: 'py-2' },
        createElement(Label, { htmlFor: 'nickPostfix', className: 'text-sm font-medium text-foreground' }, 'Nick autocomplete postfix'),
        createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Character(s) appended after completing a nick'),
        createElement(Input, { id: 'nickPostfix', value: settings.nickPostfix, className: 'max-w-[120px]', onInput: (e: any) => store.updateSetting('nickPostfix', e.target.value) }),
      ),
    ),
  );
}

function IrcNotifications() {
  const { settings } = store.getState();
  return createElement('div', { className: 'space-y-6' },
    createElement(SectionHeader, { icon: 'notifications', title: 'Browser Notifications' }),
    createElement('div', { className: 'space-y-1 pl-1' },
      createElement(SettingRow, { label: 'Desktop notifications', description: 'Show browser notifications for highlights' },
        createElement(Switch, {
          checked: settings.desktopNotifications,
          onChange: (v: boolean) => {
            if (v && 'Notification' in window && Notification.permission === 'default') {
              Notification.requestPermission().then(perm => { store.updateSetting('desktopNotifications', perm === 'granted'); });
            } else {
              store.updateSetting('desktopNotifications', v);
            }
          },
        }),
      ),
      createElement(SettingRow, { label: 'Notification sound', description: 'Play a sound on notification' },
        createElement(Switch, { checked: settings.notificationSound, onChange: (v: boolean) => store.updateSetting('notificationSound', v) }),
      ),
      createElement(SettingRow, { label: 'Notify for all messages', description: 'Not just highlights' },
        createElement(Switch, { checked: settings.notifyAllMessages, onChange: (v: boolean) => store.updateSetting('notifyAllMessages', v) }),
      ),
    ),
    createElement(Separator, null),
    createElement(SectionHeader, { icon: 'highlight', title: 'Highlights', description: 'Words that trigger notifications' }),
    createElement('div', { className: 'space-y-4 pl-1' },
      createElement('div', null,
        createElement(Label, { htmlFor: 'highlights', className: 'text-sm font-medium text-foreground' }, 'Custom highlights'),
        createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Comma-separated words'),
        createElement(Input, { id: 'highlights', value: settings.highlights, placeholder: 'word1, word2', onInput: (e: any) => store.updateSetting('highlights', e.target.value) }),
      ),
      createElement('div', null,
        createElement(Label, { htmlFor: 'highlightExceptions', className: 'text-sm font-medium text-foreground' }, 'Exceptions'),
        createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Words that prevent a highlight'),
        createElement(Input, { id: 'highlightExceptions', value: settings.highlightExceptions, placeholder: 'bot, service', onInput: (e: any) => store.updateSetting('highlightExceptions', e.target.value) }),
      ),
    ),
  );
}

function IrcGeneral() {
  const state = store.getState();
  const { settings } = state;
  return createElement('div', { className: 'space-y-6' },
    createElement(SectionHeader, { icon: 'schedule', title: 'Away Message' }),
    createElement('div', { className: 'pl-1' },
      createElement(Label, { htmlFor: 'awayMessage', className: 'text-sm font-medium text-foreground' }, 'Automatic away message'),
      createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Set when you close the client or go idle'),
      createElement(Input, { id: 'awayMessage', value: settings.awayMessage, placeholder: 'Away from keyboard', onInput: (e: any) => store.updateSetting('awayMessage', e.target.value) }),
    ),
    createElement(Separator, null),
    createElement(SectionHeader, { icon: 'bolt', title: 'Nostr Identity', description: 'NIP-07 browser extension' }),
    createElement('div', { className: 'pl-1 space-y-3' },
      createElement(Button, {
        variant: state.nostrPubkey ? 'secondary' : 'outline',
        className: state.nostrPubkey ? 'w-full border-online/30 text-online bg-online/10 hover:bg-online/15' : 'w-full',
        onClick: async () => {
          if (state.nostrPubkey) return;
          try {
            const pubkey = await nostr.loginWithExtension();
            store.setNostrPubkey(pubkey);
          } catch (err: any) { alert(`Error: ${err.message}`); }
        },
      },
        createElement('span', null, '⚡'),
        state.nostrPubkey ? `Connected: ${state.nostrPubkey.slice(0, 16)}…` : 'Connect Nostr Identity',
      ),
      state.nostrPubkey
        ? createElement('div', {
            className: 'flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground cursor-pointer hover:bg-accent/30 transition-colors',
            title: 'Click to copy',
            onClick: () => navigator.clipboard?.writeText(state.nostrPubkey!),
          },
            createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0' }, 'key'),
            createElement('span', { className: 'truncate' }, state.nostrPubkey),
            createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0 ml-auto' }, 'content_copy'),
          )
        : null,
    ),
    createElement(Separator, null),
    createElement(SectionHeader, { icon: 'info', title: 'About' }),
    createElement('div', { className: 'pl-1 space-y-3' },
      createElement('div', { className: 'flex items-center gap-3' },
        createElement('p', { className: 'text-lg font-semibold text-foreground' }, 'Hyphae'),
        createElement('span', { className: 'text-xs text-muted-foreground/40 font-mono' }, '• 𝓣𝓱𝓮 𝓶𝓮𝓼𝓼𝓪𝓰𝓮 𝓵𝓪𝓾𝓮𝓷'),
      ),
      createElement('p', { className: 'text-xs text-muted-foreground leading-relaxed' },
        'IRC chat with Nostr identity. Built with InfernoJS, Bun, and Kaji.',
      ),
      createElement('p', { className: 'text-[10px] text-muted-foreground/30 font-mono select-none' }, '⋆˙𓍊₊ ‹˚ 𓙧𓋼˖°𓆑˙⋆'),
    ),
  );
}

// ─── Navigation config ───

interface NavItem {
  id: SettingsPageType;
  icon: string;
  label: string;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'app-general', icon: 'tune', label: 'Application', group: 'Hyphae' },
  { id: 'irc-appearance', icon: 'palette', label: 'Appearance', group: 'IRC' },
  { id: 'irc-notifications', icon: 'notifications', label: 'Notifications', group: 'IRC' },
  { id: 'irc-general', icon: 'settings', label: 'General', group: 'IRC' },
];

const CONTENT_MAP: Record<SettingsPageType, () => any> = {
  'app-general': AppGeneral,
  'irc-appearance': IrcAppearance,
  'irc-notifications': IrcNotifications,
  'irc-general': IrcGeneral,
};

// ─── Main SettingsPage ───

export function SettingsPage() {
  const state = store.getState();
  const activePage = state.settingsPage;
  const sidebarWidth = state.sidebarWidth;

  const ContentComponent = CONTENT_MAP[activePage];

  let lastGroup = '';

  return createElement('div', { className: 'flex flex-1 min-w-0 overflow-hidden' },
    // Sidebar nav
    createElement('div', {
      className: 'flex-shrink-0 border-r border-border overflow-y-auto bg-surface-high',
      style: { width: `${sidebarWidth}px` },
    },
      // Header
      createElement('div', { className: 'flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2' },
        createElement('span', { className: 'material-symbols-rounded text-lg text-primary' }, 'settings'),
        createElement('h2', { className: 'text-sm font-semibold text-on-surface flex-1' }, 'Settings'),
      ),
      // Nav items grouped
      createElement('div', { className: 'p-2 space-y-0.5' },
        ...NAV_ITEMS.map(item => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;
          return [
            showGroup
              ? createElement('div', {
                  key: `group-${item.group}`,
                  className: 'text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 px-2 pt-3 pb-1',
                }, item.group)
              : null,
            createElement('button', {
              key: item.id,
              className: cn(
                'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
                activePage === item.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              ),
              onClick: () => store.setSettingsPage(item.id),
            },
              createElement('span', { className: 'material-symbols-rounded text-base flex-shrink-0' }, item.icon),
              item.label,
            ),
          ];
        }).flat(),
      ),
    ),

    // Content area
    createElement('div', { className: 'flex-1 overflow-y-auto' },
      createElement('div', { className: 'max-w-2xl p-6' },
        ContentComponent ? createElement(ContentComponent, null) : null,
      ),
    ),
  );
}

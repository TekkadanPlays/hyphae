import { createElement } from 'inferno-create-element';
import { store, type UserSettings } from '../store';
import { nostr } from '../nostr';
import { Button } from 'blazecn/Button';
import { Input } from 'blazecn/Input';
import { Label } from 'blazecn/Label';
import { Switch } from 'blazecn/Switch';
import { Separator } from 'blazecn/Separator';
import { RadioGroup, RadioGroupItem } from 'blazecn/RadioGroup';

let _settingsTab = 'appearance';

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
    createElement('div', {
      className: 'size-8 rounded-lg bg-primary/10 flex items-center justify-center',
    },
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
    className: `flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${checked ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`,
    onClick: onChange,
  },
    createElement(RadioGroupItem, { value, checked, id, onClick: onChange }),
    createElement(Label, { htmlFor: id, className: 'text-sm cursor-pointer' }, label),
  );
}

function AppearanceTab() {
  const { settings } = store.getState();

  return createElement('div', { className: 'space-y-6' },
    // Messages section
    createElement(SectionHeader, { icon: 'chat', title: 'Messages', description: 'How messages are displayed' }),
    createElement('div', { className: 'space-y-1 pl-1' },
      createElement(SettingRow, {
        label: 'Show seconds in timestamps',
        description: 'Display seconds alongside hours and minutes',
      },
        createElement(Switch, {
          checked: settings.showSeconds,
          onChange: (v: boolean) => store.updateSetting('showSeconds', v),
        }),
      ),
      createElement(SettingRow, {
        label: 'Use 12-hour clock',
        description: 'Show AM/PM instead of 24-hour time',
      },
        createElement(Switch, {
          checked: settings.use12hClock,
          onChange: (v: boolean) => store.updateSetting('use12hClock', v),
        }),
      ),
      createElement(SettingRow, {
        label: 'Show MOTD',
        description: 'Display the Message of the Day on connect',
      },
        createElement(Switch, {
          checked: settings.showMotd,
          onChange: (v: boolean) => store.updateSetting('showMotd', v),
        }),
      ),
    ),

    createElement(Separator, null),

    // Status messages
    createElement(SectionHeader, { icon: 'info', title: 'Status Messages', description: 'Joins, parts, quits, nick changes, mode changes' }),
    createElement(RadioGroup, { value: settings.statusMessages, className: 'gap-1 pl-1' },
      createElement(RadioOption, {
        label: 'Show all status messages',
        value: 'shown', name: 'statusMessages',
        checked: settings.statusMessages === 'shown',
        onChange: () => store.updateSetting('statusMessages', 'shown'),
      }),
      createElement(RadioOption, {
        label: 'Condense status messages',
        value: 'condensed', name: 'statusMessages',
        checked: settings.statusMessages === 'condensed',
        onChange: () => store.updateSetting('statusMessages', 'condensed'),
      }),
      createElement(RadioOption, {
        label: 'Hide all status messages',
        value: 'hidden', name: 'statusMessages',
        checked: settings.statusMessages === 'hidden',
        onChange: () => store.updateSetting('statusMessages', 'hidden'),
      }),
    ),

    createElement(Separator, null),

    // Visual aids
    createElement(SectionHeader, { icon: 'palette', title: 'Visual Aids' }),
    createElement('div', { className: 'space-y-1 pl-1' },
      createElement(SettingRow, {
        label: 'Colored nicknames',
        description: 'Give each user a unique color based on their nick',
      },
        createElement(Switch, {
          checked: settings.coloredNicks,
          onChange: (v: boolean) => store.updateSetting('coloredNicks', v),
        }),
      ),
      createElement(SettingRow, {
        label: 'Autocomplete',
        description: 'Enable tab-completion for nicks and commands',
      },
        createElement(Switch, {
          checked: settings.autocomplete,
          onChange: (v: boolean) => store.updateSetting('autocomplete', v),
        }),
      ),
      createElement('div', { className: 'py-2' },
        createElement(Label, { htmlFor: 'nickPostfix', className: 'text-sm font-medium text-foreground' }, 'Nick autocomplete postfix'),
        createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Character(s) appended after completing a nick (e.g. ", ")'),
        createElement(Input, {
          id: 'nickPostfix',
          value: settings.nickPostfix,
          className: 'max-w-[120px]',
          onInput: (e: any) => store.updateSetting('nickPostfix', e.target.value),
        }),
      ),
    ),
  );
}

function NotificationsTab() {
  const { settings } = store.getState();

  return createElement('div', { className: 'space-y-6' },
    // Browser notifications
    createElement(SectionHeader, { icon: 'notifications', title: 'Browser Notifications' }),
    createElement('div', { className: 'space-y-1 pl-1' },
      createElement(SettingRow, {
        label: 'Desktop notifications',
        description: 'Show browser notifications for highlights and mentions',
      },
        createElement(Switch, {
          checked: settings.desktopNotifications,
          onChange: (v: boolean) => {
            if (v && 'Notification' in window && Notification.permission === 'default') {
              Notification.requestPermission().then(perm => {
                store.updateSetting('desktopNotifications', perm === 'granted');
              });
            } else {
              store.updateSetting('desktopNotifications', v);
            }
          },
        }),
      ),
      createElement(SettingRow, {
        label: 'Notification sound',
        description: 'Play a sound when you receive a notification',
      },
        createElement(Switch, {
          checked: settings.notificationSound,
          onChange: (v: boolean) => store.updateSetting('notificationSound', v),
        }),
      ),
      createElement(SettingRow, {
        label: 'Notify for all messages',
        description: 'Receive notifications for every message, not just highlights',
      },
        createElement(Switch, {
          checked: settings.notifyAllMessages,
          onChange: (v: boolean) => store.updateSetting('notifyAllMessages', v),
        }),
      ),
    ),

    createElement(Separator, null),

    // Highlights
    createElement(SectionHeader, { icon: 'highlight', title: 'Highlights', description: 'Words that trigger notifications' }),
    createElement('div', { className: 'space-y-4 pl-1' },
      createElement('div', null,
        createElement(Label, { htmlFor: 'highlights', className: 'text-sm font-medium text-foreground' }, 'Custom highlights'),
        createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Comma-separated words that trigger a highlight'),
        createElement(Input, {
          id: 'highlights',
          value: settings.highlights,
          placeholder: 'word1, word2, another phrase',
          onInput: (e: any) => store.updateSetting('highlights', e.target.value),
        }),
      ),
      createElement('div', null,
        createElement(Label, { htmlFor: 'highlightExceptions', className: 'text-sm font-medium text-foreground' }, 'Highlight exceptions'),
        createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Comma-separated words that prevent a highlight'),
        createElement(Input, {
          id: 'highlightExceptions',
          value: settings.highlightExceptions,
          placeholder: 'bot, service, ignore-this',
          onInput: (e: any) => store.updateSetting('highlightExceptions', e.target.value),
        }),
      ),
    ),
  );
}

function GeneralTab() {
  const state = store.getState();
  const { settings } = state;

  return createElement('div', { className: 'space-y-6' },
    // Away message
    createElement(SectionHeader, { icon: 'schedule', title: 'Away Message' }),
    createElement('div', { className: 'pl-1' },
      createElement(Label, { htmlFor: 'awayMessage', className: 'text-sm font-medium text-foreground' }, 'Automatic away message'),
      createElement('p', { className: 'text-xs text-muted-foreground mb-2' }, 'Set when you close the client or go idle'),
      createElement(Input, {
        id: 'awayMessage',
        value: settings.awayMessage,
        placeholder: 'Away from keyboard',
        onInput: (e: any) => store.updateSetting('awayMessage', e.target.value),
      }),
    ),

    createElement(Separator, null),

    // Nostr identity
    createElement(SectionHeader, { icon: 'bolt', title: 'Nostr Identity', description: 'NIP-07 browser extension integration' }),
    createElement('div', { className: 'pl-1 space-y-3' },
      createElement(Button, {
        variant: state.nostrPubkey ? 'secondary' : 'outline',
        className: state.nostrPubkey
          ? 'w-full border-online/30 text-online bg-online/10 hover:bg-online/15'
          : 'w-full',
        onClick: async () => {
          if (state.nostrPubkey) return;
          try {
            const pubkey = await nostr.loginWithExtension();
            store.setNostrPubkey(pubkey);
          } catch (err: any) {
            alert(`Error: ${err.message}`);
          }
        },
      },
        createElement('span', null, '⚡'),
        state.nostrPubkey
          ? `Connected: ${state.nostrPubkey.slice(0, 16)}…`
          : 'Connect Nostr Identity',
      ),

      state.nostrPubkey
        ? createElement('div', {
            className: 'flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-xs font-mono text-muted-foreground cursor-pointer hover:bg-accent/30 transition-colors',
            title: 'Click to copy pubkey',
            onClick: () => navigator.clipboard?.writeText(state.nostrPubkey!),
          },
            createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0' }, 'key'),
            createElement('span', { className: 'truncate' }, state.nostrPubkey),
            createElement('span', { className: 'material-symbols-rounded text-sm flex-shrink-0 ml-auto' }, 'content_copy'),
          )
        : null,
    ),

    createElement(Separator, null),

    // About
    createElement(SectionHeader, { icon: 'info', title: 'About Stoat' }),
    createElement('div', { className: 'pl-1 space-y-2' },
      createElement('div', { className: 'flex items-center gap-3' },
        createElement('span', { className: 'text-2xl' }, '🦦'),
        createElement('div', null,
          createElement('p', { className: 'text-sm font-semibold text-foreground' }, 'Stoat IRC Client'),
          createElement('p', { className: 'text-xs text-muted-foreground' }, 'Built with InfernoJS + Bun + Kaji + Blazecn'),
        ),
      ),
      createElement('p', { className: 'text-xs text-muted-foreground leading-relaxed' },
        'A modern IRC client with Nostr integration. Powered by Kaji for Nostr protocol and Blazecn for UI components.',
      ),
    ),
  );
}

const NAV_ITEMS = [
  { id: 'appearance', icon: 'palette', label: 'Appearance' },
  { id: 'notifications', icon: 'notifications', label: 'Notifications' },
  { id: 'general', icon: 'tune', label: 'General' },
];

function settingsNavItems(activeTab: string, setTab: (t: string) => void, width: number) {
  const compact = width < 180;
  return NAV_ITEMS.map(item =>
    createElement('button', {
      key: item.id,
      className: `flex items-center ${compact ? 'justify-center' : 'gap-2'} w-full ${compact ? 'px-2' : 'px-3'} py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === item.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`,
      onClick: () => setTab(item.id),
      title: item.label,
    },
      createElement('span', { className: 'material-symbols-rounded text-base flex-shrink-0' }, item.icon),
      compact ? null : item.label,
    ),
  );
}

export function Settings() {
  const setTab = (t: string) => { _settingsTab = t; store['notify'](); };

  return createElement('div', {
    className: 'flex flex-col flex-1 min-h-0',
  },
    // Header bar
    createElement('div', {
      className: 'flex items-center h-12 px-6 flex-shrink-0 border-b border-border gap-3',
    },
      createElement('span', { className: 'material-symbols-rounded text-lg text-primary' }, 'settings'),
      createElement('h1', { className: 'text-sm font-semibold text-foreground' }, 'Settings'),
      createElement('div', { className: 'flex-1' }),
      createElement(Button, {
        variant: 'ghost', size: 'sm',
        className: 'text-muted-foreground hover:text-foreground gap-1.5',
        onClick: () => store.closeSettings(),
      },
        createElement('span', { className: 'material-symbols-rounded text-base' }, 'arrow_back'),
        'Back',
      ),
    ),

    // Content area: sidebar nav + resize handle + scrollable content
    createElement('div', { className: 'flex flex-1 min-h-0' },
      // Left sidebar nav — width matches ChannelSidebar so it aligns with the UserPanel overlay
      createElement('div', {
        className: 'flex-shrink-0 border-r border-border p-3 pb-28 space-y-1 overflow-y-auto',
        style: { width: `${store.getState().sidebarWidth}px` },
      },
        ...settingsNavItems(_settingsTab, setTab, store.getState().sidebarWidth),
      ),

      // Resize handle — same constraints as main sidebar
      createElement('div', {
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
      ),

      // Scrollable content
      createElement('div', { className: 'flex-1 overflow-y-auto p-6 max-w-2xl' },
        _settingsTab === 'appearance' ? createElement(AppearanceTab, null) : null,
        _settingsTab === 'notifications' ? createElement(NotificationsTab, null) : null,
        _settingsTab === 'general' ? createElement(GeneralTab, null) : null,
      ),
    ),
  );
}

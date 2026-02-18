import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { p2pStore } from '../p2p/p2pStore';
import { soundOptions } from '../p2p/config/soundNames';
import { Button } from 'blazecn/Button';
import { Separator } from 'blazecn/Separator';

export function P2PSettings() {
  const state = store.getState();
  const p2p = p2pStore.getState();
  const settings = p2p.userSettings;

  return createElement('div', {
    className: 'flex flex-1 min-w-0',
  },
    // Settings sidebar nav
    createElement('div', {
      className: 'w-[220px] flex-shrink-0 bg-surface-high overflow-y-auto border-r border-border',
      style: { width: `${state.sidebarWidth}px` },
    },
      createElement('div', {
        className: 'flex items-center h-12 px-4 flex-shrink-0 border-b border-border',
      },
        createElement('h2', {
          className: 'text-sm font-semibold text-on-surface',
        }, 'P2P Settings'),
      ),
      createElement('div', { className: 'py-2' },
        ...[
          { id: 'profile', label: 'Profile', icon: 'person' },
          { id: 'notifications', label: 'Notifications', icon: 'notifications' },
          { id: 'about', label: 'About', icon: 'info' },
        ].map(item =>
          createElement('a', {
            key: item.id,
            className: 'flex items-center gap-2 px-4 py-2 mx-2 rounded-lg text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground cursor-pointer transition-colors',
          },
            createElement('span', { className: 'material-symbols-rounded text-lg' }, item.icon),
            createElement('span', { className: 'text-sm' }, item.label),
          ),
        ),
        createElement(Separator, { className: 'mx-4 my-2' }),
        createElement('a', {
          className: 'flex items-center gap-2 px-4 py-2 mx-2 rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground cursor-pointer transition-colors',
          onClick: () => store.closeSettings(),
        },
          createElement('span', { className: 'material-symbols-rounded text-lg' }, 'arrow_back'),
          createElement('span', { className: 'text-sm' }, 'Back to chat'),
        ),
      ),
    ),

    // Settings content
    createElement('div', {
      className: 'flex-1 overflow-y-auto px-8 py-6',
    },
      // Close button
      createElement('div', { className: 'flex justify-end mb-4' },
        createElement(Button, {
          variant: 'ghost',
          size: 'icon',
          onClick: () => store.closeSettings(),
        },
          createElement('span', { className: 'material-symbols-rounded text-xl' }, 'close'),
        ),
      ),

      // Profile section
      createElement('section', { className: 'mb-8' },
        createElement('h3', {
          className: 'text-lg font-semibold text-foreground mb-4',
        }, 'Profile'),
        createElement('div', { className: 'space-y-4 max-w-md' },
          // Username
          createElement('div', null,
            createElement('label', {
              className: 'block text-sm font-medium text-on-surface-variant mb-1.5',
            }, 'Display Name'),
            createElement('input', {
              type: 'text',
              className: 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              placeholder: 'Anonymous',
              value: settings?.customUsername || '',
              oninput: (e: Event) => {
                const val = (e.target as HTMLInputElement).value;
                p2pStore.updateSettings({ customUsername: val });
              },
            }),
            createElement('p', {
              className: 'text-xs text-muted-foreground mt-1',
            }, 'This name is shown to other peers in P2P rooms.'),
          ),
          // User ID
          settings ? createElement('div', null,
            createElement('label', {
              className: 'block text-sm font-medium text-on-surface-variant mb-1.5',
            }, 'User ID'),
            createElement('div', {
              className: 'rounded-lg border border-input bg-background/50 px-3 py-2 text-xs text-muted-foreground font-mono truncate',
            }, settings.userId),
            createElement('p', {
              className: 'text-xs text-muted-foreground mt-1',
            }, 'Your unique P2P identity. Auto-generated.'),
          ) : null,
        ),
      ),

      createElement(Separator, { className: 'my-6' }),

      // Notifications section
      createElement('section', { className: 'mb-8' },
        createElement('h3', {
          className: 'text-lg font-semibold text-foreground mb-4',
        }, 'Notifications'),
        createElement('div', { className: 'space-y-3 max-w-md' },
          // Play sound
          createElement('label', {
            className: 'flex items-center gap-3 cursor-pointer',
          },
            createElement('input', {
              type: 'checkbox',
              className: 'size-4 rounded border-input accent-primary',
              checked: settings?.playSoundOnNewMessage ?? true,
              onchange: (e: Event) => {
                p2pStore.updateSettings({ playSoundOnNewMessage: (e.target as HTMLInputElement).checked });
              },
            }),
            createElement('span', { className: 'text-sm text-on-surface' }, 'Play sound on new message'),
          ),
          // Browser notifications
          createElement('label', {
            className: 'flex items-center gap-3 cursor-pointer',
          },
            createElement('input', {
              type: 'checkbox',
              className: 'size-4 rounded border-input accent-primary',
              checked: settings?.showNotificationOnNewMessage ?? true,
              onchange: (e: Event) => {
                p2pStore.updateSettings({ showNotificationOnNewMessage: (e.target as HTMLInputElement).checked });
              },
            }),
            createElement('span', { className: 'text-sm text-on-surface' }, 'Show browser notifications'),
          ),
          // Typing indicator
          createElement('label', {
            className: 'flex items-center gap-3 cursor-pointer',
          },
            createElement('input', {
              type: 'checkbox',
              className: 'size-4 rounded border-input accent-primary',
              checked: settings?.showActiveTypingStatus ?? true,
              onchange: (e: Event) => {
                p2pStore.updateSettings({ showActiveTypingStatus: (e.target as HTMLInputElement).checked });
              },
            }),
            createElement('span', { className: 'text-sm text-on-surface' }, 'Show typing indicator to peers'),
          ),
          // Sound selector
          createElement('div', { className: 'pt-2' },
            createElement('label', {
              className: 'block text-sm font-medium text-on-surface-variant mb-1.5',
            }, 'Notification Sound'),
            createElement('select', {
              className: 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              value: settings?.selectedSound || '',
              onchange: (e: Event) => {
                p2pStore.updateSettings({ selectedSound: (e.target as HTMLSelectElement).value });
              },
            },
              ...soundOptions.map(opt =>
                createElement('option', { key: opt.value, value: opt.value }, opt.label),
              ),
            ),
          ),
        ),
      ),

      createElement(Separator, { className: 'my-6' }),

      // About section
      createElement('section', { className: 'mb-8' },
        createElement('h3', {
          className: 'text-lg font-semibold text-foreground mb-4',
        }, 'About P2P Chat'),
        createElement('div', { className: 'space-y-3 max-w-lg text-sm text-on-surface-variant leading-relaxed' },
          createElement('p', null,
            'P2P Chat uses ',
            createElement('strong', { className: 'text-foreground' }, 'trystero'),
            ' for peer-to-peer communication via WebRTC. Messages are sent directly between browsers \u2014 no server stores your conversations.',
          ),
          createElement('p', null,
            'Features include encrypted peer verification (RSA challenge/response), audio/video calls, screen sharing, file transfer, and direct messages.',
          ),
          createElement('p', null,
            'Room connections are established through BitTorrent tracker signaling. Your data stays between you and your peers.',
          ),
        ),
      ),

      createElement(Separator, { className: 'my-6' }),

      // Data management
      createElement('section', { className: 'mb-8' },
        createElement('h3', {
          className: 'text-lg font-semibold text-foreground mb-4',
        }, 'Data'),
        createElement('div', { className: 'flex gap-2' },
          createElement(Button, {
            variant: 'outline',
            size: 'sm',
            onClick: () => {
              const data = JSON.stringify(p2p, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'p2p-settings.json';
              a.click();
              URL.revokeObjectURL(url);
            },
          }, 'Export Settings'),
          createElement(Button, {
            variant: 'destructive',
            size: 'sm',
            onClick: () => {
              localStorage.removeItem('chitchatter:settings');
              window.location.reload();
            },
          }, 'Reset All P2P Data'),
        ),
      ),
    ),
  );
}

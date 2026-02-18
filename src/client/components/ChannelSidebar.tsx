import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { Button } from 'blazecn/Button';
import { Separator } from 'blazecn/Separator';

export function ChannelSidebar() {
  const state = store.getState();
  const network = store.getActiveNetwork();
  if (!network) return null;

  const channels = network.channels.filter(c => c.type === 'channel');
  const queries = network.channels.filter(c => c.type === 'query');
  const lobby = network.channels.find(c => c.type === 'lobby');

  return createElement('div', {
    className: 'flex flex-col flex-shrink-0 bg-surface-high overflow-hidden',
    style: { width: `${state.sidebarWidth}px` },
  },
    // Network header
    createElement('div', {
      className: 'flex items-center h-12 px-4 flex-shrink-0 border-b border-border',
    },
      createElement('div', {
        className: cn(
          'size-2 rounded-full mr-2 flex-shrink-0',
          network.connected ? 'bg-online' : 'bg-destructive',
        ),
      }),
      createElement('h2', {
        className: 'text-sm font-semibold text-on-surface truncate flex-1',
      }, network.name),
      createElement(Button, {
        variant: 'ghost', size: 'icon-sm',
        className: 'size-7 text-muted-foreground hover:text-destructive',
        onClick: () => store.disconnect(network.id),
      },
        createElement('span', { className: 'material-symbols-rounded text-base' }, 'power_settings_new'),
      ),
    ),

    // Channel list
    createElement('div', {
      className: 'flex-1 overflow-y-auto py-1 pb-28',
    },
      // Lobby
      lobby
        ? createElement('a', {
            className: cn(
              'flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100',
              state.activeChannelName === lobby.name && state.activeNetworkId === network.id
                ? 'bg-accent text-accent-foreground'
                : 'text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground',
            ),
            onClick: () => store.setActiveChannel(network.id, lobby.name),
          },
            createElement('span', {
              className: 'material-symbols-rounded text-lg flex-shrink-0',
            }, 'dns'),
            createElement('span', { className: 'truncate text-sm flex-1' }, network.name),
          )
        : null,

      // Channels header
      channels.length > 0
        ? createElement('div', {
            className: 'flex items-center gap-1 px-4 pt-4 pb-1',
          },
            createElement('span', {
              className: 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
            }, 'Channels'),
            createElement(Button, {
              variant: 'ghost', size: 'icon-sm',
              className: 'ml-auto size-5 text-muted-foreground hover:text-foreground',
              onClick: () => {
                const channel = prompt('Join channel:');
                if (channel) store.joinChannel(channel.startsWith('#') ? channel : '#' + channel);
              },
            },
              createElement('span', { className: 'material-symbols-rounded text-sm' }, 'add'),
            ),
          )
        : null,

      // Channel entries
      ...channels.map(channel => {
        const isActive = state.activeChannelName === channel.name && state.activeNetworkId === network.id;
        return createElement('a', {
          key: channel.name,
          className: cn(
            'flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground',
            channel.unread > 0 && !isActive && 'text-on-surface font-semibold',
          ),
          onClick: () => store.setActiveChannel(network.id, channel.name),
        },
          createElement('span', {
            className: 'material-symbols-rounded text-lg flex-shrink-0 text-on-surface-variant',
          }, 'tag'),
          createElement('span', { className: 'truncate text-sm flex-1' }, channel.name.replace(/^#/, '')),
          channel.highlight > 0
            ? createElement('span', {
                className: 'min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0',
              }, String(channel.highlight))
            : channel.unread > 0 && !isActive
              ? createElement('span', {
                  className: 'size-2 rounded-full bg-foreground flex-shrink-0',
                })
              : null,
        );
      }),

      // Queries header
      queries.length > 0
        ? createElement('div', {
            className: 'flex items-center gap-1 px-4 pt-4 pb-1',
          },
            createElement('span', {
              className: 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
            }, 'Direct Messages'),
          )
        : null,

      // Query entries
      ...queries.map(channel => {
        const isActive = state.activeChannelName === channel.name && state.activeNetworkId === network.id;
        return createElement('a', {
          key: channel.name,
          className: cn(
            'flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground',
            channel.unread > 0 && !isActive && 'text-on-surface font-semibold',
          ),
          onClick: () => store.setActiveChannel(network.id, channel.name),
        },
          createElement('span', {
            className: 'material-symbols-rounded text-lg flex-shrink-0 text-on-surface-variant',
          }, 'person'),
          createElement('span', { className: 'truncate text-sm flex-1' }, channel.name),
          channel.unread > 0 && !isActive
            ? createElement('span', {
                className: 'min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0',
              }, String(channel.unread))
            : null,
        );
      }),
    ),

    // Bottom: join channel
    createElement('div', { className: 'px-3 py-2 border-t border-border' },
      createElement(Button, {
        variant: 'ghost',
        className: 'w-full justify-start gap-2 text-muted-foreground hover:text-foreground',
        onClick: () => {
          const channel = prompt('Join channel:');
          if (channel) store.joinChannel(channel.startsWith('#') ? channel : '#' + channel);
        },
      },
        createElement('span', { className: 'material-symbols-rounded text-lg' }, 'add'),
        'Join channel',
      ),
    ),
  );
}

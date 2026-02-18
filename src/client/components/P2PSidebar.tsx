import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { p2pStore } from '../p2p/p2pStore';
import { joinRoom, leaveRoom } from '../p2p/roomManager';
import { communityRoomNames } from '../p2p/config/communityRooms';
import { Button } from 'blazecn/Button';
import { Separator } from 'blazecn/Separator';

let joinInput = '';

export function P2PSidebar() {
  const state = store.getState();
  const p2p = p2pStore.getState();

  return createElement('div', {
    className: 'flex flex-col flex-shrink-0 bg-surface-high overflow-hidden',
    style: { width: `${state.sidebarWidth}px` },
  },
    // Header
    createElement('div', {
      className: 'flex items-center h-12 px-4 flex-shrink-0 border-b border-border',
    },
      createElement('span', { className: 'material-symbols-rounded text-lg text-primary mr-2' }, 'hub'),
      createElement('h2', {
        className: 'text-sm font-semibold text-on-surface truncate flex-1',
      }, 'P2P Chat'),
      createElement(Button, {
        variant: 'ghost', size: 'icon-sm',
        className: 'size-7 text-muted-foreground hover:text-foreground',
        onClick: () => store.openSettings('p2p-profile'),
      },
        createElement('span', { className: 'material-symbols-rounded text-base' }, 'settings'),
      ),
      p2p.roomId
        ? createElement(Button, {
            variant: 'ghost', size: 'icon-sm',
            className: 'size-7 text-muted-foreground hover:text-destructive',
            onClick: () => leaveRoom(),
          },
            createElement('span', { className: 'material-symbols-rounded text-base' }, 'logout'),
          )
        : null,
    ),

    // Room list + join
    createElement('div', {
      className: 'flex-1 overflow-y-auto py-1 pb-28',
    },
      // Current room
      p2p.roomId
        ? createElement('div', { className: 'px-2 pt-2' },
            createElement('div', {
              className: 'flex items-center gap-2 px-2 py-1.5 mx-0 rounded-lg bg-accent text-accent-foreground',
            },
              createElement('span', { className: 'material-symbols-rounded text-lg flex-shrink-0' }, 'tag'),
              createElement('span', { className: 'truncate text-sm flex-1 font-medium' }, p2p.roomId),
              createElement('span', {
                className: 'text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0',
              }, `${p2p.peerList.length} peer${p2p.peerList.length !== 1 ? 's' : ''}`),
            ),
          )
        : null,

      // Joined rooms
      p2p.joinedRooms.length > 0
        ? createElement('div', null,
            createElement('div', {
              className: 'flex items-center gap-1 px-4 pt-4 pb-1',
            },
              createElement('span', {
                className: 'text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant',
              }, 'Rooms'),
            ),
            ...p2p.joinedRooms.map(room =>
              createElement('a', {
                key: room.id,
                className: cn(
                  'flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg cursor-pointer transition-colors duration-100',
                  p2p.roomId === room.name
                    ? 'bg-accent text-accent-foreground'
                    : 'text-on-surface-variant hover:bg-accent/50 hover:text-accent-foreground',
                ),
                onClick: () => {
                  if (p2p.roomId !== room.name) {
                    joinRoom(room.name, room.isPrivate ? undefined : undefined);
                    p2pStore.addJoinedRoom(room.name, room.isPrivate);
                  }
                },
              },
                createElement('span', {
                  className: 'material-symbols-rounded text-lg flex-shrink-0 text-on-surface-variant',
                }, room.isPrivate ? 'lock' : 'tag'),
                createElement('span', { className: 'truncate text-sm flex-1' }, room.name),
              ),
            ),
          )
        : null,

      // Hint to browse rooms
      !p2p.roomId && p2p.joinedRooms.length === 0
        ? createElement('div', { className: 'px-4 pt-4 text-center' },
            createElement('p', { className: 'text-xs text-muted-foreground' }, 'No rooms yet. Browse or join a room from the main view.'),
          )
        : null,
    ),
  );
}

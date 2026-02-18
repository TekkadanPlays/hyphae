import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { p2pStore } from '../p2p/p2pStore';
import { store } from '../store';
import { sendMessage, handleMessageInputChange } from '../p2p/roomManager';
import { isSystemMessage, type Message, type SystemMessage } from '../p2p/models/chat';
import { getDisplayUsername } from '../p2p/lib/getPeerName';
import { Button } from 'blazecn/Button';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function shouldGroup(msg: any, prev: any): boolean {
  if (!prev) return false;
  if (prev.authorId !== msg.authorId) return false;
  if (isSystemMessage(msg) || isSystemMessage(prev)) return false;
  if (msg.timeSent - prev.timeSent > 5 * 60_000) return false;
  return true;
}

function P2PMessageItem({ msg, grouped, displayName }: { msg: any; grouped: boolean; displayName: string }) {
  if (isSystemMessage(msg)) {
    return createElement('div', {
      className: 'flex items-center gap-2 px-4 py-0.5',
    },
      createElement('span', {
        className: 'text-[11px] text-muted-foreground flex-shrink-0',
      }, formatTime(msg.timeSent)),
      createElement('span', {
        className: 'text-xs italic text-muted-foreground',
      }, msg.text),
    );
  }

  if (grouped) {
    return createElement('div', {
      className: 'group flex gap-2 px-4 py-0.5 hover:bg-accent/10 transition-colors',
    },
      createElement('span', {
        className: 'text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-10 text-right',
      }, formatTime(msg.timeSent)),
      createElement('div', { className: 'size-8 flex-shrink-0' }),
      createElement('p', {
        className: 'text-sm text-on-surface leading-relaxed break-words min-w-0 flex-1',
      }, msg.text),
    );
  }

  return createElement('div', {
    className: 'group flex gap-2 px-4 pt-2 pb-0.5 hover:bg-accent/10 transition-colors',
  },
    createElement('span', {
      className: 'text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right pt-0.5',
    }, formatTime(msg.timeSent)),
    createElement('div', {
      className: 'size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0',
    }, displayName.charAt(0).toUpperCase()),
    createElement('div', { className: 'flex-1 min-w-0' },
      createElement('span', {
        className: 'text-sm font-semibold text-primary cursor-pointer hover:underline',
      }, displayName),
      createElement('p', {
        className: 'text-sm text-on-surface leading-relaxed break-words',
      }, msg.text),
    ),
  );
}

function P2PChatInput() {
  const p2p = p2pStore.getState();
  const placeholder = p2p.roomId ? `Message room` : 'Join a room to chat';

  return createElement('div', {
    className: 'px-4 pb-4 pt-2',
  },
    createElement('form', {
      className: 'flex items-center gap-2 rounded-xl border border-input bg-card/50 px-3 py-1.5 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-all',
      onSubmit: (e: any) => {
        e.preventDefault();
        const input = e.target.elements.p2pmessage;
        const text = input.value.trim();
        if (text && p2p.roomId) {
          sendMessage(text);
          input.value = '';
        }
      },
    },
      createElement('input', {
        name: 'p2pmessage',
        className: 'flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-9',
        placeholder,
        autoComplete: 'off',
        disabled: !p2p.roomId,
        oninput: () => handleMessageInputChange(),
      }),
      createElement(Button, {
        type: 'submit',
        variant: 'ghost',
        size: 'icon',
        className: 'text-primary hover:text-primary flex-shrink-0',
      },
        createElement('span', { className: 'material-symbols-rounded text-xl' }, 'send'),
      ),
    ),
  );
}

export function P2PChatArea() {
  const p2p = p2pStore.getState();
  const mainState = store.getState();

  if (!p2p.roomId) {
    return createElement('div', {
      className: 'flex flex-col flex-1 items-center justify-center text-muted-foreground',
    },
      createElement('span', { className: 'material-symbols-rounded text-6xl mb-4 opacity-30' }, 'hub'),
      createElement('p', { className: 'text-lg' }, 'No P2P room active'),
      createElement('p', { className: 'text-sm mt-1' }, 'Join or create a room from the sidebar'),
    );
  }

  const messages = p2p.messageLog;

  return createElement('div', {
    className: 'flex flex-col flex-1 min-w-0 min-h-0',
  },
    // Room header
    createElement('div', {
      className: 'flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2',
    },
      createElement(Button, {
        variant: 'ghost', size: 'icon-sm',
        className: 'text-muted-foreground hover:text-foreground lg:hidden',
        onClick: () => store.toggleSidebar(),
      },
        createElement('span', { className: 'material-symbols-rounded text-lg' }, 'menu'),
      ),
      createElement('span', {
        className: 'material-symbols-rounded text-lg text-primary',
      }, 'hub'),
      createElement('span', {
        className: 'text-sm font-semibold text-on-surface',
      }, p2p.roomId),
      createElement('span', {
        className: 'text-xs text-muted-foreground ml-2',
      }, `${p2p.peerList.length} peer${p2p.peerList.length !== 1 ? 's' : ''}`),
      createElement('div', { className: 'flex-1' }),
    ),

    // Messages area
    createElement('div', {
      className: 'flex-1 overflow-y-auto',
      ref: (el: HTMLElement | null) => {
        if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
      },
    },
      messages.length === 0
        ? createElement('div', {
            className: 'px-4 pt-8 pb-4 text-center',
          },
            createElement('span', { className: 'material-symbols-rounded text-4xl text-on-surface-variant/30 mb-2' }, 'chat_bubble'),
            createElement('p', { className: 'text-sm text-muted-foreground' }, 'Waiting for messages...'),
          )
        : null,

      ...messages.map((msg, i) => {
        const prev = messages[i - 1];
        const grouped = shouldGroup(msg, prev);
        const displayName = isSystemMessage(msg)
          ? 'System'
          : getDisplayUsername(
              (msg as Message).authorId,
              p2p.peerList,
              p2p.userSettings?.userId,
              p2p.userSettings?.customUsername,
            );
        return createElement(P2PMessageItem, { key: (msg as any).id, msg, grouped, displayName });
      }),

      createElement('div', { className: 'h-2' }),
    ),

    // Chat input
    createElement(P2PChatInput, null),
  );
}

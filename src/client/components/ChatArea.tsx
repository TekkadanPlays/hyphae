import { createElement } from 'inferno-create-element';
import { cn } from '../../lib/utils';
import { store } from '../store';
import { nostr } from '../nostr';
import { parseMessage, type MergedPart } from '../helpers/ircparser';
import { nickColor } from '../helpers/colorClass';
import { formatTime, formatDate } from '../helpers/format';
import type { IrcMessage } from '../../shared/types';
import { Button } from 'blazecn/Button';

function shouldGroup(msg: IrcMessage, prev: IrcMessage | undefined): boolean {
  if (!prev) return false;
  if (prev.from !== msg.from) return false;
  if (msg.type !== 'message' && msg.type !== 'action') return false;
  if (prev.type !== 'message' && prev.type !== 'action') return false;
  if (msg.time - prev.time > 5 * 60_000) return false;
  return true;
}

function isSystemMessage(type: string): boolean {
  return ['join', 'part', 'quit', 'nick', 'topic', 'mode', 'kick', 'error', 'motd', 'whois', 'lifecycle'].includes(type);
}

function isDifferentDay(a: number, b: number): boolean {
  return new Date(a).toDateString() !== new Date(b).toDateString();
}

function DateSeparator({ ts }: { ts: number }) {
  return createElement('div', {
    className: 'flex items-center gap-3 px-4 py-2 my-1',
  },
    createElement('div', { className: 'flex-1 h-px bg-border' }),
    createElement('span', {
      className: 'text-[11px] font-medium text-muted-foreground px-2',
    }, formatDate(ts)),
    createElement('div', { className: 'flex-1 h-px bg-border' }),
  );
}

// IRC color code to CSS color map (mIRC 16 colors)
const ircColors: Record<number, string> = {
  0: '#fff', 1: '#000', 2: '#00007f', 3: '#009300',
  4: '#ff0000', 5: '#7f0000', 6: '#9c009c', 7: '#fc7f00',
  8: '#ffff00', 9: '#00fc00', 10: '#009393', 11: '#00ffff',
  12: '#0000fc', 13: '#ff00ff', 14: '#7f7f7f', 15: '#d2d2d2',
};

function renderParsedText(text: string, users: string[] = []): any[] {
  const parts = parseMessage(text, users);
  return parts.map((part, pi) => {
    const fragments = part.fragments.map((frag, fi) => {
      const classes: string[] = [];
      const style: Record<string, string> = {};

      if (frag.bold) classes.push('font-bold');
      if (frag.italic) classes.push('italic');
      if (frag.underline) classes.push('underline');
      if (frag.strikethrough) classes.push('line-through');
      if (frag.monospace) classes.push('font-mono bg-surface-variant/60 px-1 rounded text-[0.85em]');
      if (frag.textColor !== undefined && ircColors[frag.textColor]) {
        style.color = ircColors[frag.textColor];
      }
      if (frag.bgColor !== undefined && ircColors[frag.bgColor]) {
        style.backgroundColor = ircColors[frag.bgColor];
      }
      if (frag.hexColor) style.color = `#${frag.hexColor}`;
      if (frag.hexBgColor) style.backgroundColor = `#${frag.hexBgColor}`;

      if (classes.length > 0 || Object.keys(style).length > 0) {
        return createElement('span', {
          key: `f${pi}_${fi}`,
          className: classes.join(' ') || undefined,
          style: Object.keys(style).length > 0 ? style : undefined,
        }, frag.text);
      }
      return frag.text;
    });

    if (part.link) {
      return createElement('a', {
        key: `p${pi}`,
        href: part.link,
        target: '_blank',
        rel: 'noopener',
        className: 'text-primary hover:underline break-all',
      }, fragments);
    }
    if (part.channel) {
      return createElement('span', {
        key: `p${pi}`,
        className: 'text-primary cursor-pointer hover:underline',
        onClick: () => {
          const net = store.getActiveNetwork();
          if (net) {
            const existing = net.channels.find(c => c.name === part.channel);
            if (existing) {
              store.setActiveChannel(net.id, part.channel!);
            } else {
              store.joinChannel(part.channel!);
            }
          }
        },
      }, fragments);
    }
    if (part.nick) {
      return createElement('span', {
        key: `p${pi}`,
        className: 'font-semibold cursor-pointer hover:underline',
        style: { color: nickColor(part.nick) },
      }, fragments);
    }
    return fragments;
  });
}

function NickAvatar({ nick }: { nick: string }) {
  // Try to get Nostr avatar if the user has a nostr pubkey mapping
  return createElement('div', {
    className: 'size-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-semibold flex-shrink-0',
    style: { color: nickColor(nick) },
  }, nick.charAt(0).toUpperCase());
}

function MessageItem({ msg, grouped }: { msg: IrcMessage; grouped: boolean }) {
  const channel = store.getActiveChannel();
  const users = channel?.users ? Object.keys(channel.users) : [];

  // WHOIS display
  if (msg.type === 'whois') {
    return createElement('div', {
      className: 'mx-4 my-2 px-3 py-2 rounded-lg bg-surface-variant/40 border border-border',
    },
      createElement('pre', {
        className: 'text-xs text-on-surface whitespace-pre-wrap font-mono leading-relaxed',
      }, msg.text),
    );
  }

  // Lifecycle messages (connection status) — distinct style
  if (msg.type === 'lifecycle') {
    return createElement('div', {
      className: 'flex items-center gap-2 px-4 py-0.5',
    },
      createElement('span', {
        className: 'text-[11px] text-muted-foreground flex-shrink-0',
      }, formatTime(msg.time)),
      createElement('span', {
        className: 'text-xs text-primary/70',
      },
        createElement('span', { className: 'mr-1' }, '●'),
        msg.text,
      ),
    );
  }

  if (isSystemMessage(msg.type)) {
    return createElement('div', {
      className: 'flex items-center gap-2 px-4 py-0.5',
    },
      createElement('span', {
        className: 'text-[11px] text-muted-foreground flex-shrink-0',
      }, formatTime(msg.time)),
      createElement('span', {
        className: cn(
          'text-xs italic',
          msg.type === 'error' ? 'text-destructive' : 'text-muted-foreground',
        ),
      },
        msg.type === 'join' ? createElement('span', null,
          createElement('span', { className: 'text-online' }, '→ '),
          ...renderParsedText(msg.text, users),
        )
        : msg.type === 'part' || msg.type === 'quit' ? createElement('span', null,
          createElement('span', { className: 'text-destructive' }, '← '),
          ...renderParsedText(msg.text, users),
        )
        : msg.type === 'motd' ? createElement('pre', {
            className: 'text-xs text-muted-foreground whitespace-pre-wrap font-mono',
          }, msg.text)
        : createElement('span', null, ...renderParsedText(msg.text, users)),
      ),
    );
  }

  if (msg.type === 'notice') {
    return createElement('div', {
      className: 'flex gap-2 px-4 py-0.5',
    },
      createElement('span', {
        className: 'text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right',
      }, formatTime(msg.time)),
      createElement('span', {
        className: 'text-sm text-primary/80',
      },
        msg.from ? createElement('span', { className: 'font-semibold' }, `-${msg.from}- `) : null,
        ...renderParsedText(msg.text, users),
      ),
    );
  }

  if (msg.type === 'action') {
    return createElement('div', {
      className: 'flex gap-2 px-4 py-0.5',
    },
      createElement('span', {
        className: 'text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right',
      }, formatTime(msg.time)),
      createElement('span', {
        className: 'text-sm italic text-on-surface/80',
      },
        createElement('span', {
          className: 'font-semibold',
          style: msg.from ? { color: nickColor(msg.from) } : undefined,
        }, `* ${msg.from} `),
        ...renderParsedText(msg.text, users),
      ),
    );
  }

  // Regular message
  if (grouped) {
    return createElement('div', {
      className: cn(
        'group flex gap-2 px-4 py-0.5 hover:bg-accent/10 transition-colors',
        msg.highlight && 'bg-destructive/10 border-l-2 border-destructive',
      ),
    },
      createElement('span', {
        className: 'text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 w-10 text-right',
      }, formatTime(msg.time)),
      // Spacer for avatar column
      createElement('div', { className: 'size-8 flex-shrink-0' }),
      createElement('p', {
        className: 'text-sm text-on-surface leading-relaxed break-words min-w-0 flex-1',
      }, ...renderParsedText(msg.text, users)),
    );
  }

  return createElement('div', {
    className: cn(
      'group flex gap-2 px-4 pt-2 pb-0.5 hover:bg-accent/10 transition-colors',
      msg.highlight && 'bg-destructive/10 border-l-2 border-destructive',
    ),
  },
    createElement('span', {
      className: 'text-[11px] text-muted-foreground flex-shrink-0 w-10 text-right pt-0.5',
    }, formatTime(msg.time)),
    // Avatar
    createElement(NickAvatar, { nick: msg.from || '?' }),
    createElement('div', { className: 'flex-1 min-w-0' },
      createElement('span', {
        className: cn(
          'text-sm font-semibold cursor-pointer hover:underline',
        ),
        style: msg.self ? undefined : msg.from ? { color: nickColor(msg.from) } : undefined,
      }, msg.from),
      createElement('p', {
        className: 'text-sm text-on-surface leading-relaxed break-words',
      }, ...renderParsedText(msg.text, users)),
    ),
  );
}

function ChatInput() {
  const channel = store.getActiveChannel();
  const placeholder = channel ? `Message ${channel.name}` : 'Select a channel';

  return createElement('div', {
    className: 'px-4 pb-4 pt-2',
  },
    createElement('form', {
      className: 'flex items-center gap-2 rounded-xl border border-input bg-card/50 px-3 py-1.5 focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-all',
      onSubmit: (e: any) => {
        e.preventDefault();
        const input = e.target.elements.message;
        const text = input.value.trim();
        if (text) {
          store.sendMessage(text);
          input.value = '';
        }
      },
    },
      createElement('input', {
        name: 'message',
        className: 'flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none h-9',
        placeholder,
        autoComplete: 'off',
        autoFocus: true,
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

export function ChatArea() {
  const state = store.getState();
  const network = store.getActiveNetwork();
  const channel = store.getActiveChannel();

  if (!network || !channel) {
    return createElement('div', {
      className: 'flex flex-col flex-1 items-center justify-center text-muted-foreground',
    },
      createElement('span', { className: 'material-symbols-rounded text-6xl mb-4 opacity-30' }, 'forum'),
      createElement('p', { className: 'text-lg' }, 'No channel selected'),
      createElement('p', { className: 'text-sm mt-1' }, 'Connect to a network to get started'),
    );
  }

  const messages = channel.messages;

  return createElement('div', {
    className: 'flex flex-col flex-1 min-w-0 min-h-0',
  },
    // Channel header
    createElement('div', {
      className: 'flex items-center h-12 px-4 flex-shrink-0 border-b border-border gap-2',
    },
      // Sidebar toggle (mobile)
      createElement(Button, {
        variant: 'ghost', size: 'icon-sm',
        className: 'text-muted-foreground hover:text-foreground lg:hidden',
        onClick: () => store.toggleSidebar(),
      },
        createElement('span', { className: 'material-symbols-rounded text-lg' }, 'menu'),
      ),
      // Channel icon
      createElement('span', {
        className: 'material-symbols-rounded text-lg text-on-surface-variant',
      }, channel.type === 'channel' ? 'tag' : channel.type === 'query' ? 'person' : 'dns'),
      // Channel name
      createElement('span', {
        className: 'text-sm font-semibold text-on-surface',
      }, channel.type === 'channel' ? channel.name.replace(/^#/, '') : channel.name),
      // Topic
      channel.topic
        ? createElement('span', {
            className: 'text-xs text-muted-foreground ml-2 truncate hidden md:block',
          },
            createElement('span', { className: 'text-border mr-2' }, '|'),
            channel.topic,
          )
        : null,
      createElement('div', { className: 'flex-1' }),
      // Header actions
      createElement('div', { className: 'flex items-center gap-0.5' },
        channel.type === 'channel'
          ? createElement(Button, {
              variant: 'ghost', size: 'icon-sm',
              className: 'text-muted-foreground hover:text-foreground',
              onClick: () => store.toggleUserlist(),
            },
              createElement('span', { className: 'material-symbols-rounded text-lg' }, 'group'),
            )
          : null,
      ),
    ),

    // Messages area
    createElement('div', {
      className: 'flex-1 overflow-y-auto',
      id: 'messages-scroll',
      // Auto-scroll to bottom on new messages
      ref: (el: HTMLElement | null) => {
        if (el) {
          requestAnimationFrame(() => {
            el.scrollTop = el.scrollHeight;
          });
        }
      },
    },
      // Channel welcome / info
      messages.length === 0
        ? createElement('div', {
            className: 'px-4 pt-8 pb-4 text-center',
          },
            createElement('span', { className: 'material-symbols-rounded text-4xl text-on-surface-variant/30 mb-2' }, 'chat_bubble'),
            createElement('p', { className: 'text-sm text-muted-foreground' }, `This is the beginning of ${channel.name}`),
          )
        : null,

      // Messages with date separators
      ...messages.flatMap((msg, i) => {
        const prev = messages[i - 1];
        const grouped = shouldGroup(msg, prev);
        const items: any[] = [];

        // Insert date separator when day changes
        if (i === 0 || (prev && isDifferentDay(prev.time, msg.time))) {
          items.push(createElement(DateSeparator, { key: `date_${msg.time}`, ts: msg.time }));
        }

        items.push(createElement(MessageItem, { key: msg.id, msg, grouped }));
        return items;
      }),

      // Bottom padding
      createElement('div', { className: 'h-2' }),
    ),

    // Chat input
    createElement(ChatInput, null),
  );
}

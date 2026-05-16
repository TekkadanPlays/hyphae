import { createElement } from 'inferno-create-element';
import { S, signal } from 'blazecn';
import { store, profileTick } from '../store';
import { nostr } from '../nostr';
import type { ConnectOptions } from '../../shared/types';
import { Button } from 'blazecn/Button';
import { Input } from 'blazecn/Input';
import { Label } from 'blazecn/Label';
import { Switch } from 'blazecn/Switch';
import { Separator } from 'blazecn/Separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'blazecn/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'blazecn/Tabs';

// Shared field wrapper
function Field({ label, htmlFor, children, className }: { label: string; htmlFor?: string; children?: any; className?: string }) {
  return createElement('div', { className: `grid gap-2 ${className || ''}` },
    createElement(Label, { htmlFor, className: 'text-muted-foreground text-xs' }, label),
    children,
  );
}

// Hidden input that mirrors a boolean state for form submission
function HiddenBool({ name, value }: { name: string; value: boolean }) {
  return createElement('input', { type: 'hidden', name, value: value ? '1' : '' });
}

const _authTab = signal('none');
const _tls = signal(true);
const _nsRegister = signal(false);

export function ConnectForm() {
  return S(() => {
    const pubkey = store.nostrPubkey.value;
    const nets = store.networks.value;
    profileTick.value; // re-render on profile updates
    const authTab = _authTab.value;
    const tls = _tls.value;
    const nsRegister = _nsRegister.value;
  const onSubmit = (e: any) => {
    e.preventDefault();
    const f = e.target;
    const nsPassword = f.elements.ns_password?.value || '';
    const options: ConnectOptions = {
      name: f.elements.name.value || f.elements.host.value,
      host: f.elements.host.value,
      port: parseInt(f.elements.port.value) || 6667,
      tls: f.elements.tls_val.value === '1',
      nick: f.elements.nick.value || 'hyphae_user',
      username: f.elements.username?.value || undefined,
      realname: f.elements.realname?.value || undefined,
      password: authTab === 'password' ? (f.elements.password?.value || undefined) : undefined,
      saslAccount: authTab === 'sasl' ? (f.elements.sasl_account?.value || undefined) : undefined,
      saslPassword: authTab === 'sasl' ? (f.elements.sasl_password?.value || undefined) : undefined,
      autojoin: f.elements.autojoin.value
        ? f.elements.autojoin.value.split(',').map((s: string) => s.trim()).filter(Boolean)
        : undefined,
      nickservPassword: authTab === 'nostr' ? (nsPassword || undefined) : undefined,
      nickservRegister: authTab === 'nostr' ? (f.elements.ns_register_val?.value === '1' || undefined) : undefined,
      nostrPubkey: (authTab === 'nostr' && nsPassword && pubkey) ? pubkey : undefined,
    };
    store.connect(options);
  };

  const setAuth = (t: string) => { _authTab.value = t; };

  return createElement(Card, {
    className: 'w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col border-border/50 shadow-2xl',
  },
    createElement('form', { onSubmit, className: 'flex flex-col flex-1 min-h-0' },

      // Header
      createElement(CardHeader, { className: 'pb-2' },
        createElement('div', { className: 'flex items-center gap-3' },
          createElement('div', {
            className: 'size-10 rounded-xl bg-primary/15 flex items-center justify-center text-xl',
          }, '🦦'),
          createElement('div', null,
            createElement(CardTitle, null, 'Connect to IRC'),
            createElement(CardDescription, null, 'Add a new network connection'),
          ),
        ),
      ),

      // Scrollable content
      createElement(CardContent, { className: 'flex flex-col flex-1 min-h-0 gap-0 pb-0' },
        createElement('div', { className: 'flex-1 overflow-y-auto min-h-0 space-y-4 pb-2' },

          // ─── SERVER ───
          // Server + Port
          createElement('div', { className: 'grid grid-cols-[1fr_80px] gap-3' },
            createElement(Field, { label: 'Server', htmlFor: 'host' },
              createElement(Input, {
                id: 'host', name: 'host', placeholder: 'irc.example.com',
              }),
            ),
            createElement(Field, { label: 'Port', htmlFor: 'port' },
              createElement(Input, {
                id: 'port', name: 'port', type: 'number', placeholder: '6697',
                value: '6697',
              }),
            ),
          ),

          // TLS toggle + Network name
          createElement('div', { className: 'grid grid-cols-2 gap-3' },
            createElement(Field, { label: 'Network Name', htmlFor: 'name' },
              createElement(Input, {
                id: 'name', name: 'name', placeholder: 'My Network',
              }),
            ),
            createElement('div', { className: 'grid gap-2' },
              createElement(Label, { className: 'text-muted-foreground text-xs' }, 'Secure Connection'),
              createElement('div', { className: 'flex items-center gap-2 h-9' },
                createElement(Switch, {
                  checked: _tls,
                  onChange: (v: boolean) => { _tls.value = v; },
                }),
                createElement('span', { className: 'text-sm text-muted-foreground' }, tls ? 'TLS On' : 'TLS Off'),
                createElement(HiddenBool, { name: 'tls_val', value: tls }),
              ),
            ),
          ),

          createElement(Separator, null),

          // ─── IDENTITY ───
          createElement(Field, { label: 'Nickname', htmlFor: 'nick' },
            createElement(Input, {
              id: 'nick', name: 'nick', placeholder: 'hyphae_user',
            }),
          ),

          createElement('div', { className: 'grid grid-cols-2 gap-3' },
            createElement(Field, { label: 'Username', htmlFor: 'username' },
              createElement(Input, {
                id: 'username', name: 'username', placeholder: 'Optional',
              }),
            ),
            createElement(Field, { label: 'Real Name', htmlFor: 'realname' },
              createElement(Input, {
                id: 'realname', name: 'realname', placeholder: 'Optional',
              }),
            ),
          ),

          // ─── AUTO-JOIN ───
          createElement(Field, { label: 'Auto-join Channels', htmlFor: 'autojoin' },
            createElement(Input, {
              id: 'autojoin', name: 'autojoin', placeholder: '#general, #random',
            }),
          ),

          createElement(Separator, null),

          // ─── AUTHENTICATION METHOD (tabs) ───
          createElement('div', { className: 'space-y-1' },
            createElement('h3', { className: 'text-sm font-medium text-foreground' }, 'Authentication'),
            createElement('p', { className: 'text-xs text-muted-foreground' }, 'Choose how to authenticate with this server.'),
          ),

          createElement(Tabs, { value: authTab, className: 'w-full' },
            createElement(TabsList, { className: 'w-full grid grid-cols-4' },
              createElement(TabsTrigger, {
                value: 'none', active: authTab === 'none',
                onClick: () => setAuth('none'),
              }, 'None'),
              createElement(TabsTrigger, {
                value: 'password', active: authTab === 'password',
                onClick: () => setAuth('password'),
              }, 'Password'),
              createElement(TabsTrigger, {
                value: 'sasl', active: authTab === 'sasl',
                onClick: () => setAuth('sasl'),
              }, 'SASL'),
              createElement(TabsTrigger, {
                value: 'nostr', active: authTab === 'nostr',
                onClick: () => setAuth('nostr'),
              }, '⚡ Nostr'),
            ),

            // None
            createElement(TabsContent, { value: 'none', active: authTab === 'none', className: 'pt-3' },
              createElement('p', {
                className: 'text-sm text-muted-foreground text-center py-4',
              }, 'No authentication. Connect as a guest.'),
            ),

            // Password
            createElement(TabsContent, { value: 'password', active: authTab === 'password', className: 'pt-3 space-y-4' },
              createElement('p', {
                className: 'text-xs text-muted-foreground',
              }, 'Server password sent during connection. Most servers don\'t require this.'),
              createElement(Field, { label: 'Server Password', htmlFor: 'password' },
                createElement(Input, {
                  id: 'password', name: 'password', type: 'password', placeholder: 'Server password',
                }),
              ),
            ),

            // SASL
            createElement(TabsContent, { value: 'sasl', active: authTab === 'sasl', className: 'pt-3 space-y-4' },
              createElement('p', {
                className: 'text-xs text-muted-foreground',
              }, 'SASL PLAIN authentication during connection. Required by some networks like Libera.Chat.'),
              createElement('div', { className: 'grid grid-cols-2 gap-3' },
                createElement(Field, { label: 'Account', htmlFor: 'sasl_account' },
                  createElement(Input, {
                    id: 'sasl_account', name: 'sasl_account', placeholder: 'Account name',
                  }),
                ),
                createElement(Field, { label: 'Password', htmlFor: 'sasl_password' },
                  createElement(Input, {
                    id: 'sasl_password', name: 'sasl_password', type: 'password', placeholder: 'Password',
                  }),
                ),
              ),
            ),

            // Nostr
            createElement(TabsContent, { value: 'nostr', active: authTab === 'nostr', className: 'pt-3 space-y-4' },
              createElement('p', {
                className: 'text-xs text-muted-foreground',
              }, 'Use your Nostr identity to register or identify with NickServ. Requires a NIP-07 browser extension.'),

              createElement(Button, {
                variant: pubkey ? 'secondary' : 'outline',
                className: pubkey
                  ? 'w-full border-online/30 text-online bg-online/10 hover:bg-online/15 h-auto py-2'
                  : 'w-full',
                onClick: async () => {
                  if (pubkey) return;
                  try {
                    const pubkey = await nostr.loginWithExtension();
                    store.setNostrPubkey(pubkey);
                  } catch (err: any) {
                    alert(`Error: ${err.message}`);
                  }
                },
              },
                pubkey
                  ? (() => {
                      const profile = nostr.getProfile(pubkey!);
                      return createElement('div', { className: 'flex items-center gap-2.5 w-full' },
                        profile?.picture
                          ? createElement('img', {
                              src: profile.picture,
                              className: 'size-7 rounded-full object-cover flex-shrink-0',
                              onError: (e: any) => { e.target.style.display = 'none'; },
                            })
                          : createElement('span', { className: 'text-base' }, '⚡'),
                        createElement('div', { className: 'flex flex-col items-start min-w-0' },
                          createElement('span', { className: 'text-xs font-semibold truncate' },
                            profile?.displayName || profile?.name || 'Connected',
                          ),
                          createElement('span', { className: 'text-[10px] opacity-70 truncate' },
                            pubkey!.slice(0, 16) + '…',
                          ),
                        ),
                      );
                    })()
                  : createElement('span', { className: 'flex items-center gap-1.5' },
                      createElement('span', null, '⚡'),
                      'Connect Nostr Identity',
                    ),
              ),

              pubkey
                ? createElement('div', { className: 'space-y-4' },
                    createElement(Separator, null),

                    createElement(Field, { label: 'NickServ Password', htmlFor: 'ns_password' },
                      createElement(Input, {
                        id: 'ns_password', name: 'ns_password', type: 'password',
                        placeholder: 'Password for NickServ account',
                      }),
                    ),

                    createElement('div', { className: 'flex items-center gap-3' },
                      createElement(Switch, {
                        checked: _nsRegister,
                        onChange: (v: boolean) => { _nsRegister.value = v; },
                      }),
                      createElement(HiddenBool, { name: 'ns_register_val', value: nsRegister }),
                      createElement('div', null,
                        createElement(Label, null, 'Register new account'),
                        createElement('p', { className: 'text-xs text-muted-foreground mt-0.5' },
                          'Server will send a verification code via Nostr DM'),
                      ),
                    ),
                  )
                : createElement('div', {
                    className: 'rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground',
                  }, 'Connect your Nostr identity to enable NickServ integration'),
            ),
          ),
        ),
      ),

      // Footer
      createElement(CardFooter, { className: 'gap-3 pt-4 pb-6' },
        nets.length > 0
          ? createElement(Button, {
              variant: 'ghost',
              className: 'flex-1',
              onClick: () => store.closeConnectForm(),
            }, 'Cancel')
          : null,
        createElement(Button, {
          type: 'submit',
          className: 'flex-1',
        }, 'Connect'),
      ),
    ),
  );
  });
}

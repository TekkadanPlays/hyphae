# 𓍊𓋼𓆏𓋼𓍊 Hyphae

IRC chat with Nostr identity, woven together.

Built with **InfernoJS**, **Bun**, and **Tailwind CSS v4**. Nostr-native identity via NIP-07.

## Quick Start

```bash
# Install dependencies
bun install

# Build Tailwind CSS + client JS bundle
bun run build:css
bun run build:client

# Start dev server (with hot reload)
bun run dev
```

Then open http://localhost:5173

## Architecture

```
Browser (InfernoJS SPA)
  ↕ WebSocket (/ws)
Bun Server (server.tsx)
  ↕ Raw TCP (IRC protocol)
Ergo IRC Server
```

### Stack

- **[Bun](https://bun.sh)** — Runtime, bundler, package manager
- **[InfernoJS](https://infernojs.org)** — Client-side UI rendering
- **[Tailwind CSS v4](https://tailwindcss.com)** — Dark theme with oklch design tokens
- **[Kaji](https://github.com/TekkadanPlays/kaji)** — Nostr protocol library (NIP-07 auth, Kind:0 profiles)
- **[BlazeCN](https://github.com/TekkadanPlays/blazecn)** — UI component primitives for InfernoJS

### Server (Bun)

- `src/server.tsx` — HTTP server + WebSocket upgrade handler
- `src/server/irc.ts` — Raw IRC protocol client using `Bun.connect()` TCP
- `src/server/bridge.ts` — WebSocket bridge: translates client commands ↔ IRC events

### Client (Browser)

- `src/client/index.ts` — Entry point, mounts InfernoJS app
- `src/client/socket.ts` — WebSocket connection to backend
- `src/client/store.ts` — Reactive state store (networks, channels, messages, UI)
- `src/client/nostr.ts` — Nostr manager (NIP-07 login, profile fetching via Kaji)
- `src/client/components/` — UI components:
  - `App.tsx` — Root layout with Home / IRC routing
  - `NetworkList.tsx` — Orb sidebar (profile, servers, settings)
  - `HomePage.tsx` — Landing page with Lander + Profile tabs
  - `SettingsPage.tsx` — Unified settings (Application / IRC sections)
  - `ChannelSidebar.tsx` — IRC channel/query list
  - `ChatArea.tsx` — IRC messages, header, composer
  - `UserList.tsx` — IRC channel member list
  - `ConnectForm.tsx` — IRC connection form with Nostr auth

### Shared

- `src/shared/types.ts` — TypeScript types shared between server and client

## Features

### IRC
- Full IRC protocol: JOIN, PART, QUIT, NICK, PRIVMSG, NOTICE, TOPIC, KICK, MODE
- CAP negotiation (multi-prefix, away-notify, account-notify, SASL)
- SASL PLAIN authentication
- NickServ integration (REGISTER, IDENTIFY, VERIFY)
- Message grouping, system messages, highlights
- Unread counts and mention badges

### Nostr Integration
- **NIP-07** browser extension login (Alby, nos2x)
- **NickServ REGISTER** with Nostr identifier (npub/NIP-05/hex pubkey)
- **Kind:0 profile fetching** via Kaji's ProfileStore for user avatars
- Profile image shown in orb sidebar when signed in

## Credits

Hyphae is built on the shoulders of:

- **[Stoat Chat](https://github.com/stoatchat/for-web)** — Original IRC frontend foundation
- **[Kaji](https://github.com/TekkadanPlays/kaji)** — Nostr protocol library
- **[BlazeCN](https://github.com/TekkadanPlays/blazecn)** — UI component primitives

## License

MIT

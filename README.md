# 𓍊𓋼𓆏𓋼𓍊 Hyphae

IRC and peer-to-peer chat, woven together.

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
  ↕ Raw TCP (IRC protocol)     ↕ WebRTC (P2P via trystero)
Ergo IRC Server                 Peer-to-peer rooms
```

### Stack

- **[Bun](https://bun.sh)** — Runtime, bundler, package manager
- **[InfernoJS](https://infernojs.org)** — Client-side UI rendering
- **[Tailwind CSS v4](https://tailwindcss.com)** — Dark theme with oklch design tokens
- **[Kaji](https://github.com/TekkadanPlays/kaji)** — Nostr protocol library (NIP-07 auth, Kind:0 profiles)
- **[BlazeCN](https://github.com/TekkadanPlays/blazecn)** — UI component primitives for InfernoJS
- **[trystero](https://github.com/dmotz/trystero)** — Serverless P2P WebRTC rooms

### Server (Bun)

- `src/server.tsx` — HTTP server + WebSocket upgrade handler
- `src/server/irc.ts` — Raw IRC protocol client using `Bun.connect()` TCP
- `src/server/bridge.ts` — WebSocket bridge: translates client commands ↔ IRC events

### Client (Browser)

- `src/client/index.ts` — Entry point, mounts InfernoJS app
- `src/client/socket.ts` — WebSocket connection to backend
- `src/client/store.ts` — Reactive state store (networks, channels, messages, UI)
- `src/client/nostr.ts` — Nostr manager (NIP-07 login, profile fetching via Kaji)
- `src/client/p2p/` — P2P chat module (room manager, store, config)
- `src/client/components/` — UI components:
  - `App.tsx` — Root layout with 3-mode routing (Home / IRC / P2P)
  - `NetworkList.tsx` — Orb sidebar (profile, servers, rooms, settings)
  - `HomePage.tsx` — Landing page with Lander + Profile tabs
  - `SettingsPage.tsx` — Unified settings (Application / IRC / P2P sections)
  - `ChannelSidebar.tsx` — IRC channel/query list
  - `ChatArea.tsx` — IRC messages, header, composer
  - `UserList.tsx` — IRC channel member list
  - `ConnectForm.tsx` — IRC connection form with Nostr auth
  - `P2PSidebar.tsx` — P2P room list
  - `P2PChatArea.tsx` — P2P messages + media
  - `P2PPeerList.tsx` — Connected peers

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

### P2P Chat
- Serverless peer-to-peer rooms via WebRTC
- Audio/video calls, screen sharing
- File transfers with progress
- Direct messages between peers
- Peer verification (RSA challenge/response)
- Community rooms + custom room creation

### Nostr Integration
- **NIP-07** browser extension login (Alby, nos2x)
- **NickServ REGISTER** with Nostr identifier (npub/NIP-05/hex pubkey)
- **Kind:0 profile fetching** via Kaji's ProfileStore for user avatars
- Profile image shown in orb sidebar when signed in

## Credits

Hyphae is built on the shoulders of:

- **[Stoat Chat](https://github.com/stoatchat/for-web)** — Original IRC frontend foundation
- **[Chitchatter](https://github.com/jeremyckahn/chitchatter)** — P2P chat architecture, forked and ported to InfernoJS
- **[Kaji](https://github.com/TekkadanPlays/kaji)** — Nostr protocol library
- **[BlazeCN](https://github.com/TekkadanPlays/blazecn)** — UI component primitives

## License

MIT

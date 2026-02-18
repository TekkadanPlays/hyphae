// Shared types between server and client

export interface IrcUser {
  nick: string;
  ident?: string;
  hostname?: string;
  realname?: string;
  away?: string;
  modes: string[];
  account?: string;
  // Nostr-enriched fields (populated client-side via Kaji)
  nostrPubkey?: string;
  nostrPicture?: string;
  nostrDisplayName?: string;
}

export interface IrcMessage {
  id: string;
  time: number;
  type: MessageType;
  from?: string;
  text: string;
  self?: boolean;
  highlight?: boolean;
  // For nick changes, kicks, etc.
  target?: string;
  newNick?: string;
  reason?: string;
}

export enum MessageType {
  MESSAGE = 'message',
  ACTION = 'action',
  NOTICE = 'notice',
  JOIN = 'join',
  PART = 'part',
  QUIT = 'quit',
  KICK = 'kick',
  NICK = 'nick',
  TOPIC = 'topic',
  MODE = 'mode',
  ERROR = 'error',
  MOTD = 'motd',
  RAW = 'raw',
  WHOIS = 'whois',
  LIFECYCLE = 'lifecycle',
}

export enum ChanType {
  CHANNEL = 'channel',
  QUERY = 'query',
  LOBBY = 'lobby',
  SPECIAL = 'special',
}

export interface IrcChannel {
  name: string;
  type: ChanType;
  topic: string;
  topicSetBy?: string;
  key?: string;
  joined: boolean;
  unread: number;
  highlight: number;
  users: Record<string, IrcUser>;
  messages: IrcMessage[];
  muted: boolean;
}

export interface IrcNetwork {
  id: string;
  name: string;
  host: string;
  port: number;
  tls: boolean;
  nick: string;
  username: string;
  realname: string;
  password?: string;
  saslAccount?: string;
  saslPassword?: string;
  connected: boolean;
  channels: IrcChannel[];
  serverOptions: Record<string, string>;
}

// WebSocket message types: client -> server
export type ClientCommand =
  | { type: 'connect'; network: ConnectOptions }
  | { type: 'disconnect'; networkId: string }
  | { type: 'message'; networkId: string; target: string; text: string }
  | { type: 'join'; networkId: string; channel: string; key?: string }
  | { type: 'part'; networkId: string; channel: string; reason?: string }
  | { type: 'nick'; networkId: string; nick: string }
  | { type: 'raw'; networkId: string; command: string }
  | { type: 'topic'; networkId: string; channel: string; topic?: string }
  | { type: 'nostr_register'; networkId: string; password: string; nostrId: string }
  | { type: 'nostr_verify'; networkId: string; account: string; code: string }
  | { type: 'nostr_identify'; networkId: string; account: string; password: string }
  | { type: 'whois'; networkId: string; nick: string };

export interface ConnectOptions {
  name: string;
  host: string;
  port: number;
  tls: boolean;
  nick: string;
  username?: string;
  realname?: string;
  password?: string;
  saslAccount?: string;
  saslPassword?: string;
  autojoin?: string[];
  // Post-connect NickServ commands
  nickservPassword?: string;
  nickservRegister?: boolean;  // true = REGISTER, false = IDENTIFY
  nostrPubkey?: string;        // hex pubkey for Nostr registration
}

// WebSocket message types: server -> client
export type ServerEvent =
  | { type: 'network:new'; network: IrcNetwork }
  | { type: 'network:status'; networkId: string; connected: boolean }
  | { type: 'network:remove'; networkId: string }
  | { type: 'channel:new'; networkId: string; channel: IrcChannel }
  | { type: 'channel:remove'; networkId: string; channelName: string }
  | { type: 'channel:topic'; networkId: string; channelName: string; topic: string; setBy?: string }
  | { type: 'channel:users'; networkId: string; channelName: string; users: Record<string, IrcUser> }
  | { type: 'channel:user_join'; networkId: string; channelName: string; user: IrcUser }
  | { type: 'channel:user_part'; networkId: string; channelName: string; nick: string; reason?: string }
  | { type: 'channel:user_quit'; networkId: string; nick: string; reason?: string }
  | { type: 'channel:user_nick'; networkId: string; oldNick: string; newNick: string }
  | { type: 'message'; networkId: string; channelName: string; message: IrcMessage }
  | { type: 'motd'; networkId: string; text: string }
  | { type: 'error'; networkId: string; text: string }
  | { type: 'nickserv'; networkId: string; text: string }
  | { type: 'whois'; networkId: string; nick: string; lines: string[] };

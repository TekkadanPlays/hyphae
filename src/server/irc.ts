// Raw IRC protocol client using Bun's native TCP sockets
import type { Socket } from 'bun';
import type {
  IrcUser, IrcChannel, IrcMessage, IrcNetwork,
  ConnectOptions, ChanType, MessageType,
} from '../shared/types';

type IrcEventHandler = (event: string, data: any) => void;

interface IrcLine {
  prefix?: string;
  nick?: string;
  ident?: string;
  hostname?: string;
  command: string;
  params: string[];
  tags?: Record<string, string>;
}

function parseLine(raw: string): IrcLine {
  let prefix: string | undefined;
  let nick: string | undefined;
  let ident: string | undefined;
  let hostname: string | undefined;
  let tags: Record<string, string> | undefined;
  let rest = raw;

  // IRCv3 message tags: @tag1=value;tag2=value :prefix COMMAND params
  if (rest.startsWith('@')) {
    const spaceIdx = rest.indexOf(' ');
    if (spaceIdx !== -1) {
      const tagStr = rest.slice(1, spaceIdx);
      tags = {};
      for (const part of tagStr.split(';')) {
        const eqIdx = part.indexOf('=');
        if (eqIdx !== -1) {
          tags[part.slice(0, eqIdx)] = part.slice(eqIdx + 1);
        } else {
          tags[part] = '';
        }
      }
      rest = rest.slice(spaceIdx + 1);
      // Skip any extra spaces
      while (rest.startsWith(' ')) rest = rest.slice(1);
    }
  }

  if (rest.startsWith(':')) {
    const spaceIdx = rest.indexOf(' ');
    prefix = rest.slice(1, spaceIdx);
    rest = rest.slice(spaceIdx + 1);

    // Parse nick!ident@hostname
    const bangIdx = prefix.indexOf('!');
    const atIdx = prefix.indexOf('@');
    if (bangIdx !== -1 && atIdx !== -1) {
      nick = prefix.slice(0, bangIdx);
      ident = prefix.slice(bangIdx + 1, atIdx);
      hostname = prefix.slice(atIdx + 1);
    } else {
      nick = prefix;
    }
  }

  const params: string[] = [];
  while (rest.length > 0) {
    if (rest.startsWith(':')) {
      params.push(rest.slice(1));
      break;
    }
    const spaceIdx = rest.indexOf(' ');
    if (spaceIdx === -1) {
      params.push(rest);
      break;
    }
    params.push(rest.slice(0, spaceIdx));
    rest = rest.slice(spaceIdx + 1);
  }

  const command = params.shift()?.toUpperCase() || '';

  return { prefix, nick, ident, hostname, command, params, tags };
}

let networkCounter = 0;

export class IrcConnection {
  readonly id: string;
  readonly options: ConnectOptions;
  private socket: ReturnType<typeof Bun.connect> | null = null;
  private tcpSocket: any = null;
  private buffer = '';
  private emit: IrcEventHandler;
  private _connected = false;
  private _nick: string;
  private channels: Map<string, { users: Map<string, IrcUser>; topic: string; topicSetBy?: string }> = new Map();
  private serverOptions: Record<string, string> = {};
  private motdLines: string[] = [];
  private capNegotiating = false;
  private saslInProgress = false;
  private keepNick: string | null = null;
  private registered = false;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastDataTime = Date.now();
  private whoisBuffer: Map<string, string[]> = new Map();
  private capLsAccumulator: string[] = [];  // accumulate multi-line CAP LS
  private capLsMultiline = false;
  private registrationTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private userDisconnected = false;
  private enabledCaps: string[] = [];

  constructor(options: ConnectOptions, emit: IrcEventHandler) {
    this.id = `net_${++networkCounter}_${Date.now().toString(36)}`;
    this.options = options;
    this._nick = options.nick;
    this.emit = emit;
  }

  get nick(): string { return this._nick; }
  get connected(): boolean { return this._connected; }

  async connect(): Promise<void> {
    const self = this;
    this.userDisconnected = false;
    this.registered = false;
    this.capNegotiating = false;
    this.saslInProgress = false;
    this.capLsAccumulator = [];
    this.capLsMultiline = false;
    this.enabledCaps = [];
    this.buffer = '';

    this.emit('lifecycle', { text: `Connecting to ${this.options.host}:${this.options.port}${this.options.tls ? ' (TLS)' : ''}…` });

    try {
      this.tcpSocket = await Bun.connect({
        hostname: this.options.host,
        port: this.options.port,
        tls: this.options.tls ? { rejectUnauthorized: false } : false,
        socket: {
          open(socket) {
            self._connected = true;
            self.lastDataTime = Date.now();
            self.reconnectAttempt = 0;
            self.emit('connected', {});
            self.emit('lifecycle', { text: 'Connected to the network.' });

            // Start registration timeout — if we don't get 001 within 30s, something is wrong
            self.startRegistrationTimeout();

            // IRC registration sequence:
            // 1. CAP LS to discover capabilities
            // 2. PASS (if server password set)
            // 3. NICK + USER
            // 4. Wait for CAP response, negotiate, then CAP END
            // 5. Server sends 001 RPL_WELCOME when registration completes
            self.send('CAP LS 302');

            if (self.options.password) {
              self.send(`PASS ${self.options.password}`);
            }
            self.send(`NICK ${self.options.nick}`);
            self.send(`USER ${self.options.username || self.options.nick} 0 * :${self.options.realname || self.options.nick}`);
          },
          data(socket, data) {
            self.lastDataTime = Date.now(); // Any data = connection is alive
            self.onData(Buffer.from(data).toString('utf-8'));
          },
          close() {
            const wasConnected = self._connected;
            self._connected = false;
            self.registered = false;
            self.stopPingTimer();
            self.clearRegistrationTimeout();

            // Reset keepNick on disconnect
            if (self.keepNick) {
              self._nick = self.keepNick;
              self.keepNick = null;
            }

            self.emit('disconnected', {});

            // Auto-reconnect unless user explicitly disconnected
            if (wasConnected && !self.userDisconnected) {
              self.scheduleReconnect();
            }
          },
          error(socket, error) {
            self.emit('error', { message: `Socket error: ${error.message}` });
          },
        },
      });
    } catch (err: any) {
      this.emit('error', { message: `Connection failed: ${err.message}` });
      // Schedule reconnect on connection failure too
      if (!this.userDisconnected) {
        this.scheduleReconnect();
      }
    }
  }

  disconnect(reason?: string) {
    this.userDisconnected = true;
    this.stopPingTimer();
    this.clearRegistrationTimeout();
    this.cancelReconnect();
    if (this.tcpSocket) {
      try { this.send(`QUIT :${reason || 'Leaving'}`); } catch {}
      setTimeout(() => {
        try { this.tcpSocket?.end(); } catch {}
        this.tcpSocket = null;
        this._connected = false;
        this.registered = false;
      }, 500);
    }
  }

  private startPingTimer() {
    this.stopPingTimer();
    this.lastDataTime = Date.now();
    this.pingTimer = setInterval(() => {
      // Check if we've received ANY data recently (not just PONG)
      // This is how irc-framework does it — any incoming data = alive
      if (Date.now() - this.lastDataTime > 120_000) {
        this.emit('lifecycle', { text: 'Ping timeout, disconnecting…' });
        // Don't set userDisconnected — allow auto-reconnect
        this.stopPingTimer();
        this.clearRegistrationTimeout();
        if (this.tcpSocket) {
          try { this.send('QUIT :Ping timeout'); } catch {}
          setTimeout(() => {
            try { this.tcpSocket?.end(); } catch {}
            this.tcpSocket = null;
          }, 500);
        }
        return;
      }
      // Send PING to keep the connection alive and provoke a PONG
      try { this.send(`PING :hyphae-${Date.now()}`); } catch {}
    }, 30_000);
  }

  private stopPingTimer() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private startRegistrationTimeout() {
    this.clearRegistrationTimeout();
    this.registrationTimer = setTimeout(() => {
      if (!this.registered) {
        this.emit('lifecycle', { text: 'Registration timed out — server did not respond to connection attempt within 30 seconds.' });
        this.emit('error', { message: 'Registration timeout' });
        // Force close — will trigger reconnect via close handler
        try { this.tcpSocket?.end(); } catch {}
      }
    }, 30_000);
  }

  private clearRegistrationTimeout() {
    if (this.registrationTimer) {
      clearTimeout(this.registrationTimer);
      this.registrationTimer = null;
    }
  }

  private scheduleReconnect() {
    this.cancelReconnect();
    if (this.reconnectAttempt >= 30) {
      this.emit('lifecycle', { text: 'Maximum reconnect attempts reached. Use /connect to reconnect.' });
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s, ...
    const baseDelay = Math.min(Math.pow(2, this.reconnectAttempt) * 1000, 60_000);
    // Add jitter: ±25%
    const jitter = baseDelay * (0.75 + Math.random() * 0.5);
    const delay = Math.round(jitter);
    this.reconnectAttempt++;

    this.emit('lifecycle', {
      text: `Disconnected from the network. Reconnecting in ${Math.round(delay / 1000)} seconds… (attempt ${this.reconnectAttempt})`,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.userDisconnected) {
        this.connect();
      }
    }, delay);
  }

  private cancelReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleNickInUse(line: IrcLine) {
    const usedNick = line.params[1] || this._nick;
    const reason = line.params[2] || 'Nickname is already in use.';
    let message = `${usedNick}: ${reason}`;

    if (!this.registered) {
      // Not yet registered — append random digit like TheLounge
      this.keepNick = this.options.nick;
      message += ' Trying alternate nick…';

      const nickLen = parseInt(this.serverOptions['NICKLEN'] || '16', 10);
      const alt = usedNick + Math.floor(Math.random() * 10);
      if (alt.length <= nickLen) {
        this._nick = alt;
        this.send(`NICK ${alt}`);
      }
    }

    this.emit('error', { message });
  }

  send(raw: string) {
    if (this.tcpSocket) {
      console.log(`[IRC:${this.id}] >>> ${raw}`);
      this.tcpSocket.write(raw + '\r\n');
    }
  }

  sendMessage(target: string, text: string) {
    this.send(`PRIVMSG ${target} :${text}`);
    // Skip local echo if server has echo-message (it will echo back for us)
    if (this.enabledCaps.includes('echo-message')) return;
    this.emit('message', {
      channel: target,
      message: {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        time: Date.now(),
        type: 'message' as MessageType,
        from: this._nick,
        text,
        self: true,
      },
    });
  }

  sendAction(target: string, text: string) {
    this.send(`PRIVMSG ${target} :\x01ACTION ${text}\x01`);
    if (this.enabledCaps.includes('echo-message')) return;
    this.emit('message', {
      channel: target,
      message: {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        time: Date.now(),
        type: 'action' as MessageType,
        from: this._nick,
        text,
        self: true,
      },
    });
  }

  joinChannel(channel: string, key?: string) {
    this.send(key ? `JOIN ${channel} ${key}` : `JOIN ${channel}`);
  }

  partChannel(channel: string, reason?: string) {
    this.send(reason ? `PART ${channel} :${reason}` : `PART ${channel}`);
  }

  changeNick(nick: string) {
    this.send(`NICK ${nick}`);
  }

  getChannelUsers(channel: string): Record<string, IrcUser> {
    const ch = this.channels.get(channel.toLowerCase());
    if (!ch) return {};
    const result: Record<string, IrcUser> = {};
    for (const [nick, user] of ch.users) {
      result[nick] = user;
    }
    return result;
  }

  private onData(data: string) {
    this.buffer += data;
    // Split on \r\n (standard IRC) but also handle bare \n
    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || '';

    for (const raw of lines) {
      if (raw.length === 0) continue;
      console.log(`[IRC:${this.id}] <<< ${raw}`);
      this.handleLine(parseLine(raw));
    }
  }

  private handleLine(line: IrcLine) {
    switch (line.command) {
      case 'PING':
        this.send(`PONG :${line.params[0] || ''}`);
        break;

      case 'CAP':
        this.handleCap(line);
        break;

      case 'AUTHENTICATE':
        this.handleSaslStep(line);
        break;

      case '900': // RPL_LOGGEDIN
      case '903': // RPL_SASLSUCCESS
        if (this.capNegotiating) {
          this.send('CAP END');
          this.capNegotiating = false;
        }
        break;

      case '904': // ERR_SASLFAIL
      case '905': // ERR_SASLTOOLONG
        this.emit('error', { message: `SASL authentication failed: ${line.params.join(' ')}` });
        if (this.capNegotiating) {
          this.send('CAP END');
          this.capNegotiating = false;
        }
        break;

      case '001': // RPL_WELCOME
        this.registered = true;
        this.clearRegistrationTimeout();
        // Update nick from welcome message (server may have changed it)
        if (line.params[0]) this._nick = line.params[0];
        this.emit('registered', { nick: this._nick });
        this.emit('lifecycle', { text: `Registered on the network as ${this._nick}.` });
        // Start keepalive ping timer
        this.startPingTimer();

        // Post-connect NickServ commands (staggered with channel joins)
        {
          let delay = 1000;

          // NickServ register or identify
          if (this.options.nickservPassword) {
            if (this.options.nickservRegister && this.options.nostrPubkey) {
              // REGISTER <password> <nostr-pubkey>
              setTimeout(() => {
                this.send(`PRIVMSG NickServ :REGISTER ${this.options.nickservPassword} ${this.options.nostrPubkey}`);
                this.emit('lifecycle', { text: `Sent NickServ REGISTER with Nostr pubkey ${this.options.nostrPubkey!.slice(0, 12)}…` });
              }, delay);
              delay += 2000;
            } else {
              // IDENTIFY <nick> <password>
              setTimeout(() => {
                this.send(`PRIVMSG NickServ :IDENTIFY ${this._nick} ${this.options.nickservPassword}`);
                this.emit('lifecycle', { text: `Sent NickServ IDENTIFY for ${this._nick}.` });
              }, delay);
              delay += 1000;
            }
          }

          // Auto-join channels (staggered like TheLounge)
          if (this.options.autojoin?.length) {
            for (const ch of this.options.autojoin) {
              setTimeout(() => this.joinChannel(ch), delay);
              delay += 1000;
            }
          }
        }
        break;

      case '002': // RPL_YOURHOST
      case '003': // RPL_CREATED
      case '004': // RPL_MYINFO
        // Standard registration numerics — just confirms we're registering
        break;

      case 'PONG':
        // lastDataTime already updated in onData, but mark explicitly too
        break;

      case '005': // RPL_ISUPPORT
        for (const param of line.params.slice(1, -1)) {
          const eqIdx = param.indexOf('=');
          if (eqIdx !== -1) {
            this.serverOptions[param.slice(0, eqIdx)] = param.slice(eqIdx + 1);
          } else {
            this.serverOptions[param] = '';
          }
        }
        break;

      case '311': // RPL_WHOISUSER
      case '312': // RPL_WHOISSERVER
      case '313': // RPL_WHOISOPERATOR
      case '317': // RPL_WHOISIDLE
      case '319': // RPL_WHOISCHANNELS
      case '330': // RPL_WHOISACCOUNT
      case '338': // RPL_WHOISACTUALLY
      case '671': // RPL_WHOISSECURE
        this.handleWhoisLine(line);
        break;

      case '318': // RPL_ENDOFWHOIS
        this.handleWhoisEnd(line);
        break;

      case '332': // RPL_TOPIC
        this.handleTopic332(line);
        break;

      case '333': // RPL_TOPICWHOTIME
        break;

      case '353': // RPL_NAMREPLY
        this.handleNames(line);
        break;

      case '366': // RPL_ENDOFNAMES
        this.handleEndOfNames(line);
        break;

      case '372': // RPL_MOTD
        this.motdLines.push(line.params[1] || '');
        break;

      case '375': // RPL_MOTDSTART
        this.motdLines = [];
        break;

      case '376': // RPL_ENDOFMOTD
        this.emit('motd', { text: this.motdLines.join('\n') });
        break;

      case 'JOIN':
        this.handleJoin(line);
        break;

      case 'PART':
        this.handlePart(line);
        break;

      case 'QUIT':
        this.handleQuit(line);
        break;

      case 'NICK':
        this.handleNick(line);
        break;

      case 'TOPIC':
        this.handleTopicChange(line);
        break;

      case 'PRIVMSG':
        this.handlePrivmsg(line);
        break;

      case 'NOTICE':
        this.handleNotice(line);
        break;

      case 'KICK':
        this.handleKick(line);
        break;

      case 'MODE':
        this.handleMode(line);
        break;

      case '433': // ERR_NICKNAMEINUSE
        this.handleNickInUse(line);
        break;

      case '436': // ERR_NICKCOLLISION
        this.handleNickInUse(line);
        break;

      case '437': // ERR_UNAVAILRESOURCE
        this.emit('error', { message: `${line.params[1]}: Nick/channel is temporarily unavailable` });
        if (!this.registered) {
          this.handleNickInUse(line);
        }
        break;

      case '432': // ERR_ERRONEUSNICKNAME
        this.emit('error', { message: `${line.params[1]}: ${line.params[2] || 'Erroneous nickname'}` });
        if (!this.registered) {
          const fallback = 'hyphae' + Math.floor(Math.random() * 1000);
          this._nick = fallback;
          this.send(`NICK ${fallback}`);
        }
        break;

      case '421': // ERR_UNKNOWNCOMMAND
        // Some servers don't support CAP — if they reject it, just continue
        if (line.params[1] === 'CAP') {
          this.capNegotiating = false;
          this.emit('lifecycle', { text: 'Server does not support CAP negotiation, continuing without capabilities.' });
        }
        break;

      case '451': // ERR_NOTREGISTERED
        // Server says we're not registered yet — usually harmless during startup
        break;

      case '462': // ERR_ALREADYREGISTERED
        break;

      case '464': // ERR_PASSWDMISMATCH
        this.emit('error', { message: 'Password incorrect' });
        break;

      case '465': // ERR_YOUREBANNEDCREEP
        this.emit('error', { message: line.params.slice(1).join(' ') });
        break;

      case 'ERROR':
        this.emit('error', { message: line.params[0] || 'Connection error' });
        break;

      default:
        // Numeric errors
        if (/^[45]\d\d$/.test(line.command)) {
          this.emit('error', { message: line.params.slice(1).join(' ') });
        }
        break;
    }
  }

  private handleCap(line: IrcLine) {
    const subcommand = line.params[1];

    if (subcommand === 'LS') {
      // CAP LS can be multi-line: "CAP * LS * :cap1 cap2" then "CAP * LS :cap3 cap4"
      const isMultiline = line.params[2] === '*';
      const capsStr = isMultiline ? (line.params[3] || '') : (line.params[2] || '');
      this.capLsAccumulator.push(...capsStr.split(' ').filter(Boolean));

      if (isMultiline) {
        // More lines coming, wait
        this.capLsMultiline = true;
        return;
      }

      // Final line — process all accumulated capabilities
      const available = this.capLsAccumulator;
      this.capLsAccumulator = [];
      this.capLsMultiline = false;

      const toRequest: string[] = [];
      const wanted = [
        'multi-prefix', 'away-notify', 'account-notify', 'extended-join',
        'message-tags', 'server-time', 'echo-message', 'batch',
        'cap-notify', 'chghost', 'setname', 'sasl',
      ];
      for (const cap of wanted) {
        if (available.some(a => a === cap || a.startsWith(cap + '='))) {
          toRequest.push(cap);
        }
      }

      if (toRequest.length > 0) {
        this.capNegotiating = true;
        this.emit('lifecycle', { text: `Requesting capabilities: ${toRequest.join(', ')}` });
        this.send(`CAP REQ :${toRequest.join(' ')}`);
      } else {
        this.send('CAP END');
      }
    } else if (subcommand === 'ACK') {
      const acked = (line.params[2] || '').split(' ').filter(Boolean);
      this.enabledCaps.push(...acked);
      this.emit('lifecycle', { text: `Enabled capabilities: ${acked.join(', ')}` });

      if (acked.includes('sasl') && this.options.saslAccount && this.options.saslPassword) {
        this.saslInProgress = true;
        this.send('AUTHENTICATE PLAIN');
      } else {
        this.send('CAP END');
        this.capNegotiating = false;
      }
    } else if (subcommand === 'NAK') {
      const naked = (line.params[2] || '').trim();
      if (naked) {
        this.emit('lifecycle', { text: `Capabilities rejected: ${naked}` });
      }
      this.send('CAP END');
      this.capNegotiating = false;
    } else if (subcommand === 'NEW') {
      // Server advertises new caps after connect (cap-notify)
      // Could request them, but for now just note it
    } else if (subcommand === 'DEL') {
      // Server removed caps
      const removed = (line.params[2] || '').split(' ').filter(Boolean);
      this.enabledCaps = this.enabledCaps.filter(c => !removed.includes(c));
    }
  }

  private handleSaslStep(line: IrcLine) {
    if (line.params[0] === '+' && this.saslInProgress) {
      const account = this.options.saslAccount || this.options.nick;
      const password = this.options.saslPassword || '';
      const payload = Buffer.from(`${account}\0${account}\0${password}`).toString('base64');
      this.send(`AUTHENTICATE ${payload}`);
      this.saslInProgress = false;
    }
  }

  private handleJoin(line: IrcLine) {
    const channel = line.params[0];
    const chanLower = channel.toLowerCase();
    const nick = line.nick || '';

    if (nick === this._nick) {
      // We joined a channel
      if (!this.channels.has(chanLower)) {
        this.channels.set(chanLower, { users: new Map(), topic: '' });
      }
      this.emit('channel:join_self', { channel });
    } else {
      // Someone else joined
      const ch = this.channels.get(chanLower);
      if (ch) {
        const user: IrcUser = {
          nick,
          ident: line.ident,
          hostname: line.hostname,
          modes: [],
          account: line.params[1] !== '*' ? line.params[1] : undefined,
        };
        ch.users.set(nick, user);
        this.emit('channel:user_join', { channel, user });
      }
    }
  }

  private handlePart(line: IrcLine) {
    const channel = line.params[0];
    const chanLower = channel.toLowerCase();
    const nick = line.nick || '';
    const reason = line.params[1];

    if (nick === this._nick) {
      this.channels.delete(chanLower);
      this.emit('channel:part_self', { channel });
    } else {
      const ch = this.channels.get(chanLower);
      if (ch) {
        ch.users.delete(nick);
        this.emit('channel:user_part', { channel, nick, reason });
      }
    }
  }

  private handleQuit(line: IrcLine) {
    const nick = line.nick || '';
    const reason = line.params[0];

    for (const [chanName, ch] of this.channels) {
      if (ch.users.has(nick)) {
        ch.users.delete(nick);
      }
    }
    this.emit('user:quit', { nick, reason });

    // keepNick recovery: if the nick we wanted just quit, reclaim it
    if (this.keepNick && nick === this.keepNick) {
      this.changeNick(this.keepNick);
      this.keepNick = null;
    }
  }

  private handleNick(line: IrcLine) {
    const oldNick = line.nick || '';
    const newNick = line.params[0];

    if (oldNick === this._nick) {
      this._nick = newNick;
      // If we got our desired nick back, clear keepNick
      if (this.keepNick && newNick === this.keepNick) {
        this.keepNick = null;
      }
    }

    for (const [chanName, ch] of this.channels) {
      const user = ch.users.get(oldNick);
      if (user) {
        ch.users.delete(oldNick);
        user.nick = newNick;
        ch.users.set(newNick, user);
      }
    }

    this.emit('user:nick', { oldNick, newNick });
  }

  private handleTopicChange(line: IrcLine) {
    const channel = line.params[0];
    const topic = line.params[1] || '';
    const ch = this.channels.get(channel.toLowerCase());
    if (ch) ch.topic = topic;
    this.emit('channel:topic', { channel, topic, setBy: line.nick });
  }

  private handleTopic332(line: IrcLine) {
    const channel = line.params[1];
    const topic = line.params[2] || '';
    const ch = this.channels.get(channel.toLowerCase());
    if (ch) ch.topic = topic;
    this.emit('channel:topic', { channel, topic });
  }

  private handleNames(line: IrcLine) {
    const channel = line.params[2];
    const chanLower = channel.toLowerCase();
    const ch = this.channels.get(chanLower);
    if (!ch) return;

    const nicks = (line.params[3] || '').split(' ').filter(Boolean);
    const prefixMap: Record<string, string> = { '@': 'o', '+': 'v', '%': 'h', '~': 'q', '&': 'a' };

    for (const entry of nicks) {
      let modes: string[] = [];
      let nick = entry;
      while (nick.length > 0 && prefixMap[nick[0]]) {
        modes.push(prefixMap[nick[0]]);
        nick = nick.slice(1);
      }
      if (!ch.users.has(nick)) {
        ch.users.set(nick, { nick, modes });
      } else {
        ch.users.get(nick)!.modes = modes;
      }
    }
  }

  private handleEndOfNames(line: IrcLine) {
    const channel = line.params[1];
    const ch = this.channels.get(channel.toLowerCase());
    if (!ch) return;

    const users: Record<string, IrcUser> = {};
    for (const [nick, user] of ch.users) {
      users[nick] = user;
    }
    this.emit('channel:users', { channel, users });
  }

  private static readonly IRC_SERVICES = new Set([
    'nickserv', 'chanserv', 'hostserv', 'memoserv', 'operserv', 'botserv', 'saslserv',
  ]);

  private handlePrivmsg(line: IrcLine) {
    const target = line.params[0];
    let text = line.params[1] || '';
    const nick = line.nick || '';
    let type: MessageType = 'message' as MessageType;
    const isSelf = nick === this._nick;

    // Drop echo-message reflections to IRC services — these are command/response,
    // the user only needs to see the service's reply, not their own command echoed back
    if (isSelf && IrcConnection.IRC_SERVICES.has(target.toLowerCase())) {
      return;
    }

    // CTCP ACTION
    if (text.startsWith('\x01ACTION ') && text.endsWith('\x01')) {
      text = text.slice(8, -1);
      type = 'action' as MessageType;
    }

    // Determine channel name:
    // - Channel messages → channel name
    // - DMs from others → their nick
    // - Echo of our own DMs (echo-message) → the target we sent to
    const isChannel = target.startsWith('#') || target.startsWith('&');
    const channelName = isChannel ? target : (isSelf ? target : nick);

    this.emit('message', {
      channel: channelName,
      message: {
        id: line.tags?.msgid || `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        time: line.tags?.time ? new Date(line.tags.time).getTime() : Date.now(),
        type,
        from: nick,
        text,
        self: isSelf,
        highlight: !isSelf && text.toLowerCase().includes(this._nick.toLowerCase()),
      },
    });
  }

  private handleNotice(line: IrcLine) {
    const target = line.params[0];
    const text = line.params[1] || '';
    const nick = line.nick || '';

    // NickServ messages
    if (nick.toLowerCase() === 'nickserv') {
      this.emit('nickserv', { text });
    }

    // Route to the right place:
    // - Channel notices (#channel) → that channel
    // - Notices from users with ! in prefix (nick!ident@host) → query window with that nick
    // - Server notices (no !, e.g. from noirc.net) or pre-registration → lobby (use '*')
    let channelName: string;
    if (target.startsWith('#') || target.startsWith('&')) {
      channelName = target;
    } else if (line.ident) {
      channelName = nick;
    } else {
      channelName = '*';
    }

    this.emit('message', {
      channel: channelName,
      message: {
        id: line.tags?.msgid || `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        time: line.tags?.time ? new Date(line.tags.time).getTime() : Date.now(),
        type: 'notice' as MessageType,
        from: nick,
        text,
        self: false,
      },
    });
  }

  private handleKick(line: IrcLine) {
    const channel = line.params[0];
    const kicked = line.params[1];
    const reason = line.params[2];
    const kicker = line.nick || '';

    const ch = this.channels.get(channel.toLowerCase());
    if (ch) ch.users.delete(kicked);

    if (kicked === this._nick) {
      this.channels.delete(channel.toLowerCase());
      this.emit('channel:kicked', { channel, by: kicker, reason });
    } else {
      this.emit('channel:user_kick', { channel, nick: kicked, by: kicker, reason });
    }
  }

  private handleMode(line: IrcLine) {
    const target = line.params[0];
    const modeStr = line.params.slice(1).join(' ');
    this.emit('mode', { target, modes: modeStr, by: line.nick });
  }

  whois(nick: string) {
    this.send(`WHOIS ${nick}`);
  }

  private handleWhoisLine(line: IrcLine) {
    const nick = line.params[1];
    if (!this.whoisBuffer.has(nick)) this.whoisBuffer.set(nick, []);
    const buf = this.whoisBuffer.get(nick)!;

    switch (line.command) {
      case '311': // nick user host * :realname
        buf.push(`${nick} (${line.params[2]}@${line.params[3]})`);
        buf.push(`Real name: ${line.params[5] || ''}`);
        break;
      case '312': // nick server :info
        buf.push(`Server: ${line.params[2]} (${line.params[3] || ''})`);
        break;
      case '313': // nick :is an IRC operator
        buf.push(line.params[2] || 'is an IRC operator');
        break;
      case '317': { // nick idle signon :text
        const idle = parseInt(line.params[2], 10);
        const signon = parseInt(line.params[3], 10);
        const idleStr = idle >= 3600
          ? `${Math.floor(idle / 3600)}h ${Math.floor((idle % 3600) / 60)}m`
          : idle >= 60 ? `${Math.floor(idle / 60)}m ${idle % 60}s` : `${idle}s`;
        buf.push(`Idle: ${idleStr}`);
        if (signon) buf.push(`Signed on: ${new Date(signon * 1000).toLocaleString()}`);
        break;
      }
      case '319': // nick :channels
        buf.push(`Channels: ${line.params[2] || ''}`);
        break;
      case '330': // nick account :is logged in as
        buf.push(`Account: ${line.params[2]}`);
        break;
      case '338': // nick ip :actually using host
        buf.push(`Host: ${line.params[2]}`);
        break;
      case '671': // nick :is using a secure connection
        buf.push('Using secure connection (TLS)');
        break;
    }
  }

  private handleWhoisEnd(line: IrcLine) {
    const nick = line.params[1];
    const lines = this.whoisBuffer.get(nick) || [];
    this.whoisBuffer.delete(nick);
    this.emit('whois', { nick, lines });
  }
}

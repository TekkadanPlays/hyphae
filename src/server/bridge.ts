// WebSocket bridge: browser client <-> IRC connections
import { IrcConnection } from './irc';
import type {
  ClientCommand, ServerEvent, ConnectOptions,
  IrcNetwork, IrcChannel, IrcMessage, ChanType, MessageType,
} from '../shared/types';

export class ClientBridge {
  private networks: Map<string, IrcConnection> = new Map();
  private queries: Map<string, Set<string>> = new Map(); // networkId -> set of open query nicks
  private ws: any; // Bun ServerWebSocket

  constructor(ws: any) {
    this.ws = ws;
  }

  handleMessage(raw: string) {
    let cmd: ClientCommand;
    try {
      cmd = JSON.parse(raw);
    } catch {
      return;
    }

    switch (cmd.type) {
      case 'connect':
        this.handleConnect(cmd.network);
        break;
      case 'disconnect':
        this.handleDisconnect(cmd.networkId);
        break;
      case 'message':
        this.handleSendMessage(cmd.networkId, cmd.target, cmd.text);
        break;
      case 'join':
        this.handleJoin(cmd.networkId, cmd.channel, cmd.key);
        break;
      case 'part':
        this.handlePart(cmd.networkId, cmd.channel, cmd.reason);
        break;
      case 'nick':
        this.handleNickChange(cmd.networkId, cmd.nick);
        break;
      case 'raw':
        this.handleRaw(cmd.networkId, cmd.command);
        break;
      case 'topic':
        this.handleTopic(cmd.networkId, cmd.channel, cmd.topic);
        break;
      case 'nostr_register':
        this.handleNostrRegister(cmd.networkId, cmd.password, cmd.nostrId);
        break;
      case 'nostr_verify':
        this.handleNostrVerify(cmd.networkId, cmd.account, cmd.code);
        break;
      case 'nostr_identify':
        this.handleNostrIdentify(cmd.networkId, cmd.account, cmd.password);
        break;
      case 'whois':
        this.handleWhois(cmd.networkId, cmd.nick);
        break;
    }
  }

  private send(event: ServerEvent) {
    try {
      this.ws.send(JSON.stringify(event));
    } catch {}
  }

  private handleConnect(options: ConnectOptions) {
    const irc = new IrcConnection(options, (event, data) => {
      this.onIrcEvent(irc, event, data);
    });

    this.networks.set(irc.id, irc);

    // Send initial network state to client
    const network: IrcNetwork = {
      id: irc.id,
      name: options.name,
      host: options.host,
      port: options.port,
      tls: options.tls,
      nick: options.nick,
      username: options.username || options.nick,
      realname: options.realname || options.nick,
      connected: false,
      channels: [{
        name: options.name,
        type: 'lobby' as ChanType,
        topic: '',
        joined: true,
        unread: 0,
        highlight: 0,
        users: {},
        messages: [],
        muted: false,
      }],
      serverOptions: {},
    };

    this.send({ type: 'network:new', network });
    irc.connect();
  }

  private handleDisconnect(networkId: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.disconnect();
    this.networks.delete(networkId);
    this.send({ type: 'network:remove', networkId });
  }

  private handleSendMessage(networkId: string, target: string, text: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;

    // Handle /commands
    if (text.startsWith('/')) {
      const spaceIdx = text.indexOf(' ');
      const cmd = (spaceIdx === -1 ? text.slice(1) : text.slice(1, spaceIdx)).toLowerCase();
      const args = spaceIdx === -1 ? '' : text.slice(spaceIdx + 1);

      switch (cmd) {
        case 'me':
          irc.sendAction(target, args);
          return;
        case 'join':
          irc.joinChannel(args.split(' ')[0], args.split(' ')[1]);
          return;
        case 'part':
        case 'leave':
          irc.partChannel(args || target);
          return;
        case 'nick':
          irc.changeNick(args);
          return;
        case 'msg':
        case 'privmsg': {
          const parts = args.split(' ');
          const msgTarget = parts[0];
          const msgText = parts.slice(1).join(' ');
          irc.sendMessage(msgTarget, msgText);
          return;
        }
        case 'topic':
          irc.send(`TOPIC ${target}${args ? ' :' + args : ''}`);
          return;
        case 'kick': {
          const parts = args.split(' ');
          irc.send(`KICK ${target} ${parts[0]}${parts.length > 1 ? ' :' + parts.slice(1).join(' ') : ''}`);
          return;
        }
        case 'whois':
          if (args) irc.whois(args.split(' ')[0]);
          return;
        case 'notice': {
          const nParts = args.split(' ');
          irc.send(`NOTICE ${nParts[0]} :${nParts.slice(1).join(' ')}`);
          return;
        }
        case 'mode':
          irc.send(`MODE ${args || target}`);
          return;
        case 'ban':
          irc.send(`MODE ${target} +b ${args}`);
          return;
        case 'unban':
          irc.send(`MODE ${target} -b ${args}`);
          return;
        case 'register': {
          // /register <password> [nostr-identifier]
          // Sends: PRIVMSG NickServ :REGISTER <password> [nostr-identifier]
          const regParts = args.split(' ');
          if (regParts.length >= 1 && regParts[0]) {
            irc.send(`PRIVMSG NickServ :REGISTER ${args}`);
          }
          return;
        }
        case 'verify': {
          // /verify <account> <code>
          // Sends: PRIVMSG NickServ :VERIFY <account> <code>
          const verParts = args.split(' ');
          if (verParts.length >= 2) {
            irc.send(`PRIVMSG NickServ :VERIFY ${verParts[0]} ${verParts[1]}`);
          }
          return;
        }
        case 'identify':
        case 'id': {
          // /identify <username> [password]
          // Sends: PRIVMSG NickServ :IDENTIFY <username> [password]
          if (args) {
            irc.send(`PRIVMSG NickServ :IDENTIFY ${args}`);
          }
          return;
        }
        case 'ns': {
          // /ns <command> — pass-through to NickServ
          if (args) {
            irc.send(`PRIVMSG NickServ :${args}`);
          }
          return;
        }
        case 'cs': {
          // /cs <command> — pass-through to ChanServ
          if (args) {
            irc.send(`PRIVMSG ChanServ :${args}`);
          }
          return;
        }
        case 'connect':
          // Manual reconnect
          if (!irc.connected) {
            irc.connect();
          }
          return;
        case 'disconnect':
          irc.disconnect(args || 'Leaving');
          return;
        case 'raw':
        case 'quote':
          irc.send(args);
          return;
        default:
          // Send as raw IRC command
          irc.send(text.slice(1));
          return;
      }
    }

    irc.sendMessage(target, text);
  }

  private handleJoin(networkId: string, channel: string, key?: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.joinChannel(channel, key);
  }

  private handlePart(networkId: string, channel: string, reason?: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.partChannel(channel, reason);
  }

  private handleNickChange(networkId: string, nick: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.changeNick(nick);
  }

  private handleRaw(networkId: string, command: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.send(command);
  }

  private handleTopic(networkId: string, channel: string, topic?: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.send(topic ? `TOPIC ${channel} :${topic}` : `TOPIC ${channel}`);
  }

  private handleNostrRegister(networkId: string, password: string, nostrId: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.send(`PRIVMSG NickServ :REGISTER ${password} ${nostrId}`);
  }

  private handleNostrVerify(networkId: string, account: string, code: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.send(`PRIVMSG NickServ :VERIFY ${account} ${code}`);
  }

  private handleNostrIdentify(networkId: string, account: string, password: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.send(`PRIVMSG NickServ :IDENTIFY ${account} ${password}`);
  }

  private handleWhois(networkId: string, nick: string) {
    const irc = this.networks.get(networkId);
    if (!irc) return;
    irc.whois(nick);
  }

  private onIrcEvent(irc: IrcConnection, event: string, data: any) {
    const networkId = irc.id;

    switch (event) {
      case 'connected':
        this.send({ type: 'network:status', networkId, connected: true });
        break;

      case 'disconnected':
        this.send({ type: 'network:status', networkId, connected: false });
        break;

      case 'registered':
        // Connection fully registered with the server
        this.send({
          type: 'message', networkId,
          channelName: irc.options.name,
          message: {
            id: `${Date.now()}_sys`,
            time: Date.now(),
            type: 'notice' as MessageType,
            from: '',
            text: `Connected to ${irc.options.host} as ${data.nick}`,
            self: false,
          },
        });
        break;

      case 'channel:join_self': {
        const channel: IrcChannel = {
          name: data.channel,
          type: 'channel' as ChanType,
          topic: '',
          joined: true,
          unread: 0,
          highlight: 0,
          users: {},
          messages: [],
          muted: false,
        };
        this.send({ type: 'channel:new', networkId, channel });
        break;
      }

      case 'channel:part_self':
        this.send({ type: 'channel:remove', networkId, channelName: data.channel });
        break;

      case 'channel:kicked':
        this.send({ type: 'channel:remove', networkId, channelName: data.channel });
        this.send({
          type: 'message', networkId,
          channelName: irc.options.name,
          message: {
            id: `${Date.now()}_kick`,
            time: Date.now(),
            type: 'kick' as MessageType,
            from: data.by,
            text: `You were kicked from ${data.channel}${data.reason ? ': ' + data.reason : ''}`,
            self: false,
          },
        });
        break;

      case 'channel:user_join':
        this.send({ type: 'channel:user_join', networkId, channelName: data.channel, user: data.user });
        this.send({
          type: 'message', networkId,
          channelName: data.channel,
          message: {
            id: `${Date.now()}_join`,
            time: Date.now(),
            type: 'join' as MessageType,
            from: data.user.nick,
            text: `${data.user.nick} has joined`,
            self: false,
          },
        });
        break;

      case 'channel:user_part':
        this.send({ type: 'channel:user_part', networkId, channelName: data.channel, nick: data.nick, reason: data.reason });
        this.send({
          type: 'message', networkId,
          channelName: data.channel,
          message: {
            id: `${Date.now()}_part`,
            time: Date.now(),
            type: 'part' as MessageType,
            from: data.nick,
            text: `${data.nick} has left${data.reason ? ' (' + data.reason + ')' : ''}`,
            self: false,
          },
        });
        break;

      case 'user:quit':
        this.send({ type: 'channel:user_quit', networkId, nick: data.nick, reason: data.reason });
        break;

      case 'user:nick':
        this.send({ type: 'channel:user_nick', networkId, oldNick: data.oldNick, newNick: data.newNick });
        break;

      case 'channel:topic':
        this.send({ type: 'channel:topic', networkId, channelName: data.channel, topic: data.topic, setBy: data.setBy });
        break;

      case 'channel:users':
        this.send({ type: 'channel:users', networkId, channelName: data.channel, users: data.users });
        break;

      case 'message': {
        let chanName: string = data.channel;

        // '*' means route to lobby (server notices, pre-registration messages)
        if (chanName === '*') {
          chanName = irc.options.name;
        }

        // Auto-create query window for incoming DMs (non-channel, non-lobby targets like NickServ)
        const isChannel = chanName.startsWith('#') || chanName.startsWith('&');
        const isLobby = chanName === irc.options.name;
        if (!isChannel && !isLobby) {
          let netQueries = this.queries.get(networkId);
          if (!netQueries) {
            netQueries = new Set();
            this.queries.set(networkId, netQueries);
          }
          if (!netQueries.has(chanName.toLowerCase())) {
            netQueries.add(chanName.toLowerCase());
            const query: IrcChannel = {
              name: chanName,
              type: 'query' as ChanType,
              topic: '',
              joined: true,
              unread: 0,
              highlight: 0,
              users: {},
              messages: [],
              muted: false,
            };
            this.send({ type: 'channel:new', networkId, channel: query });
          }
        }
        this.send({ type: 'message', networkId, channelName: chanName, message: data.message });
        break;
      }

      case 'nickserv':
        this.send({ type: 'nickserv', networkId, text: data.text });
        break;

      case 'motd':
        this.send({ type: 'motd', networkId, text: data.text });
        break;

      case 'error':
        this.send({ type: 'error', networkId, text: data.message });
        break;

      case 'whois':
        this.send({ type: 'whois', networkId, nick: data.nick, lines: data.lines });
        break;

      case 'lifecycle':
        // Connection lifecycle messages — show in the lobby channel
        this.send({
          type: 'message', networkId,
          channelName: irc.options.name,
          message: {
            id: `lc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            time: Date.now(),
            type: 'lifecycle' as MessageType,
            from: '',
            text: data.text,
            self: false,
          },
        });
        break;
    }
  }

  destroy() {
    for (const [id, irc] of this.networks) {
      irc.disconnect('Client closed');
    }
    this.networks.clear();
  }
}

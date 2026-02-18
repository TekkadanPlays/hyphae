// IRC URI parser — migrated from TheLounge
// Parses irc:// and ircs:// URIs into connection data

export interface IrcUriData {
  name: string;
  host: string;
  port: string;
  join: string;
  tls: boolean;
}

export default function parseIrcUri(stringUri: string): IrcUriData | undefined {
  const data: IrcUriData = {
    name: '',
    host: '',
    port: '',
    join: '',
    tls: false,
  };

  try {
    const uri = new URL(stringUri);

    if (uri.protocol === 'irc:') {
      uri.protocol = 'http:';
      if (!uri.port) uri.port = '6667';
    } else if (uri.protocol === 'ircs:') {
      uri.protocol = 'https:';
      if (!uri.port) uri.port = '6697';
      data.tls = true;
    } else {
      return undefined;
    }

    if (!uri.hostname) return undefined;

    data.host = data.name = uri.hostname;
    data.port = uri.port;

    let channel = '';
    if (uri.pathname.length > 1) {
      channel = uri.pathname.slice(1);
    }
    if (uri.hash.length > 1) {
      channel += uri.hash;
    }

    data.join = channel;
  } catch {
    return undefined;
  }

  return data;
}

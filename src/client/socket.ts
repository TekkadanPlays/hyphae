// Client-side WebSocket connection to the Bun backend
import type { ClientCommand, ServerEvent } from '../shared/types';

type EventHandler = (event: ServerEvent) => void;

class SocketConnection {
  private ws: WebSocket | null = null;
  private handlers: Set<EventHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private _connected = false;

  get connected(): boolean { return this._connected; }

  connect() {
    if (this.ws) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${location.host}/ws`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this._connected = true;
      this.reconnectDelay = 1000;
      console.log('[Socket] Connected');
    };

    this.ws.onmessage = (e) => {
      try {
        const event: ServerEvent = JSON.parse(e.data);
        for (const handler of this.handlers) {
          handler(event);
        }
      } catch (err) {
        console.error('[Socket] Parse error:', err);
      }
    };

    this.ws.onclose = () => {
      this._connected = false;
      this.ws = null;
      console.log('[Socket] Disconnected, reconnecting...');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this._connected = false;
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  send(command: ClientCommand) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    }
  }

  onEvent(handler: EventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
  }
}

export const socket = new SocketConnection();

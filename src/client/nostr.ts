// Nostr integration for profile fetching and NIP-07 auth
// Uses Kaji library via tsconfig paths

import { RelayPool } from 'kaji';
import { ProfileStore } from 'kaji/profiles';
import type { Profile } from 'kaji/profiles';

// Default Nostr relays for profile lookups
// relay.nostr.band removed — frequently down
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://purplepag.es',
  'wss://relay.nostr.net',
];

class NostrManager {
  private pool: RelayPool;
  private profileStore: ProfileStore;
  private _pubkey: string | null = null;
  private _connected = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.pool = new RelayPool();
    for (const url of DEFAULT_RELAYS) {
      this.pool.addRelay(url);
    }
    this.profileStore = new ProfileStore(this.pool);

    // Forward profile store updates to our listeners
    this.profileStore.subscribe(() => this.notify());
  }

  get pubkey(): string | null { return this._pubkey; }
  get connected(): boolean { return this._connected; }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const fn of this.listeners) fn();
  }

  async connect(): Promise<void> {
    if (this._connected) return;
    await this.pool.connectAll();
    this._connected = true;
  }

  async loginWithExtension(): Promise<string> {
    if (typeof window === 'undefined' || !(window as any).nostr) {
      throw new Error('No NIP-07 extension found. Install Alby or nos2x.');
    }
    const pubkey = await (window as any).nostr.getPublicKey();
    this._pubkey = pubkey;

    // Connect to relays and fetch our own profile
    await this.connect();
    this.profileStore.fetch(pubkey);

    this.notify();
    return pubkey;
  }

  getProfile(pubkey: string): Profile | undefined {
    return this.profileStore.get(pubkey);
  }

  fetchProfile(pubkey: string) {
    if (!this._connected) {
      this.connect().then(() => {
        this.profileStore.fetch(pubkey);
      });
    } else {
      this.profileStore.fetch(pubkey);
    }
  }

  fetchProfiles(pubkeys: string[]) {
    if (!this._connected) {
      this.connect().then(() => {
        this.profileStore.fetchMany(pubkeys);
      });
    } else {
      this.profileStore.fetchMany(pubkeys);
    }
  }

  disconnect() {
    this.pool.disconnectAll();
    this._connected = false;
  }
}

export const nostr = new NostrManager();

// Formatting utilities — migrated/inspired by TheLounge

export function roundBadgeNumber(count: number): string {
  if (count < 1000) return count.toString();
  return (count / 1000).toFixed(2).slice(0, -1) + 'k';
}

export function friendlySize(size: number): string {
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
  const i = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
  const fixed = parseFloat((size / Math.pow(1024, i)).toFixed(1));
  return `${fixed} ${sizes[i]}`;
}

export function localeTime(time: Date | number): string {
  const d = new Date(time);
  return d.toLocaleDateString(undefined, {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function timeSince(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

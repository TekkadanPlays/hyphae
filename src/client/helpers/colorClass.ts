// Nick color class generator — migrated from TheLounge
// Generates a consistent color class "color-1" to "color-32" based on nick string

export default function colorClass(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  // Modulo 32 = case insensitive for ASCII
  return 'color-' + (1 + (hash % 32)).toString();
}

// Map color classes to actual hsl colors for the dark theme
const nickColors: Record<string, string> = {
  'color-1': 'hsl(0, 70%, 65%)',
  'color-2': 'hsl(11, 70%, 65%)',
  'color-3': 'hsl(22, 70%, 65%)',
  'color-4': 'hsl(33, 70%, 65%)',
  'color-5': 'hsl(45, 70%, 65%)',
  'color-6': 'hsl(56, 70%, 65%)',
  'color-7': 'hsl(67, 70%, 65%)',
  'color-8': 'hsl(78, 70%, 65%)',
  'color-9': 'hsl(90, 70%, 65%)',
  'color-10': 'hsl(101, 70%, 65%)',
  'color-11': 'hsl(112, 70%, 65%)',
  'color-12': 'hsl(124, 70%, 65%)',
  'color-13': 'hsl(135, 70%, 65%)',
  'color-14': 'hsl(146, 70%, 65%)',
  'color-15': 'hsl(157, 70%, 65%)',
  'color-16': 'hsl(169, 70%, 65%)',
  'color-17': 'hsl(180, 70%, 65%)',
  'color-18': 'hsl(191, 70%, 65%)',
  'color-19': 'hsl(202, 70%, 65%)',
  'color-20': 'hsl(214, 70%, 65%)',
  'color-21': 'hsl(225, 70%, 65%)',
  'color-22': 'hsl(236, 70%, 65%)',
  'color-23': 'hsl(247, 70%, 65%)',
  'color-24': 'hsl(259, 70%, 65%)',
  'color-25': 'hsl(270, 70%, 65%)',
  'color-26': 'hsl(281, 70%, 65%)',
  'color-27': 'hsl(292, 70%, 65%)',
  'color-28': 'hsl(304, 70%, 65%)',
  'color-29': 'hsl(315, 70%, 65%)',
  'color-30': 'hsl(326, 70%, 65%)',
  'color-31': 'hsl(337, 70%, 65%)',
  'color-32': 'hsl(349, 70%, 65%)',
};

export function nickColor(nick: string): string {
  return nickColors[colorClass(nick)] || 'hsl(0, 0%, 65%)';
}

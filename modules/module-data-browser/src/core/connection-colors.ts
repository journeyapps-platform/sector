import { ComboBoxItem } from '@journeyapps/reactor-mod';

export interface ConnectionColorOption {
  key: string;
  label: string;
}

export const CONNECTION_COLOR_OPTIONS: ConnectionColorOption[] = [
  { key: '#00bcd4', label: 'Cyan' },
  { key: '#4caf50', label: 'Green' },
  { key: '#ff9800', label: 'Orange' },
  { key: '#e91e63', label: 'Pink' },
  { key: '#9c27b0', label: 'Purple' },
  { key: '#f44336', label: 'Red' },
  { key: '#2196f3', label: 'Blue' },
  { key: '#ffc107', label: 'Amber' }
];

export const DEFAULT_CONNECTION_COLOR = CONNECTION_COLOR_OPTIONS[0].key;

export function getConnectionColorComboBoxItems(): ComboBoxItem[] {
  return CONNECTION_COLOR_OPTIONS.map((option) => ({
    key: option.key,
    title: option.label,
    icon: 'circle',
    color: option.key
  }));
}

export function getConnectionColorSetOptions(): Record<string, string> {
  return CONNECTION_COLOR_OPTIONS.reduce(
    (prev, option) => {
      prev[option.key] = option.label;
      return prev;
    },
    {} as Record<string, string>
  );
}

export function getDefaultConnectionColor(seed: string): string {
  if (!seed) {
    return DEFAULT_CONNECTION_COLOR;
  }
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CONNECTION_COLOR_OPTIONS[hash % CONNECTION_COLOR_OPTIONS.length].key;
}

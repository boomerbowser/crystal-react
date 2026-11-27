import type { ReactNode } from 'react';

/* Prismata's vocabulary marks code with backticks, as its Markdown does. */
export function withCode(text: string): ReactNode[] {
  return text.split(/`([^`]+)`/).map((part, index) => (index % 2 ? <code key={index}>{part}</code> : part));
}

export function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

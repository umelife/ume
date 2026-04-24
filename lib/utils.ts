import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Shadcn/ui utility: merge Tailwind class names intelligently.
 * Combines clsx (conditional classes) + tailwind-merge (deduplication).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ChangelogEntry {
  date: string    // YYYY-MM-DD  — add newest entries at the TOP
  items: string[]
}

/**
 * Changelog for the "What's New" popup.
 *
 * HOW TO ADD AN UPDATE:
 *   1. Insert a new object at the TOP of this array.
 *   2. Set `date` to today's date in YYYY-MM-DD format.
 *   3. List the changes in `items`.
 *
 * The popup will automatically reappear for all users for 7 days after
 * the latest entry's date, then stop showing until the next update.
 */
export const changelog: ChangelogEntry[] = [
  {
    date: '2026-02-21',
    items: [
      'Swipe images on touch screens — works on listing cards, product pages, and the home slider',
      'Tap any seller name to view their profile and all their listings',
      'Redesigned profile pages with avatar, college info, and listing count',
      '"Passwords do not match" error is now shown in red on the sign-up page',
    ],
  },
]

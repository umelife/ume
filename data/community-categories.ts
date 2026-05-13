export interface CommunityCategory {
  slug: string
  display: string
  emoji: string
  tagline: string
}

export const COMMUNITY_CATEGORIES: CommunityCategory[] = [
  { slug: 'study',        display: 'Study Groups',    emoji: '📚', tagline: 'Ace your classes together' },
  { slug: 'gaming',       display: 'Gaming',          emoji: '🎮', tagline: 'Find your squad' },
  { slug: 'fitness',      display: 'Fitness',         emoji: '🏋️', tagline: 'Work out, stay motivated' },
  { slug: 'social',       display: 'Social',          emoji: '🎉', tagline: 'Hang out and have fun' },
  { slug: 'professional', display: 'Professional',    emoji: '💼', tagline: 'Career, networking, internships' },
  { slug: 'arts',         display: 'Arts & Culture',  emoji: '🎨', tagline: 'Create and collaborate' },
  { slug: 'sports',       display: 'Sports',          emoji: '⚽', tagline: 'Play together' },
  { slug: 'tech',         display: 'Tech',            emoji: '💻', tagline: 'Build and learn' },
  { slug: 'food',         display: 'Food & Drinks',   emoji: '🍕', tagline: 'Eat, explore, cook' },
  { slug: 'other',        display: 'Other',           emoji: '✨', tagline: 'Everything else' },
]

export const COMMUNITY_CATEGORY_SLUGS = COMMUNITY_CATEGORIES.map(c => c.slug)

export function getCommunityCategory(slug: string): CommunityCategory | undefined {
  return COMMUNITY_CATEGORIES.find(c => c.slug === slug)
}

import Link from 'next/link'
import Image from 'next/image'
import { getCommunityCategory } from '@/data/community-categories'
import type { Community } from '@/types/database'

export default function CommunityCard({ community }: { community: Community }) {
  const cat = getCommunityCategory(community.category)
  return (
    <Link
      href={`/communities/${community.slug}`}
      className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-100 hover:-translate-y-0.5"
    >
      <div className="relative w-full aspect-[3/2] bg-gradient-to-br from-ume-indigo/5 to-ume-pink/10 overflow-hidden">
        {community.cover_image_url ? (
          <Image
            src={community.cover_image_url}
            alt={community.name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {cat?.emoji ?? '✨'}
          </div>
        )}
        <span className="absolute top-2 left-2 bg-white/90 text-ume-indigo text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full">
          {cat?.display ?? community.category}
        </span>
      </div>
      <div className="p-3.5 space-y-1">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{community.name}</h3>
        <p className="text-xs text-gray-500 line-clamp-2">{community.description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-400">
            {community.member_count} {community.member_count === 1 ? 'member' : 'members'}
          </span>
          {(community.city || community.state) && (
            <span className="text-[10px] text-gray-400">
              {[community.city, community.state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

import { getUser } from '@/lib/auth/actions'
import { getCartCount } from '@/lib/cart/actions'
import { getTotalUnreadCountEnhanced } from '@/lib/chat/enhanced-actions'
import Header from './Header'

export default async function HeaderWrapper() {
  const { user } = await getUser()

  let unreadMessages = 0
  let cartItemCount = 0

  // Only fetch counts if user is authenticated
  if (user) {
    const [{ count }, cartCount] = await Promise.all([
      getTotalUnreadCountEnhanced(),
      getCartCount(),
    ])
    unreadMessages = count
    cartItemCount = cartCount
  }

  return (
    <Header
      unreadMessages={unreadMessages}
      cartItemCount={cartItemCount}
      userAvatar={user?.user_metadata?.avatar_url}
      userId={user?.id}
    />
  )
}

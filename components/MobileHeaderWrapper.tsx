import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/actions'
import { getCartCount } from '@/lib/cart/actions'
import MobileHeader from './MobileHeader'

export default async function MobileHeaderWrapper() {
  const supabase = await createClient()
  const { user, error } = await getUser()

  let unreadMessages = 0
  let cartItemCount = 0

  // Only fetch counts if user is authenticated
  if (user) {
    // Get unread message count
    const { count: messageCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false)
      .eq('deleted', false)

    unreadMessages = messageCount || 0

    // Get cart item count
    cartItemCount = await getCartCount()
  }

  return (
    <MobileHeader
      unreadMessages={unreadMessages}
      cartItemCount={cartItemCount}
      userAvatar={user?.user_metadata?.avatar_url}
      userId={user?.id}
    />
  )
}

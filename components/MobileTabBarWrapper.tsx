import { getUser } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/server'
import MobileTabBar from './MobileTabBar'

export default async function MobileTabBarWrapper() {
  const { user } = await getUser()

  let unreadMessages = 0
  if (user) {
    const supabase = await createClient()
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('read', false)
      .eq('deleted', false)
    unreadMessages = count ?? 0
  }

  return <MobileTabBar unreadMessages={unreadMessages} userId={user?.id} />
}

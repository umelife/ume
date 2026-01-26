/**
 * Admin Moderation API endpoint
 *
 * POST /api/admin/moderation
 * Body: { listingId: string, action: "resolve" | "dismiss" }
 *
 * Security:
 * - Requires authenticated user
 * - User must be in ADMIN_EMAILS list
 * - In test mode (ADMIN_TEST_MODE=true), accepts X-Admin-Test-Token header
 */

import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type ModerationAction = 'resolve' | 'dismiss'

interface ModerationRequest {
  listingId: string
  action: ModerationAction
}

interface ModerationResponse {
  success: boolean
  message?: string
  error?: string
  reportId?: string
  newStatus?: string
}

/**
 * Verify admin access
 * Returns user info if admin, null otherwise
 */
async function verifyAdminAccess(request: Request): Promise<{ userId: string; email: string } | null> {
  // Test mode bypass (only in non-production)
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ADMIN_TEST_MODE === 'true'
  ) {
    const testToken = request.headers.get('X-Admin-Test-Token')
    if (testToken === process.env.ADMIN_TEST_TOKEN) {
      return { userId: 'test-admin', email: 'test-admin@example.com' }
    }
  }

  // Normal auth flow
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Check if user is admin
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  const serviceSupabase = await createServiceClient()

  const { data: userData } = await serviceSupabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!userData?.email || !adminEmails.includes(userData.email.toLowerCase())) {
    return null
  }

  return { userId: user.id, email: userData.email }
}

export async function POST(request: Request): Promise<NextResponse<ModerationResponse>> {
  // Verify admin access
  const admin = await verifyAdminAccess(request)
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin access required' },
      { status: 403 }
    )
  }

  // Parse request body
  let body: ModerationRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate request
  const { listingId, action } = body

  if (!listingId || typeof listingId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid listingId' },
      { status: 400 }
    )
  }

  if (!action || !['resolve', 'dismiss'].includes(action)) {
    return NextResponse.json(
      { success: false, error: 'Invalid action. Must be "resolve" or "dismiss"' },
      { status: 400 }
    )
  }

  // Map action to status
  const newStatus = action === 'resolve' ? 'resolved' : 'dismissed'

  // Find the report for this listing
  const supabase = await createServiceClient()

  // First, find the pending report for this listing
  const { data: report, error: findError } = await supabase
    .from('reports')
    .select('id, status')
    .eq('listing_id', listingId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (findError || !report) {
    // Try to find any report for the listing
    const { data: anyReport } = await supabase
      .from('reports')
      .select('id, status')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!anyReport) {
      return NextResponse.json(
        { success: false, error: 'No report found for this listing' },
        { status: 404 }
      )
    }

    // Report exists but not pending
    return NextResponse.json(
      { success: false, error: `Report already ${anyReport.status}` },
      { status: 400 }
    )
  }

  // Update the report status
  const { data: updatedReport, error: updateError } = await supabase
    .from('reports')
    .update({ status: newStatus })
    .eq('id', report.id)
    .select()
    .single()

  if (updateError) {
    console.error('[MODERATION API] Update error:', updateError)
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    )
  }

  console.log('[MODERATION API] Report moderated:', {
    reportId: report.id,
    listingId,
    action,
    newStatus,
    updatedBy: admin.email
  })

  return NextResponse.json({
    success: true,
    message: `Report ${newStatus} successfully`,
    reportId: updatedReport.id,
    newStatus: updatedReport.status
  })
}

// GET endpoint to fetch moderation info for a listing
export async function GET(request: Request): Promise<NextResponse> {
  // Verify admin access
  const admin = await verifyAdminAccess(request)
  if (!admin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin access required' },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const listingId = searchParams.get('listingId')

  if (!listingId) {
    return NextResponse.json(
      { success: false, error: 'Missing listingId parameter' },
      { status: 400 }
    )
  }

  const supabase = await createServiceClient()

  const { data: reports, error } = await supabase
    .from('reports')
    .select('*, reporter:users!reports_reporter_id_fkey(*)')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    reports: reports || [],
    count: reports?.length || 0
  })
}

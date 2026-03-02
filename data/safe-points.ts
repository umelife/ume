export interface Campus {
  id: string
  name: string
  /** One or more email domains that identify this campus, e.g. 'ucumberlands.edu' */
  emailDomains: string[]
}

export interface SafePoint {
  id: string
  name: string
  lat: number
  lng: number
  description: string
  campusId: string
}

// ── Campus registry ───────────────────────────────────────────────────────────
// Add a new entry here when UME expands to a new school.
// emailDomains: list every domain students might use (main + student subdomain).
export const CAMPUSES: Campus[] = [
  {
    id: 'uc_cumberlands',
    name: 'University of the Cumberlands',
    emailDomains: ['ucumberlands.edu', 'students.ucumberlands.edu'],
  },
]

// ── Safe-Point registry ───────────────────────────────────────────────────────
// Add Safe-Points for every campus. Each entry must reference a campusId above.
export const SAFE_POINTS: SafePoint[] = [
  // — University of the Cumberlands —
  {
    id: 'student_union',
    name: 'Student Union',
    lat: 36.7431,
    lng: -84.1568,
    description: 'Main entrance, Blue Light station',
    campusId: 'uc_cumberlands',
  },
  {
    id: 'hagan_library',
    name: 'Hagan Library',
    lat: 36.7424,
    lng: -84.1555,
    description: 'Front steps, Blue Light station',
    campusId: 'uc_cumberlands',
  },
  {
    id: 'boswell_center',
    name: 'Boswell Center',
    lat: 36.7438,
    lng: -84.1575,
    description: 'Main entrance, Blue Light station',
    campusId: 'uc_cumberlands',
  },
  {
    id: 'public_safety',
    name: 'Public Safety Office',
    lat: 36.7445,
    lng: -84.1582,
    description: 'Campus Police, staffed 24/7',
    campusId: 'uc_cumberlands',
  },
]

export const GEOFENCE_RADIUS_METERS = 25

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Look up a campus from a user's email address.
 * Returns undefined if the domain isn't registered yet.
 */
export function getCampusFromEmail(email: string | null | undefined): Campus | undefined {
  if (!email) return undefined
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return undefined
  return CAMPUSES.find((c) =>
    c.emailDomains.some((d) => domain === d || domain.endsWith('.' + d))
  )
}

/**
 * Return only the Safe-Points that belong to a given campus.
 * Falls back to ALL safe points if campusId is undefined (graceful degradation).
 */
export function getSafePointsForCampus(campusId: string | undefined): SafePoint[] {
  if (!campusId) return SAFE_POINTS
  return SAFE_POINTS.filter((p) => p.campusId === campusId)
}

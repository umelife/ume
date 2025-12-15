# Marketplace Implementation - Testing Checklist

## Overview
This checklist verifies all features of the new marketplace implementation including category filtering, location radius, and square product grid.

---

## Setup Requirements

### 1. Database Migration
**MUST run before testing!**

```bash
# Open Supabase SQL Editor and run:
```

Execute the entire contents of:
`supabase/sql/00_extensions_and_radius_fn.sql`

Verify it ran successfully by checking:
```sql
-- Should return 1 row
SELECT * FROM pg_extension WHERE extname = 'postgis';

-- Should show latitude and longitude columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'listings' AND column_name IN ('latitude', 'longitude');

-- Should return the function
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'filter_by_radius';
```

### 2. Add Test Data (Optional)
To test radius filtering, add location data to existing listings:

```sql
-- Add random locations near a test city (e.g., NYC)
UPDATE public.listings
SET latitude = 40.7128 + (random() * 0.5 - 0.25),
    longitude = -74.0060 + (random() * 0.5 - 0.25)
WHERE latitude IS NULL;
```

Or manually set specific locations for testing.

---

## Feature Testing

### ✅ 1. Category Bar

#### Test 1.1: Display and Styling
- [ ] Navigate to `/marketplace`
- [ ] Verify all 8 categories are displayed horizontally
- [ ] Categories should be: Dorm & Decor, Fun & Craft, Books, Clothing & Accessories, Transportation, Tech & Gadgets, Giveaways, Other
- [ ] "All" chip should be visible at the start
- [ ] All chips should be gray with rounded corners (inactive state)
- [ ] "All" chip should be black/filled (active state)

#### Test 1.2: Click and Filter
- [ ] Click "Dorm & Decor" chip
- [ ] URL should change to `?category=dorm-and-decor`
- [ ] "Dorm & Decor" chip should become black/filled
- [ ] "All" chip should become gray (inactive)
- [ ] Page title should change to "Shop Dorm & Decor"
- [ ] Only listings in that category should display

#### Test 1.3: Category Reordering
- [ ] Click a category (e.g., "Books")
- [ ] **IMPORTANT**: "Books" chip should move to the first position (left of "All")
- [ ] Click another category
- [ ] The new category should move to first position
- [ ] Previous active category should return to original position

#### Test 1.4: Toggle Active Category
- [ ] Click an active category chip again
- [ ] Category filter should clear
- [ ] URL should remove `?category=...`
- [ ] Page title should return to "Shop all"
- [ ] All listings should display

#### Test 1.5: Mobile Scrolling
- [ ] Resize browser to mobile width (< 640px)
- [ ] Category chips should be horizontally scrollable
- [ ] Scroll should be smooth without scrollbar visible

#### Test 1.6: Keyboard Accessibility
- [ ] Use Tab key to navigate through category chips
- [ ] Each chip should show visible focus ring
- [ ] Press Enter or Space to activate a chip
- [ ] Category should filter correctly

---

### ✅ 2. Page Title

#### Test 2.1: Dynamic Title
- [ ] With no category: Title shows "Shop all"
- [ ] With "Dorm & Decor": Title shows "Shop Dorm & Decor"
- [ ] With "Tech & Gadgets": Title shows "Shop Tech & Gadgets"
- [ ] Title should be centered
- [ ] Title should be large and bold

---

### ✅ 3. Filters Row

#### Test 3.1: Condition Dropdown
- [ ] Filters row should appear below page title
- [ ] "Condition" dropdown should be present
- [ ] Options: All Conditions, New, Like New, Used, Refurbished
- [ ] Select "New"
- [ ] URL should add `?condition=New`
- [ ] Only "New" condition listings should display
- [ ] Change to "Used"
- [ ] URL should update to `?condition=Used`

#### Test 3.2: Seller Rating (Placeholder)
- [ ] Seller Rating dropdown should be present
- [ ] Dropdown should be disabled
- [ ] "Coming soon" text should appear below

#### Test 3.3: Price Range (Placeholder)
- [ ] Price Range button should be present
- [ ] Button should be enabled
- [ ] Click shows alert "Price range filter coming soon!"
- [ ] "Coming soon" text should appear below

---

### ✅ 4. Location Radius Slider

#### Test 4.1: Initial State (No Location)
- [ ] Slider should be visible but disabled (gray/faded)
- [ ] "Enable location" button should be visible
- [ ] Help text: "Enable location to filter by distance"
- [ ] Slider should show tick marks: 0, 10, 25, 50

#### Test 4.2: Enable Location
- [ ] Click "Enable location" button
- [ ] Browser should prompt for location permission
- [ ] **Grant permission**
- [ ] Button text should change to "Getting location..."
- [ ] After ~1-2 seconds, slider should become enabled (colored)
- [ ] URL should update with `?userLat=...&userLng=...&radius=25`

#### Test 4.3: Adjust Radius
- [ ] Drag slider to 10 miles
- [ ] Live readout should show "10 mi"
- [ ] After 250ms, URL should update to `?radius=10&...`
- [ ] Listings should filter to within 10 miles
- [ ] Set radius to 0
- [ ] Readout should show "Any distance"
- [ ] All listings (with location) should display

#### Test 4.4: Slider Visual Feedback
- [ ] Hover over slider thumb → should scale slightly
- [ ] Click and drag → should feel smooth
- [ ] Keyboard: Tab to slider → should show focus ring
- [ ] Keyboard: Arrow keys → should move slider by 1 mile increments

#### Test 4.5: Deny Location Permission
- [ ] Refresh page
- [ ] Click "Enable location"
- [ ] **Deny permission**
- [ ] Alert should appear: "Unable to get your location..."
- [ ] Slider should remain disabled

#### Test 4.6: Location Persistence
- [ ] Enable location and set radius to 25
- [ ] Click a different category
- [ ] Location and radius should persist in URL
- [ ] Listings should still be filtered by radius + category

---

### ✅ 5. Product Grid

#### Test 5.1: Square Images
- [ ] All product images should be perfect squares (1:1 aspect ratio)
- [ ] Images should not be stretched or squished
- [ ] Images should use object-fit: cover (crops to fill square)
- [ ] Hover over image → slight zoom effect

#### Test 5.2: Card Layout
- [ ] Each card shows:
  - Square image at top
  - Title below (bold, large)
  - Price below title (blue, bold)
  - Short description (gray, 2 lines max)
  - Seller info at bottom (avatar + name)
- [ ] Condition badge in top-left of image (if available)
- [ ] Distance badge in top-right (if radius filtering active)

#### Test 5.3: Distance Display
- [ ] Enable location and set radius to 10 miles
- [ ] Cards should show distance badge (e.g., "2.5 mi")
- [ ] Closest listings should appear first
- [ ] Distance < 1 mile should show "< 1 mi"

#### Test 5.4: Responsive Grid
- [ ] Desktop (> 1024px): 4 columns
- [ ] Tablet (768px - 1023px): 3 columns
- [ ] Mobile (< 768px): 2 columns
- [ ] Very small mobile (< 480px): Consider testing 1 column (may require CSS adjustment)
- [ ] Grid gaps should be consistent
- [ ] Cards should not overflow

#### Test 5.5: Click to View Item
- [ ] Click any card
- [ ] Should navigate to `/item/[id]`
- [ ] Item detail page should load

---

### ✅ 6. URL State Management

#### Test 6.1: URL Sync
- [ ] Change category → URL updates
- [ ] Change condition → URL updates
- [ ] Change radius → URL updates (debounced 250ms)
- [ ] All filters should work together in URL

Example URL:
```
/marketplace?category=tech-and-gadgets&condition=New&radius=25&userLat=40.7128&userLng=-74.0060
```

#### Test 6.2: Shareable URLs
- [ ] Apply filters: category="Books", condition="Like New", radius=10
- [ ] Copy URL
- [ ] Open in new tab/incognito window
- [ ] Filters should be applied automatically
- [ ] Page title should match category
- [ ] Listings should be filtered correctly

#### Test 6.3: Browser Back/Forward
- [ ] Click category "Dorm & Decor"
- [ ] Click category "Books"
- [ ] Press browser Back button
- [ ] Should return to "Dorm & Decor" with correct filters
- [ ] Press Forward button
- [ ] Should return to "Books"

---

### ✅ 7. Performance & UX

#### Test 7.1: Loading States
- [ ] Navigate to `/marketplace`
- [ ] Filters row should show placeholder while loading (if Suspense works)
- [ ] Listings should appear quickly (< 1s for small datasets)

#### Test 7.2: Empty States
- [ ] Set very restrictive filters (e.g., category + condition that has no listings)
- [ ] Should show empty state message:
  - Empty box icon
  - "No listings match your filters"
  - "Try adjusting your search criteria"

#### Test 7.3: No Location Data
- [ ] Enable radius filtering
- [ ] If some listings don't have lat/lng
- [ ] Those listings should NOT appear in radius results
- [ ] Only listings with location data should show

#### Test 7.4: Radius RPC Function
- [ ] Open Supabase SQL Editor
- [ ] Run test query:
```sql
SELECT id, title, distance_miles
FROM public.filter_by_radius(40.7128, -74.0060, 25, NULL);
```
- [ ] Should return listings with distance_miles
- [ ] Distance should be accurate (check a few manually)

---

### ✅ 8. Accessibility

#### Test 8.1: Keyboard Navigation
- [ ] Tab through all interactive elements:
  - Category chips
  - Condition dropdown
  - Location button
  - Radius slider
  - Product cards
- [ ] All should have visible focus indicators
- [ ] Enter/Space should activate buttons and links

#### Test 8.2: Screen Reader (Optional)
- [ ] Use screen reader (NVDA/JAWS/VoiceOver)
- [ ] Category chips should announce "Filter by [Category]"
- [ ] Slider should announce current value "25 miles"
- [ ] Product cards should announce title and price

#### Test 8.3: ARIA Attributes
- [ ] Inspect slider element
- [ ] Should have: aria-valuemin, aria-valuemax, aria-valuenow, aria-valuetext
- [ ] Category chips should have: aria-pressed="true" when active

---

### ✅ 9. Edge Cases

#### Test 9.1: No Listings
- [ ] If database has zero listings
- [ ] Should show empty state (not error)

#### Test 9.2: Invalid Category
- [ ] Navigate to `/marketplace?category=invalid-category`
- [ ] Should show "Shop invalid-category" title
- [ ] No listings should display (or fallback to all)

#### Test 9.3: Invalid Radius
- [ ] Navigate to `/marketplace?radius=abc`
- [ ] Should ignore invalid radius
- [ ] Fall back to regular filtering

#### Test 9.4: Missing Location Coords
- [ ] Navigate to `/marketplace?radius=25` (without userLat/userLng)
- [ ] Should ignore radius parameter
- [ ] Should show listings without distance filtering

---

## Known Issues / Future Improvements

- [ ] Price range filter: Placeholder, needs implementation
- [ ] Seller rating filter: Placeholder, needs implementation
- [ ] Mobile: Consider 1-column grid for very small screens
- [ ] Image optimization: Consider Next.js Image component for better performance
- [ ] Distance accuracy: Currently uses ST_Distance (good), could use ST_DistanceSpheroid (more accurate)

---

## Quick Test Script (Copy-Paste)

Run these steps in order for a complete smoke test:

1. **Setup**: Run SQL migration
2. **Basic**: Visit `/marketplace`, verify 8 categories + "All"
3. **Category**: Click "Books", verify URL `?category=books`, title "Shop Books"
4. **Reorder**: Verify "Books" moved to first position
5. **Condition**: Select "New", verify URL adds `?condition=New`
6. **Location**: Click "Enable location", grant permission
7. **Radius**: Drag slider to 10, verify URL `?radius=10&userLat=...`
8. **Grid**: Verify 4-column grid, square images, distance badges
9. **Click Card**: Click any card, verify navigates to `/item/[id]`
10. **Share URL**: Copy URL, open in new tab, verify filters persist
11. **Back Button**: Press back, verify returns to previous state
12. **Empty**: Set impossible filters, verify empty state message

---

## Success Criteria

✅ All category chips functional and reorder correctly
✅ Page title updates dynamically with category
✅ Location slider requests permission and updates URL
✅ Radius filtering works when location enabled
✅ Product grid shows square images (1:1 aspect ratio)
✅ Responsive: 4 cols desktop, 3 tablet, 2 mobile
✅ Distance badges show for radius-filtered listings
✅ All filters work together (category + condition + radius)
✅ URLs are shareable and stateful
✅ Browser back/forward works correctly
✅ Keyboard accessible (focus rings, aria attributes)
✅ Empty states handled gracefully

---

## Troubleshooting

### Slider Doesn't Enable
- Check browser console for geolocation errors
- Verify HTTPS (geolocation requires secure context)
- Check browser permissions settings

### Radius Filtering Returns No Results
- Verify PostGIS extension installed: `SELECT * FROM pg_extension WHERE extname = 'postgis';`
- Verify function exists: `\df filter_by_radius` in psql
- Verify listings have lat/lng data: `SELECT COUNT(*) FROM listings WHERE latitude IS NOT NULL;`
- Test RPC directly in Supabase SQL Editor

### Images Not Square
- Check if `padding-top: 100%` technique is rendering correctly
- Verify parent container has `relative` positioning
- Check if Tailwind is purging necessary classes

### Categories Not Reordering
- Check browser console for React errors
- Verify CategoryBar useEffect is running
- Check if CATEGORIES array is being mutated correctly

# Mobile Homepage Testing Guide

## What Was Fixed

### Issues Found:
1. ❌ **MobileHome component was NOT imported** in `app/page.tsx`
2. ❌ **MobileHome component was NOT rendered** anywhere
3. ❌ **Missing viewport meta tag** (required for responsive behavior in browsers)

### Solutions Applied:
1. ✅ Added viewport metadata to `app/layout.tsx`
2. ✅ Imported MobileHome in `app/page.tsx`
3. ✅ Rendered MobileHome with proper responsive visibility
4. ✅ Added debug toggle for desktop testing

---

## How to Test

### Method 1: Desktop Browser with Debug Toggle (EASIEST)

**For quick testing without changing browser size:**

1. Open your browser
2. Visit: `http://localhost:3000/?showMobile=1`
3. ✅ You should see the **mobile homepage** with compact header
4. Remove `?showMobile=1` to see desktop version

**Why this works:**
- The `?showMobile=1` query parameter forces the mobile layout to show
- Desktop layout is hidden when this flag is active
- Perfect for quick iteration and screenshot testing

---

### Method 2: Desktop Browser with DevTools (STANDARD)

**For testing responsive behavior:**

1. Open Chrome/Edge/Firefox
2. Press `F12` (or `Cmd+Opt+I` on Mac) to open DevTools
3. Click the **"Toggle Device Toolbar"** icon (or press `Cmd+Shift+M` / `Ctrl+Shift+M`)
4. Select a mobile device from the dropdown:
   - iPhone 14 Pro
   - iPhone SE
   - Pixel 7
   - Or set custom width < 768px

5. Refresh the page
6. ✅ You should see the mobile homepage

**Breakpoint Info:**
- Mobile: `< 768px` width → Shows MobileHome
- Desktop: `≥ 768px` width → Shows desktop homepage
- Tailwind `md` breakpoint = 768px

---

### Method 3: Real Mobile Device (PRODUCTION TEST)

**For actual touch/gesture testing:**

1. Get your phone on same WiFi as dev machine
2. Find your computer's IP address:
   - Mac: `System Settings → Network`
   - Windows: `ipconfig` in Command Prompt
   - Linux: `ifconfig` or `ip addr`

3. On your phone's browser, visit:
   ```
   http://[YOUR_IP]:3000
   ```
   Example: `http://192.168.1.100:3000`

4. ✅ Mobile homepage should show automatically

**Test checklist:**
- [ ] Compact header visible at top
- [ ] Hamburger menu (3 lines) opens drawer
- [ ] Drawer slides in from right
- [ ] Categories scroll horizontally
- [ ] All buttons/links are tappable (44px min)
- [ ] No desktop header/footer showing
- [ ] Verified listings scroll horizontally

---

## Troubleshooting

### "I still see the desktop homepage on mobile"

**Check:**
1. Browser viewport width is < 768px
2. Hard refresh the page (`Cmd+Shift+R` / `Ctrl+Shift+R`)
3. Clear browser cache
4. Try `?showMobile=1` debug flag
5. Check browser console for errors

### "I see both mobile AND desktop layouts"

**This means:**
- The CSS classes might be conflicting
- Check that you're not using browser zoom (should be 100%)
- Try in incognito/private mode

### "Mobile layout doesn't look right"

**Check:**
1. Images may be missing (placeholder paths need real images)
2. Fonts might not load on first render
3. Check browser console for 404 errors

### "Debug toggle (?showMobile=1) doesn't work"

**Make sure:**
1. You're using the FULL URL: `http://localhost:3000/?showMobile=1`
2. The `?` is included before `showMobile`
3. You refreshed after adding the parameter
4. Check `app/page.tsx` has `searchParams` prop

---

## Code Changes Summary

### File: `app/layout.tsx`
**Added viewport metadata:**
```tsx
export const metadata: Metadata = {
  title: "UME - University Market Exchange",
  description: "Buy and sell items safely within your university community",
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
};
```

### File: `app/page.tsx`
**Added MobileHome import and rendering:**
```tsx
import MobileHome from '@/components/MobileHome'

export default async function Home({
  searchParams,
}: {
  searchParams: { showMobile?: string }
}) {
  const debugForceMobile = searchParams.showMobile === '1'

  return (
    <>
      {/* Mobile */}
      <div className={debugForceMobile ? '' : 'md:hidden'}>
        <MobileHome />
      </div>

      {/* Desktop */}
      <main className={`... ${debugForceMobile ? 'hidden' : 'hidden md:block'}`}>
        {/* existing desktop content */}
      </main>
    </>
  )
}
```

### File: `components/MobileHome.tsx`
**Removed duplicate `md:hidden`** (now controlled by parent)

---

## Production Deployment

### Option 1: Keep Debug Toggle
- Useful for QA testing
- Only activated with `?showMobile=1`
- No security risk
- Recommended: **Keep it**

### Option 2: Remove Debug Toggle
If you want to remove the debug feature:

1. In `app/page.tsx`, remove:
   ```tsx
   // Remove these lines:
   searchParams,
   const debugForceMobile = searchParams.showMobile === '1'
   ```

2. Change:
   ```tsx
   // From:
   <div className={debugForceMobile ? '' : 'md:hidden'}>

   // To:
   <div className="md:hidden">
   ```

3. Change:
   ```tsx
   // From:
   <main className={`... ${debugForceMobile ? 'hidden' : 'hidden md:block'}`}>

   // To:
   <main className="... hidden md:block">
   ```

---

## Expected Behavior

### On Mobile Devices (< 768px):
- ✅ MobileHome component visible
- ✅ Compact header with UME logo
- ✅ Search, Cart, Menu icons (right side)
- ✅ Horizontal scrolling categories
- ✅ Hero with CTA button
- ✅ Verified listings carousel
- ✅ Email signup strip
- ✅ Desktop homepage hidden

### On Desktop (≥ 768px):
- ✅ Desktop homepage visible (Hero, FeatureSlider, etc.)
- ✅ Full desktop header (from HeaderWrapper)
- ✅ MobileHome component hidden
- ✅ Standard footer

### With `?showMobile=1` on Desktop:
- ✅ MobileHome component visible (forced)
- ✅ Desktop homepage hidden
- ✅ Perfect for screenshots and testing

---

## Next Steps

1. **Test on your phone** using Method 3
2. **Replace placeholder images** in MobileHome component:
   - `/hero-mobile.jpg`
   - `/placeholder-laptop.jpg`
   - `/placeholder-chair.jpg`
   - `/placeholder-books.jpg`

3. **Customize categories** in `components/MobileHome.tsx`:
   - Update emoji icons to real SVGs
   - Match your actual marketplace categories

4. **Optional: Add scroll-snap** for smoother category scrolling

5. **Deploy and test** on real mobile browsers (Safari iOS, Chrome Android)

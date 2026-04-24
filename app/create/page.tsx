// app/create/page.tsx
import type { Metadata } from 'next'
import { handleCreateListing } from './actions'
import ImageUploaderClean from '@/components/listings/ImageUploaderClean'
import FulfillmentFields from '@/components/listings/FulfillmentFields'
import CreateListingInteractive from '@/components/listings/CreateListingInteractive'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = {
  title: 'Create Listing - UME',
}

export default function CreateListingPage() {
  return (
    <div className="min-h-screen bg-ume-bg">

      {/* ── Top banner strip ───────────────────────────────────────────── */}
      <div
        className="h-2 w-full"
        style={{ background: 'linear-gradient(90deg, #130170 0%, #fa9ebc 100%)' }}
        aria-hidden="true"
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-ume-indigo tracking-tight">
            New Listing
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Fill in the details below and your item will be live in seconds.
          </p>
        </div>

        {/* Server form — uses the server action exported from app/create/actions.ts */}
        <form action={handleCreateListing} className="space-y-6">

          {/* ── Section 1: Photos ───────────────────────────────────────── */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #130170, #fa9ebc)' }}
              aria-hidden="true"
            />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-ume-indigo flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ume-indigo text-white text-xs font-black">
                  1
                </span>
                Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Add up to 5 photos. The first photo is your cover image.{' '}
                <span className="text-ume-indigo font-medium">Required.</span>
              </p>
              <ImageUploaderClean />
            </CardContent>
          </Card>

          {/* ── Section 2: Details ─────────────────────────────────────── */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #130170, #fa9ebc)' }}
              aria-hidden="true"
            />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-ume-indigo flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ume-indigo text-white text-xs font-black">
                  2
                </span>
                Item Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-muted-foreground font-normal">(required)</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  aria-required="true"
                  placeholder="e.g. IKEA Desk Lamp, barely used"
                  className="rounded-full border-border focus-visible:ring-ume-indigo"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-muted-foreground font-normal">(required)</span>
                </Label>
                <textarea
                  id="description"
                  name="description"
                  required
                  aria-required="true"
                  rows={4}
                  placeholder="Describe the item — size, colour, any flaws…"
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ume-indigo resize-none"
                />
              </div>

              <Separator />

              {/* Category + Condition — interactive client component */}
              <CreateListingInteractive />

            </CardContent>
          </Card>

          {/* ── Section 3: Pricing ─────────────────────────────────────── */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #130170, #fa9ebc)' }}
              aria-hidden="true"
            />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-ume-indigo flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ume-indigo text-white text-xs font-black">
                  3
                </span>
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                <Label htmlFor="price" className="text-sm font-medium">
                  Price <span className="text-muted-foreground font-normal">(required)</span>
                </Label>
                <div className="relative">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium select-none pointer-events-none"
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    required
                    aria-required="true"
                    aria-label="Price in dollars"
                    placeholder="0.00"
                    className="rounded-full pl-8 border-border focus-visible:ring-ume-indigo"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Set to $0 for free / giveaway items.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 4: Fulfillment ─────────────────────────────────── */}
          <Card className="border-0 shadow-md overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{ background: 'linear-gradient(90deg, #130170, #fa9ebc)' }}
              aria-hidden="true"
            />
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-ume-indigo flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ume-indigo text-white text-xs font-black">
                  4
                </span>
                How will you sell this?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FulfillmentFields />
            </CardContent>
          </Card>

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <div className="pt-2 pb-8">
            <Button
              type="submit"
              size="lg"
              aria-label="Submit listing"
              className="w-full sm:w-auto rounded-full px-12 text-base font-bold text-white shadow-pink hover:opacity-90 transition-opacity"
              style={{ background: '#fa9ebc' }}
            >
              Post Listing
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              By posting you agree to UME&apos;s campus marketplace guidelines.
            </p>
          </div>

        </form>
      </div>
    </div>
  )
}

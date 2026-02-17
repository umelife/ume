import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/sendEmail'

/**
 * Contact Form API Route
 *
 * Handles form submissions from the Contact Us page and sends notification emails.
 */

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const { firstName, lastName, email, message } = body

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Log the contact form data
    console.log('📧 New Contact Form Submission:', {
      timestamp: new Date().toISOString(),
      name: `${firstName} ${lastName}`,
      email,
      phone: body.phone || 'Not provided',
      referralSource: body.referralSource || 'Not selected',
      signUpNewsletter: body.signUpNewsletter || false,
      message,
    })

    // Send email notification to support
    const emailHtml = `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
      ${body.phone ? `<p><strong>Phone:</strong> ${body.phone}</p>` : ''}
      ${body.referralSource ? `<p><strong>How they heard about us:</strong> ${body.referralSource}</p>` : ''}
      <p><strong>Newsletter signup:</strong> ${body.signUpNewsletter ? 'Yes' : 'No'}</p>
      <hr>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p><small>Submitted at: ${new Date().toISOString()}</small></p>
    `

    try {
      await sendEmail({
        to: process.env.SUPPORT_EMAIL || 'umelife.official@gmail.com',
        subject: `Contact Form: ${firstName} ${lastName}`,
        html: emailHtml,
      })
    } catch (emailError) {
      console.error('Failed to send contact form email:', emailError)
      // Don't fail the request if email fails - still return success to user
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Contact form submitted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact form API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import nodemailer from 'nodemailer'

// Helper to create transporter
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

// Helper to check if email is configured
function isEmailConfigured() {
  return process.env.NODE_ENV !== 'development' ||
    (process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_USER !== 'your-email@gmail.com')
}



export async function sendMagicLink(email: string, magicLink: string) {
  // Development mode - just log the magic link
  if (process.env.NODE_ENV === 'development' &&
    (!process.env.EMAIL_SERVER_USER || process.env.EMAIL_SERVER_USER === 'your-email@gmail.com')) {
    console.log('🪄 MAGIC LINK (Development Mode)')
    console.log('📧 To:', email)
    console.log('🔗 Link:', magicLink)
    console.log('👆 Click this link to sign in!')
    return
  }

  // Production mode - send actual email
  // const transporter = nodemailer.createTransport({
  //   host: process.env.EMAIL_SERVER_HOST,
  //   port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  //   auth: {
  //     user: process.env.EMAIL_SERVER_USER,
  //     pass: process.env.EMAIL_SERVER_PASSWORD,
  //   },
  // })
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })


  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Sign in to Gift List',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Sign in to Gift List</h2>
        <p>Click the link below to sign in to your Gift List account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${magicLink}"
             style="background-color: #0070f3; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Sign In
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link will expire in 24 hours. If you didn't request this email, you can safely ignore it.
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this URL into your browser:<br>
          <a href="${magicLink}" style="color: #0070f3;">${magicLink}</a>
        </p>
      </div>
    `,
    text: `
      Sign in to Gift List

      Click this link to sign in: ${magicLink}

      This link will expire in 24 hours.
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Magic link sent to:', email)
  } catch (error) {
    console.error('Failed to send magic link:', error)

    // Fallback: Log the magic link for debugging in production
    console.log('🚨 EMAIL FAILED - FALLBACK MAGIC LINK:')
    console.log('📧 To:', email)
    console.log('🔗 Link:', magicLink)
    console.log('👆 Use this link to sign in manually')

    // Still throw error so the user knows email failed
    throw new Error('Failed to send magic link')
  }
}

/**
 * Send notification when someone suggests a gift
 */
export async function sendSuggestionNotification(
  toEmail: string,
  recipientName: string,
  suggesterName: string | null, // null if anonymous
  itemName: string,
  appUrl: string
) {
  if (!isEmailConfigured()) {
    console.log('💡 NEW SUGGESTION NOTIFICATION (Development Mode)')
    console.log('📧 To:', toEmail)
    console.log('👤 From:', suggesterName || 'Anonymous')
    console.log('🎁 Item:', itemName)
    return
  }

  const transporter = createTransporter()
  const fromDisplay = suggesterName || 'Someone'

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `${fromDisplay} suggested a gift idea for you!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Gift Suggestion! 💡</h2>
        <p>Hi ${recipientName},</p>
        <p><strong>${fromDisplay}</strong> thinks you might like:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 18px; margin: 0; color: #333;">${itemName}</p>
        </div>
        <p>Log in to view the suggestion and add it to your list:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}"
             style="background-color: #eab308; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View Suggestion
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          You can approve this suggestion to add it to your wishlist, or decline it if it's not your style.
        </p>
      </div>
    `,
    text: `
      New Gift Suggestion!

      Hi ${recipientName},

      ${fromDisplay} thinks you might like: ${itemName}

      Log in to view the suggestion: ${appUrl}
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Suggestion notification sent to:', toEmail)
  } catch (error) {
    console.error('Failed to send suggestion notification:', error)
    // Don't throw - notification emails are not critical
  }
}

/**
 * Send notification when a suggestion is declined (with optional reason)
 */
export async function sendSuggestionDeclinedNotification(
  toEmail: string,
  suggesterName: string,
  recipientName: string,
  itemName: string,
  reason?: string
) {
  if (!isEmailConfigured()) {
    console.log('❌ SUGGESTION DECLINED NOTIFICATION (Development Mode)')
    console.log('📧 To:', toEmail)
    console.log('👤 Declined by:', recipientName)
    console.log('🎁 Item:', itemName)
    if (reason) console.log('📝 Reason:', reason)
    return
  }

  const transporter = createTransporter()

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: `Update on your gift suggestion for ${recipientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Suggestion Update</h2>
        <p>Hi ${suggesterName},</p>
        <p>${recipientName} reviewed your gift suggestion:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 18px; margin: 0; color: #333;">${itemName}</p>
        </div>
        <p>Unfortunately, they've decided to pass on this one.</p>
        ${reason ? `
        <p><strong>Their note:</strong></p>
        <p style="font-style: italic; color: #666;">"${reason}"</p>
        ` : ''}
        <p style="color: #666; font-size: 14px;">
          Don't worry - your other suggestions might be just what they're looking for!
        </p>
      </div>
    `,
    text: `
      Suggestion Update

      Hi ${suggesterName},

      ${recipientName} reviewed your gift suggestion: ${itemName}

      Unfortunately, they've decided to pass on this one.
      ${reason ? `\nTheir note: "${reason}"` : ''}
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('Suggestion declined notification sent to:', toEmail)
  } catch (error) {
    console.error('Failed to send suggestion declined notification:', error)
    // Don't throw - notification emails are not critical
  }
}

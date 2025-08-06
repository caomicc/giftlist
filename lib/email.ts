import nodemailer from 'nodemailer'



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
    throw new Error('Failed to send magic link')
  }
}

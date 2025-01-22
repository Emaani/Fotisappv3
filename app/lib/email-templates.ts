export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Fotis Agro Trading Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Welcome to Fotis Agro!</h1>
        <p>Dear ${name},</p>
        <p>Thank you for joining Fotis Agro Trading Platform.</p>
        <p>Best regards,<br>The Fotis Agro Team</p>
      </div>
    `,
  }),
  // Add other email templates
}; 
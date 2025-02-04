interface EmailParams {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

export const sendEmail = async (_params: EmailParams) => {
  // ... existing code ...
};

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to Fotis Agro Trading Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <img src="https://fotisagro.com/logo.png" alt="Fotis Agro Logo" style="max-width: 200px; margin-bottom: 20px;">
        <h1 style="color: #2C5282;">Welcome to Fotis Agro!</h1>
        <p>Dear ${name},</p>
        <p>Thank you for joining Fotis Agro Trading Platform. We're excited to have you on board!</p>
        <p>If you have any questions, please contact our support team at support@fotisagro.com</p>
        <p>Best regards,<br>The Fotis Agro Team</p>
      </div>
    `,
  }),
  
  support: (name: string, message: string) => ({
    subject: 'Support Request Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2C5282;">Support Request Received</h1>
        <p>Dear ${name},</p>
        <p>We've received your support request:</p>
        <blockquote style="border-left: 4px solid #2C5282; padding-left: 15px; margin: 15px 0;">
          ${message}
        </blockquote>
        <p>Our team will get back to you shortly.</p>
        <p>Best regards,<br>Fotis Agro Support Team</p>
      </div>
    `,
  }),

  orderConfirmation: (orderDetails: any) => ({
    subject: 'Order Confirmation - Fotis Agro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2C5282;">Order Confirmation</h1>
        <p>Thank you for your order!</p>
        <div style="background: #f7fafc; padding: 15px; border-radius: 5px;">
          <h3>Order Details:</h3>
          <p>Order ID: ${orderDetails.id}</p>
          <p>Total: ${orderDetails.total}</p>
        </div>
      </div>
    `,
  }),

  // Add other email templates
};

// Create proper error context interface
interface ErrorContext {
  error: Error;
  timestamp: string;
  stackTrace?: string;
  userId?: string;
}

// Update error notification signature
export const sendErrorNotification = async (context: ErrorContext) => {
  // ... existing code ...
}; 
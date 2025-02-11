export const sendEmail = async (options: { to: string; subject: string; html: string }) => {
  // Implement email sending logic
  console.log('Sending email:', options);
  return true;
};

export const emailTemplates = {
  welcomeEmail: (email: string) => ({
    subject: 'Welcome to Our Service',
    html: `<h1>Welcome ${email}</h1>`
  })
}; 
export const sendPasswordResetEmail = async (email: string, token: string) => {
  // Implement your email sending logic here
  console.log(`Password reset link: /reset-password?token=${token}`);
  return true;
}; 
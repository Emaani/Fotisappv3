import { render, fireEvent, waitFor } from '@testing-library/react';
import { SocialLoginButtons } from '@/components/SocialLoginButtons';
import { signIn } from 'next-auth/react';

jest.mock('next-auth/react');

describe('SocialLoginButtons', () => {
  it('handles Google login correctly', async () => {
    const { getByText } = render(<SocialLoginButtons />);
    const googleButton = getByText('Continue with Google');
    
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
        redirect: false,
      });
    });
  });
}); 
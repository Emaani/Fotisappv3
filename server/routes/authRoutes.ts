import express from 'express';
import passport from 'passport';
import { signUp } from '../controllers/authController';

const router = express.Router();

// Local authentication route
router.post('/signup', signUp);

// Google OAuth routes
router.get('/auth/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false
  })
);

router.get('/auth/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/',
    session: false
  }),
  (req, res) => {
    // Generate token
    const token = generateToken(req.user);
    
    // Set cookie with the token
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });
    
    res.redirect('/dashboard'); // Redirect to your desired page
  }
);

// Facebook OAuth routes
router.get('/auth/facebook',
  passport.authenticate('facebook', {
    session: false
  })
);

router.get('/auth/facebook/callback',
  passport.authenticate('facebook', { 
    failureRedirect: '/',
    session: false
  }),
  (req, res) => {
    // Generate token
    const token = generateToken(req.user);
    
    // Set cookie with the token
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    });
    
    res.redirect('/dashboard'); // Redirect to your desired page
  }
);

// Add logout route
router.get('/logout', (req, res) => {
  res.clearCookie('authToken');
  res.redirect('/');
});

// Helper function to generate token (implement based on your token strategy)
function generateToken(user: any) {
  // Implementation depends on your authentication strategy
  // For example, using JWT:
  // return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  
  // Placeholder:
  return `token_for_user_${user.id}`;
}

export default router;
import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import './middleware/authMiddleware'; // Initialize passport strategies

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure cookie parser with a strong secret
const cookieSecret = process.env.COOKIE_SECRET || 'fallback_secret_change_me_in_production';
app.use(cookieParser(cookieSecret));

// Initialize passport (without sessions since we're using token-based auth)
app.use(passport.initialize());

// Custom middleware to extract auth token from cookie
app.use((req, res, next) => {
  const token = req.signedCookies.authToken;
  if (token) {
    // For JWT authentication, you might want to verify and decode the token here
    // and attach the user object to the request
    try {
      // Example with JWT:
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // req.user = decoded;
      
      // Or simply pass the token to passport via headers for Bearer authentication
      req.headers.authorization = `Bearer ${token}`;
    } catch (error) {
      // Token is invalid - clear the cookie
      res.clearCookie('authToken');
    }
  }
  next();
});

// API Routes
app.use('/api', authRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
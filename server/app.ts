import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
// No need to import anything from config/db for connection purposes
// The Prisma client is already initialized in '@/app/lib/prisma'

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
// No explicit connection needed as Prisma client automatically connects when first used
console.log('Prisma client will connect automatically on first query');

// API routes
app.use('/api/auth', authRoutes);

export default app;
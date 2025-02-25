// server/models/user.ts
import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface UserCreateInput {
  email: string;
  password: string;
  role?: string;
}

interface UserUpdateInput {
  email?: string;
  password?: string;
  role?: string;
}

// Helper functions for user model operations
export const UserModel = {
  // Create a new user
  async create(data: UserCreateInput): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role || 'USER',
      },
    });
  },
  
  // Find a user by email
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  },
  
  // Find a user by ID
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  },
  // Update a user
  async update(id: number, data: UserUpdateInput): Promise<User> {
    // If updating password, hash it first
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }
    return prisma.user.update({
      where: { id: id.toString() },
      data,
    });
  },
  // Delete a user
  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  },
  
  // Validate a user's password
  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  },
};

export default UserModel;
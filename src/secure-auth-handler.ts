import { z } from 'zod';
import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Handles user login with protection against timing attacks.
 */
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const result = LoginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }
    const { email, password } = result.data;

    const user = await findUserByEmail(email);

    // Constant-time comparison to prevent user enumeration
    const DUMMY_HASH = '$2b$12$0000000000000000000000000000000000000000000000000000';
    const targetHash = user?.passwordHash || DUMMY_HASH;
    
    const isValidPassword = await bcrypt.compare(password, targetHash);

    if (!user || !isValidPassword) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // Session logic would go here...
    
    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ error: 'AUTH_ERROR' });
  }
};

interface User {
  id: string;
  email: string;
  passwordHash: string;
}

// Mock implementation
async function findUserByEmail(email: string): Promise<User | null> {
  return null; 
}
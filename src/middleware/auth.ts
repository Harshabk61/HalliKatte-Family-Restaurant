import { eq } from 'drizzle-orm';
import { NextFunction, Request, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { adminUsers, users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  adminRole?: string;
}

export async function syncUserRecord(
  uid: string,
  email: string,
  displayName?: string | null,
) {
  const normalizedEmail = email.trim().toLowerCase();
  const [adminMatch] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  const role = adminMatch && adminMatch.isActive ? adminMatch.role : 'customer';

  const result = await db
    .insert(users)
    .values({
      uid,
      email: normalizedEmail,
      displayName: displayName ?? null,
      role,
    })
    .onConflictDoUpdate({
      target: users.uid,
      set: {
        email: normalizedEmail,
        displayName: displayName ?? null,
        role,
      },
    })
    .returning();

  return result[0];
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.email) {
    return res.status(403).json({ error: 'Forbidden: Email required' });
  }

  try {
    const synced = await syncUserRecord(
      req.user.uid,
      req.user.email,
      req.user.name,
    );

    if (synced.role !== 'admin' && synced.role !== 'staff') {
      return res
        .status(403)
        .json({ error: 'Forbidden: Restaurant admin access required' });
    }

    req.adminRole = synced.role;
    next();
  } catch (error) {
    console.error('Error verifying admin privileges:', error);
    return res
      .status(500)
      .json({ error: 'Unable to verify administrator privileges' });
  }
};

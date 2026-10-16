import { Router } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword } from '../db.ts';
import { generateToken, requireAuth, AuthenticatedRequest } from '../auth.ts';

export const authRouter = Router();

authRouter.post('/register', (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    return;
  }

  const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  // Role defaults to customer. Admin accounts cannot be self-registered publicly.
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, phone, email_verified, created_at)
    VALUES (?, ?, ?, ?, 'customer', ?, 1, ?)
  `).run(userId, String(name).trim(), cleanEmail, passwordHash, phone ? String(phone).trim() : null, now);

  const userObj = { id: userId, name: String(name).trim(), email: cleanEmail, role: 'customer' as const, phone };
  const token = generateToken(userObj);

  res.status(201).json({
    message: 'Account created successfully! Welcome to Maha Nepal Trips.',
    token,
    user: userObj
  });
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT id, name, email, password_hash, role, phone FROM users WHERE email = ?').get(cleanEmail) as {
    id: string;
    name: string;
    email: string;
    password_hash: string;
    role: 'admin' | 'customer';
    phone: string | null;
  } | undefined;

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const hashedInput = hashPassword(password);
  if (user.password_hash !== hashedInput) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const userObj = { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone || undefined };
  const token = generateToken(userObj);

  res.json({
    message: 'Welcome back!',
    token,
    user: userObj
  });
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const user = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

authRouter.post('/reset-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Email is required.' });
    return;
  }

  // Simulated password reset token/link dispatch
  res.json({
    message: 'If an account exists with this email address, a password reset link has been dispatched.'
  });
});

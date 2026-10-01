import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { User, UserRole } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "resqnet_dev_secret_change_me";
const TOKEN_TTL = "7d";

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function verifyPassword(plain: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

export function signToken(user: User): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function extractBearer(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function requireUser(req: Request): JwtPayload | null {
  const token = extractBearer(req);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAdmin(req: Request): JwtPayload | null {
  const payload = requireUser(req);
  if (!payload || payload.role !== "admin") return null;
  return payload;
}

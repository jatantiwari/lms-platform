import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UnauthorizedError } from '../utils/AppError';

// Extend Express Request type with authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Verifies the Bearer access token from the Authorization header.
 * Attaches decoded payload to req.user.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

/**
 * Optional authenticate — attaches user if token is present but does not
 * block requests without a token (used for public routes that have auth-aware logic).
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // Silently ignore invalid tokens on optional routes
    }
  }
  next();
};

/**
 * Strict-optional authenticate — like optionalAuthenticate but throws 401 when
 * a token IS present but invalid/expired. This lets clients (mobile, web) trigger
 * their token-refresh flow rather than silently being treated as unauthenticated,
 * which would deny them access to paid content they are enrolled in.
 *
 * Also accepts a JWT via the `?token=` query parameter as a fallback for native
 * video players (e.g. expo-av on mobile) that cannot set custom HTTP headers.
 * The Authorization header is checked first; ?token= is only used when no header
 * is present.
 *
 * Use on routes that are public for genuinely unauthenticated users (no token at all)
 * but require valid auth for users who hold a token (e.g. HLS streaming).
 */
export const strictOptionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  // Prefer Authorization header; fall back to ?token= query param (for native players)
  const rawToken = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : (req.query.token as string | undefined);

  if (rawToken) {
    try {
      req.user = verifyAccessToken(rawToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }
  next();
};

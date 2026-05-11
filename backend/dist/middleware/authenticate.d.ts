import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '../utils/jwt';
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
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Optional authenticate — attaches user if token is present but does not
 * block requests without a token (used for public routes that have auth-aware logic).
 */
export declare const optionalAuthenticate: (req: Request, _res: Response, next: NextFunction) => void;
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
export declare const strictOptionalAuthenticate: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authenticate.d.ts.map
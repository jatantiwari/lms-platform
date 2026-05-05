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
//# sourceMappingURL=authenticate.d.ts.map
import { JwtPayload } from 'jsonwebtoken';
export interface TokenPayload extends JwtPayload {
    userId: string;
    role: string;
    email: string;
}
/**
 * Generates a short-lived access token (default 15 minutes).
 */
export declare function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
/**
 * Generates a long-lived refresh token (default 7 days).
 */
export declare function generateRefreshToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string;
/**
 * Verifies and decodes an access token.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 */
export declare function verifyAccessToken(token: string): TokenPayload;
/**
 * Verifies and decodes a refresh token.
 */
export declare function verifyRefreshToken(token: string): TokenPayload;
//# sourceMappingURL=jwt.d.ts.map
import { sign, verify } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { Redis } from 'ioredis';

interface TokenPayload {
  userId: string;
  role: string;
  sessionId: string;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;
  private readonly redis: Redis;

  constructor() {
    // Secrets should be loaded from environment variables
    this.accessTokenSecret = process.env.ACCESS_TOKEN_SECRET!;
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET!;
    this.accessTokenExpiry = '15m'; // 15 minutes
    this.refreshTokenExpiry = '7d';  // 7 days
    this.redis = new Redis(process.env.REDIS_URL);
  }

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(payload: TokenPayload): Promise<TokenResponse> {
    // Generate a unique session ID
    const sessionId = randomBytes(32).toString('hex');
    
    // Include session ID in the payload
    const tokenPayload = { ...payload, sessionId };

    // Generate access token
    const accessToken = sign(tokenPayload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      algorithm: 'HS512', // Using stronger algorithm
    });

    // Generate refresh token with different secret
    const refreshToken = sign(tokenPayload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      algorithm: 'HS512',
    });

    // Hash the refresh token before storing
    const refreshTokenHash = this.hashToken(refreshToken);

    // Store refresh token in Redis with user info
    await this.redis.setex(
      `refresh_token:${refreshTokenHash}`,
      7 * 24 * 60 * 60, // 7 days in seconds
      JSON.stringify({
        userId: payload.userId,
        sessionId,
        role: payload.role,
      })
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload | null {
    try {
      const payload = verify(token, this.accessTokenSecret) as TokenPayload;
      
      // Additional validation
      if (!payload.userId || !payload.sessionId) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse | null> {
    try {
      // Verify refresh token
      const payload = verify(refreshToken, this.refreshTokenSecret) as TokenPayload;
      
      // Get stored refresh token info
      const refreshTokenHash = this.hashToken(refreshToken);
      const storedToken = await this.redis.get(`refresh_token:${refreshTokenHash}`);
      
      if (!storedToken) {
        return null;
      }

      const tokenInfo = JSON.parse(storedToken);

      // Verify session matches
      if (tokenInfo.sessionId !== payload.sessionId) {
        await this.revokeRefreshToken(refreshToken);
        return null;
      }

      // Generate new token pair
      return this.generateTokens({
        userId: tokenInfo.userId,
        role: tokenInfo.role,
        sessionId: tokenInfo.sessionId,
      });
    } catch {
      return null;
    }
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const refreshTokenHash = this.hashToken(refreshToken);
    await this.redis.del(`refresh_token:${refreshTokenHash}`);
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:*`;
    const keys = await this.redis.keys(pattern);
    
    for (const key of keys) {
      const tokenInfo = await this.redis.get(key);
      if (tokenInfo) {
        const info = JSON.parse(tokenInfo);
        if (info.userId === userId) {
          await this.redis.del(key);
        }
      }
    }
  }

  /**
   * Hash token for storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

export const tokenService = new TokenService(); 
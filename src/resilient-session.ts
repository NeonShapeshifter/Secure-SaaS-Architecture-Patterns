import { CircuitBreaker } from './utils/circuit-breaker.js';

const redisCircuitBreaker = new CircuitBreaker({
  threshold: 5,
  timeout: 60000,
  name: 'redis-token-revocation'
});

/**
 * Checks revocation status using a fail-closed strategy.
 * If the backing store (Redis) is unavailable, requests are rejected for security.
 */
export async function isTokenRevoked(sessionId: string): Promise<boolean> {
  try {
    return await redisCircuitBreaker.execute(async () => {
      const redis = await getRedisConnection();
      
      if (redis) {
        const isRevoked = await (redis as any).get(`revoked:session:${sessionId}`);
        return !!isRevoked;
      }

      // Safe default for uninitialized client
      return true; 
    });
  } catch (error) {
    console.error('Redis unavailable, failing closed.');
    return true; 
  }
}

async function getRedisConnection(): Promise<{ get: (key: string) => Promise<string | null> } | null> { return null; }
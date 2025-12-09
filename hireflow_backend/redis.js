/**
 * Redis (Vultr Valkey) Cache Module
 * Used for caching candidate data, sessions, and agent responses
 */

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient;

export async function initializeRedis() {
  try {
    // Parse Redis URL
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Redis reconnect failed after 10 attempts');
            return new Error('Redis max retries exceeded');
          }
          return retries * 100;
        }
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected');
    });
    
    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis not available, using in-memory cache:', error.message);
    return null;
  }
}

// In-memory fallback cache
const memoryCache = new Map();

export async function setRedis(key, value, expirationSeconds = 3600) {
  try {
    if (redisClient) {
      await redisClient.setEx(key, expirationSeconds, value);
    } else {
      // Fallback to memory
      memoryCache.set(key, value);
      if (expirationSeconds > 0) {
        setTimeout(() => memoryCache.delete(key), expirationSeconds * 1000);
      }
    }
  } catch (error) {
    console.error('Error setting cache:', error);
    memoryCache.set(key, value);
  }
}

export async function getRedis(key) {
  try {
    if (redisClient) {
      return await redisClient.get(key);
    } else {
      return memoryCache.get(key) || null;
    }
  } catch (error) {
    console.error('Error getting cache:', error);
    return memoryCache.get(key) || null;
  }
}

export async function deleteRedis(key) {
  try {
    if (redisClient) {
      await redisClient.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    console.error('Error deleting cache:', error);
    memoryCache.delete(key);
  }
}

export function getRedisClient() {
  return redisClient;
}

import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '..', '.env.test'),
});

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  process.env.SESSION_SECRET = 'test-session-secret-min-32-characters-long-x';
}

if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
  process.env.ENCRYPTION_KEY = 'test-encryption-key-min-32-characters-long-x';
}

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

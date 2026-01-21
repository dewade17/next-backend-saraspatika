process.env.TZ = process.env.TZ || 'UTC';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.APP_URL = process.env.APP_URL || 'http://localhost:3000';

// envalid:url() butuh URL valid. Untuk test mock, cukup string postgres URL valid:
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/saraspatika_test';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-please-change';
process.env.GMAIL_USER = process.env.GMAIL_USER || 'test@example.com';
process.env.GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'test-app-pass';

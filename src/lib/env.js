import { cleanEnv, str, url } from 'envalid';
export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
  APP_URL: url(),
  DATABASE_URL: url(),
  JWT_SECRET: str(),
  GMAIL_USER: str(),
  GMAIL_APP_PASSWORD: str(),
  NEXTCLOUD_URL: str(),
  NEXTCLOUD_USER: str(),
  NEXTCLOUD_PASS: str(),
});

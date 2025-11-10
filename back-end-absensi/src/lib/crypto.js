import bcrypt from 'bcryptjs';
export const hashPassword = (pwd) => bcrypt.hash(pwd, 12);
export const verifyPassword = (pwd, hash) => bcrypt.compare(pwd, hash);
export const sixDigit = () => String(Math.floor(100000 + Math.random() * 900000));

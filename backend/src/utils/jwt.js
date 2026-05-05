import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const generateVerificationToken = () => {
  return jwt.sign(
    { purpose: 'email_verification', timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const generateResetToken = () => {
  return jwt.sign(
    { purpose: 'password_reset', timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

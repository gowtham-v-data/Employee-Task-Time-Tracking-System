import { User } from '../models/index.js';
import { generateToken, generateVerificationToken, generateResetToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

// Register new employee (self-registration)
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: 'employee',
      email_verified: false,
      verification_token: verificationToken,
      verification_token_expires: tokenExpires
    });

    // Send verification email
    await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      where: {
        verification_token: token
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification link'
      });
    }

    if (user.verification_token_expires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Verification link expired. Please request a new one.'
      });
    }

    // Update user
    user.email_verified = true;
    user.verification_token = null;
    user.verification_token_expires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully. You can now login.'
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked due to multiple failed login attempts. Please try again later or contact administrator.'
      });
    }

    // Check if email is verified (for self-registered employees)
    if (user.role === 'employee' && !user.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address first'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      user.failed_login_attempts += 1;
      
      // Lock account after 5 failed attempts
      if (user.failed_login_attempts >= 5) {
        user.locked_until = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      
      await user.save();

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset failed login attempts on successful login
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.last_login = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Request password reset
export const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    // Don't reveal if email exists or not (security)
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.reset_token = resetToken;
    user.reset_token_expires = tokenExpires;
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

// Reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      where: {
        reset_token: token
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    if (user.reset_token_expires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Reset token expired. Please request a new one.'
      });
    }

    // Update password
    user.password = password;
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'verification_token', 'reset_token'] }
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

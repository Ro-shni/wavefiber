import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/forgot-password/request
// @desc    Request password reset (generates token)
// @access  Public
router.post('/request', async (req, res) => {
  try {
    const { identifier } = req.body; // Can be phone or email

    if (!identifier) {
      return res.status(400).json({ success: false, message: 'Please provide phone number or email' });
    }

    // Find user by phone or email
    const user = await User.findOne({
      $or: [
        { phone: identifier },
        { email: identifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this identifier' });
    }

    // Generate reset token (6-digit code)
    const resetToken = crypto.randomInt(100000, 999999).toString();
    
    // Hash token and set expiry (15 minutes)
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    // In a real application, send this via SMS/Email
    // For now, we'll return it in the response (NOT SECURE - for development only)
    console.log(`Password reset token for ${user.name}: ${resetToken}`);

    res.json({
      success: true,
      message: 'Password reset code sent successfully',
      // REMOVE THIS IN PRODUCTION - only for development
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      identifier: user.phone || user.email
    });
  } catch (error) {
    console.error('Forgot password request error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/forgot-password/verify
// @desc    Verify reset token and set new password
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { identifier, resetToken, newPassword } = req.body;

    if (!identifier || !resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' });
    }

    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      $or: [
        { phone: identifier },
        { email: identifier.toLowerCase() }
      ],
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Password reset verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;


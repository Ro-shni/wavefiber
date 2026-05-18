import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpiry -resetPasswordToken -resetPasswordExpiry');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// @route   PATCH /api/profile
// @desc    Update user profile
// @access  Private
router.patch('/', protect, async (req, res) => {
  try {
    const { name, address, block, vcRId, phone } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (address !== undefined) user.address = address;
    if (block !== undefined) user.block = block;
    if (vcRId !== undefined) user.vcRId = vcRId;
    
    // Allow phone update (with duplicate check)
    if (phone && phone !== user.phone) {
      if (phone.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits'
        });
      }
      
      // Check if phone number is already taken by another user
      const existingUser = await User.findOne({ 
        phone: phone,
        _id: { $ne: user._id } // Exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered to another account'
        });
      }
      
      user.phone = phone;
      user.isPhoneVerified = false; // Require re-verification
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        address: user.address,
        block: user.block,
        vcRId: user.vcRId,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This phone number is already in use by another account'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating profile. Please try again.'
    });
  }
});

export default router;


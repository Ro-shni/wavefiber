import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Technician from '../models/Technician.js';
import { OAuth2Client } from 'google-auth-library';
import { sendNotification } from '../utils/sendNotification.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Resolve role and technician details from the Technician collection.
// If a Technician record exists for this user (by userId or email),
// auto-correct the User's role to 'technician' and link the records.
async function resolveRoleAndTechnicianDetails(user) {
  let technicianDetails = await Technician.findOne({ userId: user._id })
    || await Technician.findOne({ email: user.email });

  if (technicianDetails) {
    // Auto-correct role if User record is out of sync
    if (user.role !== 'technician') {
      user.role = 'technician';
      await user.save();
    }
    // Back-fill userId on Technician if it was matched by email only
    if (!technicianDetails.userId || technicianDetails.userId.toString() !== user._id.toString()) {
      technicianDetails.userId = user._id;
      await technicianDetails.save();
    }
    // Back-fill email on Technician if missing
    if (!technicianDetails.email) {
      technicianDetails.email = user.email;
      await technicianDetails.save();
    }
  }

  return technicianDetails;
}

// @route   POST /api/auth/google
// @desc    Google OAuth authentication
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Google credential is required'
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, email_verified } = payload;

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user
      user = await User.create({
        name,
        email: email.toLowerCase(),
        googleId,
        role: 'customer',
        isEmailVerified: email_verified || false
      });
    } else {
      // Update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = email_verified || false;
        await user.save();
      }
    }

    // Resolve role from Technician collection (auto-corrects User.role if needed)
    const technicianDetails = await resolveRoleAndTechnicianDetails(user);

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        address: user.address,
        block: user.block,
        vcRId: user.vcRId,
        isEmailVerified: user.isEmailVerified
      },
      technicianDetails
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error authenticating with Google'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user with email and password
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check password
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please use Google Sign-In for this account'
      });
    }

    const isPasswordMatch = await user.matchPassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Resolve role from Technician collection (auto-corrects User.role if needed)
    const technicianDetails = await resolveRoleAndTechnicianDetails(user);

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        address: user.address,
        block: user.block,
        vcRId: user.vcRId,
        isEmailVerified: user.isEmailVerified
      },
      technicianDetails
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user with email
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, address, block, vcRId } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide an email address' 
      });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 4 characters' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'customer',
      address,
      block,
      vcRId
    });

    // If creating a technician, also create technician record
    if (role === 'technician' && phone) {
      await Technician.create({
        name,
        email: email.toLowerCase(),
        phone,
        block: block || 'A1',
        userId: user._id
      });
      
      // Notify managers about the new technician
      const managers = await User.find({ role: 'manager' });
      for (const manager of managers) {
        await sendNotification(
          req,
          manager._id,
          'New Technician Registered',
          `A new technician, ${name}, has joined the network for block ${block || 'A1'}.`,
          'SYSTEM',
          user._id
        );
      }
    }

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        address: user.address,
        block: user.block,
        vcRId: user.vcRId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

export default router;


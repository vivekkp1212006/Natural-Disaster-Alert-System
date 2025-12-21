const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;

    // 1. Check required fields
    if (!name || !email || !password || !location) {
      return res.status(400).json({
        message: 'Please fill all required fields',
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt)

    // 3. Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      location,
      role, // optional (defaults to 'user')
    });

    // 4. Send response
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if email and password provided
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }

    // 2. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. Send response
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc   Get logged-in user profile
// @route  GET /api/auth/profile
// @access Private
const getProfile = async (req, res) => {
  try {
    res.json({
      message: 'Protected route accessed successfully',
      user: req.user,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
    });
  }
};


module.exports = { registerUser, loginUser, getProfile };

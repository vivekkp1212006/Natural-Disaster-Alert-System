const User = require('../models/User');

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

    // 3. Create new user
    const user = await User.create({
      name,
      email,
      password,
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

module.exports = { registerUser };

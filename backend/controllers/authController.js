const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { otpGenerator } = require('../utils/generateOtp');
const { sendEmail } = require('../utils/sendEmail');

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;

    // 1. Check required fields
    if (!name || !email || !password || !location ) {
      return res.status(400).json({
        message: 'Please fill all required fields',
      });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists && userExists.emailVerified) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    if (userExists && !userExists.emailVerified) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt)


      const otpData= otpGenerator();
      const emailOtp= otpData.otp;
      const emailOtpExpiresAt= otpData.expiresAt;

      userExists.password = hashedPassword;
      userExists.emailOtp = emailOtp;
      userExists.emailOtpExpiresAt = emailOtpExpiresAt;
      userExists.emailOtpPurpose = "signup" ;
      await userExists.save();

      const subject = "Your one time verification code:";
      const text = `Your OTP for sign-up is : ${emailOtp}`;
      await sendEmail(email,subject,text);

      return res.status(201).json({
        message: `OTP sent to ${email}`,
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt)

    // OTP generating
    const otpData= otpGenerator();
    const emailOtp= otpData.otp;
    const emailOtpExpiresAt= otpData.expiresAt;

    // 3. Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      location,
      role, // optional (defaults to 'user')
      emailOtp,
      emailOtpExpiresAt,
      emailOtpPurpose: "signup",
      emailVerified: false,
    });

      const subject = "Your one time verification code:";
      const text = `Your OTP for sign-up is : ${emailOtp}`;
      await sendEmail(email,subject,text);

      return res.status(201).json({
        message: `OTP sent to ${email}`,
      });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};


//@desc    Email verification
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    // logic will come next
    const user = await User.findOne({ email});

    if(!user) {
      return res.status(400).json ({
        message : "User not found"
      });
    }
    if(user.emailVerified) {
      return res.status(400).json ({
        message : "Email already verified"
      });
    }

    if(Number(otp) != user.emailOtp) {
      return res.status(400).json ({
        message : "Invalid OTP"
      });
    }
    if(user.emailOtpExpiresAt < Date.now()) {
      return res.status(400).json ({
        message : "OTP Expired"
      });
    }
    if(user.emailOtpPurpose != 'signup') {
      return res.status(400).json ({
        message : "Invalid OTP"
      });
    }

    user.emailVerified = true;
    user.emailOtp = null;
    user.emailOtpExpiresAt = null;
    user.emailOtpPurpose = null;;
    await user.save();

    return res.status(200).json ({
      message : "Email verified successfully"
    })

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

//forgot password 
const forgotPassword = async (req,res) => { 
  try { 
    const {email} = req.body; 
    if (!email) { 
      return res.status(400).json({ 
        message: "Email required" 
      }); 
    } 
    const user = await User.findOne({ email }); 
    if(user && user.emailVerified) { 
      // OTP generating 
      const otpData= otpGenerator(); 
      const emailOtp= otpData.otp; 
      const emailOtpExpiresAt= otpData.expiresAt; 
      user.emailOtp = emailOtp; 
      user.emailOtpExpiresAt = emailOtpExpiresAt; 
      user.emailOtpPurpose = "password_reset" ; 
      await user.save(); 
      // sending mail 
      const subject = "Your one time verification code:"; 
      const text = `Your OTP for password reset is : ${emailOtp} \n Do not share OTP with anyone`;
      await sendEmail(email,subject,text); 
    } 
    return res.status(200).json ({ 
      message: "If the email exists, an OTP has been sent" 
    }); 
  } 
  catch(error) { 
    res.status(500).json ({ 
      message: "Server error", 
      error:error.message, 
    }); 
  } 
};

// @desc Reset password using OTP 
const resetPassword = async (req, res) => { 
  try { 
    const { email, otp, newPassword } = req.body; 
    if(!email || !otp || !newPassword) { 
      return res.status(400).json ({ 
        message: "Bad request" 
      }); 
    } 
    const user = await User.findOne({ email }); 
    if(!user) { 
      return res.status(400).json({ 
        message: "Invalid OTP or Email" 
      }); 
    } 
    if(!user.emailVerified) { 
      return res.status(400).json ({ 
        message: "Invalid OTP or Email" 
      }); 
    } 
    if(!user.emailOtp) { 
      return res.status(400).json ({ 
        message: "Invalid OTP or Email" 
      }); 
    } 
    if( !user.emailOtpExpiresAt || user.emailOtpExpiresAt < Date.now() ) { 
      return res.status(400).json ({ 
        message: "Invalid OTP or Email" 
      }); 
    } 
    if(user.emailOtpPurpose != "password_reset" ) { 
      return res.status(400).json ({ 
        message: "Invalid OTP or Email" 
      }); 
    } 
    if(user.emailOtp != Number(otp) ) { 
      return res.status(400).json ({ 
        message: "Invalid OTP or Email" 
      }); 
    } 
    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(newPassword, salt); 
    user.password = hashedPassword; 
    user.emailOtp = null; 
    user.emailOtpExpiresAt = null; 
    user.emailOtpPurpose = null; 
    await user.save(); 
    return res.status(200).json ({ 
      message: "Password reset successfull. Please login" 
    }); 
  } 
  catch (error) { 
    res.status(500).json({ 
      message: "Server error", 
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

    //    check the email is verified or not
    if(!user.emailVerified) {
      return res.status(401).json({
        message: "Please verify your email before logging in"
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

// @desc   Admin-only test route
// @route  GET /api/auth/admin
// @access Private (Admin)
const adminRoute = (req, res) => {
  res.json({
    message: 'Welcome Admin 👑',
    user: req.user,
  });
};

// @desc   Volunteer-only test route
// @route  GET /api/auth/volunteer
// @access Private (Volunteer)
const volunteerRoute = (req, res) => {
  res.json({
    message: 'Welcome Volunteer 🤝',
    user: req.user,
  });
};

// @desc   Request role upgrade
// @route  POST /api/roles/request
// @access Private (User)
const requestRoleUpgrade = async (req, res) => {
  try {
    // 1. Get requested role
    const { requestedRole } = req.body;

    // 2. Get logged-in user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 3. Only normal users can request upgrade
    if (user.role !== 'user') {
      return res.status(403).json({
        message: 'Only users can request role upgrade',
      });
    }

    // 4. Prevent multiple pending requests
    if (user.requestStatus === 'pending') {
      return res.status(400).json({
        message: 'You already have a pending role request',
      });
    }

    // 5. Validate requested role
    if (!['admin', 'volunteer'].includes(requestedRole)) {
      return res.status(400).json({
        message: 'Invalid role requested',
      });
    }

    // 6. Set request details
    user.requestedRole = requestedRole;
    user.requestStatus = 'pending';
    user.roleRequestedAt = new Date();

    await user.save();

    // 7. Send response
    res.status(201).json({
      message: 'Role upgrade request submitted successfully',
      request: {
        requestedRole: user.requestedRole,
        requestStatus: user.requestStatus,
        roleRequestedAt: user.roleRequestedAt,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc   Get all pending role requests (paginated)
// @route  GET /api/roles/pending
// @access Private (Admin)
const getPendingRoleRequests = async (req, res) => {
  try {
    // 1. Get page & limit from query (default values)
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // fixed backend-controlled limit

    // 2. Calculate skip value
    const skip = (page - 1) * limit;

    // 3. Get total pending requests count
    const totalRequests = await User.countDocuments({
      requestStatus: 'pending',
    });

    // 4. Fetch paginated pending requests
    const requests = await User.find({ requestStatus: 'pending' })
      .select('-password')
      .sort({ roleRequestedAt: -1 }) // latest first
      .skip(skip)
      .limit(limit);

    // 5. Send response
    res.json({
      page,
      limit,
      totalRequests,
      totalPages: Math.ceil(totalRequests / limit),
      requests,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};



// @desc   Approve role request
// @route  POST /api/roles/approve/:userId
// @access Private (Admin)
const approveRoleRequest = async (req, res) => {
  try {
    // 1. Get userId from params
    const { userId } = req.params;

    // 2. Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // 3. Ensure there is a pending request
    if (user.requestStatus !== 'pending' || !user.requestedRole) {
      return res.status(400).json({
        message: 'No pending role request to approve',
      });
    }

    // 4. Approve role
    user.role = user.requestedRole;

    // 5. Clear request fields
    user.requestedRole = null;
    user.requestStatus = null;
    user.roleRequestedAt = null;

    // 6. Save changes
    await user.save();

    // 7. Respond
    res.json({
      message: 'Role request approved successfully',
      user: {
        id: user._id,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};


// @desc   Reject role request
// @route  POST /api/roles/reject/:userId
// @access Private (Admin)
const rejectRoleRequest = async (req, res) => {
  try {
    // 1. Get userId from params
    const { userId } = req.params;

    // 2. Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    // 3. Ensure there is a pending request
    if (user.requestStatus !== 'pending') {
      return res.status(400).json({
        message: 'No pending role request to reject',
      });
    }

    // 4. Clear request fields (role remains unchanged)
    user.requestedRole = null;
    user.requestStatus = null;
    user.roleRequestedAt = null;

    // 5. Save changes
    await user.save();

    // 6. Respond
    res.json({
      message: 'Role request rejected successfully',
      user: {
        id: user._id,
        role: user.role,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};



module.exports = { registerUser, loginUser, getProfile, adminRoute, volunteerRoute, requestRoleUpgrade, getPendingRoleRequests, approveRoleRequest, rejectRoleRequest, 
                   verifyEmailOtp, forgotPassword, resetPassword };

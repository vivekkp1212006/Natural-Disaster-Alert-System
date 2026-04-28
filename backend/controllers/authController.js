const User = require('../models/User');
const Volunteer = require('../models/volunteer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { otpGenerator } = require('../utils/generateOtp');
const { sendStructuredEmail } = require('../utils/sendEmail');
const validatePassword = require('../utils/validatePassword');
const { findNearestCamp } = require('../services/nearestCampService');
const { ensureTrainingRows } = require('./campOfficerRoleController');
const { computeBadge } = require('../services/rankingService');

// @desc   Register new user
// @route  POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, location, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // 1. Check required fields
    if (!name || !normalizedEmail || !password || !location ) {
      return res.status(400).json({
        message: 'Please fill all required fields',
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    if (!Number.isFinite(Number(location?.lat)) || !Number.isFinite(Number(location?.lng))) {
      return res.status(400).json({ message: 'Invalid location coordinates' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists && userExists.emailVerified) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }
    const trimmedName = name.trim();

    if (!/^[A-Za-z\s]+$/.test(trimmedName)) {
      return res.status(400).json({
        message: "Name must contain only letters and spaces"
      });
    }
    
    const validate = validatePassword(password);
    if(!validate.valid) {
      return res.status(400).json({
        message: validate.message
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

      await sendStructuredEmail({
        to: normalizedEmail,
        subject: 'Email verification OTP',
        greeting: `Hello ${trimmedName},`,
        lines: [`Your OTP for sign-up is: ${emailOtp}`, 'Do not share this OTP with anyone.'],
      });

      return res.status(201).json({
        message: `OTP sent to ${normalizedEmail}`,
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
      email: normalizedEmail,
      password: hashedPassword,
      location,
      role, // optional (defaults to 'user')
      emailOtp,
      emailOtpExpiresAt,
      emailOtpPurpose: "signup",
      emailVerified: false,
    });

      await sendStructuredEmail({
        to: normalizedEmail,
        subject: 'Email verification OTP',
        greeting: `Hello ${trimmedName},`,
        lines: [`Your OTP for sign-up is: ${emailOtp}`, 'Do not share this OTP with anyone.'],
      });

      return res.status(201).json({
        message: `OTP sent to ${normalizedEmail}`,
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
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!/^\d{4,8}$/.test(String(otp))) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    // logic will come next
    const user = await User.findOne({ email: normalizedEmail});

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
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) { 
      return res.status(400).json({ 
        message: "Email required" 
      }); 
    } 
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    const user = await User.findOne({ email: normalizedEmail }); 
    if(user && user.emailVerified) {
      const now = Date.now();
      if(user.otpLockUntil && now < user.otpLockUntil) {
        return res.status(429).json ({
          message: "Entered too many wrong OTP try after some times"
        });
      }
      if(user.otpRequestWindowStart &&  now - user.otpRequestWindowStart > 300000 ) {
        user.otpRequestCount = 0 ;
        user.otpRequestWindowStart = null;
      }
      if(user.otpRequestWindowStart && now  - user.otpRequestWindowStart <= 300000 && user.otpRequestCount >= 3 ) {
        return res.status(429).json ({
          message: "OTP request limit reached try after some times"
        });
      }
      if(!user.otpRequestWindowStart) {
        user.otpRequestWindowStart = now ;
      }
      if(user.lastOtpSentAt) {
        const cooldownTime =  now - user.lastOtpSentAt ;
        if( cooldownTime < 30000 ) {
          return res.status(429).json ({
            message: `wait : ${30000 - cooldownTime} second`
          });
        }
      }

      user.otpRequestCount += 1 ; 
      user.lastOtpSentAt = now ;
      
      // OTP generating 
      const otpData= otpGenerator(); 
      const emailOtp= otpData.otp; 
      const emailOtpExpiresAt= otpData.expiresAt; 
      user.emailOtp = emailOtp; 
      user.emailOtpExpiresAt = emailOtpExpiresAt; 
      user.emailOtpPurpose = "password_reset" ; 
      user.otpFailedAttempts = 0;
      await user.save();


      // sending mail 
      await sendStructuredEmail({
        to: normalizedEmail,
        subject: 'Password reset OTP',
        greeting: `Hello ${user.name},`,
        lines: [`Your OTP for password reset is: ${emailOtp}`, 'Do not share this OTP with anyone.'],
      });
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
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if(!normalizedEmail || !otp || !newPassword) { 
      return res.status(400).json ({ 
        message: "Bad request" 
      }); 
    } 
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (!/^\d{4,8}$/.test(String(otp))) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }
    const user = await User.findOne({ email: normalizedEmail }); 
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
    const now = Date.now();
    if(user.otpLockUntil && now < user.otpLockUntil) {
      return res.status(429).json ({
        message: "Entered too many wrong OTP try after some times"
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
      user.otpFailedAttempts += 1;
      if(user.otpFailedAttempts >= 3) {
        const delay = Math.min(
          60000 * Math.pow(2, user.otpFailedAttempts - 1),
          1800000
        );
        user.otpLockUntil = now + delay;
      }
      await user.save(); 
      return res.status(400).json ({ 
        message: "Invalid OTP or Email" 
      }); 
    }
    const validate = validatePassword(newPassword);
    if(!validate.valid) {
      return res.status(400).json({
        message: validate.message
      });
    }

    const salt = await bcrypt.genSalt(10); 
    const hashedPassword = await bcrypt.hash(newPassword, salt); 
    user.password = hashedPassword; 
    user.emailOtp = null; 
    user.emailOtpExpiresAt = null; 
    user.emailOtpPurpose = null; 
    user.otpFailedAttempts = 0;
    user.otpLockUntil = null;
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
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // 1. Check if email and password provided
    if (!normalizedEmail || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // 2. Find user by email
    const user = await User.findOne({ email: normalizedEmail });
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

    if (
      user.suspension &&
      user.suspension.active &&
      user.suspension.endsAt &&
      new Date(user.suspension.endsAt) > new Date()
    ) {
      return res.status(403).json({
        message: `Account suspended until ${new Date(user.suspension.endsAt).toLocaleString()}. ${
          user.suspension.reason ? `Reason: ${user.suspension.reason}` : ''
        }`,
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
        _id: user._id,
        name: user.name,
        email: user.email,
        AGS_ID: user.AGS_ID,
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
    const dbUser = await User.findById(req.user.id).select('-password');
    if (!dbUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const volunteer = await Volunteer.findOne({ user: dbUser._id });
    let rankingBadge = null;
    if (volunteer && dbUser.role !== 'user') {
      rankingBadge = await computeBadge(volunteer);
    }

    res.json({
      message: 'Protected route accessed successfully',
      user: {
        id: dbUser._id,
        _id: dbUser._id,
        name: dbUser.name,
        email: dbUser.email,
        AGS_ID: dbUser.AGS_ID,
        role: dbUser.role,
        location: dbUser.location,
        requestStatus: dbUser.requestStatus,
        requestedRole: dbUser.requestedRole,
        suspension: dbUser.suspension,
      },
      volunteer,
      rankingBadge,
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
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'user') {
      return res.status(403).json({
        message: 'Only users can request volunteer access',
      });
    }

    if (user.requestStatus === 'pending') {
      return res.status(400).json({
        message: 'You already have a pending volunteer request',
      });
    }

    const enrollment = await Volunteer.findOne({ user: user._id });
    if (!enrollment) {
      return res.status(400).json({
        message: 'Please submit volunteer enrollment before requesting volunteer role',
      });
    }

    user.requestedRole = 'volunteer';
    user.requestStatus = 'pending';
    user.roleRequestedAt = new Date();

    await user.save();
    await ensureTrainingRows(user._id);

    const lat = user.location?.lat;
    const lng = user.location?.lng;
    const nearest = await findNearestCamp(lat, lng);
    const campLine = nearest?.camp
      ? `Nearest training camp: ${nearest.camp.name} (approx ${nearest.distanceKm.toFixed(1)} km away).`
      : 'Complete your trainings with a camp officer. A camp will be assigned once you are promoted.';

    await sendStructuredEmail({
      to: user.email,
      subject: 'Volunteer request received',
      greeting: `Hello ${user.name},`,
      lines: [
        'Thank you for requesting the volunteer role.',
        campLine,
        'Attend training at the nearest camp and complete the required training modules.',
      ],
    });

    res.status(201).json({
      message: 'Volunteer request submitted successfully',
      request: {
        requestedRole: user.requestedRole,
        requestStatus: user.requestStatus,
        roleRequestedAt: user.roleRequestedAt,
        nearestCamp: nearest?.camp
          ? { name: nearest.camp.name, distanceKm: nearest.distanceKm }
          : null,
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

    if (user.requestedRole === 'volunteer') {
      return res.status(400).json({
        message: 'Volunteer approvals are handled by camp officers with training completion',
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

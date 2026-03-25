const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* =========================
   HELPERS
========================= */
const generateToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

/* =========================
   REGISTER
========================= */
exports.registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const user = await User.create({ fullName, email, password });

    res.status(201).json({ token: generateToken(user), user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
};

/* =========================
   LOGIN
========================= */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({ token: generateToken(user), user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
};

/* =========================
   GOOGLE AUTH
========================= */
exports.googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });

    if (!user) {
      user = await User.create({
        fullName: name,
        email,
        googleId: sub,
        profileImageUrl: picture,
      });
    }

    res.json({ token: generateToken(user), user });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Google sign-in failed' });
  }
};

/* =========================
   GITHUB AUTH (FIXED)
========================= */
exports.githubAuth = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Missing authorization code' });
    }

    // 1. Exchange Code for Token
    const tokenRes = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      { headers: { Accept: 'application/json' } }
    );

    if (tokenRes.data.error) {
       console.error("GitHub Token Error:", tokenRes.data);
       return res.status(401).json({ message: tokenRes.data.error_description || 'GitHub token exchange failed' });
    }

    const accessToken = tokenRes.data.access_token;

    // 2. Get User Profile
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const ghUser = userRes.data;

    // 3. Get Email (if private)
    let email = ghUser.email;
    if (!email) {
      const emailRes = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Find primary and verified email
      const primaryEmail = emailRes.data.find((e) => e.primary && e.verified);
      email = primaryEmail ? primaryEmail.email : null;
    }

    if (!email) {
      return res.status(400).json({ message: 'GitHub email not accessible. Please verify your email on GitHub.' });
    }

    // 4. Find or Create User
    // Note: Converted githubId to String to ensure matching works
    let user = await User.findOne({
      $or: [{ githubId: String(ghUser.id) }, { email }],
    });

    if (!user) {
      user = await User.create({
        fullName: ghUser.name || ghUser.login,
        email,
        githubId: String(ghUser.id),
        profileImageUrl: ghUser.avatar_url,
      });
    } else if (!user.githubId) {
       // Merge account if email exists but not linked to github yet
       user.githubId = String(ghUser.id);
       await user.save();
    }

    res.json({ token: generateToken(user), user });
  } catch (err) {
    console.error('GitHub auth error:', err.response?.data || err.message);
    res.status(401).json({ message: 'GitHub authentication failed' });
  }
};

/* =========================
   GET ME & UTILS
========================= */
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password incorrect' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Password change failed' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete account failed' });
  }
};

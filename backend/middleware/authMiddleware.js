const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : null;

    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          return res.status(401).json({ message: 'Not authorized, user not found' });
        }
        req.user = {
          ...user.toObject(),
          _id: user._id,
          id: String(user._id),
        };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

const { protect } = require('./authMiddleware');

exports.auth = protect;

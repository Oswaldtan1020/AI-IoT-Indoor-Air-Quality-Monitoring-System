const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {

    const authHeader = req.headers['authorization'];

    const token = authHeader && authHeader.split(' ')[1];

    // No token provided
    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

        // Invalid or expired token
        if (err) {
            return res.status(401).json({
                error: 'Invalid token'
            });
        }

        req.user = user;

        next();
    });
}

module.exports = authenticateToken;
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token; // Get token from cookies

    if (!token) {
        return res.status(401).redirect('/login');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).redirect('/login'); // Redirect if token is invalid or expired
        }

        req.user = user; // Attach user info to request
        next();
    });
};

module.exports = authenticateToken;
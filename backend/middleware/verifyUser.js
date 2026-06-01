const jwt = require("jsonwebtoken");

module.exports = function verifyUser(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Check token exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user to request
    req.user = decoded;

    // 4. Optional role check (USER or ADMIN)
    const role = decoded.role?.toLowerCase();
    if (role !== "user" && role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Invalid role" });
    }

    next(); // ✅ IMPORTANT
  } catch (err) {
    console.error("JWT verify error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

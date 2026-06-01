const jwt = require("jsonwebtoken");

module.exports = function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  // 1. Token existence check
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // 2. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Role check (ADMIN ONLY)
    const role = decoded.role?.toLowerCase();
    if (role !== "admin") {
      return res.status(403).json({ error: "Admin access only" });
    }

    // 4. Attach user
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Admin JWT error:", err.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

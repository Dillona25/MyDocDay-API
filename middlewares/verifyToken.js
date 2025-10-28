import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if header exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user payload to request (so you can use req.user.id)
    req.user = decoded;

    next(); // ✅ continue to the next handler
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

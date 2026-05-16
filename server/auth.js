const crypto = require("crypto");

function requireAuth(req, res, next) {
  const key = process.env.BLOG_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "BLOG_API_KEY not configured" });
  }
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = header.slice(7);
  if (
    token.length !== key.length ||
    !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(key))
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = { requireAuth };

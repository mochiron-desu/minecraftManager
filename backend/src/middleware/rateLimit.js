const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes
const maxRequests = 60;
const ipStore = {};

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  if (!ipStore[ip]) ipStore[ip] = [];
  ipStore[ip] = ipStore[ip].filter(ts => now - ts < rateLimitWindowMs);
  if (ipStore[ip].length >= maxRequests) {
    return res.status(429).json({ message: 'Too many requests' });
  }
  ipStore[ip].push(now);
  next();
}

module.exports = rateLimit; 
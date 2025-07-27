const rateLimitWindowMs = 15 * 60 * 1000; // 15 minutes

// Rate limit configurations
const rateLimits = {
  auth: { maxRequests: 10, windowMs: rateLimitWindowMs },      // Login/Auth routes
  post: { maxRequests: 100, windowMs: rateLimitWindowMs },     // POST/Mutation routes
  get: { maxRequests: 300, windowMs: rateLimitWindowMs }       // GET/Fetch routes
};

// Separate stores for different rate limit types
const ipStores = {
  auth: {},
  post: {},
  get: {}
};

function getRateLimitType(req) {
  // Auth routes
  if (req.path.includes('/auth') || req.path.includes('/login')) {
    return 'auth';
  }
  // POST routes
  if (req.method === 'POST') {
    return 'post';
  }
  // GET routes (default)
  return 'get';
}

function rateLimit(req, res, next) {
  const ip = req.ip;
  const rateLimitType = getRateLimitType(req);
  const config = rateLimits[rateLimitType];
  const store = ipStores[rateLimitType];
  
  const now = Date.now();
  
  // Initialize store for this IP if it doesn't exist
  if (!store[ip]) store[ip] = [];
  
  // Clean old entries outside the window
  store[ip] = store[ip].filter(ts => now - ts < config.windowMs);
  
  // Check if limit exceeded
  if (store[ip].length >= config.maxRequests) {
    return res.status(429).json({ 
      message: `Rate limit exceeded. Maximum ${config.maxRequests} requests per 15 minutes for ${rateLimitType} operations.`,
      retryAfter: Math.ceil((config.windowMs - (now - store[ip][0])) / 1000)
    });
  }
  
  // Add current request timestamp
  store[ip].push(now);
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': config.maxRequests,
    'X-RateLimit-Remaining': config.maxRequests - store[ip].length,
    'X-RateLimit-Reset': new Date(now + config.windowMs).toISOString()
  });
  
  next();
}

module.exports = rateLimit; 
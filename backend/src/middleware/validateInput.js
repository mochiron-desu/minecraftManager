function validateInput(req, res, next) {
  const { username, password } = req.body;
  if (typeof username !== 'string' || username.length < 3) {
    return res.status(400).json({ message: 'Invalid username' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ message: 'Invalid password' });
  }
  next();
}

module.exports = validateInput; 
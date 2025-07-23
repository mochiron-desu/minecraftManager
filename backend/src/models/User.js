// User model (upgradeable to DB)
class User {
  constructor({ username, passwordHash, role = 'admin' }) {
    this.username = username;
    this.passwordHash = passwordHash;
    this.role = role;
  }
}

module.exports = User; 
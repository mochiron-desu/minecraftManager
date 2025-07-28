const fs = require('fs');
const path = require('path');

console.log('=== Minecraft Manager Environment Setup ===\n');

// Check if .env already exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists. Backing up to .env.backup');
  fs.copyFileSync(envPath, path.join(__dirname, '.env.backup'));
}

// Create .env content
const envContent = `# Server Configuration
PORT=3000

# Minecraft Server Configuration
MINECRAFT_SERVER_PATH=./minecraft-server
START_SCRIPT=start.bat

# RCON Configuration
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=changeme

# JWT Secret (change this in production!)
JWT_SECRET=your-secret-key-here

# Database Configuration (if using database)
# DB_HOST=localhost
# DB_PORT=27017
# DB_NAME=minecraft_manager
`;

// Write .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file created successfully!');
console.log('\n📝 Configuration created:');
console.log('   - Server will look for minecraft-server/start.bat');
console.log('   - RCON enabled on localhost:25575');
console.log('   - Default RCON password: changeme');
console.log('\n⚠️  Important:');
console.log('   1. Change the RCON password in your server.properties');
console.log('   2. Update RCON_PASSWORD in .env to match');
console.log('   3. Change JWT_SECRET for production use');
console.log('\n🔧 Next steps:');
console.log('   1. Ensure your minecraft-server directory exists');
console.log('   2. Verify start.bat is in the minecraft-server directory');
console.log('   3. Enable RCON in server.properties');
console.log('   4. Run: node test-server-manager.js'); 
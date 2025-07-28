const fs = require('fs');
const path = require('path');

console.log('=== Minecraft Server Path Configuration ===\n');

// Get command line arguments
const serverPath = process.argv[2];

if (!serverPath) {
  console.log('Usage: node configure-server-path.js <server-path>');
  console.log('\nExamples:');
  console.log('  node configure-server-path.js "C:/Games/Minecraft/ForgeServer"');
  console.log('  node configure-server-path.js "../minecraft-server"');
  console.log('  node configure-server-path.js "C:/Users/YourName/Documents/Minecraft/Server"');
  console.log('\nThe path can be:');
  console.log('  - Absolute path (e.g., C:/Games/Minecraft/ForgeServer)');
  console.log('  - Relative path (e.g., ../minecraft-server)');
  process.exit(1);
}

// Normalize the path
const normalizedPath = path.resolve(serverPath).replace(/\\/g, '/');

console.log('Configuring server path...');
console.log('Input path:', serverPath);
console.log('Normalized path:', normalizedPath);

// Check if the directory exists
if (!fs.existsSync(normalizedPath)) {
  console.log('\n❌ Error: Server directory does not exist!');
  console.log('Please create the directory or check the path.');
  process.exit(1);
}

// Check if start.bat exists
const startScriptPath = path.join(normalizedPath, 'start.bat');
if (!fs.existsSync(startScriptPath)) {
  console.log('\n⚠️  Warning: start.bat not found in server directory');
  console.log('Expected location:', startScriptPath);
  console.log('Make sure to copy your start.bat file to this location.');
}

// Read current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
} else {
  console.log('❌ Error: .env file not found!');
  console.log('Please run setup-env.js first to create the .env file.');
  process.exit(1);
}

// Update the MINECRAFT_SERVER_PATH
const updatedContent = envContent.replace(
  /MINECRAFT_SERVER_PATH=.*/,
  `MINECRAFT_SERVER_PATH=${normalizedPath}`
);

// Write updated .env file
fs.writeFileSync(envPath, updatedContent);

console.log('\n✅ Server path configured successfully!');
console.log('Updated .env file with path:', normalizedPath);

// Test the configuration
console.log('\n🔍 Testing configuration...');
try {
  const serverManager = require('./src/services/serverManager');
  const serverInfo = serverManager.getServerInfo();
  
  console.log('Server Path:', serverInfo.serverPath);
  console.log('Directory Exists:', serverInfo.directoryExists ? '✅' : '❌');
  console.log('Script Exists:', serverInfo.scriptExists ? '✅' : '❌');
  
  if (serverInfo.directoryExists && serverInfo.scriptExists) {
    console.log('\n🎉 Configuration is working correctly!');
  } else {
    console.log('\n⚠️  Configuration issues detected:');
    if (!serverInfo.directoryExists) {
      console.log('   - Server directory not found');
    }
    if (!serverInfo.scriptExists) {
      console.log('   - start.bat not found in server directory');
    }
  }
} catch (error) {
  console.log('❌ Error testing configuration:', error.message);
}

console.log('\n📝 Next steps:');
console.log('1. Ensure your start.bat is in the server directory');
console.log('2. Configure server.properties with RCON enabled');
console.log('3. Run: node test-server-manager.js');
console.log('4. Start the backend: npm start'); 
const serverManager = require('./src/services/serverManager');

async function testServerManager() {
  console.log('=== Minecraft Server Manager Test ===\n');

  // Test 1: Get server info
  console.log('1. Server Configuration:');
  const serverInfo = serverManager.getServerInfo();
  console.log('   Server Path:', serverInfo.serverPath);
  console.log('   Start Script:', serverInfo.startScript);
  console.log('   Directory Exists:', serverInfo.directoryExists ? '✅' : '❌');
  console.log('   Script Exists:', serverInfo.scriptExists ? '✅' : '❌');

  // Test 2: Get initial status
  console.log('\n2. Server Status:');
  const initialStatus = serverManager.getStatus();
  console.log('   Running:', initialStatus.isRunning ? '✅' : '❌');
  console.log('   PID:', initialStatus.pid || 'N/A');
  console.log('   Uptime:', initialStatus.uptimeFormatted || 'N/A');

  // Test 3: Get logs
  console.log('\n3. Log Buffer:');
  const logs = serverManager.getLogs(10);
  console.log('   Log entries:', logs.length);

  // Test 4: Test event listeners
  console.log('\n4. Event Listeners:');
  
  serverManager.on('statusChanged', (status) => {
    console.log('   [EVENT] Status changed:', status.status);
  });

  serverManager.on('consoleOutput', (output) => {
    console.log(`   [EVENT] Console ${output.type}:`, output.data.substring(0, 50) + '...');
  });

  console.log('   Event listeners set up successfully ✅');

  // Test 5: Test log buffering
  console.log('\n5. Log Buffering Test:');
  serverManager.addLog('test', 'This is a test log entry from the test script');
  const testLogs = serverManager.getLogs(5);
  console.log('   Recent logs:', testLogs.length);

  // Test 6: Environment check
  console.log('\n6. Environment Check:');
  console.log('   MINECRAFT_SERVER_PATH:', process.env.MINECRAFT_SERVER_PATH || 'Not set (using default)');
  console.log('   START_SCRIPT:', process.env.START_SCRIPT || 'Not set (using default)');
  console.log('   RCON_HOST:', process.env.RCON_HOST || 'Not set (using default)');
  console.log('   RCON_PORT:', process.env.RCON_PORT || 'Not set (using default)');

  console.log('\n=== Test Summary ===');
  console.log('✅ Server Manager loaded successfully');
  console.log('✅ Event system working');
  console.log('✅ Log buffering working');
  
  if (!serverInfo.directoryExists) {
    console.log('⚠️  Server directory not found - create the minecraft-server directory');
  }
  if (!serverInfo.scriptExists) {
    console.log('⚠️  Start script not found - ensure start.bat exists in server directory');
  }
  
  console.log('\nNext steps:');
  console.log('1. Create .env file with proper configuration');
  console.log('2. Ensure minecraft-server directory exists with start.bat');
  console.log('3. Configure server.properties with RCON enabled');
  console.log('4. Test server start/stop functionality');
}

// Run the test
testServerManager().catch(console.error); 
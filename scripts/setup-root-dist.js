const fs = require('fs');
const path = require('path');

const rootDist = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(rootDist)) {
  fs.mkdirSync(rootDist, { recursive: true });
}

const serverRunnerContent = `// Root entry point for Render / Cloud deployment when Root Directory is not set to backend
const path = require('path');
const fs = require('fs');

const backendDir = path.resolve(__dirname, '..', 'backend');
const serverDistPath = path.join(backendDir, 'dist', 'server.js');

try {
  process.chdir(backendDir);
} catch (err) {
  console.error('[DocRx Root Proxy] Failed to change directory to backend:', err);
}

if (!fs.existsSync(serverDistPath)) {
  console.log('[DocRx Root Proxy] backend/dist/server.js not found. Running build on the fly...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { cwd: backendDir, stdio: 'inherit' });
  } catch (buildErr) {
    console.error('[DocRx Root Proxy] On-demand backend build failed:', buildErr);
    process.exit(1);
  }
}

require(serverDistPath);
`;

fs.writeFileSync(path.join(rootDist, 'server.js'), serverRunnerContent, 'utf8');
console.log('[DocRx] Root dist/server.js proxy runner ready.');

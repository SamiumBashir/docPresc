// Root entry point fallback for Render / Railway / cloud deployments
const path = require('path');
const fs = require('fs');

const rootDistServer = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(rootDistServer)) {
  require('./scripts/setup-root-dist');
}

require(rootDistServer);

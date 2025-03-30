const express = require('express');
const app = express();
const port = 5050;

// Serve static files from the root directory
app.use(express.static('./'));

// Start the server
app.listen(port, () => {
  console.log(`Game server running at http://localhost:${port}`);
  console.log(`Access your driving game at: http://localhost:${port}/driving-game/start.html`);
}); 
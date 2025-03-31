const express = require('express');
const app = express();
const port = 4040;

// Serve static files from the root directory
app.use(express.static('./'));

// Serve the driving game files
app.use('/driving-game', express.static('./driving-game'));

// Serve the museum3d files
app.use('/museum3d', express.static('./museum3d'));

// Redirect the root path to start.html
app.get('/', (req, res) => {
  res.redirect('/driving-game/start.html');
});

// Start the server
app.listen(port, () => {
  console.log(`Game server running at http://localhost:${port}`);
  console.log(`Access your driving game at: http://localhost:${port}/driving-game/start.html`);
  console.log(`Access your museum game at: http://localhost:${port}/museum3d/index.html`);
}); 
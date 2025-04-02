const express = require('express');
const app = express();
const port = process.env.PORT || 4040;

// Serve static files from the root directory
app.use(express.static('./'));

// Serve the driving game files
app.use('/driving-game', express.static('./driving-game'));

// Serve the museum3d files
app.use('/museum3d', express.static('./museum3d'));

// Serve the visual novel files
app.use('/visual-novel', express.static('./visual-novel'));

// Redirect the root path to the visual novel
app.get('/', (req, res) => {
  res.redirect('/visual-novel/index.html');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Game server running at http://localhost:${port}`);
  console.log(`Start with the visual novel at: http://localhost:${port}/visual-novel/index.html`);
  console.log(`Access your driving game at: http://localhost:${port}/driving-game/driving.html`);
  console.log(`Access your museum game at: http://localhost:${port}/museum3d/index.html`);
}); 
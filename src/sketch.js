import { Game } from './game/Game.js';

// Instantiate game
const game = new Game();

// p5.js global mode setup
window.setup = function() {
  game.setup();
};

window.draw = function() {
  game.draw();
};

window.keyPressed = function() {
  console.log("Key pressed:", key);
  game.keyPressed();
};

window.keyReleased = function() {
  console.log("Key released:", key);
  game.keyReleased();
};
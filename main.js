/* 
// variables
*/
const PLAYFIELD_COLUMNS = 10;
const PLAYFIELD_ROWS = 20;
const TETROMINO_NAMES = ["O", "D", "L", "J", "S", "Z", "T", "I"];
const TETROMINOES = {
  O: [
    [1, 1],
    [1, 1],
  ],
  // dot
  D: [
    [0, 0],
    [0, 1],
  ],
  L: [
    [1, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
  ],
  J: [
    [0, 1, 0],
    [0, 1, 0],
    [1, 1, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  T: [
    [1, 1, 1],
    [0, 1, 0],
    [0, 0, 0],
  ],
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
};
let playfield, tetromino, timeoutId, requestId;
let level = 1;
let score = 0,
  lines = 0;
let isGameOver,
  isPaused = false;
const gameOverBlock = document.querySelector(".gameover");
let cells = document.querySelectorAll(".tetris div");
const btnRestart = document.querySelector(".restart");
const restBtnVis = document.querySelector(".restBtnVis");
const bestResSpan = document.querySelector(".bestResSpan");
const scoreSpan = document.getElementById("score");
const levelSpan = document.getElementById("level");
const infoLines = document.getElementById("infoLines");
const infoPoints = document.getElementById("infoPoints");
const pauseBtn = document.querySelector(".pauseBtnVis");
const btnArrowLeft = document.querySelector(".arrow-left");
const btnArrowRight = document.querySelector(".arrow-right");
const btnArrowDown = document.querySelector(".arrow-down");
const rotateBtn = document.querySelector(".rotate-btn");

/* 
// functions
*/
function getRandomElement(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function convertPositionToIndex(row, column) {
  return row * PLAYFIELD_COLUMNS + column;
}

function generatePlayfield() {
  document.querySelector(".tetris").innerHTML = ""; // clear all divs
  for (let i = 0; i < PLAYFIELD_ROWS * PLAYFIELD_COLUMNS; i++) {
    const div = document.createElement("div");
    document.querySelector(".tetris").append(div);
  }
  playfield = new Array(PLAYFIELD_ROWS)
    .fill()
    .map(() => new Array(PLAYFIELD_COLUMNS).fill(0));
}

function generateTetromino() {
  // choose random figure
  const nameTetro = getRandomElement(TETROMINO_NAMES);
  const matrixTetro = TETROMINOES[nameTetro];
  // to center figure
  const columnTetro = Math.floor(
    (PLAYFIELD_COLUMNS - matrixTetro[0].length) / 2
  );
  const rowTetro = -2; // to appear from the very top
  tetromino = {
    name: nameTetro,
    matrix: matrixTetro,
    row: rowTetro,
    column: columnTetro,
  };
}

function drawPlayField() {
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      const name = playfield[row][column];
      const cellIndex = convertPositionToIndex(row, column);
      cells[cellIndex].classList.add(name);
    }
  }
}

function drawTetromino() {
  const name = tetromino.name;
  const tetrominoMatrixSize = tetromino.matrix.length;
  for (let row = 0; row < tetrominoMatrixSize; row++) {
    for (let column = 0; column < tetrominoMatrixSize; column++) {
      if (isOutsideOfTopBoard(row)) continue; // to enable rowTetro=-2
      if (tetromino.matrix[row][column] == 0) continue; // don't draw classes
      const cellIndex = convertPositionToIndex(
        tetromino.row + row,
        tetromino.column + column
      );
      cells[cellIndex].classList.add(name);
    }
  }
}

function isOutsideOfTopBoard(row) {
  return tetromino.row + row < 0;
}

function draw() {
  cells.forEach((cell) => cell.removeAttribute("class"));
  drawPlayField();
  drawTetromino();
}

pauseBtn.addEventListener("click", togglePauseGame);
function togglePauseGame() {
  isPaused = !isPaused; // true into false or vice versa
  if (isPaused) {
    stopLoop();
    pauseBtn.textContent = "play";
    restBtnVis.disabled = true; // to avoid bugs with restart while pausing
  } else {
    startLoop();
    pauseBtn.textContent = "pause";
    restBtnVis.disabled = false;
  }
}

document.addEventListener("keydown", onKeyDown);
function onKeyDown(event) {
  if (event.key == "p") {
    togglePauseGame();
  }
  if (isPaused) return;

  if (event.key == " ") {
    event.preventDefault(); // without it has bug after restart (figures disappear)
    dropTetrominoDown();
  }

  switch (event.key) {
    case "d":
      dropTetrominoDown();
      break;
    case "ArrowDown":
      moveTetrominoDown();
      break;
    case "ArrowUp":
      rotateTetromino();
      break;
    case "ArrowLeft":
      moveTetrominoLeft();
      break;
    case "ArrowRight":
      moveTetrominoRight();
      break;
  }
  draw();
}

function moveTetrominoDown() {
  tetromino.row += 1;
  if (isValid()) {
    tetromino.row -= 1;
    placeTetromino();
  }
}

function moveTetrominoUp() {
  tetromino.row -= 1;
}

btnArrowLeft.addEventListener("click", moveTetrominoLeft);
function moveTetrominoLeft() {
  tetromino.column -= 1;
  if (isValid()) {
    tetromino.column += 1;
  }
}

btnArrowRight.addEventListener("click", moveTetrominoRight);
function moveTetrominoRight() {
  tetromino.column += 1;
  if (isValid()) {
    tetromino.column -= 1;
  }
}

function isValid() {
  const matrixSize = tetromino.matrix.length;
  for (let row = 0; row < matrixSize; row++) {
    for (let column = 0; column < matrixSize; column++) {
      if (!tetromino.matrix[row][column]) continue;
      if (isOutsideOfGameBoard(row, column)) return true;
      if (hasCollisions(row, column)) return true;
    }
  }
  return false;
}

function isOutsideOfGameBoard(row, column) {
  return (
    tetromino.column + column < 0 ||
    tetromino.column + column >= PLAYFIELD_COLUMNS ||
    tetromino.row + row >= PLAYFIELD_ROWS
  );
}

function hasCollisions(row, column) {
  return playfield[tetromino.row + row]?.[tetromino.column + column];
}

function placeTetromino() {
  const matrixSize = tetromino.matrix.length;
  for (let row = 0; row < matrixSize; row++) {
    for (let column = 0; column < matrixSize; column++) {
      if (!tetromino.matrix[row][column]) continue;
      if (isOutsideOfTopBoard(row)) {
        isGameOver = true;
        return;
      }
      playfield[tetromino.row + row][tetromino.column + column] =
        tetromino.name;
    }
  }
  const filledRows = findFilledRows();
  removeFilledRows(filledRows);
  generateTetromino();
  calculateScore(filledRows.length);
  saveBestResult(score);
}

function calculateScore(numFilledRows) {
  switch (numFilledRows) {
    case 1:
      score += 10;
      lines++;
      break;
    case 2:
      score += 30;
      lines += 2;
      break;
    case 3:
      score += 50;
      lines += 3;
      break;
    case 4:
      score += 100;
      lines += 4;
      break;
    default:
      score += 0; // if 0 rows
  }
  scoreSpan.textContent = score;
  infoPoints.textContent = score;
  infoLines.textContent = lines;
}

// H/W task 6
function showBestResult() {
  let bestRes = localStorage.getItem("bestRes");
  if (bestRes) {
    bestResSpan.textContent = bestRes;
  }
}
function saveBestResult(score) {
  let bestRes = localStorage.getItem("bestRes");
  if (score > bestRes) {
    localStorage.setItem("bestRes", score);
    bestResSpan.textContent = score;
  }
}

function removeFilledRows(filledRows) {
  filledRows.forEach((row) => {
    dropRowsAbove(row);
  });
}

function dropRowsAbove(rowDelete) {
  for (let row = rowDelete; row > 0; row--) {
    playfield[row] = playfield[row - 1];
  }
  playfield[0] = new Array(PLAYFIELD_COLUMNS).fill(0);
}

function findFilledRows() {
  const filledRows = [];
  for (let row = 0; row < PLAYFIELD_ROWS; row++) {
    let filledColumns = 0;
    for (let column = 0; column < PLAYFIELD_COLUMNS; column++) {
      if (playfield[row][column] != 0) filledColumns++;
    }
    if (PLAYFIELD_COLUMNS == filledColumns) filledRows.push(row); // what rows should be deleted
  }
  return filledRows;
}

// moving down automatically
function moveDown() {
  moveTetrominoDown();
  draw();
  stopLoop();
  startLoop();
  if (isGameOver) {
    gameOver();
  }
}

function startLoop() {
  // increase level and speed for every 100 points
  const thresholds = [0, 100, 200, 300, 400, 500, 666];
  const timeouts = [700, 600, 500, 400, 350, 300, 250];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i]) {
      timeoutId = setTimeout(
        () => (requestId = requestAnimationFrame(moveDown)),
        timeouts[i]
      );
      level = i + 1;
      levelSpan.textContent = level;
      break; // Break the loop once the first matching threshold is found
    }
  }
}

function stopLoop() {
  cancelAnimationFrame(requestId);
  timeoutId = clearTimeout(timeoutId);
}

rotateBtn.addEventListener("click", rotateTetromino);
function rotateTetromino() {
  const oldMatrix = tetromino.matrix;
  const rotatedMatrix = rotateMatrix(tetromino.matrix);
  tetromino.matrix = rotatedMatrix;
  if (isValid()) {
    tetromino.matrix = oldMatrix;
  }
}

function rotateMatrix(matrixTetromino) {
  const N = matrixTetromino.length;
  const rotateMatrix = [];
  for (let i = 0; i < N; i++) {
    rotateMatrix[i] = [];
    for (let j = 0; j < N; j++) {
      rotateMatrix[i][j] = matrixTetromino[N - j - 1][i];
    }
  }
  return rotateMatrix;
}

btnArrowDown.addEventListener("click", dropTetrominoDown);
function dropTetrominoDown() {
  while (!isValid()) {
    tetromino.row++; // goes down
  }
  tetromino.row--; // goes one cell up
}

function gameOver() {
  stopLoop();
  gameOverBlock.style.display = "flex";
}

// main function
btnRestart.addEventListener("click", init);
restBtnVis.addEventListener("click", init);
function init() {
  gameOverBlock.style.display = "none";
  isGameOver = false;
  generatePlayfield();
  generateTetromino();
  let bestRes = localStorage.getItem("bestRes");
  showBestResult(bestRes);
  startLoop();
  cells = document.querySelectorAll(".tetris div");
  score = 0;
  lines = 0;
  calculateScore();
}

init();

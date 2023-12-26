const PLAYFIELD_COLUMNS = 10;
const PLAYFIELD_ROWS = 20;

const TETROMINO_NAMES = ["O", "L", "J", "S", "Z", "T", "I"];

const TETROMINOES = {
  O: [
    [1, 1],
    [1, 1],
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

function getRandomElement(arr) {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

let playfield, tetromino;
let score = 0;
let timeoutId, requestId;

function convertPositionToIndex(row, column) {
  return row * PLAYFIELD_COLUMNS + column;
}

function generatePlayfield() {
  for (let i = 0; i < PLAYFIELD_ROWS * PLAYFIELD_COLUMNS; i++) {
    const div = document.createElement("div");
    document.querySelector(".tetris").append(div);
  }
  playfield = new Array(PLAYFIELD_ROWS)
    .fill()
    .map(() => new Array(PLAYFIELD_COLUMNS).fill(0));
}

function generateTetromino() {
  // const nameTetro = "S";
  // choose random figure
  const nameTetro = getRandomElement(TETROMINO_NAMES);

  const matrixTetro = TETROMINOES[nameTetro];

  // const columnTetro = 4;
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

generatePlayfield();
generateTetromino();

const cells = document.querySelectorAll(".tetris div");

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
      if (tetromino.row + row < 0) continue; // to enable rowTetro=-2
      if (tetromino.matrix[row][column] == 0) continue; // don't draw classes
      const cellIndex = convertPositionToIndex(
        tetromino.row + row,
        tetromino.column + column
      );
      cells[cellIndex].classList.add(name);
    }
  }
}

drawTetromino();

function draw() {
  cells.forEach((cell) => cell.removeAttribute("class"));
  drawPlayField();
  drawTetromino();
}

document.addEventListener("keydown", onKeyDown);

function onKeyDown(event) {
  switch (event.key) {
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

function moveTetrominoLeft() {
  tetromino.column -= 1;
  if (isValid()) {
    tetromino.column += 1;
  }
}

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
      playfield[tetromino.row + row][tetromino.column + column] =
        tetromino.name;
    }
  }
  const filledRows = findFilledRows();
  removeFilledRows(filledRows);
  generateTetromino();
  calculateScore(filledRows.length);
}

function calculateScore(numFilledRows) {
  switch (numFilledRows) {
    case 1:
      score += 10;
      break;
    case 2:
      score += 30;
      break;
    case 3:
      score += 50;
      break;
    case 4:
      score += 50;
      break;
    default:
      score += 0; // if 0 rows
  }
  document.getElementById("score").textContent = score;
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
}

function startLoop() {
  timeoutId = setTimeout(
    () => (requestId = requestAnimationFrame(moveDown)),
    700
  );
}

function stopLoop() {
  cancelAnimationFrame(requestId);
  timeoutId = clearTimeout(timeoutId);
}

startLoop();

// rotating part
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

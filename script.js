"use strict";

const FILES = ["L", "a", "b", "c", "d", "e", "f", "g", "h", "R"];
const SYMBOLS = {
  w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
  b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" }
};
const NAMES = { K: "King", Q: "Queen", R: "Rook", B: "Bishop", N: "Knight", P: "Pawn" };
const KNIGHT_STEPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
const DIAGONALS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const ORTHOGONALS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

function isClosedSquare(row, col) {
  return (col === 0 || col === 9) && (row === 3 || row === 4);
}

const boardElement = document.querySelector("#board");
const statusElement = document.querySelector("#game-status");
const statusLabel = document.querySelector("#status-label");
const statusDot = document.querySelector("#status-dot");
const riftList = document.querySelector("#rift-piece-list");
const promotionDialog = document.querySelector("#promotion-dialog");
const roomStatus = document.querySelector("#room-status");
const inviteLinkRow = document.querySelector("#invite-link-row");
const inviteLinkInput = document.querySelector("#invite-link");

let state = null;
let flipped = false;
let gameStarted = false;
let pendingPromotion = null;
let gameMode = "local";
let playerColor = "w";
let peer = null;
let dataConnection = null;
let roomToken = null;
let remoteMovePending = false;
let lobby = null;

function makePiece(color, type, rift = false, riftPower = null) {
  return { color, type, rift, riftPower, moves: 0 };
}

function freshState(options, players) {
  const board = Array.from({ length: 8 }, () => Array(10).fill(null));
  const home = ["R", "N", "B", "Q", "K", "B", "N", "R"];
  for (let col = 1; col <= 8; col += 1) {
    board[0][col] = makePiece("b", home[col - 1]);
    board[1][col] = makePiece("b", "P");
    board[6][col] = makePiece("w", "P");
    board[7][col] = makePiece("w", home[col - 1]);
  }
  for (const color of ["w", "b"]) {
    const row = color === "w" ? 7 : 0;
    board[row][0] = makePiece(color, options[color].left.type, true, options[color].left.power);
    board[row][9] = makePiece(color, options[color].right.type, true, options[color].right.power);
  }
  return {
    board,
    turn: "w",
    selected: null,
    legalMoves: [],
    enPassant: null,
    castling: { w: { king: true, queen: true }, b: { king: true, queen: true } },
    lastMove: null,
    captured: { w: [], b: [] },
    history: [],
    players: {
      w: { name: players.w.name },
      b: { name: players.b.name }
    },
    gameOver: false
  };
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 10;
}

function isPlayableSquare(row, col) {
  return inBounds(row, col) && !isClosedSquare(row, col);
}

function cloneBoard(board) {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

function findKing(board, color) {
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const piece = board[row][col];
      if (piece && piece.color === color && piece.type === "K") return { row, col };
    }
  }
  return null;
}

function addSlidingMoves(board, row, col, color, directions, moves) {
  for (const [dr, dc] of directions) {
    let nextRow = row + dr;
    let nextCol = col + dc;
    while (inBounds(nextRow, nextCol)) {
      if (isClosedSquare(nextRow, nextCol)) break;
      const target = board[nextRow][nextCol];
      if (!target) {
        moves.push({ row: nextRow, col: nextCol });
      } else {
        if (target.color !== color && target.type !== "K") moves.push({ row: nextRow, col: nextCol });
        break;
      }
      nextRow += dr;
      nextCol += dc;
    }
  }
}

function pseudoMoves(game, row, col, includeSurge = true) {
  const { board, enPassant } = game;
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const color = piece.color;
  const forward = color === "w" ? -1 : 1;
  const addLeapMoves = (steps) => {
    for (const [dr, dc] of steps) {
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (!isPlayableSquare(nextRow, nextCol)) continue;
      const target = board[nextRow][nextCol];
      if (!target || (target.color !== color && target.type !== "K")) {
        moves.push({ row: nextRow, col: nextCol });
      }
    }
  };

  if (piece.type === "P") {
    const nextRow = row + forward;
    if (isPlayableSquare(nextRow, col) && !board[nextRow][col]) {
      moves.push({ row: nextRow, col });
      const homeRow = color === "w" ? 6 : 1;
      const doubleRow = row + 2 * forward;
      if (row === homeRow && isPlayableSquare(doubleRow, col) && !board[doubleRow][col]) {
        moves.push({ row: doubleRow, col });
      }
    }
    for (const dc of [-1, 1]) {
      const targetRow = row + forward;
      const targetCol = col + dc;
      if (!isPlayableSquare(targetRow, targetCol)) continue;
      const target = board[targetRow][targetCol];
      if ((target && target.color !== color && target.type !== "K") ||
          (enPassant && enPassant.row === targetRow && enPassant.col === targetCol)) {
        moves.push({ row: targetRow, col: targetCol });
      }
    }
  } else if (piece.type === "N") {
    addLeapMoves(KNIGHT_STEPS);
  } else if (piece.type === "B") {
    addSlidingMoves(board, row, col, color, DIAGONALS, moves);
  } else if (piece.type === "R") {
    addSlidingMoves(board, row, col, color, ORTHOGONALS, moves);
  } else if (piece.type === "Q") {
    addSlidingMoves(board, row, col, color, [...DIAGONALS, ...ORTHOGONALS], moves);
  } else if (piece.type === "K") {
    addLeapMoves([...DIAGONALS, ...ORTHOGONALS]);
    const homeRow = color === "w" ? 7 : 0;
    if (row === homeRow && col === 5 && !isInCheck(board, color)) {
      for (const side of ["king", "queen"]) {
        if (!game.castling[color][side]) continue;
        const rookCol = side === "king" ? 8 : 1;
        const step = side === "king" ? 1 : -1;
        const transit = side === "king" ? [6, 7] : [4, 3];
        const emptyCols = side === "king" ? [6, 7] : [2, 3, 4];
        const rook = board[homeRow][rookCol];
        if (!rook || rook.color !== color || rook.type !== "R" || rook.rift ||
            emptyCols.some(checkCol => board[homeRow][checkCol])) continue;
        if (transit.every(checkCol => !isSquareAttacked(board, homeRow, checkCol, opposite(color)))) {
          moves.push({ row: homeRow, col: col + 2 * step, castle: side });
        }
      }
    }
  }

  if (includeSurge && piece.rift && piece.moves >= 3 && (piece.moves + 1) % 3 === 0) {
    const surgeMoves = piece.riftPower === "N"
      ? leapMovesFrom(board, row, col, color, KNIGHT_STEPS)
      : slidingMovesFrom(board, row, col, color,
        piece.riftPower === "R" ? ORTHOGONALS : DIAGONALS);
    for (const move of surgeMoves) {
      if (!moves.some(candidate => candidate.row === move.row && candidate.col === move.col)) {
        moves.push({ ...move, surge: true });
      } else {
        const existing = moves.find(candidate => candidate.row === move.row && candidate.col === move.col);
        existing.surge = true;
      }
    }
  }
  return moves;
}

function slidingMovesFrom(board, row, col, color, directions) {
  const moves = [];
  addSlidingMoves(board, row, col, color, directions, moves);
  return moves;
}

function leapMovesFrom(board, row, col, color, steps) {
  const moves = [];
  for (const [dr, dc] of steps) {
    const nextRow = row + dr;
    const nextCol = col + dc;
    if (!isPlayableSquare(nextRow, nextCol)) continue;
    const target = board[nextRow][nextCol];
    if (!target || (target.color !== color && target.type !== "K")) {
      moves.push({ row: nextRow, col: nextCol });
    }
  }
  return moves;
}

function isSquareAttacked(board, row, col, byColor) {
  const canSlide = (fromRow, fromCol) => {
    const rowStep = Math.sign(row - fromRow);
    const colStep = Math.sign(col - fromCol);
    let scanRow = fromRow + rowStep;
    let scanCol = fromCol + colStep;
    while (scanRow !== row || scanCol !== col) {
      if (isClosedSquare(scanRow, scanCol) || board[scanRow][scanCol]) return false;
      scanRow += rowStep;
      scanCol += colStep;
    }
    return true;
  };
  for (let fromRow = 0; fromRow < 8; fromRow += 1) {
    for (let fromCol = 0; fromCol < 10; fromCol += 1) {
      const piece = board[fromRow][fromCol];
      if (!piece || piece.color !== byColor || isClosedSquare(fromRow, fromCol)) continue;
      const rowDelta = row - fromRow;
      const colDelta = col - fromCol;
      const absRow = Math.abs(rowDelta);
      const absCol = Math.abs(colDelta);
      const diagonal = absRow === absCol;
      const orthogonal = rowDelta === 0 || colDelta === 0;
      const knightLeap = (absRow === 2 && absCol === 1) || (absRow === 1 && absCol === 2);
      const pawnAttack = piece.type === "P" && rowDelta === (byColor === "w" ? -1 : 1) && absCol === 1;
      const kingAttack = piece.type === "K" && Math.max(absRow, absCol) === 1;
      const knightAttack = piece.type === "N" && knightLeap;
      const bishopAttack = piece.type === "B" && diagonal && canSlide(fromRow, fromCol);
      const rookAttack = piece.type === "R" && orthogonal && canSlide(fromRow, fromCol);
      const queenAttack = piece.type === "Q" && (diagonal || orthogonal) && canSlide(fromRow, fromCol);
      if (pawnAttack || kingAttack || knightAttack || bishopAttack || rookAttack || queenAttack) return true;
      if (piece.rift && isSurgeAvailable(piece)) {
        if (piece.riftPower === "N" && knightLeap) return true;
        if (piece.riftPower === "R" && orthogonal && canSlide(fromRow, fromCol)) return true;
        if (piece.riftPower === "B" && diagonal && canSlide(fromRow, fromCol)) return true;
      }
    }
  }
  return false;
}

function opposite(color) {
  return color === "w" ? "b" : "w";
}

function isInCheck(board, color) {
  const king = findKing(board, color);
  return king ? isSquareAttacked(board, king.row, king.col, opposite(color)) : false;
}

function applyMove(game, from, move, promotion = "Q") {
  const board = cloneBoard(game.board);
  const piece = board[from.row][from.col];
  let captured = board[move.row][move.col];
  if (piece.type === "P" && game.enPassant &&
      move.row === game.enPassant.row && move.col === game.enPassant.col && !captured) {
    captured = board[from.row][move.col];
    board[from.row][move.col] = null;
  }
  board[from.row][from.col] = null;
  const movedPiece = { ...piece, moves: piece.moves + 1 };
  if (piece.type === "P" && (move.row === 0 || move.row === 7)) movedPiece.type = promotion;
  board[move.row][move.col] = movedPiece;
  if (move.castle) {
    const rookFrom = move.castle === "king" ? 8 : 1;
    const rookTo = move.castle === "king" ? 6 : 4;
    board[from.row][rookTo] = board[from.row][rookFrom];
    board[from.row][rookFrom] = null;
    if (board[from.row][rookTo]) board[from.row][rookTo].moves += 1;
  }
  return { board, captured };
}

function legalMoves(game, row, col) {
  const piece = game.board[row][col];
  if (!piece || piece.color !== game.turn) return [];
  return pseudoMoves(game, row, col).filter(move => {
    const { board } = applyMove(game, { row, col }, move);
    return !isInCheck(board, piece.color);
  });
}

function allLegalMoves(game, color) {
  const moves = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const piece = game.board[row][col];
      if (piece && piece.color === color) {
        for (const move of pseudoMoves(game, row, col)) {
          const next = applyMove(game, { row, col }, move);
          if (!isInCheck(next.board, color)) moves.push({ from: { row, col }, ...move });
        }
      }
    }
  }
  return moves;
}

function updateCastlingRights(piece, from, captured, to) {
  if (piece.type === "K") {
    state.castling[piece.color].king = false;
    state.castling[piece.color].queen = false;
  }
  if (piece.type === "R" && from.row === (piece.color === "w" ? 7 : 0)) {
    if (from.col === 8) state.castling[piece.color].king = false;
    if (from.col === 1) state.castling[piece.color].queen = false;
  }
  if (captured && captured.type === "R" && to.row === (captured.color === "w" ? 7 : 0)) {
    if (to.col === 8) state.castling[captured.color].king = false;
    if (to.col === 1) state.castling[captured.color].queen = false;
  }
}

function commitMove(from, move, promotion = "Q") {
  if (gameMode === "guest") {
    if (!dataConnection || !dataConnection.open) {
      setRoomStatus("You are disconnected from the host. Reopen the invite link to rejoin.", "error");
      return;
    }
    dataConnection.send({
      type: "move",
      version: state.history.length,
      from,
      to: { row: move.row, col: move.col },
      promotion
    });
    remoteMovePending = true;
    state.selected = null;
    state.legalMoves = [];
    setRoomStatus("Move sent. Waiting for the host to confirm it.", "waiting");
    render();
    return;
  }

  const piece = state.board[from.row][from.col];
  const movingPiece = { ...piece };
  const capturedAt = piece.type === "P" && state.enPassant &&
    move.row === state.enPassant.row && move.col === state.enPassant.col &&
    !state.board[move.row][move.col] ? { row: from.row, col: move.col } : move;
  const captured = state.board[capturedAt.row][capturedAt.col];
  const result = applyMove(state, from, move, promotion);
  updateCastlingRights(movingPiece, from, captured, move);
  state.board = result.board;
  if (captured) state.captured[piece.color].push(captured);
  state.enPassant = piece.type === "P" && Math.abs(move.row - from.row) === 2
    ? { row: (move.row + from.row) / 2, col: move.col }
    : null;
  state.lastMove = { from, to: { row: move.row, col: move.col } };
  state.history.push({ color: piece.color, type: piece.type, from, to: { row: move.row, col: move.col }, surge: !!move.surge });
  state.turn = opposite(state.turn);
  state.selected = null;
  state.legalMoves = [];
  updateGameStatus();
  render();
  if (gameMode === "host") sendRoomState();
}

function updateGameStatus() {
  const checked = isInCheck(state.board, state.turn);
  const options = allLegalMoves(state, state.turn);
  const colorName = state.players[state.turn].name;
  const winnerName = state.players[opposite(state.turn)].name;
  state.gameOver = options.length === 0;
  statusDot.classList.toggle("in-check", checked);
  if (state.gameOver) {
    statusLabel.textContent = checked ? "CHECKMATE" : "STALEMATE";
    statusElement.textContent = checked
      ? `${winnerName} wins. ${colorName}'s king is trapped.`
      : "Draw by stalemate. No legal moves remain.";
  } else if (checked) {
    statusLabel.textContent = "KING IN CHECK";
    statusElement.textContent = `${colorName}'s king is under attack. Find a way out.`;
  } else {
    statusLabel.textContent = "GAME STATUS";
    statusElement.textContent = `${colorName} to move${state.history.length ? ` · Move ${Math.floor(state.history.length / 2) + 1}` : ""}.`;
  }
}

function algebraic(row, col) {
  return `${FILES[col]}${8 - row}`;
}

function isSurgeAvailable(piece) {
  return piece.rift && piece.moves >= 3 && (piece.moves + 1) % 3 === 0;
}

function renderBoard() {
  boardElement.replaceChildren();
  const rowOrder = flipped ? [...Array(8).keys()] : [...Array(8).keys()].reverse();
  const colOrder = flipped ? [...Array(10).keys()].reverse() : [...Array(10).keys()];
  const checkKing = isInCheck(state.board, state.turn) ? findKing(state.board, state.turn) : null;
  for (const row of rowOrder) {
    for (const col of colOrder) {
      const piece = state.board[row][col];
      const square = document.createElement("button");
      square.type = "button";
      const closed = isClosedSquare(row, col);
      const onlineTurnLocked = gameMode !== "local" &&
        (remoteMovePending || state.turn !== playerColor);
      square.disabled = !gameStarted || closed || onlineTurnLocked;
      square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}${col === 0 || col === 9 ? " rift-file" : ""}`;
      square.setAttribute("role", "gridcell");
      if (closed) {
        square.classList.add("warden-square");
        square.setAttribute("aria-label", `Neutral Rift Warden on ${algebraic(row, col)}. Stationary, cannot be captured or crossed.`);
        square.setAttribute("aria-disabled", "true");
        const warden = document.createElement("span");
        warden.className = "rift-warden";
        warden.setAttribute("aria-hidden", "true");
        const sigil = document.createElement("span");
        sigil.className = "warden-sigil";
        sigil.textContent = "✦";
        const name = document.createElement("span");
        name.className = "warden-name";
        name.textContent = "WARDEN";
        warden.append(sigil, name);
        square.append(warden);
      } else {
        square.setAttribute("aria-label", `${piece ? `${piece.color === "w" ? "White" : "Black"} ${NAMES[piece.type]}` : "Empty"} on ${algebraic(row, col)}${col === 0 || col === 9 ? ", rift file" : ""}`);
      }
      if (state.selected && state.selected.row === row && state.selected.col === col) square.classList.add("selected");
      if (state.lastMove && ((state.lastMove.from.row === row && state.lastMove.from.col === col) ||
          (state.lastMove.to.row === row && state.lastMove.to.col === col))) square.classList.add("last-move");
      if (checkKing && checkKing.row === row && checkKing.col === col) square.classList.add("check-square");
      const targetMove = state.legalMoves.find(move => move.row === row && move.col === col);
      if (targetMove) square.classList.add(piece ? "legal-capture" : "legal-move");
      if (piece && !closed) {
        const span = document.createElement("span");
        span.className = `piece ${piece.color === "w" ? "white-piece" : "black-piece"}${piece.rift ? " rift-piece" : ""}`;
        span.textContent = SYMBOLS[piece.color][piece.type];
        square.append(span);
      }
      if (!closed && row === (flipped ? 0 : 7)) {
        const coord = document.createElement("span");
        coord.className = "square-name";
        coord.textContent = FILES[col];
        square.append(coord);
      }
      if (!closed) square.addEventListener("click", () => handleSquareClick(row, col));
      boardElement.append(square);
    }
  }

  const fileLabels = colOrder.map(col => `<span${col === 0 || col === 9 ? ' class="rift-coordinate"' : ""}>${FILES[col]}</span>`).join("");
  document.querySelectorAll(".board-coordinates").forEach(coordinates => {
    coordinates.innerHTML = fileLabels;
  });
  const rankLabels = rowOrder.map(row => `<span>${8 - row}</span>`).join("");
  document.querySelector("#rank-coordinates").innerHTML = rankLabels;
  document.querySelector("#right-ranks").innerHTML = rankLabels;
}

function handleSquareClick(row, col) {
  if (!gameStarted || !state || state.gameOver || pendingPromotion) return;
  const clickedPiece = state.board[row][col];
  const controlledColor = gameMode === "host" ? "w" : gameMode === "guest" ? "b" : state.turn;
  if (state.selected) {
    const move = state.legalMoves.find(candidate => candidate.row === row && candidate.col === col);
    if (move) {
      const piece = state.board[state.selected.row][state.selected.col];
      if (piece.type === "P" && (row === 0 || row === 7)) {
        pendingPromotion = { from: state.selected, move };
        promotionDialog.showModal();
        return;
      }
      commitMove(state.selected, move);
      return;
    }
    if (clickedPiece && clickedPiece.color === controlledColor) {
      selectPiece(row, col);
      return;
    }
    state.selected = null;
    state.legalMoves = [];
    render();
    return;
  }
  if (clickedPiece && clickedPiece.color === controlledColor) selectPiece(row, col);
}

function selectPiece(row, col) {
  state.selected = { row, col };
  state.legalMoves = legalMoves(state, row, col);
  render();
}

function renderRiftPieces() {
  const pieces = [];
  for (const color of ["w", "b"]) {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 10; col += 1) {
        const piece = state.board[row][col];
        if (!piece || !piece.rift || piece.color !== color) continue;
        const awakened = piece.moves >= 3;
        const progress = piece.moves < 3
          ? `${piece.moves}/3 moves to awaken`
          : 3 - (piece.moves % 3) === 1
            ? "Surge ready next move"
            : `Surge in ${3 - (piece.moves % 3)} moves`;
        const ability = { N: "Knight leap", R: "Rook stride", B: "Bishop glide" }[piece.riftPower];
        pieces.push(`<div class="rift-piece-card">
          <span class="rift-piece-symbol">${SYMBOLS[color][piece.type]}</span>
          <div class="rift-piece-main"><strong>${escapeHtml(state.players[color].name)} · ${NAMES[piece.type]} · ${algebraic(row, col)}</strong>
          <span>${ability} · ${progress}</span></div>
          <span class="rift-piece-level${awakened ? " awakened" : ""}">${awakened ? "LEVEL 1" : "LEVEL 0"}</span>
        </div>`);
      }
    }
  }
  riftList.innerHTML = pieces.join("") || '<p class="empty-rifts">Your rift pieces will appear here.</p>';
}

function renderPlayerStrips() {
  for (const color of ["w", "b"]) {
    const indicator = document.querySelector(`#${color === "w" ? "white" : "black"}-turn`);
    const name = document.querySelector(`#${color === "w" ? "white" : "black"}-player-display`);
    const playerName = gameStarted && state.players
      ? state.players[color].name
      : (lobby && lobby[color].name) || (color === "w" ? "White" : "Black");
    name.textContent = playerName;
    const isCurrentTurn = gameStarted && state.turn === color && !state.gameOver;
    const isMyColor = gameMode === "local" || playerColor === color;
    indicator.classList.toggle("is-active", isCurrentTurn && isMyColor);
    if (gameStarted && !state.gameOver) {
      indicator.textContent = isCurrentTurn
        ? (isMyColor ? "YOUR TURN" : "THEIR TURN")
        : "WAITING";
    } else if (lobby) {
      const opponentConnected = gameMode === "local" || Boolean(dataConnection && dataConnection.open);
      indicator.textContent = lobby[color].ready
        ? "READY"
        : isMyColor
          ? "NOT READY"
          : opponentConnected ? "NOT READY" : "OFFLINE";
    } else {
      indicator.textContent = "WAITING";
    }
  }
  for (const color of ["w", "b"]) {
    const captured = state.captured[color].map(piece => SYMBOLS[piece.color][piece.type]).join("");
    document.querySelector(`#${color === "w" ? "white" : "black"}-captured`).textContent = captured;
  }
  document.querySelector("#game-mode-label").innerHTML = gameMode === "local"
    ? "LOCAL TWO-PLAYER <span>·</span> PASS &amp; PLAY"
    : `ONLINE ROOM <span>·</span> PLAYING ${playerColor === "w" ? "WHITE" : "BLACK"}`;
}

function render() {
  renderBoard();
  renderRiftPieces();
  renderPlayerStrips();
  renderLobby();
}

function escapeHtml(text) {
  const element = document.createElement("span");
  element.textContent = text;
  return element.innerHTML;
}

function defaultProfile(name = "Player") {
  return {
    name,
    ready: false,
    options: {
      left: { type: "R", power: "B" },
      right: { type: "N", power: "R" }
    }
  };
}

function getPlayerName(color) {
  return document.querySelector(`#${color === "w" ? "white" : "black"}-player-name`).value.trim().slice(0, 24) ||
    (color === "w" ? "White" : "Black");
}

function readProfile(color) {
  const prefix = color === "w" ? "white" : "black";
  return {
    name: getPlayerName(color),
    ready: false,
    options: {
      left: {
        type: document.querySelector(`#${prefix}-left`).value,
        power: document.querySelector(`#${prefix}-left-power`).value
      },
      right: {
        type: document.querySelector(`#${prefix}-right`).value,
        power: document.querySelector(`#${prefix}-right-power`).value
      }
    }
  };
}

function currentPlayers() {
  return {
    w: { name: lobby.w.name || getPlayerName("w") },
    b: { name: lobby.b.name || getPlayerName("b") }
  };
}

function renderLobby() {
  if (!lobby) return;
  for (const color of ["w", "b"]) {
    const profile = lobby[color];
    const side = document.querySelector(`.setup-player[data-color="${color}"]`);
    const nameField = document.querySelector(`#${color === "w" ? "white" : "black"}-player-name`);
    const readyButton = document.querySelector(`#${color === "w" ? "white" : "black"}-ready-button`);
    const readyStatus = document.querySelector(`#${color === "w" ? "white" : "black"}-ready-status`);
    const isEditable = gameMode === "local" || color === playerColor;
    side.classList.toggle("opponent-setup", !isEditable);
    for (const control of side.querySelectorAll("input, select")) {
      control.disabled = !isEditable || profile.ready || gameStarted;
    }
    readyButton.hidden = !isEditable;
    readyButton.disabled = profile.ready || gameStarted ||
      (gameMode !== "local" && (!dataConnection || !dataConnection.open));
    readyButton.textContent = profile.ready ? "Ready — locked in" : `${profile.name || (color === "w" ? "White" : "Black")} is ready`;
    readyStatus.textContent = profile.ready ? "READY" : (isEditable ? "NOT READY" : "WAITING");
    readyStatus.classList.toggle("is-ready", profile.ready);
    if (nameField.value !== profile.name && profile.name) nameField.value = profile.name;
  }
  const readyCount = Number(lobby.w.ready) + Number(lobby.b.ready);
  const hint = document.querySelector("#setup-ready-hint");
  const intro = document.querySelector("#setup-intro");
  if (gameMode === "local") {
    intro.textContent = "Name both players, choose your pieces and powers, then both players lock in. The game stays locked until both are ready.";
    hint.textContent = readyCount === 2 ? "Both players are ready. Starting the game…" :
      `${readyCount}/2 ready — both players must lock their choices before the first move.`;
  } else if (gameMode === "host" || gameMode === "guest") {
    const otherColor = playerColor === "w" ? "b" : "w";
    intro.textContent = playerColor === "w"
      ? "Choose your White name, pieces, and powers. Your friend joins as Black; both players must ready up before the board unlocks."
      : "Choose your Black name, pieces, and powers. The host's White setup is shown above. Both players must ready up before the board unlocks.";
    hint.textContent = !dataConnection || !dataConnection.open
      ? "Waiting for your opponent to join the room."
      : lobby[playerColor].ready && lobby[otherColor].ready
        ? "Both players are ready. Waiting for the host to start the game."
      : lobby[otherColor].ready
        ? `${lobby[otherColor].name} is ready. Lock in your choices to start.`
        : `Waiting for ${lobby[otherColor].name || "your opponent"} to lock in.`;
  } else {
    hint.textContent = "Both players must lock their choices before the first move.";
  }
  document.querySelector("#white-player-display").textContent = lobby.w.name || "White";
  document.querySelector("#black-player-display").textContent = lobby.b.name || "Black";
}

function sendLobby() {
  if (dataConnection && dataConnection.open && gameMode === "host") {
    dataConnection.send({ type: "lobby", players: lobby });
  }
}

function validProfile(profile) {
  const validChoice = choice => choice &&
    ["R", "B", "N"].includes(choice.type) &&
    ["R", "B", "N"].includes(choice.power) &&
    choice.type !== choice.power;
  return profile && typeof profile.name === "string" &&
    profile.name.trim().length > 0 && profile.name.length <= 24 &&
    typeof profile.ready === "boolean" &&
    profile.options && validChoice(profile.options.left) && validChoice(profile.options.right);
}

function setProfileInputs(color, profile) {
  const prefix = color === "w" ? "white" : "black";
  document.querySelector(`#${prefix}-player-name`).value = profile.name;
  for (const side of ["left", "right"]) {
    document.querySelector(`#${prefix}-${side}`).value = profile.options[side].type;
    document.querySelector(`#${prefix}-${side}-power`).value = profile.options[side].power;
    updatePowerOptions(color, side);
  }
}

function updatePowerOptions(color, side) {
  const prefix = color === "w" ? "white" : "black";
  const type = document.querySelector(`#${prefix}-${side}`).value;
  const powerSelect = document.querySelector(`#${prefix}-${side}-power`);
  for (const option of powerSelect.options) option.disabled = option.value === type;
  if (powerSelect.value === type) {
    powerSelect.value = type === "R" ? "B" : "R";
  }
}

function syncEditedProfile(color) {
  if (gameStarted || !lobby || lobby[color].ready) return;
  lobby[color] = readProfile(color);
  state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  render();
  if (gameMode === "host") sendLobby();
  if (gameMode === "guest" && dataConnection && dataConnection.open) {
    dataConnection.send({ type: "setup", player: "b", profile: lobby.b });
  }
}

function beginPreparedGame() {
  if (gameMode === "guest" || !lobby.w.ready || !lobby.b.ready || gameStarted) return;
  state = freshState(
    { w: lobby.w.options, b: lobby.b.options },
    currentPlayers()
  );
  gameStarted = true;
  document.querySelector("#setup-card").hidden = true;
  updateGameStatus();
  render();
  if (gameMode === "host") {
    dataConnection.send({ type: "start", state: roomSnapshot() });
    setRoomStatus("Both players are ready. The game is live!", "connected");
  }
}

function lockInPlayer(color) {
  if (lobby[color].ready || gameStarted) return;
  lobby[color] = readProfile(color);
  lobby[color].ready = true;
  render();
  if (gameMode === "guest") {
    if (!dataConnection || !dataConnection.open) {
      lobby[color].ready = false;
      renderLobby();
      setRoomStatus("Connect to the host before locking in your setup.", "error");
      return;
    }
    dataConnection.send({ type: "setup", player: "b", profile: lobby.b });
    setRoomStatus("Your setup is locked. Waiting for the host to ready up.", "waiting");
  } else if (gameMode === "host") {
    sendLobby();
  }
  if (gameMode !== "guest" && lobby.w.ready && lobby.b.ready) beginPreparedGame();
}

document.querySelector("#white-ready-button").addEventListener("click", () => lockInPlayer("w"));
document.querySelector("#black-ready-button").addEventListener("click", () => lockInPlayer("b"));
document.querySelector("#new-game-button").addEventListener("click", () => {
  stopOnlineRoom();
  gameMode = "local";
  playerColor = "w";
  gameStarted = false;
  lobby = { w: readProfile("w"), b: readProfile("b") };
  lobby.w.ready = false;
  lobby.b.ready = false;
  state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  document.querySelector("#setup-card").hidden = false;
  statusLabel.textContent = "GAME STATUS";
  statusElement.textContent = "Choose player names and rift loadouts, then both players ready up.";
  statusDot.classList.remove("in-check");
  document.querySelector("#create-room-button").disabled = false;
  document.querySelector("#create-room-button").innerHTML = 'Create online room <span aria-hidden="true">↗</span>';
  inviteLinkRow.hidden = true;
  inviteLinkInput.value = "";
  setRoomStatus("Online play needs this page to be hosted on HTTPS.");
  render();
});
for (const color of ["w", "b"]) {
  const prefix = color === "w" ? "white" : "black";
  for (const side of ["left", "right"]) {
    document.querySelector(`#${prefix}-${side}`).addEventListener("change", () => {
      updatePowerOptions(color, side);
      syncEditedProfile(color);
    });
    document.querySelector(`#${prefix}-${side}-power`).addEventListener("change", () => syncEditedProfile(color));
  }
  document.querySelector(`#${prefix}-player-name`).addEventListener("input", () => syncEditedProfile(color));
}
document.querySelector("#flip-button").addEventListener("click", event => {
  flipped = !flipped;
  event.currentTarget.setAttribute("aria-pressed", String(flipped));
  if (state) renderBoard();
});
promotionDialog.addEventListener("close", () => {
  if (!pendingPromotion) return;
  const choice = promotionDialog.returnValue;
  const promotion = ["Q", "R", "B", "N"].includes(choice) ? choice : "Q";
  const { from, move } = pendingPromotion;
  pendingPromotion = null;
  commitMove(from, move, promotion);
});

function setRoomStatus(message, kind = "") {
  roomStatus.textContent = message;
  if (kind) roomStatus.dataset.state = kind;
  else delete roomStatus.dataset.state;
}

function isHostedSecurely() {
  return window.location.protocol === "https:" ||
    (window.location.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname));
}

function createRoomToken() {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function roomSnapshot() {
  return {
    ...state,
    selected: null,
    legalMoves: []
  };
}

function sendRoomState() {
  if (dataConnection && dataConnection.open) {
    dataConnection.send({ type: "state", state: roomSnapshot() });
  }
}

function validRemoteState(remoteState) {
  const validPiece = piece => piece === null ||
    (piece && ["w", "b"].includes(piece.color) &&
      ["K", "Q", "R", "B", "N", "P"].includes(piece.type) &&
      typeof piece.rift === "boolean" &&
      (!piece.rift || ["R", "B", "N"].includes(piece.riftPower)) &&
      Number.isInteger(piece.moves) && piece.moves >= 0 && piece.moves <= 100000);
  const validSquare = square => square &&
    Number.isInteger(square.row) && Number.isInteger(square.col) &&
    isPlayableSquare(square.row, square.col);
  const validHistory = move => move &&
    ["w", "b"].includes(move.color) &&
    ["K", "Q", "R", "B", "N", "P"].includes(move.type) &&
    validSquare(move.from) && validSquare(move.to);
  return remoteState &&
    Array.isArray(remoteState.board) && remoteState.board.length === 8 &&
    remoteState.board.every(row => Array.isArray(row) && row.length === 10 && row.every(validPiece)) &&
    ["w", "b"].includes(remoteState.turn) &&
    Array.isArray(remoteState.history) && remoteState.history.length <= 10000 &&
    remoteState.history.every(validHistory) &&
    remoteState.players && ["w", "b"].every(color =>
      remoteState.players[color] && typeof remoteState.players[color].name === "string" &&
      remoteState.players[color].name.length > 0 && remoteState.players[color].name.length <= 24) &&
    remoteState.captured && Array.isArray(remoteState.captured.w) &&
    Array.isArray(remoteState.captured.b) &&
    remoteState.captured.w.every(piece => piece !== null && validPiece(piece)) &&
    remoteState.captured.b.every(piece => piece !== null && validPiece(piece)) &&
    remoteState.castling && ["w", "b"].every(color =>
      remoteState.castling[color] &&
      typeof remoteState.castling[color].king === "boolean" &&
      typeof remoteState.castling[color].queen === "boolean") &&
    (remoteState.enPassant === null || validSquare(remoteState.enPassant)) &&
    (remoteState.lastMove === null ||
      (remoteState.lastMove && validSquare(remoteState.lastMove.from) && validSquare(remoteState.lastMove.to)));
}

function receiveRoomData(connection, message) {
  if (!message || typeof message !== "object") return;
  if (gameMode === "host") {
    if (!connection.roomAuthenticated) {
      if (message.type !== "join" || message.token !== roomToken || !validProfile(message.profile)) {
        connection.close();
        return;
      }
      connection.roomAuthenticated = true;
      lobby.b = { ...message.profile, ready: false, name: message.profile.name.trim() };
      setProfileInputs("b", lobby.b);
      setRoomStatus(`${lobby.b.name} joined as Black. Both players need to ready up.`, "connected");
      render();
      if (gameStarted) {
        connection.send({ type: "start", state: roomSnapshot() });
      } else {
        sendLobby();
      }
      return;
    }
    if (message.type === "setup" && message.player === "b" && validProfile(message.profile) && !gameStarted) {
      if (lobby.b.ready && !message.profile.ready) return;
      lobby.b = { ...message.profile, name: message.profile.name.trim() };
      setProfileInputs("b", lobby.b);
      render();
      sendLobby();
      if (lobby.w.ready && lobby.b.ready) beginPreparedGame();
      else setRoomStatus(`${lobby.b.name} ${lobby.b.ready ? "is ready" : "is choosing a loadout"}.`, "connected");
      return;
    }
    if (message.type !== "move" || !Number.isInteger(message.version) ||
        !gameStarted ||
        message.version !== state.history.length ||
        !message.from || !message.to ||
        !Number.isInteger(message.from.row) || !Number.isInteger(message.from.col) ||
        !Number.isInteger(message.to.row) || !Number.isInteger(message.to.col) ||
        !["Q", "R", "B", "N"].includes(message.promotion)) return;
    const piece = state.board[message.from.row]?.[message.from.col];
    if (state.turn !== "b" || !piece || piece.color !== "b") return;
    const move = legalMoves(state, message.from.row, message.from.col)
      .find(candidate => candidate.row === message.to.row && candidate.col === message.to.col);
    if (!move) return;
    if (piece.type === "P" && (move.row === 0 || move.row === 7) &&
        !["Q", "R", "B", "N"].includes(message.promotion)) return;
    commitMove(message.from, move, message.promotion);
    setRoomStatus(`${lobby.b.name} is connected.`, "connected");
    return;
  }

  if (gameMode === "guest" && message.type === "lobby" && !gameStarted &&
      message.players && validProfile(message.players.w) && validProfile(message.players.b)) {
    lobby.w = { ...message.players.w };
    if (!lobby.b.ready) lobby.b = { ...message.players.b, ready: false };
    setProfileInputs("w", lobby.w);
    render();
    setRoomStatus(`${lobby.w.name} is hosting as White. Choose your Black loadout and ready up.`, "connected");
    return;
  }

  if (gameMode === "guest" && message.type === "start" && validRemoteState(message.state) &&
      (!state || message.state.history.length >= state.history.length)) {
    state = {
      ...message.state,
      selected: null,
      legalMoves: []
    };
    gameStarted = true;
    lobby.w = { ...lobby.w, name: state.players.w.name, ready: true };
    lobby.b = { ...lobby.b, name: state.players.b.name, ready: true };
    remoteMovePending = false;
    updateGameStatus();
    render();
    document.querySelector("#create-room-button").textContent = "Joined as Black";
    setRoomStatus(`Game started. You are Black; White is ${state.players.w.name}.`, "connected");
    return;
  }

  if (gameMode === "guest" && message.type === "state" && gameStarted &&
      validRemoteState(message.state) &&
      (!state || message.state.history.length >= state.history.length)) {
    state = {
      ...message.state,
      selected: null,
      legalMoves: []
    };
    remoteMovePending = false;
    updateGameStatus();
    render();
    setRoomStatus(`${state.players.w.name} is connected. You are Black.`, "connected");
  }
}

function watchConnection(connection, role) {
  connection.on("open", () => {
    if (role === "guest") {
      connection.send({ type: "join", token: roomToken, profile: readProfile("b") });
      setRoomStatus("Room found. Connecting to the host...", "waiting");
    }
    if (role === "host" && connection.roomAuthenticated) sendRoomState();
  });
  connection.on("data", message => receiveRoomData(connection, message));
  connection.on("close", () => {
    if (dataConnection === connection) dataConnection = null;
    if ((role === "host" && gameMode !== "host") || (role === "guest" && gameMode !== "guest")) return;
    if (role === "host") {
      if (!gameStarted) {
        lobby.b = defaultProfile("Black");
        setProfileInputs("b", lobby.b);
        render();
      }
      setRoomStatus(connection.roomAuthenticated
        ? `${lobby.b.name} disconnected. The invite link can be used to rejoin.`
        : "Waiting for your friend to join.", "waiting");
    } else {
      remoteMovePending = false;
      setRoomStatus("Connection to the host was lost. Reopen the invite link to rejoin.", "error");
      render();
    }
  });
  connection.on("error", () => {
    setRoomStatus("The peer connection failed. Check both players' internet connections and try again.", "error");
  });
}

function createOnlineRoom() {
  if (!isHostedSecurely()) {
    setRoomStatus("To invite someone, publish this game on an HTTPS website first. A file:// link only works on your own computer.", "error");
    return;
  }
  if (typeof Peer !== "function") {
    setRoomStatus("The online connection library did not load. Check your internet connection and reload the page.", "error");
    return;
  }
  stopOnlineRoom();
  gameMode = "host";
  playerColor = "w";
  roomToken = createRoomToken();
  lobby = { w: readProfile("w"), b: defaultProfile("Black") };
  state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  gameStarted = false;
  document.querySelector("#setup-card").hidden = false;
  document.querySelector("#create-room-button").disabled = true;
  document.querySelector("#create-room-button").textContent = "Creating room...";
  render();
  renderLobby();
  setRoomStatus("Connecting to the room service...", "waiting");

  peer = new Peer();
  peer.on("open", id => {
    const invite = new URL(window.location.href);
    invite.searchParams.set("room", id);
    invite.hash = roomToken;
    inviteLinkInput.value = invite.href;
    inviteLinkRow.hidden = false;
    document.querySelector("#create-room-button").textContent = "Room created";
    setRoomStatus(`${lobby.w.name}, your invite is ready. Lock in your setup and wait for your friend.`, "waiting");
  });
  peer.on("connection", connection => {
    if (dataConnection) {
      connection.close();
      return;
    }
    dataConnection = connection;
    connection.roomAuthenticated = false;
    watchConnection(connection, "host");
  });
  peer.on("disconnected", () => {
    setRoomStatus("Room service disconnected. Trying to reconnect...", "waiting");
    if (peer && !peer.destroyed) peer.reconnect();
  });
  peer.on("error", error => {
    const detail = error && error.type === "peer-unavailable"
      ? "That room is no longer available. Ask the host for a new invite."
      : "Could not create or connect to the room. Check the internet connection and try again.";
    setRoomStatus(detail, "error");
    document.querySelector("#create-room-button").disabled = false;
    document.querySelector("#create-room-button").textContent = "Try again";
  });
}

function joinOnlineRoom(roomId, token) {
  if (!isHostedSecurely()) {
    setRoomStatus("This invite needs to be opened from the game's HTTPS website, not from a file on someone's computer.", "error");
    return;
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(roomId) || !/^[a-f0-9]{32}$/.test(token)) {
    setRoomStatus("This invite link is incomplete or invalid. Ask the host to create a fresh invite.", "error");
    return;
  }
  if (typeof Peer !== "function") {
    setRoomStatus("The online connection library did not load. Check your internet connection and reload the page.", "error");
    return;
  }
  gameMode = "guest";
  playerColor = "b";
  roomToken = token;
  remoteMovePending = false;
  gameStarted = false;
  lobby = {
    w: defaultProfile("White"),
    b: readProfile("b")
  };
  state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  document.querySelector("#setup-card").hidden = false;
  document.querySelector("#create-room-button").disabled = true;
  document.querySelector("#create-room-button").textContent = "Joining room...";
  render();
  renderLobby();
  setRoomStatus("Finding the host's room...", "waiting");
  peer = new Peer();
  peer.on("open", () => {
    dataConnection = peer.connect(roomId, { reliable: true, serialization: "json" });
    watchConnection(dataConnection, "guest");
  });
  peer.on("error", error => {
    const detail = error && error.type === "peer-unavailable"
      ? "That room could not be found. Check the link or ask the host to create another."
      : "Could not connect to the room service. Check the internet connection and try again.";
    setRoomStatus(detail, "error");
    document.querySelector("#create-room-button").textContent = "Room unavailable";
  });
}

function stopOnlineRoom() {
  const connection = dataConnection;
  dataConnection = null;
  if (connection) connection.close();
  if (peer) peer.destroy();
  peer = null;
  roomToken = null;
  remoteMovePending = false;
  const url = new URL(window.location.href);
  if (url.searchParams.has("room")) {
    url.searchParams.delete("room");
    url.hash = "";
    window.history.replaceState({}, "", url);
  }
}

document.querySelector("#create-room-button").addEventListener("click", createOnlineRoom);
document.querySelector("#copy-invite-button").addEventListener("click", async () => {
  inviteLinkInput.focus();
  inviteLinkInput.select();
  try {
    await navigator.clipboard.writeText(inviteLinkInput.value);
    setRoomStatus("Invite link copied. Send it to your friend.", "connected");
  } catch {
    const copied = document.execCommand("copy");
    setRoomStatus(copied
      ? "Invite link copied. Send it to your friend."
      : "Select and copy the invite link above to share it.", copied ? "connected" : "waiting");
  }
});

for (const color of ["w", "b"]) {
  for (const side of ["left", "right"]) updatePowerOptions(color, side);
}
lobby = { w: readProfile("w"), b: readProfile("b") };
state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
render();
const invite = new URL(window.location.href);
const roomToJoin = invite.searchParams.get("room");
if (roomToJoin) joinOnlineRoom(roomToJoin, invite.hash.slice(1));

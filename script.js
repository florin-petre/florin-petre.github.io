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

let state = null;
let flipped = false;
let gameStarted = false;
let pendingPromotion = null;
let gameMode = "local";
let playerColor = "w";
let dataConnection = null;
let remoteMovePending = false;
let lobby = null;
let supabaseClient = null;
let currentUser = null;
let accountProfile = null;
let activeRoomId = null;
let activeRoomOpponentId = null;
let opponentIsOnline = false;
let directoryTimer = null;
let roomPollTimer = null;
let roomHeartbeatTimer = null;
let joinRetryTimer = null;

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
      setRoomStatus("This room is disconnected. Return to your player profile and rejoin the room.", "error");
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
      const opponentConnected = gameMode === "local" ||
        (gameMode === "host" ? Boolean(dataConnection && dataConnection.roomAuthenticated && opponentIsOnline) :
          Boolean(dataConnection && dataConnection.open && opponentIsOnline));
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
    if (gameMode !== "local") nameField.disabled = true;
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
      ? "Choose your pieces and powers. Your profile name is White; the invited player joins as Black. Both players must ready up before the board unlocks."
      : "Choose your pieces and powers. Your profile name is Black; the host's White setup is shown above. Both players must ready up before the board unlocks.";
    const opponentConnected = gameMode === "host"
      ? Boolean(dataConnection && dataConnection.roomAuthenticated && opponentIsOnline)
      : Boolean(dataConnection && dataConnection.open && opponentIsOnline);
    hint.textContent = !opponentConnected
      ? (dataConnection && dataConnection.roomAuthenticated
        ? `${lobby[otherColor].name} appears offline. Their ready status remains visible.`
        : "Waiting for your opponent to join the room.")
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
    if (activeRoomId) {
      void supabaseClient.from("game_rooms")
        .update({ status: "playing", updated_at: new Date().toISOString() })
        .eq("id", activeRoomId)
        .eq("host_id", currentUser.id);
    }
    setRoomStatus("Both players are ready. The game is live!", "connected");
  }
}

function lockInPlayer(color) {
  if (lobby[color].ready || gameStarted) return;
  lobby[color] = readProfile(color);
  if (gameMode !== "local" && accountProfile) lobby[color].name = accountProfile.username;
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
    setRoomStatus("Your setup is locked. The board starts after both players are ready.", "waiting");
  } else if (gameMode === "host") {
    sendLobby();
  }
  if (gameMode !== "guest" && lobby.w.ready && lobby.b.ready) beginPreparedGame();
}

document.querySelector("#white-ready-button").addEventListener("click", () => lockInPlayer("w"));
document.querySelector("#black-ready-button").addEventListener("click", () => lockInPlayer("b"));
document.querySelector("#new-game-button").addEventListener("click", async () => {
  const leftRoom = await stopOnlineRoom();
  gameMode = "local";
  playerColor = "w";
  gameStarted = false;
  lobby = { w: readProfile("w"), b: readProfile("b") };
  lobby.w.ready = false;
  lobby.b.ready = false;
  state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  document.querySelector("#setup-card").hidden = false;
  document.querySelector("#leave-room-button").hidden = true;
  statusLabel.textContent = "GAME STATUS";
  statusElement.textContent = "Choose player names and rift loadouts, then both players ready up.";
  statusDot.classList.remove("in-check");
  setRoomStatus(currentUser
    ? `Signed in as ${accountProfile.username}. Select a player to create a private room.`
    : "Log in or create a profile to play online.");
  if (!leftRoom) setRoomStatus("New game started, but room presence did not update. The room will remain available.", "error");
  render();
  if (currentUser) void refreshRooms().catch(error => {
    console.error("Could not refresh the room list after leaving.", error);
    setRoomStatus("You left the room, but could not refresh the room list.", "error");
  });
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

function normalizeUsername(value) {
  const username = value.trim().toLowerCase();
  return /^[a-z0-9_]{3,20}$/.test(username) ? username : null;
}

function usernameEmail(username) {
  return `${username}@accounts.riftchess.example.com`;
}

function setAccountMode(mode) {
  const signup = mode === "signup";
  document.querySelector("#account-form").dataset.mode = signup ? "signup" : "login";
  document.querySelector("#account-submit").textContent = signup ? "Create profile" : "Log in";
  document.querySelector("#account-mode-button").textContent = signup
    ? "I already have a profile"
    : "Create a new profile";
  document.querySelector("#account-password").autocomplete = signup ? "new-password" : "current-password";
}

function setAccountStatus(message, kind = "") {
  setRoomStatus(message, kind);
}

function renderPlayerDirectory(players) {
  const directory = document.querySelector("#player-directory");
  if (!players.length) {
    directory.innerHTML = '<p class="empty-rifts">No other profiles yet.</p>';
    return;
  }
  directory.innerHTML = players.map(player => {
    const online = Date.now() - Date.parse(player.last_seen_at) < 90000;
    return `<div class="directory-player">
      <span class="presence-dot${online ? " online" : ""}" aria-hidden="true"></span>
      <strong>${escapeHtml(player.username)}</strong>
      <span class="presence-label">${online ? "Online" : "Offline"}</span>
      <button class="secondary-button directory-invite" type="button" data-username="${escapeHtml(player.username)}"${online ? "" : " disabled"}>Invite</button>
    </div>`;
  }).join("");
}

function renderRoomList(rooms) {
  const roomList = document.querySelector("#room-list");
  if (!rooms.length) {
    roomList.innerHTML = '<p class="empty-rifts">No rooms yet. Invite a player to create one.</p>';
    return;
  }
  roomList.innerHTML = rooms.map(room => {
    const isHost = room.host_id === currentUser.id;
    const opponent = isHost ? room.invited_name : room.host_name;
    const hostOnline = room.host_seen_at &&
      Date.now() - Date.parse(room.host_seen_at) < 90000;
    const isActive = activeRoomId === room.id;
    const action = isActive
      ? `<button class="secondary-button join-room-button" type="button" disabled>In room</button>`
      : isHost
        ? `<button class="primary-button join-room-button" type="button" data-action="open" data-room-id="${escapeHtml(room.id)}">Open room</button>`
        : hostOnline
          ? `<button class="primary-button join-room-button" type="button" data-action="join" data-room-id="${escapeHtml(room.id)}">${room.game_state ? "Rejoin game" : "Join room"}</button>`
          : `<button class="secondary-button join-room-button" type="button" disabled>Host offline</button>`;
    const status = room.game_state ? "Saved game" : room.status === "closed" ? "Closed" : "Waiting";
    return `<div class="incoming-room">
      <span><strong>${escapeHtml(opponent)}</strong><small>${status} · Host ${hostOnline ? "online" : "offline"}</small></span>
      ${action}
    </div>`;
  }).join("");
}

async function refreshRooms() {
  if (!currentUser || !supabaseClient) return;
  const [{ data: players, error: playersError }, { data: rooms, error: roomsError }] = await Promise.all([
    supabaseClient.from("profiles").select("id,username,last_seen_at")
      .neq("id", currentUser.id).order("username"),
    supabaseClient.from("game_rooms")
      .select("id,host_name,invited_name,status,created_at,updated_at,host_id,invitee_id,guest_id,host_seen_at,game_state")
      .or(`host_id.eq.${currentUser.id},invitee_id.eq.${currentUser.id}`)
      .order("created_at", { ascending: false })
  ]);
  if (playersError) throw playersError;
  if (roomsError) throw roomsError;
  renderPlayerDirectory(players || []);
  const groupedRooms = new Map();
  for (const room of (rooms || []).filter(candidate => candidate.status !== "closed")) {
    const opponentId = room.host_id === currentUser.id ? room.invitee_id : room.host_id;
    const current = groupedRooms.get(opponentId);
    const candidateScore = Number(Boolean(room.game_state)) * 2 +
      Number(Boolean(room.host_seen_at && Date.now() - Date.parse(room.host_seen_at) < 90000));
    const currentScore = current
      ? Number(Boolean(current.game_state)) * 2 +
        Number(Boolean(current.host_seen_at && Date.now() - Date.parse(current.host_seen_at) < 90000))
      : -1;
    if (!current || candidateScore > currentScore ||
        candidateScore === currentScore && Date.parse(room.updated_at) > Date.parse(current.updated_at)) {
      groupedRooms.set(opponentId, room);
    }
  }
  renderRoomList([...groupedRooms.values()].sort((a, b) =>
    Date.parse(b.updated_at) - Date.parse(a.updated_at)));
}

function startRoomHeartbeat() {
  if (roomHeartbeatTimer) window.clearInterval(roomHeartbeatTimer);
  roomHeartbeatTimer = window.setInterval(async () => {
    if (!currentUser || !supabaseClient) return;
    try {
      const tasks = [
        supabaseClient.rpc("touch_profile")
      ];
      if (activeRoomId && gameMode === "host") {
        tasks.push(supabaseClient.rpc("touch_host_room", { p_room_id: activeRoomId }));
      }
      const results = await Promise.all(tasks);
      for (const result of results) {
        if (result.error) throw result.error;
      }
      await refreshOpponentPresence();
      await refreshRooms();
    } catch (error) {
      console.error("Could not refresh online presence and invitations.", error);
      setAccountStatus("Could not refresh your online status or invitations. Check your connection.", "error");
    }
  }, 20000);
}

async function refreshOpponentPresence() {
  if (!activeRoomId || !activeRoomOpponentId || !supabaseClient) return;
  const [{ data: opponent, error: playerError }, { data: room, error: roomError }] = await Promise.all([
    supabaseClient.from("profiles").select("last_seen_at").eq("id", activeRoomOpponentId).maybeSingle(),
    supabaseClient.from("game_rooms").select("updated_at,status").eq("id", activeRoomId).maybeSingle()
  ]);
  if (playerError) throw playerError;
  if (roomError) throw roomError;
  const online = Boolean(opponent && room && room.status !== "closed" &&
    Date.now() - Date.parse(opponent.last_seen_at) < 90000 &&
    Date.now() - Date.parse(room.updated_at) < 90000);
  if (online !== opponentIsOnline) {
    opponentIsOnline = online;
    render();
  }
}

async function activateAccount(user, requestedUsername = null) {
  currentUser = user;
  const { data: existing, error: profileError } = await supabaseClient.from("profiles")
    .select("id,username,last_seen_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (existing) {
    accountProfile = existing;
  } else {
    const username = requestedUsername || normalizeUsername(user.email.split("@")[0]);
    if (!username) throw new Error("The profile name could not be loaded. Contact the site owner.");
    const { data: created, error: createError } = await supabaseClient.from("profiles")
      .insert({ id: user.id, username })
      .select("id,username,last_seen_at")
      .single();
    if (createError) throw createError;
    accountProfile = created;
  }
  document.querySelector("#account-form").hidden = true;
  document.querySelector("#account-dashboard").hidden = false;
  document.querySelector("#account-username").value = accountProfile.username;
  document.querySelector("#account-password").value = "";
  document.querySelector("#signed-in-name").textContent = accountProfile.username;
  document.querySelector("#white-player-name").value = accountProfile.username;
  document.querySelector("#black-player-name").value = accountProfile.username;
  const { error: presenceError } = await supabaseClient.rpc("touch_profile");
  if (presenceError) throw presenceError;
  startRoomHeartbeat();
  await refreshRooms();
  if (directoryTimer) window.clearInterval(directoryTimer);
  directoryTimer = window.setInterval(() => {
    void refreshRooms().catch(error => {
      console.error("Could not refresh the player list.", error);
      setAccountStatus("Could not refresh players and invitations. Check your connection.", "error");
    });
  }, 15000);
  setAccountStatus(`You are signed in as ${accountProfile.username}.`, "connected");
}

async function initializeProfiles() {
  const config = window.RIFT_CHESS_CONFIG;
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey ||
      typeof window.supabase?.createClient !== "function") {
    document.querySelector("#account-form").hidden = true;
    setAccountStatus("Shared accounts are not configured yet. Follow SUPABASE_SETUP.md to connect the player service.", "error");
    return;
  }
  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setAccountStatus("Could not restore your profile session. Please reload and try again.", "error");
    return;
  }
  if (data.session) {
    try {
      await activateAccount(data.session.user);
    } catch (profileError) {
      console.error("Could not load the player profile.", profileError);
      setAccountStatus(profileError.message || "Could not load your profile. Check the Supabase setup.", "error");
    }
  } else {
    setAccountMode("login");
    setAccountStatus("Log in or create a player profile to see online players.", "waiting");
  }
}

document.querySelector("#account-mode-button").addEventListener("click", () => {
  const form = document.querySelector("#account-form");
  setAccountMode(form.dataset.mode === "signup" ? "login" : "signup");
});

document.querySelector("#account-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!supabaseClient) return;
  const username = normalizeUsername(document.querySelector("#account-username").value);
  const password = document.querySelector("#account-password").value;
  if (!username) {
    setAccountStatus("Use 3–20 letters, numbers, or underscores for your player name.", "error");
    return;
  }
  if (password.length < 8) {
    setAccountStatus("Choose a password with at least 8 characters.", "error");
    return;
  }
  const signup = event.currentTarget.dataset.mode === "signup";
  setAccountStatus(signup ? "Creating your profile…" : "Logging in…", "waiting");
  let result;
  try {
    result = signup
      ? await supabaseClient.auth.signUp({ email: usernameEmail(username), password })
      : await supabaseClient.auth.signInWithPassword({ email: usernameEmail(username), password });
  } catch (error) {
    console.error("Authentication request failed.", error);
    setAccountStatus("Could not reach the profile service. Check your internet connection and try again.", "error");
    return;
  }
  if (result.error) {
    const message = result.error.message || "Unknown authentication error.";
    const errorCode = result.error.code || "";
    const friendlyMessage = signup && ["email_exists", "user_already_exists"].includes(errorCode)
      ? "That username already has a profile. Log in instead, or choose another name."
      : signup && errorCode === "email_address_invalid"
        ? "Supabase rejected the username-based account address. Check the Email provider settings and share this error with the site owner."
        : signup && errorCode === "signup_disabled"
          ? "Supabase rejected sign-up. Confirm this dashboard is the project connected to the site, turn on “Allow new users to sign up,” and make sure Email sign-in is enabled under Authentication → Sign In / Providers → Email."
          : `${signup ? "Profile creation failed" : "Login failed"}: ${message}`;
    setAccountStatus(friendlyMessage, "error");
    return;
  }
  if (!result.data.session) {
    setAccountStatus("Supabase requires email confirmation. Disable email confirmations in the project settings and try again.", "error");
    return;
  }
  try {
    await activateAccount(result.data.user, username);
  } catch (error) {
    console.error("Could not finish setting up the player profile.", error);
    setAccountStatus(error.message || "Could not finish setting up your profile. Check the Supabase SQL setup.", "error");
  }
});

document.querySelector("#logout-button").addEventListener("click", async () => {
  const leftRoom = await stopOnlineRoom();
  if (roomHeartbeatTimer) window.clearInterval(roomHeartbeatTimer);
  roomHeartbeatTimer = null;
  if (directoryTimer) window.clearInterval(directoryTimer);
  directoryTimer = null;
  let presenceError = null;
  try {
    const result = await supabaseClient.rpc("mark_profile_offline");
    presenceError = result.error;
  } catch (error) {
    presenceError = error;
  }
  let signOutError = null;
  try {
    const result = await supabaseClient.auth.signOut();
    signOutError = result.error;
  } catch (error) {
    signOutError = error;
  }
  if (signOutError) {
    console.error("Could not sign out.", signOutError);
    setAccountStatus("Could not log out. Please try again.", "error");
    return;
  }
  currentUser = null;
  accountProfile = null;
  gameMode = "local";
  playerColor = "w";
  gameStarted = false;
  document.querySelector("#white-player-name").value = "White";
  document.querySelector("#black-player-name").value = "Black";
  lobby = { w: readProfile("w"), b: readProfile("b") };
  state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  document.querySelector("#setup-card").hidden = false;
  document.querySelector("#account-dashboard").hidden = true;
  document.querySelector("#account-form").hidden = false;
  if (presenceError) console.error("Could not mark the profile offline.", presenceError);
  setAccountStatus(presenceError
    ? "You are logged out. Your profile may show online for up to 90 seconds."
    : !leftRoom
      ? "You are logged out, but room presence may take up to 90 seconds to expire."
      : "You are logged out.", "waiting");
  renderPlayerDirectory([]);
  document.querySelector("#room-list").innerHTML = '<p class="empty-rifts">Sign in to see your rooms.</p>';
  render();
});

document.querySelector("#player-directory").addEventListener("click", event => {
  const button = event.target.closest(".directory-invite");
  if (!button || button.disabled) return;
  document.querySelector("#challenge-username").value = button.dataset.username;
  void createNamedRoom().catch(error => {
    console.error("Could not create the private room.", error);
    setRoomStatus("Could not create this room. Please try again.", "error");
  });
});

document.querySelector("#room-list").addEventListener("click", event => {
  const button = event.target.closest(".join-room-button");
  if (!button) return;
  const action = button.dataset.action;
  const handler = action === "open" ? openNamedRoom : joinNamedRoom;
  if (action) void handler(button.dataset.roomId).catch(error => {
    console.error("Could not join the private room.", error);
    setRoomStatus("Could not open this room. Check your connection and try again.", "error");
  });
});

document.querySelector("#challenge-username").addEventListener("keydown", event => {
  if (event.key === "Enter") {
    event.preventDefault();
    void createNamedRoom().catch(error => {
      console.error("Could not create the private room.", error);
      setRoomStatus("Could not create this room. Please try again.", "error");
    });
  }
});

window.addEventListener("beforeunload", () => {
  if (activeRoomId && supabaseClient && currentUser) {
    void supabaseClient.rpc("leave_game_room", { p_room_id: activeRoomId });
  }
});

document.querySelector("#leave-room-button").addEventListener("click", async () => {
  const leftRoom = await stopOnlineRoom();
  gameStarted = false;
  state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  document.querySelector("#setup-card").hidden = false;
  document.querySelector("#leave-room-button").hidden = true;
  render();
  if (currentUser) void refreshRooms().catch(error => {
    console.error("Could not refresh the room list after leaving.", error);
    setRoomStatus("You left the room, but could not refresh the room list.", "error");
  });
  if (leftRoom) setRoomStatus("You left the room. It remains in Your rooms so you can return later.", "waiting");
});

function isHostedSecurely() {
  return window.location.protocol === "https:" ||
    (window.location.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname));
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

class RoomTransport {
  constructor(roomId, cursor = 0) {
    this.roomId = roomId;
    this.cursor = Number(cursor) || 0;
    this.open = true;
    this.closed = false;
    this.polling = false;
    this.lastErrorAt = 0;
    this.listeners = new Map();
    this.sendQueue = Promise.resolve();
    this.pollTimer = window.setInterval(() => {
      void this.poll();
    }, 750);
    queueMicrotask(() => this.emit("open"));
  }

  on(event, listener) {
    const listeners = this.listeners.get(event) || [];
    listeners.push(listener);
    this.listeners.set(event, listeners);
    return this;
  }

  emit(event, ...args) {
    for (const listener of this.listeners.get(event) || []) listener(...args);
  }

  send(payload) {
    this.sendQueue = this.sendQueue.then(async () => {
      if (this.closed) return;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { error } = await supabaseClient.rpc("send_room_message", {
          p_room_id: this.roomId,
          p_payload: payload
        });
        if (!error) return;
        if (attempt === 2) throw error;
        await new Promise(resolve => window.setTimeout(resolve, 500 * (attempt + 1)));
      }
    }).catch(error => {
      console.error("Could not send a room message.", error);
      this.emit("error", error);
    });
  }

  async poll() {
    if (this.closed || this.polling || !currentUser) return;
    this.polling = true;
    try {
      const { data: messages, error } = await supabaseClient.from("game_messages")
        .select("sequence,sender_id,payload")
        .eq("room_id", this.roomId)
        .gt("sequence", this.cursor)
        .order("sequence", { ascending: true })
        .limit(100);
      if (error) throw error;
      const recovered = this.lastErrorAt > 0;
      this.lastErrorAt = 0;
      if (recovered) this.emit("reconnected");
      for (const message of messages || []) {
        this.cursor = Number(message.sequence);
        for (const listener of this.listeners.get("data") || []) {
          await listener(message.payload, message.sender_id);
        }
      }
    } catch (error) {
      if (Date.now() - this.lastErrorAt > 5000) {
        this.lastErrorAt = Date.now();
        console.error("Could not synchronize the room.", error);
        this.emit("error", error);
      }
    } finally {
      this.polling = false;
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.open = false;
    window.clearInterval(this.pollTimer);
    this.emit("close");
  }
}

async function receiveRoomData(connection, message, senderId) {
  if (!message || typeof message !== "object") return;
  if (gameMode === "host") {
    if (!connection.roomAuthenticated) {
      if (message.type !== "join" || message.roomId !== activeRoomId ||
          typeof message.userId !== "string" || message.userId !== senderId ||
          !validProfile(message.profile)) {
        return;
      }
      const { data: room, error } = await supabaseClient.from("game_rooms")
        .select("invitee_id,guest_id,status")
        .eq("id", activeRoomId)
        .eq("host_id", currentUser.id)
        .maybeSingle();
      if (error || !room || room.invitee_id !== message.userId ||
          room.guest_id !== message.userId || !["connecting", "playing"].includes(room.status)) {
        if (error) setRoomStatus("Could not verify the room invitation. Retrying sync…", "error");
        return;
      }
      const { data: invitedPlayer, error: playerError } = await supabaseClient.from("profiles")
        .select("username")
        .eq("id", message.userId)
        .maybeSingle();
      if (playerError || !invitedPlayer || invitedPlayer.username !== message.profile.name) {
        if (playerError) setRoomStatus("Could not verify the player profile. Retrying sync…", "error");
        return;
      }
      connection.roomAuthenticated = true;
      connection.remoteUserId = message.userId;
      activeRoomOpponentId = message.userId;
      opponentIsOnline = true;
      lobby.b = { ...message.profile, ready: false, name: invitedPlayer.username };
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
    if (senderId !== connection.remoteUserId) return;
    if (message.type === "join") {
      if (gameStarted) connection.send({ type: "start", state: roomSnapshot() });
      else sendLobby();
      return;
    }
    if (message.type === "setup" && message.player === "b" && validProfile(message.profile) &&
        message.profile.name === lobby.b.name && !gameStarted) {
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

  if (gameMode === "guest" && senderId !== connection.remoteUserId) return;
  if (gameMode === "guest" && message.type === "lobby" && !gameStarted &&
      message.players && validProfile(message.players.w) && validProfile(message.players.b)) {
    connection.roomAuthenticated = true;
    opponentIsOnline = true;
    if (joinRetryTimer) window.clearInterval(joinRetryTimer);
    joinRetryTimer = null;
    lobby.w = { ...message.players.w };
    if (!lobby.b.ready) lobby.b = { ...message.players.b, ready: false };
    setProfileInputs("w", lobby.w);
    render();
    setRoomStatus(`${lobby.w.name} is hosting as White. Choose your Black loadout and ready up.`, "connected");
    return;
  }

  if (gameMode === "guest" && message.type === "start" && validRemoteState(message.state) &&
      (!state || message.state.history.length >= state.history.length)) {
    connection.roomAuthenticated = true;
    opponentIsOnline = true;
    if (joinRetryTimer) window.clearInterval(joinRetryTimer);
    joinRetryTimer = null;
    state = {
      ...message.state,
      selected: null,
      legalMoves: []
    };
    gameStarted = true;
    document.querySelector("#setup-card").hidden = true;
    lobby.w = { ...lobby.w, name: state.players.w.name, ready: true };
    lobby.b = { ...lobby.b, name: state.players.b.name, ready: true };
    remoteMovePending = false;
    updateGameStatus();
    render();
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
      const sendJoin = () => connection.send({
        type: "join",
        roomId: activeRoomId,
        userId: currentUser.id,
        profile: readProfile("b")
      });
      sendJoin();
      if (joinRetryTimer) window.clearInterval(joinRetryTimer);
      joinRetryTimer = window.setInterval(() => {
        if (connection.roomAuthenticated || connection !== dataConnection || gameMode !== "guest") {
          window.clearInterval(joinRetryTimer);
          joinRetryTimer = null;
          return;
        }
        sendJoin();
      }, 3000);
      setRoomStatus("Room found. Checking your invitation...", "waiting");
    }
    if (role === "host" && connection.roomAuthenticated) sendRoomState();
    render();
  });
  connection.on("data", (message, senderId) => {
    return receiveRoomData(connection, message, senderId).catch(error => {
      console.error("Could not process room message.", error);
      setRoomStatus("There was a problem checking the room invitation.", "error");
    });
  });
  connection.on("close", () => {
    if (joinRetryTimer) window.clearInterval(joinRetryTimer);
    joinRetryTimer = null;
    if (dataConnection === connection) dataConnection = null;
    if ((role === "host" && gameMode !== "host") || (role === "guest" && gameMode !== "guest")) return;
    if (role === "host") {
      if (activeRoomId) {
        void supabaseClient.from("game_rooms")
          .update({ guest_id: null, status: "waiting", updated_at: new Date().toISOString() })
          .eq("id", activeRoomId)
          .eq("host_id", currentUser.id);
      }
      if (!gameStarted) {
        lobby.b = defaultProfile("Black");
        setProfileInputs("b", lobby.b);
        render();
      }
      setRoomStatus(connection.roomAuthenticated
        ? `${lobby.b.name} disconnected. They can rejoin from their account.`
        : "Waiting for the invited player to join.", "waiting");
    } else {
      remoteMovePending = false;
      if (activeRoomId) void supabaseClient.rpc("leave_game_room", { p_room_id: activeRoomId });
      setRoomStatus("Connection to the host was lost. Ask them to reopen the room.", "error");
      render();
    }
  });
  connection.on("error", () => {
    if (role === "guest") {
      remoteMovePending = false;
      render();
    }
    setRoomStatus("Room sync was interrupted. The game will retry; check your internet connection.", "error");
  });
  connection.on("reconnected", () => {
    setRoomStatus("Room connection restored.", "connected");
  });
}

async function createNamedRoom() {
  const requestedName = document.querySelector("#challenge-username").value.trim();
  const normalizedName = normalizeUsername(requestedName);
  if (!normalizedName || !currentUser || !accountProfile) {
    setRoomStatus("Log in and enter the exact username of the player you want to invite.", "error");
    return;
  }
  if (normalizedName === accountProfile.username.toLowerCase()) {
    setRoomStatus("Choose another player; you cannot invite your own profile.", "error");
    return;
  }
  if (!isHostedSecurely()) {
    setRoomStatus("Online play requires the published HTTPS website.", "error");
    return;
  }
  const { data: invitee, error: playerError } = await supabaseClient.from("profiles")
    .select("id,username,last_seen_at")
    .ilike("username", normalizedName)
    .maybeSingle();
  if (playerError) {
    setRoomStatus("Could not find that player. Please try again.", "error");
    return;
  }
  if (!invitee) {
    setRoomStatus("No profile has that username. Check the spelling and try again.", "error");
    return;
  }
  setRoomStatus(`Creating or finding your room with ${invitee.username}…`, "waiting");
  const { data: room, error: roomError } = await supabaseClient.rpc("create_or_get_game_room", {
    p_invitee_id: invitee.id
  });
  if (roomError || !room) {
    if (roomError) console.error("Could not create or find the private room.", roomError);
    setRoomStatus("Could not save this room. Apply the room-persistence SQL migration and try again.", "error");
    return;
  }
  document.querySelector("#challenge-username").value = "";
  try {
    await refreshRooms();
    setRoomStatus(`Your room with ${invitee.username} is ready. Find it in Your rooms to open or join.`, "connected");
  } catch (error) {
    console.error("Could not refresh the player list after creating a room.", error);
    setRoomStatus("Room created, but the room list could not refresh. Reload to see it.", "error");
  }
}

async function openNamedRoom(roomId) {
  if (!isHostedSecurely() || !currentUser || gameMode === "host" && activeRoomId === roomId) {
    setRoomStatus("Log in on the published HTTPS website before opening a room.", "error");
    return;
  }
  if (activeRoomId) await stopOnlineRoom();
  const { data: openResult, error: openError } = await supabaseClient.rpc("open_game_room", {
    p_room_id: roomId
  });
  const room = openResult && openResult.room;
  if (openError || !room) {
    if (openError) console.error("Could not open the private room.", openError);
    setRoomStatus("Could not open this room. Check the room-persistence SQL migration and try again.", "error");
    await refreshRooms();
    return;
  }
  activeRoomId = room.id;
  activeRoomOpponentId = room.invitee_id;
  opponentIsOnline = false;
  gameMode = "host";
  playerColor = "w";
  remoteMovePending = false;
  const savedState = openResult.game_state;
  if (savedState && !validRemoteState(savedState)) {
    await stopOnlineRoom();
    throw new Error("The saved game state is invalid.");
  }
  lobby = {
    w: { ...readProfile("w"), name: room.host_name, ready: Boolean(savedState) },
    b: { ...defaultProfile(room.invited_name), ready: Boolean(savedState) }
  };
  if (savedState) {
    state = { ...savedState, selected: null, legalMoves: [] };
    lobby.w.name = savedState.players.w.name;
    lobby.b.name = savedState.players.b.name;
    gameStarted = true;
  } else {
    state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
    gameStarted = false;
  }
  document.querySelector("#white-player-name").value = lobby.w.name;
  setProfileInputs("b", lobby.b);
  document.querySelector("#setup-card").hidden = gameStarted;
  document.querySelector("#leave-room-button").hidden = false;
  if (gameStarted) updateGameStatus();
  render();
  renderLobby();
  dataConnection = new RoomTransport(room.id, openResult.cursor);
  watchConnection(dataConnection, "host");
  setRoomStatus(gameStarted
    ? `Reopened your saved game with ${room.invited_name}. Waiting for them to rejoin.`
    : `Room opened for ${room.invited_name}. Set your pieces and wait for them to join.`, "waiting");
  await refreshRooms();
}

async function joinNamedRoom(roomId) {
  if (!isHostedSecurely() || !currentUser) {
    setRoomStatus("Log in on the published HTTPS website before joining a room.", "error");
    return;
  }
  if (activeRoomId) await stopOnlineRoom();
  const { data: joinResult, error: joinError } = await supabaseClient.rpc("join_game_room", { p_room_id: roomId });
  const room = joinResult && joinResult.room;
  if (joinError || !room) {
    if (joinError) console.error("Could not join the room.", joinError);
    setRoomStatus("Could not join. The host may be offline, or the database migration may not be applied.", "error");
    await refreshRooms();
    return;
  }
  activeRoomId = room.id;
  activeRoomOpponentId = room.host_id;
  opponentIsOnline = false;
  gameMode = "guest";
  playerColor = "b";
  remoteMovePending = false;
  const savedState = joinResult.game_state;
  if (savedState && !validRemoteState(savedState)) {
    await supabaseClient.rpc("leave_game_room", { p_room_id: room.id });
    throw new Error("The saved game state is invalid.");
  }
  gameStarted = Boolean(savedState);
  lobby = {
    w: defaultProfile(room.host_name),
    b: readProfile("b")
  };
  lobby.b.name = accountProfile.username;
  document.querySelector("#black-player-name").value = accountProfile.username;
  state = savedState
    ? { ...savedState, selected: null, legalMoves: [] }
    : freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
  document.querySelector("#setup-card").hidden = gameStarted;
  document.querySelector("#leave-room-button").hidden = false;
  if (gameStarted) updateGameStatus();
  render();
  renderLobby();
  setRoomStatus(`${savedState ? "Rejoining saved game with" : "Joining"} ${room.host_name}…`, "waiting");
  dataConnection = new RoomTransport(room.id, joinResult.cursor);
  dataConnection.remoteUserId = room.host_id;
  watchConnection(dataConnection, "guest");
}

async function stopOnlineRoom() {
  const connection = dataConnection;
  const oldRoomId = activeRoomId;
  if (joinRetryTimer) window.clearInterval(joinRetryTimer);
  joinRetryTimer = null;
  dataConnection = null;
  activeRoomId = null;
  gameMode = "local";
  playerColor = "w";
  remoteMovePending = false;
  if (connection) connection.close();
  let leftRoom = true;
  if (oldRoomId && supabaseClient && currentUser) {
    try {
      const { error } = await supabaseClient.rpc("leave_game_room", { p_room_id: oldRoomId });
      if (error) throw error;
    } catch (error) {
      leftRoom = false;
      console.error("Could not leave the private room cleanly.", error);
      setRoomStatus("You left this browser session, but the room could not update your presence.", "error");
    }
  }
  activeRoomOpponentId = null;
  opponentIsOnline = false;
  document.querySelector("#leave-room-button").hidden = true;
  return leftRoom;
}

document.querySelector("#create-room-button").addEventListener("click", () => {
  void createNamedRoom().catch(error => {
    console.error("Could not create the private room.", error);
    setRoomStatus("Could not create this room. Please try again.", "error");
  });
});

for (const color of ["w", "b"]) {
  for (const side of ["left", "right"]) updatePowerOptions(color, side);
}
lobby = { w: readProfile("w"), b: readProfile("b") };
state = freshState({ w: lobby.w.options, b: lobby.b.options }, currentPlayers());
render();
const invite = new URL(window.location.href);
if (invite.searchParams.has("room")) {
  setRoomStatus("Room links from the older version are no longer supported. Log in and ask the host to invite your profile.", "error");
}
void initializeProfiles().catch(error => {
  console.error("Could not initialize player profiles.", error);
  setRoomStatus("Could not connect to the player service. Check the Supabase setup and reload.", "error");
});

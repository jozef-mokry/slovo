let currIdx = 0;
let cells;
let currWord = "";
let winWordIdx;
let gameEnded = false;
function init() {
  cells = document.querySelectorAll('.cell');
  winWordIdx = getWinWordIdx();

  // setup keyboard
  document.addEventListener('keyup', (e) => onKeyPress(e.key))
  const keys = document.querySelectorAll('.key > div');
  for(const key of keys) {
    key.addEventListener('click', (e) => {
      const letter = e.target.innerText;
      if (letter === "DEL") onKeyPress('Backspace');
      else if (letter === "ENTER") onKeyPress('Enter');
      else onKeyPress(letter.toLowerCase());
    });
  }

  document.getElementById('copyGame').addEventListener('click', (e) => {
    const winWordAscii = wordPairs[winWordIdx][1];
    const gameColors = getStoredGame().map(guess => getColours(guess, winWordAscii).join(""));
    navigator.clipboard.writeText(`Slovo\n${gameColors.join("\n")}`).then(() => {
      e.target.innerText = "Skopírované!";
      setTimeout(() => e.target.innerText = "Skopírovať", 2000);
    }).catch(() => {
      e.target.innerText = "Nedá sa";
      setTimeout(() => e.target.innerText = "Skopírovať", 2000);
    });
  });


  restoreGame();
}

function onKeyPress(letter) {
  if (gameEnded) {
    return;
  }
  if (letter == 'Enter' && currWord.length === 5) {
    if (!isWord(currWord)) {
      return;
    }
    addWord(currWord, currIdx, true);
    storeWordToLocalStorage(currWord);
    cells[currIdx-1].parentElement.classList.remove('nonexistent');
    cells[currIdx-1].parentElement.classList.remove('existent');

    if (currWord === wordPairs[winWordIdx][1]) {
      gameEnded = true;
      cells[currIdx-1].addEventListener('transitionend', onWin);
    } else if (currIdx === cells.length) {
      gameEnded = true;
      cells[currIdx-1].addEventListener('transitionend', onLose);
    } else {
      currWord = "";
      cells[currIdx].classList.add('cursor');
    }
  } else if (letter === 'Backspace' && currWord.length > 0) {
    if (currIdx < cells.length) {
      cells[currIdx].classList.remove('cursor')
    }
    currIdx -= 1;
    cells[currIdx].innerText = '';
    cells[currIdx].classList.add('cursor')
    cells[currIdx].parentElement.classList.remove('nonexistent');
    cells[currIdx].parentElement.classList.remove('existent');
    currWord = currWord.slice(0, -1);
  } else if ('a' <= letter && letter <= 'z' && currWord.length < 5) {
    cells[currIdx].classList.remove('cursor')
    cells[currIdx].innerText = letter;
    currWord += letter;
    currIdx += 1;

    if (currWord.length < 5) {
      cells[currIdx].classList.add('cursor')
    } else {
      cells[currIdx-1].parentElement.classList.add(
        isWord(currWord) ? 'existent' : 'nonexistent');
    }
  }
}

function isWord(word) {
  return wordPairs.some(([_, ascii]) => ascii === word);
}

function addWord(word, currIdx, slowly) {
  const [winWord, winWordAscii] = wordPairs[winWordIdx];
  const colours = getColours(word, winWordAscii);
  const changeKeyColors = [];

  for(let i = 0; i < word.length; i++) {
    const cell = cells[currIdx - word.length + i];
    cell.innerText = word[i];
    if (slowly) {
      cell.classList.add('animated');
    }
    if (colours[i] === GREEN) {
      cell.classList.add('good', 'position');
      const fn = () => cell.innerText = winWord[i];
      if (slowly) {
        cell.addEventListener('transitionstart', fn);
      } else {
        fn();
      }
      changeKeyColors.push(()=> getKeyboardKey(word[i]).classList.add("good", "position"));

    } else if (colours[i] === ORANGE) {
      cell.classList.add('good');
      changeKeyColors.push(()=> getKeyboardKey(word[i]).classList.add("good"));
    } else {
      cell.classList.add('bad');
      changeKeyColors.push(() => getKeyboardKey(word[i]).classList.add('bad'));
    }
  }

  // update keyboard keys
  if (slowly) {
    cells[currIdx-1].addEventListener('transitionend', () => changeKeyColors.forEach(fn => fn()));
  } else {
    changeKeyColors.forEach(fn => fn());
  }
}

const GREEN = "🟩";
const ORANGE = "🟨";
const GRAY = "⬛";
function getColours(word, winWordAscii) {
  const winLetters = new Map();
  for(let i = 0; i < winWordAscii.length; i++) {
    if (word[i] === winWordAscii[i]) {
      continue;
    }
    const count = winLetters.get(winWordAscii[i]);
    if (count === undefined) {
      winLetters.set(winWordAscii[i], 1);
    } else {
      winLetters.set(winWordAscii[i], count + 1);
    }
  }

  const colours = [];
  for(let i = 0; i < word.length; i++) {
    if (word[i] === winWordAscii[i]) {
      colours.push(GREEN);
    } else if (winLetters.get(word[i]) > 0) {
      colours.push(ORANGE);
      const count = winLetters.get(word[i]);
      winLetters.set(word[i], count - 1);
    } else {
      colours.push(GRAY);
    }
  }
  return colours;
}

function storeWordToLocalStorage(word) {
  const key = getDateKey();
  const guesses = JSON.parse(localStorage.getItem(key));
  guesses.push(word);
  localStorage.setItem(key, JSON.stringify(guesses));
}

function getKeyboardKey(letter) {
  return Array.from(document.querySelectorAll(".key > div")).find(e => e.innerHTML === letter);
}

function onWin() {
  const dialog = document.getElementById("endDialog");
  const game = document.getElementById("game");
  const winWordElement = document.getElementById("winWord");
  winWordElement.innerText = wordPairs[winWordIdx][0];
  dialog.showModal();
  const guesses = getStoredGame();
  const winWordAscii = wordPairs[winWordIdx][1];
  for(const guess of guesses) {
    const colours = getColours(guess, winWordAscii);
    game.innerHTML += `<p>${colours.join("")}</p>`;
  }
}

function getWinWordIdx() {
  return ((hash(getDateKey()) % wordPairs.length) + wordPairs.length) % wordPairs.length
}

function onLose() {
  onWin();
}

let _dateKey = null;
function getDateKey() {
  if (_dateKey !== null) return _dateKey;
  const d = new Date();
  return _dateKey = `${d.getDate()}-${d.getYear() + 1900}-${d.getMonth()+1}`;
}

function hash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function restoreGame() {
  const guesses = getStoredGame();
  if (guesses.length === 6 || guesses[guesses.length - 1] === wordPairs[winWordIdx][1]) {
    gameEnded = true;
    document.body.classList.add("gameEnded");
    onWin();
  }

  for(const guess of guesses) {
    currIdx += guess.length;
    addWord(guess, currIdx, false);
  }

  if (!gameEnded) {
    cells[currIdx].classList.add('cursor');
  }
}

function getStoredGame() {
  const key = getDateKey();
  let guesses = localStorage.getItem(key);
  if (guesses === null) {
    guesses = JSON.stringify([]);
    localStorage.setItem(key, guesses);
  }
  return JSON.parse(guesses);
}


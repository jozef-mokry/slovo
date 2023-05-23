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
    addWord(currWord, currIdx);
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
    cells[currIdx].classList.remove('cursor')
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

function addWord(word, currIdx) {
  const [winWord, winWordAscii] = wordPairs[winWordIdx];
  const winLetters = new Map();
  for(let i = 0; i < winWord.length; i++) {
    const count = winLetters.get(winWordAscii[i]);
    if (count === undefined) {
      winLetters.set(winWordAscii[i], 1);
    } else {
      winLetters.set(winWordAscii[i], count + 1);
    }
  }

  for(let i = 0; i < word.length; i++) {
    if (word[i] === winWordAscii[i]) {
      const count = winLetters.get(word[i]);
      winLetters.set(word[i], count - 1);
    }
  }
  for(let i = 0; i < word.length; i++) {
    const cell = cells[currIdx - word.length + i];
    if (word[i] === winWordAscii[i]) {
      cell.classList.add('good');
      cell.classList.add('position');
      cell.innerText = winWord[i];
      getKeyboardKey(word[i]).classList.add("good");
      getKeyboardKey(word[i]).classList.add("position");
    } else if (winLetters.get(word[i]) > 0) {
      const count = winLetters.get(word[i]);
      winLetters.set(word[i], count - 1);
      cell.classList.add('good');
      cell.innerText = word[i];
      getKeyboardKey(word[i]).classList.add("good");
    } else {
      cell.innerText = word[i];
      cell.classList.add('bad');
      const key = getKeyboardKey(word[i]);
      if (!key.classList.contains("good")) {
        key.classList.add('bad');
      }
    }
  }
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
  alert(`Congrats, you solved it in ${currIdx / 5} guesses`);
}

function getWinWordIdx() {
  return ((hash(getDateKey()) % wordPairs.length) + wordPairs.length) % wordPairs.length
}

function onLose() {
  alert(`Sorry, the word was: ${wordPairs[winWordIdx][0]}`);
}

function getDateKey() {
  const d = new Date();
  return `${d.getDate()}-${d.getYear() + 1900}-${d.getMonth()+1}`;
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
  const key = getDateKey();
  let guesses = localStorage.getItem(key);
  if (guesses === null) {
    guesses = JSON.stringify([]);
    localStorage.setItem(key, guesses);
  }
  guesses = JSON.parse(guesses);
  for(const guess of guesses) {
    currIdx += guess.length;
    addWord(guess, currIdx);
  }
  if (currIdx === cells.length || guesses[guesses.length - 1] === wordPairs[winWordIdx][1]) {
    gameEnded = true;
  } else {
    cells[currIdx].classList.add('cursor');
  }
}

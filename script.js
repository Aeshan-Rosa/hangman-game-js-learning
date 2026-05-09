const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const maxWrongGuesses = 6;
const hangmanPartIds = [
  "part-head",
  "part-body",
  "part-left-arm",
  "part-right-arm",
  "part-left-leg",
  "part-right-leg",
];

const setupForm = document.getElementById("setup-form");
const secretWordInput = document.getElementById("secret-word");
const newRoundButton = document.getElementById("new-round-btn");
const resetRoundButton = document.getElementById("reset-round-btn");
const roundTitle = document.getElementById("round-title");
const wordDisplay = document.getElementById("word-display");
const hintPills = document.getElementById("hint-pills");
const hintOutput = document.getElementById("hint-output");
const wrongCount = document.getElementById("wrong-count");
const message = document.getElementById("message");
const keyboard = document.getElementById("keyboard");

const state = {
  answer: "",
  normalizedAnswer: "",
  guesses: new Set(),
  wrongGuesses: 0,
  hints: ["", "", ""],
  activeHint: -1,
  roundActive: false,
};

function normalizeAnswer(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-zA-Z\s'-]/g, "")
    .toUpperCase();
}

function buildKeyboard() {
  keyboard.innerHTML = "";

  alphabet.forEach((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "key-btn";
    button.textContent = letter;
    button.dataset.letter = letter;
    button.disabled = true;
    button.addEventListener("click", () => handleGuess(letter));
    keyboard.appendChild(button);
  });
}

function updateWordDisplay() {
  if (!state.roundActive) {
    wordDisplay.innerHTML = '<span class="hint-output">Your word will appear here.</span>';
    return;
  }

  wordDisplay.innerHTML = "";

  [...state.normalizedAnswer].forEach((character) => {
    const slot = document.createElement("span");

    if (character === " ") {
      slot.className = "space-slot";
      slot.innerHTML = "&nbsp;";
    } else if (character === "'" || character === "-") {
      slot.className = "letter-slot";
      slot.textContent = character;
    } else {
      slot.className = "letter-slot";
      slot.textContent = state.guesses.has(character) ? character : "";
    }

    wordDisplay.appendChild(slot);
  });
}

function updateHangmanDrawing() {
  hangmanPartIds.forEach((id, index) => {
    const part = document.getElementById(id);
    part.classList.toggle("visible", index < state.wrongGuesses);
  });
}

function updateKeyboard() {
  const buttons = keyboard.querySelectorAll(".key-btn");

  buttons.forEach((button) => {
    const letter = button.dataset.letter;
    const guessed = state.guesses.has(letter);
    const inAnswer = state.normalizedAnswer.includes(letter);

    button.disabled = !state.roundActive || guessed;
    button.classList.remove("correct", "wrong");

    if (guessed) {
      button.classList.add(inAnswer ? "correct" : "wrong");
    }
  });
}

function updateHintPills() {
  hintPills.innerHTML = "";

  state.hints.forEach((hint, index) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "hint-pill";
    pill.textContent = `Hint ${index + 1}`;
    pill.disabled = !state.roundActive;

    if (state.activeHint === index) {
      pill.classList.add("is-active");
    }

    pill.addEventListener("click", () => {
      state.activeHint = index;
      const content = hint.trim() || `No text was added for Hint ${index + 1}.`;
      hintOutput.textContent = `Hint ${index + 1}: ${content}`;
      updateHintPills();
    });

    hintPills.appendChild(pill);
  });
}

function getUniqueLetters() {
  return [...new Set(state.normalizedAnswer.replace(/[^A-Z]/g, "").split(""))];
}

function isWin() {
  return getUniqueLetters().every((letter) => state.guesses.has(letter));
}

function revealAnswer() {
  getUniqueLetters().forEach((letter) => state.guesses.add(letter));
  updateWordDisplay();
  updateKeyboard();
}

function finishRound(didWin) {
  state.roundActive = false;
  updateKeyboard();

  if (didWin) {
    roundTitle.textContent = "Nice! The word was guessed.";
    message.textContent = "The player won this round.";
    return;
  }

  revealAnswer();
  roundTitle.textContent = "Round over!";
  message.textContent = `Out of guesses. The answer was ${state.normalizedAnswer}.`;
}

function handleGuess(letter) {
  if (!state.roundActive || state.guesses.has(letter)) {
    return;
  }

  state.guesses.add(letter);

  if (!state.normalizedAnswer.includes(letter)) {
    state.wrongGuesses += 1;
  }

  wrongCount.textContent = String(state.wrongGuesses);
  updateWordDisplay();
  updateHangmanDrawing();
  updateKeyboard();

  if (isWin()) {
    finishRound(true);
  } else if (state.wrongGuesses >= maxWrongGuesses) {
    finishRound(false);
  } else {
    message.textContent = state.normalizedAnswer.includes(letter)
      ? `Nice guess! ${letter} is in the word.`
      : `Nope, there is no ${letter}.`;
  }
}

function clearRoundState() {
  state.answer = "";
  state.normalizedAnswer = "";
  state.guesses = new Set();
  state.wrongGuesses = 0;
  state.hints = ["", "", ""];
  state.activeHint = -1;
  state.roundActive = false;

  setupForm.reset();
  roundTitle.textContent = "Ready for a new round?";
  hintOutput.textContent = "Click a hint pill when the player wants a clue.";
  wrongCount.textContent = "0";
  message.textContent = "Set a word to begin playing.";

  updateWordDisplay();
  updateHangmanDrawing();
  updateKeyboard();
  updateHintPills();
  secretWordInput.focus();
}

function startRound(formData) {
  const normalizedAnswer = normalizeAnswer(formData.get("secretWord") || "");

  if (!normalizedAnswer.replace(/[^A-Z]/g, "")) {
    message.textContent = "Please enter a word or phrase using letters.";
    secretWordInput.focus();
    return;
  }

  state.answer = formData.get("secretWord") || "";
  state.normalizedAnswer = normalizedAnswer;
  state.guesses = new Set();
  state.wrongGuesses = 0;
  state.hints = [
    formData.get("hint1") || "",
    formData.get("hint2") || "",
    formData.get("hint3") || "",
  ];
  state.activeHint = -1;
  state.roundActive = true;

  roundTitle.textContent = `${normalizedAnswer.replace(/[^A-Z]/g, "").length}-letter challenge`;
  hintOutput.textContent = "Click a hint pill when the player wants a clue.";
  wrongCount.textContent = "0";
  message.textContent = "Round started. Let the guessing begin!";

  updateWordDisplay();
  updateHangmanDrawing();
  updateKeyboard();
  updateHintPills();
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(setupForm);
  startRound(formData);
});

newRoundButton.addEventListener("click", clearRoundState);
resetRoundButton.addEventListener("click", clearRoundState);

document.addEventListener("keydown", (event) => {
  const letter = event.key.toUpperCase();

  if (alphabet.includes(letter) && state.roundActive) {
    handleGuess(letter);
  }
});

buildKeyboard();
updateWordDisplay();
updateHangmanDrawing();
updateKeyboard();
updateHintPills();

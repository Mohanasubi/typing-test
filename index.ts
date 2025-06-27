// DOM Elements
const quoteDisplay = document.getElementById("quoteDisplay") as HTMLElement;
const quoteInput = document.getElementById("quoteInput") as HTMLInputElement;
const timer = document.querySelector("#timeDisplay") as HTMLSpanElement;
const retryBtn = document.getElementById("retryBtn") as HTMLButtonElement;

const popup = document.getElementById("resultPopup") as HTMLElement;
const popupTime = document.getElementById("popupTime") as HTMLSpanElement;
const popupWpm = document.getElementById("popupWpm") as HTMLSpanElement;
const popupAccuracy = document.getElementById("popupAccuracy") as HTMLSpanElement;
const closePopupBtn = document.getElementById("closePopupBtn") as HTMLButtonElement;
const leaderboardElement = document.getElementById("leaderboard") as HTMLElement;


const wpmElement = document.createElement("span");
const accuracyElement = document.createElement("span");

let quote = "";
let countdownInterval: number;
let timeLeft = 30;
let timerStarted = false;
let startTime: number = 0;

let charStatus: ("pending" | "correct" | "wrong")[] = [];
let characterTyped = 0;
let totalErrors = 0;


document.addEventListener("DOMContentLoaded", () => {
  fetchQuote();
  updateTimerDisplay(30); 
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    restartTest();
  }
});

quoteInput.addEventListener("input", processCurrentText);
closePopupBtn.addEventListener("click", () => {
  closePopup();
  restartTest();
});

displayLeaderboard();


async function fetchQuote() {
  try {
    const res = await fetch("https://dummyjson.com/quotes");
    const data = await res.json();
    const quotes = data.quotes;
    const randomIndex = Math.floor(Math.random() * quotes.length);
    quote = quotes[randomIndex].quote;
    renderQuote();
  } catch (error) {
    quote = "Stay focused and keep typing.";
    renderQuote();
  }
}

function renderQuote() {
  quoteDisplay.innerHTML = "";
  charStatus = [];

  quote.split("").forEach((char) => {
    const span = document.createElement("span");
    span.innerText = char;
    span.classList.add("char");
    quoteDisplay.appendChild(span);
    charStatus.push("pending");
  });
}


function processCurrentText() {
  if (!timerStarted) {
    startCountdown();
    startTime = Date.now();
    timerStarted = true;
  }
  retryBtn.style.display = "inline-block";

  const typed = quoteInput.value.split("");
  const quoteSpans = quoteDisplay.querySelectorAll("span");

  let errors = 0;
  characterTyped++;

   quoteSpans.forEach(span => span.classList.remove("cursor"));

  for (let i = 0; i < quoteSpans.length; i++) {
    const char = typed[i];
    const expected = quoteSpans[i].innerText;

    if (char == null) {
      quoteSpans[i].classList.remove("correct", "incorrect");
      quoteSpans[i].style.color = "black";
      charStatus[i] = "pending";
    } else if (char === expected && charStatus[i] !== "wrong") {
      quoteSpans[i].classList.add("correct");
      quoteSpans[i].classList.remove("incorrect");
      quoteSpans[i].style.color = "green";
      charStatus[i] = "correct";
    } else if (char !== expected && charStatus[i] !== "correct") {
      quoteSpans[i].classList.add("incorrect");
      quoteSpans[i].classList.remove("correct");
      quoteSpans[i].style.color = "red";
      charStatus[i] = "wrong";
      errors++;
      quoteInput.value = typed.slice(0, i).join("");
      break;
    }
  }

   const currentIndex = typed.length;
  if (currentIndex < quoteSpans.length) {
    quoteSpans[currentIndex].classList.add("cursor");
  }

  const correctCharacters = charStatus.filter((s) => s === "correct").length;
  const accuracyVal = (correctCharacters / characterTyped) * 100;
  accuracyElement.textContent = Math.round(accuracyVal).toString();

  if (typed.length === quote.length) {
    stopCountdown();
    totalErrors += errors;
    calculateResults(correctCharacters, characterTyped);
    quoteInput.disabled = true;
    showPopup();
  }
}


function startCountdown() {
  timeLeft = 30;
  const startTimestamp = Date.now();
  const duration = timeLeft * 1000;

  countdownInterval = window.setInterval(() => {
    const elapsed = Date.now() - startTimestamp;
    const remaining = Math.max(0, duration - elapsed);

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    const milliseconds = Math.floor((remaining % 1000) / 10);

    timer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;

    if (remaining <= 0) {
      stopCountdown();
      quoteInput.disabled = true;
      calculateResultsOnTimeout();
      showPopup();
    }
  }, 10);
}

function stopCountdown() {
  clearInterval(countdownInterval);
}


function calculateResults(correctChars: number, totalTyped: number) {
  const timeTakenMs = Date.now() - startTime;

  const minutes = Math.floor(timeTakenMs / 60000);
  const seconds = Math.floor((timeTakenMs % 60000) / 1000);
  const milliseconds = Math.floor((timeTakenMs % 1000) / 10);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
  popupTime.textContent = formattedTime;

  const originalWords = quote.trim().split(/\s+/);
  const typedWords = quoteInput.value.trim().split(/\s+/);
  let correctWords = 0;

  for (let i = 0; i < typedWords.length && i < originalWords.length; i++) {
    if (typedWords[i] === originalWords[i]) correctWords++;
  }

  const wpm = correctWords > 0 ? Math.round((correctWords / (timeTakenMs / 1000)) * 60) : 0;
  const accuracy = Math.round((correctChars / totalTyped) * 100);

  popupWpm.textContent = wpm.toString();
  popupAccuracy.textContent = accuracy.toString();

  saveResultToLocalStorage(wpm, accuracy);
  displayLeaderboard();
}

function calculateResultsOnTimeout() {
  const quoteSpans = quoteDisplay.querySelectorAll("span");
  const typed = quoteInput.value.split("");
  let correct = 0;

  quoteSpans.forEach((span, i) => {
    const char = typed[i];
    if (char === span.innerText && charStatus[i] !== "wrong") correct++;
  });
  quoteSpans.forEach(span => span.classList.remove("cursor"));


  calculateResults(correct, characterTyped);
  showPopup();
  quoteInput.disabled = true;
   retryBtn.style.display = "inline-block";
}


function showPopup() {
  popup.classList.add("visible");
}

function closePopup() {
  popup.classList.remove("visible");
}

function restartTest() {
  fetchQuote();
  stopCountdown();
  timerStarted = false;
  quoteInput.disabled = false;
  quoteInput.value = "";
  timer.textContent = "30";
  quoteInput.focus();
  totalErrors = 0;
  characterTyped = 0;
}

function updateTimerDisplay(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  timer.textContent = `${mins}:${secs}:00`;
}


function saveResultToLocalStorage(wpm: number, accuracy: number) {
  const existing = JSON.parse(localStorage.getItem("typingResults") || "[]");

  const newEntry = {
    wpm,
    accuracy,
    timestamp: new Date().toLocaleString(),
  };

  existing.unshift(newEntry);
  const topFive = existing.slice(0, 6);
  localStorage.setItem("typingResults", JSON.stringify(topFive));
}

function displayLeaderboard() {
  const results = JSON.parse(localStorage.getItem("typingResults") || "[]");

  leaderboardElement.innerHTML = "";

  if (results.length === 0) {
    leaderboardElement.innerHTML = "<li>No scores yet. Start typing!</li>";
    return;
  }

  results.forEach((entry: any) => {
    const item = document.createElement("li");
    item.innerText = `${entry.wpm} WPM, ${entry.accuracy} % Accuracy (${entry.timestamp})`;
    leaderboardElement.appendChild(item);
  });
}



retryBtn.addEventListener("click", retryTest);

function retryTest() {
  stopCountdown();

  timerStarted = false;
  totalErrors = 0;
  characterTyped = 0;
  timeLeft = 30;

  quoteInput.value = "";
  quoteInput.disabled = false;
  quoteInput.focus();

  fetchQuote();

  updateTimerDisplay(30);

  closePopup();
}



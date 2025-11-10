let currentPlayer = 1;
let players = {
  1: { name: "Pemain 1", color: "blue", position: 0, score: 0 },
  2: { name: "Pemain 2", color: "pink", position: 0, score: 0 },
};
let selectedBox = null;
let timeLeft = 30;
let gameState = "playing";
let paths = { 1: [], 2: [] };
let showTimer = false;
let timerInterval = null;
let answer = "";
let feedbackModalInstance, winnerModalInstance;

const challenges = [
  "🍬 Makan 1 permen!",
  "🍬 Ambil 2 permen berwarna hijau dan merah",
  "👑 Jadi “Raja/Ratu Permen” — bebas kasih perintah ringan ke 1 pemain",
  "Lawan harus kasih kamu pujian lebay (“Kamu jenius banget sumpah!”)",
  "🐶 Tiru suara hewan favoritmu!",
  "Lawan harus nari atau bergaya lucu di depan kamu 5 detik",
  "📣 Lawan wajib teriak “kamu keren banget!” sambil tepuk tangan",
  "😄 Senyum lebar ke kamera!",
];

const punishments = [
  "🎶 Nyanyi lagu anak-anak dengan gaya penyanyi profesional",
  "🕺 Lakukan gerakan aneh pilihan pemain lain selama 10 detik",
  "📷 Pose lucu dan biarkan orang lain ambil foto",
  "🐸 Ucapkan kata motivasi konyol dengan suara paling anehmu",
  "😝 Makan permen tanpa tangan (gunakan mulut langsung dari meja)",
  "💬 Pura-pura jadi pembawa acara selama 15 detik (“Selamat datang di acara…”)",
  "🙈 Tutup mata dan hitung mundur dari 10!",
];

function generatePaths() {
  const operations = ["+", "-"];
  const newPaths = { 1: [], 2: [] };

  for (let player = 1; player <= 2; player++) {
    let current = Math.floor(Math.random() * 10) + 5;
    newPaths[player].push({
      type: "start",
      value: current,
      id: `p${player}-start`,
    });

    for (let i = 0; i < 8; i++) {
      const op = operations[Math.floor(Math.random() * operations.length)];
      const num = Math.floor(Math.random() * 9) + 1;

      newPaths[player].push({
        type: "arrow",
        operation: `${op}${num}`,
        op: op,
        num: num,
        revealed: false,
        id: `p${player}-arrow-${i}`,
      });

      current = op === "+" ? current + num : current - num;

      newPaths[player].push({
        type: "box",
        value: current,
        userAnswer: "",
        correctAnswer: current,
        id: `p${player}-box-${i}`,
      });
    }

    newPaths[player].push({ type: "finish", id: `p${player}-finish` });
  }

  paths = newPaths;
  renderPaths();
}

function renderPaths() {
  for (let player = 1; player <= 2; player++) {
    const pathContainer = document.getElementById(`path${player}`);
    pathContainer.innerHTML = "";

    paths[player].forEach((item, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "path-item";

      if (item.type === "start") {
        itemDiv.innerHTML = `
                            <div class="start-box ${players[player].color}">
                                <div class="start-emoji">🚀</div>
                                <div class="start-value">${item.value}</div>
                            </div>
                        `;
      } else if (item.type === "finish") {
        itemDiv.innerHTML = `
                            <div class="finish-box">
                                <div class="finish-trophy">🏆</div>
                                <div class="finish-text">FINISH</div>
                            </div>
                        `;
      } else if (item.type === "arrow") {
        itemDiv.innerHTML = `
                            <div class="arrow-container">
                                <div class="arrow-symbol">↓</div>
                                <div class="operation-badge ${
                                  !item.revealed ? "hidden-op" : ""
                                }">
                                    ${item.revealed ? item.operation : "?"}
                                </div>
                            </div>
                        `;
      } else if (item.type === "box") {
        const isSelected = selectedBox === index && currentPlayer === player;
        const isFilled =
          item.userAnswer !== "" &&
          parseInt(item.userAnswer) === item.correctAnswer;
        const isClickable = currentPlayer === player;

        itemDiv.innerHTML = `
                            <div class="answer-box ${players[player].color} ${
          isFilled ? "filled" : ""
        } ${isSelected ? "selected" : ""} ${!isClickable ? "disabled" : ""}" 
                                 onclick="handleBoxClick(${player}, ${index})">
                                ${
                                  item.userAnswer !== ""
                                    ? `<span>${item.userAnswer}</span>`
                                    : `<span class="empty-box">□</span>`
                                }
                            </div>
                        `;
      }

      pathContainer.appendChild(itemDiv);
    });
  }
}

function handleBoxClick(player, boxIndex) {
  if (player !== currentPlayer) return;

  const path = paths[currentPlayer];
  const boxItem = path[boxIndex];

  if (!boxItem || boxItem.type !== "box") return;

  if (
    boxItem.userAnswer !== "" &&
    parseInt(boxItem.userAnswer) === boxItem.correctAnswer
  ) {
    alert("Kotak ini sudah dijawab dengan benar!");
    return;
  }

  let prevValue = null;
  if (boxIndex === 2) {
    prevValue = path[0].value;
  } else {
    const prevBoxIndex = boxIndex - 2;
    const prevBox = path[prevBoxIndex];
    if (prevBox && prevBox.userAnswer !== "") {
      prevValue = parseInt(prevBox.userAnswer);
    } else {
      alert("Selesaikan kotak sebelumnya terlebih dahulu!");
      return;
    }
  }

  const arrowIndex = boxIndex - 1;
  const arrow = path[arrowIndex];

  if (!arrow || arrow.type !== "arrow") {
    alert("Error: Tidak ditemukan operasi!");
    return;
  }

  paths[currentPlayer][arrowIndex].revealed = true;

  document.getElementById(
    "operationText"
  ).textContent = `${prevValue} ${arrow.operation} = ?`;
  selectedBox = boxIndex;
  showTimer = true;
  answer = "";
  document.getElementById("answerInput").value = "";

  updateUI();
  startTimer();
}

function handleNumberClick(value) {
  if (value === "clear") {
    answer = "";
  } else if (value === "-" && answer === "") {
    answer = "-";
  } else if (value !== "-") {
    answer += value;
  }
  document.getElementById("answerInput").value = answer;
  updateSubmitButton();
}

function handleSubmit() {
  if (!selectedBox || answer === "") return;

  const path = paths[currentPlayer];
  const boxItem = path[selectedBox];
  const userAns = parseInt(answer);
  const correctAnswer = boxItem.correctAnswer;

  stopTimer();

  if (userAns === correctAnswer) {
    playSound("correct");

    paths[currentPlayer][selectedBox].userAnswer = answer;
    players[currentPlayer].score += 10;
    players[currentPlayer].position += 1;

    document.getElementById(`score${currentPlayer}`).textContent =
      players[currentPlayer].score;

    showTimer = false;
    selectedBox = null;
    answer = "";
    document.getElementById("answerInput").value = "";

    if (checkWinner(currentPlayer)) {
      showWinnerModal(currentPlayer);
      return;
    }

    const randomChallenge =
      challenges[Math.floor(Math.random() * challenges.length)];
    showFeedbackModal("success", "🎉 Benar!", randomChallenge);
  } else {
    handleWrongAnswer();
  }

  updateUI();
}

function handleWrongAnswer() {
  // Prevent multiple calls
  if (!showTimer) return;

  playSound("wrong");

  const randomPunishment =
    punishments[Math.floor(Math.random() * punishments.length)];
  showTimer = false;
  selectedBox = null;
  answer = "";
  document.getElementById("answerInput").value = "";

  showFeedbackModal("error", "😅 Ups!Salah", randomPunishment);
  updateUI();
}

function checkWinner(player) {
  const path = paths[player];
  let correctCount = 0;

  path.forEach((item) => {
    if (
      item.type === "box" &&
      item.userAnswer !== "" &&
      parseInt(item.userAnswer) === item.correctAnswer
    ) {
      correctCount++;
    }
  });

  return correctCount >= 8;
}

function showFeedbackModal(type, title, message) {
  const icon = document.getElementById("feedbackIcon");
  const titleEl = document.getElementById("feedbackTitle");
  const messageEl = document.getElementById("feedbackMessage");

  icon.textContent = type === "success" ? "😊" : "😔";
  titleEl.textContent = title;
  titleEl.style.color = type === "success" ? "#059669" : "#ea580c";
  messageEl.textContent = message;

  if (!feedbackModalInstance) {
    feedbackModalInstance = new bootstrap.Modal(
      document.getElementById("feedbackModal")
    );
  }
  feedbackModalInstance.show();
}

function showWinnerModal(winner) {
  document.getElementById(
    "winnerTitle"
  ).textContent = `🎉 ${players[winner].name} Menang!`;
  document.getElementById("finalScore1").textContent = players[1].score;
  document.getElementById("finalScore2").textContent = players[2].score;

  if (!winnerModalInstance) {
    winnerModalInstance = new bootstrap.Modal(
      document.getElementById("winnerModal")
    );
  }
  winnerModalInstance.show();
}

function handleContinue() {
  if (feedbackModalInstance) {
    feedbackModalInstance.hide();
  }
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateUI();
}

function handleRestart() {
  if (winnerModalInstance) {
    winnerModalInstance.hide();
  }

  players = {
    1: { name: "Pemain 1", color: "blue", position: 0, score: 0 },
    2: { name: "Pemain 2", color: "pink", position: 0, score: 0 },
  };
  currentPlayer = 1;
  selectedBox = null;
  timeLeft = 30;
  gameState = "playing";
  showTimer = false;
  answer = "";

  document.getElementById("score1").textContent = "0";
  document.getElementById("score2").textContent = "0";
  document.getElementById("answerInput").value = "";

  generatePaths();
  updateUI();
}

function startTimer() {
  stopTimer(); // Stop any existing timer first
  timeLeft = 30;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      stopTimer();
      handleWrongAnswer();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateTimerDisplay() {
  const timerCount = document.getElementById("timerCount");
  timerCount.textContent = `${timeLeft}s`;

  if (timeLeft <= 10) {
    timerCount.classList.add("timer-warning", "text-danger");
    timerCount.classList.remove("text-primary");
  } else {
    timerCount.classList.remove("timer-warning", "text-danger");
    timerCount.classList.add("text-primary");
  }
}

function updateUI() {
  document
    .getElementById("player1Card")
    .classList.toggle("active", currentPlayer === 1);
  document
    .getElementById("player2Card")
    .classList.toggle("active", currentPlayer === 2);

  const timerBox = document.getElementById("timerBox");
  if (showTimer) {
    timerBox.classList.remove("d-none");
    const playerText = document.getElementById("currentPlayerText");
    playerText.textContent = `Giliran ${players[currentPlayer].name}`;
    playerText.style.color =
      players[currentPlayer].color === "blue" ? "#2563eb" : "#db2777";
  } else {
    timerBox.classList.add("d-none");
  }

  const keypadTitle = document.getElementById("keypadTitle");
  keypadTitle.textContent = `Keypad untuk ${players[currentPlayer].name}`;
  keypadTitle.style.color =
    players[currentPlayer].color === "blue" ? "#0d6efd" : "#be185d";

  updateSubmitButton();
  renderPaths();
}

function updateSubmitButton() {
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = !selectedBox || answer === "";
}

function playSound(type) {
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === "correct") {
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } else {
      oscillator.frequency.value = 200;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  } catch (e) {
    console.log("Audio not supported");
  }
}

// Initialize game
document.addEventListener("DOMContentLoaded", function () {
  generatePaths();
  updateUI();
});

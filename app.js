// ========================================
// Mini Football Betting - Main Program
// Using Matter.js physics engine to build football field and betting system
// ========================================

// Import Matter.js core modules
const { Engine, Render, World, Bodies, Body, Events, Runner } = Matter;

// ========================================
// Game Parameters Configuration
// ========================================

// Football and canvas size settings
const BALL_RADIUS = 7.5; // Football radius
// Based on FIFA standard ratio, 1m = 5px
const CANVAS_WIDTH = 340; // Canvas width
const CANVAS_HEIGHT = 525; // Canvas height
const GOAL_WIDTH = 37; // Goal width

// Football field line dimensions (scaled proportionally)
const PENALTY_AREA_WIDTH = 202; // Penalty area width
const PENALTY_AREA_DEPTH = 83; // Penalty area depth
const GOAL_AREA_WIDTH = 92; // Goal area width
const GOAL_AREA_DEPTH = 28; // Goal area depth
const CORNER_ARC_RADIUS = 5; // Corner arc radius
const CENTER_CIRCLE_RADIUS = 46; // Center circle radius

// ========================================
// Player Configuration
// ========================================

const PLAYER_RADIUS = 15; // 球員半徑 (比球大一倍：7.5 * 2 = 15)
const PLAYER_SPEED = 2; // 球員移動速度

// 球員初始位置配置
const PLAYER_POSITIONS = {
  home: [
    // Team 1 球員 (11人制)
    { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.95 }, // 守門員 (球門前)
    { x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.8 }, // 後衛1
    { x: CANVAS_WIDTH * 0.45, y: CANVAS_HEIGHT * 0.8 }, // 後衛2
    { x: CANVAS_WIDTH * 0.55, y: CANVAS_HEIGHT * 0.8 }, // 後衛3
    { x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.8 }, // 後衛4
    { x: CANVAS_WIDTH * 0.2, y: CANVAS_HEIGHT * 0.65 }, // 中場1
    { x: CANVAS_WIDTH * 0.4, y: CANVAS_HEIGHT * 0.65 }, // 中場2
    { x: CANVAS_WIDTH * 0.6, y: CANVAS_HEIGHT * 0.65 }, // 中場3
    { x: CANVAS_WIDTH * 0.8, y: CANVAS_HEIGHT * 0.65 }, // 中場4
    { x: CANVAS_WIDTH * 0.35, y: CANVAS_HEIGHT * 0.45 }, // 前鋒1
    { x: CANVAS_WIDTH * 0.65, y: CANVAS_HEIGHT * 0.45 }, // 前鋒2
  ],
  away: [
    // Team 2 球員 (11人制)
    { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.05 }, // 守門員 (球門前)
    { x: CANVAS_WIDTH * 0.25, y: CANVAS_HEIGHT * 0.2 }, // 後衛1
    { x: CANVAS_WIDTH * 0.45, y: CANVAS_HEIGHT * 0.2 }, // 後衛2
    { x: CANVAS_WIDTH * 0.55, y: CANVAS_HEIGHT * 0.2 }, // 後衛3
    { x: CANVAS_WIDTH * 0.75, y: CANVAS_HEIGHT * 0.2 }, // 後衛4
    { x: CANVAS_WIDTH * 0.2, y: CANVAS_HEIGHT * 0.35 }, // 中場1
    { x: CANVAS_WIDTH * 0.4, y: CANVAS_HEIGHT * 0.35 }, // 中場2
    { x: CANVAS_WIDTH * 0.6, y: CANVAS_HEIGHT * 0.35 }, // 中場3
    { x: CANVAS_WIDTH * 0.8, y: CANVAS_HEIGHT * 0.35 }, // 中場4
    { x: CANVAS_WIDTH * 0.35, y: CANVAS_HEIGHT * 0.55 }, // 前鋒1
    { x: CANVAS_WIDTH * 0.65, y: CANVAS_HEIGHT * 0.55 }, // 前鋒2
  ],
};

// 球員物體陣列
let players = {
  home: [],
  away: [],
};

// ========================================
// Player Creation Functions
// ========================================

// 創建球員
function createPlayers() {
  // 清空現有球員
  players.home = [];
  players.away = [];

  // 創建 Team 1 球員 (法國隊)
  PLAYER_POSITIONS.home.forEach((pos, index) => {
    const player = Bodies.circle(pos.x, pos.y, PLAYER_RADIUS, {
      isStatic: false,
      isSensor: true, // 關鍵：不影響球的物理碰撞
      frictionAir: 0.1, // 輕微空氣阻力讓球員移動更自然
      render: {
        sprite: {
          texture: "./ar.png",
          xScale: (PLAYER_RADIUS * 2) / 278, // 根據圖片尺寸縮放
          yScale: (PLAYER_RADIUS * 2) / 278,
        },
      },
      label: `homePlayer_${index}`,
    });
    players.home.push(player);
  });

  // 創建 Team 2 球員 (阿根廷隊)
  PLAYER_POSITIONS.away.forEach((pos, index) => {
    const player = Bodies.circle(pos.x, pos.y, PLAYER_RADIUS, {
      isStatic: false,
      isSensor: true, // 關鍵：不影響球的物理碰撞
      frictionAir: 0.1,
      render: {
        sprite: {
          texture: "./fr.png",
          xScale: (PLAYER_RADIUS * 2) / 278, // 根據圖片尺寸縮放
          yScale: (PLAYER_RADIUS * 2) / 278,
        },
      },
      label: `awayPlayer_${index}`,
    });
    players.away.push(player);
  });

  return [...players.home, ...players.away];
}

// 重置球員位置
function resetPlayersPosition() {
  // 重置 Team 1 球員位置
  players.home.forEach((player, index) => {
    const pos = PLAYER_POSITIONS.home[index];
    Body.setPosition(player, { x: pos.x, y: pos.y });
    Body.setVelocity(player, { x: 0, y: 0 });
  });

  // 重置 Team 2 球員位置
  players.away.forEach((player, index) => {
    const pos = PLAYER_POSITIONS.away[index];
    Body.setPosition(player, { x: pos.x, y: pos.y });
    Body.setVelocity(player, { x: 0, y: 0 });
  });
}

// 預測球的軌跡
function predictBallPosition(steps = 30) {
  const ballVel = currentBall.velocity;
  const ballPos = currentBall.position;

  // 簡單的線性預測（忽略碰撞）
  return {
    x: ballPos.x + ballVel.x * steps,
    y: ballPos.y + ballVel.y * steps,
  };
}

// 檢查球員是否應該進行"傳球"動作
function shouldPlayerReactToBall(player, ballPos, ballVel) {
  const playerPos = player.position;
  const distanceToBall = Math.sqrt(
    Math.pow(ballPos.x - playerPos.x, 2) + Math.pow(ballPos.y - playerPos.y, 2)
  );

  // 擴大反應範圍，讓球員更積極移動
  if (distanceToBall < 100) {
    // 檢查球是否朝向球員移動（放寬條件）
    const ballToPlayer = {
      x: playerPos.x - ballPos.x,
      y: playerPos.y - ballPos.y,
    };

    const dotProduct = ballVel.x * ballToPlayer.x + ballVel.y * ballToPlayer.y;
    return dotProduct > -50 && distanceToBall > PLAYER_RADIUS + BALL_RADIUS + 3; // 更寬鬆的方向檢查
  }

  return false;
}

// 找到最佳接球位置
function findBestReceivingPosition(player, playerIndex, isHomeTeam) {
  const ballPos = currentBall.position;
  const ballVel = currentBall.velocity;
  const playerPos = player.position;
  const initialPos = isHomeTeam
    ? PLAYER_POSITIONS.home[playerIndex]
    : PLAYER_POSITIONS.away[playerIndex];

  // 預測球在未來的位置
  const futureBallPos = predictBallPosition(20);

  // 根據球員角色決定移動策略
  const role = getPlayerRole(playerIndex);

  switch (role) {
    case "goalkeeper":
      // 守門員：主要守在球門前，只有球很近時才移動
      if (Math.abs(ballPos.y - playerPos.y) < 100) {
        return { x: ballPos.x, y: initialPos.y };
      }
      return initialPos;

    case "defender":
      // 後衛：大幅度移動到球的路徑上
      const goalY = isHomeTeam ? CANVAS_HEIGHT : 0;
      const interceptY = ballPos.y + (goalY - ballPos.y) * 0.5;
      return { x: futureBallPos.x, y: interceptY };

    case "midfielder":
      // 中場：大範圍跟隨球並預測位置
      return {
        x: futureBallPos.x + (Math.random() - 0.5) * 30,
        y: futureBallPos.y + (Math.random() - 0.5) * 30,
      };

    case "forward":
      // 前鋒：積極朝球和對方球門移動
      const opponentGoalY = isHomeTeam ? 0 : CANVAS_HEIGHT;
      return {
        x: ballPos.x + ballVel.x * 15,
        y: ballPos.y + (opponentGoalY - ballPos.y) * 0.3,
      };

    default:
      return futureBallPos;
  }
}

// 根據球員索引判斷角色
function getPlayerRole(index) {
  if (index === 0) return "goalkeeper";
  if (index <= 4) return "defender";
  if (index <= 8) return "midfielder";
  return "forward";
}

// 檢查並限制球員在球場範圍內
function keepPlayerInBounds(player, velocity) {
  const pos = player.position;
  const boundary = 20; // 距離邊界的安全距離

  let newVelX = velocity.x;
  let newVelY = velocity.y;

  // 檢查左右邊界
  if (pos.x <= boundary && velocity.x < 0) {
    newVelX = Math.abs(velocity.x); // 反彈向右
  } else if (pos.x >= CANVAS_WIDTH - boundary && velocity.x > 0) {
    newVelX = -Math.abs(velocity.x); // 反彈向左
  }

  // 檢查上下邊界
  if (pos.y <= boundary && velocity.y < 0) {
    newVelY = Math.abs(velocity.y); // 反彈向下
  } else if (pos.y >= CANVAS_HEIGHT - boundary && velocity.y > 0) {
    newVelY = -Math.abs(velocity.y); // 反彈向上
  }

  return { x: newVelX, y: newVelY };
}

// 改進的球員AI移動邏輯
function updatePlayersMovement() {
  if (!gameState.isGameActive) return;

  const ballPos = currentBall.position;
  const ballVel = currentBall.velocity;

  // Team 1 球員移動邏輯 (法國隊)
  players.home.forEach((player, index) => {
    const playerPos = player.position;
    const initialPos = PLAYER_POSITIONS.home[index];

    // 檢查是否應該對球做出反應
    if (shouldPlayerReactToBall(player, ballPos, ballVel)) {
      // 找到最佳接球位置
      const targetPos = findBestReceivingPosition(player, index, true);

      // 計算移動方向
      const distanceToTarget = Math.sqrt(
        Math.pow(targetPos.x - playerPos.x, 2) +
          Math.pow(targetPos.y - playerPos.y, 2)
      );

      if (distanceToTarget > 5) {
        const directionX = (targetPos.x - playerPos.x) / distanceToTarget;
        const directionY = (targetPos.y - playerPos.y) / distanceToTarget;

        // 根據角色調整移動速度（大幅提升）
        const role = getPlayerRole(index);
        let speedMultiplier = 1.5;
        if (role === "midfielder") speedMultiplier = 2.0;
        if (role === "forward") speedMultiplier = 2.5;
        if (role === "goalkeeper") speedMultiplier = 1.0;

        const boundedVelocity = keepPlayerInBounds(player, {
          x: directionX * PLAYER_SPEED * speedMultiplier,
          y: directionY * PLAYER_SPEED * speedMultiplier,
        });
        Body.setVelocity(player, boundedVelocity);
      } else {
        // 到達目標位置，繼續小幅移動
        const smallMovement = keepPlayerInBounds(player, {
          x: (Math.random() - 0.5) * PLAYER_SPEED * 0.8,
          y: (Math.random() - 0.5) * PLAYER_SPEED * 0.8,
        });
        Body.setVelocity(player, smallMovement);
      }
    } else {
      // 自由移動，不回到原始位置（大幅度漫遊50%增加）
      const freeMovement = keepPlayerInBounds(player, {
        x: (Math.random() - 0.5) * PLAYER_SPEED * 0.6,
        y: (Math.random() - 0.5) * PLAYER_SPEED * 0.6,
      });
      Body.setVelocity(player, freeMovement);
    }
  });

  // Team 2 球員移動邏輯 (阿根廷隊)
  players.away.forEach((player, index) => {
    const playerPos = player.position;
    const initialPos = PLAYER_POSITIONS.away[index];

    // 檢查是否應該對球做出反應
    if (shouldPlayerReactToBall(player, ballPos, ballVel)) {
      // 找到最佳接球位置
      const targetPos = findBestReceivingPosition(player, index, false);

      // 計算移動方向
      const distanceToTarget = Math.sqrt(
        Math.pow(targetPos.x - playerPos.x, 2) +
          Math.pow(targetPos.y - playerPos.y, 2)
      );

      if (distanceToTarget > 5) {
        const directionX = (targetPos.x - playerPos.x) / distanceToTarget;
        const directionY = (targetPos.y - playerPos.y) / distanceToTarget;

        // 根據角色調整移動速度（大幅提升）
        const role = getPlayerRole(index);
        let speedMultiplier = 1.5;
        if (role === "midfielder") speedMultiplier = 2.0;
        if (role === "forward") speedMultiplier = 2.5;
        if (role === "goalkeeper") speedMultiplier = 1.0;

        const boundedVelocity = keepPlayerInBounds(player, {
          x: directionX * PLAYER_SPEED * speedMultiplier,
          y: directionY * PLAYER_SPEED * speedMultiplier,
        });
        Body.setVelocity(player, boundedVelocity);
      } else {
        // 到達目標位置，繼續小幅移動
        const smallMovement = keepPlayerInBounds(player, {
          x: (Math.random() - 0.5) * PLAYER_SPEED * 0.45,
          y: (Math.random() - 0.5) * PLAYER_SPEED * 0.45,
        });
        Body.setVelocity(player, smallMovement);
      }
    } else {
      // 自由移動，不回到原始位置（大幅度漫遊50%增加）
      const freeMovement = keepPlayerInBounds(player, {
        x: (Math.random() - 0.5) * PLAYER_SPEED * 0.3,
        y: (Math.random() - 0.5) * PLAYER_SPEED * 0.3,
      });
      Body.setVelocity(player, freeMovement);
    }
  });
}

// Football velocity options for random movement
const VELOCITY_OPTIONS = [
  { x: 3.0, y: 7.0, result: "Upper" },
  { x: -3.0, y: 7.0, result: "Upper" },
  { x: 3.0, y: -7.0, result: "Lower" },
  { x: -3.0, y: -7.0, result: "Lower" },

  { x: 9.0, y: 3.0, result: "Lower" },
  { x: -9.0, y: 3.0, result: "Lower" },
  { x: 9.0, y: -3.0, result: "Upper" },
  { x: -9.0, y: -3.0, result: "Upper" },

  { x: 3.0, y: 9.0, result: "Upper" },
  { x: -3.0, y: 9.0, result: "Upper" },
  { x: 3.0, y: -9.0, result: "Lower" },
  { x: -3.0, y: -9.0, result: "Lower" },

  { x: 7.0, y: 5.0, result: "draw" },
  { x: -7.0, y: 5.0, result: "draw" },
  { x: 7.0, y: -5.0, result: "draw" },
  { x: -7.0, y: -5.0, result: "draw" },

  { x: 5.0, y: 7.0, result: "Upper" },
  { x: -5.0, y: 7.0, result: "Upper" },
  { x: 5.0, y: -7.0, result: "Lower" },
  { x: -5.0, y: -7.0, result: "Lower" },

  { x: 4.0, y: 8.0, result: "Lower" },
  { x: -4.0, y: 8.0, result: "Lower" },
  { x: 4.0, y: -8.0, result: "Upper" },
  { x: -4.0, y: -8.0, result: "Upper" },

  { x: 8.0, y: 4.0, result: "Upper" },
  { x: -8.0, y: 4.0, result: "Upper" },
  { x: 8.0, y: -4.0, result: "Lower" },
  { x: -8.0, y: -4.0, result: "Lower" },

  { x: 6.0, y: 6.0, result: "Lower" },
  { x: -6.0, y: 6.0, result: "Lower" },
  { x: 6.0, y: -6.0, result: "Upper" },
  { x: -6.0, y: -6.0, result: "Upper" },
];

// ========================================
// Game Timer System
// ========================================

// Timer state management
let gameTimer = {
  minutes: 90, // Game time (minutes)
  seconds: 0, // Seconds
  isRunning: false, // Whether timer is running
  isPaused: false, // Whether timer is paused
  intervalId: null, // Timer interval ID
  totalTimeMs: 45000, // Total game time (milliseconds) 45 seconds = 90 minutes
  elapsedTimeMs: 0, // Elapsed time (milliseconds)
};

// Game state management
let gameState = {
  isGameStarted: false, // Whether game has started
  isGameActive: false, // Whether game is active
};

// Score state management
let gameScore = {
  home: 0, // Home team score
  away: 0, // Away team score
};

// Format time display
function formatTime(minutes, seconds) {
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = seconds.toString().padStart(2, "0");
  return `${paddedMinutes}:${paddedSeconds}`;
}

// Update timer display
function updateTimerDisplay() {
  const timeElement = document.querySelector(".game-time");
  if (timeElement) {
    timeElement.textContent = formatTime(gameTimer.minutes, gameTimer.seconds);
  }
}

// Calculate current time based on elapsed time
function calculateCurrentTime() {
  const remainingMs = gameTimer.totalTimeMs - gameTimer.elapsedTimeMs;
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  gameTimer.minutes = Math.floor(remainingSeconds / 60);
  gameTimer.seconds = remainingSeconds % 60;
}

// Start timer
function startTimer() {
  if (gameTimer.isRunning) return;

  gameTimer.isRunning = true;
  gameTimer.isPaused = false;

  const startTime = Date.now() - gameTimer.elapsedTimeMs;

  gameTimer.intervalId = setInterval(() => {
    if (gameTimer.isPaused) return;

    gameTimer.elapsedTimeMs = Date.now() - startTime;

    // Check if time is up
    if (gameTimer.elapsedTimeMs >= gameTimer.totalTimeMs) {
      gameTimer.elapsedTimeMs = gameTimer.totalTimeMs;
      calculateCurrentTime();
      updateTimerDisplay();
      stopTimer();
      onGameTimeUp();
      return;
    }

    calculateCurrentTime();
    updateTimerDisplay();
  }, 100); // Update display every 100 milliseconds

  console.log("⏰ Timer started");
}

// Pause timer
function pauseTimer() {
  gameTimer.isPaused = true;
  console.log("⏸️ Timer paused");
}

// Resume timer
function resumeTimer() {
  gameTimer.isPaused = false;
  console.log("▶️ Timer resumed");
}

// Stop timer
function stopTimer() {
  if (gameTimer.intervalId) {
    clearInterval(gameTimer.intervalId);
    gameTimer.intervalId = null;
  }
  gameTimer.isRunning = false;
  gameTimer.isPaused = false;
  console.log("⏹️ Timer stopped");
}

// Reset timer
function resetTimer() {
  stopTimer();
  gameTimer.minutes = 90;
  gameTimer.seconds = 0;
  gameTimer.elapsedTimeMs = 0;
  updateTimerDisplay();
  console.log("🔄 Timer reset");
}

// Handle game time up
async function onGameTimeUp() {
  console.log("⏰ Game time is up!");

  // Set game state to inactive
  gameState.isGameActive = false;

  // Stop physics engine
  Engine.clear(engine);

  // process betting results
  const resultData = processBettingResults(gameScore.home, gameScore.away);

  // update balance and bet slip display
  updateBalance();
  updateBetSlip();

  // show betting results (wait for user confirmation)
  await showBettingResults(resultData);
}

// Update scoreboard display
function updateScoreDisplay() {
  const homeScoreElement = document.querySelector(
    ".team-section:first-child .team-score"
  );
  const awayScoreElement = document.querySelector(
    ".team-section:last-child .team-score"
  );

  if (homeScoreElement) {
    homeScoreElement.textContent = gameScore.home;
  }
  if (awayScoreElement) {
    awayScoreElement.textContent = gameScore.away;
  }
}

// Reset score
function resetScore() {
  gameScore.home = 0;
  gameScore.away = 0;
  updateScoreDisplay();
}

// Start game
function startGame() {
  if (gameState.isGameStarted) {
    console.log("🎮 Game already started");
    return;
  }

  gameState.isGameStarted = true;
  gameState.isGameActive = true;

  // prettier-ignore
  const randomVelocityOption = VELOCITY_OPTIONS[Math.floor(Math.random() * VELOCITY_OPTIONS.length)];
  Body.setVelocity(currentBall, {
    x: randomVelocityOption.x,
    y: randomVelocityOption.y,
  });

  // Start timer
  startTimer();

  // prettier-ignore
  console.log(`🚀 Game started! Initial velocity: {${randomVelocityOption.x}, ${randomVelocityOption.y}} | Expected result: ${randomVelocityOption.result}`);
}

// ========================================
// Physics Engine Initialization
// ========================================

// Create physics engine and set gravity
const engine = Engine.create();
engine.world.gravity.x = 0; // No horizontal gravity
engine.world.gravity.y = 0; // No vertical gravity

// Create canvas renderer
const canvas = document.getElementById("game-canvas");
const render = Render.create({
  canvas: canvas,
  engine: engine,
  options: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    wireframes: false,
    background: "transparent",
    showAngleIndicator: false,
    showVelocity: false,
  },
});

// ========================================
// Football Field Boundary Creation
// ========================================

// Create field boundary walls (excluding goal positions)
const walls = [
  // Upper boundary - left half (left side of goal)
  Bodies.rectangle(
    (CANVAS_WIDTH - GOAL_WIDTH) / 4,
    5,
    (CANVAS_WIDTH - GOAL_WIDTH) / 2,
    10,
    {
      isStatic: true,
      restitution: 1.0, // Perfectly elastic collision
      friction: 0.0,
      frictionStatic: 0.0,
      frictionAir: 0.0,
      density: 1.0,
      inertia: Infinity,
      angularVelocity: 0.0,
      render: { fillStyle: "#ffffff" },
    }
  ),

  // Upper boundary - right half (right side of goal)
  Bodies.rectangle(
    CANVAS_WIDTH - (CANVAS_WIDTH - GOAL_WIDTH) / 4,
    5,
    (CANVAS_WIDTH - GOAL_WIDTH) / 2,
    10,
    {
      isStatic: true,
      restitution: 1.0,
      friction: 0.0,
      frictionStatic: 0.0,
      frictionAir: 0.0,
      density: 1.0,
      inertia: Infinity,
      angularVelocity: 0.0,
      render: { fillStyle: "#ffffff" },
    }
  ),

  // Lower boundary - left half (left side of goal)
  Bodies.rectangle(
    (CANVAS_WIDTH - GOAL_WIDTH) / 4,
    CANVAS_HEIGHT - 5,
    (CANVAS_WIDTH - GOAL_WIDTH) / 2,
    10,
    {
      isStatic: true,
      restitution: 1.0,
      friction: 0.0,
      frictionStatic: 0.0,
      frictionAir: 0.0,
      density: 1.0,
      inertia: Infinity,
      angularVelocity: 0.0,
      render: { fillStyle: "#ffffff" },
    }
  ),

  // Lower boundary - right half (right side of goal)
  Bodies.rectangle(
    CANVAS_WIDTH - (CANVAS_WIDTH - GOAL_WIDTH) / 4,
    CANVAS_HEIGHT - 5,
    (CANVAS_WIDTH - GOAL_WIDTH) / 2,
    10,
    {
      isStatic: true,
      restitution: 1.0,
      friction: 0.0,
      frictionStatic: 0.0,
      frictionAir: 0.0,
      density: 1.0,
      inertia: Infinity,
      angularVelocity: 0.0,
      render: { fillStyle: "#ffffff" },
    }
  ),

  // Left boundary (complete sideline)
  Bodies.rectangle(5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
    isStatic: true,
    restitution: 1.0,
    friction: 0.0,
    frictionStatic: 0.0,
    frictionAir: 0.0,
    density: 1.0,
    inertia: Infinity,
    angularVelocity: 0.0,
    render: { fillStyle: "#ffffff" },
  }),

  // Right boundary (complete sideline)
  Bodies.rectangle(CANVAS_WIDTH - 5, CANVAS_HEIGHT / 2, 10, CANVAS_HEIGHT, {
    isStatic: true,
    restitution: 1.0,
    friction: 0.0,
    frictionStatic: 0.0,
    frictionAir: 0.0,
    density: 1.0,
    inertia: Infinity,
    angularVelocity: 0.0,
    render: { fillStyle: "#ffffff" },
  }),
];

// ========================================
// Football Object Creation
// ========================================

// Create football body
const ball = Bodies.circle(
  CANVAS_WIDTH / 2, // Starting position: field center
  CANVAS_HEIGHT / 2,
  BALL_RADIUS,
  {
    restitution: 1.0, // Perfectly elastic collision
    friction: 0.0,
    frictionStatic: 0.0,
    frictionAir: 0.0,
    density: 1.0,
    inertia: Infinity,
    angularVelocity: 0.0,
    render: {
      sprite: {
        texture: "./ball.png", // Football texture
        xScale: (BALL_RADIUS * 2) / 534, // Scale ratio
        yScale: (BALL_RADIUS * 2) / 534,
      },
    },
  }
);

// Set football initial velocity (stay still before game starts)
// Velocity will be set when game starts

// ========================================
// Football Field Line Creation
// ========================================

// Center circle marking
const centerCircle = Bodies.circle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT / 2,
  CENTER_CIRCLE_RADIUS,
  {
    isStatic: true,
    isSensor: true, // Does not affect physical collision
    render: {
      fillStyle: "transparent",
      strokeStyle: "#ffffff",
      lineWidth: 2,
    },
  }
);

// Center line
const centerLine = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT / 2,
  CANVAS_WIDTH,
  2,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

// Penalty area markings - upper
const upperPenaltyAreaTop = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  PENALTY_AREA_DEPTH,
  PENALTY_AREA_WIDTH,
  2,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const upperPenaltyAreaLeft = Bodies.rectangle(
  (CANVAS_WIDTH - PENALTY_AREA_WIDTH) / 2,
  PENALTY_AREA_DEPTH / 2,
  2,
  PENALTY_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const upperPenaltyAreaRight = Bodies.rectangle(
  (CANVAS_WIDTH + PENALTY_AREA_WIDTH) / 2,
  PENALTY_AREA_DEPTH / 2,
  2,
  PENALTY_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

// Penalty area markings - lower
const lowerPenaltyAreaBottom = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT - PENALTY_AREA_DEPTH,
  PENALTY_AREA_WIDTH,
  2,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const lowerPenaltyAreaLeft = Bodies.rectangle(
  (CANVAS_WIDTH - PENALTY_AREA_WIDTH) / 2,
  CANVAS_HEIGHT - PENALTY_AREA_DEPTH / 2,
  2,
  PENALTY_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const lowerPenaltyAreaRight = Bodies.rectangle(
  (CANVAS_WIDTH + PENALTY_AREA_WIDTH) / 2,
  CANVAS_HEIGHT - PENALTY_AREA_DEPTH / 2,
  2,
  PENALTY_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

// Goal area markings - upper
const upperGoalAreaTop = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  GOAL_AREA_DEPTH,
  GOAL_AREA_WIDTH,
  2,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const upperGoalAreaLeft = Bodies.rectangle(
  (CANVAS_WIDTH - GOAL_AREA_WIDTH) / 2,
  GOAL_AREA_DEPTH / 2,
  2,
  GOAL_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const upperGoalAreaRight = Bodies.rectangle(
  (CANVAS_WIDTH + GOAL_AREA_WIDTH) / 2,
  GOAL_AREA_DEPTH / 2,
  2,
  GOAL_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

// Goal area markings - lower
const lowerGoalAreaBottom = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT - GOAL_AREA_DEPTH,
  GOAL_AREA_WIDTH,
  2,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const lowerGoalAreaLeft = Bodies.rectangle(
  (CANVAS_WIDTH - GOAL_AREA_WIDTH) / 2,
  CANVAS_HEIGHT - GOAL_AREA_DEPTH / 2,
  2,
  GOAL_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

const lowerGoalAreaRight = Bodies.rectangle(
  (CANVAS_WIDTH + GOAL_AREA_WIDTH) / 2,
  CANVAS_HEIGHT - GOAL_AREA_DEPTH / 2,
  2,
  GOAL_AREA_DEPTH,
  {
    isStatic: true,
    isSensor: true,
    render: { fillStyle: "#ffffff" },
  }
);

// Corner arc markings
const topLeftCornerArc = Bodies.circle(10, 10, CORNER_ARC_RADIUS, {
  isStatic: true,
  isSensor: true,
  render: {
    fillStyle: "transparent",
    strokeStyle: "#ffffff",
    lineWidth: 2,
  },
});

const topRightCornerArc = Bodies.circle(
  CANVAS_WIDTH - 10,
  10,
  CORNER_ARC_RADIUS,
  {
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: "transparent",
      strokeStyle: "#ffffff",
      lineWidth: 2,
    },
  }
);

const bottomLeftCornerArc = Bodies.circle(
  10,
  CANVAS_HEIGHT - 10,
  CORNER_ARC_RADIUS,
  {
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: "transparent",
      strokeStyle: "#ffffff",
      lineWidth: 2,
    },
  }
);

const bottomRightCornerArc = Bodies.circle(
  CANVAS_WIDTH - 10,
  CANVAS_HEIGHT - 10,
  CORNER_ARC_RADIUS,
  {
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: "transparent",
      strokeStyle: "#ffffff",
      lineWidth: 2,
    },
  }
);

// ========================================
// Goal Detection Area Creation
// ========================================

// Upper goal sensor area
const upperGoalSensor = Bodies.rectangle(CANVAS_WIDTH / 2, -5, GOAL_WIDTH, 15, {
  isStatic: true,
  isSensor: true,
  render: {
    fillStyle: "rgba(0, 255, 0, 0.3)", // Semi-transparent green (for debugging)
  },
  label: "upperGoal", // Label for identification
});

// Lower goal sensor area
const lowerGoalSensor = Bodies.rectangle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT + 5,
  GOAL_WIDTH,
  15,
  {
    isStatic: true,
    isSensor: true,
    render: {
      fillStyle: "rgba(0, 255, 0, 0.3)",
    },
    label: "lowerGoal",
  }
);

// ========================================
// Physics World Construction
// ========================================

// Add all bodies to physics world
World.add(engine.world, [
  ...walls, // Boundary walls
  ball, // Football
  upperGoalSensor, // Goal sensors
  lowerGoalSensor,
  centerCircle, // Field markings
  centerLine,
  upperPenaltyAreaTop, // Penalty area markings
  upperPenaltyAreaLeft,
  upperPenaltyAreaRight,
  lowerPenaltyAreaBottom,
  lowerPenaltyAreaLeft,
  lowerPenaltyAreaRight,
  upperGoalAreaTop, // Goal area markings
  upperGoalAreaLeft,
  upperGoalAreaRight,
  lowerGoalAreaBottom,
  lowerGoalAreaLeft,
  lowerGoalAreaRight,
  topLeftCornerArc, // Corner arcs
  topRightCornerArc,
  bottomLeftCornerArc,
  bottomRightCornerArc,
]);

// ========================================
// Game Reset System
// ========================================

// Current football object reference
let currentBall = ball;

// Completely reset game to initial state
// Clear all bodies and recreate football and physics world
function resetGameToInitialState() {
  // Clear physics world
  World.clear(engine.world);
  Engine.clear(engine);

  // Reset physics engine parameters
  engine.world.gravity.x = 0;
  engine.world.gravity.y = 0;

  // Recreate football
  currentBall = Bodies.circle(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    BALL_RADIUS,
    {
      restitution: 1.0,
      friction: 0.0,
      frictionStatic: 0.0,
      frictionAir: 0.0,
      density: 1.0,
      inertia: Infinity,
      angularVelocity: 0.0,
      render: {
        sprite: {
          texture: "./ball.png",
          xScale: (BALL_RADIUS * 2) / 534,
          yScale: (BALL_RADIUS * 2) / 534,
        },
      },
    }
  );

  // Football stays still in initial state, waiting for game to start
  Body.setVelocity(currentBall, { x: 0, y: 0 });

  // 創建球員
  const playerBodies = createPlayers();

  // Re-add all bodies to world
  World.add(engine.world, [
    ...walls,
    currentBall,
    ...playerBodies, // 添加球員
    upperGoalSensor,
    lowerGoalSensor,
    centerCircle,
    centerLine,
    upperPenaltyAreaTop,
    upperPenaltyAreaLeft,
    upperPenaltyAreaRight,
    lowerPenaltyAreaBottom,
    lowerPenaltyAreaLeft,
    lowerPenaltyAreaRight,
    upperGoalAreaTop,
    upperGoalAreaLeft,
    upperGoalAreaRight,
    lowerGoalAreaBottom,
    lowerGoalAreaLeft,
    lowerGoalAreaRight,
    topLeftCornerArc,
    topRightCornerArc,
    bottomLeftCornerArc,
    bottomRightCornerArc,
  ]);

  // Reset timer and score
  resetTimer();
  resetScore();

  // Reset game state
  gameState.isGameStarted = false;
  gameState.isGameActive = false;

  // clear pending bets (keep settled bets)
  bettingState.confirmedBets = bettingState.confirmedBets.filter(
    (betGroup) => betGroup.status === "settled"
  );

  // clear selected bets and update display
  clearAllBets();
  updateBetSlip();

  // Stop current runner to prevent multiple runners
  if (runner) {
    Runner.stop(runner);
  }

  // Create new runner and restart physics engine
  runner = Runner.create();
  Runner.run(runner, engine);

  // Stop football movement
  Body.setVelocity(currentBall, { x: 0, y: 0 });

  console.log("🔄 Game has been reset to initial state");
}

// ========================================
// Goal Animation System
// ========================================

// Reset football to center position and set new random velocity
function resetBallToCenter() {
  // Move football to field center
  Body.setPosition(currentBall, { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  // 重置球員位置
  resetPlayersPosition();

  // Randomly select a velocity
  // prettier-ignore
  const randomVelocityOption = VELOCITY_OPTIONS[Math.floor(Math.random() * VELOCITY_OPTIONS.length)];
  Body.setVelocity(currentBall, {
    x: randomVelocityOption.x,
    y: randomVelocityOption.y,
  });

  // prettier-ignore
  console.log(`⚽ Football reset to center, new velocity: {${randomVelocityOption.x}, ${randomVelocityOption.y}} | Expected result: ${randomVelocityOption.result}`);
}

// Show goal animation effect
function showGoalAnimation(message) {
  // Pause timer
  pauseTimer();

  // Create animation text element
  const goalText = document.createElement("div");
  goalText.textContent = message;
  goalText.style.position = "absolute";
  goalText.style.left = "50%";
  goalText.style.top = "50%";
  goalText.style.transform = "translate(-50%, -50%)";
  goalText.style.fontSize = "32px";
  goalText.style.fontWeight = "bold";
  goalText.style.color = "#FFD700"; // Gold text
  goalText.style.textShadow = "4px 4px 8px rgba(0, 0, 0, 0.8)";
  goalText.style.zIndex = "1000";
  goalText.style.pointerEvents = "none";
  goalText.style.fontFamily = "Arial, sans-serif";
  goalText.style.textAlign = "center";
  goalText.style.whiteSpace = "nowrap";

  // Set initial animation state
  goalText.style.opacity = "0";
  goalText.style.transform = "translate(-50%, -50%) scale(0.5)";
  goalText.style.transition = "all 0.3s ease-out";

  // Add text to canvas container
  const canvasContainer = document.getElementById("game-canvas").parentElement;
  canvasContainer.style.position = "relative";
  canvasContainer.appendChild(goalText);

  // Staged animation effects
  setTimeout(() => {
    goalText.style.opacity = "1";
    goalText.style.transform = "translate(-50%, -50%) scale(1.2)";
  }, 50);

  setTimeout(() => {
    goalText.style.transform = "translate(-50%, -50%) scale(1)";
  }, 400);

  setTimeout(() => {
    goalText.style.transform = "translate(-50%, -50%) scale(1.1)";
  }, 800);

  setTimeout(() => {
    goalText.style.opacity = "0";
    goalText.style.transform = "translate(-50%, -50%) scale(1.5)";
  }, 1500);

  // Clear animation element, reset football position, and resume timer
  setTimeout(() => {
    if (goalText.parentElement) {
      goalText.parentElement.removeChild(goalText);
    }

    // Reset football to center
    resetBallToCenter();

    // Resume timer, game continues
    resumeTimer();
  }, 2000);
}

// ========================================
// Goal Detection Event Handling
// ========================================

// Listen for body collision events
Events.on(engine, "collisionStart", function (event) {
  const pairs = event.pairs;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const { bodyA, bodyB } = pair;

    // Check if collision is between football and goal sensor (only valid during active game)
    if (
      gameState.isGameActive &&
      ((bodyA === currentBall &&
        (bodyB.label === "upperGoal" || bodyB.label === "lowerGoal")) ||
        (bodyB === currentBall &&
          (bodyA.label === "upperGoal" || bodyA.label === "lowerGoal")))
    ) {
      const goalSensor = bodyA === currentBall ? bodyB : bodyA;

      // Display goal message and update score based on goal position
      if (goalSensor.label === "upperGoal") {
        gameScore.home++; // Home team scores
        console.log("🥅 Upper goal scored! Team 1 scores!");
        updateScoreDisplay();
        showGoalAnimation("Team 1 Goal！");
      } else if (goalSensor.label === "lowerGoal") {
        gameScore.away++; // Away team scores
        console.log("🥅 Lower goal scored! Team 2 scores!");
        updateScoreDisplay();
        showGoalAnimation("Team 2 Goal！");
      }
    }
  }
});

// ========================================
// Football Betting System
// ========================================

// Betting system state management
let bettingState = {
  selectedBets: [], // Selected but unconfirmed bets
  balance: 10000, // Account balance
  confirmedBets: [], // Confirmed betting records
};

// Odds settings table
const ODDS_TABLE = {
  result: {
    home: 1.8, // Home win
    draw: 3.2, // Draw
    away: 2.1, // Away win
  },
  total: {
    over: 1.9, // Over
    under: 1.8, // Under
  },
  parity: {
    odd: 1.9, // Odd
    even: 1.9, // Even
  },
};

// Betting option name mapping
const BET_NAMES = {
  result: {
    home: "1",
    draw: "X",
    away: "2",
  },
  total: {
    over: "Over (> 4.5)",
    under: "Under (≤ 4.5)",
  },
  parity: {
    odd: "Odd",
    even: "Even",
  },
};

// Initialize betting system
// Bind all betting-related event listeners
function initBettingSystem() {
  // Bind betting button click events
  document.querySelectorAll(".bet-btn").forEach((btn) => {
    btn.addEventListener("click", handleBetSelection);
  });

  // Bind action button events
  document.getElementById("clear-bets").addEventListener("click", clearAllBets);
  document.getElementById("place-bet").addEventListener("click", placeBets);

  // Initialize display
  updateBetSlip();
  updateSelectedBets();
  updateBalance();
}

// Handle betting selection logic
function handleBetSelection(event) {
  const btn = event.currentTarget;
  const betType = btn.dataset.type;
  const betValue = btn.dataset.value;
  const odds = ODDS_TABLE[betType][betValue];

  // Check if there's already a bet of the same type
  const existingBetIndex = bettingState.selectedBets.findIndex(
    (bet) => bet.type === betType
  );

  if (existingBetIndex !== -1) {
    // If clicking same option, cancel selection
    if (bettingState.selectedBets[existingBetIndex].value === betValue) {
      bettingState.selectedBets.splice(existingBetIndex, 1);
      btn.classList.remove("selected");
    } else {
      // Replace with new selection
      bettingState.selectedBets[existingBetIndex] = {
        type: betType,
        value: betValue,
        odds: odds,
        amount: 100, // Fixed bet amount
      };

      // Update button selection state
      document
        .querySelectorAll(`[data-type="${betType}"]`)
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    }
  } else {
    // Add new bet item
    bettingState.selectedBets.push({
      type: betType,
      value: betValue,
      odds: odds,
      amount: 100,
    });
    btn.classList.add("selected");
  }

  updateSelectedBets();
}

// Clear all selected bets
function clearAllBets() {
  bettingState.selectedBets = [];
  document
    .querySelectorAll(".bet-btn")
    .forEach((btn) => btn.classList.remove("selected"));
  updateSelectedBets();
}

// Update betting button state
function updateSelectedBets() {
  const placeBetBtn = document.getElementById("place-bet");
  placeBetBtn.disabled = bettingState.selectedBets.length === 0;
}

// Handle bet confirmation
function placeBets() {
  if (bettingState.selectedBets.length === 0) {
    alert("Please select betting options!");
    return;
  }

  const totalAmount = bettingState.selectedBets.reduce(
    (sum, bet) => sum + bet.amount,
    0
  );

  if (totalAmount > bettingState.balance) {
    alert("Insufficient balance!");
    return;
  }

  // Deduct bet amount
  bettingState.balance -= totalAmount;

  // Record bet
  bettingState.confirmedBets.push({
    timestamp: Date.now(),
    bets: [...bettingState.selectedBets],
    status: "pending",
  });

  // Clear selection and update display
  clearAllBets();
  updateBalance();
  updateBetSlip();

  // Start game
  startGame();
}

// Update bet slip display
function updateBetSlip() {
  const betSlip = document.getElementById("bet-slip");

  if (bettingState.confirmedBets.length === 0) {
    betSlip.innerHTML = '<div class="bet-slip-empty">No bets yet</div>';
    return;
  }

  let html = "";
  bettingState.confirmedBets.forEach((betGroup) => {
    const timeString = new Date(betGroup.timestamp).toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    html += `<div style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">`;
    html += `<div style="background: #f8f9fa; padding: 8px 12px; font-size: 12px; font-weight: 600; color: #666; border-bottom: 1px solid #e0e0e0;">Order Time: ${timeString}</div>`;

    let groupTotal = 0;
    let groupWinnings = 0;

    if (betGroup.status === "pending") {
      // show pending bets
      betGroup.bets.forEach((bet) => {
        const name = BET_NAMES[bet.type][bet.value];
        const potentialWin = Math.round(bet.amount * bet.odds);
        groupTotal += bet.amount;

        html += `
          <div class="bet-item">
            <div class="bet-item-info">
              <div class="bet-item-name">${name}</div>
              <div class="bet-item-odds">Odds: ${bet.odds} | Win Amount: ${potentialWin}</div>
            </div>
            <div class="bet-item-amount">${bet.amount}</div>
            <div style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 600; background: #fff3cd; color: #856404;">Wait Result</div>
          </div>
        `;
      });

      html += `<div style="background: #f0f8f0; padding: 8px 12px; text-align: right; font-weight: 600; color: #4a8c4a; font-size: 13px; border-top: 1px solid #e0e0e0;">Total Amount: ${groupTotal}</div>`;
    } else if (betGroup.status === "settled" && betGroup.results) {
      // show settled bets
      betGroup.results.forEach((result) => {
        groupTotal += result.amount;
        if (result.isWin) {
          groupWinnings += result.winAmount;
        }

        html += `
          <div class="bet-item">
            <div class="bet-item-info">
              <div class="bet-item-name">${result.name}</div>
              <div class="bet-item-odds">Odds: ${result.odds} | Bets: ${
          result.amount
        }</div>
            </div>
            <div class="bet-item-amount">
              ${result.isWin ? `+${result.winAmount}` : `${result.amount}`}
            </div>
            <div style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 600; 
                        background: ${result.isWin ? "#d4edda" : "#f8d7da"}; 
                        color: ${result.isWin ? "#155724" : "#721c24"};">
              ${result.isWin ? "Win" : "Lose"}
            </div>
          </div>
        `;
      });

      const netResult = groupWinnings - groupTotal;
      html += `<div style="background: ${
        netResult >= 0 ? "#d4edda" : "#f8d7da"
      }; padding: 8px 12px; text-align: right; font-weight: 600; color: ${
        netResult >= 0 ? "#155724" : "#721c24"
      }; font-size: 13px; border-top: 1px solid #e0e0e0;">`;
      html += `Place Bet: ${groupTotal} | Win: ${groupWinnings} | Net Win: ${
        netResult >= 0 ? "+" : ""
      }${netResult}`;
      html += `</div>`;
    }

    html += `</div>`;
  });

  betSlip.innerHTML = html;
}

// Update balance display
function updateBalance() {
  document.getElementById("balance").textContent =
    bettingState.balance.toLocaleString();
}

// ========================================
// Result System
// ========================================

// Calculate betting results
function calculateBetResults(homeScore, awayScore) {
  const totalScore = homeScore + awayScore;

  return {
    result: {
      home: homeScore > awayScore,
      draw: homeScore === awayScore,
      away: awayScore > homeScore,
    },
    total: {
      over: totalScore > 4.5,
    },
    parity: {
      odd: totalScore % 2 === 1,
      even: totalScore % 2 === 0,
    },
  };
}

// Calculate and process betting results
function processBettingResults(homeScore, awayScore) {
  const results = calculateBetResults(homeScore, awayScore);
  let totalWinnings = 0;
  let totalWinningBets = 0;
  let totalLosingBets = 0;

  // process all pending bets
  bettingState.confirmedBets.forEach((betGroup) => {
    if (betGroup.status === "pending") {
      betGroup.status = "settled";
      betGroup.results = [];

      betGroup.bets.forEach((bet) => {
        const isWin = results[bet.type][bet.value];
        const winAmount = isWin ? Math.round(bet.amount * bet.odds) : 0;

        // record single bet result
        const betResult = {
          type: bet.type,
          value: bet.value,
          amount: bet.amount,
          odds: bet.odds,
          isWin: isWin,
          winAmount: winAmount,
          name: BET_NAMES[bet.type][bet.value],
        };

        betGroup.results.push(betResult);

        if (isWin) {
          totalWinnings += winAmount;
          totalWinningBets++;
          // add winnings to balance
          bettingState.balance += winAmount;
        } else {
          totalLosingBets++;
        }
      });
    }
  });

  return {
    totalWinnings,
    totalWinningBets,
    totalLosingBets,
    gameResults: {
      homeScore,
      awayScore,
      totalScore: homeScore + awayScore,
      // prettier-ignore
      matchResult: homeScore > awayScore ? "Team 1" : awayScore > homeScore ? "Team 2" : "X",
      totalResult: homeScore + awayScore > 4.5 ? "Over" : "Under",
      parityResult: (homeScore + awayScore) % 2 === 1 ? "Odd" : "Even",
    },
  };
}

// Show betting results
function showBettingResults(resultData) {
  return new Promise((resolve) => {
    // create results overlay
    const resultsOverlay = document.createElement("div");
    resultsOverlay.style.position = "fixed";
    resultsOverlay.style.top = "0";
    resultsOverlay.style.left = "0";
    resultsOverlay.style.width = "100%";
    resultsOverlay.style.height = "100%";
    resultsOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
    resultsOverlay.style.zIndex = "1500";
    resultsOverlay.style.display = "flex";
    resultsOverlay.style.justifyContent = "center";
    resultsOverlay.style.alignItems = "center";
    resultsOverlay.style.fontFamily = "Arial, sans-serif";
    resultsOverlay.style.color = "white";

    // create results container
    const resultsContainer = document.createElement("div");
    resultsContainer.style.backgroundColor = "white";
    resultsContainer.style.borderRadius = "12px";
    resultsContainer.style.padding = "30px";
    resultsContainer.style.maxWidth = "500px";
    resultsContainer.style.maxHeight = "80vh";
    resultsContainer.style.overflowY = "auto";
    resultsContainer.style.color = "black";
    resultsContainer.style.textAlign = "center";
    resultsContainer.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3)";

    // title
    const title = document.createElement("h2");
    title.textContent = "🎉 Results";
    title.style.color = "#4a8c4a";
    title.style.marginBottom = "20px";
    title.style.fontSize = "28px";

    // game results
    const gameResultsDiv = document.createElement("div");
    gameResultsDiv.style.backgroundColor = "#f8f9fa";
    gameResultsDiv.style.padding = "15px";
    gameResultsDiv.style.borderRadius = "8px";
    gameResultsDiv.style.marginBottom = "20px";
    gameResultsDiv.innerHTML = `
      <div style="font-size: 24px; color: #4a8c4a; margin-bottom: 8px;">
          Team 1 <span id="final-score" style="color: #e74c3c;">${resultData.gameResults.homeScore} - ${resultData.gameResults.awayScore}</span> Team 2
      </div>
      <div style="font-size: 14px; color: #666;">
        ${resultData.gameResults.matchResult} |
        ${resultData.gameResults.totalResult} | 
        ${resultData.gameResults.parityResult}
      </div>
    `;

    // detailed betting results
    const detailsDiv = document.createElement("div");
    detailsDiv.style.textAlign = "left";
    detailsDiv.style.marginBottom = "20px";

    if (resultData.totalWinningBets > 0 || resultData.totalLosingBets > 0) {
      detailsDiv.innerHTML =
        '<div style="font-size: 16px; font-weight: bold; margin-bottom: 10px; text-align: center;">Bet Details</div>';

      bettingState.confirmedBets.forEach((betGroup) => {
        if (betGroup.status === "settled" && betGroup.results) {
          betGroup.results.forEach((result) => {
            const resultDiv = document.createElement("div");
            resultDiv.style.display = "flex";
            resultDiv.style.justifyContent = "space-between";
            resultDiv.style.alignItems = "center";
            resultDiv.style.padding = "8px";
            resultDiv.style.marginBottom = "5px";
            resultDiv.style.backgroundColor = result.isWin
              ? "#d4edda"
              : "#f8d7da";
            resultDiv.style.borderRadius = "4px";
            resultDiv.style.fontSize = "14px";

            resultDiv.innerHTML = `
              <div>
                <div style="font-weight: bold;">${result.name}</div>
                <div style="font-size: 12px; color: #666;">Bet: ${
                  result.amount
                } | Odds: ${result.odds}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; color: ${
                  result.isWin ? "#4a8c4a" : "#dc3545"
                };">
                  ${result.isWin ? "Win" : "Lose"}
                </div>
                ${
                  result.isWin
                    ? `<div style="color: #4a8c4a;">+${result.winAmount}</div>`
                    : ""
                }
              </div>
            `;

            detailsDiv.appendChild(resultDiv);
          });
        }
      });
    } else {
      detailsDiv.innerHTML =
        '<div style="text-align: center; color: #666; font-style: italic;">No bets</div>';
    }

    // confirm button
    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Confirm";
    confirmButton.style.fontSize = "18px";
    confirmButton.style.padding = "12px 30px";
    confirmButton.style.backgroundColor = "#4a8c4a";
    confirmButton.style.color = "white";
    confirmButton.style.border = "none";
    confirmButton.style.borderRadius = "6px";
    confirmButton.style.cursor = "pointer";
    confirmButton.style.fontWeight = "bold";
    confirmButton.style.transition = "all 0.3s ease";

    confirmButton.addEventListener("mouseenter", () => {
      confirmButton.style.backgroundColor = "#3d7a3d";
    });

    confirmButton.addEventListener("mouseleave", () => {
      confirmButton.style.backgroundColor = "#4a8c4a";
    });

    confirmButton.addEventListener("click", () => {
      document.body.removeChild(resultsOverlay);
      resetGameToInitialState();
      resolve();
    });

    // assemble all elements
    resultsContainer.appendChild(title);
    resultsContainer.appendChild(gameResultsDiv);
    resultsContainer.appendChild(detailsDiv);
    resultsContainer.appendChild(confirmButton);

    resultsOverlay.appendChild(resultsContainer);
    document.body.appendChild(resultsOverlay);
  });
}

// ========================================
// Game Launch
// ========================================

// Create Runner instance
let runner = Runner.create();

// Start renderer and physics engine
Render.run(render);
Runner.run(runner, engine);

// 添加遊戲更新循環
Events.on(engine, "beforeUpdate", function () {
  updatePlayersMovement();
});

// Initialize betting system after page load
document.addEventListener("DOMContentLoaded", function () {
  initBettingSystem();

  // 創建並添加球員到世界
  const playerBodies = createPlayers();
  World.add(engine.world, playerBodies);

  // Initialize timer and score display
  updateTimerDisplay();
  updateScoreDisplay();

  console.log(
    "📱 Game loaded, please select betting options and confirm to start game"
  );
});

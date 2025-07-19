// ========================================
// 足球彈跳遊戲 - 主程式
// 使用 Matter.js 物理引擎建立足球場和投注系統
// ========================================

// 引入 Matter.js 核心模組
const { Engine, Render, World, Bodies, Body, Events, Runner } = Matter;

// ========================================
// 遊戲參數配置
// ========================================

// 足球和畫布尺寸設定
const BALL_RADIUS = 7.5; // 足球半徑
const CANVAS_WIDTH = 340; // 畫布寬度（基於FIFA標準比例）
const CANVAS_HEIGHT = 525; // 畫布高度
const GOAL_WIDTH = 37; // 球門寬度

// 足球場標線尺寸（按比例縮放）
const PENALTY_AREA_WIDTH = 202; // 禁區寬度
const PENALTY_AREA_DEPTH = 83; // 禁區深度
const GOAL_AREA_WIDTH = 92; // 小禁區寬度
const GOAL_AREA_DEPTH = 28; // 小禁區深度
const CORNER_ARC_RADIUS = 5; // 角球弧半徑
const CENTER_CIRCLE_RADIUS = 46; // 中圈半徑

// ========================================
// 遊戲計時器系統
// ========================================

// 計時器狀態管理
let gameTimer = {
  minutes: 90, // 遊戲時間（分鐘）
  seconds: 0, // 秒數
  isRunning: false, // 計時器是否運行中
  isPaused: false, // 計時器是否暫停
  intervalId: null, // 計時器間隔ID
  totalTimeMs: 45000, // 總遊戲時間（毫秒）45秒 = 90分鐘
  elapsedTimeMs: 0, // 已經過時間（毫秒）
};

// 遊戲狀態管理
let gameState = {
  isGameStarted: false, // 遊戲是否已經開始
  isGameActive: false, // 遊戲是否進行中
};

// 比分狀態管理
let gameScore = {
  home: 0, // 主隊得分
  away: 0, // 客隊得分
};

/**
 * 格式化時間顯示
 * @param {number} minutes - 分鐘數
 * @param {number} seconds - 秒數
 * @returns {string} 格式化的時間字符串
 */
function formatTime(minutes, seconds) {
  const paddedMinutes = minutes.toString().padStart(2, "0");
  const paddedSeconds = seconds.toString().padStart(2, "0");
  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * 更新計時器顯示
 */
function updateTimerDisplay() {
  const timeElement = document.querySelector(".game-time");
  if (timeElement) {
    timeElement.textContent = formatTime(gameTimer.minutes, gameTimer.seconds);
  }
}

/**
 * 計算當前時間基於已過時間
 */
function calculateCurrentTime() {
  const remainingMs = gameTimer.totalTimeMs - gameTimer.elapsedTimeMs;
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  gameTimer.minutes = Math.floor(remainingSeconds / 60);
  gameTimer.seconds = remainingSeconds % 60;
}

/**
 * 啟動計時器
 */
function startTimer() {
  if (gameTimer.isRunning) return;

  gameTimer.isRunning = true;
  gameTimer.isPaused = false;

  const startTime = Date.now() - gameTimer.elapsedTimeMs;

  gameTimer.intervalId = setInterval(() => {
    if (gameTimer.isPaused) return;

    gameTimer.elapsedTimeMs = Date.now() - startTime;

    // 檢查是否時間結束
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
  }, 100); // 每100毫秒更新一次顯示

  console.log("⏰ 計時器啟動");
}

/**
 * 暫停計時器
 */
function pauseTimer() {
  gameTimer.isPaused = true;
  console.log("⏸️ 計時器暫停");
}

/**
 * 恢復計時器
 */
function resumeTimer() {
  gameTimer.isPaused = false;
  console.log("▶️ 計時器恢復");
}

/**
 * 停止計時器
 */
function stopTimer() {
  if (gameTimer.intervalId) {
    clearInterval(gameTimer.intervalId);
    gameTimer.intervalId = null;
  }
  gameTimer.isRunning = false;
  gameTimer.isPaused = false;
  console.log("⏹️ 計時器停止");
}

/**
 * 重置計時器
 */
function resetTimer() {
  stopTimer();
  gameTimer.minutes = 90;
  gameTimer.seconds = 0;
  gameTimer.elapsedTimeMs = 0;
  updateTimerDisplay();
  console.log("🔄 計時器重置");
}

/**
 * 顯示比賽結束畫面
 */
function showGameOverScreen() {
  // 建立遊戲結束覆蓋層
  const gameOverOverlay = document.createElement("div");
  gameOverOverlay.style.position = "fixed";
  gameOverOverlay.style.top = "0";
  gameOverOverlay.style.left = "0";
  gameOverOverlay.style.width = "100%";
  gameOverOverlay.style.height = "100%";
  gameOverOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  gameOverOverlay.style.zIndex = "2000";
  gameOverOverlay.style.display = "flex";
  gameOverOverlay.style.flexDirection = "column";
  gameOverOverlay.style.justifyContent = "center";
  gameOverOverlay.style.alignItems = "center";
  gameOverOverlay.style.fontFamily = "Arial, sans-serif";
  gameOverOverlay.style.color = "white";
  gameOverOverlay.style.textAlign = "center";

  // 比賽結束標題
  const gameOverTitle = document.createElement("h1");
  gameOverTitle.textContent = "Game Over！";
  gameOverTitle.style.fontSize = "48px";
  gameOverTitle.style.color = "#FFD700";
  gameOverTitle.style.textShadow = "4px 4px 8px rgba(0, 0, 0, 0.8)";
  gameOverTitle.style.marginBottom = "30px";

  // 最終比分
  const finalScore = document.createElement("div");
  finalScore.innerHTML = `
    <div style="font-size: 36px; margin-bottom: 20px;">Final Score</div>
    <div style="font-size: 48px; font-weight: bold; margin-bottom: 30px;">
      Home ${gameScore.home} - ${gameScore.away} Away
    </div>
  `;

  // 比賽結果
  const matchResult = document.createElement("div");
  matchResult.style.fontSize = "24px";
  matchResult.style.marginBottom = "40px";

  if (gameScore.home > gameScore.away) {
    matchResult.textContent = "🎉 Home Win！";
    matchResult.style.color = "#4CAF50";
  } else if (gameScore.away > gameScore.home) {
    matchResult.textContent = "🎉 Away Win！";
    matchResult.style.color = "#4CAF50";
  } else {
    matchResult.textContent = "🤝 Draw！";
    matchResult.style.color = "#FFC107";
  }

  // 重新開始按鈕
  const restartButton = document.createElement("button");
  restartButton.textContent = "New Game";
  restartButton.style.fontSize = "20px";
  restartButton.style.padding = "15px 30px";
  restartButton.style.backgroundColor = "#4a8c4a";
  restartButton.style.color = "white";
  restartButton.style.border = "none";
  restartButton.style.borderRadius = "8px";
  restartButton.style.cursor = "pointer";
  restartButton.style.fontWeight = "bold";
  restartButton.style.transition = "all 0.3s ease";

  restartButton.addEventListener("mouseenter", () => {
    restartButton.style.backgroundColor = "#3d7a3d";
    restartButton.style.transform = "translateY(-2px)";
  });

  restartButton.addEventListener("mouseleave", () => {
    restartButton.style.backgroundColor = "#4a8c4a";
    restartButton.style.transform = "translateY(0)";
  });

  restartButton.addEventListener("click", () => {
    // 移除遊戲結束畫面
    document.body.removeChild(gameOverOverlay);
    // 重置遊戲
    resetGameToInitialState();
  });

  // 組裝元素
  gameOverOverlay.appendChild(gameOverTitle);
  gameOverOverlay.appendChild(finalScore);
  gameOverOverlay.appendChild(matchResult);
  gameOverOverlay.appendChild(restartButton);

  // 添加到頁面
  document.body.appendChild(gameOverOverlay);
}

/**
 * 遊戲時間結束處理
 */
function onGameTimeUp() {
  console.log("⏰ 比賽時間結束！");
  console.log(`📊 最終比分: 主隊 ${gameScore.home} - ${gameScore.away} 客隊`);

  // 設定遊戲狀態為非活躍
  gameState.isGameActive = false;

  // 停止物理引擎
  Engine.clear(engine);

  // 顯示比賽結束畫面
  showGameOverScreen();
}

/**
 * 更新計分板顯示
 */
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

/**
 * 重置比分
 */
function resetScore() {
  gameScore.home = 0;
  gameScore.away = 0;
  updateScoreDisplay();
}

/**
 * 開始遊戲
 */
function startGame() {
  if (gameState.isGameStarted) {
    console.log("🎮 遊戲已經開始");
    return;
  }

  gameState.isGameStarted = true;
  gameState.isGameActive = true;

  // 設定隨機初始速度
  const velocityOptions = [
    { x: 4.0, y: 8.0 }, // lower
    { x: -4.0, y: 8.0 }, // lower
    { x: 4.0, y: -8.0 }, // upper
    { x: -4.0, y: -8.0 }, // upper
    // { x: 8.0, y: 4.0 }, // upper
    // { x: -8.0, y: 4.0 }, // upper
    // { x: 8.0, y: -4.0 }, // lower
    // { x: -8.0, y: -4.0 }, // lower
    // { x: 6.0, y: 6.0 }, // lower
    // { x: -6.0, y: 6.0 }, // lower
    // { x: 6.0, y: -6.0 }, // upper
    // { x: -6.0, y: -6.0 }, // upper
  ];

  // prettier-ignore
  const randomVelocity = velocityOptions[Math.floor(Math.random() * velocityOptions.length)];
  Body.setVelocity(currentBall, randomVelocity);

  // 啟動計時器
  startTimer();

  console.log("🚀 遊戲開始！初始速度:", randomVelocity);
}

// ========================================
// 物理引擎初始化
// ========================================

// 建立物理引擎並設定重力
const engine = Engine.create();
engine.world.gravity.x = 0; // 無水平重力
engine.world.gravity.y = 0; // 無垂直重力

// 建立畫布渲染器
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
// 足球場邊界建立
// ========================================

// 建立場地邊界牆壁（扣除球門位置）
const walls = [
  // 上邊界 - 左半部（球門左側）
  Bodies.rectangle(
    (CANVAS_WIDTH - GOAL_WIDTH) / 4,
    5,
    (CANVAS_WIDTH - GOAL_WIDTH) / 2,
    10,
    {
      isStatic: true,
      restitution: 1.0, // 完全彈性碰撞
      friction: 0.0,
      frictionStatic: 0.0,
      frictionAir: 0.0,
      density: 1.0,
      inertia: Infinity,
      angularVelocity: 0.0,
      render: { fillStyle: "#ffffff" },
    }
  ),

  // 上邊界 - 右半部（球門右側）
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

  // 下邊界 - 左半部（球門左側）
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

  // 下邊界 - 右半部（球門右側）
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

  // 左邊界（完整側邊線）
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

  // 右邊界（完整側邊線）
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
// 足球物件建立
// ========================================

// 建立足球物體
const ball = Bodies.circle(
  CANVAS_WIDTH / 2, // 起始位置：場地中心
  CANVAS_HEIGHT / 2,
  BALL_RADIUS,
  {
    restitution: 1.0, // 完全彈性碰撞
    friction: 0.0,
    frictionStatic: 0.0,
    frictionAir: 0.0,
    density: 1.0,
    inertia: Infinity,
    angularVelocity: 0.0,
    render: {
      sprite: {
        texture: "./ball.png", // 足球貼圖
        xScale: (BALL_RADIUS * 2) / 534, // 縮放比例
        yScale: (BALL_RADIUS * 2) / 534,
      },
    },
  }
);

// 設定足球初始移動速度（遊戲開始前保持靜止）
// 遊戲開始時才會設定速度

// ========================================
// 足球場標線建立
// ========================================

// 中圈標線
const centerCircle = Bodies.circle(
  CANVAS_WIDTH / 2,
  CANVAS_HEIGHT / 2,
  CENTER_CIRCLE_RADIUS,
  {
    isStatic: true,
    isSensor: true, // 不影響物理碰撞
    render: {
      fillStyle: "transparent",
      strokeStyle: "#ffffff",
      lineWidth: 2,
    },
  }
);

// 中線
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

// 禁區標線 - 上方
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

// 禁區標線 - 下方
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

// 小禁區標線 - 上方
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

// 小禁區標線 - 下方
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

// 角球弧標線
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
// 球門偵測區域建立
// ========================================

// 上方球門感應區
const upperGoalSensor = Bodies.rectangle(CANVAS_WIDTH / 2, -5, GOAL_WIDTH, 15, {
  isStatic: true,
  isSensor: true,
  render: {
    fillStyle: "rgba(0, 255, 0, 0.3)", // 半透明綠色（偵錯用）
  },
  label: "upperGoal", // 用於識別的標籤
});

// 下方球門感應區
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
// 物理世界建構
// ========================================

// 將所有物體加入物理世界
World.add(engine.world, [
  ...walls, // 邊界牆壁
  ball, // 足球
  upperGoalSensor, // 球門感應器
  lowerGoalSensor,
  centerCircle, // 場地標線
  centerLine,
  upperPenaltyAreaTop, // 禁區標線
  upperPenaltyAreaLeft,
  upperPenaltyAreaRight,
  lowerPenaltyAreaBottom,
  lowerPenaltyAreaLeft,
  lowerPenaltyAreaRight,
  upperGoalAreaTop, // 小禁區標線
  upperGoalAreaLeft,
  upperGoalAreaRight,
  lowerGoalAreaBottom,
  lowerGoalAreaLeft,
  lowerGoalAreaRight,
  topLeftCornerArc, // 角球弧
  topRightCornerArc,
  bottomLeftCornerArc,
  bottomRightCornerArc,
]);

// ========================================
// 遊戲重置系統
// ========================================

// 當前足球物件參考
let currentBall = ball;

/**
 * 完全重置遊戲到初始狀態
 * 清除所有物體並重新建立足球和物理世界
 */
function resetGameToInitialState() {
  // 清除物理世界
  World.clear(engine.world);
  Engine.clear(engine);

  // 重設物理引擎參數
  engine.world.gravity.x = 0;
  engine.world.gravity.y = 0;

  // 重新建立足球
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

  // 初始狀態足球保持靜止，等待遊戲開始
  Body.setVelocity(currentBall, { x: 0, y: 0 });

  // 重新添加所有物體到世界
  World.add(engine.world, [
    ...walls,
    currentBall,
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

  // 重置計時器和比分
  resetTimer();
  resetScore();

  // 重置遊戲狀態
  gameState.isGameStarted = false;
  gameState.isGameActive = false;

  // 重新啟動物理引擎
  Runner.run(Runner.create(), engine);

  // 足球停止移動
  Body.setVelocity(currentBall, { x: 0, y: 0 });

  console.log("🔄 遊戲已重置到初始狀態");
}

// ========================================
// 進球動畫系統
// ========================================

/**
 * 重置足球到中心位置並設定新的隨機速度
 */
function resetBallToCenter() {
  // 將足球移動到場地中心
  Body.setPosition(currentBall, { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 });

  // 設定隨機的初始速度
  const velocityOptions = [
    { x: 4.0, y: 8.0 }, // lower
    { x: -4.0, y: 8.0 }, // lower
    { x: 4.0, y: -8.0 }, // upper
    { x: -4.0, y: -8.0 }, // upper
    // { x: 8.0, y: 4.0 }, // upper
    // { x: -8.0, y: 4.0 }, // upper
    // { x: 8.0, y: -4.0 }, // lower
    // { x: -8.0, y: -4.0 }, // lower
    // { x: 6.0, y: 6.0 }, // lower
    // { x: -6.0, y: 6.0 }, // lower
    // { x: 6.0, y: -6.0 }, // upper
    // { x: -6.0, y: -6.0 }, // upper
  ];

  // 隨機選擇一個速度
  const randomVelocity =
    velocityOptions[Math.floor(Math.random() * velocityOptions.length)];
  Body.setVelocity(currentBall, randomVelocity);

  console.log("⚽ 足球已重置到中心點，新速度:", randomVelocity);
}

/**
 * 顯示進球動畫效果
 * @param {string} message - 顯示的進球訊息
 */
function showGoalAnimation(message) {
  // 暫停計時器
  pauseTimer();

  // 建立動畫文字元素
  const goalText = document.createElement("div");
  goalText.textContent = message;
  goalText.style.position = "absolute";
  goalText.style.left = "50%";
  goalText.style.top = "50%";
  goalText.style.transform = "translate(-50%, -50%)";
  goalText.style.fontSize = "48px";
  goalText.style.fontWeight = "bold";
  goalText.style.color = "#FFD700"; // 金色文字
  goalText.style.textShadow = "4px 4px 8px rgba(0, 0, 0, 0.8)";
  goalText.style.zIndex = "1000";
  goalText.style.pointerEvents = "none";
  goalText.style.fontFamily = "Arial, sans-serif";
  goalText.style.textAlign = "center";
  goalText.style.whiteSpace = "nowrap";

  // 設定初始動畫狀態
  goalText.style.opacity = "0";
  goalText.style.transform = "translate(-50%, -50%) scale(0.5)";
  goalText.style.transition = "all 0.3s ease-out";

  // 將文字加入畫布容器
  const canvasContainer = document.getElementById("game-canvas").parentElement;
  canvasContainer.style.position = "relative";
  canvasContainer.appendChild(goalText);

  // 分階段動畫效果
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

  // 清除動畫元素，重置足球位置，並恢復計時器
  setTimeout(() => {
    if (goalText.parentElement) {
      goalText.parentElement.removeChild(goalText);
    }

    // 重置足球到中心點
    resetBallToCenter();

    // 恢復計時器，遊戲繼續進行
    resumeTimer();
  }, 2000);
}

// ========================================
// 進球偵測事件處理
// ========================================

// 監聽物體碰撞事件
Events.on(engine, "collisionStart", function (event) {
  const pairs = event.pairs;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const { bodyA, bodyB } = pair;

    // 檢查是否為足球與球門感應器的碰撞（只在遊戲進行中才有效）
    if (
      gameState.isGameActive &&
      ((bodyA === currentBall &&
        (bodyB.label === "upperGoal" || bodyB.label === "lowerGoal")) ||
        (bodyB === currentBall &&
          (bodyA.label === "upperGoal" || bodyA.label === "lowerGoal")))
    ) {
      const goalSensor = bodyA === currentBall ? bodyB : bodyA;

      // 根據球門位置顯示進球訊息和更新比分
      if (goalSensor.label === "upperGoal") {
        console.log("🥅 上方球門進球！主隊得分！");
        gameScore.home++; // 主隊得分
        updateScoreDisplay();
        showGoalAnimation("Home Team Goal！");
      } else if (goalSensor.label === "lowerGoal") {
        console.log("🥅 下方球門進球！客隊得分！");
        gameScore.away++; // 客隊得分
        updateScoreDisplay();
        showGoalAnimation("Away Team Goal！");
      }
    }
  }
});

// ========================================
// 足球彩票投注系統
// ========================================

// 投注系統狀態管理
let bettingState = {
  selectedBets: [], // 選中但未確認的投注
  balance: 10000, // 帳戶餘額
  confirmedBets: [], // 已確認的投注記錄
};

// 賠率設定表
const ODDS_TABLE = {
  result: {
    home: 1.8, // 主隊勝
    draw: 3.2, // 平局
    away: 2.1, // 客隊勝
  },
  total: {
    over: 1.9, // 大分
    under: 1.8, // 小分
  },
  parity: {
    odd: 1.9, // 單數
    even: 1.9, // 雙數
  },
};

// 投注項目中文名稱對照
const BET_NAMES = {
  result: {
    home: "Home",
    draw: "Draw",
    away: "Away",
  },
  total: {
    over: "Big (> 9.5)",
    under: "Small (≤ 9.5)",
  },
  parity: {
    odd: "Odd",
    even: "Even",
  },
};

/**
 * 初始化投注系統
 * 綁定所有投注相關的事件監聽器
 */
function initBettingSystem() {
  // 綁定投注按鈕點擊事件
  document.querySelectorAll(".bet-btn").forEach((btn) => {
    btn.addEventListener("click", handleBetSelection);
  });

  // 綁定操作按鈕事件
  document.getElementById("clear-bets").addEventListener("click", clearAllBets);
  document.getElementById("place-bet").addEventListener("click", placeBets);

  // 初始化顯示
  updateBetSlip();
  updateSelectedBets();
  updateBalance();
}

/**
 * 處理投注選擇邏輯
 * @param {Event} event - 按鈕點擊事件
 */
function handleBetSelection(event) {
  const btn = event.currentTarget;
  const betType = btn.dataset.type;
  const betValue = btn.dataset.value;
  const odds = ODDS_TABLE[betType][betValue];

  // 檢查是否已有相同類型的投注
  const existingBetIndex = bettingState.selectedBets.findIndex(
    (bet) => bet.type === betType
  );

  if (existingBetIndex !== -1) {
    // 如果點擊相同選項則取消選擇
    if (bettingState.selectedBets[existingBetIndex].value === betValue) {
      bettingState.selectedBets.splice(existingBetIndex, 1);
      btn.classList.remove("selected");
    } else {
      // 替換為新的選擇
      bettingState.selectedBets[existingBetIndex] = {
        type: betType,
        value: betValue,
        odds: odds,
        amount: 100, // 固定投注金額
      };

      // 更新按鈕選中狀態
      document
        .querySelectorAll(`[data-type="${betType}"]`)
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    }
  } else {
    // 新增投注項目
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

/**
 * 清除所有選中的投注
 */
function clearAllBets() {
  bettingState.selectedBets = [];
  document
    .querySelectorAll(".bet-btn")
    .forEach((btn) => btn.classList.remove("selected"));
  updateSelectedBets();
}

/**
 * 更新投注按鈕狀態
 */
function updateSelectedBets() {
  const placeBetBtn = document.getElementById("place-bet");
  placeBetBtn.disabled = bettingState.selectedBets.length === 0;
}

/**
 * 確認投注處理
 */
function placeBets() {
  if (bettingState.selectedBets.length === 0) {
    alert("請選擇投注項目！");
    return;
  }

  const totalAmount = bettingState.selectedBets.reduce(
    (sum, bet) => sum + bet.amount,
    0
  );

  if (totalAmount > bettingState.balance) {
    alert("餘額不足！");
    return;
  }

  // 扣除投注金額
  bettingState.balance -= totalAmount;

  // 記錄投注
  bettingState.confirmedBets.push({
    timestamp: Date.now(),
    bets: [...bettingState.selectedBets],
    status: "pending",
  });

  // 清除選擇並更新顯示
  clearAllBets();
  updateBalance();
  updateBetSlip();

  // 開始遊戲
  startGame();
}

/**
 * 更新投注單顯示
 */
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
    betGroup.bets.forEach((bet) => {
      const name = BET_NAMES[bet.type][bet.value];
      const potentialWin = Math.round(bet.amount * bet.odds);
      groupTotal += bet.amount;

      html += `
        <div class="bet-item">
          <div class="bet-item-info">
            <div class="bet-item-name">${name}</div>
            <div class="bet-item-odds">Odds: ${bet.odds} | Win Amount: ${potentialWin}元</div>
          </div>
          <div class="bet-item-amount">${bet.amount}元</div>
          <div style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 600; background: #fff3cd; color: #856404;">Wait for Result</div>
        </div>
      `;
    });

    html += `<div style="background: #f0f8f0; padding: 8px 12px; text-align: right; font-weight: 600; color: #4a8c4a; font-size: 13px; border-top: 1px solid #e0e0e0;">Total: ${groupTotal}元</div>`;
    html += `</div>`;
  });

  betSlip.innerHTML = html;
}

/**
 * 更新餘額顯示
 */
function updateBalance() {
  document.getElementById("balance").textContent =
    bettingState.balance.toLocaleString();
}

// ========================================
// 遊戲啟動
// ========================================

// 建立 Runner 實例
const runner = Runner.create();

// 啟動渲染器和物理引擎
Render.run(render);
Runner.run(runner, engine);

// 頁面載入完成後初始化投注系統
document.addEventListener("DOMContentLoaded", function () {
  initBettingSystem();

  // 初始化計時器和比分顯示
  updateTimerDisplay();
  updateScoreDisplay();

  console.log("📱 遊戲已載入，請選擇投注項目並確認投注開始遊戲");
});

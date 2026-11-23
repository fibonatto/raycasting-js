const TILE_SIZE = 64;

// Tamanho do mundo (use números ÍMPARES para o gerador de labirinto funcionar perfeitamente)
const MAP_NUM_ROWS = 41;
const MAP_NUM_COLS = 41;
const WORLD_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WORLD_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

// Tamanho fixo da viewport (tela)
const WINDOW_WIDTH = 960;
const WINDOW_HEIGHT = 640;

const FOV_ANGLE = 60 * (Math.PI / 180);
const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

var gameWon = false;

class Map {
  constructor() {
    this.grid = [];
    this.distGrid = [];
    this.maxDist = 1;
    this.spawnPoint = { x: 0, y: 0 };
    this.exitPoint = { x: 0, y: 0 };
    this.exitGridPos = { r: 0, c: 0 };
    this.generateBackDoomMaze();
  }

  generateBackDoomMaze() {
    // 1. Preenche tudo com paredes (1)
    this.grid = Array.from({ length: MAP_NUM_ROWS }, () =>
      Array(MAP_NUM_COLS).fill(1)
    );

    // 2. Recursive Backtracker
    const stack = [];
    const startR = 1;
    const startC = 1;
    this.grid[startR][startC] = 0;
    stack.push([startR, startC]);

    const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]];

    while (stack.length > 0) {
      const [r, c] = stack[stack.length - 1];
      const neighbors = [];

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr > 0 && nr < MAP_NUM_ROWS - 1 &&
          nc > 0 && nc < MAP_NUM_COLS - 1 &&
          this.grid[nr][nc] === 1
        ) {
          neighbors.push([nr, nc, dr / 2, dc / 2]);
        }
      }

      if (neighbors.length > 0) {
        const [nr, nc, wallR, wallC] = neighbors[Math.floor(Math.random() * neighbors.length)];
        this.grid[r + wallR][c + wallC] = 0;
        this.grid[nr][nc] = 0;
        stack.push([nr, nc]);
      } else {
        stack.pop();
      }
    }

    // 3. Adiciona salas estilo Backrooms / Arenas estilo DOOM
    const numRooms = Math.floor((MAP_NUM_ROWS * MAP_NUM_COLS) / 140);
    for (let i = 0; i < numRooms; i++) {
      const roomW = Math.floor(Math.random() * 3) + 3;
      const roomH = Math.floor(Math.random() * 3) + 3;
      const r0 = Math.floor(Math.random() * (MAP_NUM_ROWS - roomH - 2)) + 1;
      const c0 = Math.floor(Math.random() * (MAP_NUM_COLS - roomW - 2)) + 1;

      for (let r = r0; r < r0 + roomH; r++) {
        for (let c = c0; c < c0 + roomW; c++) {
          this.grid[r][c] = 0;
        }
      }
    }

    // 4. Braiding: remove alguns becos sem saída para criar loops
    for (let r = 1; r < MAP_NUM_ROWS - 1; r += 2) {
      for (let c = 1; c < MAP_NUM_COLS - 1; c += 2) {
        if (this.grid[r][c] === 0 && Math.random() < 0.25) {
          const walls = [];
          if (r > 1 && this.grid[r - 1][c] === 1) walls.push([r - 1, c]);
          if (r < MAP_NUM_ROWS - 2 && this.grid[r + 1][c] === 1) walls.push([r + 1, c]);
          if (c > 1 && this.grid[r][c - 1] === 1) walls.push([r, c - 1]);
          if (c < MAP_NUM_COLS - 2 && this.grid[r][c + 1] === 1) walls.push([r, c + 1]);

          if (walls.length >= 3) {
            const [wr, wc] = walls[Math.floor(Math.random() * walls.length)];
            this.grid[wr][wc] = 0;
          }
        }
      }
    }

    // 5. Define Ponto A (1,1) e usa BFS para achar o Ponto B mais distante
    this.spawnPoint = {
      x: 1 * TILE_SIZE + TILE_SIZE / 2,
      y: 1 * TILE_SIZE + TILE_SIZE / 2
    };

    const furthest = this.findFurthestPoint(1, 1);
    this.exitGridPos = { r: furthest.r, c: furthest.c };
    this.exitPoint = {
      x: furthest.c * TILE_SIZE + TILE_SIZE / 2,
      y: furthest.r * TILE_SIZE + TILE_SIZE / 2
    };

    // 6. Calcula o campo de distância a partir de B
    this.computeDistanceField(furthest.r, furthest.c);
  }

  findFurthestPoint(startR, startC) {
    const visited = Array.from({ length: MAP_NUM_ROWS }, () => Array(MAP_NUM_COLS).fill(false));
    const queue = [[startR, startC, 0]];
    visited[startR][startC] = true;
    let furthest = { r: startR, c: startC, dist: 0 };

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
      const [r, c, dist] = queue.shift();
      if (dist > furthest.dist) {
        furthest = { r, c, dist };
      }

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < MAP_NUM_ROWS &&
          nc >= 0 && nc < MAP_NUM_COLS &&
          !visited[nr][nc] &&
          this.grid[nr][nc] === 0
        ) {
          visited[nr][nc] = true;
          queue.push([nr, nc, dist + 1]);
        }
      }
    }

    return furthest;
  }

  computeDistanceField(exitR, exitC) {
    this.distGrid = Array.from({ length: MAP_NUM_ROWS }, () =>
      Array(MAP_NUM_COLS).fill(-1)
    );
    const queue = [[exitR, exitC, 0]];
    this.distGrid[exitR][exitC] = 0;
    this.maxDist = 1;

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    while (queue.length > 0) {
      const [r, c, dist] = queue.shift();
      if (dist > this.maxDist) this.maxDist = dist;

      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 && nr < MAP_NUM_ROWS &&
          nc >= 0 && nc < MAP_NUM_COLS &&
          this.grid[nr][nc] === 0 &&
          this.distGrid[nr][nc] === -1
        ) {
          this.distGrid[nr][nc] = dist + 1;
          queue.push([nr, nc, dist + 1]);
        }
      }
    }

    // Propaga a distância dos corredores para as paredes adjacentes
    for (let r = 0; r < MAP_NUM_ROWS; r++) {
      for (let c = 0; c < MAP_NUM_COLS; c++) {
        if (this.grid[r][c] === 1) {
          let minNeighborDist = Infinity;
          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (
              nr >= 0 && nr < MAP_NUM_ROWS &&
              nc >= 0 && nc < MAP_NUM_COLS &&
              this.distGrid[nr][nc] !== -1
            ) {
              minNeighborDist = Math.min(minNeighborDist, this.distGrid[nr][nc]);
            }
          }
          this.distGrid[r][c] = minNeighborDist === Infinity ? this.maxDist : minNeighborDist;
        }
      }
    }
  }

  getNormalizedDistanceAt(x, y) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    if (row < 0 || row >= MAP_NUM_ROWS || col < 0 || col >= MAP_NUM_COLS) return 1.0;

    return this.distGrid[row][col] / this.maxDist;
  }

  hasWallAt(x, y) {
    if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return true;
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    return this.grid[row][col] !== 0;
  }
}

class Player {
  constructor(spawnPoint) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.radius = 3;
    this.turnDirection = 0;
    this.walkDirection = 0;
    this.rotationAngle = Math.PI / 2;
    this.moveSpeed = 3.0;
    this.rotationSpeed = 2.5 * (Math.PI / 180);
  }

  update() {
    this.rotationAngle += this.turnDirection * this.rotationSpeed;

    var moveStep = this.walkDirection * this.moveSpeed;
    var newPlayerX = this.x + Math.cos(this.rotationAngle) * moveStep;
    var newPlayerY = this.y + Math.sin(this.rotationAngle) * moveStep;

    const margin = 10;
    const dirX = Math.cos(this.rotationAngle) * this.walkDirection;
    const dirY = Math.sin(this.rotationAngle) * this.walkDirection;

    const checkX = newPlayerX + dirX * margin;
    const checkY = newPlayerY + dirY * margin;

    if (!grid.hasWallAt(checkX, this.y)) {
      this.x = newPlayerX;
    }
    if (!grid.hasWallAt(this.x, checkY)) {
      this.y = newPlayerY;
    }

    // Verifica se chegou no Ponto B
    const distToExit = distanceBetweenPoints(this.x, this.y, grid.exitPoint.x, grid.exitPoint.y);
if (distToExit < TILE_SIZE * 0.6) {
      gameWon = true;
    }

  }
}

class Ray {
  constructor(rayAngle) {
    this.rayAngle = normalizeAngle(rayAngle);
    this.wallHitX = 0;
    this.wallHitY = 0;
    this.distance = 0;
    this.wasHitVertical = false;
    this.wallHeat = 1.0;

    this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
    this.isRayFacingUp = !this.isRayFacingDown;

    this.isRayFacingRight = this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI;
    this.isRayFacingLeft = !this.isRayFacingRight;
  }

  cast() {
    var xintercept;
    var yintercept;
    var xstep;
    var ystep;

    // HORIZONTAL RAY-GRID INTERSECTION
    var foundHorzWallHit = false;
    var horzWallHitX = 0;
    var horzWallHitY = 0;

    yintercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
    yintercept += this.isRayFacingDown ? TILE_SIZE : 0;
    xintercept = player.x + (yintercept - player.y) / Math.tan(this.rayAngle);

    ystep = TILE_SIZE;
    ystep *= this.isRayFacingUp ? -1 : 1;

    xstep = TILE_SIZE / Math.tan(this.rayAngle);
    xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
    xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

    var nextHorzTouchX = xintercept;
    var nextHorzTouchY = yintercept;

    while (
      nextHorzTouchX >= 0 &&
      nextHorzTouchX <= WORLD_WIDTH &&
      nextHorzTouchY >= 0 &&
      nextHorzTouchY <= WORLD_HEIGHT
    ) {
      if (grid.hasWallAt(nextHorzTouchX, nextHorzTouchY - (this.isRayFacingUp ? 1 : 0))) {
        foundHorzWallHit = true;
        horzWallHitX = nextHorzTouchX;
        horzWallHitY = nextHorzTouchY;
        break;
      } else {
        nextHorzTouchX += xstep;
        nextHorzTouchY += ystep;
      }
    }

    // VERTICAL RAY-GRID INTERSECTION
    var foundVertWallHit = false;
    var vertWallHitX = 0;
    var vertWallHitY = 0;

    xintercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
    xintercept += this.isRayFacingRight ? TILE_SIZE : 0;
    yintercept = player.y + (xintercept - player.x) * Math.tan(this.rayAngle);

    xstep = TILE_SIZE;
    xstep *= this.isRayFacingLeft ? -1 : 1;

    ystep = TILE_SIZE * Math.tan(this.rayAngle);
    ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
    ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

    var nextVertTouchX = xintercept;
    var nextVertTouchY = yintercept;

    while (
      nextVertTouchX >= 0 &&
      nextVertTouchX <= WORLD_WIDTH &&
      nextVertTouchY >= 0 &&
      nextVertTouchY <= WORLD_HEIGHT
    ) {
      if (grid.hasWallAt(nextVertTouchX - (this.isRayFacingLeft ? 1 : 0), nextVertTouchY)) {
        foundVertWallHit = true;
        vertWallHitX = nextVertTouchX;
        vertWallHitY = nextVertTouchY;
        break;
      } else {
        nextVertTouchX += xstep;
        nextVertTouchY += ystep;
      }
    }

    var horzHitDistance = foundHorzWallHit
      ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY)
      : Number.MAX_VALUE;
    var vertHitDistance = foundVertWallHit
      ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY)
      : Number.MAX_VALUE;

    if (vertHitDistance < horzHitDistance) {
      this.wallHitX = vertWallHitX;
      this.wallHitY = vertWallHitY;
      this.distance = vertHitDistance;
      this.wasHitVertical = true;
    } else {
      this.wallHitX = horzWallHitX;
      this.wallHitY = horzWallHitY;
      this.distance = horzHitDistance;
      this.wasHitVertical = false;
    }

    const checkX = this.wallHitX + (this.wasHitVertical ? (this.isRayFacingLeft ? -1 : 1) : 0);
    const checkY = this.wallHitY + (!this.wasHitVertical ? (this.isRayFacingUp ? -1 : 1) : 0);
    this.wallHeat = grid.getNormalizedDistanceAt(checkX, checkY);
  }
}

var grid = new Map();
var player = new Player(grid.spawnPoint);
var rays = [];

const KEY_ACTIONS = {
  k: { prop: 'walkDirection', value: +1 },
  j: { prop: 'walkDirection', value: -1 },
  l: { prop: 'turnDirection', value: +1 },
  h: { prop: 'turnDirection', value: -1 },

  w: { prop: 'walkDirection', value: +1 },
  a: { prop: 'turnDirection', value: -1 },
  s: { prop: 'walkDirection', value: -1 },
  d: { prop: 'turnDirection', value: +1 },
};

function keyPressed() {
    if (gameWon && (key === 'Enter' || key.toLowerCase() === 'r')) {
    gameWon = false;
    grid = new Map();
    player = new Player(grid.spawnPoint);
    return;
  }

  const action = KEY_ACTIONS[key.toLowerCase()];
  if (action) player[action.prop] = action.value;
}

function keyReleased() {
  const action = KEY_ACTIONS[key.toLowerCase()];
  if (action) player[action.prop] = 0;
}

function castAllRays() {
  var rayAngle = player.rotationAngle - (FOV_ANGLE / 2);
  rays = [];

  for (var col = 0; col < NUM_RAYS; col++) {
    var ray = new Ray(rayAngle);
    ray.cast();
    rays.push(ray);
    rayAngle += FOV_ANGLE / NUM_RAYS;
  }
}

function render3dProjectedWalls() {
  // Teto e chão para dar profundidade espacial
  noStroke();
  fill(25, 25, 20);
  rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT / 2);
  fill(45, 42, 35);
  rect(0, WINDOW_HEIGHT / 2, WINDOW_WIDTH, WINDOW_HEIGHT / 2);

  for (var i = 0; i < NUM_RAYS; i++) {
    var ray = rays[i];
    var correctWallDistance = ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);
    var distanceProjectionPlane = (WINDOW_WIDTH / 2) / Math.tan(FOV_ANGLE / 2);
    var wallStripHeight = (TILE_SIZE / correctWallDistance) * distanceProjectionPlane;

    var fog = Math.min(1, 240 / correctWallDistance);
    var sideShade = ray.wasHitVertical ? 1.0 : 0.72;
    var light = fog * sideShade;

    var t = Math.max(0, Math.min(1, ray.wallHeat));

    // Se estiver colado na saída B (t muito próximo de 0), brilha em verde portal
    if (t < 0.05) {
      var pulse = 0.8 + 0.2 * Math.sin(millis() * 0.008);
      fill(80 * light * pulse, 255 * light * pulse, 140 * light * pulse);
    } else {
      // Gradiente: Perto (DOOM vermelho) -> Longe (Backrooms amarelo)
      var nearR = 210, nearG = 35, nearB = 35;
      var farR = 225, farG = 210, farB = 130;

      var r = (nearR + (farR - nearR) * t) * light;
      var g = (nearG + (farG - nearG) * t) * light;
      var b = (nearB + (farB - nearB) * t) * light;
      fill(r, g, b);
    }

    noStroke();
    rect(
      i * WALL_STRIP_WIDTH,
      (WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
      WALL_STRIP_WIDTH,
      wallStripHeight
    );
  }
}

function normalizeAngle(angle) {
  angle = angle % (2 * Math.PI);
  if (angle < 0) {
    angle = (2 * Math.PI) + angle;
  }
  return angle;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function setup() {
  createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function update() {
  player.update();
  castAllRays();
}

function draw() {
  clear();
  if (!gameWon) {
    update();
  }
  render3dProjectedWalls();

  if (gameWon) {
    fill(0, 0, 0, 180);
    rect(0, 0, WINDOW_WIDTH, WINDOW_HEIGHT);

    fill(80, 255, 140);
    textAlign(CENTER, CENTER);
    textSize(36);
    textFont('monospace');
    text("SAÍDA ENCONTRADA", WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 - 20);

    fill(220);
    textSize(16);
    text("Pressione ENTER ou R para um novo labirinto", WINDOW_WIDTH / 2, WINDOW_HEIGHT / 2 + 25);
    textAlign(LEFT, BASELINE);
  }
}

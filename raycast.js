const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180);

const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.12;
// const MINIMAP_SCALE_FACTOR = 1;

class Map {
  constructor() {
    // this.grid = [
    //   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    //   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    //   [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    //   [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    //   [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
    //   [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1],
    //   [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1],
    //   [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    //   [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    //   [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
    //   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    // ]
    this.grid = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    ]
  }
  hasWallAt(x, y) {
    if (x < 0 || x > WINDOW_WIDTH || y < 0 || y > WINDOW_HEIGHT) {
      return true
    }
    var mapGridIndexX = Math.floor(x / TILE_SIZE);
    var mapGridIndexY = Math.floor(y / TILE_SIZE);

    return this.grid[mapGridIndexY][mapGridIndexX] != 0;
  }
  render() {
    for (var i = 0; i < MAP_NUM_ROWS; i++) {
      for (var j = 0; j < MAP_NUM_COLS; j++) {
        var tileX = j * TILE_SIZE;
        var tileY = i * TILE_SIZE;
        var tileColor = this.grid[i][j] == 1 ? "#222" : "#fff";
        stroke("#222");
        fill(tileColor);
        rect(
          tileX * MINIMAP_SCALE_FACTOR,
          tileY * MINIMAP_SCALE_FACTOR,
          TILE_SIZE * MINIMAP_SCALE_FACTOR,
          TILE_SIZE * MINIMAP_SCALE_FACTOR
        );
      }
    }
  }
}

class Player {
  constructor() {
    this.x = WINDOW_WIDTH / 2;
    this.y = WINDOW_HEIGHT / 2;
    this.radius = 3;
    this.turnDirection = 0; // -1 if left, +1 if right 
    this.walkDirection = 0; // -1 if back, +1 if front 
    this.rotationAngle = Math.PI / 2;
    this.moveSpeed = 2.0;
    this.rotationSpeed = 2 * (Math.PI / 180);
  }

  update() {
    // update player position based on turnDirection and walkDirection
    this.rotationAngle += this.turnDirection * this.rotationSpeed;

    var moveStep = this.walkDirection * this.moveSpeed;
    var newPlayerX = this.x + Math.cos(this.rotationAngle) * moveStep;
    var newPlayerY = this.y + Math.sin(this.rotationAngle) * moveStep;

    // only set new player position if it is not colliding with the wall 
    if (!grid.hasWallAt(newPlayerX, newPlayerY)) {
      this.x = newPlayerX;
      this.y = newPlayerY;
    }
  }

  render() {
    noStroke();
    fill("blue");
    circle(
      this.x * MINIMAP_SCALE_FACTOR,
      this.y * MINIMAP_SCALE_FACTOR,
      this.radius * MINIMAP_SCALE_FACTOR
    );
    stroke("red");
    line(
      this.x * MINIMAP_SCALE_FACTOR,
      this.y * MINIMAP_SCALE_FACTOR,
      (this.x + Math.cos(this.rotationAngle) * 30) * MINIMAP_SCALE_FACTOR,
      (this.y + Math.sin(this.rotationAngle) * 30) * MINIMAP_SCALE_FACTOR
    )
  }
}

class Ray {
  constructor(rayAngle) {
    this.rayAngle = normalizeAngle(rayAngle);
    this.wallHitX = 0;
    this.wallHitY = 0;
    this.distance = 0;
    this.wasHitVertical = false;

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

    //////////////////////////////////////////////////////////
    //        HORIZONTAL RAY-GRID INTERSECTION CODE         //
    //////////////////////////////////////////////////////////

    var foundHorzWallHit = false;
    var horzWallHitX = 0;
    var horzWallHitY = 0;

    // find the y-coordinate of the closest horizontal grid intersection 
    yintercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
    yintercept += this.isRayFacingDown ? TILE_SIZE : 0;

    // find the x-coordinate of the closest horizontal grid intersection 
    xintercept = player.x + (yintercept - player.y) / Math.tan(this.rayAngle);

    // calculate the increment of xtep and ystep
    ystep = TILE_SIZE;
    ystep *= this.isRayFacingUp ? -1 : 1;

    xstep = TILE_SIZE / Math.tan(this.rayAngle);
    xstep *= (this.isRayFacingLeft && xstep > 0) ? -1 : 1;
    xstep *= (this.isRayFacingRight && xstep < 0) ? -1 : 1;

    var nextHorzTouchX = xintercept;
    var nextHorzTouchY = yintercept;

    // if (this.isRayFacingUp)
    //   nextHorzTouchY--;

    // increment xstep and ystep until we find a wall
    while (
      nextHorzTouchX >= 0 &&
      nextHorzTouchX <= WINDOW_WIDTH &&
      nextHorzTouchY >= 0 &&
      nextHorzTouchY <= WINDOW_HEIGHT) {
      if (grid.hasWallAt(
        nextHorzTouchX,
        nextHorzTouchY - (this.isRayFacingUp ? 1 : 0))
      ) {
        foundHorzWallHit = true;
        horzWallHitX = nextHorzTouchX;
        horzWallHitY = nextHorzTouchY;
        break
      } else {
        nextHorzTouchX += xstep;
        nextHorzTouchY += ystep;
      }

    }

    //////////////////////////////////////////////////////////
    //        VERTICAL RAY-GRID INTERSECTION CODE         //
    //////////////////////////////////////////////////////////

    var foundVertWallHit = false;
    var vertWallHitX = 0;
    var vertWallHitY = 0;

    // find the x-coordinate of the closest vertical grid intersection 
    xintercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
    xintercept += this.isRayFacingRight ? TILE_SIZE : 0;

    // find the y-coordinate of the closest vertical grid intersection 
    yintercept = player.y + (xintercept - player.x) * Math.tan(this.rayAngle);

    // calculate the increment of xtep and ystep
    xstep = TILE_SIZE;
    xstep *= this.isRayFacingLeft ? -1 : 1;

    ystep = TILE_SIZE * Math.tan(this.rayAngle);
    ystep *= (this.isRayFacingUp && ystep > 0) ? -1 : 1;
    ystep *= (this.isRayFacingDown && ystep < 0) ? -1 : 1;

    var nextVertTouchX = xintercept;
    var nextVertTouchY = yintercept;

    // if (this.isRayFacingLeft)
    //   nextVertTouchX--;

    // increment xstep and ystep until we find a wall
    while (
      nextVertTouchX >= 0 &&
      nextVertTouchX <= WINDOW_WIDTH &&
      nextVertTouchY >= 0 &&
      nextVertTouchY <= WINDOW_HEIGHT) {
      if (grid.hasWallAt(
        nextVertTouchX - (this.isRayFacingLeft ? 1 : 0),
        nextVertTouchY)
      ) {
        foundVertWallHit = true;
        vertWallHitX = nextVertTouchX;
        vertWallHitY = nextVertTouchY;
        break
      } else {
        nextVertTouchX += xstep;
        nextVertTouchY += ystep;
      }
    }

    // calculate both horizontal and vertical distances and choose the smallest value
    var horzHitDistance = (foundHorzWallHit)
      ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY)
      : Number.MAX_VALUE;
    var vertHitDistance = (foundVertWallHit)
      ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY)
      : Number.MAX_VALUE;


    // only store the smallest of distances
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

  }

  render() {
    stroke("rgba(255, 0, 0, 0.3)")
    line(
      player.x * MINIMAP_SCALE_FACTOR,
      player.y * MINIMAP_SCALE_FACTOR,
      this.wallHitX * MINIMAP_SCALE_FACTOR,
      this.wallHitY * MINIMAP_SCALE_FACTOR,
    );
  }
}

var grid = new Map();
var player = new Player();
var rays = [];

const KEY_ACTIONS = {
  // vim mode
  k: { prop: 'walkDirection', value: +1 }, // front
  j: { prop: 'walkDirection', value: -1 }, // back
  l: { prop: 'turnDirection', value: +1 }, // right
  h: { prop: 'turnDirection', value: -1 }, // left

  // easy mode:
  w: { prop: 'walkDirection', value: +1 }, // front
  a: { prop: 'turnDirection', value: -1 }, // left
  s: { prop: 'walkDirection', value: -1 }, // back
  d: { prop: 'turnDirection', value: +1 }, // right
}

function keyPressed() {
  const action = KEY_ACTIONS[key.toLowerCase()];
  if (action) player[action.prop] = action.value
}

function keyReleased() {
  const action = KEY_ACTIONS[key.toLowerCase()];
  if (action) player[action.prop] = 0;
}

function castAllRays() {
  // start first ray subtracting half of the FOV
  var rayAngle = player.rotationAngle - (FOV_ANGLE / 2);

  rays = [];

  // loop all columns casting the rays 
  for (var col = 0; col < NUM_RAYS; col++) {
    var ray = new Ray(rayAngle);
    ray.cast()
    rays.push(ray)
    rayAngle += FOV_ANGLE / NUM_RAYS;
  }
}

function render3dProjectedWalls() {
  // loop every ray in the array of rays
  for (var i = 0; i < NUM_RAYS; i++) {
    var ray = rays[i];

    var correctWallDistance = ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);

    // calculate the distance to the projectrion plane
    var distanceProjectrionPlane = (WINDOW_WIDTH / 2) / Math.tan(FOV_ANGLE / 2)

    // projected wall height
    var wallStripHeight = (TILE_SIZE / correctWallDistance) * distanceProjectrionPlane;
    var alpha = 180 / correctWallDistance;
    var color = ray.wasHitVertical ? 255 : 180;

    fill(`rgba(${color}, ${color}, ${color}, ${alpha})`);
    noStroke();
    rect(
      i * WALL_STRIP_WIDTH,
      (WINDOW_HEIGHT / 2) - (wallStripHeight / 2),
      WALL_STRIP_WIDTH,
      wallStripHeight
    )
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

// initialize all objects
function setup() {
  createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function update() {
  // TODO: update all game objcts before we render the next frame
  player.update();
  castAllRays();
}

function draw() {
  clear("#212121")
  update();
  render3dProjectedWalls();
  // TODO: render all objects frame by frame
  grid.render();
  for (ray of rays) {
    ray.render();
  }
  player.render()

}

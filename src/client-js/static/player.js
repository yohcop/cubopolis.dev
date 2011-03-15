

/**
 * The main player. Holds the position, selected action, etc.
 *
 * @constructor
 */
function Player() {
  this.position = [0, 0, 0, 0, 0];
  this.action = this._build;
  this.actionOpt = "1";

  /** @private */
  this._world = null;
  /** @private */
  this._comm = null;
  /** @private */
  this._renderer = null;
}

Player.prototype.setup = function(comm, world, renderer) {
  this._comm = comm;
  this._world = world;
  this._renderer = renderer
};

Player.prototype.isOn = function(chunkY, chunkX, z, y, x) {
  return chunkY == this.position[0] &&
    chunkX == this.position[1] &&
    z == this.position[2] &&
    y == this.position[3] &&
    x == this.position[4];
};

Player.prototype.setPosition = function(chunkY, chunkX, z, y, x) {
  this.position = [chunkY, chunkX, z, y, x];
  this.moveZ();
};

Player.prototype.moveTo = function(chunkY, chunkX, y, x) {
  var posNow = this.position;
  var newPos = [chunkY, chunkX, 0, y, x];
  this._world.clampCoordinates(newPos);

  floorNow = this._world.floor(posNow[0], posNow[1], posNow[2], posNow[3], posNow[4]);
  newFloor = this._world.floor(newPos[0], newPos[1], newPos[2] + 2, newPos[3], newPos[4]);
  if (floorNow + 1 < newFloor) {
    return;
  }
  this.position = newPos;
  this.position[2] = newFloor;

  this._comm.movePlayer.apply(this._comm, this.position);
  this._renderer.setDirty();
};

Player.prototype.move = function(dy, dx, allowDarknessMove) {
  var posNow = this.position;

  var newPos = [posNow[0], posNow[1], posNow[2], posNow[3], posNow[4]];
  newPos[3] += dy;
  newPos[4] += dx;
  this._world.clampCoordinates(newPos);

  if (!allowDarknessMove && !this._world.hasChunk(newPos[0], newPos[1])) {
    return;
  }
  floorNow = this._world.floor(posNow[0], posNow[1], posNow[2], posNow[3], posNow[4]);
  newFloor = this._world.floor(newPos[0], newPos[1], newPos[2] + 2, newPos[3], newPos[4]);
  if (floorNow + 1 < newFloor) {
    return;
  }
  this.position = newPos;
  this.position[2] = newFloor;

  this._comm.movePlayer.apply(this._comm, this.position);
  this._renderer.setDirty();
};

Player.prototype.moveZ = function() {
  var posNow = this.position;
  var zbefore = posNow[2];
  this.position[2] = this._world.ceiling(
      posNow[0], posNow[1], posNow[2], posNow[3], posNow[4]);
  if (zbefore != this.position[2]) {
    this._comm.movePlayer.apply(this._comm, this.position);
  }
};

Player.prototype.act = function(dy, dx) {
  var g = this.position;
  var c = [g[0], g[1], g[2], g[3] + dy, g[4] + dx];
  this._world.clampCoordinates(c);
  this.action(c);
};

Player.prototype.selectAction = function(id) {
  if (id == 0) {
    this.action = this._destroy;
    this.actionOpt = "0";
    this._renderer.setDirty();
  } else if (id >= 1 && id <= 9) {
    this.actionOpt = "" + id;
    this.action = this._build;
    this._renderer.setDirty();
  }
};

/** @private */
Player.prototype._build = function(c) {
  if (this._world.isLiveChunk(c[0], c[1])) {
    var current = this._world.getCell(c[0], c[1], c[2], c[3], c[4]);
    if (this._world.isEmpty(current)) {
      this._comm.setCell(c[0], c[1], c[2], c[3], c[4], this.actionOpt);
    } else {
      this._comm.setCell(c[0], c[1], c[2] + 1, c[3], c[4], this.actionOpt);
    }
  }
  this._renderer.setDirty();
};

/** @private */
Player.prototype._destroy = function(c) {
  if (this._world.isLiveChunk(c[0], c[1])) {
    var current = this._world.getCell(c[0], c[1], c[2] + 1, c[3], c[4]);
    if (!this._world.isEmpty(current)) {
      this._comm.setCell(c[0], c[1], c[2] + 1, c[3], c[4], "");
    } else {
      this._comm.setCell(c[0], c[1], c[2], c[3], c[4], "");
    }
  }
  this._renderer.setDirty();
};


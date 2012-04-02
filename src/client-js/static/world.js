
/**
 * Holds a representation of the world.
 * @constructor
 */
function World(chunkSize) {
  this.chunkSize = chunkSize;
  this.depth = chunkSize + 1;
  this.content = [];

  /** @private */
  this._playersByChunk = [];
  /** @private */
  this._playersById = {};

  /** @private */
  this._liveChunks = [];
  /** @private */
  this._pendingChunks = [];
}

// p = [chunkY, chunkX, z, y, x].
World.prototype.clampCoordinates = function(p) {
  while (p[3] < 0) {
    p[0] -= 1;
    p[3] += this.chunkSize;
  }
  while (p[4] < 0) {
    p[1] -= 1;
    p[4] += this.chunkSize;
  }
  while (p[3] >= this.chunkSize) {
    p[0] += 1;
    p[3] -= this.chunkSize;
  }
  while (p[4] >= this.chunkSize) {
    p[1] += 1;
    p[4] -= this.chunkSize;
  }
};

// Returns an array with the cell content in the first position,
// and a list of player ids at this position.
World.prototype.getPlayers = function(chunkY, chunkX, cellZ, cellY, cellX) {
  if (!this._playersByChunk[chunkY]
      || !this._playersByChunk[chunkY][chunkX]
      || !this._playersByChunk[chunkY][chunkX][cellY]
      || !this._playersByChunk[chunkY][chunkX][cellY][cellX]
      || !this._playersByChunk[chunkY][chunkX][cellY][cellX][cellZ]) {
    return {};
  }

  return this._playersByChunk[chunkY][chunkX][cellY][cellX][cellZ];
};

World.prototype.getChunk = function(chunkY, chunkX) {
  if (!this.content[chunkY] || !this.content[chunkY][chunkX]) {
    return undefined;
  }
  return this.content[chunkY][chunkX];
};

/**
 * Give a chunk (obtained with getChunk), and a cell within that chunk, returns the
 * cell value (as a string).
 * @param {Array} chunk Chunk obtained via World.getChunk.
 * @param {number} cellZ Z coordinate of the cell in chunk.
 * @param {number} cellY Y coordinate of the cell in chunk.
 * @param {number} cellX X coordinate of the cell in chunk.
 * @return {string} cell value
 */
World.prototype.getCellFromChunk = function(chunk, cellZ, cellY, cellX) {
  if (!chunk) {
    return undefined;
  }

  if (chunk[cellY] && chunk[cellY][cellX]) {
    var v = chunk[cellY][cellX][cellZ];
    if (v != undefined && v != "") {
      return v;
    }
  }
  return cellZ == 0 ? "0" : "";
};

/**
 * Similar to getCellFromChunk, only retrieves the chunk first.
 * This function exists to make it easy to retrieve a cell within a chunk, but
 * when possible (for example in drawing loops), it is more efficient to cache
 * the currently painted chunk from getChunk, and use getCellFromChunk for each
 * cell in the chunk.
 * @param {number} chunkY Y coordinate of the chunk.
 * @param {number} chunkX X coordinate of the chunk.
 * @param {number} cellZ Z coordinate of the cell in chunk.
 * @param {number} cellY Y coordinate of the cell in chunk.
 * @param {number} cellX X coordinate of the cell in chunk.
 * @return {string} cell value
 */
World.prototype.getCell = function(chunkY, chunkX, cellZ, cellY, cellX) {
  return this.getCellFromChunk(this.getChunk(chunkY, chunkX), cellZ, cellY, cellX);
};

World.prototype.maxHeight = function(chunkY, chunkX, cellY, cellX) {
  if (!this.content[chunkY] || !this.content[chunkY][chunkX]) {
    return 0;
  }
  var c = this.content[chunkY][chunkX];
  if (c[cellY] && c[cellY][cellX]) {
    return c[cellY][cellX].length;
  }
  return 0;
}

World.prototype.isEmpty = function(value) {
  return !value || value == "" || value == "0";
};

World.prototype.floor = function(chunkY, chunkX, cellZ, cellY, cellX) {
  var z = cellZ;
  while (z > 0 && this.isEmpty(this.getCell(chunkY, chunkX, z, cellY, cellX))) {
    z -= 1;
  }
  return z;
};

World.prototype.ceiling = function(chunkY, chunkX, cellZ, cellY, cellX) {
  var z = this.floor(chunkY, chunkX, cellZ, cellY, cellX);
  while (z <= this.depth &&
      !this.isEmpty(this.getCell(chunkY, chunkX, z + 1, cellY, cellX))) {
    z += 1;
  }
  return z;
};

World.prototype.setCell = function(chunkY, chunkX, cellZ, cellY, cellX, value) {
  this.content[chunkY][chunkX][cellY][cellX][cellZ] = value;
};

World.prototype.setChunk = function(chunkY, chunkX, data) {
  if (!this.content[chunkY]) {
    this.content[chunkY] = [];
  }
  this.content[chunkY][chunkX] = data;

  if (!this._playersByChunk[chunkY]) {
    this._playersByChunk[chunkY] = [];
  }
  this._playersByChunk[chunkY][chunkX] = {};
  if (this._pendingChunks[chunkY]) {
    this._pendingChunks[chunkY][chunkX] = undefined;
  }
};

World.prototype.hasChunk = function(chunkY, chunkX) {
  if (!this.content[chunkY]) return false;
  return this.content[chunkY][chunkX] != undefined;
}

World.prototype.hasOrPendingChunk = function(chunkY, chunkX) {
  return this.hasChunk(chunkY, chunkX)
    || (this._pendingChunks[chunkY]
        && this._pendingChunks[chunkY][chunkX]);
};

World.prototype.setLiveChunks = function(chunkY, chunkX, radius) {
  this._liveChunks = [chunkY, chunkX, radius];
};

World.prototype.isLiveChunk = function(chunkY, chunkX) {
  var r = this._liveChunks[2];
  return Math.abs(chunkY - this._liveChunks[0]) <= r &&
    Math.abs(chunkX - this._liveChunks[1]) <= r;
};

World.prototype.pendingChunk = function(chunkY, chunkX) {
  return this.pendingChunk[chunkY]
    && this.pendingChunk[chunkY][chunkX];
};

World.prototype.keepChunks = function(chunks) {
  var newContent = [];
  var newplayersByChunk = [];
  for (var i = 0; i < chunks.length; i++) {
    if (!newContent[chunks[i][0]]) {
      newContent[chunks[i][0]] = [];
      newPlayersByChunk[chunks[i][0]] = [];
    }
    newContent[chunks[i][0]][chunks[i][1]] =
      this.content[chunks[i][0]][chunks[i][1]];
    newPlayersByChunk[chunks[i][0]][chunks[i][1]] =
      this._playersByChunk[chunks[i][0]][chunks[i][1]];
  }
  this.content = newContent;
  this._playersByChunk = newPlayersByChunk;
};

World.prototype.playerMoved = function(chunkY, chunkX, cellZ, cellY, cellX, playerId) {
  var pos = [chunkY, chunkX, cellZ, cellY, cellX];

  var now = this._playersById[playerId];
  if (now) {
    var a = this._playersByChunk[now[0]][now[1]];
    if (a && a[now[3]] &&
        a[now[3]][now[4]] && a[now[3]][now[4]][now[2]]) {
      delete a[now[3]][now[4]][now[2]][playerId];
    }
  }

  this._playersById[playerId] = pos;
  if (!this._playersByChunk[chunkY])
    this._playersByChunk[chunkY] = [];
  if (!this._playersByChunk[chunkY][chunkX])
    this._playersByChunk[chunkY][chunkX] = [];
  if (!this._playersByChunk[chunkY][chunkX][cellY])
    this._playersByChunk[chunkY][chunkX][cellY] = [];
  if (!this._playersByChunk[chunkY][chunkX][cellY][cellX])
    this._playersByChunk[chunkY][chunkX][cellY][cellX] = [];
  if (!this._playersByChunk[chunkY][chunkX][cellY][cellX][cellZ])
    this._playersByChunk[chunkY][chunkX][cellY][cellX][cellZ] = [];

  this._playersByChunk[chunkY][chunkX][cellY][cellX][cellZ][playerId] = 1;
};

// Returnes the last known position for that playerid
World.prototype.removePlayer = function(playerId) {
  console.log("Removing player " + playerId);
  var now = this._playersById[playerId];
  if (now) {
    var a = this._playersByChunk[now[0]][now[1]];
    if (a && a[now[3]] && a[now[3]][now[4]] && a[now[3]][now[4]][now[2]]) {
      delete a[now[3]][now[4]][now[2]][playerId];
    }
    delete this._playersById[playerId];
    console.log("Done");
    return now;
  }
  return undefined;
};

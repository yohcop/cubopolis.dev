
// A listener for dispatching events to different parts of the game.

/**
 * A listener for the {WebSockets} object.
 * Used to dispatch events to the object maintaining the world state, the
 * renderer, and the console.
 *
 * @constructor
 * @implements {NetListener}
 */
function CommListener() {
  /** @private */
  this._world = null;
  /** @private */
  this._renderer = null;
  /** @private */
  this._console = null;
  /** @private */
  this._player = null;
}

/**
 * Setup a CommListener class.
 * @param {World} world a World instance.
 * @param {Renderer} renderer a Renderer instance.
 * @param {Console} console a Console instance.
 * @param {Player} player the local Player instance.
 */
CommListener.prototype.setup = function(world, renderer, console, player) {
  this._world = world;
  this._renderer = renderer;
  this._console = console;
  this._player = player
};

/** @inheritDoc */
CommListener.prototype.nowOffline = function() {
  this._console.receiveMessage("<<< Connection lost. Will try to reconnect in a few seconds.");
  this._world.setLiveChunks([]);
  this._renderer.setDirty();
};

/** @inheritDoc */
CommListener.prototype.nowOnline = function() {
  this._console.receiveMessage("<<< And we are Live!");
  this._renderer.reloadVisibleParts();
};

/** @inheritDoc */
CommListener.prototype.setCell = function(chunkY, chunkX, z, y, x, value) {
  if (this._world.hasChunk(chunkY, chunkX)) {
    this._world.setCell(chunkY, chunkX, z, y, x, value);
    this._renderer.refreshCell(chunkY, chunkX, z, y, x);
  }
};

/** @inheritDoc */
CommListener.prototype.setChunk = function(chunkY, chunkX, data) {
  this._world.setChunk(chunkY, chunkX, data);
  this._renderer.refreshChunk(chunkY, chunkX);
};

/** @inheritDoc */
CommListener.prototype.listeningTo = function(chunks) {
  this._world.setLiveChunks(chunks);
};

/** @inheritDoc */
CommListener.prototype.playerMoved = function(chunkY, chunkX, z, y, x, playerId) {
  if (playerId == "0") {
    // The local player is moved to the given location.
    this._player.setPosition(chunkY, chunkX, z, y, x);
    this._renderer.centerOnPlayer();
  } else {
    // Another player is moved.
    this._world.playerMoved(chunkY, chunkX, z, y, x, playerId);
    this._renderer.refreshCell(chunkY, chunkX, z, y, x);
  }
};

/** @inheritDoc */
CommListener.prototype.receiveMessage = function(message) {
  this._console.receiveMessage("<<< " + message);
};

/** @inheritDoc */
CommListener.prototype.playerLeaving = function(playerId) {
  var pos = this._world.removePlayer(playerId);
  if (pos) {
    this._renderer.refreshCell(pos[0], pos[1], pos[2], pos[3], pos[4])
  }
}

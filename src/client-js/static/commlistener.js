
// A listener for dispatching events to different parts of the game.

function CommListener() {
  this._world = null;
  this._renderer = null;
  this._console = null;
}

CommListener.prototype.setup = function(world, renderer, console) {
  this._world = world;
  this._renderer = renderer;
  this._console = console;
};

CommListener.prototype.nowOffline = function() {
  this._console.receiveMessage("<<< Connection lost. Will try to reconnect in a few seconds.");
  this._world.setLiveChunks([]);
  this._renderer.setDirty();
};

CommListener.prototype.nowOnline = function() {
  this._console.receiveMessage("<<< And we are Live!");
  this._renderer.reloadVisibleParts();
};

CommListener.prototype.setCell = function(chunkY, chunkX, z, y, x, value) {
  if (this._world.hasChunk(chunkY, chunkX)) {
    this._world.setCell(chunkY, chunkX, z, y, x, value);
    this._renderer.refreshCell(chunkY, chunkX, z, y, x);
  }
};

CommListener.prototype.setChunk = function(chunkY, chunkX, data) {
  this._world.setChunk(chunkY, chunkX, data);
  this._renderer.refreshChunk(chunkY, chunkX);
};

CommListener.prototype.listeningTo = function(chunks) {
  this._world.setLiveChunks(chunks);
};

CommListener.prototype.playerMoved = function(chunkY, chunkX, z, y, x, playerId) {
  this._world.playerMoved(chunkY, chunkX, z, y, x, playerId);
  this._renderer.refreshCell(chunkY, chunkX, z, y, x);
};

CommListener.prototype.receiveMessage = function(message) {
  this._console.receiveMessage("<<< " + message);
};

CommListener.prototype.playerLeaving = function(playerId) {
  var pos = this._world.removePlayer(playerId);
  if (pos) {
    this._renderer.refreshCell(pos[0], pos[1], pos[2], pos[3], pos[4])
  }
}

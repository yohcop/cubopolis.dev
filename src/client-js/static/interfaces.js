// This file contains interface definitions.
// They are meant only to be used by the compiler, but are otherwise useless.
// No need to include it when deploing code.

/**
 * Network interface.
 * Classes implementing this interface handle communication with the cubopolis
 * servers.
 *
 * @interface
 */
function ServerComm() {};

/**
 * Get the entire chunk cells from the server.
 * This should be called whenever a non live chunk becomes live, because
 * updates on the server are not pushed to the client when a chunk is not
 * live.
 * For a chunk to become live, the function listenChunks must be called.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 */
ServerComm.prototype.reloadChunk = function(chunkY, chunkX) {};

/**
 * Instruct the server that this client wants to receive updates about the
 * given chunks. Calling listenChunks with a new list of chunks to listen
 * overrides all previous calls to this function. The server will only send
 * updates for the chunks passed during the last call to listenChunks.
 * @param chunks A list of [y, x] chunk coordinates.
 *        e.g. [[0,0], [1,0]] will listen for the chunk 0,0 and 1,0
 */
ServerComm.prototype.listenChunks = function(chunks) {};

/**
 * Save the value for a given cell on the server.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 * @param {number} cellZ cell Z coordinate.
 * @param {number} cellY cell Y coordinate.
 * @param {number} cellX cell X coordinate.
 * @param {string} value new cell value.
 */
ServerComm.prototype.setCell = function(chunkY, chunkX, cellZ, cellY, cellX, value) {};

/**
 * Send the given text message to other players around the player.
 * @param {string} text the text message.
 */
ServerComm.prototype.sendText = function(text) {};

/**
 * Moves the player to the given cell. This should be called only by the {Player} class
 * if you are using it.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 * @param {number} cellZ cell Z coordinate.
 * @param {number} cellY cell Y coordinate.
 * @param {number} cellX cell X coordinate.
 */
ServerComm.prototype.movePlayer = function(chunkY, chunkX, cellZ, cellY, cellX) {};

// ============================================================================

/**
 * Interface listening for events comming from a Websockets object.
 * This library provides a default implementation of this interface in
 * CommListener.
 *
 * @interface
 */
function NetListener() {};

/**
 * The connection to the cubopolis server was established.
 */
NetListener.prototype.nowOnline = function() {};

/**
 * The connection to the cubopolis server was closed.
 * The object calling this function should make sure to try to connect again.
 */
NetListener.prototype.nowOffline = function() {};

/**
 * The server is now delivering updates for the given chunks.
 * @param {Array} chunks a list of chunks. e.g. [[0,0], [1,0]]. Coordinates are
 *        [chunkY, chunkX]
 */
NetListener.prototype.listeningTo = function(chunks) {};

/**
 * Updated information about the given chunk was received.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 * @param {Array} data a multidimentional array, where the value of cell at
 * x,y,z is stored in data[z][y][x].
 */
NetListener.prototype.setChunk = function(chunkY, chunkX, data) {};

/**
 * Update the value for the given cell.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 * @param {number} cellZ cell Z coordinate.
 * @param {number} cellY cell Y coordinate.
 * @param {number} cellX cell X coordinate.
 * @param {string} value the new cell value.
 */
NetListener.prototype.setCell = function(chunkY, chunkX, cellZ, cellY, cellX, value) {};

/**
 * The given message was received. Usually a chat message, but can really be anything.
 * @param {string} message the message.
 */
NetListener.prototype.receiveMessage = function(message) {};

/**
 * The player with the given playerId moved to the given cell.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 * @param {number} cellZ cell Z coordinate.
 * @param {number} cellY cell Y coordinate.
 * @param {number} cellX cell X coordinate.
 * @param {number} playerId Id for the player who moved.
 */
NetListener.prototype.playerMoved = function(chunkY, chunkX, cellZ, cellY, cellX, playerId) {};

/**
 * The given player is leaving the game.
 * @param {number} playerId Id for the player who left.
 */
NetListener.prototype.playerLeaving = function(playerId) {};

// ============================================================================

/**
 * A world Renderer.
 * This interface defines functions that a client renderer should be implementing
 * when used witht the provided {CommListener} of this library
 *
 * @interface
 */
function Renderer() {};

/**
 * Tells the renderer to repaint the whole screen. This happens when the client
 * goes offline.
 * TODO: this function is at least missnamed. The library should not decide
 * when the renderer have to repaint.
 */
Renderer.prototype.setDirty = function() {};

/**
 * Tells the renderer to determine what chunks are visible to the player (or
 * close).  The renderer should then call reloadChunk on each of the visible
 * chunks, followed by a call to listenChunks.
 * This function is basically called when the client is online either for the
 * first time, or after a deconnection.
 * TODO: this function is missnamed.
 */
Renderer.prototype.reloadVisibleParts = function() {};

/**
 * Tells the renderer that something changed about the given cell.
 * It can be for different reasons: a new block, a block changed type, a block
 * was destroyed, a player on the given cell moved.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 * @param {number} z cell Z coordinate.
 * @param {number} y cell Y coordinate.
 * @param {number} x cell X coordinate.
 */
Renderer.prototype.refreshCell = function(chunkY, chunkX, z, y, x) {};

/**
 * Similar to refreshCell, but for a chunk.
 * This tells the renderer that something significant changed in this chunk
 * (e.g. it was reloaded) and the renderer should repaint this chunk.
 * This is only called when multiple cells have changed in the given chunk.
 * @param {number} chunkY chunk Y coordinate.
 * @param {number} chunkX chunk X coordinate.
 */
Renderer.prototype.refreshChunk = function(chunkY, chunkX) {};

// ============================================================================

/**
 * @constructor
 */
function Flags() {};

/**
 * Return a number of seconds for which a message should be on the console.
 * @return {number} in seconds.
 */
Flags.prototype.messageTimeoutInSec = function() {};

/**
 * Sets the given flag to the given value.
 * @param {string} key flag name.
 * @param {string} value new flag value.
 */
Flags.prototype.set = function(key, value) {};

// ============================================================================

/**
 * @constructor
 */
function ConsoleListener() {};

/**
 * Says that the console should be repainted.
 */
ConsoleListener.prototype.consoleIsDirty = function() {};

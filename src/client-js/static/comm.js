/**
 * A network protocol implementation using Web sockets.
 * @constructor
 * @implements {ServerComm}
 */
function Websockets() {
  /** @private */
  this._wsAddress = "";
  /** @private */
  this._apiURL = "";

  /** @private */
  this._listener = null;
  /** @private */
  this._isReady = false;

  /**
   * The current chunks being monitored for updates.
   * @private
   */
  this._listen = null;
  this._nextListen = null;
  this._nextChunks = null;
}

/**
 * Sets up the websocket client.
 * @param {NetListener} listener
 * @param {string} wsAddress Address of the websocket. e.g. ws://cube.leppoc.net
 * @param {string} apiURL Address for the Ajax API. e.g. http://cube.leppoc.net
 */
Websockets.prototype.setup = function(listener, wsAddress, apiURL) {
  this._wsAddress = wsAddress;
  this._apiURL = apiURL;
  this._listener = listener;
  this._connect(2000);
}

/** @private */
Websockets.prototype._connect = function(nextTimeout) {
  var t = this;
  if (window["WebSocket"]) {
    this.conn = new WebSocket(this._wsAddress);
    this.conn.onopen = function () {
      t._isReady = true;
      t._listener.nowOnline();
      nextTimeout = 2000;
    };
    this.conn.onclose = function(evt) {
      console.log("WS connection closed");
      t._isReady = false;
      t._listen = null;
      t._listener.nowOffline();
      if (nextTimeout > 30000) {
        nextTimeout = 30000;
      }
      console.log("Will try to reconnect in " + (nextTimeout / 1000) + "s");
      setTimeout(function() {t._connect(nextTimeout + 2000)}, nextTimeout);
    };
    this.conn.onmessage = function(evt) {
      t._receiveMessage(evt.data);
    };
  } else {
    alert("Sorry, no websockets in your browser. Try with Google Chrome");
  }
};

/**
 * Start listening for the given list of chunks.
 *
 * The message sent through the websocket is of the form:
 *   l y1 x1 y2 x2 y3 x3 \n
 *
 * @param {Array} chunks A list of [y,x] chunk coordinates.
 *
 * @override
 */
Websockets.prototype.listenChunks = function(chunks) {
  var message = ["l"];
  for (var i in chunks) {
    message[message.length] = chunks[i][0];
    message[message.length] = chunks[i][1];
  }
  var listen = message.join(" ") + "\n";
  if (listen == this._listen) {
    return;
  }
  // We do all this stuff so that we avoid race conditions.
  // The waitForReady will likely not execute in order. So we do the work
  // inside the waitForReady callback, to make sure we are requesting the most
  // up to date chunks.
  // Note: no, it doesn't completely avoids race conditions I guess, but it's
  // good enough for now.
  this._nextListen = listen;
  this._nextChunks = chunks;

  var t = this;
  this._waitForReady(function() {
    var listen = t._nextListen;
    var chunks = t._nextChunks;
    if (!listen || !chunks) {
      return;
    }
    t._nextChunks = null;
    t._nextListen = null;

    t.conn.send(listen);
    t._listen = listen;
    t._listener.listeningTo(chunks);
  });
}

/**
 * Set the given cell.
 * The message sent through the websocket is of the form:
 *   w chunkY chunkX cellZ cellY cellX value \n
 *
 * @override
 */
Websockets.prototype.setCell = function(chunkY, chunkX, cellZ, cellY, cellX, value) {
  var message = ["w", chunkY, chunkX, cellZ, cellY, cellX, value].join(" ") + "\n";
  var t = this;
  this._waitForReady(function() {
    t.conn.send(message);
  });
};

/**
 * Send the given text message.
 * The text should not contain any \n character.
 *
 * The message sent through the websocket is of the form:
 *   t text \n
 *
 * @override
 */
Websockets.prototype.sendText = function(text) {
  var message = ["t", text].join(" ") + "\n";
  var t = this;
  this._waitForReady(function() {
    t.conn.send(message);
  });
};

/**
 * Tell the server the player is now on the given cell
 *.
 * The message sent through the websocket is of the form:
 *   m chunkY chunkX cellZ cellY cellX \n
 *
 * @override
 */
Websockets.prototype.movePlayer = function(chunkY, chunkX, cellZ, cellY, cellX) {
  var message = ["m", chunkY, chunkX, cellZ, cellY, cellX].join(" ") + "\n";
  var t = this;
  this._waitForReady(function() {
    t.conn.send(message);
  });
};

/** @inheritDoc */
Websockets.prototype.reloadChunk = function(chunkY, chunkX) {
  var message = ["r", chunkY, chunkX].join(" ") + "\n";
  var t = this;
  this._waitForReady(function() {
    t.conn.send(message);
  });
};


/** @private */
Websockets.prototype._receiveMessage = function(data) {
  data = data.replace(/^\s+|\s+$/g, '');
  var parts = data.split(" ");
  if(parts[0] == "m" && parts.length == 7) {
    var chunkY = parseInt(parts[1]);
    var chunkX = parseInt(parts[2]);
    var cellZ = parseInt(parts[3]);
    var cellY = parseInt(parts[4]);
    var cellX = parseInt(parts[5]);
    var playerId = parseInt(parts[6]);
    this._listener.playerMoved(chunkY, chunkX, cellZ, cellY, cellX, playerId);
  } else if(parts[0] == "w" && parts.length == 7) {
    var chunkY = parseInt(parts[1]);
    var chunkX = parseInt(parts[2]);
    var cellZ = parseInt(parts[3]);
    var cellY = parseInt(parts[4]);
    var cellX = parseInt(parts[5]);
    var value = parts[6];
    this._listener.setCell(chunkY, chunkX, cellZ, cellY, cellX, value);
  } else if(parts[0] == "t" && parts.length > 1) {
    var m = data.substring(2);
    this._listener.receiveMessage(m);
  } else if(parts[0] == "x" && parts.length == 2) {
    var playerId = parseInt(parts[1]);
    this._listener.playerLeaving(playerId);
  } else if(parts[0] == "r" && parts.length == 4) {
    var chunkY = parseInt(parts[1]);
    var chunkX = parseInt(parts[2]);
    var data = parts[3];
    var ar = [];
    var buffer = "";
    var x = 0, y = 0, z = 0;
    for (var i = 0; i < data.length; i++) {
      var c = data[i];
      if (c == "\n" || c == " ") {
        break;
      } else if (c == "#") {
        setInArray(ar, x, y, z, buffer);
        x++;
        y = 0;
        z = 0;
        buffer = "";
      } else if (c == "|") {
        setInArray(ar, x, y, z, buffer);
        y++;
        z = 0;
        buffer = "";
      } else if (c == ",") {
        setInArray(ar, x, y, z, buffer);
        z++;
        buffer = "";
      } else {
        buffer += c;
      }
    }
    // Last character is left in the buffer.
    if (buffer != "") {
      setInArray(ar, x, y, z, buffer);
    }
    this._listener.setChunk(chunkY, chunkX, ar);
  } else {
    console.log("unrecognized", parts);
  }
};

/** @private */
Websockets.prototype._waitForReady = function(ready_function) {
  var t = this;
  var waitForReady = function() {
    if (!t._isReady) {
      setTimeout(waitForReady, 20);
    } else {
      ready_function();
    }
  }
  waitForReady();
};


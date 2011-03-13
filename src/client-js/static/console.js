
/**
 * @constructor
 */
function Console() {
  this.maxMessages = 10;
  this.messages=[];

  this.visible = true;
  this.grabsKeyboard = false;

  /** @private */
  this._commandHead = ">>> ";
  /** @private */
  this._listener = null;

  /** @private */
  this._history = [];
  /** @private */
  this._historyPosition = -1;

  /** @private */
  this._flags = null;
  /** @private */
  this._comm = null;

  // The current command being typed by the user
  this.command = this._commandHead;
}

Console.prototype.toggle = function() {
  this.visible = !this.visible;
  if (this.visible) {
    this._listener.consoleIsDirty();
  } else {
    this._listener.consoleIsDirty();
  }
};

Console.prototype.startGrab = function(startCommand) {
  this.grabsKeyboard = true;
  if (startCommand) {
    this.command += ":";
  }
  this._listener.consoleIsDirty();
};

Console.prototype.type = function(event) {
  var code = event.which

  if (code == 27 || (this.command == this.commeandHead && code == 13) ||
      (code == 67 && event.ctrlKey)) {  // esc, or return when empty, or ctrl-c
    this.command = this._commandHead;
    this.grabsKeyboard = false;
    this._listener.consoleIsDirty();
    return;
  }
  if (code == 13) {
    // execute command
    var com = this.command.substring(this._commandHead.length);
    this._execute(com);
    this._history.unshift(com);
    this._historyPosition = -1;
    this.command = this._commandHead;
    this.grabsKeyboard = false;
    this._listener.consoleIsDirty();
    return;
  }
  if (code == 8 && this.command.length > this._commandHead.length) {  // backspace
    this.command = this.command.substring(0, this.command.length - 1);
    this._listener.consoleIsDirty();
    return;
  }
  if (code == 38 || code == 40) {  // up / down
    this._historyPosition = Math.min(
        this._historyPosition + (code == 38 ? 1 : -1),
        this._history.length - 1);
    if (this._historyPosition < 0) {
      this._historyPosition = -1;
      this.command = this._commandHead;
    } else {
      this.command = this._commandHead + this._history[this._historyPosition];
    }
    this._listener.consoleIsDirty();
    return;
  }
  if (code >= 32 && code <= 126) {
    var c = String.fromCharCode(code);
    this.command += c;
    this._listener.consoleIsDirty();
  }
}

Console.prototype.log = function(message) {
  this.receiveMessage("### " + message);
};

Console.prototype.receiveMessage = function(message) {
  var now = new Date().getTime();

  this.messages.unshift([now + this._flags.messageTimeoutInSec() * 1000, message]);
  if (this.messages.length > this.maxMessages) {
    this.messages.pop();
  }
  this._listener.consoleIsDirty();
};

/** @private */
Console.prototype._execute = function(command) {
  var parts = command.split(" ");
  if (parts[0][0] != ":") {
    this._comm.sendText(command);
  } else if (parts[0] == ":say") {
    this._comm.sendText(command.substring(5));
  } else if (parts[0] == ":set") {
    this.receiveMessage(">>> " + command);
    var ok = this._flags.set(parts[1], parts.slice(2, parts.length).join(" "));
    this.receiveMessage(ok);
  } else if (parts[0] == ":history") {
    this.receiveMessage(this._history);
  } else if (parts[0] == ":tips" || (parts[0] == ":help" && parts[1] == "tips")) {
    this.receiveMessage("Drag and drop to move the view faster!");
    this.receiveMessage("Use Q/E/Z/C keys to build or destroy around you");
    this.receiveMessage("Use R/T or click the compas (top left) to rotate the view");
  } else if (parts[0] == ":keys" || (parts[0] == ":help" && parts[1] == "keys")) {
    this.receiveMessage(" Arrows : move player           W/A/S/D : move camera");
    this.receiveMessage("    R/T : rotate camera");
    this.receiveMessage("  Space : use block/action      Q/E/Z/C : action around player");
    this.receiveMessage("    1-9 : build block action          0 : destroy block action");
    this.receiveMessage("      / : open console                \\ : show/hide console");
    this.receiveMessage("      : : open console for command");
  } else if (parts[0] == ":wtf") {
    this.receiveMessage("I am glad you asked !");
    this.receiveMessage("This is a shared world. All players can build on the same space");
    this.receiveMessage("(almost unlimited) cool stuff using basic cubes !");
    this.receiveMessage("Move around with your mouse or keys to discover what was built");
    this.receiveMessage("by other players.");
    this.receiveMessage("Be nice ! Don't destroy cool stuff too !");

  } else if (parts[0] == ":help") {
    if (parts[1] == "set") {
      this.receiveMessage(" Set/unset options.");
      this.receiveMessage(" e.g.: :set ui");
      this.receiveMessage(" e.g.: :set ui.controls false");
    } else if (parts[1] == "say") {
      this.receiveMessage(" Send a chat message to players around you.");
      this.receiveMessage(" e.g.: :say hello world");
      this.receiveMessage(" You can omit :say if your message doesn't start with ':'");
      this.receiveMessage(" e.g.: hello world");
    } else if (parts[1] == "history") {
      this.receiveMessage(" Show the last commands executed.");
    } else {
      this.receiveMessage(" Commands:");
      this.receiveMessage(" :set, :history, :keys, :help");
      this.receiveMessage(" More help: :help <command>");
    }
  } else {
    this.receiveMessage(">>> " + command);
    this.receiveMessage("command not found");
  }
};

/** @private */
Console.prototype._checkOldMessages = function() {
  if (this.messages.length == 0) return;
  var now = new Date().getTime();
  if (this.messages[this.messages.length - 1][0] < now) {
    this.messages.pop();
    this._listener.consoleIsDirty();
  }
};

/**
 * Setup the console.
 * @param {Flags} flags an implementation of the Flags interface.
 * @param {ConsoleListener} listener an implementation of ConsoleListener interface.
 * @param {ServerComm} comm an implementation of the ServerComm interface.
 */
Console.prototype.setup = function(flags, listener, comm) {
  this._flags = flags;
  this._listener = listener;
  this._comm = comm;
  var t = this;
  setInterval(function() { t._checkOldMessages(); }, 1000);
};

goog.provide('os.command.AbstractCommandSet');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.EventTarget');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract class that contains a set of commands. Note that nested command
 * sets should always have their command set added before adding that set
 * to its parent set (this ensures that isAsync gets set properly).
 *
 * @implements {goog.disposable.IDisposable}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.command.AbstractCommandSet = function() {
  os.command.AbstractCommandSet.base(this, 'constructor');
};
goog.inherits(os.command.AbstractCommandSet, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.command.AbstractCommandSet.prototype.disposeInternal = function() {
  goog.disposeAll(this.getCommands());
  os.command.AbstractCommandSet.superClass_.disposeInternal.call(this);
};


/**
 * The set of commands
 * @type {Array.<os.command.ICommand>}
 * @private
 */
os.command.AbstractCommandSet.prototype.cmds_ = null;


/**
 * Gets the set of commands
 * @return {Array.<os.command.ICommand>} The set of commands
 */
os.command.AbstractCommandSet.prototype.getCommands = function() {
  return this.cmds_;
};


/**
 * Sets the set of commands
 * @param {Array.<os.command.ICommand>} set The set of commands
 */
os.command.AbstractCommandSet.prototype.setCommands = function(set) {
  this.cmds_ = set;

  if (set) {
    this.isAsync = false;

    // see if any of the commands are asynchronous
    /** @type {number} */ var i;
    /** @type {number} */ var n;
    for (i = 0, n = set.length; i < n; i++) {
      if (set[i].isAsync) {
        this.isAsync = true;
      }
    }

    if (!this.title) {
      /** @type {Array.<string>} */ var titles = [];
      goog.array.forEach(set, function(ele, idx, arr) {
        var command = /** @type {os.command.ICommand} */ (ele);
        if (command.title) {
          titles.push(command.title);
        }
      });
      this.title = '[ ' + titles.join(', ') + ' ]';
    }
  }
};


/**
 * The title
 * @type {?string}
 */
os.command.AbstractCommandSet.prototype.title = null;


/**
 * The current state of the command
 * @type {!os.command.State}
 */
os.command.AbstractCommandSet.prototype.state = os.command.State.READY;


/**
 * Whether or not this is an asyncronous command; true if any sub-command isAsync
 * @type {boolean}
 */
os.command.AbstractCommandSet.prototype.isAsync = false;


/**
 * The details
 * @type {?string}
 */
os.command.AbstractCommandSet.prototype.details = null;

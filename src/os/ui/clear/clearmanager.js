goog.provide('os.ui.clear.ClearManager');
goog.provide('os.ui.clearManager');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.command.SequenceCommand');
goog.require('os.ui.clear.ClearEntry');



/**
 * Manages clearing/resetting parts of the application.
 * @constructor
 */
os.ui.clear.ClearManager = function() {
  /**
   * @type {goog.debug.Logger}
   * @private
   */
  this.log_ = os.ui.clear.ClearManager.LOGGER_;

  /**
   * @type {!Object<string, !os.ui.clear.ClearEntry>}
   * @private
   */
  this.entries_ = {};
};
goog.addSingletonGetter(os.ui.clear.ClearManager);


/**
 * The logger.
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.ui.clear.ClearManager.LOGGER_ = goog.log.getLogger('os.ui.clear.ClearManager');


/**
 * @return {!Object<string, !os.ui.clear.ClearEntry>}
 */
os.ui.clear.ClearManager.prototype.getEntries = function() {
  return this.entries_;
};


/**
 * Add a clear type. These are saved as checklist items so they're easily displayed using the checklist directive.
 * @param {!os.ui.clear.ClearEntry} entry The clear command class
 */
os.ui.clear.ClearManager.prototype.addEntry = function(entry) {
  if (!(entry.id in this.entries_)) {
    var enabled = /** @type {boolean} */ (os.settings.get(['ui', 'clear', entry.id], false));
    entry.enabled = enabled;

    this.entries_[entry.id] = entry;
  } else {
    goog.log.error(this.log_, 'Clear type already exists: ' + entry.label);
  }
};


/**
 * Execute the enabled clear entries.
 * @param {boolean=} opt_all Optionally clear all regardless of their enabled state.
 * @param {Array<string>=} opt_skip clear entry ids to skip
 */
os.ui.clear.ClearManager.prototype.clear = function(opt_all, opt_skip) {
  var commands = [];
  var types = [];
  for (var key in this.entries_) {
    var entry = this.entries_[key];
    if (opt_skip && opt_skip.length && goog.array.contains(opt_skip, key)) {
      continue;
    }
    if (entry.enabled || opt_all) {
      commands.push(entry.createCommand());
      types.push(entry.label);
    }
  }

  if (commands.length > 0) {
    var cmd = null;
    if (commands.length > 1) {
      cmd = new os.command.SequenceCommand();
      cmd.setCommands(commands);
      cmd.title = 'Clear ' + types.join(', ');
    } else {
      cmd = commands[0];
    }

    os.command.CommandProcessor.getInstance().addCommand(cmd);
  }

  this.saveConfig_();
};


/**
 * Reset clear entry states from settings.
 */
os.ui.clear.ClearManager.prototype.reset = function() {
  for (var key in this.entries_) {
    var entry = this.entries_[key];
    entry.enabled = /** @type {boolean} */ (os.settings.get(['ui', 'clear', entry.id], false));
  }
};


/**
 * Save clear entry enabled states to settings.
 * @private
 */
os.ui.clear.ClearManager.prototype.saveConfig_ = function() {
  for (var key in this.entries_) {
    var entry = this.entries_[key];
    os.settings.set(['ui', 'clear', entry.id], entry.enabled);
  }
};


/**
 * Global reference to the clear manager instance.
 * @type {os.ui.clear.ClearManager}
 */
os.ui.clearManager = os.ui.clear.ClearManager.getInstance();

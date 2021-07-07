goog.module('os.ui.clear.ClearManager');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const Settings = goog.require('os.config.Settings');

const Logger = goog.requireType('goog.log.Logger');
const ClearEntry = goog.requireType('os.ui.clear.ClearEntry');


/**
 * Manages clearing/resetting parts of the application.
 */
class ClearManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {Logger}
     * @private
     */
    this.log_ = logger;

    /**
     * @type {!Object<string, !ClearEntry>}
     * @private
     */
    this.entries_ = {};
  }

  /**
   * @return {!Object<string, !ClearEntry>}
   */
  getEntries() {
    return this.entries_;
  }

  /**
   * Add a clear type. These are saved as checklist items so they're easily displayed using the checklist directive.
   *
   * @param {!ClearEntry} entry The clear command class
   */
  addEntry(entry) {
    if (!(entry.id in this.entries_)) {
      var enabled = /** @type {boolean} */ (Settings.getInstance().get(['ui', 'clear', entry.id], false));
      entry.enabled = enabled;

      this.entries_[entry.id] = entry;
    } else {
      log.error(this.log_, 'Clear type already exists: ' + entry.label);
    }
  }

  /**
   * Execute the enabled clear entries.
   *
   * @param {boolean=} opt_all Optionally clear all regardless of their enabled state.
   * @param {Array<string>=} opt_skip clear entry ids to skip
   */
  clear(opt_all, opt_skip) {
    var commands = [];
    var types = [];
    for (var key in this.entries_) {
      var entry = this.entries_[key];
      if (opt_skip && opt_skip.length && opt_skip.includes(key)) {
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
        cmd = new SequenceCommand();
        cmd.setCommands(commands);
        cmd.title = 'Clear ' + types.join(', ');
      } else {
        cmd = commands[0];
      }

      CommandProcessor.getInstance().addCommand(cmd);
    }

    this.saveConfig_();
  }

  /**
   * Reset clear entry states from settings.
   */
  reset() {
    for (var key in this.entries_) {
      var entry = this.entries_[key];
      entry.enabled = /** @type {boolean} */ (Settings.getInstance().get(['ui', 'clear', entry.id], false));
    }
  }

  /**
   * Save clear entry enabled states to settings.
   *
   * @private
   */
  saveConfig_() {
    for (var key in this.entries_) {
      var entry = this.entries_[key];
      Settings.getInstance().set(['ui', 'clear', entry.id], entry.enabled);
    }
  }

  /**
   * Get the global instance.
   * @return {!ClearManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new ClearManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ClearManager} value The instance.
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * The global instance.
 * @type {ClearManager}
 */
let instance;

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.clear.ClearManager');


exports = ClearManager;

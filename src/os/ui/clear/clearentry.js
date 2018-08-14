goog.provide('os.ui.clear.ClearEntry');



/**
 * @param {string} id The clear type, used to persist/restore the state
 * @param {string} label The label in the clear UI
 * @param {function(new: os.command.ICommand, ...?)} clazz The clear command class
 * @param {string=} opt_tooltip The tooltip to display to the user
 * @extends {osx.ChecklistItem}
 * @constructor
 */
os.ui.clear.ClearEntry = function(id, label, clazz, opt_tooltip) {
  /**
   * Identifier for settings and the manager
   * @type {string}
   */
  this.id = id;

  /**
   * If the entry is enabled
   * @type {boolean}
   */
  this.enabled = false;

  /**
   * User-facing label
   * @type {string}
   */
  this.label = label;

  /**
   * Tooltip to display on hover
   * @type {string}
   */
  this.tooltip = opt_tooltip || ('Clear ' + label);

  /**
   * Clear command class
   * @type {function(new: os.command.ICommand, ...)}
   * @private
   */
  this.clazz_ = clazz;
};


/**
 * Create a new instance of this entry's command.
 * @return {!os.command.ICommand}
 */
os.ui.clear.ClearEntry.prototype.createCommand = function() {
  return new this.clazz_();
};

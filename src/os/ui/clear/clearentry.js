goog.declareModuleId('os.ui.clear.ClearEntry');

const ICommand = goog.requireType('os.command.ICommand');


/**
 */
export default class ClearEntry {
  /**
   * Constructor.
   * @param {string} id The clear type, used to persist/restore the state
   * @param {string} label The label in the clear UI
   * @param {function(new: ICommand, ...?)} clazz The clear command class
   * @param {string=} opt_tooltip The tooltip to display to the user
   */
  constructor(id, label, clazz, opt_tooltip) {
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
     * @type {function(new: ICommand, ...)}
     * @private
     */
    this.clazz_ = clazz;
  }

  /**
   * Create a new instance of this entry's command.
   *
   * @return {!ICommand}
   */
  createCommand() {
    return new this.clazz_();
  }
}

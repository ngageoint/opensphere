goog.module('os.ui.columnactions.AbstractColumnAction');

const IColumnActionModel = goog.requireType('os.ui.columnactions.IColumnActionModel');


/**
 * @abstract
 */
class AbstractColumnAction {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Column action description
     * @type {string}
     * @protected
     */
    this.description = '';


    /**
     * @type {Object.<string, (string|RegExp)>}
     * @protected
     */
    this.regexps = {};
  }

  /**
   * Set the description
   *
   * @param {string} description
   */
  setDescription(description) {
    this.description = description;
  }

  /**
   * Get the description
   *
   * @return {string} the string text of the description
   */
  getDescription() {
    return this.description;
  }

  /**
   * Get a represntation of the action for display.
   *
   * @abstract
   * @param {*} value the value to be manipulated for display.
   * @return {*}
   */
  toDisplay(value) {}

  /**
   * Set the regexps necessary to run this action
   *
   * @param {Object.<string, string>} regexps
   */
  setRegExps(regexps) {
    for (var key in regexps) {
      if (key != 'replace') {
        this.regexps[key] = new RegExp(regexps[key], 'i');
      } else {
        this.regexps[key] = regexps[key];
      }
    }
  }

  /**
   * Get the processed action value.
   * @param {?*} value The input value.
   * @return {*} The processed value.
   * @abstract
   */
  getAction(value) {}

  /**
   * Set the action to be performed
   * Can come from a config, or be passed in.
   *
   * @abstract
   * @param {*} action
   */
  setAction(action) {}

  /**
   * Run the action
   *
   * @abstract
   * @param {*} value
   */
  execute(value) {}

  /**
   * Whether or not this column action applies to the given criteria. The only required regex
   * is <code>columnRegex</code>. If <code>sourceIdRegex</code> or <code>sourceUrlRegex</code>
   * exist and the <code>sourceId</code> or <code>sourceUrl</code> parameter is supplied, then
   * they are given higher priority than the column match and will fail first.
   *
   * @abstract
   * @param {Object.<string, *>} context  The items to be matched.  They are meaningful to the concrete column
   *                                          action class.
   * @param {IColumnActionModel} a technology agnostic model that describes the table column.
   * @param {*} value The value for the column
   * @return {boolean} True if the column action applies, false otherwise.
   *
   */
  matches(context, a, value) {}
}

exports = AbstractColumnAction;

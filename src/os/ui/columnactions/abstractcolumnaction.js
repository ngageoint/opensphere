goog.provide('os.ui.columnactions.AbstractColumnAction');
goog.require('goog.structs.Map');



/**
 *
 * @constructor
 */
os.ui.columnactions.AbstractColumnAction = function() {
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
};


/**
 * Set the description
 * @param {string} description
 */
os.ui.columnactions.AbstractColumnAction.prototype.setDescription = function(description) {
  this.description = description;
};


/**
 * Get the description
 * @return {string} the string text of the description
 */
os.ui.columnactions.AbstractColumnAction.prototype.getDescription = function() {
  return this.description;
};


/**
 * Get a represntation of the action for display.
 * @param {*} value the value to be manipulated for display.
 * @return {*}
 */
os.ui.columnactions.AbstractColumnAction.prototype.toDisplay = goog.abstractMethod;


/**
 * Set the regexps necessary to run this action
 * @param {Object.<string, string>} regexps
 */
os.ui.columnactions.AbstractColumnAction.prototype.setRegExps = function(regexps) {
  for (var key in regexps) {
    if (key != 'replace') {
      this.regexps[key] = new RegExp(regexps[key]);
    } else {
      this.regexps[key] = regexps[key];
    }
  }
};


/**
 * Set the action to be performed
 * Can come from a config, or be passed in.
 * @param {*} action
 */
os.ui.columnactions.AbstractColumnAction.prototype.setAction = goog.abstractMethod;


/**
 * Run the action
 * @param {*} value
 */
os.ui.columnactions.AbstractColumnAction.prototype.execute = goog.abstractMethod;


/**
 * Whether or not this column action applies to the given criteria. The only required regex
 * is <code>columnRegex</code>. If <code>sourceIdRegex</code> or <code>sourceUrlRegex</code>
 * exist and the <code>sourceId</code> or <code>sourceUrl</code> parameter is supplied, then
 * they are given higher priority than the column match and will fail first.
 *
 * @param {Object.<string, *>} context  The items to be matched.  They are meaningful to the concrete column
 *                                          action class.
 * @param {os.ui.columnactions.IColumnActionModel} a technology agnostic model that describes the table column.
 * @param {*} value The value for the column
 * @return {boolean} True if the column action applies, false otherwise.
 *
 */
os.ui.columnactions.AbstractColumnAction.prototype.matches = goog.abstractMethod;

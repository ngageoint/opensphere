goog.module('os.ui.filter.Expression');
goog.module.declareLegacyNamespace();

const {getFirstElementChild} = goog.require('goog.dom');
const {OPERATIONS} = goog.require('os.ui.filter');

const Op = goog.requireType('os.ui.filter.op.Op');


/**
 * Expression object
 * @unrestricted
 */
class Expression {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?string}
     */
    this.columnName = null;

    /**
     * @type {?Object}
     */
    this['column'] = null;

    /**
     * @type {?Op}
     */
    this['op'] = null;

    /**
     * @type {?string}
     */
    this['literal'] = null;
  }

  /**
   * @return {?string} the filter
   */
  getFilter() {
    if (this['op']) {
      var columnName = this['column']['field'] || this['column']['name'];
      return (
        /** @type {Op} */
        (this['op']).getFilter(columnName, this['literal'])
      );
    }

    return null;
  }

  /**
   * @param {?Node} value the filter
   */
  setFilter(value) {
    if (value) {
      // set up the expression from the filter
      var el = angular.element(value);
      var ops = OPERATIONS;

      this['literal'] = '';

      for (var i = 0, n = ops.length; i < n; i++) {
        if (ops[i].matches(el)) {
          var op = ops[i];
          this.columnName = op.getColumn(el);
          this['literal'] = op.getLiteral(el);
          this['op'] = op;
          break;
        }
      }
    }
  }

  /**
   * @param {string|number} value
   * @return {boolean}
   */
  validate(value) {
    if (this['column'] && this['op']) {
      var key = this['column']['type'];
      return this['op'].validate(value, key);
    }
    return false;
  }

  /**
   * Clones the expression.
   *
   * @return {Expression} The literal
   */
  clone() {
    var clone = new Expression();
    clone['column'] = this['column'];
    clone['op'] = this['op'];
    clone['literal'] = this['literal'];

    var filter = this.getFilter();
    if (filter) {
      try {
        clone.setFilter(getFirstElementChild($.parseXML(filter)));
      } catch (e) {}
    }

    return clone;
  }
}

exports = Expression;

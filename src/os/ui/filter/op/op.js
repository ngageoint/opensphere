goog.declareModuleId('os.ui.filter.op.Op');

import FilterPatterns from '../filterpatterns.js';
import {directiveTag as textUi} from '../text.js';

const DataType = goog.requireType('os.xsd.DataType');


/**
 * Model class representing operations. Operations can be a single expression or multiple (generally subclasses).
 * @unrestricted
 */
export default class Op {
  /**
   * Constructor.
   * @param {string} localName Element name for the expression it creates
   * @param {string} title Human readable name for the op
   * @param {string=} opt_shortTitle Abbreviated human readable name for the op
   * @param {?Array<DataType>=} opt_supportedTypes Supported input types (number, string, integer)
   * @param {string=} opt_attributes
   * @param {string=} opt_hint Hint text for the UI
   * @param {string=} opt_ui The UI rendered next to the op select
   * @param {boolean=} opt_noLiteral Whether to exclude the literal value
   * @param {string=} opt_popoverTitle title for a popover, if wanted; default "Info"
   * @param {string=} opt_popoverContent content for a popover, if wanted
   */
  constructor(
      localName,
      title,
      opt_shortTitle,
      opt_supportedTypes,
      opt_attributes,
      opt_hint,
      opt_ui,
      opt_noLiteral,
      opt_popoverTitle,
      opt_popoverContent
  ) {
    /**
     * @type {string}
     * @protected
     */
    this.localName = localName;

    /**
     * @type {string}
     * @private
     */
    this.title_ = title;

    /**
     * @type {string}
     * @private
     */
    this.shortTitle_ = opt_shortTitle || title;

    /**
     * @type {?Array<DataType>}
     * @protected
     */
    this.supportedTypes = opt_supportedTypes || null;

    /**
     * @type {string}
     * @private
     */
    this.attributes_ = opt_attributes || '';

    /**
     * @type {!string}
     * @private
     */
    this.ui_ = opt_ui || textUi;

    /**
     * @type {!string}
     */
    this['hint'] = opt_hint || '';

    /**
     * @type {!string}
     */
    this['popoverTitle'] = opt_popoverTitle || 'Info';

    /**
     * @type {?string}
     */
    this['popoverContent'] = opt_popoverContent;

    /**
     * String for matching the hint saved to the filter XML.
     * @type {?string}
     * @protected
     */
    this.matchHint = null;

    /**
     * @type {boolean}
     * @private
     */
    this.excludeLiteral_ = opt_noLiteral === true || false;
  }

  /**
   * Gets the op node name
   *
   * @return {string}
   */
  getLocalName() {
    return this.localName;
  }

  /**
   * Gets the title
   *
   * @return {string} The title
   * @export
   */
  getTitle() {
    return this.title_;
  }

  /**
   * Gets the title
   *
   * @return {string} The title
   * @export
   */
  getShortTitle() {
    return this.shortTitle_;
  }

  /**
   * Get the attributes on the root XML element.
   *
   * @return {string}
   */
  getAttributes() {
    return this.attributes_;
  }

  /**
   * Set the attributes on the root XML element.
   *
   * @param {string} attributes The attributes.
   */
  setAttributes(attributes) {
    this.attributes_ = attributes;
  }

  /**
   * Gets the UI
   *
   * @return {!string}
   */
  getUi() {
    return this.ui_;
  }

  /**
   * Get if the literal should be excluded/ignored for the operation.
   *
   * @return {boolean}
   */
  getExcludeLiteral() {
    return this.excludeLiteral_;
  }

  /**
   * Set if the literal should be excluded/ignored for the operation.
   *
   * @param {boolean} value The new value.
   */
  setExcludeLiteral(value) {
    this.excludeLiteral_ = value;
  }

  /**
   * Gets the filter
   *
   * @param {string} column
   * @param {string} literal
   * @return {?string} the filter
   */
  getFilter(column, literal) {
    var f = null;

    if (column) {
      f = '<' + this.localName +
          (this.attributes_ ? ' ' + this.attributes_ : '') + '>' +
          '<PropertyName>' + column + '</PropertyName>';

      if (literal && !this.excludeLiteral_) {
        f += '<Literal><![CDATA[' + literal.trim() + ']]></Literal>';
      }

      f += '</' + this.localName + '>';
    }

    return f;
  }

  /**
   * Get a function expression to evaluate the operation against a variable.
   *
   * @param {string} varName The name of the variable storing the value.
   * @param {?string} literal The value to test against.
   * @return {string} The filter function expression.
   */
  getEvalExpression(varName, literal) {
    // this must be extended to support eval expressions
    return '';
  }

  /**
   * @param {angular.JQLite} el
   * @return {string} the column name
   */
  getColumn(el) {
    return el.find('*').filter(function() {
      return this.localName == 'PropertyName';
    }).first().text();
  }

  /**
   * @param {angular.JQLite} el
   * @return {string} the literal
   */
  getLiteral(el) {
    return this.excludeLiteral_ ? null : el.find('*').filter(function() {
      return this.localName == 'Literal';
    }).first().text();
  }

  /**
   * @param {angular.JQLite} el
   * @return {boolean}
   */
  matches(el) {
    if (el && el.length) {
      var hint = el[0].getAttribute('hint');
      return el[0].localName == this.localName && hint == this.matchHint;
    }

    return false;
  }

  /**
   * @param {DataType} type
   * @return {boolean} Whether or not the column type is supported
   */
  isSupported(type) {
    if (type && this.supportedTypes) {
      return this.supportedTypes.indexOf(type) > -1;
    }

    // no support for spatial types and most ops don't support time
    if (type && (type.indexOf('gml:') === 0 || type.indexOf('datetime') !== -1 || type.indexOf('recordtime') !== -1)) {
      return false;
    }

    return true;
  }

  /**
   * Set the supported column types.
   *
   * @param {Array<string>} types The supported types.
   */
  setSupported(types) {
    this.supportedTypes = types;
  }

  /**
   * Validates the value against the pattern associated to the key.
   *
   * @param {string|null|undefined} value
   * @param {string} key
   * @return {boolean} Whether or not the column type is supported
   */
  validate(value, key) {
    if (this.getExcludeLiteral()) {
      return true;
    }

    if (!value) {
      return false;
    }

    var pattern = FilterPatterns[key];
    if (pattern && pattern.test(value)) {
      return true;
    }

    return false;
  }
}

/**
 * Text reused in several ops; to save on total the KB of the min file
 * @enum {string}
 * @const
 */
Op.TEXT = {
  CASE_INSENSITIVE: '  (INFO: not case-sensitive)',
  CASE_INSENSITIVE_DETAIL: '<strong>Case-insensitive</strong><sup>1</sup>, i.e. "A" == "a" and<br />' +
  '<strong>Wildcard</strong> support, i.e. "a*" == "ab"<br /><br /><sup>1</sup>&nbsp;Typically, case' +
  '-<i>in</i>sensitive text search is available for "like" filters. Some Data Providers may not support it.',
  CASE_INSENSITIVE_TITLE: 'Additional Info',
  CASE_SENSITIVE_DETAIL: '<strong>Case-sensitive</strong>, i.e. "A" != "a" and<br /><strong>Exact match</strong> ' +
  'only, i.e. "ab" != "a"<br /><br />See "like" filters for wildcard "*" search as well as case-insensitivity.',
  CASE_SENSITIVE_TITLE: 'Additional Info',
  CASE_SENSITIVE: '  (INFO: case-sensitive)'
};

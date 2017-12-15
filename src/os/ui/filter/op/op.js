goog.provide('os.ui.filter.op.Op');
goog.require('os.ui.filter.textDirective');



/**
 * Model class representing operations. Operations can be a single expression or multiple (generally subclasses).
 * @param {string} localName Element name for the expression it creates
 * @param {string} title Human readable name for the op
 * @param {string=} opt_shortTitle Abbreviated human readable name for the op
 * @param {?Array<string>=} opt_supportedTypes Supported input types (number, string, integer)
 * @param {string=} opt_attributes
 * @param {string=} opt_hint Hint text for the UI
 * @param {string=} opt_ui The UI rendered next to the op select
 * @param {boolean=} opt_noLiteral Whether to exclude the literal value
 * @constructor
 */
os.ui.filter.op.Op = function(localName, title, opt_shortTitle, opt_supportedTypes, opt_attributes, opt_hint, opt_ui,
    opt_noLiteral) {
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
   * @type {?Array<string>}
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
  this.ui_ = opt_ui || 'fb-text';

  /**
   * @type {!string}
   */
  this['hint'] = opt_hint || '';

  /**
   * @type {boolean}
   * @private
   */
  this.excludeLiteral_ = opt_noLiteral === true || false;
};


/**
 * Gets the op node name
 * @return {string}
 */
os.ui.filter.op.Op.prototype.getLocalName = function() {
  return this.localName;
};


/**
 * Gets the title
 * @return {string} The title
 */
os.ui.filter.op.Op.prototype.getTitle = function() {
  return this.title_;
};
goog.exportProperty(os.ui.filter.op.Op.prototype, 'getTitle', os.ui.filter.op.Op.prototype.getTitle);


/**
 * Gets the title
 * @return {string} The title
 */
os.ui.filter.op.Op.prototype.getShortTitle = function() {
  return this.shortTitle_;
};
goog.exportProperty(os.ui.filter.op.Op.prototype, 'getShortTitle', os.ui.filter.op.Op.prototype.getShortTitle);


/**
 * Get the attributes on the root XML element.
 * @return {string}
 */
os.ui.filter.op.Op.prototype.getAttributes = function() {
  return this.attributes_;
};


/**
 * Set the attributes on the root XML element.
 * @param {string} attributes The attributes.
 */
os.ui.filter.op.Op.prototype.setAttributes = function(attributes) {
  this.attributes_ = attributes;
};


/**
 * Gets the UI
 * @return {!string}
 */
os.ui.filter.op.Op.prototype.getUi = function() {
  return this.ui_;
};


/**
 * Get if the literal should be excluded/ignored for the operation.
 * @return {boolean}
 */
os.ui.filter.op.Op.prototype.getExcludeLiteral = function() {
  return this.excludeLiteral_;
};


/**
 * Set if the literal should be excluded/ignored for the operation.
 * @param {boolean} value The new value.
 */
os.ui.filter.op.Op.prototype.setExcludeLiteral = function(value) {
  this.excludeLiteral_ = value;
};


/**
 * Gets the filter
 * @param {string} column
 * @param {string} literal
 * @return {?string} the filter
 */
os.ui.filter.op.Op.prototype.getFilter = function(column, literal) {
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
};


/**
 * Get a function expression to evaluate the operation against a variable.
 * @param {string} varName The name of the variable storing the value.
 * @param {?string} literal The value to test against.
 * @return {string} The filter function expression.
 */
os.ui.filter.op.Op.prototype.getEvalExpression = function(varName, literal) {
  // this must be extended to support eval expressions
  return '';
};


/**
 * @param {angular.JQLite} el
 * @return {string} the column name
 */
os.ui.filter.op.Op.prototype.getColumn = function(el) {
  return el.find('*').filter(function() {
    return this.localName == 'PropertyName';
  }).first().text();
};


/**
 * @param {angular.JQLite} el
 * @return {string} the literal
 */
os.ui.filter.op.Op.prototype.getLiteral = function(el) {
  return this.excludeLiteral_ ? null : el.find('*').filter(function() {
    return this.localName == 'Literal';
  }).first().text();
};


/**
 * @param {angular.JQLite} el
 * @return {boolean}
 */
os.ui.filter.op.Op.prototype.matches = function(el) {
  if (el && el.length) {
    return el[0].localName == this.localName;
  }

  return false;
};


/**
 * @param {string} type
 * @return {boolean} Whether or not the column type is supported
 */
os.ui.filter.op.Op.prototype.isSupported = function(type) {
  if (type && this.supportedTypes) {
    return this.supportedTypes.indexOf(type) > -1;
  }

  // no support for spatial types
  if (type && type.indexOf('gml:') === 0) {
    return false;
  }

  return true;
};


/**
 * Set the supported column types.
 * @param {Array<string>} types The supported types.
 */
os.ui.filter.op.Op.prototype.setSupported = function(types) {
  this.supportedTypes = types;
};


/**
 * Validates the value against the pattern associated to the key.
 * @param {string|null|undefined} value
 * @param {string} key
 * @return {boolean} Whether or not the column type is supported
 */
os.ui.filter.op.Op.prototype.validate = function(value, key) {
  if (this.getExcludeLiteral()) {
    return true;
  }

  if (!value) {
    return false;
  }

  var pattern = os.ui.filter.PATTERNS[key];
  if (pattern && pattern.test(value)) {
    return true;
  }

  return false;
};

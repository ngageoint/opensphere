goog.provide('os.ui.filter.op.Not');
goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.textDirective');



/**
 * @param {os.ui.filter.op.Op} op
 * @constructor
 * @extends {os.ui.filter.op.Op}
 */
os.ui.filter.op.Not = function(op) {
  /**
   * @type {os.ui.filter.op.Op}
   * @protected
   */
  this.op = op;

  os.ui.filter.op.Not.base(this, 'constructor', 'Not', 'not');

  /**
   * @type {!string}
   */
  this['hint'] = op['hint'] || '';
};
goog.inherits(os.ui.filter.op.Not, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getTitle = function() {
  return this.op.getTitle().replace('is', 'is not');
};
goog.exportProperty(os.ui.filter.op.Not.prototype, 'getTitle', os.ui.filter.op.Not.prototype.getTitle);


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getShortTitle = function() {
  return 'not ' + this.op.getShortTitle();
};
goog.exportProperty(os.ui.filter.op.Not.prototype, 'getShortTitle', os.ui.filter.op.Not.prototype.getShortTitle);


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getAttributes = function() {
  return this.op.getAttributes();
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.setAttributes = function(attributes) {
  return this.op.setAttributes(attributes);
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getUi = function() {
  return this.op.getUi();
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getEvalExpression = function(varName, literal) {
  var opExpr = this.op.getEvalExpression(varName, literal);
  if (opExpr) {
    return '!(' + opExpr + ')';
  }

  return '';
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getFilter = function(column, literal) {
  var filter = this.op.getFilter(column, literal);
  return filter ? '<Not>' + filter + '</Not>' : '';
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getColumn = function(el) {
  return this.op.getColumn(el);
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.getLiteral = function(el) {
  return this.op.getLiteral(el);
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.matches = function(el) {
  return os.ui.filter.op.Not.base(this, 'matches', el) &&
      el.children().length == 1 && this.op.matches(el.children().first());
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.isSupported = function(type) {
  return this.op.isSupported(type);
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.setSupported = function(types) {
  this.op.setSupported(types);
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Not.prototype.validate = function(value, key) {
  return this.op.validate(value, key);
};

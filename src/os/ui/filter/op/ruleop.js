goog.provide('os.ui.filter.op.Rule');
goog.require('os.ui.filter.op.Op');



/**
 * @param {string} localName
 * @param {string} title
 * @param {string=} opt_shortTitle
 * @param {?Array.<string>=} opt_supportedTypes
 * @param {string=} opt_attrs
 * @param {string=} opt_hint
 * @param {string=} opt_ui
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.Rule = function(localName, title, opt_shortTitle, opt_supportedTypes, opt_attrs, opt_hint, opt_ui) {
  os.ui.filter.op.Rule.base(this, 'constructor',
      localName, title, opt_shortTitle, opt_supportedTypes, opt_attrs, opt_hint, opt_ui);

  this.supportedTypes = ['integer'];
};
goog.inherits(os.ui.filter.op.Rule, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.Rule.prototype.getFilter = function(column, literal) {
  if (literal) {
    return '<And><' + this.localName + ' property="getNumberOfResults" value="' + literal + '">' +
        '</' + this.localName + '></And>';
  }

  return null;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Rule.prototype.getLiteral = function(el) {
  return el.attr('value');
};

goog.provide('os.ui.filter.op.InList');

goog.require('os.ui.filter.listDirective');
goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.string');



/**
 * @param {string=} opt_title
 * @param {string=} opt_shortTitle
 * @param {?Array.<string>=} opt_supportedTypes
 * @param {string=} opt_attrs
 * @param {string=} opt_hint
 * @param {string=} opt_ui
 * @constructor
 * @extends {os.ui.filter.op.Op}
 */
os.ui.filter.op.InList = function(opt_title, opt_shortTitle, opt_supportedTypes, opt_attrs, opt_hint, opt_ui) {
  opt_title = opt_title || 'is in list';
  opt_shortTitle = opt_shortTitle || 'in list';
  opt_supportedTypes = opt_supportedTypes || null;
  opt_attrs = opt_attrs || 'hint="in list"';
  opt_hint = opt_hint || 'e.g. A, B, ...';
  opt_ui = opt_ui || 'fb-list';

  os.ui.filter.op.InList.base(this, 'constructor',
      'Or', opt_title, opt_shortTitle, opt_supportedTypes, opt_attrs, opt_hint, opt_ui);

  /**
   * @type {string}
   * @protected
   */
  this.matchHint = 'in list';
};
goog.inherits(os.ui.filter.op.InList, os.ui.filter.op.Op);


/**
 * Parses trimmed, non-empty values from a comma-separated list.
 * @param {?string} literal The literal.
 * @return {!Array<string>} Parsed non-empty list values.
 * @protected
 */
os.ui.filter.op.InList.prototype.getValuesFromLiteral = function(literal) {
  var result = [];

  if (literal) {
    var list = literal.trim().split(/\s*,\s*/);
    if (list.length > 0) {
      for (var i = 0; i < list.length; i++) {
        var str = list[i].trim();
        if (str) {
          result.push(str);
        }
      }
    }
  }

  return result;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.InList.prototype.getEvalExpression = function(varName, literal) {
  var list = this.getValuesFromLiteral(literal);
  if (list.length > 0) {
    // surround all values in double quotes
    list = list.map(os.ui.filter.string.quoteString);

    return '([' + list.join(',') + ']).indexOf(String(' + varName + '))!=-1';
  }

  // couldn't parse values, so don't return an expression
  return '';
};


/**
 * @inheritDoc
 */
os.ui.filter.op.InList.prototype.getFilter = function(column, literal) {
  var f = '';

  var list = this.getValuesFromLiteral(literal);
  if (list.length > 0) {
    var attr = this.getAttributes();
    f = '<' + this.localName + (attr ? ' ' + attr : '') + '>';

    for (var i = 0, n = list.length; i < n; i++) {
      f += '<PropertyIsEqualTo>' +
          '<PropertyName>' + column + '</PropertyName>' +
          '<Literal><![CDATA[' + list[i].trim() + ']]></Literal>' +
          '</PropertyIsEqualTo>';
    }

    f += '</' + this.localName + '>';
  }

  return f;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.InList.prototype.getLiteral = function(el) {
  var arr = el.find('Literal');
  var literals = [];

  arr.each(function(i, domEl) {
    literals.push($(domEl).text());
  });

  return literals.join(', ');
};


/**
 * @inheritDoc
 */
os.ui.filter.op.InList.prototype.matches = function(el) {
  if (el) {
    return el.attr('hint') == this.matchHint;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.InList.prototype.validate = function(value, key) {
  var valid = false;
  if (value) {
    var list = value.trim().split(/\s*,\s*/);
    var pattern = os.ui.filter.PATTERNS[key];
    valid = true;

    for (var i = 0, n = list.length; i < n; i++) {
      if (!pattern.test(list[i])) {
        valid = false;
        break;
      }
    }
  }

  return valid;
};

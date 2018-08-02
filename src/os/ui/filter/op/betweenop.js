goog.provide('os.ui.filter.op.Between');

goog.require('os.ui.filter.betweenDirective');
goog.require('os.ui.filter.op.Op');



/**
 * @constructor
 * @extends {os.ui.filter.op.Op}
 */
os.ui.filter.op.Between = function() {
  os.ui.filter.op.Between.base(this, 'constructor',
      'And', 'is between', 'between', ['integer', 'decimal'], 'hint="between"', undefined, 'fb-between');

  /**
   * @type {string}
   * @protected
   */
  this.matchHint = 'between';
};
goog.inherits(os.ui.filter.op.Between, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.Between.prototype.getEvalExpression = function(varName, literal) {
  var range = this.getRangeFromLiteral(literal);
  if (range && range.length == 2 && range[0] !== range[1]) {
    return '(' + varName + '>=' + range[0] + '&&' + varName + '<=' + range[1] + ')';
  }

  // range couldn't be parsed, so don't return an expression
  return '';
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Between.prototype.getFilter = function(column, literal) {
  var f = '';

  var range = this.getRangeFromLiteral(literal);
  if (range && range.length == 2 && range[0] !== range[1]) {
    var attr = this.getAttributes();

    f = '<' + this.localName + (attr ? ' ' + attr : '') + '>';

    // yes, I realize that a non-inclusive end and/or a non-inclusive start is much more
    // technically useful, but these are apparently non-intuitive to our users (glare face).

    f += '<PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyName>' + column + '</PropertyName>' +
        '<Literal><![CDATA[' + range[0] + ']]></Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
        '<PropertyName>' + column + '</PropertyName>' +
        '<Literal><![CDATA[' + range[1] + ']]></Literal>' +
        '</PropertyIsLessThanOrEqualTo>';

    f += '</' + this.localName + '>';
  }

  return f;
};


/**
 * Get the numeric range from the literal value.
 * @param {?string} literal The filter literal.
 * @return {Array<number>} The range, in the form [min, max].
 * @protected
 */
os.ui.filter.op.Between.prototype.getRangeFromLiteral = function(literal) {
  if (literal) {
    var list = literal.trim().split(/\s*,\s*/);

    if (list.length == 2) {
      var a = parseFloat(list[0]);
      var b = parseFloat(list[1]);
      if (!isNaN(a) && !isNaN(b)) {
        return [Math.min(a, b), Math.max(a, b)];
      }
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Between.prototype.getLiteral = function(el) {
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
os.ui.filter.op.Between.prototype.matches = function(el) {
  if (el) {
    return el.attr('hint') == this.matchHint;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.Between.prototype.validate = function(value, key) {
  if (value) {
    var list = value.trim().split(/\s*,\s*/);

    if (list.length == 2) {
      var a = parseFloat(list[0]);
      var b = parseFloat(list[1]);

      var pattern = os.ui.filter.PATTERNS[key];
      return pattern.test(a) && pattern.test(b);
    }
  }

  return false;
};

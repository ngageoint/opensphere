goog.provide('os.ui.filter.op.time.Between');

goog.require('os.ui.filter.op.Op');
goog.require('os.ui.filter.op.time.betweenTimeDirective');



/**
 * Operator for times between a start and an end.
 * @extends {os.ui.filter.op.Op}
 * @constructor
 */
os.ui.filter.op.time.Between = function() {
  os.ui.filter.op.time.Between.base(this, 'constructor',
      'And', 'is between', 'between', ['recordtime'], 'hint="betweentime"', undefined, 'betweentime');
  this.matchHint = 'betweentime';
};
goog.inherits(os.ui.filter.op.time.Between, os.ui.filter.op.Op);


/**
 * @inheritDoc
 */
os.ui.filter.op.time.Between.prototype.getEvalExpression = function(varName, literal) {
  var range = this.getRangeFromLiteral(literal);
  if (range && range.length == 2 && range[0] !== range[1]) {
    var r0 = range[0];
    var r1 = range[1];
    return varName + '!=null&&os.ui.filter.currentTimestamp-' + varName + '.getStart()<=' + r1 +
        '&&os.ui.filter.currentTimestamp-' + varName + '.getEnd()>=' + r0;
  }

  // range couldn't be parsed, so don't return an expression
  return '';
};


/**
 * @inheritDoc
 */
os.ui.filter.op.time.Between.prototype.getFilter = function(column, literal) {
  var f = '';
  var range = this.getRangeFromLiteral(literal);

  if (range && range.length == 2 && range[0] !== range[1]) {
    var attr = this.getAttributes();

    f = '<' + this.localName + (attr ? ' ' + attr : '') + '>';
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
os.ui.filter.op.time.Between.prototype.getRangeFromLiteral = function(literal) {
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
os.ui.filter.op.time.Between.prototype.getLiteral = function(el) {
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
os.ui.filter.op.time.Between.prototype.matches = function(el) {
  if (el) {
    return el.attr('hint') == this.matchHint;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.time.Between.prototype.validate = function(value, key) {
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

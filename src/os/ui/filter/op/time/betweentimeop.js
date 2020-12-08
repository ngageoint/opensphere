goog.module('os.ui.filter.op.time.Between');
goog.module.declareLegacyNamespace();

goog.require('os.ui.filter.op.time.betweenTimeDirective');

const ui = goog.require('os.ui');
const Op = goog.require('os.ui.filter.op.Op');



/**
 * Operator for times between a start and an end.
 */
class Between extends Op {
  /**
   * Constructor.
   */
  constructor() {
    super('And', 'is between', 'between', ['recordtime'], 'hint="betweentime"', undefined, 'betweentime');
    this.matchHint = 'betweentime';
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    var range = this.getRangeFromLiteral(literal);
    if (range && range.length == 2 && range[0] !== range[1]) {
      var r0 = range[0];
      var r1 = range[1];
      return varName + '!=null&&currentFilterTimestamp-' + r1 + '<=' + varName + '.getEnd()' +
          '&&currentFilterTimestamp-' + r0 + '>=' + varName + '.getStart()';
    }

    // range couldn't be parsed, so don't return an expression
    return '';
  }

  /**
   * @inheritDoc
   */
  getFilter(column, literal) {
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
  }

  /**
   * Get the numeric range from the literal value.
   *
   * @param {?string} literal The filter literal.
   * @return {Array<number>} The range, in the form [min, max].
   * @protected
   */
  getRangeFromLiteral(literal) {
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
  }

  /**
   * @inheritDoc
   */
  getLiteral(el) {
    var arr = el.find('Literal');
    var literals = [];

    arr.each(function(i, domEl) {
      literals.push($(domEl).text());
    });

    return literals.join(', ');
  }

  /**
   * @inheritDoc
   */
  matches(el) {
    if (el) {
      return el.attr('hint') == this.matchHint;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  validate(value, key) {
    if (value) {
      var list = value.trim().split(/\s*,\s*/);

      if (list.length == 2) {
        var a = parseFloat(list[0]);
        var b = parseFloat(list[1]);

        var pattern = ui.filter.PATTERNS[key];
        return pattern.test(a) && pattern.test(b);
      }
    }

    return false;
  }
}

exports = Between;

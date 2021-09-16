goog.module('os.ui.filter.op.IsLikeNumeric');

const FilterPatterns = goog.require('os.ui.filter.FilterPatterns');
const {directiveTag} = goog.require('os.ui.filter.TextNoColCheckUI');
const Op = goog.require('os.ui.filter.op.Op');


/**
 */
class IsLikeNumeric extends Op {
  /**
   * Constructor.
   * @param {string=} opt_title
   * @param {string=} opt_shortTitle
   * @param {?Array<string>=} opt_supportedTypes
   * @param {string=} opt_attributes
   * @param {string=} opt_hint
   * @param {string=} opt_ui
   */
  constructor(opt_title, opt_shortTitle, opt_supportedTypes, opt_attributes, opt_hint, opt_ui) {
    opt_title = opt_title || 'is like';
    opt_shortTitle = opt_shortTitle || 'like';
    opt_supportedTypes = opt_supportedTypes || ['integer', 'decimal'];
    opt_attributes = opt_attributes || 'hint="is like numeric"';
    opt_hint = opt_hint || 'e.g. 12.34*';
    opt_ui = opt_ui || directiveTag;

    super('And', opt_title, opt_shortTitle, opt_supportedTypes, opt_attributes, opt_hint, opt_ui);
    this.matchHint = 'is like numeric';
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    var range = this.getRangeFromLiteral(literal);
    if (range && range.length == 2 && range[0] !== range[1]) {
      // we want to include the lower bound, but not the upper bound
      return '(' + varName + '>=' + range[0] + '&&' + varName + '<' + range[1] + ')';
    }

    // range couldn't be parsed, so don't return an expression
    return '';
  }

  /**
   * @inheritDoc
   */
  getFilter(column, literal) {
    // figure out what the precision is and determine the numbers we need to stay between
    // ex.  if the input is 23.4567, we want our check to be between 23.4567 and 23.4568
    var f = '';

    var range = this.getRangeFromLiteral(literal);
    if (range && range.length == 2) {
      var attr = this.getAttributes();

      f += '<' + this.localName + (attr ? ' ' + attr : '') + '>';

      // we want to include the lower bound, but not the upper bound
      f += '<PropertyIsGreaterThanOrEqualTo>' +
          '<PropertyName>' + column + '</PropertyName>' +
          '<Literal><![CDATA[' + range[0] + ']]></Literal>' +
          '</PropertyIsGreaterThanOrEqualTo>' +
          '<PropertyIsLessThan>' +
          '<PropertyName>' + column + '</PropertyName>' +
          '<Literal><![CDATA[' + range[1] + ']]></Literal>' +
          '</PropertyIsLessThan>';

      f += '</' + this.localName + '>';
    }

    return f;
  }

  /**
   * Get the numeric range from the literal value.
   *
   * @param {?string} literal The filter literal.
   * @return {Array<number>} The range, in the form [start, end].
   * @protected
   */
  getRangeFromLiteral(literal) {
    if (literal) {
      // pull off the '*'
      var start = literal.trim().split('*')[0];
      var startNum = parseFloat(start);
      if (!isNaN(startNum)) {
        // need to preserve any trailing zeros in regards to the precision, so we will get the precision a different way
        // if there is a decimal point, find the precision based on the length of what comes after it
        var splitArr = start.split('.');
        var precision = 0;

        // if there is only one element here, there was no '.'
        if (splitArr.length == 2) {
          precision = -(splitArr[1].length);
        }

        // due to floating point storage, keep this a
        // string to ensure the right number of precision digits
        var endNum = (startNum + Math.pow(10, precision)).toFixed(Math.abs(precision));
        return [startNum, endNum];
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  validate(value, key) {
    if (!value) {
      return false;
    }

    // strip off the '*' if there is one
    var valVar = Number(value.trim().split('*')[0]);

    var pattern = FilterPatterns[key];
    if (pattern && pattern.test(valVar)) {
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  getLiteral(el) {
    return el.find('PropertyIsGreaterThanOrEqualTo Literal').text() + '*';
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
}

exports = IsLikeNumeric;

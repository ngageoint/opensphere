goog.module('os.ui.filter.op.LikeListNumeric');
goog.module.declareLegacyNamespace();

goog.require('os.ui.filter.listNoColCheckDirective');

const FilterPatterns = goog.require('os.ui.filter.FilterPatterns');
const IsLikeNumeric = goog.require('os.ui.filter.op.IsLikeNumeric');


/**
 */
class LikeListNumeric extends IsLikeNumeric {
  /**
   * Constructor.
   */
  constructor() {
    super('is like list', 'like list', ['decimal', 'integer'], '', 'eg. 12.45*, 3.568*, ...', 'fb-list-no-col-check');
    this.matchHint = 'like list numeric';
  }

  /**
   * Parses trimmed, non-empty values from a comma-separated list.
   *
   * @param {string|null|undefined} literal The literal.
   * @return {!Array<string>} Parsed non-empty list values.
   * @protected
   */
  getValuesFromLiteral(literal) {
    var result = [];

    if (literal) {
      // this should produce an array of numbers with wildcards (ex. 23.45*)
      // we don't want to impact the original value that was sent in
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
  }

  /**
   * @inheritDoc
   */
  getEvalExpression(varName, literal) {
    // default to not returning an expression, in case the literal can't be parsed
    var result = '';

    var list = this.getValuesFromLiteral(literal);
    if (list.length > 0) {
      var expressions = [];

      for (var i = 0, n = list.length; i < n; i++) {
        var expr = super.getEvalExpression(varName, list[i]);
        if (expr) {
          expressions.push(expr);
        }
      }

      if (expressions.length > 0) {
        result += '(' + expressions.join('||') + ')';
      }
    }

    return result;
  }

  /**
   * @inheritDoc
   */
  getFilter(column, literal) {
    var f = '';

    var list = this.getValuesFromLiteral(literal);
    if (list.length > 0) {
      f += '<Or ' + 'hint="like list numeric"' + '>';

      for (var i = 0, n = list.length; i < n; i++) {
        f += super.getFilter(column, list[i]);
      }

      f += '</Or>';
    }

    return f;
  }

  /**
   * @inheritDoc
   */
  validate(value, key) {
    var valid = false;
    var list = this.getValuesFromLiteral(value);
    if (list.length > 0) {
      valid = true;

      for (var i = 0, n = list.length; i < n; i++) {
        // strip off the '*' if there is one
        var valVar = Number(list[i].trim().split('*')[0]);

        var pattern = FilterPatterns[key];
        if (!pattern || !pattern.test(valVar)) {
          valid = false;
        }
      }
    }

    return valid;
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
  getLiteral(el) {
    var arr = el.find('PropertyIsGreaterThanOrEqualTo Literal');
    var literals = [];

    arr.each(function(i, domEl) {
      literals.push($(domEl).text() + '*');
    });

    return literals.join(', ');
  }
}

exports = LikeListNumeric;

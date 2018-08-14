goog.provide('os.ui.filter.op.LikeListNumeric');

goog.require('os.ui.filter.listNoColCheckDirective');
goog.require('os.ui.filter.op.IsLikeNumeric');



/**
 * @constructor
 * @extends {os.ui.filter.op.IsLikeNumeric}
 */
os.ui.filter.op.LikeListNumeric = function() {
  os.ui.filter.op.LikeListNumeric.base(this, 'constructor', 'is like list', 'like list', ['decimal', 'integer'], '',
      'eg. 12.45*, 3.568*, ...', 'fb-list-no-col-check');

  /**
  * @type {string}
  * @protected
  */
  this.matchHint = 'like list numeric';
};
goog.inherits(os.ui.filter.op.LikeListNumeric, os.ui.filter.op.IsLikeNumeric);


/**
 * Parses trimmed, non-empty values from a comma-separated list.
 * @param {string|null|undefined} literal The literal.
 * @return {!Array<string>} Parsed non-empty list values.
 * @protected
 */
os.ui.filter.op.LikeListNumeric.prototype.getValuesFromLiteral = function(literal) {
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
};


/**
 * @inheritDoc
 */
os.ui.filter.op.LikeListNumeric.prototype.getEvalExpression = function(varName, literal) {
  // default to not returning an expression, in case the literal can't be parsed
  var result = '';

  var list = this.getValuesFromLiteral(literal);
  if (list.length > 0) {
    var expressions = [];

    for (var i = 0, n = list.length; i < n; i++) {
      var expr = os.ui.filter.op.LikeListNumeric.base(this, 'getEvalExpression', varName, list[i]);
      if (expr) {
        expressions.push(expr);
      }
    }

    if (expressions.length > 0) {
      result += '(' + expressions.join('||') + ')';
    }
  }

  return result;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.LikeListNumeric.prototype.getFilter = function(column, literal) {
  var f = '';

  var list = this.getValuesFromLiteral(literal);
  if (list.length > 0) {
    f += '<Or ' + 'hint="like list numeric"' + '>';

    for (var i = 0, n = list.length; i < n; i++) {
      f += os.ui.filter.op.LikeListNumeric.base(this, 'getFilter', column, list[i]);
    }

    f += '</Or>';
  }

  return f;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.LikeListNumeric.prototype.validate = function(value, key) {
  var valid = false;
  var list = this.getValuesFromLiteral(value);
  if (list.length > 0) {
    valid = true;

    for (var i = 0, n = list.length; i < n; i++) {
      // strip off the '*' if there is one
      var valVar = Number(list[i].trim().split('*')[0]);

      var pattern = os.ui.filter.PATTERNS[key];
      if (!pattern || !pattern.test(valVar)) {
        valid = false;
      }
    }
  }

  return valid;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.LikeListNumeric.prototype.matches = function(el) {
  if (el) {
    return el.attr('hint') == this.matchHint;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ui.filter.op.LikeListNumeric.prototype.getLiteral = function(el) {
  var arr = el.find('PropertyIsGreaterThanOrEqualTo Literal');
  var literals = [];

  arr.each(function(i, domEl) {
    literals.push($(domEl).text() + '*');
  });

  return literals.join(', ');
};

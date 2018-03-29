goog.provide('os.filter.impl.ecql.FilterFormatter');
goog.require('os.filter.IFilterFormatter');


/**
 * @constructor
 * @implements {os.filter.IFilterFormatter}
 */
os.filter.impl.ecql.FilterFormatter = function() {};


/**
 * @inheritDoc
 */
os.filter.impl.ecql.FilterFormatter.prototype.format = function(filter) {
  var result = '';

  try {
    var xml = filter.getFilter();
    if (xml) {
      var doc = goog.dom.xml.loadXml(xml);
      if (doc) {
        var child = goog.dom.getFirstElementChild(doc);
        result += os.filter.impl.ecql.FilterFormatter.write_(child);
      }
    }
  } catch (e) {
  }

  return result;
};


/**
 * @type {Object<string, string>}
 * @const
 * @private
 */
os.filter.impl.ecql.FilterFormatter.ops_ = {
  'PropertyIsEqualTo': '=',
  'PropertyIsNotEqualTo': '<>',
  'PropertyIsGreaterThan': '>',
  'PropertyIsGreaterThanOrEqualTo': '>=',
  'PropertyIsLessThan': '<',
  'PropertyIsLessThanOrEqualTo': '<=',
  'PropertyIsLike': 'ILIKE',
  'PropertyIsNotLike': 'NOT ILIKE',
  'PropertyIsNull': 'IS NULL',
  'PropertyIsNotNull': 'IS NOT NULL'
};


/**
 * @param {Element} el
 * @return {string}
 * @private
 */
os.filter.impl.ecql.FilterFormatter.write_ = function(el) {
  var localName = el.localName;
  if (localName === 'And' || localName === 'Or' || localName === 'Not') {
    var children = el.children;
    var results = [];
    for (var i = 0, n = children.length; i < n; i++) {
      results.push(os.filter.impl.ecql.FilterFormatter.write_(children[i]));
    }

    var g = localName === 'Not' ? 'AND' : localName.toUpperCase();
    var result = '';

    if (results.length) {
      if (results.length > 1) {
        result = '(' + results.join(' ' + g + ' ') + ')';
      } else {
        result = results[0];
      }
    }

    if (localName === 'Not') {
      result = '(' + localName.toUpperCase() + ' ' + result + ')';
    }

    return result;
  }

  var result = '';
  var op = os.filter.impl.ecql.FilterFormatter.ops_[localName];
  var field = el.querySelector('PropertyName').textContent;
  var literal = el.querySelector('Literal');

  if (literal) {
    literal = literal.textContent;
  }

  if (op) {
    result = '(' + field + ' ' + op;

    if (literal) {
      if (/Like/.test(localName)) {
        literal = literal.replace(/[*]/g, '%');
      }

      result += ' ' + os.filter.impl.ecql.FilterFormatter.writeLiteral_(literal);
    }

    result += ')';
  }

  return result;
};


/**
 * @type {RegExp}
 * @const
 * @private
 */
os.filter.impl.ecql.FilterFormatter.IS_BOOLEAN_ = /^(true|false)$/i;


/**
 * @type {RegExp}
 * @const
 * @private
 */
os.filter.impl.ecql.FilterFormatter.QUOTE_ = /'/g;


/**
 * @type {RegExp}
 * @const
 * @private
 */
os.filter.impl.ecql.FilterFormatter.OPEN_PAREN_ = /[(]/g;


/**
 * @type {string}
 * @const
 * @private
 */
os.filter.impl.ecql.FilterFormatter.OPEN_PAREN_REPLACEMENT_ = '{openParen}';


/**
 * @type {RegExp}
 * @const
 * @private
 */
os.filter.impl.ecql.FilterFormatter.CLOSE_PAREN_ = /[)]/g;


/**
 * @type {string}
 * @const
 * @private
 */
os.filter.impl.ecql.FilterFormatter.CLOSE_PAREN_REPLACEMENT_ = '{closeParen}';


/**
 * @param {string} literal
 * @return {string}
 * @private
 */
os.filter.impl.ecql.FilterFormatter.writeLiteral_ = function(literal) {
  var val = parseFloat(literal.trim());

  if (!isNaN(val)) {
    return val.toString();
  }

  if (os.filter.impl.ecql.FilterFormatter.IS_BOOLEAN_.test(literal.trim())) {
    return literal.trim().toUpperCase();
  }

  // parens in literals will muck up the wrapGeneric function, so we will replace them with a placeholder
  // and then set them back at the end (in QueryHandler.createFilter)
  return '\'' + literal.replace(os.filter.impl.ecql.FilterFormatter.QUOTE_, '\'\'').
      replace(os.filter.impl.ecql.FilterFormatter.OPEN_PAREN_,
      os.filter.impl.ecql.FilterFormatter.OPEN_PAREN_REPLACEMENT_).
      replace(os.filter.impl.ecql.FilterFormatter.CLOSE_PAREN_,
      os.filter.impl.ecql.FilterFormatter.CLOSE_PAREN_REPLACEMENT_) + '\'';
};


/**
 * @inheritDoc
 */
os.filter.impl.ecql.FilterFormatter.prototype.wrap = function(filter, group) {
  return filter ? os.filter.impl.ecql.FilterFormatter.wrapGeneric(filter, group ? 'AND' : 'OR') : '';
};


/**
 * @param {!string} filter
 * @param {!string} group AND or OR
 * @return {!string}
 */
os.filter.impl.ecql.FilterFormatter.wrapGeneric = function(filter, group) {
  var parens = /[()]/g;
  var depth = 0;
  var i = 0;
  var results = parens.exec(filter);
  var children = [];

  while (results) {
    depth += results[0] === '(' ? 1 : -1;

    if (depth === 0) {
      children.push(filter.substring(i, results.index + 1));
      i = results.index + 1;
    }

    results = parens.exec(filter);
  }

  return children.length > 1 ? '(' + children.join(' ' + group + ' ') + ')' : filter;
};


/**
 * @inheritDoc
 */
os.filter.impl.ecql.FilterFormatter.prototype.wrapAll = function(filter) {
  return filter ? os.filter.impl.ecql.FilterFormatter.wrapGeneric(filter, 'AND') : '';
};

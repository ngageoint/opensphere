goog.module('os.filter.impl.ecql.FilterFormatter');
goog.module.declareLegacyNamespace();

const IFilterFormatter = goog.requireType('os.filter.IFilterFormatter');


/**
 * @implements {IFilterFormatter}
 */
class FilterFormatter {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  format(filter) {
    var result = '';

    try {
      var xml = filter.getFilter();
      if (xml) {
        var doc = goog.dom.xml.loadXml(xml);
        if (doc) {
          var child = goog.dom.getFirstElementChild(doc);
          result += FilterFormatter.write_(child);
        }
      }
    } catch (e) {
    }

    return result;
  }

  /**
   * @inheritDoc
   */
  wrap(filter, group) {
    return filter ? FilterFormatter.wrapGeneric(filter, group ? 'AND' : 'OR') : '';
  }

  /**
   * @inheritDoc
   */
  wrapAll(filter) {
    return filter ? FilterFormatter.wrapGeneric(filter, 'AND') : '';
  }

  /**
   * @param {Element} el
   * @return {string}
   * @private
   */
  static write_(el) {
    var localName = el.localName;
    if (localName === 'And' || localName === 'Or' || localName === 'Not') {
      var children = el.children;
      var results = [];
      for (var i = 0, n = children.length; i < n; i++) {
        results.push(FilterFormatter.write_(children[i]));
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
    var op = FilterFormatter.ops_[localName];
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

        result += ' ' + FilterFormatter.writeLiteral_(literal);
      }

      result += ')';
    }

    return result;
  }

  /**
   * @param {string} literal
   * @return {string}
   * @private
   */
  static writeLiteral_(literal) {
    var val = parseFloat(literal.trim());

    if (!isNaN(val)) {
      return val.toString();
    }

    if (FilterFormatter.IS_BOOLEAN_.test(literal.trim())) {
      return literal.trim().toUpperCase();
    }

    // parens in literals will muck up the wrapGeneric function, so we will replace them with a placeholder
    // and then set them back at the end (in QueryHandler.createFilter)
    return '\'' + literal.replace(FilterFormatter.QUOTE_, '\'\'').
        replace(FilterFormatter.OPEN_PAREN_,
            FilterFormatter.OPEN_PAREN_REPLACEMENT_).
        replace(FilterFormatter.CLOSE_PAREN_,
            FilterFormatter.CLOSE_PAREN_REPLACEMENT_) + '\'';
  }

  /**
   * @param {!string} filter
   * @param {!string} group AND or OR
   * @return {!string}
   */
  static wrapGeneric(filter, group) {
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
  }
}


/**
 * @type {Object<string, string>}
 * @const
 * @private
 */
FilterFormatter.ops_ = {
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
 * @type {RegExp}
 * @const
 * @private
 */
FilterFormatter.IS_BOOLEAN_ = /^(true|false)$/i;


/**
 * @type {RegExp}
 * @const
 * @private
 */
FilterFormatter.QUOTE_ = /'/g;


/**
 * @type {RegExp}
 * @const
 * @private
 */
FilterFormatter.OPEN_PAREN_ = /[(]/g;


/**
 * @type {string}
 * @const
 * @private
 */
FilterFormatter.OPEN_PAREN_REPLACEMENT_ = '{openParen}';


/**
 * @type {RegExp}
 * @const
 * @private
 */
FilterFormatter.CLOSE_PAREN_ = /[)]/g;


/**
 * @type {string}
 * @const
 * @private
 */
FilterFormatter.CLOSE_PAREN_REPLACEMENT_ = '{closeParen}';


exports = FilterFormatter;

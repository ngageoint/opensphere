goog.declareModuleId('os.ui.filter');

import {getAllTextContent} from 'ol/src/xml.js';
import DataManager from '../../data/datamanager.js';
import FilterEntry from '../../filter/filterentry.js';
import IFilterable from '../../filter/ifilterable.js';
import osImplements from '../../implements.js';
import {getFilterManager} from '../../query/queryinstance.js';
import Between from './op/betweenop.js';
import EqualTo from './op/equaltoop.js';
import GreaterThan from './op/greaterthanop.js';
import GreaterThanOrEqualTo from './op/greaterthanorequaltoop.js';
import InList from './op/inlistop.js';
import IsFalse from './op/isfalseop.js';
import IsLikeNumeric from './op/islikenumericop.js';
import IsLike from './op/islikeop.js';
import IsNull from './op/isnullop.js';
import IsTrue from './op/istrueop.js';
import LessThan from './op/lessthanop.js';
import LessThanOrEqualTo from './op/lessthanorequaltoop.js';
import LikeListNumeric from './op/likelistnumericop.js';
import LikeList from './op/likelistop.js';
import NotBetween from './op/notbetweenop.js';
import NotEqualTo from './op/notequaltoop.js';
import NotLike from './op/notlikeop.js';
import NotNull from './op/notnullop.js';
import Not from './op/notop.js';
import BetweenTime from './op/time/betweentimeop.js';
import NewerThan from './op/time/newerthanop.js';
import OlderThan from './op/time/olderthanop.js';

const {getFirstElementChild, setTextContent} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');
const {contains, isEmptyOrWhitespace, stripQuotes} = goog.require('goog.string');

const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');
const {default: Op} = goog.requireType('os.ui.filter.op.Op');


/**
 * @enum {string}
 */
export const Condition = {
  AND: 'And',
  OR: 'Or',
  NOT: 'Not'
};

/**
 * Filter conditions.
 * @type {!Array<!string>}
 */
export const CONDITIONS = [
  Condition.AND,
  Condition.OR,
  Condition.NOT
];

/**
 * The set of all available filter operations in our tools.
 * @type {!Array<!Op>}
 */
export const OPERATIONS = [
  new EqualTo(),
  new NotEqualTo(),
  new LessThan(),
  new LessThanOrEqualTo(),
  new GreaterThan(),
  new GreaterThanOrEqualTo(),
  new IsLike(),
  new NotLike(),
  new Between(),
  new NotBetween(),
  new IsNull(),
  new NotNull(),
  new InList(),
  new Not(new InList()),
  new LikeList(),
  new Not(new LikeList()),
  new IsLikeNumeric(),
  new LikeListNumeric(),
  new IsTrue(),
  new IsFalse(),
  new NewerThan(),
  new BetweenTime(),
  new OlderThan()
];

/**
 * The delimiter used to separate filter keys.
 * @type {string}
 */
export const FILTER_KEY_DELIMITER = '!!';


/**
 * Field for storing the current timestamp on the window object. This is an ugly way to do this, but the value is
 * read by functions instantiated in an unusual way, so it needs to be defined in an unminified way.
 * @type {number}
 */
window['currentFilterTimestamp'] = Date.now();


/**
 * Spatial filter node names.
 * @type {!Array<string>}
 */
export const SPATIAL = ['Intersects', 'Disjoint', 'BBOX'];

/**
 * Takes an individual element in a filter string and creates an SQL-like string to represent it. If the optional
 * parameter is true, it creates a true SQL expression.
 *
 * @param {Node} node The element to stringify
 * @param {boolean=} opt_sql Whether to format as SQL-like rather than simple pretty print
 * @return {string}
 */
export const toElementString = function(node, opt_sql) {
  var label = '';
  if (node != null) {
    if (isExpression(node)) {
      var children = node.childNodes;
      if (children && children.length > 0) {
        var column = getColumnName(children);

        if (children.length > 1) {
          var s = getPropertyName(children, opt_sql);
          var opTitle = operationTitleFromNode(node);
          label += column + ' ' + opTitle + ' ' + s;
        } else if (children.length == 1) {
          // this is an "is empty" filter
          if (opt_sql) {
            // SQL should account for both the empty string and null cases
            label += column + ' = \'\' or ' + column + ' is null';
          } else {
            // pretty version just spits it out
            label += column + ' is empty';
          }
        }
      }
    } else {
      var condition = conditionFromNode(node);
      if (condition) {
        label += condition;
      }
    }
  }
  return label != null ? label : '';
};

/**
 * Convert a filter node to a string.
 *
 * @param {Node} node The filter node
 * @param {number=} opt_maxlen Maximum output length
 * @param {boolean=} opt_sql Whether to format as SQL-like rather than simple pretty print
 * @return {string}
 */
export const toFilterString = function(node, opt_maxlen, opt_sql) {
  var maxlen = opt_maxlen != null ? opt_maxlen : -1;
  var result = '';

  if (node && SPATIAL.indexOf(node.localName) == -1) {
    var children = node.childNodes;
    var parentCondition = conditionFromNode(node);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];

      // add the condition between child values
      if (i > 0 && parentCondition) {
        result += ' ' + parentCondition.toUpperCase() + ' ';
      }

      // add the child value
      var condition = conditionFromNode(child);
      if (condition === Condition.NOT) {
        // write it as a NOT() grouping
        result += condition.toUpperCase() + ' (' + toFilterString(child, undefined, opt_sql) + ')';
      } else if (condition) {
        // write it as whatever grouping it is
        result += '(' + toFilterString(child, undefined, opt_sql) + ')';
      } else if (child.localName === 'PropertyIsNotEqualTo' && opt_sql) {
        // write it as a NOT() grouping because certain very bad server implementations don't handle !=
        var newChildren = child.childNodes;
        var columnName = getColumnName(newChildren);
        var propName = getPropertyName(newChildren);
        result += 'NOT (' + columnName + ' = ' + propName + ')';
      } else {
        // write the element
        result += toElementString(child, opt_sql);
      }
    }
  }

  if (maxlen > 0 && result.length > maxlen) {
    result = result.substr(0, maxlen - 3) + '...';
  }

  return result;
};

/**
 * Converts an array of filters to a pretty-printed string.
 *
 * @param {Array<!FilterEntry>|FilterEntry} filters The filters
 * @param {boolean=} opt_and If the filters are ANDed together
 * @param {boolean=} opt_noNewline Whether to use a newline or a space
 * @param {boolean=} opt_sql Whether to format as SQL-like rather than simple pretty print
 * @return {string} The pretty filter
 */
export const prettyPrint = function(filters, opt_and, opt_noNewline, opt_sql) {
  var and = opt_and != null ? opt_and : true;
  var spaceOrNewline = opt_noNewline === true ? ' ' : '\n';
  var prettyStr = '';
  if (filters) {
    if (filters instanceof FilterEntry) {
      filters = [filters];
    }

    for (var i = 0; i < filters.length; i++) {
      // we're not checking if the filter is enabled because that's handled by the query manager. this function assumes
      // all passed filters are desired in the output.
      var filter = filters[i] ? filters[i].getFilter() : null;
      if (filter) {
        try {
          var filterDoc = loadXml(filter);
          var filterNode = getFirstElementChild(filterDoc);
          if (filterNode) {
            var filterStr = toFilterString(makeCaseInsensitive(filterNode),
                undefined, opt_sql);
            if (filterStr) {
              if (prettyStr) {
                prettyStr += ' ' + (and ? 'AND' : 'OR') + spaceOrNewline + '(' + filterStr;
              } else {
                prettyStr = '(' + filterStr;
              }

              prettyStr += ')';
            }
          }
        } catch (e) {
        }
      }
    }
  }

  return prettyStr;
};

/**
 * Checks for an 'is like' filter and makes it case insensitive
 *
 * @param {Node} node the filter node
 * @return {Node} the modified filter node
 */
export const makeCaseInsensitive = function(node) {
  var modNode = node;
  if (modNode) {
    // need to check if this is an "is like" or "is like list" filter for strings
    var isLikes = modNode.getElementsByTagName('PropertyIsLike');
    if (isLikes.length != 0) {
      for (var j = 0; j < isLikes.length; j++) {
        var colName = 'UPPER(' + getColumnName(isLikes[j].childNodes) +
            ')';
        if (isLikes[j].querySelector('PropertyName') != null) {
          setTextContent(isLikes[j].querySelector('PropertyName'), colName);
        }

        if (isLikes[j].querySelector('Literal') != null) {
          var literal = stripQuotes(getPropertyName(isLikes[j].childNodes), '\'')
              .toUpperCase();
          // add wildcards to each end if none were entered by the user
          // this does make this more like a "contains" filter, but users think this may be less confusing in
          // cases like the arc server where there are spaces in the data that are unexpected
          if (!contains(literal, '*')) {
            literal = '*' + literal + '*';
          }
          setTextContent(isLikes[j].querySelector('Literal'), literal);
        }
      }
    }
  }
  return modNode;
};

/**
 * Gets the column name from a list of children.
 *
 * @param {NodeList} children
 * @return {string}
 */
export const getColumnName = function(children) {
  var s = '';

  if (children && children[0]) {
    s = getAllTextContent(children[0], true).trim();
  }

  return s;
};

/**
 * Gets the property name from the children of a condition node.
 *
 * @param {NodeList} children
 * @param {boolean=} opt_sql
 * @return {string}
 */
export const getPropertyName = function(children, opt_sql) {
  var s = '';

  if (children && children[1]) {
    s = children[1].textContent || '';
    s = isNaN(s) ? '\'' + s + '\'' : s;

    if (opt_sql && contains(s, '*')) {
      // asterisk wildcards must be replaced with % for the true SQL expression.
      s = s.replace(/\*/g, '%');
    }
  }

  return s;
};

/**
 * Check if something is a filter condition.
 *
 * @param {Node} node The filter node
 * @return {boolean}
 */
export const isCondition = function(node) {
  return node != null && conditionFromNode(node) != null;
};

/**
 * Check if something is a filter expression.
 *
 * @param {Node} node The filter node
 * @return {boolean}
 */
export const isExpression = function(node) {
  if (node) {
    var parent = node.parentNode;
    return parent != null && !isCondition(node) && isCondition(parent);
  }

  return false;
};

/**
 * Check if something is a filter operation (equals, is like, is empty, etc).
 *
 * @param {Node} node The thing to check
 * @return {boolean}
 */
export const isOperation = function(node) {
  return operationFromNode(node) != null;
};

/**
 * Get the filter And, Or or Not grouping condition represented by a node.
 *
 * @param {Node} node The filter node
 * @return {?string} The condition, or null if none found
 */
export const conditionFromNode = function(node) {
  if (node) {
    var string = getString_(node);
    if (string) {
      var i = CONDITIONS.indexOf(string);
      if (i > -1) {
        return CONDITIONS[i];
      }
    }
  }

  return null;
};

/**
 * Get the filter operation represented by a node.
 *
 * @param {Node} node The node
 * @return {Op}
 */
export const operationFromNode = function(node) {
  if (node) {
    var el = angular.element(node);
    return OPERATIONS.find((op) => op.matches(el)) || null;
  }

  return null;
};

/**
 * Get the filter operation title (equals, is like, is empty, etc) represented by a node.
 *
 * @param {Node} node The node
 * @return {?string}
 */
export const operationTitleFromNode = function(node) {
  if (node) {
    for (var i = 0, j = OPERATIONS.length; i < j; i++) {
      if (OPERATIONS[i].getLocalName() == node.localName) {
        return OPERATIONS[i].getShortTitle();
      }
    }
  }

  return null;
};

/**
 * Get the string value of a filter component, usuall the And, Or or Not groping.
 *
 * @param {?(Node|Object|string)} something The component
 * @return {?string}
 */
const getString_ = function(something) {
  if (something instanceof Node) {
    return something.localName;
  } else if (typeof something == 'string') {
    return something;
  } else if (something) {
    return String(something);
  }

  return null;
};

/**
 * Gets a filterable item by its type ID.
 *
 * @param {string} type
 * @return {?IFilterable}
 */
export const getFilterableByType = function(type) {
  return getFilterManager().getFilterable(type);
};

/**
 * Gets a filterable item by its filter key.
 *
 * @param {string} key
 * @return {?IFilterable}
 */
export const getFilterableByFilterKey = function(key) {
  var descriptors = DataManager.getInstance().getDescriptors();
  var filterable = null;

  for (var i = 0, ii = descriptors.length; i < ii; i++) {
    var f = /** @type {IFilterable} */ (descriptors[i]);
    try {
      var filterKey = f.getFilterKey();
      if (filterKey === key) {
        filterable = f;
        break;
      }
    } catch (e) {
      // not an IFilterable descriptor
    }
  }

  return filterable;
};

/**
 * Gets a filter key for a filterable by its type ID.
 *
 * @param {string} type
 * @return {?string}
 */
export const getFilterKeyFromType = function(type) {
  var filterable = getFilterableByType(type);
  if (filterable) {
    return filterable.getFilterKey();
  }
  return null;
};

/**
 * Filters columns that cannot be handled by the filter builder.
 *
 * @param {Object} col
 * @param {number} c
 * @param {Array} arr
 * @return {boolean} Whether or not the column is supported
 */
export const filterColumns = function(col, c, arr) {
  // see if there are any ops that support this column
  for (var i = 0, n = OPERATIONS.length; i < n; i++) {
    var op = OPERATIONS[i];
    if (op.isSupported(col['type'])) {
      return true;
    }
  }

  return false;
};

/**
 * Gets the filterable types from a filterable descriptor.
 *
 * @param {string} type The type.
 * @return {!Array<string>}
 */
export const getFilterableTypes = function(type) {
  var types = [];

  if (!isEmptyOrWhitespace(type)) {
    // find the filterable descriptor to which that filter belongs
    var descriptors = DataManager.getInstance().getDescriptors();
    var filterables = /** @type {!Array<!IFilterable>} */ (descriptors.filter(
        /**
         * @param {!IDataDescriptor} item The descriptor item
         * @return {boolean} whether or not it matches our key
         */
        function(item) {
          if (osImplements(item, IFilterable.ID)) {
            var f = /** @type {IFilterable} */ (item);
            return f.getFilterKey() === type;
          }

          return false;
        }));

    if (filterables.length) {
      types = filterables.reduce(
          /**
           * @param {!Array<!string>} types the list of types
           * @param {!IFilterable} item The IFilterable instance
           * @return {!Array<!string>} the list of types
           */
          function(types, item) {
            types = types.concat(item.getFilterableTypes());
            return types;
          }, types);
    } else {
      // extract the type the hard way
      var bangIdx = type.lastIndexOf(FILTER_KEY_DELIMITER);
      var hashIdx = type.indexOf('#');
      if (bangIdx != -1) {
        type = type.substring(bangIdx + 2);
        if (type.lastIndexOf(':') != -1) {
          type = type.substring(type.lastIndexOf(':') + 1);
        }
      } else if (hashIdx != -1) {
        type = type.substring(hashIdx + 1);
        if (type.indexOf('#') != -1) {
          type = type.substring(0, type.lastIndexOf('#'));
        }
      }

      types.push(type);
    }
  }

  return types;
};

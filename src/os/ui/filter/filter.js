goog.provide('os.ui.filter');

goog.require('goog.dom');
goog.require('goog.string');
goog.require('os.implements');
goog.require('os.ui.filter.op.Between');
goog.require('os.ui.filter.op.EqualTo');
goog.require('os.ui.filter.op.GreaterThan');
goog.require('os.ui.filter.op.GreaterThanOrEqualTo');
goog.require('os.ui.filter.op.InList');
goog.require('os.ui.filter.op.IsLike');
goog.require('os.ui.filter.op.IsLikeNumeric');
goog.require('os.ui.filter.op.IsNull');
goog.require('os.ui.filter.op.LessThan');
goog.require('os.ui.filter.op.LessThanOrEqualTo');
goog.require('os.ui.filter.op.LikeList');
goog.require('os.ui.filter.op.LikeListNumeric');
goog.require('os.ui.filter.op.Not');
goog.require('os.ui.filter.op.NotBetween');
goog.require('os.ui.filter.op.NotEqualTo');
goog.require('os.ui.filter.op.NotLike');
goog.require('os.ui.filter.op.NotNull');
goog.require('os.ui.filter.op.Op');


/**
 * @enum {string}
 */
os.ui.filter.Condition = {
  AND: 'And',
  OR: 'Or',
  NOT: 'Not'
};


/**
 * Filter conditions.
 * @type {!Array<!string>}
 * @const
 */
os.ui.filter.CONDITIONS = [
  os.ui.filter.Condition.AND,
  os.ui.filter.Condition.OR,
  os.ui.filter.Condition.NOT
];


/**
 * The set of all available filter operations in our tools.
 * @type {!Array<!os.ui.filter.op.Op>}
 * @const
 */
os.ui.filter.OPERATIONS = [
  new os.ui.filter.op.EqualTo(),
  new os.ui.filter.op.NotEqualTo(),
  new os.ui.filter.op.LessThan(),
  new os.ui.filter.op.LessThanOrEqualTo(),
  new os.ui.filter.op.GreaterThan(),
  new os.ui.filter.op.GreaterThanOrEqualTo(),
  new os.ui.filter.op.IsLike(),
  new os.ui.filter.op.NotLike(),
  new os.ui.filter.op.Between(),
  new os.ui.filter.op.NotBetween(),
  new os.ui.filter.op.IsNull(),
  new os.ui.filter.op.NotNull(),
  new os.ui.filter.op.InList(),
  new os.ui.filter.op.Not(new os.ui.filter.op.InList()),
  new os.ui.filter.op.LikeList(),
  new os.ui.filter.op.Not(new os.ui.filter.op.LikeList()),
  new os.ui.filter.op.IsLikeNumeric(),
  new os.ui.filter.op.LikeListNumeric()
];


/**
 * Spatial filter node names.
 * @type {!Array<string>}
 * @const
 */
os.ui.filter.SPATIAL = ['Intersects', 'Disjoint', 'BBOX'];


/**
 * Takes an individual element in a filter string and creates an SQL-like string to represent it. If the optional
 * parameter is true, it creates a true SQL expression.
 * @param {Node} node The element to stringify
 * @param {boolean=} opt_sql Whether to format as SQL-like rather than simple pretty print
 * @return {string}
 */
os.ui.filter.toElementString = function(node, opt_sql) {
  var label = '';
  if (node != null) {
    if (os.ui.filter.isExpression(node)) {
      var children = node.childNodes;
      if (children && children.length > 0) {
        var column = os.ui.filter.getColumnName(children);

        if (children.length > 1) {
          var s = os.ui.filter.getPropertyName(children, opt_sql);
          var opTitle = os.ui.filter.operationTitleFromNode(node);
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
      var condition = os.ui.filter.conditionFromNode(node);
      if (condition) {
        label += condition;
      }
    }
  }
  return label != null ? label : '';
};


/**
 * Convert a filter node to a string.
 * @param {Node} node The filter node
 * @param {number=} opt_maxlen Maximum output length
 * @param {boolean=} opt_sql Whether to format as SQL-like rather than simple pretty print
 * @return {string}
 */
os.ui.filter.toFilterString = function(node, opt_maxlen, opt_sql) {
  var maxlen = opt_maxlen != null ? opt_maxlen : -1;
  var result = '';

  if (node && os.ui.filter.SPATIAL.indexOf(node.localName) == -1) {
    var children = node.childNodes;
    var parentCondition = os.ui.filter.conditionFromNode(node);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];

      // add the condition between child values
      if (i > 0 && parentCondition) {
        result += ' ' + parentCondition.toUpperCase() + ' ';
      }

      // add the child value
      var condition = os.ui.filter.conditionFromNode(child);
      if (condition === os.ui.filter.Condition.NOT) {
        // write it as a NOT() grouping
        result += condition.toUpperCase() + ' (' + os.ui.filter.toFilterString(child, undefined, opt_sql) + ')';
      } else if (condition) {
        // write it as whatever grouping it is
        result += '(' + os.ui.filter.toFilterString(child, undefined, opt_sql) + ')';
      } else if (child.localName === 'PropertyIsNotEqualTo' && opt_sql) {
        // write it as a NOT() grouping because certain very bad server implementations don't handle !=
        var newChildren = child.childNodes;
        var columnName = os.ui.filter.getColumnName(newChildren);
        var propName = os.ui.filter.getPropertyName(newChildren);
        result += 'NOT (' + columnName + ' = ' + propName + ')';
      } else {
        // write the element
        result += os.ui.filter.toElementString(child, opt_sql);
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
 * @param {Array<!os.filter.FilterEntry>|os.filter.FilterEntry} filters The filters
 * @param {boolean=} opt_and If the filters are ANDed together
 * @param {boolean=} opt_noNewline Whether to use a newline or a space
 * @param {boolean=} opt_sql Whether to format as SQL-like rather than simple pretty print
 * @return {string} The pretty filter
 */
os.ui.filter.prettyPrint = function(filters, opt_and, opt_noNewline, opt_sql) {
  var and = opt_and != null ? opt_and : true;
  var spaceOrNewline = opt_noNewline === true ? ' ' : '\n';
  var prettyStr = '';
  if (filters) {
    if (filters instanceof os.filter.FilterEntry) {
      filters = [filters];
    }

    for (var i = 0; i < filters.length; i++) {
      // we're not checking if the filter is enabled because that's handled by the query manager. this function assumes
      // all passed filters are desired in the output.
      var filter = filters[i] ? filters[i].getFilter() : null;
      if (filter) {
        try {
          var filterDoc = goog.dom.xml.loadXml(filter);
          var filterNode = goog.dom.getFirstElementChild(filterDoc);
          if (filterNode) {
            var filterStr = os.ui.filter.toFilterString(os.ui.filter.makeCaseInsensitive(filterNode),
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
 * @param {Node} node the filter node
 * @return {Node} the modified filter node
 */
os.ui.filter.makeCaseInsensitive = function(node) {
  var modNode = node;
  if (modNode) {
    // need to check if this is an "is like" or "is like list" filter for strings
    var isLikes = modNode.getElementsByTagName('PropertyIsLike');
    if (isLikes.length != 0) {
      for (var j = 0; j < isLikes.length; j++) {
        var colName = 'UPPER(' + os.ui.filter.getColumnName(isLikes[j].childNodes) +
            ')';
        if (isLikes[j].querySelector('PropertyName') != null) {
          goog.dom.setTextContent(isLikes[j].querySelector('PropertyName'), colName);
        }

        if (isLikes[j].querySelector('Literal') != null) {
          var literal = goog.string.stripQuotes(os.ui.filter.getPropertyName(isLikes[j].childNodes), '\'')
              .toUpperCase();
          // add wildcards to each end if none were entered by the user
          // this does make this more like a "contains" filter, but users think this may be less confusing in
          // cases like the arc server where there are spaces in the data that are unexpected
          if (!goog.string.contains(literal, '*')) {
            literal = '*' + literal + '*';
          }
          goog.dom.setTextContent(isLikes[j].querySelector('Literal'), literal);
        }
      }
    }
  }
  return modNode;
};


/**
 * Gets the column name from a list of children.
 * @param {NodeList} children
 * @return {string}
 */
os.ui.filter.getColumnName = function(children) {
  var s = '';

  if (children && children[0]) {
    s = ol.xml.getAllTextContent(children[0], true).trim();
  }

  return s;
};


/**
 * Gets the property name from the children of a condition node.
 * @param {NodeList} children
 * @param {boolean=} opt_sql
 * @return {string}
 */
os.ui.filter.getPropertyName = function(children, opt_sql) {
  var s = '';

  if (children && children[1]) {
    s = children[1].textContent || '';
    s = isNaN(s) ? '\'' + s + '\'' : s;

    if (opt_sql && goog.string.contains(s, '*')) {
      // asterisk wildcards must be replaced with % for the true SQL expression.
      s = s.replace(/\*/g, '%');
    }
  }

  return s;
};


/**
 * Check if something is a filter condition.
 * @param {Node} node The filter node
 * @return {boolean}
 */
os.ui.filter.isCondition = function(node) {
  return node != null && os.ui.filter.conditionFromNode(node) != null;
};


/**
 * Check if something is a filter expression.
 * @param {Node} node The filter node
 * @return {boolean}
 */
os.ui.filter.isExpression = function(node) {
  if (node) {
    var parent = node.parentNode;
    return parent != null && !os.ui.filter.isCondition(node) && os.ui.filter.isCondition(parent);
  }

  return false;
};


/**
 * Check if something is a filter operation (equals, is like, is empty, etc).
 * @param {Node} node The thing to check
 * @return {boolean}
 */
os.ui.filter.isOperation = function(node) {
  return os.ui.filter.operationFromNode(node) != null;
};


/**
 * Get the filter And, Or or Not grouping condition represented by a node.
 * @param {Node} node The filter node
 * @return {?string} The condition, or null if none found
 */
os.ui.filter.conditionFromNode = function(node) {
  if (node) {
    var string = os.ui.filter.getString_(node);
    if (string) {
      var i = os.ui.filter.CONDITIONS.indexOf(string);
      if (i > -1) {
        return os.ui.filter.CONDITIONS[i];
      }
    }
  }

  return null;
};


/**
 * Get the filter operation represented by a node.
 * @param {Node} node The node
 * @return {os.ui.filter.op.Op}
 */
os.ui.filter.operationFromNode = function(node) {
  if (node) {
    var el = angular.element(node);
    return goog.array.find(os.ui.filter.OPERATIONS, function(op) {
      return op.matches(el);
    });
  }

  return null;
};


/**
 * Get the filter operation title (equals, is like, is empty, etc) represented by a node.
 * @param {Node} node The node
 * @return {?string}
 */
os.ui.filter.operationTitleFromNode = function(node) {
  if (node) {
    for (var i = 0, j = os.ui.filter.OPERATIONS.length; i < j; i++) {
      if (os.ui.filter.OPERATIONS[i].getLocalName() == node.localName) {
        return os.ui.filter.OPERATIONS[i].getShortTitle();
      }
    }
  }

  return null;
};


/**
 * Get the string value of a filter component, usuall the And, Or or Not groping.
 * @param {?(Node|Object|string)} something The component
 * @return {?string}
 * @private
 */
os.ui.filter.getString_ = function(something) {
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
 * @param {string} type
 * @return {?os.filter.IFilterable}
 */
os.ui.filter.getFilterableByType = function(type) {
  var filterable = os.ui.filterManager.getFilterable(type);
  return filterable;
};


/**
 * Gets a filterable item by its filter key.
 * @param {string} key
 * @return {?os.filter.IFilterable}
 */
os.ui.filter.getFilterableByFilterKey = function(key) {
  var descriptors = os.dataManager.getDescriptors();
  var filterable = null;

  for (var i = 0, ii = descriptors.length; i < ii; i++) {
    var f = /** @type {os.filter.IFilterable} */ (descriptors[i]);
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
 * @param {string} type
 * @return {?string}
 */
os.ui.filter.getFilterKeyFromType = function(type) {
  var filterable = os.ui.filter.getFilterableByType(type);
  if (filterable) {
    return filterable.getFilterKey();
  }
  return null;
};


/**
 * Filters columns that cannot be handled by the filter builder.
 * @param {Object} col
 * @param {number} c
 * @param {Array} arr
 * @return {boolean} Whether or not the column is supported
 */
os.ui.filter.filterColumns = function(col, c, arr) {
  // see if there are any ops that support this column
  for (var i = 0, n = os.ui.filter.OPERATIONS.length; i < n; i++) {
    var op = os.ui.filter.OPERATIONS[i];
    if (op.isSupported(col['type'])) {
      return true;
    }
  }

  return false;
};


/**
 * Gets the filterable types from a filterable descriptor.
 * @param {string} type The type.
 * @return {!Array<string>}
 */
os.ui.filter.getFilterableTypes = function(type) {
  var types = [];

  if (!goog.string.isEmptyOrWhitespace(type)) {
    // find the filterable descriptor to which that filter belongs
    var descriptors = os.dataManager.getDescriptors();
    var filterables = /** @type {!Array<!os.filter.IFilterable>} */ (descriptors.filter(
        /**
         * @param {!os.data.IDataDescriptor} item The descriptor item
         * @return {boolean} whether or not it matches our key
         */
        function(item) {
          if (os.implements(item, os.filter.IFilterable.ID)) {
            var f = /** @type {os.filter.IFilterable} */ (item);
            return f.getFilterKey() === type;
          }

          return false;
        }));

    if (filterables.length) {
      types = filterables.reduce(
          /**
           * @param {!Array<!string>} types the list of types
           * @param {!os.filter.IFilterable} item The IFilterable instance
           * @return {!Array<!string>} the list of types
           */
          function(types, item) {
            types = types.concat(item.getFilterableTypes());
            return types;
          }, types);
    } else {
      // extract the type the hard way
      var bangIdx = type.lastIndexOf('!!');
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

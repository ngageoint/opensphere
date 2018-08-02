goog.provide('os.ui.filter.fn');

goog.require('goog.array');
goog.require('goog.functions');
goog.require('ol.xml');
goog.require('os.string');
goog.require('os.ui.filter');
goog.require('os.ui.filter.Expression');


/**
 * @typedef {function(...):boolean}
 */
os.ui.filter.fn.FilterFn;


/**
 * @typedef {function(string, string):string}
 */
os.ui.filter.fn.ValueGetter;


/**
 * Default value getter for objects.
 * @param {string} itemVar The item variable name.
 * @param {string} field The field to get from the item.
 * @return {string} The get expression.
 */
os.ui.filter.fn.defaultGetter = function(itemVar, field) {
  // create the string: itemVar["column_name"]
  // make the field safe for use as an object property name, to prevent injection attacks
  return itemVar + '[' + os.ui.filter.string.quoteString(field) + ']';
};


/**
 * Create a variable to use in a filter function.
 * @param {string} varName The variable name.
 * @param {string} getExpr The value get expression.
 * @return {string} The variable expression.
 */
os.ui.filter.fn.varDeclaration = function(varName, getExpr) {
  return 'var ' + varName + '=' + String(getExpr) + ';';
};


/**
 * Create a function to evaluate a filter from a filter entry.
 * @param {!os.filter.FilterEntry} entry The filter entry.
 * @param {os.ui.filter.fn.ValueGetter=} opt_getter Function to get field values.
 * @return {!os.ui.filter.fn.FilterFn} The filter function.
 */
os.ui.filter.fn.createFromEntry = function(entry, opt_getter) {
  var rootNode = entry.getFilterNode();
  if (rootNode) {
    return os.ui.filter.fn.createFromNode(rootNode, opt_getter);
  }

  // entry doesn't have a filter - don't match anything
  return goog.functions.FALSE;
};


/**
 * Create a function to evaluate a filter from an XML node.
 * @param {!Node} node The filter node.
 * @param {os.ui.filter.fn.ValueGetter=} opt_getter Function to get field values.
 * @return {!os.ui.filter.fn.FilterFn} The filter function.
 */
os.ui.filter.fn.createFromNode = function(node, opt_getter) {
  var getter = opt_getter || os.ui.filter.fn.defaultGetter;
  var itemVar = 'item';
  var fnParts = [];

  // create map of filter properties to variable names
  var vars = os.ui.filter.fn.createVarMap(node);

  // must have at least one variable to create a test expression
  if (!goog.object.isEmpty(vars)) {
    // declare variables in the function
    for (var key in vars) {
      var getExpr = getter(itemVar, key);
      fnParts.push(os.ui.filter.fn.varDeclaration(vars[key], getExpr));
    }

    // create return expression
    var nodeExpression = os.ui.filter.fn.getNodeExpression(node, vars);

    // if an expression was created, create the function
    if (!goog.string.isEmptyOrWhitespace(nodeExpression)) {
      fnParts.push('return ', nodeExpression, ';');

      var fnStr = fnParts.join('');
      return Function(itemVar, fnStr);
    }
  }

  // default to returning a function that will not match anything
  return goog.functions.FALSE;
};


/**
 * Create a variable map from all PropertyName elements under a node.
 * @param {!Node} node The node.
 * @return {!Object<string, string>} Map of property names to variable names.
 */
os.ui.filter.fn.createVarMap = function(node) {
  var vars = {};

  // get all property names used in the filter
  var propNameNodes = node.querySelectorAll('PropertyName');
  var propNames = [];
  for (var i = 0; i < propNameNodes.length; i++) {
    var nodeText = ol.xml.getAllTextContent(propNameNodes[i], true).trim();
    if (nodeText && propNames.indexOf(nodeText) == -1) {
      propNames.push(nodeText);
    }
  }

  // create a variable for each value tested
  propNames.forEach(function(prop, idx, arr) {
    if (prop) {
      vars[prop] = 'v' + idx;
    }
  });

  return vars;
};


/**
 * Create a filter function string from an XML node.
 * @param {!Node} node The filter node.
 * @param {!Object<string, string>} vars Map of property names to variable names.
 * @return {string} The filter function expression for the node.
 */
os.ui.filter.fn.getNodeExpression = function(node, vars) {
  // try to get an operation first. some ops will match condition nodes (in list, like list) via hint.
  var op = os.ui.filter.operationFromNode(node);
  if (op) {
    return os.ui.filter.fn.createFromExpressionNode(node, vars);
  } else {
    // not an operation node, so check if it's a condition.
    var condition = os.ui.filter.conditionFromNode(node);
    if (condition) {
      return os.ui.filter.fn.createFromConditionNode(node, vars, condition);
    }
  }

  // not a recognized expression or condition
  return '';
};


/**
 * Create a filter function string from an XML condition node.
 * @param {!Node} node The filter node.
 * @param {!Object<string, string>} vars Map of property names to variable names.
 * @param {string} condition The condition value.
 * @return {string} The filter function expression for the node.
 */
os.ui.filter.fn.createFromConditionNode = function(node, vars, condition) {
  var children = node.childNodes;
  if (children && children.length > 0) {
    var fnParts = [];
    for (var i = 0; i < children.length; i++) {
      var childFilter = os.ui.filter.fn.getNodeExpression(children[i], vars);
      if (!goog.string.isEmptyOrWhitespace(childFilter)) {
        fnParts.push(childFilter);
      }
    }

    if (fnParts.length > 0) {
      switch (condition) {
        case os.ui.filter.Condition.AND:
          return '(' + fnParts.join('&&') + ')';
        case os.ui.filter.Condition.OR:
          return '(' + fnParts.join('||') + ')';
        case os.ui.filter.Condition.NOT:
          // if a NOT has multiple children, the result should be false if any child expression is true
          return '!(' + fnParts.join('||') + ')';
        default:
          break;
      }
    }
  }

  // no children or unrecognized condition
  return '';
};


/**
 * Create a filter function string from an XML expression node.
 * @param {!Node} node The filter node.
 * @param {!Object<string, string>} vars Map of property names to variable names.
 * @return {string} The filter function expression for the node.
 */
os.ui.filter.fn.createFromExpressionNode = function(node, vars) {
  var expr = new os.ui.filter.Expression();
  expr.setFilter(node);

  if (expr['op'] && expr.columnName) {
    var op = /** @type {!os.ui.filter.op.Op} */ (expr['op']);
    var varName = vars[expr.columnName];
    if (varName) {
      return op.getEvalExpression(varName, /** @type {?string} */ (expr['literal']));
    }
  }

  return '';
};

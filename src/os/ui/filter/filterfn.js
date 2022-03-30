goog.declareModuleId('os.ui.filter.fn');

import {getAllTextContent} from 'ol/src/xml.js';
import Expression from './expression.js';
import {Condition, operationFromNode, conditionFromNode} from './filter.js';
import {quoteString} from './filterstring.js';

const {FALSE} = goog.require('goog.functions');
const {isEmpty} = goog.require('goog.object');
const {isEmptyOrWhitespace} = goog.require('goog.string');

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');
const {default: Op} = goog.requireType('os.ui.filter.op.Op');


/**
 * @typedef {function(...):boolean}
 */
export let FilterFn;

/**
 * @typedef {function(string, string):string}
 */
export let ValueGetter;

/**
 * Default value getter for objects.
 *
 * @param {string} itemVar The item variable name.
 * @param {string} field The field to get from the item.
 * @return {string} The get expression.
 */
export const defaultGetter = function(itemVar, field) {
  // create the string: itemVar["column_name"]
  // make the field safe for use as an object property name, to prevent injection attacks
  return itemVar + '[' + quoteString(field) + ']';
};

/**
 * Create a variable to use in a filter function.
 *
 * @param {string} varName The variable name.
 * @param {string} getExpr The value get expression.
 * @return {string} The variable expression.
 */
export const varDeclaration = function(varName, getExpr) {
  return 'var ' + varName + '=' + String(getExpr) + ';';
};

/**
 * Create a function to evaluate a filter from a filter entry.
 *
 * @param {!FilterEntry} entry The filter entry.
 * @param {?ValueGetter=} opt_getter Function to get field values.
 * @return {!FilterFn} The filter function.
 */
export const createFromEntry = function(entry, opt_getter) {
  var rootNode = entry.getFilterNode();
  if (rootNode) {
    return createFromNode(rootNode, opt_getter);
  }

  // entry doesn't have a filter - don't match anything
  return FALSE;
};

/**
 * Create a function to evaluate a filter from an XML node.
 *
 * @param {!Node} node The filter node.
 * @param {?ValueGetter=} opt_getter Function to get field values.
 * @return {!FilterFn} The filter function.
 */
export const createFromNode = function(node, opt_getter) {
  var getter = opt_getter || defaultGetter;
  var itemVar = 'item';
  var fnParts = [];

  // create map of filter properties to variable names
  var vars = createVarMap(node);

  // must have at least one variable to create a test expression
  if (!isEmpty(vars)) {
    // declare variables in the function
    for (var key in vars) {
      var getExpr = getter(itemVar, key);
      fnParts.push(varDeclaration(vars[key], getExpr));
    }

    // create return expression
    var nodeExpression = getNodeExpression(node, vars);

    // if an expression was created, create the function
    if (!isEmptyOrWhitespace(nodeExpression)) {
      fnParts.push('return ', nodeExpression, ';');

      var fnStr = fnParts.join('');
      return Function(itemVar, fnStr);
    }
  }

  // default to returning a function that will not match anything
  return FALSE;
};

/**
 * Create a variable map from all PropertyName elements under a node.
 *
 * @param {!Node} node The node.
 * @return {!Object<string, string>} Map of property names to variable names.
 */
export const createVarMap = function(node) {
  var vars = {};

  // get all property names used in the filter
  var propNameNodes = node.querySelectorAll('PropertyName');
  var propNames = [];
  for (var i = 0; i < propNameNodes.length; i++) {
    var nodeText = getAllTextContent(propNameNodes[i], true).trim();
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
 *
 * @param {!Node} node The filter node.
 * @param {!Object<string, string>} vars Map of property names to variable names.
 * @return {string} The filter function expression for the node.
 */
export const getNodeExpression = function(node, vars) {
  // try to get an operation first. some ops will match condition nodes (in list, like list) via hint.
  var op = operationFromNode(node);
  if (op) {
    return createFromExpressionNode(node, vars);
  } else {
    // not an operation node, so check if it's a condition.
    var condition = conditionFromNode(node);
    if (condition) {
      return createFromConditionNode(node, vars, condition);
    }
  }

  // not a recognized expression or condition
  return '';
};

/**
 * Create a filter function string from an XML condition node.
 *
 * @param {!Node} node The filter node.
 * @param {!Object<string, string>} vars Map of property names to variable names.
 * @param {string} condition The condition value.
 * @return {string} The filter function expression for the node.
 */
export const createFromConditionNode = function(node, vars, condition) {
  var children = node.childNodes;
  if (children && children.length > 0) {
    var fnParts = [];
    for (var i = 0; i < children.length; i++) {
      var childFilter = getNodeExpression(children[i], vars);
      if (!isEmptyOrWhitespace(childFilter)) {
        fnParts.push(childFilter);
      }
    }

    if (fnParts.length > 0) {
      switch (condition) {
        case Condition.AND:
          return '(' + fnParts.join('&&') + ')';
        case Condition.OR:
          return '(' + fnParts.join('||') + ')';
        case Condition.NOT:
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
 *
 * @param {!Node} node The filter node.
 * @param {!Object<string, string>} vars Map of property names to variable names.
 * @return {string} The filter function expression for the node.
 */
export const createFromExpressionNode = function(node, vars) {
  var expr = new Expression();
  expr.setFilter(node);

  if (expr['op'] && expr.columnName) {
    var op = /** @type {!Op} */ (expr['op']);
    var varName = vars[expr.columnName];
    if (varName) {
      return op.getEvalExpression(varName, /** @type {?string} */ (expr['literal']));
    }
  }

  return '';
};

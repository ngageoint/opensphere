goog.provide('os.ui.im.AbstractMapperCtrl');

goog.require('goog.object');
goog.require('ol.array');
goog.require('os.data.ColumnDefinition');
goog.require('os.im.mapping.Rule');
goog.require('os.object');
goog.require('os.ui.slick.slickGridDirective');



/**
 * Abstract controller for a mapper UI directive. Directives powered by this controller expect
 * their scopes to have the following items passed in on them:
 *
 * <code>
 * {
 *   config: <os.config.BaseParserConfig>,
 *   finalize: <Function>,
 *   mapping: <os.im.mapping.IMapping>
 * }
 * </code>
 *
 * It needs reference to the config being used for the parsing process. Validate is a hook
 * back to the import process to be called on accept. The mapping is modified by reference
 * by user interaction with the mapper UI.
 *
 * @abstract
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 * @template T
 */
os.ui.im.AbstractMapperCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {?angular.$timeout}
   * @protected
   */
  this.timeout = $timeout;

  /**
   * Grid options.
   * @type {Object.<string, *>}
   */
  this['options'] = {
    'dataItemColumnValueExtractor': this.getValue.bind(this),
    'enableCellNavigation': true,
    'enableColumnReorder': false,
    'forceFitColumns': true,
    'multiColumnSort': false,
    'multiSelect': false,
    'rowHeight': 40,
    'useRowRenderEvents': true
  };

  var col1 = new os.data.ColumnDefinition('initialValue');
  col1['name'] = 'When the file contains...';
  col1['width'] = 405;
  col1['sortable'] = true;
  var col2 = new os.data.ColumnDefinition('mappedValue');
  col2['name'] = 'It becomes...';
  col2['width'] = 405;
  col2['formatter'] = this.mappedValueFormatter.bind(this);
  col2['sortable'] = false;
  /**
   * Grid columns.
   * @type {Array.<os.data.ColumnDefinition>}
   */
  this['columns'] = [col1, col2];

  var sv = $scope['mapping'].getStaticValue();
  /**
   * Model for the radio button selection
   * @type {string}
   */
  this['mappingType'] = sv ? 'static' : 'column';

  /**
   * Value for static mappings
   * @type {?T}
   */
  this['staticValue'] = sv ? sv : null;

  /**
   * Caches the mapping rulesets for each column
   * @type {Object.<string, Array.<os.im.mapping.Rule.<string>>>}
   */
  this['mappingRulesets'] = {};

  /**
   * Holds the mapping rules for the current column of interest
   * @type {Array.<os.im.mapping.Rule.<string>>}
   */
  this['mappingRuleset'] = $scope['mapping'].getRules();

  this.update();

  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * @protected
 */
os.ui.im.AbstractMapperCtrl.prototype.destroy = function() {
  this.scope = null;
  this.element = null;
  this.timeout = null;
};


/**
 * Adds the mapping rules/static value to the mapping then closes the window.
 * @export
 */
os.ui.im.AbstractMapperCtrl.prototype.accept = function() {
  if (this.scope['mapping']) {
    if (this['mappingType'] == 'static') {
      this.scope['mapping'].setStaticValue(this['staticValue']);
      this.scope['mapping']['displayValue'] = this['staticValue'];
    } else {
      this.scope['mapping'].setRules(this['mappingRuleset']);
      this.scope['mapping'].field = this.getColumn();
      this.scope['mapping']['displayValue'] = this.getColumn();
    }

    this.scope['mapping']['valid'] = true;
  }

  if (this.scope['finalize']) {
    this.scope['finalize'](this.scope['mapping']);
  }

  os.ui.window.close(this.element);
};


/**
 * Closes the window. Does not save changes to the mapping.
 * @export
 */
os.ui.im.AbstractMapperCtrl.prototype.close = function() {
  if (this.scope['finalize']) {
    this.scope['finalize'](false);
  }
  os.ui.window.close(this.element);
};


/**
 * Gets a column value
 * @param {Object} item
 * @param {os.data.ColumnDefinition|string} col
 * @return {*} The value
 * @protected
 */
os.ui.im.AbstractMapperCtrl.prototype.getValue = function(item, col) {
  var field = col['field'] || col;
  var value = '';

  if (field == 'initialValue') {
    value = item[field] || ' -- No Value -- ';
  } else if (field == 'mappedValue') {
    value = this.getHtml();
  }

  return value;
};


/**
 * Formats the mapped value row for angular directives
 * @param {number} row The row number
 * @param {number} cell The cell number in the row
 * @param {string} value The value
 * @param {Object} columnDef The column definition
 * @param {os.ui.slick.SlickTreeNode} node The node
 * @return {string} The HTML for the cell
 * @protected
 */
os.ui.im.AbstractMapperCtrl.prototype.mappedValueFormatter = function(row, cell, value, columnDef, node) {
  return this.getHtml();
};


/**
 * Gets the template for the mapping value fields.
 * @return {string}
 * @protected
 */
os.ui.im.AbstractMapperCtrl.prototype.getHtml = function() {
  var h = '';
  return h;
};


/**
 * Gets the column being operated on. Should be overridden to get the correct column
 * @return {string}
 */
os.ui.im.AbstractMapperCtrl.prototype.getColumn = function() {
  return '';
};


/**
 * Updates the mapping rules from a change in the selected column. This should be implemented
 * to test the mappings for the extensions of this class.
 * @export
 */
os.ui.im.AbstractMapperCtrl.prototype.update = function() {
  var column = this.getColumn();

  if (column && this.scope && this.scope['config']) {
    var config = this.scope['config'];
    var preview = config['preview'];

    var bucket = goog.array.bucket(preview, function(row) {
      return row[column];
    });

    var uniqueKeys = goog.object.getKeys(bucket);
    goog.array.sort(uniqueKeys);
    var newRules = this.createRules(uniqueKeys);

    if (this['mappingRulesets'][column]) {
      var ruleset = this['mappingRulesets'][column];

      // check if there are any rules in the new ruleset that aren't in the existing one
      for (var i = 0, ii = newRules.length; i < ii; i++) {
        var newRule = newRules[i];
        var found = ol.array.find(ruleset, function(rule) {
          return rule['initialValue'] == newRule['initialValue'];
        });

        if (!found) {
          ruleset.push(newRule);
        }
      }

      this['mappingRuleset'] = ruleset.slice();
    } else {
      this['mappingRuleset'] = newRules;
      this['mappingRulesets'][column] = newRules;
    }

    this.validateRules();
  }
};


/**
 * Gets the rules appropriate to the implementation. Should be overridden to get the right ones.
 * @abstract
 * @param {Array} uniqueKeys
 * @return {?Array<!os.im.mapping.Rule>}
 */
os.ui.im.AbstractMapperCtrl.prototype.createRules = function(uniqueKeys) {};


/**
 * Validates the rules on the form. Should be implemented for each subclass.
 * @abstract
 */
os.ui.im.AbstractMapperCtrl.prototype.validateRules = function() {};

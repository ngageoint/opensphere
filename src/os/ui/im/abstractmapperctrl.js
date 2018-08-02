goog.provide('os.ui.im.AbstractMapperCtrl');

goog.require('goog.object');
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
 *   validate: <Function>,
 *   mapping: <os.im.mapping.IMapping>
 * }
 * </code>
 *
 * It needs reference to the config being used for the parsing process. Validate is a hook
 * back to the import process to be called on accept. The mapping is modified by reference
 * by user interaction with the mapper UI.
 *
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
 */
os.ui.im.AbstractMapperCtrl.prototype.accept = function() {
  if (this.scope['mapping']) {
    if (this['mappingType'] == 'static') {
      this.scope['mapping'].setStaticValue(this['staticValue']);
    } else {
      this.scope['mapping'].setRules(this['mappingRuleset']);
      this.scope['mapping'].field = this.getColumn();
    }
  }

  if (this.scope['validate']) {
    this.scope['validate'](this.scope['mapping']);
  }

  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.im.AbstractMapperCtrl.prototype,
    'accept', os.ui.im.AbstractMapperCtrl.prototype.accept);


/**
 * Closes the window. Does not save changes to the mapping.
 */
os.ui.im.AbstractMapperCtrl.prototype.close = function() {
  if (this.scope['validate']) {
    this.scope['validate'](false);
  }
  os.ui.window.close(this.element);
};
goog.exportProperty(os.ui.im.AbstractMapperCtrl.prototype,
    'close', os.ui.im.AbstractMapperCtrl.prototype.close);


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

    if (this['mappingRulesets'][column]) {
      this['mappingRuleset'] = this['mappingRulesets'][column];
    } else {
      var data = this.createRules(uniqueKeys);

      this['mappingRuleset'] = data;
      this['mappingRulesets'][column] = data;
    }

    this.validateRules();
  }
};
goog.exportProperty(os.ui.im.AbstractMapperCtrl.prototype,
    'update', os.ui.im.AbstractMapperCtrl.prototype.update);


/**
 * Gets the rules appropriate to the implementation. Should be overridden to get the right ones.
 */
os.ui.im.AbstractMapperCtrl.prototype.createRules = goog.abstractMethod;


/**
 * Validates the state of the form. Should be implemented to check the validity of the mapping in
 * extensions of this class.
 */
os.ui.im.AbstractMapperCtrl.prototype.validate = goog.abstractMethod;


/**
 * Validates the rules on the form. Should be implemented for each subclass.
 */
os.ui.im.AbstractMapperCtrl.prototype.validateRules = goog.abstractMethod;

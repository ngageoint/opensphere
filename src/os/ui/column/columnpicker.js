goog.provide('os.ui.column.ColumnPickerCtrl');
goog.provide('os.ui.column.columnPickerDirective');

goog.require('ol.array');


goog.require('os.array');


goog.require('os.ui.Module');


/**
 * Select2 to pick from all avaliable columns.
 *
 * @return {angular.Directive}
 */
os.ui.column.columnPickerDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'column': '=?',
      'columns': '=?',
      'isRequired': '=?',
      'columnOptions': '=',
      'multiple': '=?',
      'placeholderText': '@?'
    },
    templateUrl: os.ROOT + 'views/column/columnpicker.html',
    controller: os.ui.column.ColumnPickerCtrl,
    controllerAs: 'pickerCtrl'
  };
};


/**
 * Ass the directive to the module
 */
os.ui.Module.directive('columnpicker', [os.ui.column.columnPickerDirective]);



/**
 * Controller for the column picker
 * The selected column will be saved in 'column'. If multiple is allowed it will be stored in 'columns' as an array.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.column.ColumnPickerCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * Multiple selections allowed.
   * @type {boolean}
   * @private
   */
  this['multiple'] = this.scope_['multiple'] && this.scope_['multiple'] == 'true';

  /**
   * @type {string}
   * @private
   */
  this.placeholderText_ = this.scope_['placeholderText'] ||
    ('Select Column' + (this.scope_['multiple'] ? 's' : '') + '...');

  if ($scope['isRequired'] == null) {
    // default the picker to required
    $scope['isRequired'] = true;
  }

  this.timeout_ = $timeout;

  $timeout(function() {
    this.select2_ = $element.find('.js-column-picker');
    this.select2_.select2({
      'placeholder': this.placeholderText_,
      'maximumSelectionSize': this.maxNumColumns_
    });
    this.columnSelected_();
  }.bind(this));
  this.scope_.$watch('column', this.columnSelected_.bind(this));
  this.scope_.$watch('columns', this.columnSelected_.bind(this));
  this.scope_.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up.
 *
 * @private
 */
os.ui.column.ColumnPickerCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.select2_ = null;
};


/**
 * Column selection is triggered, use the correct one
 *
 * @private
 */
os.ui.column.ColumnPickerCtrl.prototype.columnSelected_ = function() {
  if (this.scope_['column'] !== undefined) {
    this.selectColumn_();
  } else {
    this.selectColumns_();
  }
};


/**
 * Select the columns based off the model
 *
 * @private
 */
os.ui.column.ColumnPickerCtrl.prototype.selectColumns_ = function() {
  if (this.select2_) {
    var vals = [];
    if (this.scope_['columns']) {
      os.array.forEach(this.scope_['columns'], function(column) {
        var found = ol.array.find(this.scope_['columnOptions'], function(col) {
          return col['name'] == column['name'];
        });
        if (found) {
          vals.push(found['$$hashKey']);
        }
      }, this);
    }
    this.select2_.select2('val', vals);
  }
};


/**
 * Select the columns based off the model
 *
 * @private
 */
os.ui.column.ColumnPickerCtrl.prototype.selectColumn_ = function() {
  if (this.select2_) {
    var val = null;
    if (this.scope_['column']) {
      var found = ol.array.find(this.scope_['columnOptions'], function(col) {
        return col['name'] == this.scope_['column']['name'];
      }.bind(this));
      if (found) {
        val = found['$$hashKey'];
      }
    }
    this.select2_.select2('val', val);
  }
};


/**
 * @param {os.data.ColumnDefinition} column
 * @export
 */
os.ui.column.ColumnPickerCtrl.prototype.columnPicked = function(column) {
  this.scope_['column'] = column;
};


/**
 * @param {!Array.<!os.data.ColumnDefinition>} columns
 * @export
 */
os.ui.column.ColumnPickerCtrl.prototype.columnsChanged = function(columns) {
  this.scope_['columns'] = columns;
};

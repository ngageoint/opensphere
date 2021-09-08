goog.module('os.ui.column.ColumnPickerUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * Select2 to pick from all avaliable columns.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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

  templateUrl: ROOT + 'views/column/columnpicker.html',
  controller: Controller,
  controllerAs: 'pickerCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'columnpicker';


/**
 * Ass the directive to the module
 */
Module.directive('columnpicker', [directive]);



/**
 * Controller for the column picker
 * The selected column will be saved in 'column'. If multiple is allowed it will be stored in 'columns' as an array.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.select2_ = null;
  }

  /**
   * Column selection is triggered, use the correct one
   *
   * @private
   */
  columnSelected_() {
    if (this.scope_['column'] !== undefined) {
      this.selectColumn_();
    } else {
      this.selectColumns_();
    }
  }

  /**
   * Select the columns based off the model
   *
   * @private
   */
  selectColumns_() {
    if (this.select2_) {
      var vals = [];
      if (this.scope_['columns']) {
        this.scope_['columns'].forEach(function(column) {
          if (this.scope_['columnOptions'].some((col) => col['name'] == column['name'])) {
            vals.push(found['$$hashKey']);
          }
        }, this);
      }
      this.select2_.select2('val', vals);
    }
  }

  /**
   * Select the columns based off the model
   *
   * @private
   */
  selectColumn_() {
    if (this.select2_) {
      var column = this.scope_['column'];
      var val = null;
      if (column && this.scope_['columnOptions'].some((col) => col['name'] == column['name'])) {
        val = found['$$hashKey'];
      }
      this.select2_.select2('val', val);
    }
  }

  /**
   * @param {os.data.ColumnDefinition} column
   * @export
   */
  columnPicked(column) {
    this.scope_['column'] = column;
  }

  /**
   * @param {!Array.<!os.data.ColumnDefinition>} columns
   * @export
   */
  columnsChanged(columns) {
    this.scope_['columns'] = columns;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

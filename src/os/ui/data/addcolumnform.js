goog.module('os.ui.data.AddColumnFormUI');

goog.require('os.ui.util.ValidationMessageUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');

const ISource = goog.requireType('os.source.ISource');


/**
 * The addcolumnform directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'name': '=',
    'value': '=',
    'validators': '&'
  },
  templateUrl: ROOT + 'views/data/addcolumnform.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'addcolumnform';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the addcolumnform directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $timeout) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    $scope.$on('$destroy', this.destroy_.bind(this));

    $timeout(this.addValidators_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Add validators to the model controller.
   *
   * @private
   */
  addValidators_() {
    if (this.scope_) {
      var form = this.scope_['columnForm'];
      var validators = this.scope_['validators'] ? this.scope_['validators']() : null;
      if (form && validators) {
        validators.forEach(function(validator) {
          // add a custom validator to check for duplicate column names
          var model = /** @type {angular.NgModelController|undefined} */ (form[validator['model']]);
          if (model) {
            model.$validators[validator['id']] = validator['handler'];
          }
        }, this);
      }
    }
  }

  /**
   * Checks whether the form is invalid due to duplicate column names.
   *
   * @param {ISource} source The data source.
   * @param {string} modelVal
   * @param {string} viewVal
   * @return {boolean}
   *
   * @deprecated Please use os.ui.data.AddColumnFormUI.isDuplicateColumn instead.
   */
  static isDuplicate(source, modelVal, viewVal) {
    return isDuplicateColumn(source, modelVal, viewVal);
  }
}

/**
 * Checks whether the form is invalid due to duplicate column names.
 *
 * @param {ISource} source The data source.
 * @param {string} modelVal
 * @param {string} viewVal
 * @return {boolean}
 */
const isDuplicateColumn = (source, modelVal, viewVal) => {
  var columns = source.getColumnsArray();
  var value = modelVal || viewVal;
  if (value) {
    for (var i = 0, ii = columns.length; i < ii; i++) {
      var column = columns[i];
      var lcName = value.toLowerCase();
      if (!column['temp'] && (column['field'].toLowerCase() === lcName || column['name'].toLowerCase() == lcName)) {
        // duplicate column names are not allowed (unless they are temporary columns that were created by this UI)
        return false;
      }
    }
  }

  return true;
};

exports = {
  Controller,
  directive,
  directiveTag,
  isDuplicateColumn
};

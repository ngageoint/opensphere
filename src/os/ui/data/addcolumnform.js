goog.provide('os.ui.data.AddColumnFormCtrl');
goog.provide('os.ui.data.addColumnFormDirective');

goog.require('os.ui.Module');
goog.require('os.ui.util.validationMessageDirective');


/**
 * The addcolumnform directive
 * @return {angular.Directive}
 */
os.ui.data.addColumnFormDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'name': '=',
      'value': '=',
      'validators': '&'
    },
    templateUrl: os.ROOT + 'views/data/addcolumnform.html',
    controller: os.ui.data.AddColumnFormCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('addcolumnform', [os.ui.data.addColumnFormDirective]);



/**
 * Controller function for the addcolumnform directive
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.data.AddColumnFormCtrl = function($scope, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  $scope.$on('$destroy', goog.bind(this.destroy_, this));

  $timeout(this.addValidators_.bind(this));
};


/**
 * Clean up.
 * @private
 */
os.ui.data.AddColumnFormCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Add validators to the model controller.
 * @private
 */
os.ui.data.AddColumnFormCtrl.prototype.addValidators_ = function() {
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
};


/**
 * Checks whether the form is invalid due to duplicate column names.
 * @param {os.source.ISource} source The data source.
 * @param {string} modelVal
 * @param {string} viewVal
 * @return {boolean}
 */
os.ui.data.AddColumnFormCtrl.isDuplicate = function(source, modelVal, viewVal) {
  var columns = source.getColumns();
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

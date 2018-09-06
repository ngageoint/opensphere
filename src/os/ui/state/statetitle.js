goog.provide('os.ui.state.stateTitleDirective');
goog.require('os.ui.Module');


/**
 * The statetitle directive, for validating state titles.
 * @return {angular.Directive}
 */
os.ui.state.stateTitleDirective = function() {
  return {
    require: 'ngModel',
    link: os.ui.state.stateTitleLinkFn
  };
};


/**
 * Link function for the statetitle directive.
 * @param {!angular.Scope} scope The scope
 * @param {!angular.JQLite} element The element
 * @param {Object} attrs Directive attributes
 * @param {!angular.NgModelController} ctrl The model controller
 */
os.ui.state.stateTitleLinkFn = function(scope, element, attrs, ctrl) {
  var validate = function(val) {
    // if a value is not set, the field will be marked as required
    if (!ctrl.$pristine || val) {
      // oldTitle will be set on the scope during the reimport process. if a persister is set, the state is
      // being exported to something other than the application so we don't need to check the title.
      var valid = true;
      if (scope['oldTitle'] !== val && !goog.isDefAndNotNull(scope['stateForm']['persister'])) {
        valid = !os.ui.stateManager.hasState(val);
      }

      ctrl.$setValidity('title', valid);
      ctrl.$setDirty();
    }

    return val;
  };

  // $formatters handles programmatic changes to the model, $parsers handles changes from the view
  ctrl.$formatters.unshift(validate);
  ctrl.$parsers.unshift(validate);

  // validate when the persister changes, since it will affect how the value is validated
  scope.$watch('stateForm.persister', function() {
    validate(ctrl.$modelValue);
  });
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('statetitle', [os.ui.state.stateTitleDirective]);

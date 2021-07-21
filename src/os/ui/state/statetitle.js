goog.module('os.ui.state.stateTitleDirective');
goog.module.declareLegacyNamespace();

const {getStateManager} = goog.require('os.state.instance');
const Module = goog.require('os.ui.Module');

/**
 * The statetitle directive, for validating state titles.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  require: 'ngModel',
  link: linkFn
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'statetitle';

/**
 * Link function for the statetitle directive.
 *
 * @param {!angular.Scope} scope The scope
 * @param {!angular.JQLite} element The element
 * @param {Object} attrs Directive attributes
 * @param {!angular.NgModelController} ctrl The model controller
 */
const linkFn = function(scope, element, attrs, ctrl) {
  var validate = function(val) {
    // if a value is not set, the field will be marked as required
    if (!ctrl.$pristine || val) {
      // oldTitle will be set on the scope during the reimport process. if a persister is set, the state is
      // being exported to something other than the application so we don't need to check the title.
      var valid = true;
      if (scope['oldTitle'] !== val && scope['stateForm']['persister'] == null) {
        valid = !getStateManager().hasState(val);
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
Module.directive(directiveTag, [directive]);

exports = {
  directive,
  directiveTag
};

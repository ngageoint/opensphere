goog.provide('os.ui.util.ValidationMessageCtrl');
goog.provide('os.ui.util.validationMessageDirective');


/**
 * A collection of help messages that can be overriden or added to, meant to consolidate messages used in validation
 * Make sure to include the was-valided class at the parent level for these to work!
 * @return {angular.Directive}
 */
os.ui.util.validationMessageDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'target': '='
    },
    templateUrl: os.ROOT + 'views/util/validationmessage.html',
    controller: os.ui.util.ValidationMessageCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('validationMessage', [os.ui.util.validationMessageDirective]);


/**
 * Controller for the validation message
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$parse} $parse
 * @constructor
 * @ngInject
 */
os.ui.util.ValidationMessageCtrl = function($scope, $element, $parse) {
	/**
   * @type {?angular.Scope}
   * @private
   */
	this.scope_ = $scope;

	/**
	 * @type {?angular.$parse}
	 */
	this.parse_ = $parse;

	if (goog.isString(this.scope_['target'])) {
		this.scope_['target'] = this.propertyify(this.scope_['target'])(this.scope_['target']);
	}

};


/**
 * transforms the target given as a string into a property
 */
os.ui.util.ValidationMessageCtrl.prototype.propertyify = function(string) {
	var p = this.parse_(string);
	var s = p.assign;
	return function(newVal) {
		if (newVal) {
			s(this.scope_, newVal);
		}
		return p(this.scope_);
	}.bind(this);
};


/**
 * Waits for Angular to finish doing things then resizes the map.
 * @return {boolean}
 */
os.ui.util.ValidationMessageCtrl.prototype.isEmpty = function() {
 	return !goog.object.isEmpty(this.scope_['target'].$error);
};

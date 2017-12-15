goog.provide('os.ui.SaveStatusController');
goog.provide('os.ui.saveStatusDirective');

goog.require('os.config.Settings');
goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
os.ui.saveStatusDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/savestatus.html',
    scope: {
      name: '@'
    },
    controller: os.ui.SaveStatusController,
    controllerAs: 'statusCtrl'
  };
};


/**
 * Register save-status directive.
 */
os.ui.Module.directive('saveStatus', [os.ui.saveStatusDirective]);



/**
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @ngInject
 */
os.ui.SaveStatusController = function($scope, $timeout) {
  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  this['supportContact'] = os.settings.get(['supportContact']);

  $scope.$on('saveStatus', this.handleSaveStatus_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.SaveStatusController.prototype.destroy_ = function() {
  this.timeout_ = null;
};


/**
 * @typedef {{
 *   status: boolean,
 *   reason: string,
 *   timeout: number
 *   }}
 */
os.ui.SaveStatusParams;


/**
 * @param {Object} event
 * @param {boolean} status If the save operation succeeded.
 * @param {?number=} opt_timeout Duration in ms to display success message (defaults to showing indefinitely).
 *   Failure message will always display until closed.
 * @param {?string=} opt_reason Reason for failure status.
 * @private
 */
os.ui.SaveStatusController.prototype.handleSaveStatus_ = function(event, status, opt_timeout, opt_reason) {
  if (!status) {
    if (opt_reason) {
      this['errorDetail'] = opt_reason;
    } else {
      this['errorDetail'] = 'due to an unspecified server error';
    }
  } else if (opt_timeout) {
    this.timeout_(this.reset.bind(this), opt_timeout);
  }

  this['saved'] = status;
  this['fail'] = !status;
};


/**
 * Reset the dialog.
 */
os.ui.SaveStatusController.prototype.reset = function() {
  this['saved'] = this['fail'] = false;
  this['errorDetail'] = '';
};
goog.exportProperty(
    os.ui.SaveStatusController.prototype,
    'reset',
    os.ui.SaveStatusController.prototype.reset);

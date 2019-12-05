goog.provide('os.ui.alert.AlertsCtrl');
goog.provide('os.ui.alertsDirective');

goog.require('os.alertManager');
goog.require('os.defines');
goog.require('os.ui.Module');


/**
 * The alerts directive
 *
 * @return {angular.Directive}
 */
os.ui.alertsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/windows/alerts.html',
    controller: os.ui.alert.AlertsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('alerts', [os.ui.alertsDirective]);


/**
 * Controller function for the AlertViewer directive.  Will be instantiated by angular upon directive creation.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.alert.AlertsCtrl = function($scope, $timeout, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {Array.<Object>}
   */
  this['alertArray'] = [];

  /**
   * If alert popups should be displayed.
   * @type {boolean}
   */
  this['showAlertPopups'] = /** @type {string} */ (os.settings.get(['showAlertPopups'], true));

  os.alertManager.getAlerts().getValues().forEach(this.registerAlert_, this);
  os.alertManager.listen(os.alert.EventType.ALERT, this.registerAlert_, false, this);
  $scope.$on('dispatch', os.ui.alert.AlertsCtrl.dispatch_);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Remove listeners and references.
 *
 * @private
 */
os.ui.alert.AlertsCtrl.prototype.destroy_ = function() {
  os.alertManager.unlisten(os.alert.EventType.ALERT, this.registerAlert_, false, this);
  this.scope_ = null;
};


/**
 * Registers received alerts and tests to see if we have received a flood
 *
 * @param {os.alert.AlertEvent} event The event to register
 * @private
 */
os.ui.alert.AlertsCtrl.prototype.registerAlert_ = function(event) {
  this['alertArray'].unshift({
    'msg': event.getMessage(),
    'severity': event.getSeverity().toString(),
    'time': event.getTime().toUTCIsoString(true).slice(11)
  });
  os.ui.apply(this.scope_);
};


/**
 * Clears the alerts being displayed
 *
 * @export
 */
os.ui.alert.AlertsCtrl.prototype.clearAlerts = function() {
  this['alertArray'].length = 0;
  os.alertManager.clearAlerts();
};


/**
 * Toggles the alert popups
 *
 * @export
 */
os.ui.alert.AlertsCtrl.prototype.toggleAlertPopups = function() {
  this['showAlertPopups'] = !this['showAlertPopups'];
  os.settings.set(['showAlertPopups'], this['showAlertPopups']);
};

/**
 * @param {angular.Scope.Event} evt The angular event
 * @param {string} type The event type to send
 * @private
 */
os.ui.alert.AlertsCtrl.dispatch_ = function(evt, type) {
  os.dispatcher.dispatchEvent(type);
};

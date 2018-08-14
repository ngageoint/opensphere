goog.provide('os.ui.alert.AlertViewerCtrl');
goog.provide('os.ui.alert.alertViewerDirective');
goog.require('goog.array');
goog.require('goog.events.Event');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alertManager');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.alert.alertLinkFilter');


/**
 * The alert-viewer directive
 * @return {angular.Directive}
 */
os.ui.alert.alertViewerDirective = function() {
  return {
    replace: true,
    restrict: 'AE',
    scope: {'types': '='},
    templateUrl: os.ROOT + 'views/alert/alertviewer.html',
    controller: os.ui.alert.AlertViewerCtrl,
    controllerAs: 'alertViewerCtrl'
  };
};


/**
 * Register alert-viewer directive.
 */
os.ui.Module.directive('alertViewer', [os.ui.alert.alertViewerDirective]);



/**
 * Controller function for the AlertViewer directive.  Will be instantiated by angular upon directive creation.
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.alert.AlertViewerCtrl = function($scope, $timeout, $element) {
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
  this['showAlertPopups'] =  /** @type {string} */ (os.settings.get(['showAlertPopups'], true));

  if (!os.alertManager) {
    // has not been initialized yet
    os.alertManager = os.alert.AlertManager.getInstance();
  }

  os.alertManager.getAlerts().getValues().forEach(this.registerAlert_, this);
  os.alertManager.listen(os.alert.EventType.ALERT, this.registerAlert_, false, this);
  $scope.$on('dispatch', os.ui.alert.AlertViewerCtrl.dispatch_);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Remove listeners and references.
 * @private
 */
os.ui.alert.AlertViewerCtrl.prototype.destroy_ = function() {
  os.alertManager.unlisten(os.alert.EventType.ALERT, this.registerAlert_, false, this);
  this.scope_ = null;
};


/**
 * Registers received alerts and tests to see if we have received a flood
 * @param {os.alert.AlertEvent} event The event to register
 * @private
 */
os.ui.alert.AlertViewerCtrl.prototype.registerAlert_ = function(event) {
  this['alertArray'].unshift({
    'msg': event.getMessage(),
    'severity': event.getSeverity().toString(),
    'time': event.getTime().toUTCIsoString(true).slice(11)
  });
  os.ui.apply(this.scope_);
};


/**
 * Clears the alerts being displayed
 */
os.ui.alert.AlertViewerCtrl.prototype.clearAlerts = function() {
  this['alertArray'].length = 0;
  os.alertManager.clearAlerts();
};
goog.exportProperty(
    os.ui.alert.AlertViewerCtrl.prototype,
    'clearAlerts',
    os.ui.alert.AlertViewerCtrl.prototype.clearAlerts);


/**
 * Toggles the alert popups
 */
os.ui.alert.AlertViewerCtrl.prototype.toggleAlertPopups = function() {
  this['showAlertPopups'] = !this['showAlertPopups'];
  os.settings.set(['showAlertPopups'], this['showAlertPopups']);
};
goog.exportProperty(
    os.ui.alert.AlertViewerCtrl.prototype,
    'toggleAlertPopups',
    os.ui.alert.AlertViewerCtrl.prototype.toggleAlertPopups);

/**
 * @param {angular.Scope.Event} evt The angular event
 * @param {string} type The event type to send
 * @private
 */
os.ui.alert.AlertViewerCtrl.dispatch_ = function(evt, type) {
  os.dispatcher.dispatchEvent(type);
};

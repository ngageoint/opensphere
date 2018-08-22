goog.provide('os.ui.alert.AlertBadgeCtrl');
goog.provide('os.ui.alert.alertBadgeDirective');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.ui.Module');


/**
 * The alertbadge directive
 * @return {angular.Directive}
 */
os.ui.alert.alertBadgeDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'reset': '='
    },
    templateUrl: os.ROOT + 'views/badge.html',
    controller: os.ui.alert.AlertBadgeCtrl,
    controllerAs: 'badge'
  };
};


/**
 * Register alertbadge directive.
 */
os.ui.Module.directive('alertbadge', [os.ui.alert.alertBadgeDirective]);



/**
 * Controller function for the alertbadge directive.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.alert.AlertBadgeCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;

  /**
   * @type {number}
   */
  this['count'] = 0;

  /**
   * @type {os.alert.AlertEventSeverity}
   */
  this['highestAlert'] = os.alert.AlertEventSeverity.INFO;

  /**
   * @type {?os.alert.AlertManager}
   * @private
   */
  this.am_ = os.alert.AlertManager.getInstance();
  this.alertClientId_ = 'alertbadge';
  this.am_.processMissedAlerts(this.alertClientId_, this.handleAlert_, this);
  this.am_.listen(os.alert.EventType.ALERT, this.handleAlert_, false, this);

  $scope.$watch('reset', this.reset.bind(this));
  $scope.$on('$destroy', this.destroy.bind(this));
};


/**
 * @enum {string}
 */
os.ui.alert.AlertBadgeCtrl.CLASSES = {
  'Error': 'badge-danger',
  'Warning': 'badge-warning'
};


/**
 * Destroy the directive, cleaning up references/listeners.
 * @protected
 */
os.ui.alert.AlertBadgeCtrl.prototype.destroy = function() {
  this.am_.unlisten(os.alert.EventType.ALERT, this.handleAlert_, false, this);
  this.am_ = null;
  this.scope = null;
};


/**
 * Reset the badge.
 * @protected
 */
os.ui.alert.AlertBadgeCtrl.prototype.reset = function() {
  if (this.scope['reset']) {
    this['count'] = 0;
    this['highestAlert'] = os.alert.AlertEventSeverity.INFO;
  }
};


/**
 * @return {string}
 */
os.ui.alert.AlertBadgeCtrl.prototype.getClass = function() {
  return os.ui.alert.AlertBadgeCtrl.CLASSES[this['highestAlert']] || 'badge-light';
};
goog.exportProperty(
    os.ui.alert.AlertBadgeCtrl.prototype,
    'getClass',
    os.ui.alert.AlertBadgeCtrl.prototype.getClass);


/**
 * Updates the alert badge when the alert tab is not active.
 * @param {os.alert.AlertEvent} event The event to register
 * @private
 */
os.ui.alert.AlertBadgeCtrl.prototype.handleAlert_ = function(event) {
  if (!this.scope['reset']) {
    this['count']++;

    var severity = event.getSeverity();
    if (severity.value > this['highestAlert'].value) {
      this['highestAlert'] = severity;
    }
  }

  os.ui.apply(this.scope);
};

goog.module('os.ui.alert.AlertsUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const AlertManager = goog.require('os.alert.AlertManager');
const EventType = goog.require('os.alert.EventType');
const Settings = goog.require('os.config.Settings');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * The alerts directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/windows/alerts.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'alerts';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the AlertViewer directive.  Will be instantiated by angular upon directive creation.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $timeout, $element) {
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
    this['showAlertPopups'] = /** @type {string} */ (Settings.getInstance().get(['showAlertPopups'], true));

    AlertManager.getInstance().getAlerts().getValues().forEach(this.registerAlert_, this);
    AlertManager.getInstance().listen(EventType.ALERT, this.registerAlert_, false, this);
    $scope.$on('dispatch', Controller.dispatch_);
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Remove listeners and references.
   *
   * @private
   */
  destroy_() {
    AlertManager.getInstance().unlisten(EventType.ALERT, this.registerAlert_, false, this);
    this.scope_ = null;
  }

  /**
   * Registers received alerts and tests to see if we have received a flood
   *
   * @param {os.alert.AlertEvent} event The event to register
   * @private
   */
  registerAlert_(event) {
    this['alertArray'].unshift({
      'count': event.getCount(),
      'msg': event.getMessage(),
      'severity': event.getSeverity().toString(),
      'time': event.getTime().toUTCIsoString(true).slice(11)
    });
    apply(this.scope_);
  }

  /**
   * Clears the alerts being displayed
   *
   * @export
   */
  clearAlerts() {
    this['alertArray'].length = 0;
    AlertManager.getInstance().clearAlerts();
  }

  /**
   * Toggles the alert popups
   *
   * @export
   */
  toggleAlertPopups() {
    this['showAlertPopups'] = !this['showAlertPopups'];
    Settings.getInstance().set(['showAlertPopups'], this['showAlertPopups']);
  }

  /**
   * @param {angular.Scope.Event} evt The angular event
   * @param {string} type The event type to send
   * @private
   */
  static dispatch_(evt, type) {
    dispatcher.getInstance().dispatchEvent(type);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

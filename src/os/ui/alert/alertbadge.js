goog.declareModuleId('os.ui.alert.AlertBadgeUI');

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import EventType from '../../alert/eventtype.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {apply} from '../ui.js';

const {default: AlertEvent} = goog.requireType('os.alert.AlertEvent');


/**
 * The alertbadge directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'reset': '='
  },
  templateUrl: ROOT + 'views/badge.html',
  controller: Controller,
  controllerAs: 'badge'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'alertbadge';

/**
 * Register alertbadge directive.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the alertbadge directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     */
    this.scope = $scope;

    /**
     * @type {number}
     */
    this['count'] = 0;

    /**
     * @type {AlertEventSeverity}
     */
    this['highestAlert'] = AlertEventSeverity.INFO;

    /**
     * @type {?AlertManager}
     * @private
     */
    this.am_ = AlertManager.getInstance();
    this.alertClientId_ = 'alertbadge';
    this.am_.processMissedAlerts(this.alertClientId_, this.handleAlert_, this);
    this.am_.listen(EventType.ALERT, this.handleAlert_, false, this);

    $scope.$watch('reset', this.reset.bind(this));
    $scope.$on('$destroy', this.destroy.bind(this));
  }

  /**
   * Destroy the directive, cleaning up references/listeners.
   *
   * @protected
   */
  destroy() {
    this.am_.unlisten(EventType.ALERT, this.handleAlert_, false, this);
    this.am_ = null;
    this.scope = null;
  }

  /**
   * Reset the badge.
   *
   * @protected
   */
  reset() {
    if (this.scope['reset']) {
      this['count'] = 0;
      this['highestAlert'] = AlertEventSeverity.INFO;
    }
  }

  /**
   * @return {string}
   * @export
   */
  getClass() {
    return Controller.CLASSES[this['highestAlert']] || 'badge-light';
  }

  /**
   * Updates the alert badge when the alert tab is not active.
   *
   * @param {AlertEvent} event The event to register
   * @private
   */
  handleAlert_(event) {
    if (!this.scope['reset']) {
      this['count'] += event.getCount();

      var severity = event.getSeverity();
      if (severity.value > this['highestAlert'].value) {
        this['highestAlert'] = severity;
      }
    }

    apply(this.scope);
  }
}

/**
 * @enum {string}
 */
Controller.CLASSES = {
  'Error': 'badge-danger',
  'Warning': 'badge-warning'
};

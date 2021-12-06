goog.declareModuleId('os.ui.alert.AlertPopupUI');

import './alertlinkfilter.js';

import AlertEventTypes from '../../alert/alerteventtypes.js';
import AlertManager from '../../alert/alertmanager.js';
import EventType from '../../alert/eventtype.js';
import Settings from '../../config/settings.js';
import * as dispatcher from '../../dispatcher.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {apply} from '../ui.js';

const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const {getRandomString} = goog.require('goog.string');

const {default: AlertEvent} = goog.requireType('os.alert.AlertEvent');


/**
 * The alert-popup directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'AE',
  scope: true,
  templateUrl: ROOT + 'views/alert/alertpopup.html',
  controller: Controller,
  controllerAs: 'alertPopupCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'alert-popup';

/**
 * Register alert-popup directive.
 */
Module.directive('alertPopup', [directive]);


/**
 * Controller function for the alert-popup directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * The last event handled by the viewer
     * @type {AlertEvent}
     * @private
     */
    this.lastEvent_ = null;

    /**
     * @type {Array.<Object>}
     */
    this['alertPopups'] = [];

    this.alertClientId_ = 'alertpopups';
    AlertManager.getInstance().processMissedAlerts(this.alertClientId_, this.handleAlertEvent_, this);
    AlertManager.getInstance().listen(EventType.ALERT, this.handleAlertEvent_, false, this);
    AlertManager.getInstance().listen(EventType.CLEAR_ALERTS, this.clearAlerts, false, this);
    $scope.$on('dispatch', Controller.dispatch_);
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Remove listeners and references.
   *
   * @private
   */
  destroy_() {
    AlertManager.getInstance().unlisten(EventType.ALERT, this.handleAlertEvent_, false, this);
    AlertManager.getInstance().unlisten(EventType.CLEAR_ALERTS, this.clearAlerts, false, this);

    this.timeout_ = null;
    this.scope_ = null;
  }

  /**
   * Pops up an error message for 5 seconds
   *
   * @param {AlertEvent} event The alert event to display.
   * @private
   */
  handleAlertEvent_(event) {
    var display = true;

    if (this.lastEvent_ && event.getMessage() == this.lastEvent_.getMessage()) {
      // See if a popup for the current alert is showing
      var msg = event.getMessage();
      var idx = '';
      if (msg) {
        idx = this['alertPopups'].findIndex((popupObj) => popupObj['msg'] == msg);
      }
      var alertPopup = this['alertPopups'][idx];

      if (alertPopup) {
        // Update the count of the popup
        alertPopup.count = event.getCount();

        // Reset the timeout on the dismiss handler so the popup remains
        clearTimeout(event.getHandlerTimeoutId());
        setTimeout(event.getHandler(), Controller.ALERT_TIMER);

        // Do not display a new popup
        display = false;
      }
    }

    this.lastEvent_ = event;

    if (display) {
      this.displayAlert_(event);
    }
  }

  /**
   * If the alert popup should be displayed.
   *
   * @return {boolean}
   * @private
   */
  popupsEnabled_() {
    // this may cause popups to be displayed before settings are loaded even when the setting should be false,
    // but better than a null exception
    const settings = Settings.getInstance();
    return settings.isLoaded() ? /** @type {boolean} */ (settings.get(['showAlertPopups'], true)) : true;
  }

  /**
   * Pops up an error message for 5 seconds
   *
   * @param {AlertEvent} event The message we want to pop up
   * @private
   */
  displayAlert_(event) {
    if (this.popupsEnabled_()) {
      var id = getRandomString();
      var timeoutId = null;

      // the function which will actually close the alert
      var dismiss = function(event) {
        if (this.scope_ && this['alertPopups']) {
          // If the event target is the alert, only close that alert.
          var msg = event.target['msg'];
          var idx = '';
          if (msg) {
            idx = this['alertPopups'].findIndex((popupObj) => popupObj['msg'] == msg);
          } else {
            idx = this['alertPopups'].findIndex((popupObj) => popupObj['id'] == id);
          }

          if (idx != -1) {
            this['alertPopups'].splice(idx, 1);
            apply(this.scope_);
          }
        }
      };

      // the event target which will trigger the alert to close
      var dismissDispatcher = event.getDismissDispatcher();
      if (!dismissDispatcher) {
        dismissDispatcher = new EventTarget();
        var scope = this.scope_;
        var handler = function() {
          if (scope['hovered']) {
            setTimeout(handler, 1000);
          } else {
            dismissDispatcher.dispatchEvent(AlertEventTypes.DISMISS_ALERT);
          }
        };

        timeoutId = setTimeout(handler, Controller.ALERT_TIMER);
        event.setHandlerTimeoutId(timeoutId);
        event.setHandler(handler);
      }
      dismissDispatcher.listenOnce(AlertEventTypes.DISMISS_ALERT, dismiss, false, this);

      var message = event.getMessage();
      var popup = {
        'id': id,
        'count': event.getCount(),
        'msg': message,
        'severity': event.getSeverity().toString(),
        'timeout': dismiss
      };

      this['alertPopups'].push(popup);
      apply(this.scope_);
    }
  }

  /**
   * Clear all open alerts.
   *
   * @export
   */
  clearAlerts() {
    if (this['alertPopups'] && this.scope_) {
      for (var i = 0; i < this['alertPopups'].length; i++) {
        if (this['alertPopups'][i]['canClose']) {
          clearTimeout(this['alertPopups'][i]['timeout']);
        }
      }

      this['alertPopups'] = this['alertPopups'].filter((alertPopup) => !alertPopup['canClose']);
      apply(this.scope_);
    }
  }

  /**
   * Dismisses a popup and clears its timeout
   *
   * @param {number} $index The index of the message to dismiss
   * @param {Object} popup The popup to dismiss
   * @export
   */
  dismissAlert($index, popup) {
    if (this.popupsEnabled_()) {
      this['alertPopups'].splice($index, 1);
      clearTimeout(popup['timeout']);
    }
    dispatcher.getInstance().dispatchEvent(new GoogEvent(AlertEventTypes.DISMISS_ALERT, popup));
    apply(this.scope_);
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


/**
 * @type {number}
 * @const
 */
Controller.ALERT_TIMER = 10000;

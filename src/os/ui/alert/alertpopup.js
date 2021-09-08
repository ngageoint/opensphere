goog.module('os.ui.alert.AlertPopupUI');

goog.require('os.ui.alert.alertLinkFilter');

const Delay = goog.require('goog.async.Delay');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const {getRandomString} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const AlertEvent = goog.require('os.alert.AlertEvent');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertEventTypes = goog.require('os.alert.AlertEventTypes');
const AlertManager = goog.require('os.alert.AlertManager');
const EventType = goog.require('os.alert.EventType');
const Settings = goog.require('os.config.Settings');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * The alert-popup directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'alert-popup';

/**
 * Register alert-popup directive.
 */
Module.directive('alertPopup', [directive]);


/**
 * Controller function for the alert-popup directive.
 * @unrestricted
 */
class Controller {
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
     * Count of duplicate alert messages
     * @type {number}
     * @private
     */
    this.dupeAlerts_ = 0;

    /**
     * Delay for deduping alerts
     * @type {Delay}
     * @private
     */
    this.dupeDelay_ = null;

    /**
     * Flag for times when we have an alert overflow
     * @type {boolean}
     * @private
     */
    this.dupeOverflow_ = false;

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

    if (this.dupeDelay_) {
      this.dupeDelay_.dispose();
      this.dupeDelay_ = null;
    }

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
    // deduping for floods of identical messages
    if (this.lastEvent_) {
      if (event.getMessage() == this.lastEvent_.getMessage()) {
        if (!this.dupeDelay_) {
          this.dupeDelay_ = new Delay(this.resetDupes_, Controller.ALERT_TIMER, this);
        }
        this.dupeDelay_.start();
        this.dupeAlerts_++;

        var limit = event.getLimit();
        if (this.dupeAlerts_ >= limit && !this.dupeOverflow_) {
          this.dupeOverflow_ = true;

          // only display the duplicate alert message if the default limit was reached
          if (limit == AlertEvent.DEFAULT_LIMIT) {
            var dupeEvent = new AlertEvent(
                'Too many duplicate alerts received! Open the alert window for details.',
                AlertEventSeverity.WARNING);
            this.displayAlert_(dupeEvent);
          }
        }
      } else {
        this.resetDupes_();
      }
    }

    this.lastEvent_ = event;

    if (!this.dupeOverflow_) {
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
   * Resets the dupe counter
   *
   * @private
   */
  resetDupes_() {
    this.dupeAlerts_ = 0;
    this.dupeOverflow_ = false;
    this.lastEvent_ = null;

    if (this.dupeDelay_) {
      this.dupeDelay_.dispose();
      this.dupeDelay_ = null;
    }
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

        setTimeout(handler, Controller.ALERT_TIMER);
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


exports = {
  Controller,
  directive,
  directiveTag
};

goog.provide('os.ui.alert.AlertPopupCtrl');
goog.provide('os.ui.alert.alertPopupDirective');

goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('ol.array');
goog.require('os.alert.AlertEvent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alertManager');
goog.require('os.structs.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.alert.alertLinkFilter');


/**
 * The alert-popup directive
 *
 * @return {angular.Directive}
 */
os.ui.alert.alertPopupDirective = function() {
  return {
    replace: true,
    restrict: 'AE',
    scope: true,
    templateUrl: os.ROOT + 'views/alert/alertpopup.html',
    controller: os.ui.alert.AlertPopupCtrl,
    controllerAs: 'alertPopupCtrl'
  };
};


/**
 * Register alert-popup directive.
 */
os.ui.Module.directive('alertPopup', [os.ui.alert.alertPopupDirective]);



/**
 * Controller function for the alert-popup directive.
 *
 * @param {!angular.Scope} $scope The scope
 * @constructor
 * @ngInject
 */
os.ui.alert.AlertPopupCtrl = function($scope) {
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
   * @type {goog.async.Delay}
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
   * @type {os.alert.AlertEvent}
   * @private
   */
  this.lastEvent_ = null;

  /**
   * @type {Array.<Object>}
   */
  this['alertPopups'] = [];

  this.alertClientId_ = 'alertpopups';
  os.alertManager.processMissedAlerts(this.alertClientId_, this.handleAlertEvent_, this);
  os.alertManager.listen(os.alert.EventType.ALERT, this.handleAlertEvent_, false, this);
  os.alertManager.listen(os.alert.EventType.CLEAR_ALERTS, this.clearAlerts, false, this);
  $scope.$on('dispatch', os.ui.alert.AlertPopupCtrl.dispatch_);
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Remove listeners and references.
 *
 * @private
 */
os.ui.alert.AlertPopupCtrl.prototype.destroy_ = function() {
  os.alertManager.unlisten(os.alert.EventType.ALERT, this.handleAlertEvent_, false, this);
  os.alertManager.unlisten(os.alert.EventType.CLEAR_ALERTS, this.clearAlerts, false, this);

  if (this.dupeDelay_) {
    this.dupeDelay_.dispose();
    this.dupeDelay_ = null;
  }

  this.timeout_ = null;
  this.scope_ = null;
};


/**
 * @type {number}
 * @const
 */
os.ui.alert.AlertPopupCtrl.ALERT_TIMER = 10000;


/**
 * Pops up an error message for 5 seconds
 *
 * @param {os.alert.AlertEvent} event The alert event to display.
 * @private
 */
os.ui.alert.AlertPopupCtrl.prototype.handleAlertEvent_ = function(event) {
  // deduping for floods of identical messages
  if (this.lastEvent_) {
    if (event.getMessage() == this.lastEvent_.getMessage()) {
      if (!this.dupeDelay_) {
        this.dupeDelay_ = new goog.async.Delay(this.resetDupes_, os.ui.alert.AlertPopupCtrl.ALERT_TIMER, this);
      }
      this.dupeDelay_.start();
      this.dupeAlerts_++;

      var limit = event.getLimit();
      if (this.dupeAlerts_ >= limit && !this.dupeOverflow_) {
        this.dupeOverflow_ = true;

        // only display the duplicate alert message if the default limit was reached
        if (limit == os.alert.AlertEvent.DEFAULT_LIMIT) {
          var dupeEvent = new os.alert.AlertEvent(
              'Too many duplicate alerts received! Open the alert window for details.',
              os.alert.AlertEventSeverity.WARNING);
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
};


/**
 * If the alert popup should be displayed.
 *
 * @return {boolean}
 * @private
 */
os.ui.alert.AlertPopupCtrl.prototype.popupsEnabled_ = function() {
  // this may cause popups to be displayed before settings are loaded even when the setting should be false,
  // but better than a null exception
  return os.settings.isLoaded() ? /** @type {boolean} */ (os.settings.get(['showAlertPopups'], true)) :
    true;
};


/**
 * Resets the dupe counter
 *
 * @private
 */
os.ui.alert.AlertPopupCtrl.prototype.resetDupes_ = function() {
  this.dupeAlerts_ = 0;
  this.dupeOverflow_ = false;
  this.lastEvent_ = null;

  if (this.dupeDelay_) {
    this.dupeDelay_.dispose();
    this.dupeDelay_ = null;
  }
};


/**
 * Pops up an error message for 5 seconds
 *
 * @param {os.alert.AlertEvent} event The message we want to pop up
 * @private
 */
os.ui.alert.AlertPopupCtrl.prototype.displayAlert_ = function(event) {
  if (this.popupsEnabled_()) {
    var id = goog.string.getRandomString();

    // the function which will actually close the alert
    var dismiss = function(event) {
      if (this.scope_) {
        // If the event target is the alert, only close that alert.
        var msg = event.target['msg'];
        var idx = '';
        if (msg) {
          idx = ol.array.findIndex(this['alertPopups'], function(popupObj) {
            return popupObj['msg'] == msg;
          });
        } else {
          idx = ol.array.findIndex(this['alertPopups'], function(popupObj) {
            return popupObj['id'] == id;
          });
        }

        if (idx != -1) {
          this['alertPopups'].splice(idx, 1);
          os.ui.apply(this.scope_);
        }
      }
    };

    // the event target which will trigger the alert to close
    var dismissDispatcher = event.getDismissDispatcher();
    if (!dismissDispatcher) {
      dismissDispatcher = new goog.events.EventTarget();
      var scope = this.scope_;
      var handler = function() {
        if (scope['hovered']) {
          setTimeout(handler, 1000);
        } else {
          dismissDispatcher.dispatchEvent(os.alert.AlertEventTypes.DISMISS_ALERT);
        }
      };

      setTimeout(handler, os.ui.alert.AlertPopupCtrl.ALERT_TIMER);
    }
    dismissDispatcher.listenOnce(os.alert.AlertEventTypes.DISMISS_ALERT, dismiss, false, this);

    var message = event.getMessage();
    var popup = {
      'id': id,
      'msg': message,
      'severity': event.getSeverity().toString(),
      'timeout': dismiss
    };

    this['alertPopups'].push(popup);
    os.ui.apply(this.scope_);
  }
};


/**
 * Clear all open alerts.
 *
 * @export
 */
os.ui.alert.AlertPopupCtrl.prototype.clearAlerts = function() {
  if (this['alertPopups'] && this.scope_) {
    for (var i = 0; i < this['alertPopups'].length; i++) {
      if (this['alertPopups'][i]['canClose']) {
        clearTimeout(this['alertPopups'][i]['timeout']);
      }
    }

    this['alertPopups'] = goog.array.filter(this['alertPopups'], function(alertPopup) {
      return !alertPopup['canClose'];
    });
    os.ui.apply(this.scope_);
  }
};


/**
 * Dismisses a popup and clears its timeout
 *
 * @param {number} $index The index of the message to dismiss
 * @param {Object} popup The popup to dismiss
 * @export
 */
os.ui.alert.AlertPopupCtrl.prototype.dismissAlert = function($index, popup) {
  if (this.popupsEnabled_()) {
    this['alertPopups'].splice($index, 1);
    clearTimeout(popup['timeout']);
  }
  os.dispatcher.dispatchEvent(new goog.events.Event(os.alert.AlertEventTypes.DISMISS_ALERT, popup));
  os.ui.apply(this.scope_);
};


/**
 * @param {angular.Scope.Event} evt The angular event
 * @param {string} type The event type to send
 * @private
 */
os.ui.alert.AlertPopupCtrl.dispatch_ = function(evt, type) {
  os.dispatcher.dispatchEvent(type);
};

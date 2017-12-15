goog.provide('os.ui.modal.ConfirmationModalCtrl');
goog.provide('os.ui.modal.confirmationModalDirective');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.ui.Module');
goog.require('os.ui.modal.modalAutoSizeDirective');


/**
 * @typedef {{
 *   title: string,
 *   message: string,
 *   submessage: string,
 *   yesClass: string,
 *   yesIcon: string,
 *   onYes: function(),
 *   onCancel: function()
 * }}
 */
os.ui.modal.ConfirmationModalOptions;


/**
 * The confirmation-modal directive is a catch-all modal display for the main page.  This modal dialog is controlled via
 * broadcasting messages from an ancestor to this directive.  The 'bits.modal.displayConfirmation' message
 * will toggle the modal on.  The title, message, and submessage can all be set within the parameters that are sent via
 * the emit. Cancel and Success callbacks are also available via the emit parameters. The yesClass param will set the
 * button class (btn-primary, btn-danger, etc) and the yesIcon param will set the icon class (fa-trash-o, etc) to use
 * for the Yes button.
 *
 * To close the modal, a second message needs to be broadcast from the parent: 'bits.modal.success'.
 *
 * @return {angular.Directive}
 */
os.ui.modal.confirmationModalDirective = function() {
  return {
    scope: true,
    replace: true,
    restrict: 'E',
    templateUrl: os.ROOT + 'views/modal/confirmationmodal.html',
    controller: os.ui.modal.ConfirmationModalCtrl,
    controllerAs: 'confctrl'
  };
};


/**
 * Register directive.
 */
os.ui.Module.directive('confirmationModal', [os.ui.modal.confirmationModalDirective]);



/**
 * Controller function for the confirmation-modal directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.modal.ConfirmationModalCtrl = function($scope, $element, $timeout) {
  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /** @type {string} */
  this['title'] = '';

  /** @type {string} */
  this['message'] = '';

  /** @type {string} */
  this['submessage'] = '';

  /** @type {string} */
  this['yesClass'] = '';

  /** @type {string} */
  this['yesIcon'] = '';

  /** @type {boolean} */
  this['saving'] = false;

  $scope.$on('bits.modal.displayConfirmation', function(event, params) {
    // set parameters from event
    this.setMessage(params);

    // show modal
    $element.modal({
      'show': true,
      'backdrop': 'static'
    });
  }.bind(this));

  $scope.$on('bits.modal.success', function(event, params) {
    this.cleanup();
    if (params && params['message']) {
      os.alert.AlertManager.getInstance().sendAlert(params['message'], os.alert.AlertEventSeverity.SUCCESS);
    }
  }.bind(this));

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.modal.ConfirmationModalCtrl.prototype.destroy_ = function() {
  this.element_ = null;
  this.compile_ = null;
  this.timeout_ = null;
};


/**
 * Grabs the parameters from the message.
 * @param {os.ui.modal.ConfirmationModalOptions} options
 */
os.ui.modal.ConfirmationModalCtrl.prototype.setMessage = function(options) {
  this['title'] = options['title'];
  this['message'] = options['message'];
  this['submessage'] = options['submessage'];
  this['yesClass'] = options['yesClass'];
  this['yesIcon'] = options['yesIcon'];
  this.onYes = options['onYes'];
  this.onCancel = options['onCancel'];
};


/**
 * Hides the modal after a button click
 */
os.ui.modal.ConfirmationModalCtrl.prototype.cancelClick = function() {
  // hide modal
  this.element_.modal('hide');

  // call cancel callback
  if (goog.isDefAndNotNull(this.onCancel)) {
    /** @type {!Function} */
    var callback = this.onCancel;
    this.timeout_(callback);
  }

  this.cleanup();
};
goog.exportProperty(
    os.ui.modal.ConfirmationModalCtrl.prototype,
    'cancelClick',
    os.ui.modal.ConfirmationModalCtrl.prototype.cancelClick);


/**
 * Confirm/Yes was clicked.  Set the display to lock while we call the success callback and wait for a new event to come
 * in before closing the dialog.
 */
os.ui.modal.ConfirmationModalCtrl.prototype.confirmClick = function() {
  this['saving'] = true;

  // call yes callback
  if (goog.isDefAndNotNull(this.onYes)) {
    /** @type {!Function} */
    var callback = this.onYes;
    this.timeout_(callback);
  }
};
goog.exportProperty(
    os.ui.modal.ConfirmationModalCtrl.prototype,
    'confirmClick',
    os.ui.modal.ConfirmationModalCtrl.prototype.confirmClick);


/**
 * Get rid of references to everything
 */
os.ui.modal.ConfirmationModalCtrl.prototype.cleanup = function() {
  this.element_.modal('hide');
  this['title'] = '';
  this['message'] = '';
  this['submessage'] = '';
  this.onYes = null;
  this.onCancel = null;
  this['saving'] = false;
};

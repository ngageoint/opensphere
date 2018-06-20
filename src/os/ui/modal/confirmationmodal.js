goog.provide('os.ui.modal.ConfirmationModalCtrl');
goog.provide('os.ui.modal.confirmationModalDirective');

goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.ui.Module');
goog.require('os.ui.modal.modalAutoSizeDirective');


/**
 * @typedef {{
 *   title: string,
 *   icon: string,
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
 * The confirmation-modal directive is a catch-all modal display for the main page. This modal dialog is controlled via
 * a launch call. The title, message, and submessage can all be set within the parameters that are sent via parameters.
 * Cancel and Success callbacks are also available via the parameters. The yesClass param will set the
 * button class (btn-primary, btn-danger, etc) and the yesIcon param will set the icon class (fa-trash-o, etc) to use
 * for the Yes button.
 *
 * @return {angular.Directive}
 */
os.ui.modal.confirmationModalDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'params': '='
    },
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

  this.setMessage($scope['params']);

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @const {string}
 */
os.ui.modal.ConfirmationModalCtrl.ID = 'confirmModal';


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
  // call cancel callback
  if (goog.isDefAndNotNull(this.onCancel)) {
    /** @type {!Function} */
    var callback = this.onCancel;
    this.timeout_(callback);
  }

  os.ui.window.close(os.ui.window.getById(os.ui.modal.ConfirmationModalCtrl.ID));
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
 * launches confirmation modal
 * @param {os.ui.modal.ConfirmationModalOptions} params
 */
os.ui.modal.ConfirmationModalCtrl.launch = function(params) {
  var html = '<confirmation-modal params="params"></confirmation-modal>';
  var options = {
    'id': os.ui.modal.ConfirmationModalCtrl.ID,
    'icon': params['icon'] || '',
    'width': 550,
    'height': 'auto',
    'label': params['title'] || '',
    'show-close': true,
    'modal': true,
    'x': 'center',
    'y': 'center'
  };

  var scopeOptions = {
    'params': params
  };

  if (os.ui.window.exists(os.ui.modal.ConfirmationModalCtrl.ID)) {
    os.ui.window.close(os.ui.window.getById(os.ui.modal.ConfirmationModalCtrl.ID));
  }

  // Create the modal window
  os.ui.window.create(options, html, undefined, undefined, undefined, scopeOptions);
};

goog.module('os.ui.modal.ConfirmationModalUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const {close, create, exists, getById} = goog.require('os.ui.window');


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
let ConfirmationModalOptions;

/**
 * The confirmation-modal directive is a catch-all modal display for the main page. This modal dialog is controlled via
 * a launch call. The title, message, and submessage can all be set within the parameters that are sent via parameters.
 * Cancel and Success callbacks are also available via the parameters. The yesClass param will set the
 * button class (btn-primary, btn-danger, etc) and the yesIcon param will set the icon class (fa-trash-o, etc) to use
 * for the Yes button.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'params': '='
  },
  templateUrl: ROOT + 'views/modal/confirmationmodal.html',
  controller: Controller,
  controllerAs: 'confctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'confirmation-modal';

/**
 * Register directive.
 */
Module.directive('confirmationModal', [directive]);

/**
 * Controller function for the confirmation-modal directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  destroy_() {
    this.element_ = null;
    this.compile_ = null;
    this.timeout_ = null;
  }

  /**
   * Grabs the parameters from the message.
   *
   * @param {ConfirmationModalOptions} options
   */
  setMessage(options) {
    this['title'] = options['title'];
    this['message'] = options['message'];
    this['submessage'] = options['submessage'];
    this['yesClass'] = options['yesClass'];
    this['yesIcon'] = options['yesIcon'];
    this.onYes = options['onYes'];
    this.onCancel = options['onCancel'];
  }

  /**
   * Hides the modal after a button click
   *
   * @export
   */
  cancelClick() {
    // call cancel callback
    if (this.onCancel != null) {
      /** @type {!Function} */
      var callback = this.onCancel;
      this.timeout_(callback);
    }

    close(getById(Controller.ID));
  }

  /**
   * Confirm/Yes was clicked.  Set the display to lock while we call the success callback and wait for a new event to come
   * in before closing the dialog.
   *
   * @export
   */
  confirmClick() {
    this['saving'] = true;

    // call yes callback
    if (this.onYes != null) {
      /** @type {!Function} */
      var callback = this.onYes;
      this.timeout_(callback);
    }
  }

  /**
   * launches confirmation modal
   *
   * @param {ConfirmationModalOptions} params
   */
  static launch(params) {
    var html = '<confirmation-modal params="params"></confirmation-modal>';
    var options = {
      'id': Controller.ID,
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

    if (exists(Controller.ID)) {
      close(getById(Controller.ID));
    }

    // Create the modal window
    create(options, html, undefined, undefined, undefined, scopeOptions);
  }
}

/**
 * @const {string}
 */
Controller.ID = 'confirmModal';

exports = {
  ConfirmationModalOptions,
  Controller,
  directive,
  directiveTag
};

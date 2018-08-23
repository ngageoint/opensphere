goog.provide('os.ui.im.FileSupportChoice');
goog.provide('os.ui.im.FileSupportCtrl');
goog.provide('os.ui.im.fileSupportDirective');

goog.require('goog.Disposable');
goog.require('goog.Promise');
goog.require('goog.dom');
goog.require('goog.events.KeyHandler');
goog.require('os.file.upload');
goog.require('os.string');
goog.require('os.ui.Module');


/**
 * @enum {string}
 */
os.ui.im.FileSupportChoice = {
  LOCAL: 'local',
  UPLOAD: 'upload'
};


/**
 * Dialog to prompt the user that IndexedDB is not supported.
 * @return {angular.Directive}
 */
os.ui.im.fileSupportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/im/filesupport.html',
    controller: os.ui.im.FileSupportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('filesupport', [os.ui.im.fileSupportDirective]);



/**
 * Controller for the file support directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.im.FileSupportCtrl = function($scope, $element) {
  os.ui.im.FileSupportCtrl.base(this, 'constructor');

  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * The root DOM element.
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * The file.
   * @type {os.file.File}
   * @private
   */
  this.file_ = this.scope_['file'];

  /**
   * Callback for dialog confirmation.
   * @type {function(string=)}
   * @private
   */
  this.confirmCallback_ = this.scope_['confirm'];

  /**
   * Callback for dialog cancel.
   * @type {function(*)}
   * @private
   */
  this.cancelCallback_ = this.scope_['cancel'];

  /**
   * Key event handler.
   * @type {!goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);

  /**
   * The application name.
   * @type {string}
   */
  this['application'] = os.config.getAppName('the application');

  /**
   * If file upload is supported by the application.
   * @type {boolean}
   */
  this['supportsUpload'] = os.file.upload.uploadFile != null;

  /**
   * Support contact details.
   * @type {string}
   */
  this['supportContact'] = os.string.linkify(/** @type {string} */ (
      os.config.getSupportContact('your system administrator')));

  /**
   * User selection.
   * @type {!os.ui.im.FileSupportChoice}
   */
  this['choice'] = os.ui.im.FileSupportChoice.LOCAL;

  $scope.$on('$destroy', this.dispose.bind(this));

  if (!this.file_) {
    if (this.cancelCallback_) {
      this.cancelCallback_('Local file could not be loaded.');
    }

    this.close_();
  } else {
    $scope.$emit(os.ui.WindowEventType.READY);
  }
};
goog.inherits(os.ui.im.FileSupportCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.im.FileSupportCtrl.prototype.disposeInternal = function() {
  os.ui.im.FileSupportCtrl.base(this, 'disposeInternal');

  goog.dispose(this.keyHandler_);

  this.element_ = null;
  this.scope_ = null;
  this.file_ = null;
};


/**
 * Fire the cancel callback and close the window.
 */
os.ui.im.FileSupportCtrl.prototype.cancel = function() {
  if (this.cancelCallback_) {
    this.cancelCallback_(os.events.EventType.CANCEL);
  }

  this.close_();
};
goog.exportProperty(os.ui.im.FileSupportCtrl.prototype, 'cancel', os.ui.im.FileSupportCtrl.prototype.cancel);


/**
 * Fire the confirmation callback and close the window.
 */
os.ui.im.FileSupportCtrl.prototype.confirm = function() {
  if (this['choice'] === os.ui.im.FileSupportChoice.UPLOAD && os.file.upload.uploadFile != null) {
    os.file.upload.uploadFile(this.file_).then(this.confirmCallback_, this.cancelCallback_);
  } else if (this.confirmCallback_) {
    this.confirmCallback_();
  }

  this.close_();
};
goog.exportProperty(os.ui.im.FileSupportCtrl.prototype, 'confirm', os.ui.im.FileSupportCtrl.prototype.confirm);


/**
 * Close the window.
 * @private
 */
os.ui.im.FileSupportCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element_);
};


/**
 * Handles key events
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.ui.im.FileSupportCtrl.prototype.handleKeyEvent_ = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.cancel();
  }
};


/**
 * Launch a dialog prompting the user the file they're importing already exists and requesting action.
 * @param {!os.file.File} file The file
 * @return {!goog.Promise<string>}
 */
os.ui.im.launchFileSupport = function(file) {
  return new goog.Promise(function(resolve, reject) {
    var scopeOptions = {
      'file': file,
      'confirm': resolve,
      'cancel': reject
    };

    var windowOptions = {
      'label': 'Unable to Store File',
      'headerClass': 'bg-warning u-bg-warning-text',
      'icon': 'fa fa-warning',
      'x': 'center',
      'y': 'center',
      'width': 550,
      'min-width': 400,
      'max-width': 800,
      'height': 'auto',
      'modal': true,
      'show-close': true,
      'no-scroll': true
    };

    var template = '<filesupport></filesupport>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  });
};

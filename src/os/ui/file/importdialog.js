goog.provide('os.ui.file.ImportDialogCtrl');
goog.provide('os.ui.file.importDialogDirective');

goog.require('goog.events.EventType');
goog.require('goog.fs.FileReader');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.events.EventType');
goog.require('os.file');
goog.require('os.file.File');
goog.require('os.net.LocalFileHandler');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.popover.popoverDirective');
goog.require('os.ui.util.validationMessageDirective');
goog.require('os.ui.window');


/**
 * All purpose file/url import directive
 *
 * @return {angular.Directive}
 */
os.ui.file.importDialogDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'method': '=',
      'manager': '=?',
      'hideCancel': '=?',
      'confirmText': '=?',
      'onCancel': '=?'
    },
    templateUrl: os.ROOT + 'views/file/importdialog.html',
    controller: os.ui.file.ImportDialogCtrl,
    controllerAs: 'importdialog'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('importdialog', [os.ui.file.importDialogDirective]);



/**
 * Controller for the file/url import dialog
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.file.ImportDialogCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {boolean}
   * @private
   */
  this.importComplete_ = false;

  /**
   * @type {?File}
   */
  this['file'] = null;

  /**
   * @type {?string}
   */
  this['url'] = null;

  /**
   * @type {boolean}
   */
  this['hideCancel'] = /** @type {boolean} */ ($scope['hideCancel']) || false;

  /**
   * @type {boolean}
   */
  this['fileChosen'] = false;

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  $scope['confirmText'] = $scope['confirmText'] || 'Next';

  /**
   * @type {?Element}
   * @private
   */
  this.fileInputEl_ = goog.dom.createDom(goog.dom.TagName.INPUT, {
    'type': 'file',
    'name': 'file',
    'class': 'd-none'
  });
  goog.dom.appendChild(goog.dom.getElement(os.ui.windowSelector.CONTAINER.substring(1)), this.fileInputEl_);
  goog.events.listen(this.fileInputEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);

  // bring focus to the url input
  this.element_.find('input[name="url"]').focus();

  $scope.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.ImportDialogCtrl.LOGGER_ = goog.log.getLogger('os.ui.file.ImportDialogCtrl');


/**
 * Clean up references/listeners.
 *
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.onDestroy_ = function() {
  goog.events.unlisten(this.fileInputEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);
  goog.dom.removeNode(this.fileInputEl_);
  this.fileInputEl_ = null;

  this['file'] = null;

  if (!this.importComplete_) {
    this.cancelMethod_();
  }

  this.scope_ = null;
  this.element_ = null;
};


/**
 * Create import command and close the window
 *
 * @export
 */
os.ui.file.ImportDialogCtrl.prototype.accept = function() {
  if (this.scope_['method']) {
    this['loading'] = true;

    var method = /** @type {os.ui.file.method.ImportMethod} */ (this.scope_['method']);
    var url;

    if (this['fileChosen']) {
      var file = /** @type {File|undefined} */ (this['file']);
      if (file) {
        // load a local file
        var reader = os.file.createFromFile(this['file']);
        if (reader) {
          reader.addCallbacks(this.onFileReady_, this.onFileError_, this);
        }
      }
    } else {
      url = this['url'];
    }

    if (url) {
      // load a remote url
      method.setUrl(url);
      method.listenOnce(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
      method.listenOnce(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
      method.listenOnce(os.events.EventType.ERROR, this.onLoadError_, false, this);
      method.loadFile();
    }
  } else {
    this.close();
  }
};


/**
 * Close the window.
 *
 * @export
 */
os.ui.file.ImportDialogCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};


/**
 * Cancel the window
 *
 * @export
 */
os.ui.file.ImportDialogCtrl.prototype.cancel = function() {
  if (this.scope_ && this.scope_['onCancel']) {
    this.scope_['onCancel']();
  }

  this.close();
};


/**
 * Launch the system file browser.
 *
 * @export
 */
os.ui.file.ImportDialogCtrl.prototype.clearFile = function() {
  if (this.fileInputEl_) {
    this.fileInputEl_.value = null;
  }

  if (this.element_) {
    // bring focus to the url input
    this.element_.find('input[name="url"]').focus();
  }

  this['url'] = null;
  this['fileChosen'] = false;
};


/**
 * Get the import types supported by the application.
 *
 * @return {string}
 * @export
 */
os.ui.file.ImportDialogCtrl.prototype.getImportDetails = function() {
  var result;

  if (this.scope_ && this.scope_['manager']) {
    var im = /** @type {os.ui.im.ImportManager} */ (this.scope_['manager']);
    var details = im.getImportDetails();
    if (details.length > 0) {
      result = '<ul>';
      details.forEach(function(d) {
        result += '<li>' + d + '</li>';
      });
      result += '</ul>';
    }
  }

  return result;
};


/**
 * Launch the system file browser.
 *
 * @export
 */
os.ui.file.ImportDialogCtrl.prototype.openFileBrowser = function() {
  this.fileInputEl_.click();
};


/**
 * Grabs the file from the hidden input element and sets the name on the text element.
 *
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.onFileChange_ = function(event) {
  if (this.fileInputEl_.files && this.fileInputEl_.files.length > 0) {
    this['file'] = this.fileInputEl_.files[0];
    this.getFileExtention_(this['file']);
  }

  this['url'] = this['file'] != null ? /** @type {File} */ (this['file']).name : null;
  this['fileChosen'] = true;

  os.ui.apply(this.scope_);
};


/**
 * Handler for successful file read.
 *
 * @param {os.file.File} file The file.
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.onFileReady_ = function(file) {
  this['loading'] = false;

  if (file) {
    var method = /** @type {os.file.IFileMethod} */ (this.scope_['method']);
    method.setFile(file);
    method.loadFile();

    this.importComplete_ = true;
  }

  this.close();
};


/**
 * Handler for failed file read. Display an error message and close the window.
 *
 * @param {string} errorMsg The error message.
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.onFileError_ = function(errorMsg) {
  this['loading'] = false;

  if (!errorMsg || typeof errorMsg !== 'string') {
    var fileName = this['file'] ? this['file'].name : 'unknown';
    errorMsg = 'Unable to load file "' + fileName + '"!';
  }

  os.alertManager.sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR, os.ui.file.ImportDialogCtrl.LOGGER_);
  this.close();
};


/**
 * Handle URL method load complete.
 *
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.onLoadComplete_ = function(event) {
  var method = /** @type {os.ui.file.method.ImportMethod} */ (event.target);
  method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);

  this.importComplete_ = true;
  this['loading'] = false;
  this.close();
};


/**
 * Handle URL method load error. This should not close the form so the user can correct the error.
 *
 * @param {goog.events.Event} event The event
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.onLoadError_ = function(event) {
  var method = /** @type {os.ui.file.method.ImportMethod} */ (event.target);
  method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
  method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);

  this['loading'] = false;
};


/**
 * Fires a cancel event on the method so listeners can respond appropriately.
 *
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.cancelMethod_ = function() {
  if (this.scope_['method']) {
    var method = /** @type {os.file.IFileMethod} */ (this.scope_['method']);
    method.dispatchEvent(os.events.EventType.CANCEL);
  }
};


/**
 * Detect the file extension
 *
 * @param {Object} file The file Object
 * @return {string} The file extension
 * @private
 */
os.ui.file.ImportDialogCtrl.prototype.getFileExtention_ = function(file) {
  if (file.name) {
    return file.name.substr(file.name.lastIndexOf('.'));
  }
  return '';
};

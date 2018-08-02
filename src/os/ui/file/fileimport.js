goog.provide('os.ui.file.FileImportCtrl');
goog.provide('os.ui.file.fileImportDirective');
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
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * The file import directive
 * @return {angular.Directive}
 */
os.ui.file.fileImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/fileimport.html',
    controller: os.ui.file.FileImportCtrl,
    controllerAs: 'fileImport'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('fileimport', [os.ui.file.fileImportDirective]);



/**
 * Controller for the file import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.file.FileImportCtrl = function($scope, $element, $timeout) {
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
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

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
  this['fileName'] = null;

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {?Element}
   * @private
   */
  this.fileInputEl_ = goog.dom.createDom(goog.dom.TagName.INPUT, {
    'type': 'file',
    'name': 'file',
    'class': 'input-hidden'
  });
  goog.dom.appendChild(goog.dom.getElement('win-container'), this.fileInputEl_);
  goog.events.listen(this.fileInputEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);

  $scope.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.FileImportCtrl.LOGGER_ = goog.log.getLogger('os.ui.file.FileImportCtrl');


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.file.FileImportCtrl.prototype.onDestroy_ = function() {
  goog.events.unlisten(this.fileInputEl_, goog.events.EventType.CHANGE, this.onFileChange_, false, this);
  goog.dom.removeNode(this.fileInputEl_);
  this.fileInputEl_ = null;

  this['file'] = null;

  if (!this.importComplete_) {
    this.cancelMethod_();
  }

  this.scope_ = null;
  this.element_ = null;
  this.timeout_ = null;
};


/**
 * Create import command and close the window
 */
os.ui.file.FileImportCtrl.prototype.accept = function() {
  if (this.scope_['method'] && this['file']) {
    this['loading'] = true;
    var keepFile = /** @type {os.file.IFileMethod} */ (this.scope_['method']).getKeepFile();

    var reader = os.file.createFromFile(this['file'], keepFile);
    if (reader) {
      reader.addCallbacks(this.handleResult_, this.handleError_, this);
    }
  } else {
    this.close();
  }
};
goog.exportProperty(
    os.ui.file.FileImportCtrl.prototype,
    'accept',
    os.ui.file.FileImportCtrl.prototype.accept);


/**
 * Handler for successful file read.
 * @param {os.file.File} file The file.
 * @private
 */
os.ui.file.FileImportCtrl.prototype.handleResult_ = function(file) {
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
 * @param {string} errorMsg The error message.
 * @private
 */
os.ui.file.FileImportCtrl.prototype.handleError_ = function(errorMsg) {
  this['loading'] = false;

  if (!errorMsg || !goog.isString(errorMsg)) {
    var fileName = this['file'] ? this['file'].name : 'unknown';
    errorMsg = 'Unable to load file "' + fileName + '"!';
  }

  goog.log.error(os.ui.file.FileImportCtrl.LOGGER_, errorMsg);
  os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
  this.close();
};


/**
 * Close the window.
 */
os.ui.file.FileImportCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(
    os.ui.file.FileImportCtrl.prototype,
    'close',
    os.ui.file.FileImportCtrl.prototype.close);


/**
 * Launch the system file browser.
 */
os.ui.file.FileImportCtrl.prototype.openFileBrowser = function() {
  this.fileInputEl_.click();
};
goog.exportProperty(
    os.ui.file.FileImportCtrl.prototype,
    'openFileBrowser',
    os.ui.file.FileImportCtrl.prototype.openFileBrowser);


/**
 * Grabs the file from the hidden input element and sets the name on the text element.
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.ui.file.FileImportCtrl.prototype.onFileChange_ = function(event) {
  if (this.fileInputEl_.files && this.fileInputEl_.files.length > 0) {
    this['file'] = this.fileInputEl_.files[0];
  }

  this.timeout_(goog.bind(function() {
    this['fileName'] = goog.isDefAndNotNull(this['file']) ? /** @type {File} */ (this['file']).name : null;
  }, this));
};


/**
 * Fires a cancel event on the method so listeners can respond appropriately.
 * @private
 */
os.ui.file.FileImportCtrl.prototype.cancelMethod_ = function() {
  if (this.scope_['method']) {
    var method = /** @type {os.file.IFileMethod} */ (this.scope_['method']);
    method.dispatchEvent(os.events.EventType.CANCEL);
  }
};

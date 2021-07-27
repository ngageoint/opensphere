goog.module('os.ui.file.ImportDialogUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.popover.PopoverUI');

const dom = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');
const googEvents = goog.require('goog.events');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const {ROOT} = goog.require('os');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const EventType = goog.require('os.events.EventType');
const {createFromFile} = goog.require('os.file');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');

const Logger = goog.requireType('goog.log.Logger');
const OSFile = goog.requireType('os.file.File');
const IFileMethod = goog.requireType('os.file.IFileMethod');
const ImportMethod = goog.requireType('os.ui.file.method.ImportMethod');
const ImportManager = goog.requireType('os.ui.im.ImportManager');


/**
 * All purpose file/url import directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'method': '=',
    'manager': '=?',
    'hideCancel': '=?',
    'confirmText': '=?',
    'onCancel': '=?'
  },
  templateUrl: ROOT + 'views/file/importdialog.html',
  controller: Controller,
  controllerAs: 'importdialog'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'importdialog';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the file/url import dialog
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
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
    this.fileInputEl_ = dom.createDom(TagName.INPUT, {
      'type': 'file',
      'name': 'file',
      'class': 'd-none',
      'id': 'fileImportId'
    });
    dom.appendChild(dom.getElement(windowSelector.CONTAINER.substring(1)), this.fileInputEl_);
    googEvents.listen(this.fileInputEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);

    // bring focus to the url input
    this.element_.find('input[name="url"]').focus();

    $scope.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  onDestroy_() {
    googEvents.unlisten(this.fileInputEl_, GoogEventType.CHANGE, this.onFileChange_, false, this);
    dom.removeNode(this.fileInputEl_);
    this.fileInputEl_ = null;

    this['file'] = null;

    if (!this.importComplete_) {
      this.cancelMethod_();
    }

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Create import command and close the window
   *
   * @export
   */
  accept() {
    if (this.scope_['method']) {
      this['loading'] = true;

      var method = /** @type {ImportMethod} */ (this.scope_['method']);
      var url;

      if (this['fileChosen']) {
        var file = /** @type {File|undefined} */ (this['file']);
        if (file) {
          // load a local file
          var reader = createFromFile(this['file']);
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
        method.listenOnce(EventType.COMPLETE, this.onLoadComplete_, false, this);
        method.listenOnce(EventType.CANCEL, this.onLoadComplete_, false, this);
        method.listenOnce(EventType.ERROR, this.onLoadError_, false, this);
        method.loadFile();
      }
    } else {
      this.close();
    }
  }

  /**
   * Close the window.
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }

  /**
   * Cancel the window
   *
   * @export
   */
  cancel() {
    if (this.scope_ && this.scope_['onCancel']) {
      this.scope_['onCancel']();
    }

    this.close();
  }

  /**
   * Launch the system file browser.
   *
   * @export
   */
  clearFile() {
    if (this.fileInputEl_) {
      this.fileInputEl_.value = null;
    }

    if (this.element_) {
      // bring focus to the url input
      this.element_.find('input[name="url"]').focus();
    }

    this['url'] = null;
    this['fileChosen'] = false;
  }

  /**
   * Get the import types supported by the application.
   *
   * @return {string}
   * @export
   */
  getImportDetails() {
    var result;

    if (this.scope_ && this.scope_['manager']) {
      var im = /** @type {ImportManager} */ (this.scope_['manager']);
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
  }

  /**
   * Launch the system file browser.
   *
   * @export
   */
  openFileBrowser() {
    this.fileInputEl_.click();
  }

  /**
   * Grabs the file from the hidden input element and sets the name on the text element.
   *
   * @param {goog.events.BrowserEvent} event
   * @private
   */
  onFileChange_(event) {
    if (this.fileInputEl_.files && this.fileInputEl_.files.length > 0) {
      this['file'] = this.fileInputEl_.files[0];
      this.getFileExtention_(this['file']);
    }

    this['url'] = this['file'] != null ? /** @type {File} */ (this['file']).name : null;
    this['fileChosen'] = true;

    apply(this.scope_);
  }

  /**
   * Handler for successful file read.
   *
   * @param {OSFile} file The file.
   * @private
   */
  onFileReady_(file) {
    this['loading'] = false;

    if (file) {
      var method = /** @type {IFileMethod} */ (this.scope_['method']);
      method.setFile(file);
      method.loadFile();

      this.importComplete_ = true;
    }

    this.close();
  }

  /**
   * Handler for failed file read. Display an error message and close the window.
   *
   * @param {string} errorMsg The error message.
   * @private
   */
  onFileError_(errorMsg) {
    this['loading'] = false;

    if (!errorMsg || typeof errorMsg !== 'string') {
      var fileName = this['file'] ? this['file'].name : 'unknown';
      errorMsg = 'Unable to load file "' + fileName + '"!';
    }

    AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR, logger);
    this.close();
  }

  /**
   * Handle URL method load complete.
   *
   * @param {goog.events.Event} event The event
   * @private
   */
  onLoadComplete_(event) {
    var method = /** @type {ImportMethod} */ (event.target);
    method.unlisten(EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.unlisten(EventType.CANCEL, this.onLoadComplete_, false, this);
    method.unlisten(EventType.ERROR, this.onLoadError_, false, this);

    this.importComplete_ = true;
    this['loading'] = false;
    this.close();
  }

  /**
   * Handle URL method load error. This should not close the form so the user can correct the error.
   *
   * @param {goog.events.Event} event The event
   * @private
   */
  onLoadError_(event) {
    var method = /** @type {ImportMethod} */ (event.target);
    method.unlisten(EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.unlisten(EventType.CANCEL, this.onLoadComplete_, false, this);
    method.unlisten(EventType.ERROR, this.onLoadError_, false, this);

    this['loading'] = false;
  }

  /**
   * Fires a cancel event on the method so listeners can respond appropriately.
   *
   * @private
   */
  cancelMethod_() {
    if (this.scope_['method']) {
      var method = /** @type {IFileMethod} */ (this.scope_['method']);
      method.dispatchEvent(EventType.CANCEL);
    }
  }

  /**
   * Detect the file extension
   *
   * @param {Object} file The file Object
   * @return {string} The file extension
   * @private
   */
  getFileExtention_(file) {
    if (file.name) {
      return file.name.substr(file.name.lastIndexOf('.'));
    }
    return '';
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.file.ImportDialogCtrl');

exports = {
  Controller,
  directive,
  directiveTag
};

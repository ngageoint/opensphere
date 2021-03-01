goog.module('os.ui.file.AddServer');
goog.module.declareLegacyNamespace();

const File = goog.require('os.file.File');
const Module = goog.require('os.ui.Module');
const ImportManager = goog.require('os.ui.im.ImportManager');
const uiWindow = goog.require('os.ui.window');

const helpWindowId = 'url-help';


/**
 * The addserver directive.
 * @return {angular.Directive}
 */
const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/file/addserver.html',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'addserver';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the addserver directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
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
    this.methodLoaded_ = false;

    /**
     * @type {boolean}
     */
    this['loading'] = false;

    /**
     * @type {string}
     */
    this['url'] = '';

    /**
     * @type {os.ui.im.ImportManager}
     */
    this['im'] = ImportManager.getInstance();

    /**
     * @type {os.ui.ProviderImportUI}
     */
    this['ui'] = null;

    /**
     * Generic file object that is used to launch UI
     * @type {os.file.File}
     */
    this['file'] = new File();

    /**
     * @type {string}
     */
    this['serverType'] = null;

    /**
     * Available server type choices in the UI.
     * @type {Array}
     */
    this['items'] = Object.values(ImportManager.getInstance().getServerTypes());

    this['file'].setUrl('');

    $scope.$emit(os.ui.WindowEventType.READY);
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   * @private
   */
  onDestroy_() {
    if (!this.methodLoaded_) {
      this.cancelMethod_();
    }

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Get the appropriate UI for the serverType.
   * @param {?string} item
   * @return {?string} UI
   */
  getUi(item) {
    if (item) {
      return ImportManager.getInstance().getServerType(item['type']).ui;
    }

    return null;
  }

  /**
   * Launches the server specific URL help dialog.
   * @export
   */
  launchHelp() {
    if (!uiWindow.exists(helpWindowId)) {
      var currentItem = this['serverType']['label'] + ' ';
      uiWindow.create({
        'label': currentItem + 'Formats',
        'icon': 'fa fa-clock-o',
        'x': '-10',
        'y': 'center',
        'width': '445',
        'min-width': '250',
        'max-width': '600',
        'height': '445',
        'min-height': '250',
        'max-height': '600',
        'show-close': true,
        'modal': true,
        'id': helpWindowId
      }, this['serverType']['helpUi']);
    }
  }

  /**
   * Close the window.
   * @export
   */
  close() {
    if (this.element_) {
      os.ui.window.close(this.element_);
    }
  }

  /**
   * Fires a cancel event on the method so listeners can respond appropriately.
   * @private
   */
  cancelMethod_() {
    var method = /** @type {os.ui.file.method.UrlMethod} */ (this.scope_['method']);
    if (method) {
      method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
      method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
      method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);
      method.unlisten(os.events.EventType.ERROR, this.onServerTypeChange_, false, this);

      method.dispatchEvent(os.events.EventType.CANCEL);
    }
  }

  /**
   * Handle URL method load complete.
   * @param {goog.events.Event} event The event
   * @private
   */
  onLoadComplete_(event) {
    var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
    method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
    method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);

    this.methodLoaded_ = true;
    this['loading'] = false;
    this.close();
  }

  /**
   * Handle URL method load error. This should not close the form so the user can correct the error.
   * @param {goog.events.Event} event The event
   * @private
   */
  onLoadError_(event) {
    var method = /** @type {os.ui.file.method.UrlMethod} */ (event.target);
    method.unlisten(os.events.EventType.COMPLETE, this.onLoadComplete_, false, this);
    method.unlisten(os.events.EventType.CANCEL, this.onLoadComplete_, false, this);
    method.unlisten(os.events.EventType.ERROR, this.onLoadError_, false, this);

    this['loading'] = false;
    os.ui.apply(this.scope_);
  }

  /**
   * Handles server type change.
   * @private
   */
  onServerTypeChange_() {
    const helpWindow = uiWindow.getById(helpWindowId);
    if (helpWindow) {
      uiWindow.close(helpWindow);
    }
  }
}


/**
 * Launch a window that will add servers
 */
const launchAddServerWindow = function() {
  const id = 'addServer';
  if (uiWindow.exists(id)) {
    uiWindow.bringToFront(id);
  } else {
    uiWindow.create({
      'id': id,
      'label': 'Add Server',
      'icon': 'fa fa-cloud-download',
      'x': 'center',
      'y': 'center',
      'width': '500',
      'min-width': '500',
      'max-width': '500',
      'height': 'auto',
      'modal': true,
      'show-close': true
    }, 'addserver');
  }
};


exports = {
  Controller,
  directive,
  launchAddServerWindow
};

goog.module('os.ui.file.AddServer');
goog.module.declareLegacyNamespace();

const File = goog.require('os.file.File');
const FileParserConfig = goog.require('os.parse.FileParserConfig');
const Module = goog.require('os.ui.Module');
const ImportManager = goog.require('os.ui.im.ImportManager');
const uiWindow = goog.require('os.ui.window');
const {launchAddServerUrlFormatHelpWindow} = goog.require('os.ui.window.AddServerUrlFormatHelpUI');


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
     * @type {string}
     */
    this['currentItem'] = null;

    /**
     * Available server type choices in the UI.
     * @type {Object}
     */
    this['items'] = {
      'ArcGIS Server': { // TBD: remove redundant key
        type: 'arc',
        config: new FileParserConfig(),
        helpText: 'ArcGIS servers can be added in a couple of ways.\n' +
        'To add all layers on the server, use a URL like:\n\n' +
        'https://example.com/arc/rest/services\n\n' +
        'To add a single layer, use a URL like:\n\n' +
        'https://example.com/arc/rest/services/groupname/layername',
        title: 'ArcGIS Server'
      },
      'GeoServer': {
        type: 'geoserver',
        config: new FileParserConfig(),
        helpText: 'OGC Servers (like GeoServer) can provide map data via Web Map Service (WMS) ' +
        'or Web Map Tile Service (WMTS) and feature data via Web Feature Service (WFS).\n\n' +
        'A WMS URL looks like:\n\n' +
        'https//example.com/ogc?service=WMS&version=1.1.0\n' +
        'or\n' +
        'https://example.com/mapservice/wms?version=1.0.0\n\n' +
        'Supported WMS versions are: 1.0.0, 1.1.0, and 1.2.0\n\n' +
        'A WFS URL looks like:\n\n' +
        'https//example.com/ogc?service=WFS&version=1.1.0\n' +
        'or\n' +
        'https://example.com/mapservice/wfs?version=1.0.0\n\n' +
        'Supported WFS versions are: 1.0.0, 1.1.0, and 1.2.0\n\n' +
        'A WMTS URL looks like:\n\n' +
        'https//example.com/ogc?service=WMTS&version=1.1.0\n' +
        'or\n' +
        'https://example.com/mapservice/wmts?version=1.0.0\n\n' +
        'Supported WMTS versions are: 1.0.0, 1.1.0, and 1.2.0',
        title: 'GeoServer'
      },
      'OGC Server': {
        type: 'ogc',
        config: new FileParserConfig(),
        helpText: 'OGC Servers (like GeoServer) can provide map data via Web Map Service (WMS) ' +
        'or Web Map Tile Service (WMTS) and feature data via Web Feature Service (WFS).\n\n' +
        'A WMS URL looks like:\n\n' +
        'https//example.com/ogc?service=WMS&version=1.1.0\n' +
        'or\n' +
        'https://example.com/mapservice/wms?version=1.0.0\n\n' +
        'Supported WMS versions are: 1.0.0, 1.1.0, and 1.2.0\n\n' +
        'A WFS URL looks like:\n\n' +
        'https//example.com/ogc?service=WFS&version=1.1.0\n' +
        'or\n' +
        'https://example.com/mapservice/wfs?version=1.0.0\n\n' +
        'Supported WFS versions are: 1.0.0, 1.1.0, and 1.2.0\n\n' +
        'A WMTS URL looks like:\n\n' +
        'https//example.com/ogc?service=WMTS&version=1.1.0\n' +
        'or\n' +
        'https://example.com/mapservice/wmts?version=1.0.0\n\n' +
        'Supported WMTS versions are: 1.0.0, 1.1.0, and 1.2.0',
        title: 'OGC Server'
      }
    };

    /**
     * Mappings between server keyword and type.
     * @type {Object}
     */
    this['itemTypeMappings'] = {
      'arc': 'ArcGIS Server',
      'geoserver': 'OGC/GeoServer'
    };

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
   * Create import command and close the window.
   * @export
   */
  accept() {
    // this['loading'] = true;
    // this.close();
    // this.launchSpecificServerWindow(this['serverType']);
  }

  /**
   * Get the appropriate UI for the serverType.
   * @param {?string} item
   * @return {?string} UI
   */
  getUi(item) {
    if (item) {
      // var type = '';
      // switch (item) {
      //   case 'GeoServer':
      //     type = 'geoserver';
      //     break;
      //   case 'ArcGIS':
      //     type = 'arc';
      //     break;
      //   case 'WFS/WMS':
      //     type = ''; // TBD
      //     break;
      //   case 'WMTS':
      //     type = 'wmts';
      //     break;
      //   default:
      //     break;
      // }

      return ImportManager.getInstance().getImportUI(item['type']).ui;
    }

    return null;
  }

  /**
   * Launches the server specific URL help dialog.
   * @export
   */
  launchHelp() {
    launchAddServerUrlFormatHelpWindow(this['currentItem'], this['serverType']['helpText']);
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
    this['currentItem'] = this['serverType']['title'];
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

// some current known bugs:
// visual issue with loading uiswitch where "< >>" appears
// changing server types fails due to new scope

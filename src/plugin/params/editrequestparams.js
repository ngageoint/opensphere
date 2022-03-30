goog.declareModuleId('plugin.params.EditRequestParamsUI');

import {remove} from 'ol/src/array.js';

import '../../os/ui/slick/slickgrid.js';
import ColumnDefinition from '../../os/data/columndefinition.js';
import * as os from '../../os/os.js';
import Module from '../../os/ui/module.js';
import SlickGridEvent from '../../os/ui/slick/slickgridevent.js';
import * as osWindow from '../../os/ui/window.js';
import WindowEventType from '../../os/ui/windoweventtype.js';
import * as pluginParams from './params.js';

const Disposable = goog.require('goog.Disposable');
const googString = goog.require('goog.string');


/**
 * The editrequestparams directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,

  scope: {
    'layer': '=',
    'params': '='
  },

  templateUrl: os.ROOT + 'views/plugin/params/editrequestparams.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'editrequestparams';


/**
 * Add the directive to the module.
 */
Module.directive('editrequestparams', [directive]);



/**
 * Controller function for the editrequestparams directive
 * @unrestricted
 */
export class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Counter for unique row id's.
     * @type {number}
     * @private
     */
    this.nextId_ = 0;

    /**
     * Initial parameter keys provided to the UI.
     * @type {!Array<string>}
     */
    this['initialKeys'] = [];

    /**
     * If the layer supports multiple URLs.
     * @type {boolean}
     */
    this['multiUrl'] = false;

    /**
     * The parameter model for slickgrid.
     * @type {Array<!Object>}
     */
    this['params'] = null;

    /**
     * The selected parameter in the grid.
     * @type {Object}
     */
    this['selected'] = null;

    /**
     * The URL(s) for the layer.
     * @type {Array<string>}
     */
    this['urls'] = null;

    // initialize request URL(s)
    var layer = /** @type {ol.layer.Layer|undefined} */ ($scope['layer']);
    var urls = pluginParams.getUrlsForLayer(layer || null);
    if (typeof urls == 'string') {
      this['urls'] = [urls];
      this['multiUrl'] = false;
    } else if (urls) {
      this['urls'] = urls;
      this['multiUrl'] = true;
    }

    // initialize request parameters
    var initialParams = /** @type {Object|undefined} */ ($scope['params']);
    if (initialParams) {
      this['params'] = [];

      for (var key in initialParams) {
        this['initialKeys'].push(key);
        this['params'].push({
          'id': this.nextId_++,
          'field': key,
          'value': initialParams[key]
        });
      }
    }

    this['gridOptions'] = {
      'asyncEditorLoading': false,
      'autoEdit': true,
      'editable': true,
      'enableCellNavigation': true,
      'forceFitColumns': true,
      'fullWidthRows': true,
      'multiColumnSort': false,
      'multiSelect': false
    };

    var fieldCol = new ColumnDefinition('Field', 'field');
    fieldCol['editor'] = Slick.Editors.Text;

    var valueCol = new ColumnDefinition('Value', 'value');
    valueCol['editor'] = Slick.Editors.Text;

    this['gridColumns'] = [fieldCol, valueCol];

    $scope.$on('$destroy', this.dispose.bind(this));
    $scope.$emit(WindowEventType.READY);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope = null;
    this.element = null;
  }

  /**
   * Discard changes and close the window.
   *
   * @export
   */
  cancel() {
    this.close();
  }

  /**
   * Save the parameter changes and close the window.
   *
   * @export
   */
  confirm() {
    if (this.scope) {
      this.scope.$broadcast(SlickGridEvent.COMMIT_EDIT);
    }

    var layer = /** @type {ol.layer.Layer|undefined} */ (this.scope['layer']);
    if (layer) {
      if (this['params']) {
        var params = {};
        var toDelete = [];

        // map parameter data to an object
        this['params'].forEach(function(p) {
          var field = googString.makeSafe(p['field']);
          if (!googString.isEmptyOrWhitespace(field)) {
            params[field] = googString.makeSafe(p['value']);
          }
        });

        // check if any keys have been deleted from the initial values
        this['initialKeys'].forEach(function(key) {
          if (!(key in params)) {
            toDelete.push(key);
          }
        });

        pluginParams.setParamsForLayer(layer, params, toDelete);
      }

      if (this['urls']) {
        // skip empty URL's
        var urls = this['urls'].filter(function(url) {
          return !googString.isEmptyOrWhitespace(url);
        });

        if (urls.length > 0) {
          pluginParams.setUrlsForLayer(layer, urls);
        }
      }
    }

    this.close();
  }

  /**
   * Close the window.
   *
   * @protected
   */
  close() {
    osWindow.close(this.element);
  }

  /**
   * Add a new parameter row.
   *
   * @export
   */
  addRow() {
    if (this['params']) {
      this['params'] = this['params'].concat([{
        'id': this.nextId_++,
        'field': '',
        'value': ''
      }]);
    }
  }

  /**
   * Remove the selected parameter row.
   *
   * @export
   */
  removeRow() {
    if (this['selected'] && this['params']) {
      remove(this['params'], this['selected']);
      this['params'] = this['params'].slice();
    }
  }

  /**
   * Add a URL.
   *
   * @export
   */
  addUrl() {
    if (this['multiUrl'] && this['urls']) {
      this['urls'].push('');
    }
  }

  /**
   * Remove a URL.
   *
   * @param {number} index The URL index.
   * @export
   */
  removeUrl(index) {
    if (index != null && this['urls'] && this['urls'].length > index) {
      this['urls'].splice(index, 1);
    }
  }

  /**
   * Get the label to display for a URL control.
   *
   * @param {number} index The URL index.
   * @return {string} The URL control label.
   * @export
   */
  getUrlLabel(index) {
    if (this['multiUrl']) {
      return 'URL ' + (index + 1);
    }

    return 'URL';
  }

  /**
   * Test if the parameters are valid.
   *
   * @return {boolean} If all parameters are valid.
   * @export
   */
  testValid() {
    if (!this['urls'] || this['urls'].length == 0 || this['urls'].every(googString.isEmptyOrWhitespace)) {
      this['errorMsg'] = (this['multiUrl'] ? 'At least one ' : '') + 'URL must be defined.';
      return false;
    }

    if (this['params']) {
      for (var i = 0; i < this['params'].length; i++) {
        var p = this['params'][i];

        // if a value is defined but no field, mark as invalid
        if (!googString.isEmptyOrWhitespace(googString.makeSafe(p['value'])) &&
            googString.isEmptyOrWhitespace(googString.makeSafe(p['field']))) {
          this['errorMsg'] = 'Value defined without a Field.';
          return false;
        }
      }
    }

    this['errorMsg'] = '';
    return true;
  }
}

/**
 * Launches a layer params edit window.
 *
 * @param {!ol.layer.Layer} layer The layer.
 * @param {Object} params The current layer params.
 */
export const launchParamsEdit = function(layer, params) {
  var winLabel = 'Edit Parameters';
  var windowId = 'editParams';

  // create a new window
  var scopeOptions = {
    'layer': layer,
    'params': params
  };

  // don't constrain the max width/height since content varies widely per feature
  var windowOptions = {
    'id': windowId,
    'label': winLabel,
    'icon': 'fa fa-gears',
    'key': 'editparams',
    'x': 'center',
    'y': 'center',
    'width': 450,
    'min-width': 450,
    'max-width': 0,
    'height': 350,
    'min-height': 250,
    'show-close': true,
    'modal': true
  };

  var template = '<editrequestparams layer="layer" params="params"></editrequestparams>';
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

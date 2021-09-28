goog.declareModuleId('os.ui.query.AddFilterUI');

import BaseFilterManager from '../../filter/basefiltermanager.js';
import {getQueryManager} from '../../query/queryinstance.js';
import Menu from '../menu/menu.js';
import MenuItem from '../menu/menuitem.js';
import MenuItemType from '../menu/menuitemtype.js';
import Module from '../module.js';

const {insert} = goog.require('goog.array');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const {caseInsensitiveCompare} = goog.require('goog.string');

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');
const {default: IFilterable} = goog.requireType('os.filter.IFilterable');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * The combinator window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'layer': '=',
    'btnText': '@'
  },
  template: '<button class="btn btn-success btn-sm" title="Add a filter" ng-disabled="!addfilterctrl.canAdd()" ' +
      'ng-click="addfilterctrl.add()"><i class="fa fa-plus"></i> {{btnText}}</button>',
  controller: Controller,
  controllerAs: 'addfilterctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'addfilter';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for combinator window
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {Menu|undefined}
     * @protected
     */
    this.layerMenu = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: []
    }));

    /**
     * The list of layers
     * @type {Array}
     * @protected
     */
    this.layers = [];

    this.updateLayers();
    getQueryManager().listen(GoogEventType.PROPERTYCHANGE, this.updateLayers, false, this);
    $scope.$on('$destroy', this.onDestroy.bind(this));
  }

  /**
   * Clean up
   *
   * @protected
   */
  onDestroy() {
    getQueryManager().unlisten(GoogEventType.PROPERTYCHANGE, this.updateLayers, false, this);

    dispose(this.layerMenu);
    this.layerMenu = undefined;

    this.scope = null;
    this.element_ = null;
  }

  /**
   * Updates the list of layers in the combo box
   *
   * @protected
   */
  updateLayers() {
    if (!this.layerMenu) {
      return;
    }

    // drop existing menu items
    var menuRoot = this.layerMenu.getRoot();
    if (menuRoot.children) {
      menuRoot.children = undefined;
    }

    var qm = getQueryManager();
    var set = qm.getLayerSet();
    var layers = [];

    for (var key in set) {
      var filterable = /** @type {IFilterable} */ (BaseFilterManager.getInstance().getFilterable(key));

      try {
        if (filterable) {
          var cols = filterable.getFilterColumns();

          if (cols) {
            layers.push({
              'id': key,
              'label': set[key],
              'columns': cols,
              'source': /** @type {ILayer} */ (filterable).getProvider()
            });
          }
        }
      } catch (e) {
        // most likely, layer wasn't an IFilterable implementation
      }
    }

    if (this.scope['layer']) {
      if (this.scope['layer']['id']) {
        insert(layers, this.scope['layer']);
      }
    }

    layers.sort(Controller.sortLayers);

    for (var i = 0, n = layers.length; i < n; i++) {
      var id = layers[i]['id'];
      menuRoot.addChild({
        label: layers[i]['label'] + ' (' + layers[i]['source'] + ')',
        eventType: id,
        handler: this.addFilter.bind(this, id)
      });
    }

    this.layers = layers;
  }

  /**
   * Open the menu to pick the layer for the filter
   *
   * @export
   */
  add() {
    if (this.scope['layer'] && this.scope['layer']['id']) {
      this.addFilter(this.scope['layer']['id']);
    } else if (this.layerMenu && this.element_) {
      this.layerMenu.open(undefined, {
        my: 'left top',
        at: 'left bottom',
        of: this.element_
      });
    }
  }

  /**
   * Launch the editor for a filter
   *
   * @param {string} layerId
   * @protected
   */
  addFilter(layerId) {
    var layer = this.layers.find(function(layer) {
      return layer['id'] == layerId;
    });
    BaseFilterManager.edit(layerId, layer['columns'], this.onFilterReady_.bind(this));
  }

  /**
   * Handle filter ready
   *
   * @param {FilterEntry} entry
   * @private
   */
  onFilterReady_(entry) {
    if (entry) {
      this.scope.$emit('filterComplete', entry);
    }
  }

  /**
   * If a new filter can be added.
   *
   * @return {boolean}
   * @export
   */
  canAdd() {
    return !!this.layers && this.layers.length > 0;
  }

  /**
   * Sort layers
   *
   * @param {Object} a
   * @param {Object} b
   * @return {number} per compare functions
   */
  static sortLayers(a, b) {
    return caseInsensitiveCompare(a['label'], b['label']);
  }
}

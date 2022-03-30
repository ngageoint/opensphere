goog.declareModuleId('os.ui.node.DefaultLayerNodeUI');

import Layer from 'ol/src/layer/Layer.js';

import {instanceOf} from '../../classregistry.js';
import {DescriptorClass, NodeClass} from '../../data/data.js';
import DataManager from '../../data/datamanager.js';
import * as dispatcher from '../../dispatcher.js';
import LayerEvent from '../../events/layerevent.js';
import LayerEventType from '../../events/layereventtype.js';
import BaseFilterManager from '../../filter/basefiltermanager.js';
import IFilterable from '../../filter/ifilterable.js';
import osImplements from '../../implements.js';
import ILayer from '../../layer/ilayer.js';
import LayerClass from '../../layer/layerclass.js';
import {getQueryManager} from '../../query/queryinstance.js';
import Module from '../module.js';
import AbstractNodeUICtrl from '../slick/abstractnodeui.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: LayerNode} = goog.requireType('os.data.LayerNode');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * @type {string}
 */
export const template = `
  <span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">
    <span ng-if="nodeUi.canFavorite()">
      <favorite ng-show="nodeUi.show()" type="descriptor" key="{{nodeUi.descId}}" value="{{nodeUi.layerLabel}}">
      </favorite>
    </span>

    <span ng-if="nodeUi.filtersEnabled" ng-click="nodeUi.filter()">
      <i class="fa fa-filter fa-fw c-glyph" title="Manage filters"
          ng-class="{'text-success': nodeUi.filtered, 'c-glyph__off': !nodeUi.filtered}"></i>
    </span>

    <span ng-if="nodeUi.isRemovable()" ng-click="nodeUi.remove()">
      <i class="fa fa-times fa-fw c-glyph" title="Remove the layer"></i>
    </span>
  </span>
`;

/**
 * The selected/highlighted node UI directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template,
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'defaultlayernodeui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
export class Controller extends AbstractNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    var qm = getQueryManager();
    qm.listen(GoogEventType.PROPERTYCHANGE, this.updateFilters_, false, this);

    this.updateFilters_();
    this.updateFavorites_();
  }

  /**
   * @inheritDoc
   */
  destroy() {
    super.destroy();

    var qm = getQueryManager();
    qm.unlisten(GoogEventType.PROPERTYCHANGE, this.updateFilters_, false, this);
  }

  /**
   * Get the layer for this node.
   *
   * @return {ILayer}
   * @protected
   */
  getLayer() {
    if (this.scope && instanceOf(this.scope['item'], NodeClass.LAYER)) {
      return /** @type {LayerNode} */ (this.scope['item']).getLayer();
    }

    return null;
  }

  /**
   * Get the source for this node.
   *
   * @return {Source}
   * @protected
   */
  getSource() {
    var layer = this.getLayer();
    if (layer instanceof Layer) {
      return layer.getSource();
    }

    return null;
  }

  /**
   * If the layer is removable.
   *
   * @return {boolean}
   * @export
   */
  isRemovable() {
    var node = /** @type {LayerNode} */ (this.scope['item']);
    if (node && instanceOf(node, NodeClass.LAYER)) {
      var layer = node.getLayer();
      if (node && layer && osImplements(layer, ILayer.ID)) {
        return /** @type {!ILayer} */ (layer).isRemovable();
      }
    }

    return false;
  }

  /**
   * Remove the layer
   *
   * @export
   */
  remove() {
    // the node should be on the scope as 'item'
    var node = /** @type {LayerNode} */ (this.scope['item']);
    if (instanceOf(node.getLayer(), LayerClass.GROUP)) {
      // if the node being removed is a group, pick the first child and remove that instead. this should cause
      // all other children in the group to be removed because they're synchronized.
      var children = node.getChildren().slice();
      if (children && children.length > 0) {
        var i = children.length;
        while (i--) {
          this.removeNode_(children[i]);
        }
      }
    } else {
      this.removeNode_(node);
    }
  }

  /**
   * Fires an event to remove a layer node.
   *
   * @param {!ITreeNode} node The node to remove
   * @private
   */
  removeNode_(node) {
    var removeEvent = new LayerEvent(LayerEventType.REMOVE, node.getId());
    dispatcher.getInstance().dispatchEvent(removeEvent);
  }

  /**
   * If the layer is favoritable.
   *
   * @return {boolean}
   * @export
   */
  canFavorite() {
    var id = this.getLayerId();
    if (id) {
      var descriptor = DataManager.getInstance().getDescriptor(id);
      return instanceOf(descriptor, DescriptorClass.LAYER_SYNC);
    }

    return false;
  }

  /**
   * Launch the filter manager for the layer
   *
   * @export
   */
  filter() {
    var id = this.getLayerId();
    if (id) {
      var descriptor = DataManager.getInstance().getDescriptor(id);
      var layer = this.getLayer();
      var list = [descriptor, layer];

      for (var i = 0, n = list.length; i < n; i++) {
        var thing = list[i];
        if (osImplements(thing, IFilterable.ID) && thing.isFilterable()) {
          /** @type {IFilterable} */ (thing).launchFilterManager();
          break;
        }
      }
    }
  }

  /**
   * Update filters
   *
   * @param {PropertyChangeEvent=} opt_event
   * @private
   */
  updateFilters_(opt_event) {
    var node = /** @type {LayerNode} */ (this.scope['item']);

    var fqm = BaseFilterManager.getInstance();
    this['filtered'] = fqm.hasEnabledFilters(node.getId());

    if (this['filtered']) {
      this.cellEl.addClass('font-italic');
    } else {
      this.cellEl.removeClass('font-italic');
    }

    var layer = this.getLayer();
    if (osImplements(layer, IFilterable.ID)) {
      this['filtersEnabled'] = /** @type {IFilterable} */ (layer).isFilterable();
    } else {
      this['filtersEnabled'] = false;
    }
  }

  /**
   * Update favorite information on the node scope
   *
   * @protected
   */
  updateFavorites_() {
    var node = /** @type {LayerNode} */ (this.scope['item']);
    this['layerLabel'] = node.getLabel();
    var desc = DataManager.getInstance().getDescriptor(node.getId());
    if (desc) {
      this['descId'] = desc.getId();
    }
  }

  /**
   * Get the layer id
   *
   * @return {string}
   * @protected
   */
  getLayerId() {
    var node = /** @type {LayerNode} */ (this.scope['item']);
    return node.getId();
  }
}

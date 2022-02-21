goog.declareModuleId('plugin.file.kml.ui.KMLImageLayerUI');

import {isLayerNode} from '../../../../os/data/data.js';
import LayerGroup from '../../../../os/layer/layergroup.js';
import * as ImageLayerUI from '../../../../os/ui/layer/imagelayerui.js';
import Module from '../../../../os/ui/module.js';


/**
 * A spinner directive for a node that loads items
 *
 * @return {angular.Directive}
 */
const directive = () => {
  const original = ImageLayerUI.directive();
  original.controller = Controller;
  return original;
};


/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'kmlimagelayerui';


/**
 * Add the directive to the Angular module
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller for KML image layer UI
 * @unrestricted
 */
export class Controller extends ImageLayerUI.Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);
  }



  /**
   * Get the layer nodes from the list of UI items.
   *
   * @return {!Array<!LayerNode>}
   * @override
   * @protected
   */
  getLayerNodes() {
    var nodes = [];

    var items = this.scope['items'] || [];

    // replace each item with its corresponding layer node if it has one
    for (var i = 0; i < items.length; i++) {
      if (items[i].layerNode) {
        items[i] = items[i].layerNode;
      }
    }

    items = /** @type {!Array<!LayerNode>} */ (items.filter(isLayerNode));

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var layer = item.getLayer();
      if (layer instanceof LayerGroup) {
      // add the layer nodes under the group
        var children = item.getChildren();
        if (children) {
          nodes = nodes.concat(children);
        }
      } else {
      // not a group, add the node
        nodes.push(item);
      }
    }

    return nodes;
  }
}

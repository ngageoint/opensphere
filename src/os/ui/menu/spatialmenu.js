goog.declareModuleId('os.ui.menu.SpatialMenu');

import {instanceOf} from '../../classregistry.js';
import AreaNode from '../query/areanode.js';
import Menu from './menu.js';
const {NodeClass} = goog.require('os.data');
const RecordField = goog.require('os.data.RecordField');
const {getMapContainer} = goog.require('os.map.instance');

const DrawingFeatureNode = goog.requireType('os.data.DrawingFeatureNode');
const {default: MenuItem} = goog.requireType('os.ui.menu.MenuItem');


/**
 * Spatial menu.
 *
 * @extends {Menu<T>}
 * @template T
 */
export default class SpatialMenu extends Menu {
  /**
   * Constructor.
   * @param {!MenuItem<T>} root The menu item data
   */
  constructor(root) {
    super(root);
  }

  /**
   * @inheritDoc
   */
  open(context, position, opt_target) {
    if (Array.isArray(context)) {
      var container = getMapContainer();

      context = context.map(function(item) {
        var feature = null;
        if (item instanceof AreaNode) {
          feature = /** @type {AreaNode} */ (item).getArea();
        } else if (instanceOf(item, NodeClass.DRAW_FEATURE)) {
          feature = /** @type {DrawingFeatureNode} */ (item).getFeature();
        }

        if (feature) {
          return {
            feature: feature,
            geometry: feature.getGeometry(),
            layer: container.getLayer(/** @type {string} */ (feature.get(RecordField.SOURCE_ID))),
            map: container.getMap()
          };
        }

        return item;
      });

      if (!context.length) {
        context = undefined;
      } else if (context.length === 1) {
        context = context[0];
      }
    }

    // don't open the menu unless there is a context
    if (context) {
      super.open(context, position, opt_target);
    }
  }
}

goog.declareModuleId('os.ui.menu.common');

const LayerNode = goog.require('os.data.LayerNode');
const instanceOf = goog.require('os.instanceOf');
const VectorLayer = goog.require('os.layer.Vector');
const VectorSource = goog.require('os.source.Vector');


/**
 * Get vector source from an action event context.
 *
 * @param {*} context
 * @return {!Array<!VectorSource>}
 */
export const getSourcesFromContext = function(context) {
  var sources = [];
  if (context) {
    if (instanceOf(context, VectorSource.NAME)) {
      // single source passed as context (list tool)
      sources.push(context);
    } else if (Array.isArray(context)) {
      for (var i = 0, n = context.length; i < n; i++) {
        if (instanceOf(context[i], VectorSource.NAME)) {
          sources.push(context[i]);
        } else if (context[i] instanceof LayerNode) {
          // layers window
          var layerNode = /** @type {LayerNode} */ (context[i]);
          var layer = layerNode.getLayer();
          if (layer instanceof VectorLayer) {
            var source = layer.getSource();
            if (source) {
              sources.push(source);
            }
          }
        }
      }
    }
  }

  return sources;
};

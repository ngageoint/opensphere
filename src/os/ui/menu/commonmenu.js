goog.provide('os.ui.menu.common');


/**
 * Get vector source from an action event context.
 * @param {*} context
 * @return {!Array<!os.source.Vector>}
 */
os.ui.menu.common.getSourcesFromContext = function(context) {
  var sources = [];
  if (context) {
    if (os.instanceOf(context, os.source.Vector.NAME)) {
      // single source passed as context (list tool)
      sources.push(context);
    } else if (goog.isArray(context)) {
      for (var i = 0, n = context.length; i < n; i++) {
        if (os.instanceOf(context[i], os.source.Vector.NAME)) {
          sources.push(context[i]);
        } else if (context[i] instanceof os.data.LayerNode) {
          // layers window
          var layerNode = /** @type {os.data.LayerNode} */ (context[i]);
          var layer = layerNode.getLayer();
          if (layer instanceof os.layer.Vector) {
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

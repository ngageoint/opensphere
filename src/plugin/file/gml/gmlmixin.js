goog.provide('plugin.file.gml.GMLMixin');

goog.require('ol.format.GMLBase');


/**
 * The OL3 GML format does not correctly read srsName values from older WFS responses, so we've
 * overridden it here.
 *
 * @param {Node} node
 * @suppress {accessControls|duplicate}
 * @return {ol.proj.Projection}
 * @override
 */
ol.format.GMLBase.prototype.readProjectionFromNode = function(node) {
  var attr = 'srsName';
  return ol.proj.get(this.srsName ||
      goog.dom.getFirstElementChild(node).getAttribute(attr) ||
      node.querySelector('[' + attr + ']').getAttribute(attr));
};

goog.module('plugin.file.gml.GMLMixin');
goog.module.declareLegacyNamespace();

const dom = goog.require('goog.dom');

const GMLBase = goog.require('ol.format.GMLBase');

const olProj = goog.require('ol.proj');

const Projection = goog.requireType('ol.proj.Projection');


/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;


/**
 * Initialize the mixin.
 */
const init = () => {
  if (!initialized) {
    initialized = true;

    /**
     * The OL GML format does not correctly read srsName values from older WFS responses, so we've
     * overridden it here.
     *
     * @param {Node} node
     * @suppress {accessControls|duplicate}
     * @return {Projection}
     * @override
     */
    GMLBase.prototype.readProjectionFromNode = function(node) {
      var attr = 'srsName';
      return olProj.get(this.srsName ||
          dom.getFirstElementChild(node).getAttribute(attr) ||
          node.querySelector('[' + attr + ']').getAttribute(attr));
    };
  }
};

exports = {init};

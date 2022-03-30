goog.declareModuleId('plugin.file.gml.GMLMixin');

import GMLBase from 'ol/src/format/GMLBase.js';
import {get as getProjection} from 'ol/src/proj.js';

const {getFirstElementChild} = goog.require('goog.dom');


/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize the mixin.
 */
export const init = () => {
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
      return getProjection(this.srsName ||
          getFirstElementChild(node).getAttribute(attr) ||
          node.querySelector('[' + attr + ']').getAttribute(attr));
    };
  }
};

goog.declareModuleId('plugin.ogc.wfs.launchFilterManager');

import {launchForLayer} from '../../../os/ui/query/combinator.js';

/**
 * Launch the filter manager
 *
 * @param {!Vector} layer The layer
 */
const launchFilterManager = function(layer) {
  launchForLayer(layer.getId());
};

export default launchFilterManager;

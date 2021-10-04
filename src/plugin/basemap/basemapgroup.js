goog.declareModuleId('plugin.basemap.Group');

import LayerGroup from '../../os/layer/group.js';
import {LAYER_TYPE, isBaseMap} from './basemap.js';

/**
 * Basemap layer group.
 */
export default class Group extends LayerGroup {
  /**
   * Constructor.
   * @param {olx.layer.GroupOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);

    this.setPriority(-1000);
    this.setCheckFunc(isBaseMap);
    this.setOSType(LAYER_TYPE);
  }
}

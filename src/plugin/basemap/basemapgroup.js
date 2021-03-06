goog.module('plugin.basemap.Group');
goog.module.declareLegacyNamespace();

const LayerGroup = goog.require('os.layer.Group');
const basemap = goog.require('plugin.basemap');


/**
 * Basemap layer group.
 */
class Group extends LayerGroup {
  /**
   * Constructor.
   * @param {olx.layer.GroupOptions=} opt_options
   */
  constructor(opt_options) {
    super(opt_options);

    this.setPriority(-1000);
    this.setCheckFunc(basemap.isBaseMap);
    this.setOSType(basemap.LAYER_TYPE);
  }
}

exports = Group;

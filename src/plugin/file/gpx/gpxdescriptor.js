goog.declareModuleId('plugin.file.gpx.GPXDescriptor');

import FileDescriptor from '../../../os/data/filedescriptor.js';
import LayerType from '../../../os/layer/layertype.js';


/**
 * GPX file descriptor.
 */
export default class GPXDescriptor extends FileDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.descriptorType = 'gpx';
  }

  /**
   * @inheritDoc
   */
  getType() {
    return LayerType.FEATURES;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = super.getLayerOptions();
    options['type'] = 'GPX';
    return options;
  }
}

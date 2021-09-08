goog.module('plugin.file.gpx.GPXDescriptor');

const FileDescriptor = goog.require('os.data.FileDescriptor');
const LayerType = goog.require('os.layer.LayerType');


/**
 * GPX file descriptor.
 */
class GPXDescriptor extends FileDescriptor {
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

exports = GPXDescriptor;

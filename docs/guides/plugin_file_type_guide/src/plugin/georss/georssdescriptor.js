goog.declareModuleId('plugin.georss.GeoRSSDescriptor');

import FileDescriptor from 'opensphere/src/os/data/filedescriptor.js';
import LayerType from 'opensphere/src/os/layer/layertype.js';
import ColorControlType from 'opensphere/src/os/ui/colorcontroltype.js';
import ControlType from 'opensphere/src/os/ui/controltype.js';

import {ID} from './georss.js';
import GeoRSSProvider from './georssprovider.js';

const {default: FileParserConfig} = goog.requireType('os.parse.FileParserConfig');


/**
 * GeoRSS file descriptor.
 */
export default class GeoRSSDescriptor extends FileDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.descriptorType = ID;
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
    options['type'] = ID;

    // allow resetting the layer color to the default
    options[ControlType.COLOR] = ColorControlType.PICKER_RESET;
    return options;
  }
}

/**
 * Creates a new descriptor from a parser configuration.
 * @param {!FileParserConfig} config
 * @return {!GeoRSSDescriptor}
 */
export const createFromConfig = (config) => {
  const provider = GeoRSSProvider.getInstance();
  const descriptor = new GeoRSSDescriptor();
  FileDescriptor.createFromConfig(descriptor, provider, config);
  return descriptor;
};

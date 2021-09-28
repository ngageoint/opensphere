goog.declareModuleId('plugin.file.kml.KMLDescriptor');

import FileDescriptor from '../../../os/data/filedescriptor.js';
import * as layer from '../../../os/layer/layer.js';
import LayerType from '../../../os/layer/layertype.js';
import ColorControlType from '../../../os/ui/colorcontroltype.js';
import ControlType from '../../../os/ui/controltype.js';
import KMLExporter from './kmlexporter.js';


/**
 * KML file descriptor.
 */
export default class KMLDescriptor extends FileDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.descriptorType = 'kml';
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
    options['type'] = 'KML';

    // allow resetting the layer color to the default
    options[ControlType.COLOR] = ColorControlType.PICKER_RESET;

    // show the option to replace feature colors with the layer color
    options[layer.LayerOption.SHOW_FORCE_COLOR] = true;

    return options;
  }

  /**
   * @inheritDoc
   */
  getExporter() {
    return new KMLExporter();
  }
}

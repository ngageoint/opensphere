goog.declareModuleId('plugin.file.kml.KMLDescriptor');

import KMLExporter from './kmlexporter.js';

const FileDescriptor = goog.require('os.data.FileDescriptor');
const layer = goog.require('os.layer');
const LayerType = goog.require('os.layer.LayerType');
const ColorControlType = goog.require('os.ui.ColorControlType');
const ControlType = goog.require('os.ui.ControlType');

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

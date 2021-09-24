goog.declareModuleId('plugin.file.gml.GMLDescriptor');

const FileDescriptor = goog.require('os.data.FileDescriptor');
const layer = goog.require('os.layer');
const LayerType = goog.require('os.layer.LayerType');
const GMLParserConfig = goog.require('plugin.file.gml.GMLParserConfig');


/**
 * GML file descriptor.
 */
export default class GMLDescriptor extends FileDescriptor {
  /**
   * Constructor.
   * @param {GMLParserConfig=} opt_config
   */
  constructor(opt_config) {
    super();
    this.descriptorType = 'gml';
    this.parserConfig = opt_config || new GMLParserConfig();
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
    options['type'] = 'GML';

    // show the option to replace feature colors with the layer color
    options[layer.LayerOption.SHOW_FORCE_COLOR] = true;
    return options;
  }
}

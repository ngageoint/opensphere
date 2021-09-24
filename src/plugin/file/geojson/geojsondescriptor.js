goog.declareModuleId('plugin.file.geojson.GeoJSONDescriptor');

const FileDescriptor = goog.require('os.data.FileDescriptor');
const LayerType = goog.require('os.layer.LayerType');
const GeoJSONExporter = goog.require('plugin.file.geojson.GeoJSONExporter');
const GeoJSONParserConfig = goog.require('plugin.file.geojson.GeoJSONParserConfig');


/**
 * GeoJSON file descriptor.
 */
export default class GeoJSONDescriptor extends FileDescriptor {
  /**
   * Constructor.
   * @param {GeoJSONParserConfig=} opt_config
   */
  constructor(opt_config) {
    super();
    this.descriptorType = 'geojson';
    this.parserConfig = opt_config || new GeoJSONParserConfig();
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
    options['type'] = 'GeoJSON';
    return options;
  }

  /**
   * @inheritDoc
   */
  getExporter() {
    return new GeoJSONExporter();
  }
}

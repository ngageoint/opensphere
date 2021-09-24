goog.declareModuleId('plugin.file.geojson.GeoJSONDescriptor');

import GeoJSONParserConfig from '../geojsonparserconfig.js';
import GeoJSONExporter from './geojsonexporter.js';

const FileDescriptor = goog.require('os.data.FileDescriptor');
const LayerType = goog.require('os.layer.LayerType');


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

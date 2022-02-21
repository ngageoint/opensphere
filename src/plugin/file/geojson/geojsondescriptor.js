goog.declareModuleId('plugin.file.geojson.GeoJSONDescriptor');

import FileDescriptor from '../../../os/data/filedescriptor.js';
import LayerType from '../../../os/layer/layertype.js';
import GeoJSONParserConfig from '../geojsonparserconfig.js';
import GeoJSONExporter from './geojsonexporter.js';


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

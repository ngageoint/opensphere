goog.declareModuleId('plugin.file.geojson.GeoJSONProvider');

const FileProvider = goog.require('os.data.FileProvider');


/**
 * GeoJSON file provider
 */
export default class GeoJSONProvider extends FileProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setId('geojson');
    this.setLabel('GeoJSON Files');
  }
}

goog.addSingletonGetter(GeoJSONProvider);

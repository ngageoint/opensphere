goog.module('plugin.file.geojson.GeoJSONProvider');
goog.module.declareLegacyNamespace();

const FileProvider = goog.require('os.data.FileProvider');


/**
 * GeoJSON file provider
 */
class GeoJSONProvider extends FileProvider {
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


exports = GeoJSONProvider;

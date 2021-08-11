goog.module('os.source.IImportSource');
goog.module.declareLegacyNamespace();

const Feature = goog.requireType('ol.Feature');
const IImporter = goog.requireType('os.im.IImporter');


/**
 * Interface for sources that load data with a {@link os.im.Importer}.
 *
 * @interface
 */
class IImportSource {
  /**
   * Get the importer.
   * @return {IImporter<Feature>} The importer.
   */
  getImporter() {}

  /**
   * Set the importer.
   * @param {IImporter<Feature>} importer The importer.
   */
  setImporter(importer) {}
}

/**
 * ID for {@link os.implements}.
 * @const {string}
 */
IImportSource.ID = 'os.source.IImportSource';

exports = IImportSource;

goog.declareModuleId('os.source.IImportSource');

const {default: IImporter} = goog.requireType('os.im.IImporter');


/**
 * Interface for sources that load data with a {@link os.im.Importer}.
 *
 * @interface
 */
export default class IImportSource {
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

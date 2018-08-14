goog.provide('os.source.IImportSource');


/**
 * Interface for sources that load data with a {@link os.im.Importer}.
 * @interface
 */
os.source.IImportSource = function() {};


/**
 * ID for {@link os.implements}.
 * @const {string}
 */
os.source.IImportSource.ID = 'os.source.IImportSource';


/**
 * Get the importer.
 * @return {os.im.IImporter<ol.Feature>} The importer.
 */
os.source.IImportSource.prototype.getImporter;


/**
 * Set the importer.
 * @param {os.im.IImporter<ol.Feature>} importer The importer.
 */
os.source.IImportSource.prototype.setImporter;

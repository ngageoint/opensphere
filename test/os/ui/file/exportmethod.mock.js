goog.module('os.ui.file.MockExportMethod');
goog.module.declareLegacyNamespace();

const AbstractExporter = goog.require('os.ex.AbstractExporter');

/**
 * Mock export method for unit testing.
 */
class MockExportMethod extends AbstractExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.cancelled = false;
    this.processed = false;
  }

  /**
   * The file extension for this export type.
   * @return {string}
   */
  getExtension() {
    return MockExportMethod.EXT;
  }

  /**
   * The human readable label/title to display for this export type (e.g. 'CSV').
   * @return {string}
   */
  getLabel() {
    return MockExportMethod.LABEL;
  }

  /**
   * The human readable label/title to display for this export type (e.g. 'CSV').
   * @return {string}
   */
  getMimeType() {
    return MockExportMethod.MIMETYPE;
  }

  /**
   * Begins the export process.
   */
  process() {
    this.processed = true;
    this.output = this.items.join(' ');
  }

  /**
   * Cancel the export process.
   */
  cancel() {
    this.cancelled = true;
  }

  /**
   * Resets the exporter to its default state.
   */
  reset() {
    super.reset();
    this.cancelled = false;
    this.processed = false;
  }
}

/**
 * @type {string}
 * @const
 */
MockExportMethod.EXT = 'mex';

/**
 * @type {string}
 * @const
 */
MockExportMethod.LABEL = 'Mock Exporter';

/**
 * @type {string}
 * @const
 */
MockExportMethod.MIMETYPE = 'text/mock';

exports = MockExportMethod;

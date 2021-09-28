goog.declareModuleId('os.ui.file.csv.AbstractCSVExporter');

import AbstractExporter from '../../../ex/abstractexporter.js';

const log = goog.require('goog.log');


/**
 * A CSV exporter driven by PapaParse.
 *
 * @abstract
 * @extends {AbstractExporter<T>}
 * @template T
 */
export default class AbstractCSVExporter extends AbstractExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * Data to pass to PapaParse's unparse function
     * @type {Array<Object<string, string>>}
     * @protected
     */
    this.papaItems = [];
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();
    this.papaItems.length = 0;
  }

  /**
   * @inheritDoc
   */
  getExtension() {
    return 'csv';
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'CSV';
  }

  /**
   * @inheritDoc
   */
  getMimeType() {
    return 'text/csv';
  }

  /**
   * @inheritDoc
   */
  process() {
    for (var i = 0, n = this.items.length; i < n; i++) {
      var papaItem = this.processItem(this.items[i]);
      if (papaItem) {
        this.papaItems.push(papaItem);
      }
    }

    if (this.papaItems.length > 0) {
      // prepend the UTF byte order mark so that excel will properly parse it
      this.output = '\ufeff';
      this.output += Papa.unparse(this.papaItems, {
        newline: '\n'
      });
    }
  }

  /**
   * Process a single item, returning a JSON object for PapaParse.
   *
   * @abstract
   * @param {T} item The item
   * @return {Object<string, string>} The Papa item
   * @protected
   * @template T
   */
  processItem(item) {}

  /**
   * @inheritDoc
   */
  cancel() {}
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.ui.file.csv.AbstractCSVExporter');

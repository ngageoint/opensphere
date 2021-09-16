goog.module('os.ex.AbstractExporter');

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const Logger = goog.requireType('goog.log.Logger');

const IExportMethod = goog.requireType('os.ex.IExportMethod');


/**
 * Base class for exporting content
 *
 * @abstract
 * @implements {IExportMethod}
 * @template T
 */
class AbstractExporter extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The fields to export
     * @type {Array<string>}
     * @protected
     */
    this.fields = null;

    /**
     * The items to export
     * @type {Array<T>}
     * @protected
     */
    this.items = null;

    /**
     * The logger
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * The exporter name
     * @type {?string}
     */
    this.name = null;

    /**
     * The output of the exporter
     * @type {Object|null|string}
     */
    this.output = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.reset();
  }

  /**
   * @inheritDoc
   */
  isAsync() {
    return false;
  }

  /**
   * @inheritDoc
   */
  supportsMultiple() {
    return false;
  }

  /**
   * @inheritDoc
   */
  supportsTime() {
    return false;
  }

  /**
   * @inheritDoc
   */
  supportsProgress() {
    return false;
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.fields = null;
    this.items = null;
    this.output = null;
  }

  /**
   * @inheritDoc
   */
  setFields(fields) {
    this.fields = fields;
  }

  /**
   * @inheritDoc
   */
  getItems() {
    return this.items;
  }

  /**
   * @inheritDoc
   */
  setItems(items) {
    this.items = items;
  }

  /**
   * @inheritDoc
   */
  getMimeType() {
    return 'text/plain';
  }

  /**
   * @inheritDoc
   */
  getName() {
    return this.name;
  }

  /**
   * @inheritDoc
   */
  setName(name) {
    this.name = name;
  }

  /**
   * @inheritDoc
   */
  process() {}

  /**
   * @inheritDoc
   */
  cancel() {}

  /**
   * @inheritDoc
   */
  getOutput() {
    return this.output;
  }

  /**
   * @inheritDoc
   */
  getUI() {
    return null;
  }

  /**
   * @inheritDoc
   */
  supportsLabelExport() {
    return false;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.ex.AbstractExporter');

exports = AbstractExporter;

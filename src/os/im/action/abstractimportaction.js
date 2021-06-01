goog.module('os.im.action.AbstractImportAction');
goog.module.declareLegacyNamespace();

const osXml = goog.require('os.xml');

const IImportAction = goog.requireType('os.im.action.IImportAction');


/**
 * Abstract import action.
 *
 * @abstract
 * @implements {IImportAction<T>}
 * @template T
 */
class AbstractImportAction {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * The import action identifier.
     * @type {string}
     * @protected
     */
    this.id = '';

    /**
     * Unique identifier for this action.
     * @type {number}
     * @protected
     */
    this.uid = goog.getUid(this);

    /**
     * The label or title for the import action.
     * @type {string}
     * @protected
     */
    this.label = '';

    /**
     * The directive name for the import action configuration UI.
     * @type {string}
     * @protected
     */
    this.configUI = '';

    /**
     * If the action should be restricted to one use per entry.
     * @type {boolean}
     * @protected
     */
    this.unique = true;

    /**
     * The type attribute value for the root XML node.
     * @type {!string}
     */
    this.xmlType = AbstractImportAction.XML_TYPE;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  execute() {}

  /**
   * @inheritDoc
   * @export
   */
  getId() {
    return this.id;
  }

  /**
   * @inheritDoc
   * @export
   */
  getLabel() {
    return this.label;
  }

  /**
   * @inheritDoc
   * @export
   */
  getConfigUI() {
    return this.configUI;
  }

  /**
   * @inheritDoc
   * @export
   */
  isUnique() {
    return this.unique;
  }

  /**
   * @inheritDoc
   */
  clone() {
    var other = new this.constructor();
    other.restore(this.persist());
    return other;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = opt_to || {};

    // save the id so the correct class can be created when restoring
    opt_to['id'] = this.id;

    return opt_to;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  restore(config) {}

  /**
   * @inheritDoc
   */
  toXml() {
    return osXml.createElement(this.xmlType);
  }

  /**
   * @abstract
   * @inheritDoc
   */
  fromXml(xml) {}

  /**
   * @abstract
   * @inheritDoc
   */
  reset(items) {}
}


/**
 * XML element name for the action.
 * @type {string}
 * @const
 */
AbstractImportAction.XML_TYPE = 'AbstractImportAction';


exports = AbstractImportAction;

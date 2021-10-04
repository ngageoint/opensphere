goog.declareModuleId('os.IXmlPersistable');

/**
 * An interface for XML persistable/restorable objects.
 *
 * @interface
 */
export default class IXmlPersistable {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * The type attribute value for the root XML node.
     * @type {!string}
     */
    this.xmlType;
  }

  /**
   * Persist the object to an XML document.
   * @return {!Element}
   */
  toXml() {}

  /**
   * Restore the object from an XML element.
   * @param {!Element} xml The element from which to restore.
   */
  fromXml(xml) {}
}

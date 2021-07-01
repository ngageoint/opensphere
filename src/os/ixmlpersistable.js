goog.module('os.IXmlPersistable');
goog.module.declareLegacyNamespace();

/**
 * An interface for XML persistable/restorable objects.
 *
 * @interface
 */
class IXmlPersistable {
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

exports = IXmlPersistable;

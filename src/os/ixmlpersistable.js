goog.provide('os.IXmlPersistable');



/**
 * An interface for XML persistable/restorable objects.
 * @interface
 */
os.IXmlPersistable = function() {};


/**
 * The type attribute value for the root XML node.
 * @type {!string}
 */
os.IXmlPersistable.prototype.xmlType;


/**
 * Persist the object to an XML document.
 * @return {!Element}
 */
os.IXmlPersistable.prototype.toXml;


/**
 * Restore the object from an XML element.
 * @param {!Element} xml The element from which to restore.
 */
os.IXmlPersistable.prototype.fromXml;

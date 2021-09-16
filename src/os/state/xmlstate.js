goog.module('os.state.XMLState');

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');
const Tag = goog.require('os.state.Tag');
const AbstractState = goog.require('os.state.AbstractState');
const {createElement} = goog.require('os.xml');

const XMLStateOptions = goog.requireType('os.state.XMLStateOptions');


/**
 * Base class for XML states.
 *
 * @abstract
 * @extends {AbstractState<!Element, XMLStateOptions>}
 */
class XMLState extends AbstractState {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.rootName = 'xml';
  }

  /**
   * @inheritDoc
   */
  createRoot(options) {
    return createElement(this.rootName, options.doc, undefined, this.rootAttrs);
  }

  /**
   * @inheritDoc
   */
  getSource(obj) {
    if (obj) {
      var p = obj.parentElement || obj;
      while (p.parentElement) {
        p = p.parentElement;
      }

      return p.getAttribute(Tag.SOURCE);
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  saveComplete(options, rootObj) {
    // save was successful, so add the state to the document
    if (rootObj) {
      getFirstElementChild(options.doc).appendChild(rootObj);
    }

    super.saveComplete(options, rootObj);
  }

  /**
   * @param {!Element|string} elOrString
   * @return {!Element}
   */
  static ensureXML(elOrString) {
    if (typeof elOrString === 'string') {
      var doc = loadXml(elOrString);
      var child = getFirstElementChild(doc);
      if (child) {
        return child;
      }
    }

    return /** @type {!Element} */ (elOrString);
  }
}

exports = XMLState;

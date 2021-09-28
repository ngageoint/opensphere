goog.declareModuleId('os.state.XMLState');

import {createElement} from '../xml.js';
import AbstractState from './abstractstate.js';
import Tag from './tag.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');

const {default: XMLStateOptions} = goog.requireType('os.state.XMLStateOptions');


/**
 * Base class for XML states.
 *
 * @abstract
 * @extends {AbstractState<!Element, XMLStateOptions>}
 */
export default class XMLState extends AbstractState {
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

goog.declareModuleId('os.ogc.filter.OGCFilterCleaner');

import AbstractModifier from '../../net/abstractmodifier.js';
import {serialize} from '../../xml.js';

const {getFirstElementChild} = goog.require('goog.dom');
const {loadXml} = goog.require('goog.dom.xml');

const {default: IModifier} = goog.requireType('os.net.IModifier');


/**
 * Cleans OGC filter XML before sending the request
 *
 * @implements {IModifier}
 */
export default class OGCFilterCleaner extends AbstractModifier {
  /**
   * Constructor.
   */
  constructor() {
    super('FilterCleanerModifier', -100);
  }

  /**
   * @inheritDoc
   */
  modify(uri) {
    var param = 'filter';
    var qd = uri.getQueryData();
    var old = qd.get(param);

    if (old) {
      qd.set(param, OGCFilterCleaner.cleanFilter(/** @type {string} */ (old)));
    }
  }

  /**
   * Cleans an OGC filter
   *
   * @param {?string} filterStr
   * @return {?string} The cleaned filter string
   */
  static cleanFilter(filterStr) {
    if (!filterStr) {
      return filterStr;
    }

    try {
      var doc = loadXml(filterStr);
      if (doc) {
        var child = getFirstElementChild(doc);
        OGCFilterCleaner.pruneSingleGroups(child);
        return serialize(doc);
      }
    } catch (e) {
    }

    return filterStr;
  }

  /**
   * Prunes single groups from an OGC filter
   *
   * @param {Node} node
   * @protected
   */
  static pruneSingleGroups(node) {
    var child = getFirstElementChild(node);
    var next = null;

    while (child) {
      next = child.nextSibling;
      OGCFilterCleaner.pruneSingleGroups(child);
      child = next;
    }

    var name = node.localName;
    if (name == 'And' || name == 'Or' || name == 'Not') {
      if (!getFirstElementChild(node)) {
        // useless empty branch, so just drop it
        node.parentNode.removeChild(node);
      } else if (name != 'Not' && (!node.childNodes || node.childNodes.length < 2)) {
        var p = node.parentNode;
        p.removeChild(node);
        p.appendChild(getFirstElementChild(node));
      }
    }
  }
}

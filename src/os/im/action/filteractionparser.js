goog.declareModuleId('os.im.action.FilterActionParser');

import * as text from '../../file/mime/text.js';
import {getImportActionManager} from './importaction.js';
import TagName from './tagname.js';

const dom = goog.require('goog.dom');
const xml = goog.require('goog.dom.xml');

const {default: FilterActionEntry} = goog.requireType('os.im.action.FilterActionEntry');
const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * Parses filter action entries from an XML document.
 *
 * @implements {IParser}
 */
export default class FilterActionParser {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?Document}
     * @private
     */
    this.document_ = null;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    if (source instanceof ArrayBuffer) {
      source = text.getText(source) || null;
    }

    if (source instanceof Document) {
      this.document_ = /** @type {!Document} */ (source);
    } else if (typeof source == 'string') {
      this.document_ = xml.loadXml(source);
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.document_ = null;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return !!this.document_;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    if (this.document_) {
      var entries = FilterActionParser.parseDocument(this.document_);
      this.document_ = null;

      return entries;
    }

    return null;
  }

  /**
   * Extracts filter actions from an array of XML nodes.
   *
   * @param {!IArrayLike<Node>} nodes The XML nodes to extract an entry from.
   * @return {!Array<!FilterActionEntry>}
   */
  static parseNodes(nodes) {
    var iam = getImportActionManager();
    var entries = [];
    var parentMap = {};

    goog.array.forEach(nodes, function(node) {
      var actions = [];
      var filter = null;

      var id = /** @type {string} */ (node.getAttribute('id')) || goog.string.getRandomString();
      var title = /** @type {string} */ (node.getAttribute('title')) || '';
      var description = /** @type {?string} */ (node.getAttribute('description')) || '';
      var tags = /** @type {?string} */ (node.getAttribute('tags')) || '';
      var children = /** @type {?string} */ (node.getAttribute('children')) || '';
      var childrenArray = children ? children.split(', ') : [];
      var type = /** @type {string} */ (node.getAttribute('type')) || '';

      var filterNode = node.querySelector('filter');
      if (filterNode) {
        var filterRoot = dom.getFirstElementChild(filterNode);
        filter = xml.serialize(filterRoot);
        filter = filter.replace(/xmlns=("|')[^"']*("|')/g, '');
        filter = filter.replace(/ogc:/g, '');
        filter = filter.replace(/>\s+</g, '><');
      }

      var actionsNode = node.querySelector(TagName.ACTIONS);
      if (actionsNode && actionsNode.childNodes.length) {
        var actionEls = dom.getChildren(actionsNode);

        goog.array.forEach(actionEls, function(el) {
          var action = iam.createActionFromXml(el);
          if (action) {
            actions.push(action);
          }
        });
      }

      var entry = iam.createActionEntry();
      entry.setId(id);
      entry.setTitle(title);
      entry.setType(type);
      entry.setDescription(description);
      entry.setTags(tags);
      entry.setFilter(filter);
      entry.setEnabled(true);
      entry.actions = actions;

      var parents = parentMap[id];
      if (parents) {
        // add it as a child to its parent
        parents.forEach(function(parent) {
          parent.addChild(entry);
        });

        delete parentMap[id];
      } else {
        // add it as a root entry
        entries.push(entry);
      }

      if (childrenArray.length > 0) {
        childrenArray.forEach(function(childId) {
          if (parentMap[childId]) {
            parentMap[childId].push(entry);
          } else {
            parentMap[childId] = [entry];
          }
        });
      }
    });

    return entries;
  }

  /**
   * Extracts filter action entries from an XML document.
   *
   * @param {!Document} doc The XML document to extract entries from.
   * @return {!Array<!FilterActionEntry>}
   */
  static parseDocument(doc) {
    var iam = getImportActionManager();
    var root = dom.getFirstElementChild(doc);
    var actionNodes = root.querySelectorAll(iam.xmlEntry);
    var entries = FilterActionParser.parseNodes(actionNodes);

    return entries;
  }
}

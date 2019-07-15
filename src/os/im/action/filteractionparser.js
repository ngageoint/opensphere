goog.provide('os.im.action.FilterActionParser');

goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('os.file.mime.text');
goog.require('os.im.action');
goog.require('os.im.action.TagName');
goog.require('os.im.action.filter');
goog.require('os.parse.IParser');
goog.require('os.ui.filter');



/**
 * Parses filter action entries from an XML document.
 *
 * @implements {os.parse.IParser}
 * @constructor
 */
os.im.action.FilterActionParser = function() {
  /**
   * @type {?Document}
   * @private
   */
  this.document_ = null;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionParser.prototype.setSource = function(source) {
  if (source instanceof ArrayBuffer) {
    source = os.file.mime.text.getText(source) || null;
  }

  if (source instanceof Document) {
    this.document_ = /** @type {!Document} */ (source);
  } else if (typeof source == 'string') {
    this.document_ = goog.dom.xml.loadXml(source);
  }
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionParser.prototype.cleanup = function() {
  this.document_ = null;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionParser.prototype.hasNext = function() {
  return !!this.document_;
};


/**
 * @inheritDoc
 */
os.im.action.FilterActionParser.prototype.parseNext = function() {
  if (this.document_) {
    var entries = os.im.action.FilterActionParser.parseDocument(this.document_);
    this.document_ = null;

    return entries;
  }

  return null;
};


/**
 * Extracts filter actions from an array of XML nodes.
 *
 * @param {!IArrayLike<Node>} nodes The XML nodes to extract an entry from.
 * @return {!Array<!os.im.action.FilterActionEntry>}
 */
os.im.action.FilterActionParser.parseNodes = function(nodes) {
  var iam = os.im.action.ImportActionManager.getInstance();
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
      var filterRoot = goog.dom.getFirstElementChild(filterNode);
      filter = goog.dom.xml.serialize(filterRoot);
      filter = filter.replace(/xmlns=("|')[^"']*("|')/g, '');
      filter = filter.replace(/ogc:/g, '');
      filter = filter.replace(/>\s+</g, '><');
    }

    var actionsNode = node.querySelector(os.im.action.TagName.ACTIONS);
    if (actionsNode && actionsNode.childNodes.length) {
      var actionEls = goog.dom.getChildren(actionsNode);

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
};


/**
 * Extracts filter action entries from an XML document.
 *
 * @param {!Document} doc The XML document to extract entries from.
 * @return {!Array<!os.im.action.FilterActionEntry>}
 */
os.im.action.FilterActionParser.parseDocument = function(doc) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var root = goog.dom.getFirstElementChild(doc);
  var actionNodes = root.querySelectorAll(iam.xmlEntry);
  var entries = os.im.action.FilterActionParser.parseNodes(actionNodes);

  return entries;
};

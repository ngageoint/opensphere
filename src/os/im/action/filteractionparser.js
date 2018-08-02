goog.provide('os.im.action.FilterActionParser');

goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('os.im.action');
goog.require('os.im.action.TagName');
goog.require('os.im.action.filter');
goog.require('os.parse.IParser');
goog.require('os.ui.filter');



/**
 * Parses filter action entries from an XML document.
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
 * Extracts filter action entries from an XML document.
 * @param {!Document} doc The XML document to extract entries from.
 * @return {!Array<!os.im.action.FilterActionEntry>}
 */
os.im.action.FilterActionParser.parseDocument = function(doc) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var entries = [];

  var root = goog.dom.getFirstElementChild(doc);
  var actionNodes = root.querySelectorAll(iam.xmlEntry);
  if (actionNodes && actionNodes.length > 0) {
    for (var i = 0; i < actionNodes.length; i++) {
      var nodeEntries = os.im.action.FilterActionParser.parseNode(actionNodes[i]);
      if (nodeEntries && nodeEntries.length > 0) {
        entries = entries.concat(nodeEntries);
      }
    }
  }

  return entries;
};


/**
 * Extract a filter action entry from an XML node.
 * @param {!Node} node The XML node to extract an entry from.
 * @return {!Array<!os.im.action.FilterActionEntry>}
 */
os.im.action.FilterActionParser.parseNode = function(node) {
  var iam = os.im.action.ImportActionManager.getInstance();
  var actions = [];
  var entries = [];
  var filter = null;

  var title = /** @type {string} */ (node.getAttribute('title')) || '';
  var description = /** @type {?string} */ (node.getAttribute('description')) || '';

  var type = /** @type {string} */ (node.getAttribute('type')) || '';
  var typeHint = /** @type {string|undefined} */ (node.getAttribute('typeHint'));

  var types;
  if (typeHint == os.im.action.filter.ExportTypeHint.EXACT) {
    types = [type];
  } else {
    types = os.ui.filter.getFilterableTypes(type);
  }

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

    for (var i = 0; i < actionEls.length; i++) {
      var action = iam.createActionFromXml(actionEls[i]);
      if (action) {
        actions.push(action);
      }
    }
  }

  if (filter && types.length > 0) {
    var entry = iam.createActionEntry();
    entry.setTitle(title);
    entry.setType(types[0]);
    entry.setDescription(description);
    entry.setFilter(filter);
    entry.setEnabled(true);
    entry.actions = actions;
    entries.push(entry);

    for (var i = 1; i < types.length; i++) {
      var clone = entry.clone();
      clone.setId(goog.string.getRandomString());
      clone.setType(types[i]);
      entries.push(clone);
    }
  }

  return entries;
};

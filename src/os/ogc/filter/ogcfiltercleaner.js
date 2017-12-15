goog.provide('os.ogc.filter.OGCFilterCleaner');
goog.require('goog.dom.xml');
goog.require('os.net.AbstractModifier');
goog.require('os.net.IModifier');
goog.require('os.xml');



/**
 * Cleans OGC filter XML before sending the request
 * @implements {os.net.IModifier}
 * @extends {os.net.AbstractModifier}
 * @constructor
 */
os.ogc.filter.OGCFilterCleaner = function() {
  os.ogc.filter.OGCFilterCleaner.base(this, 'constructor', 'FilterCleanerModifier', -100);
};
goog.inherits(os.ogc.filter.OGCFilterCleaner, os.net.AbstractModifier);


/**
 * @inheritDoc
 */
os.ogc.filter.OGCFilterCleaner.prototype.modify = function(uri) {
  var param = 'filter';
  var qd = uri.getQueryData();
  var old = qd.get(param);

  if (old) {
    qd.set(param, os.ogc.filter.OGCFilterCleaner.cleanFilter(/** @type {string} */ (old)));
  }
};


/**
 * Cleans an OGC filter
 * @param {?string} filterStr
 * @return {?string} The cleaned filter string
 */
os.ogc.filter.OGCFilterCleaner.cleanFilter = function(filterStr) {
  if (!filterStr) {
    return filterStr;
  }

  try {
    var doc = goog.dom.xml.loadXml(filterStr);
    if (doc) {
      var child = goog.dom.getFirstElementChild(doc);
      os.ogc.filter.OGCFilterCleaner.pruneSingleGroups(child);
      return os.xml.serialize(doc);
    }
  } catch (e) {
  }

  return filterStr;
};


/**
 * Prunes single groups from an OGC filter
 * @param {Node} node
 * @protected
 */
os.ogc.filter.OGCFilterCleaner.pruneSingleGroups = function(node) {
  var child = goog.dom.getFirstElementChild(node);
  var next = null;

  while (child) {
    next = child.nextSibling;
    os.ogc.filter.OGCFilterCleaner.pruneSingleGroups(child);
    child = next;
  }

  var name = node.localName;
  if (name == 'And' || name == 'Or' || name == 'Not') {
    if (!goog.dom.getFirstElementChild(node)) {
      // useless empty branch, so just drop it
      node.parentNode.removeChild(node);
    } else if (name != 'Not' && (!node.childNodes || node.childNodes.length < 2)) {
      var p = node.parentNode;
      p.removeChild(node);
      p.appendChild(goog.dom.getFirstElementChild(node));
    }
  }
};


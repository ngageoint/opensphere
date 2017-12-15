goog.provide('os.ui.query.BasicQueryReader');
goog.require('goog.asserts');
goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter');
goog.require('os.ui.query.AbstractQueryReader');



/**
 * Reader for queries written out by the pre-combinator filter/area handlers.
 * @extends {os.ui.query.AbstractQueryReader}
 * @constructor
 */
os.ui.query.BasicQueryReader = function() {
  os.ui.query.BasicQueryReader.base(this, 'constructor');

  /**
   * Array of all inclusion entries found when the query is parsed.
   * @type {?Array}
   * @private
   */
  this.entries_ = null;

  /**
   * Array of all exclusion entries found when the query is parsed. These never have filters associated to them.
   * @type {?Array}
   * @private
   */
  this.excEntries_ = null;
};
goog.inherits(os.ui.query.BasicQueryReader, os.ui.query.AbstractQueryReader);


/**
 * @inheritDoc
 */
os.ui.query.BasicQueryReader.prototype.parseEntries = function() {
  goog.asserts.assert(this.filter, 'No filter provided!');

  this.entries_ = [];
  this.excEntries_ = [];

  this.parseEntries_(this.filter);
  if (this.entries_.length > 0) {
    os.ui.queryManager.addEntries(this.entries_.concat(this.excEntries_));
  }
};


/**
 * Traverses the tree to parse entries from a combinator-written filter.
 * @param {Element} ele
 * @private
 */
os.ui.query.BasicQueryReader.prototype.parseEntries_ = function(ele) {
  goog.asserts.assert(this.layerId, 'No layer ID provided!');
  var layerId = /** @type {!string} */ (this.layerId);
  var child = goog.dom.getFirstElementChild(ele);
  var children = goog.dom.getChildren(ele);
  var next = null;

  // if the element has a namehint or a description, it's a filter entry
  var isFilter = Boolean(ele.getAttribute('namehint') || ele.getAttribute('description'));

  if (!isFilter) {
    // if any of the children match any of the ops, then ele is a filter entry
    isFilter = goog.array.some(children, function(item) {
      return goog.array.some(os.ui.filter.OPERATIONS, function(op) {
        return op.matches(angular.element(item));
      });
    });
  }

  // test to see if its an area
  if (ele.localName == 'BBOX' || ele.localName == 'Intersects') {
    var areaEle = ele.querySelector('MultiPolygon') || ele.querySelector('Envelope') || ele.querySelector('Polygon');
    goog.asserts.assertElement(areaEle, 'Area is not an Element!');
    var area = os.ui.query.AbstractQueryReader.parseArea(areaEle);
    if (area) {
      var title = os.xml.unescape(ele.getAttribute('areanamehint') || ele.getAttribute('namehint') || 'New Area');
      area.set('title', title);
      area.set('description', os.xml.unescape(ele.getAttribute('description')));
      area.set('shown', true);
      area.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE);
      os.ui.areaManager.add(area);

      var entry = {
        'layerId': layerId,
        'areaId': area.getId(),
        'filterId': '*',
        'includeArea': true,
        'filterGroup': true,
        'temp': true
      };
      this.entries_.push(entry);
    }
    child = null;
  }
  if (ele.localName == 'Disjoint') {
    var excAreaEle = ele.querySelector('MultiPolygon') || ele.querySelector('Envelope') || ele.querySelector('Polygon');
    goog.asserts.assertElement(excAreaEle, 'Exclusion area is not an Element!');
    var excArea = os.ui.query.AbstractQueryReader.parseArea(excAreaEle);
    if (excArea) {
      var title = os.xml.unescape(ele.getAttribute('areanamehint') || ele.getAttribute('namehint') || 'New Area');
      excArea.set('title', title);
      excArea.set('description', os.xml.unescape(ele.getAttribute('description')));
      excArea.set('shown', true);
      excArea.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE);
      os.ui.areaManager.add(excArea);

      var entry = {
        'layerId': layerId,
        'areaId': excArea.getId(),
        'filterId': '*',
        'includeArea': false,
        'filterGroup': true,
        'temp': true
      };
      this.excEntries_.push(entry);
    }
    child = null;
  }

  while (child) {
    if (isFilter) {
      // if it doesn't contain a PropertyName element as a child, or is a validTime property, exclude it
      var propNameEle = ele.querySelector('PropertyName');
      if (propNameEle && propNameEle.textContent != 'validTime') {
        var filterText = goog.dom.xml.serialize(ele);
        var name = os.xml.unescape(ele.getAttribute('namehint') || child.getAttribute('namehint') || 'New Filter');
        var description = os.xml.unescape(ele.getAttribute('description') || '');
        var filterEntry = new os.filter.FilterEntry();
        var grouping = String(goog.dom.getParentElement(ele).localName) == 'And';

        filterEntry.setFilter(filterText);
        filterEntry.setTitle(name);
        filterEntry.setDescription(description);
        filterEntry.setEnabled(true);
        filterEntry.type = layerId;
        filterEntry.setTemporary(true);

        var fm = os.ui.filter.FilterManager.getInstance();
        fm.addFilter(filterEntry);
        fm.setGrouping(filterEntry.type, grouping);

        var entry = {
          'layerId': layerId,
          'areaId': '*',
          'filterId': filterEntry.getId(),
          'includeArea': true,
          'filterGroup': grouping,
          'temp': true
        };
        this.entries_.push(entry);
        child = null;
        continue;
      }
    }

    next = goog.dom.getNextElementSibling(child);
    this.parseEntries_(child);
    child = next;
  }
};

goog.provide('os.state.v2.QueryEntries');
goog.provide('os.state.v2.QueryEntriesTag');

goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.state.XMLState');
goog.require('os.xml');


/**
 * XML tags for filter state
 * @enum {string}
 */
os.state.v2.QueryEntriesTag = {
  QUERY_ENTRIES: 'queryEntries',
  QUERY_ENTRY: 'queryEntry'
};



/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v2.QueryEntries = function() {
  os.state.v2.QueryEntries.base(this, 'constructor');

  this.description = 'Saves the query combinations';
  this.priority = 90;
  this.rootName = os.state.v2.QueryEntriesTag.QUERY_ENTRIES;
  this.title = 'Query Entries';
};
goog.inherits(os.state.v2.QueryEntries, os.state.XMLState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v2.QueryEntries.LOGGER_ = goog.log.getLogger('os.state.v2.QueryEntries');


/**
 * Query entry arrays by state type
 * @type {Object<string, !Array<Object<string, string|boolean>>>}
 * @private
 */
os.state.v2.QueryEntries.ADDED_ = {};


/**
 * @inheritDoc
 */
os.state.v2.QueryEntries.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v2.QueryEntries.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    var children = goog.dom.getChildren(obj);
    var qm = os.ui.queryManager;

    if (children) {
      var toAdd = [];
      for (var i = 0, n = children.length; i < n; i++) {
        var child = children[i];

        var layerId = child.getAttribute('layerId');
        var areaId = child.getAttribute('areaId');
        var filterId = child.getAttribute('filterId') || '*';

        // HACK: negate elements should not have been seralized.
        var negate = child.getAttribute('negate');
        if (negate && negate === 'true') {
          // If the negate attribute is present, it means this entry is effectively disabled.
          continue;
        }

        var includeArea = child.getAttribute('includeArea');
        includeArea = includeArea ? includeArea.toLowerCase() === 'true' : true;

        var filterCheck = /(and|true)/i;

        var filterGroup = child.getAttribute('filterGroup');
        filterGroup = filterGroup ? filterCheck.test(filterGroup) : true;

        if (layerId && areaId && filterId && goog.isDef(includeArea) && goog.isDef(filterGroup)) {
          toAdd.push({
            'layerId': layerId !== '*' ? os.state.AbstractState.createId(id, layerId) : layerId,
            'areaId': areaId !== '*' ? os.state.AbstractState.createId(id, areaId) : areaId,
            'filterId': filterId !== '*' ? os.state.AbstractState.createId(id, filterId) : filterId,
            'includeArea': includeArea,
            'filterGroup': filterGroup,
            'temp': true
          });
        }
      }

      if (toAdd.length) {
        qm.addEntries(toAdd);
        os.state.v2.QueryEntries.ADDED_[id] = toAdd;
      }
    }
  } catch (e) {
    // sad panda :(
    goog.log.error(os.state.v2.QueryEntries.LOGGER_, 'There was an error loading a query entry in ' + id, e);
  }
};


/**
 * @inheritDoc
 */
os.state.v2.QueryEntries.prototype.remove = function(id) {
  var toRemove = os.state.v2.QueryEntries.ADDED_[id];

  if (toRemove) {
    os.ui.queryManager.removeEntriesArr(toRemove);
    delete os.state.v2.QueryEntries.ADDED_[id];
  }
};


/**
 * @inheritDoc
 */
os.state.v2.QueryEntries.prototype.saveInternal = function(options, rootObj) {
  try {
    var qm = os.ui.queryManager;

    // We want the expanded entries because the state file should be more explicit and not
    // rely on other clients being able to perform that expansion.
    var entries = qm.getActiveEntries(true);

    if (entries) {
      for (var i = 0, n = entries.length; i < n; i++) {
        var attrs = goog.object.clone(entries[i]);

        // I don't think the layer case is possible, but one should code defensively. Anything that
        // ends up with no areas after expansion won't query anyway, so there's no reason to stick
        // it in.
        if (attrs['layerId'] == '*') {
          // skip it
          continue;
        }

        // If the negate flag is present, this effectively means that this entry has been disabled, skipping.
        // TODO: The negate items probably should not be in the query manager.
        if (attrs.hasOwnProperty('negate')) {
          if (attrs['negate'] === 'true' || attrs['negate'] === true) {
            continue;
          }
          // Otherise assume false
          delete attrs['negate'];
        }

        // If a filter wildcard exists after expansion, it means that there were no filters for that
        // layer/area combination.
        if (attrs['filterId'] == '*') {
          delete attrs['filterId'];
        }

        os.xml.appendElement(os.state.v2.QueryEntriesTag.QUERY_ENTRY, rootObj, undefined, attrs);
      }
    }

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};

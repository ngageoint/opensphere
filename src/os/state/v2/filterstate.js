goog.provide('os.state.v2.Filter');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.data.OSDataManager');
goog.require('os.query.FilterManager');
goog.require('os.state.v2.BaseFilter');



/**
 * @extends {os.state.v2.BaseFilter}
 * @constructor
 */
os.state.v2.Filter = function() {
  os.state.v2.Filter.base(this, 'constructor');
};
goog.inherits(os.state.v2.Filter, os.state.v2.BaseFilter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v2.Filter.LOGGER_ = goog.log.getLogger('os.state.v2.Filter');


/**
 * Query areas added by this state type
 * @type {Object.<string, !Array.<!os.filter.FilterEntry>>}
 * @private
 */
os.state.v2.Filter.ADDED_ = {};


/**
 * @inheritDoc
 */
os.state.v2.Filter.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v2.Filter.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    var children = goog.dom.getChildren(obj);
    var qm = os.ui.queryManager;

    // here we check for the parent element/node
    var p = obj.parentNode;
    // and then the existence of the <queryEntries> tag
    var queryEntries = p ? p.querySelector('queryEntries') : null;

    if (children && children.length > 0) {
      for (var i = 0, n = children.length; i < n; i++) {
        var child = children[i];
        var layerId = this.getLayerId(child, id);
        var entry = this.xmlToFilter(child);
        var group = String(child.getAttribute('match')) == 'AND';

        if (entry) {
          entry.setId(os.state.AbstractState.createId(id, entry.getId()));
          entry.type = layerId;
          entry.setTemporary(true);
          entry.setEnabled(true);

          os.query.FilterManager.getInstance().addFilter(entry);
          os.query.FilterManager.getInstance().setGrouping(layerId, group);

          if (!queryEntries) {
            qm.addEntry(layerId, '*', entry.getId(), true, group, true);
          }

          if (!(id in os.state.v2.Filter.ADDED_)) {
            os.state.v2.Filter.ADDED_[id] = [];
          }

          os.state.v2.Filter.ADDED_[id].push(entry);
        }
      }
    }
  } catch (e) {
    // sad panda :(
    goog.log.error(os.state.v2.Filter.LOGGER_, 'There was an error loading a filter for state file ' + id);
  }
};


/**
 * @inheritDoc
 */
os.state.v2.Filter.prototype.remove = function(id) {
  var qm = os.ui.queryManager;

  if (id in os.state.v2.Filter.ADDED_) {
    var added = os.state.v2.Filter.ADDED_[id];
    for (var i = 0, n = added.length; i < n; i++) {
      qm.removeEntries(null, null, added[i].getId());
      os.query.FilterManager.getInstance().removeFilter(added[i]);
    }

    delete os.state.v2.Filter.ADDED_[id];
  }
};


/**
 * @inheritDoc
 */
os.state.v2.Filter.prototype.saveInternal = function(options, rootObj) {
  this.setSources(os.osDataManager.getSources());
  os.state.v2.Filter.base(this, 'saveInternal', options, rootObj);
};

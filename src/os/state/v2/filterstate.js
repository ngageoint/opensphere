goog.module('os.state.v2.Filter');
goog.module.declareLegacyNamespace();

const {getChildren} = goog.require('goog.dom');
const log = goog.require('goog.log');
const DataManager = goog.require('os.data.DataManager');
const {getFilterManager, getQueryManager} = goog.require('os.query.instance');
const AbstractState = goog.require('os.state.AbstractState');
const XMLState = goog.require('os.state.XMLState');
const BaseFilter = goog.require('os.state.v2.BaseFilter');

const Logger = goog.requireType('goog.log.Logger');
const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 */
class Filter extends BaseFilter {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  load(obj, id, opt_title) {
    obj = XMLState.ensureXML(obj);

    if (!(obj instanceof Element)) {
      log.error(logger, 'Unable to load state content!');
      return;
    }

    try {
      var children = getChildren(obj);
      var qm = getQueryManager();

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
            entry.setId(AbstractState.createId(id, entry.getId()));
            entry.type = layerId;
            entry.setTemporary(true);
            entry.setEnabled(true);
            if (opt_title) {
              entry.setSource(opt_title);
            }

            getFilterManager().addFilter(entry);
            getFilterManager().setGrouping(layerId, group);

            if (!queryEntries) {
              qm.addEntry(layerId, '*', entry.getId(), true, group, true);
            }

            if (!(id in addedEntries)) {
              addedEntries[id] = [];
            }

            addedEntries[id].push(entry);
          }
        }
      }
    } catch (e) {
      // sad panda :(
      log.error(logger, 'There was an error loading a filter for state file ' + id);
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    var qm = getQueryManager();

    if (id in addedEntries) {
      var added = addedEntries[id];
      for (var i = 0, n = added.length; i < n; i++) {
        qm.removeEntries(null, null, added[i].getId());
        getFilterManager().removeFilter(added[i]);
      }

      delete addedEntries[id];
    }
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    this.setSources(DataManager.getInstance().getSources());
    super.saveInternal(options, rootObj);
  }

  /**
   * Get the filter entries added by this state type.
   * @return {Object<string, !Array<!FilterEntry>>}
   */
  static getAddedEntries() {
    return addedEntries;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v2.Filter');

/**
 * Filter entries added by this state type
 * @type {Object<string, !Array<!FilterEntry>>}
 */
const addedEntries = {};

exports = Filter;

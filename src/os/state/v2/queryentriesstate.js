goog.module('os.state.v2.QueryEntries');

const {getChildren} = goog.require('goog.dom');
const log = goog.require('goog.log');
const {getQueryManager} = goog.require('os.query.instance');
const AbstractState = goog.require('os.state.AbstractState');
const XMLState = goog.require('os.state.XMLState');
const QueryEntriesTag = goog.require('os.state.v2.QueryEntriesTag');
const {appendElement} = goog.require('os.xml');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
class QueryEntries extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.description = 'Saves the query combinations';
    this.priority = 90;
    this.rootName = QueryEntriesTag.QUERY_ENTRIES;
    this.title = 'Query Entries';
  }

  /**
   * @inheritDoc
   */
  load(obj, id) {
    obj = XMLState.ensureXML(obj);

    if (!(obj instanceof Element)) {
      log.error(logger, 'Unable to load state content!');
      return;
    }

    try {
      var children = getChildren(obj);
      var qm = getQueryManager();

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

          if (layerId && areaId && filterId && includeArea !== undefined && filterGroup !== undefined) {
            toAdd.push({
              'layerId': layerId !== '*' ? AbstractState.createId(id, layerId) : layerId,
              'areaId': areaId !== '*' ? AbstractState.createId(id, areaId) : areaId,
              'filterId': filterId !== '*' ? AbstractState.createId(id, filterId) : filterId,
              'includeArea': includeArea,
              'filterGroup': filterGroup,
              'temp': true
            });
          }
        }

        if (toAdd.length) {
          qm.addEntries(toAdd);
          addedEntries[id] = toAdd;
        }
      }
    } catch (e) {
      // sad panda :(
      log.error(logger, 'There was an error loading a query entry in ' + id, e);
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    var toRemove = addedEntries[id];

    if (toRemove) {
      getQueryManager().removeEntriesArr(toRemove);
      delete addedEntries[id];
    }
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var qm = getQueryManager();

      // We want the expanded entries because the state file should be more explicit and not
      // rely on other clients being able to perform that expansion.
      var entries = qm.getActiveEntries(true);

      if (entries) {
        for (var i = 0, n = entries.length; i < n; i++) {
          var attrs = Object.assign({}, entries[i]);

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

          appendElement(QueryEntriesTag.QUERY_ENTRY, rootObj, undefined, attrs);
        }
      }

      this.saveComplete(options, rootObj);
    } catch (e) {
      this.saveFailed(e.message || 'Unspecified error.');
    }
  }

  /**
   * Get the query entries added by this state type.
   * @return {Object<string, !Array<Object<string, string|boolean>>>}
   */
  static getAddedEntries() {
    return addedEntries;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v2.QueryEntries');

/**
 * Query entry arrays by state type
 * @type {Object<string, !Array<Object<string, string|boolean>>>}
 */
const addedEntries = {};

exports = QueryEntries;

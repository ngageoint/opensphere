goog.module('os.state.v4.FilterAction');

const {getChildren} = goog.require('goog.dom');
const log = goog.require('goog.log');
const DataManager = goog.require('os.data.DataManager');
const {testFilterActionEnabled} = goog.require('os.im.action');
const FilterActionParser = goog.require('os.im.action.FilterActionParser');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const {exportEntries} = goog.require('os.im.action.filter');
const AbstractState = goog.require('os.state.AbstractState');
const XMLState = goog.require('os.state.XMLState');
const {XMLNS} = goog.require('os.xml');

const Logger = goog.requireType('goog.log.Logger');
const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


/**
 * State implementation to save filter actions.
 */
class FilterAction extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();

    var iam = ImportActionManager.getInstance();
    var actionTitle = iam.entryTitle + 's';

    this.description = 'Saves the current ' + actionTitle;
    this.priority = 90;
    this.rootName = iam.xmlGroup;
    this.title = actionTitle;
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
      var iam = ImportActionManager.getInstance();
      var children = getChildren(obj);
      if (children && children.length > 0) {
        var entries = FilterActionParser.parseNodes(children);
        for (var i = 0, n = entries.length; i < n; i++) {
          var e = entries[i];

          /**
           * Sets the proper state IDs on an entry and its children.
           *
           * @param {FilterActionEntry} entry The entry to set IDs on.
           */
          var setIds = function(entry) {
            entry.setId(AbstractState.createId(id, entry.getId()));
            entry.setType(AbstractState.createId(id, entry.getType()));
            entry.setTemporary(true);
            entry.setEnabled(true);

            if (entry.getChildren()) {
              // set up the children
              entry.getChildren().forEach(setIds);
            }
          };

          // this will set up the proper ID's and types on the full hierarchy
          setIds(e);

          // only add the root level feature actions, adding the children will result in doubling
          iam.addActionEntry(e);

          if (!(id in addedEntries)) {
            addedEntries[id] = [];
          }

          addedEntries[id].push(e);
        }
      }
    } catch (e) {
      log.error(logger,
          'There was an error loading a filter action for state file ' + id, e);
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    if (id in addedEntries) {
      var iam = ImportActionManager.getInstance();
      var added = addedEntries[id];
      for (var i = 0, n = added.length; i < n; i++) {
        iam.removeActionEntry(added[i]);
      }

      delete addedEntries[id];
    }
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var iam = ImportActionManager.getInstance();

      // save enabled entries for active sources
      var sources = DataManager.getInstance().getSources();
      var entries = [];
      for (var i = 0, n = sources.length; i < n; i++) {
        var sourceEntries = iam.getActionEntries(sources[i].getId());
        entries = entries.concat(sourceEntries.filter(testFilterActionEnabled));
      }

      // use the exact type from the entries, so they only match a single layer on import
      var entryEls = exportEntries(entries, true);
      if (entryEls) {
        for (var i = 0; i < entryEls.length; i++) {
          rootObj.appendChild(entryEls[i]);
        }
      }

      // add the entries to the document
      rootObj.setAttributeNS(XMLNS, 'xmlns:ogc', FilterAction.OGC_NS);

      this.saveComplete(options, rootObj);
    } catch (e) {
      this.saveFailed(e.message || 'Unspecified error.');
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v4.FilterAction');

/**
 * Filter action entries added by this state type.
 * @type {Object<string, !Array<!FilterActionEntry>>}
 */
const addedEntries = {};

/**
 * OGC namespace URI
 * @type {string}
 * @const
 */
FilterAction.OGC_NS = 'http://www.opengis.net/ogc';

exports = FilterAction;

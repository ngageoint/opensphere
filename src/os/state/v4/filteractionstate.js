goog.provide('os.state.v4.FilterAction');

goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.data.OSDataManager');
goog.require('os.im.action.FilterActionEntry');
goog.require('os.im.action.filter');
goog.require('os.state.AbstractState');
goog.require('os.state.XMLState');
goog.require('os.xml');



/**
 * State implementation to save filter actions.
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v4.FilterAction = function() {
  os.state.v4.FilterAction.base(this, 'constructor');

  var iam = os.im.action.ImportActionManager.getInstance();
  var actionTitle = iam.entryTitle + 's';

  this.description = 'Saves the current ' + actionTitle;
  this.priority = 90;
  this.rootName = iam.xmlGroup;
  this.title = actionTitle;
};
goog.inherits(os.state.v4.FilterAction, os.state.XMLState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v4.FilterAction.LOGGER_ = goog.log.getLogger('os.state.v4.FilterAction');


/**
 * Filter action entries added by this state type.
 * @type {Object<string, !Array<!os.im.action.FilterActionEntry>>}
 * @private
 */
os.state.v4.FilterAction.ADDED_ = {};


/**
 * OGC namespace URI
 * @type {string}
 * @const
 */
os.state.v4.FilterAction.OGC_NS = 'http://www.opengis.net/ogc';


/**
 * @inheritDoc
 */
os.state.v4.FilterAction.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v4.FilterAction.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    var iam = os.im.action.ImportActionManager.getInstance();
    var children = goog.dom.getChildren(obj);
    if (children && children.length > 0) {
      var entries = os.im.action.FilterActionParser.parseNodes(children);
      for (var i = 0, n = entries.length; i < n; i++) {
        var e = entries[i];

        /**
         * Sets the proper state IDs on an entry and its children.
         * @param {os.im.action.FilterActionEntry} entry The entry to set IDs on.
         */
        var setIds = function(entry) {
          entry.setId(os.state.AbstractState.createId(id, entry.getId()));
          entry.setType(os.state.AbstractState.createId(id, entry.getType()));
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

        if (!(id in os.state.v4.FilterAction.ADDED_)) {
          os.state.v4.FilterAction.ADDED_[id] = [];
        }

        os.state.v4.FilterAction.ADDED_[id].push(e);
      }
    }
  } catch (e) {
    goog.log.error(os.state.v4.FilterAction.LOGGER_,
        'There was an error loading a filter action for state file ' + id, e);
  }
};


/**
 * @inheritDoc
 */
os.state.v4.FilterAction.prototype.remove = function(id) {
  if (id in os.state.v4.FilterAction.ADDED_) {
    var iam = os.im.action.ImportActionManager.getInstance();
    var added = os.state.v4.FilterAction.ADDED_[id];
    for (var i = 0, n = added.length; i < n; i++) {
      iam.removeActionEntry(added[i]);
    }

    delete os.state.v4.FilterAction.ADDED_[id];
  }
};


/**
 * @inheritDoc
 */
os.state.v4.FilterAction.prototype.saveInternal = function(options, rootObj) {
  try {
    var iam = os.im.action.ImportActionManager.getInstance();

    // save enabled entries for active sources
    var sources = os.data.OSDataManager.getInstance().getSources();
    var entries = [];
    for (var i = 0, n = sources.length; i < n; i++) {
      var sourceEntries = iam.getActionEntries(sources[i].getId());
      entries = entries.concat(sourceEntries.filter(os.im.action.testFilterActionEnabled));
    }

    // use the exact type from the entries, so they only match a single layer on import
    var entryEls = os.im.action.filter.exportEntries(entries, true);
    if (entryEls) {
      for (var i = 0; i < entryEls.length; i++) {
        rootObj.appendChild(entryEls[i]);
      }
    }

    // add the entries to the document
    rootObj.setAttributeNS(os.xml.XMLNS, 'xmlns:ogc', os.state.v4.FilterAction.OGC_NS);

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};

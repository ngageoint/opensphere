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
      for (var i = 0, n = children.length; i < n; i++) {
        var child = children[i];
        var nodeEntries = os.im.action.FilterActionParser.parseNode(child);

        // filter actions should be saved so they only apply to a single layer. if multiple entries are created, there
        // is something wrong.
        if (nodeEntries && nodeEntries.length == 1) {
          var entry = nodeEntries[0];
          entry.setId(os.state.AbstractState.createId(id, entry.getId()));
          entry.setType(this.getLayerId(child, id));
          entry.setTemporary(true);
          entry.setEnabled(true);

          iam.addActionEntry(entry);

          if (!(id in os.state.v4.FilterAction.ADDED_)) {
            os.state.v4.FilterAction.ADDED_[id] = [];
          }

          os.state.v4.FilterAction.ADDED_[id].push(entry);
        } else {
          goog.log.error(os.state.v4.FilterAction.LOGGER_,
              'There was an error loading a filter action for state file ' + id +
              '. Multiple entries were parsed from a single node.');
        }
      }
    }
  } catch (e) {
    goog.log.error(os.state.v4.FilterAction.LOGGER_,
        'There was an error loading a filter action for state file ' + id, e);
  }
};


/**
 * Get the layer id for the filter.
 * @param {!Element} el The element
 * @param {string} stateId The state id
 * @return {string} The layer id
 * @protected
 */
os.state.v4.FilterAction.prototype.getLayerId = function(el, stateId) {
  var id = String(el.getAttribute('type'));
  return os.state.AbstractState.createId(stateId, id);
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

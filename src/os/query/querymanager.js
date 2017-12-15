goog.provide('os.query.QueryManager');

goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string');
goog.require('os.data.event.DataEventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.ui.query.QueryManager');



/**
 * @constructor
 * @extends {os.ui.query.QueryManager}
 */
os.query.QueryManager = function() {
  var dm = os.dataManager;
  dm.listen(os.data.event.DataEventType.SOURCE_REMOVED, this.onDataSourceRemoved_, false, this);

  os.query.QueryManager.base(this, 'constructor');
};
goog.inherits(os.query.QueryManager, os.ui.query.QueryManager);
goog.addSingletonGetter(os.query.QueryManager);

// replace the os.ui QueryManager's getInstance with this one so we never instantiate a second instance
goog.object.extend(os.ui.query.QueryManager, {
  getInstance: function() {
    return os.query.QueryManager.getInstance();
  }
});


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.query.QueryManager.LOGGER_ = goog.log.getLogger('os.query.QueryManager');


/**
 * @param {os.data.event.DataEvent} event
 * @private
 */
os.query.QueryManager.prototype.onDataSourceRemoved_ = function(event) {
  if (event.source) {
    var id = event.source.getId();

    var i = this.handlers.length;
    while (i--) {
      var handler = this.handlers[i];
      if (handler.getLayerId() === id) {
        var removed = this.handlers.splice(i, 1);
        if (removed) {
          removed.forEach(function(h) {
            goog.dispose(h);
          });
        }
      }
    }

    goog.log.info(os.query.QueryManager.LOGGER_, 'Removed all query handlers for ' + id);
  }
};


/**
 * @inheritDoc
 */
os.query.QueryManager.prototype.load = function() {
  this.entries = /** @type {Array<!Object<string, string|boolean>>} */ (
      os.settings.get(['query', 'entries'], []));
  this.entries = this.entries || [];

  var am = os.ui.areaManager;
  var fqm = os.ui.filterManager;

  // remove entries referencing areas or filters that don't exist
  this.entries = this.entries.filter(function(item) {
    var areaId = /** @type {string} */ (item['areaId']);
    var filterId = /** @type {string} */ (item['filterId']);

    if (areaId && areaId !== '*' && !am.get(areaId)) {
      return false;
    }

    if (filterId && filterId !== '*' && !fqm.getFilter(filterId)) {
      return false;
    }

    return true;
  });

  this.updateTimer.start();
};


/**
 * @inheritDoc
 */
os.query.QueryManager.prototype.save = function() {
  var toSave = this.entries.filter(
      /**
       * @param {Object<string, string|boolean>} entry
       * @param {number} i
       * @param {Array} arr
       * @return {boolean}
       */
      function(entry, i, arr) {
        return !entry['temp'];
      });

  os.settings.set(['query', 'entries'], toSave);
};

goog.provide('os.data.BaseDescriptor');

goog.require('goog.async.nextTick');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.DescriptorEvent');
goog.require('os.data.IDataDescriptor');
goog.require('os.data.ISearchable');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.implements');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');



/**
 * The base implementation of a data descriptor
 * @extends {goog.events.EventTarget}
 * @implements {os.data.IDataDescriptor}
 * @implements {os.data.ISearchable}
 * @constructor
 */
os.data.BaseDescriptor = function() {
  os.data.BaseDescriptor.base(this, 'constructor');

  /**
   * @type {!string}
   * @private
   */
  this.id_ = '';

  /**
   * @type {?string}
   * @private
   */
  this.provider_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.providerType_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.title_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.explicitTitle_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.type_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.color_ = null;

  /**
   * @type {?Array<os.data.ColumnDefinition>}
   * @private
   */
  this.columns_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.desc_ = null;

  /**
   * @type {number}
   * @private
   */
  this.maxDate_ = NaN;

  /**
   * @type {number}
   * @private
   */
  this.minDate_ = NaN;

  /**
   * @type {number}
   * @private
   */
  this.deleteTime_ = NaN;

  /**
   * @type {number}
   * @private
   */
  this.lastActive_ = NaN;

  /**
   * @type {boolean}
   * @private
   */
  this.active_ = false;

  /**
   * @type {boolean|undefined}
   * @protected
   */
  this.tempActive = false;

  /**
   * @type {boolean}
   * @private
   */
  this.loading_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.local_ = false;

  /**
   * @type {?Array<!string>}
   * @protected
   */
  this.tags = null;

  /**
   * @type {!string}
   * @protected
   */
  this.descriptorType = 'base';

  /**
   * @type {os.data.IDataProvider}
   * @protected
   */
  this.dataProvider = null;

  /**
   * The logger
   * @type {goog.log.Logger}
   */
  this.log = os.data.BaseDescriptor.LOGGER_;
};
goog.inherits(os.data.BaseDescriptor, goog.events.EventTarget);
os.implements(os.data.BaseDescriptor, os.data.IDataDescriptor.ID);


/**
 * The delimiter for descriptor and layer IDs
 * @type {string}
 * @const
 */
os.data.BaseDescriptor.ID_DELIMITER = '#';


/**
 * Logger for os.data.BaseDescriptor
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.data.BaseDescriptor.LOGGER_ = goog.log.getLogger('os.data.BaseDescriptor');


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getId = function() {
  return this.id_;
};
goog.exportProperty(
    os.data.BaseDescriptor.prototype,
    'getId',
    os.data.BaseDescriptor.prototype.getId);


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getAliases = function() {
  return [this.getId()];
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getDescriptorType = function() {
  return this.descriptorType;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getProvider = function() {
  return this.provider_;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setProvider = function(value) {
  this.provider_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getProviderType = function() {
  return this.providerType_;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setProviderType = function(value) {
  this.providerType_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getDataProvider = function() {
  if (this.dataProvider) {
    return this.dataProvider;
  }

  var dm = os.dataManager;
  var id = this.getId();

  if (id) {
    var ids = id.split(os.data.BaseDescriptor.ID_DELIMITER);

    if (ids.length) {
      return dm.getProvider(ids[0]);
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setDataProvider = function(value) {
  this.dataProvider = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getTitle = function() {
  return this.title_;
};
goog.exportProperty(
    os.data.BaseDescriptor.prototype,
    'getTitle',
    os.data.BaseDescriptor.prototype.getTitle);


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setTitle = function(value) {
  var old = this.title_;
  this.title_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent('title', value, old));
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getExplicitTitle = function() {
  return this.explicitTitle_;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setExplicitTitle = function(value) {
  var old = this.explicitTitle_;
  this.explicitTitle_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent('explicitTitle', value, old));
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getSearchType = function() {
  return this.getType();
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getType = function() {
  return this.type_;
};


/**
 * Sets the type of the descriptor
 * @param {?string} value The type
 */
os.data.BaseDescriptor.prototype.setType = function(value) {
  this.type_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getColumns = function() {
  return this.columns_;
};


/**
 * Sets the color of the descriptor
 * @param {?Array<os.data.ColumnDefinition>} value The color
 */
os.data.BaseDescriptor.prototype.setColumns = function(value) {
  this.columns_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getColor = function() {
  return this.color_;
};


/**
 * Sets the color of the descriptor
 * @param {?string} value The color
 */
os.data.BaseDescriptor.prototype.setColor = function(value) {
  this.color_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getDescription = function() {
  return this.desc_;
};
goog.exportProperty(
    os.data.BaseDescriptor.prototype,
    'getDescription',
    os.data.BaseDescriptor.prototype.getDescription);


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getIcons = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setDescription = function(value) {
  this.desc_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getMaxDate = function() {
  return this.maxDate_;
};


/**
 * Sets the maximum date
 * @param {number} value The maximum date
 */
os.data.BaseDescriptor.prototype.setMaxDate = function(value) {
  this.maxDate_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getMinDate = function() {
  return this.minDate_;
};


/**
 * Sets the minimum date
 * @param {number} value The minimum date
 */
os.data.BaseDescriptor.prototype.setMinDate = function(value) {
  this.minDate_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getDeleteTime = function() {
  return this.deleteTime_;
};


/**
 * Sets the delete time
 * @param {number} value The delete time
 */
os.data.BaseDescriptor.prototype.setDeleteTime = function(value) {
  this.deleteTime_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getLastActive = function() {
  return this.lastActive_;
};


/**
 * There are times when we need to update the last active without actually activating the descriptor.
 */
os.data.BaseDescriptor.prototype.touchLastActive = function() {
  this.lastActive_ = goog.now();
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.isActive = function() {
  return this.active_;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setActive = function(value) {
  if (this.isActive() !== value) {
    this.active_ = value;

    try {
      if (this.setActiveInternal()) {
        // if the descriptor is fully activated/deactivated, notify listeners
        this.onDescriptorReady();
      }
    } catch (e) {
      goog.log.error(this.log, 'Error setting descriptor activation state', e);
      this.active_ = false;
      this.onDescriptorReady();
    }

    // fire the active event to update the UI
    this.dispatchEvent(new os.events.PropertyChangeEvent('active', value, !value));
  }
};


/**
 * Perform internal tasks for descriptor activation/deactivation.
 *
 * If activation tasks are asynchronous, this function should return false and the descriptor should call
 * {@link os.data.BaseDescriptor#onDescriptorReady} when all tasks complete, whether they succeed or fail.
 *
 * If these tasks are asynchronous, this function should return false
 * @return {boolean} If the descriptor state has been finalized
 * @protected
 */
os.data.BaseDescriptor.prototype.setActiveInternal = function() {
  return true;
};


/**
 * Fire events when all activation/deactivation tasks have completed.
 * @protected
 */
os.data.BaseDescriptor.prototype.onDescriptorReady = function() {
  // if the descriptor was activated, update the last active time
  if (this.isActive()) {
    this.lastActive_ = goog.now();
  }

  this.recordActivationMetric();

  var eventType = this.isActive() ? os.data.DescriptorEventType.ACTIVATED : os.data.DescriptorEventType.DEACTIVATED;
  this.dispatchEvent(eventType);
  os.dispatcher.dispatchEvent(new os.data.DescriptorEvent(eventType, this));
};


/**
 * Records descriptor activate/deactivate metrics.
 * @protected
 */
os.data.BaseDescriptor.prototype.recordActivationMetric = function() {
  var key = this.isActive() ? os.metrics.keys.Descriptor.ACTIVATE : os.metrics.keys.Descriptor.DEACTIVATE;
  os.metrics.Metrics.getInstance().updateMetric(key + '.' + this.getDescriptorType(), 1);
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.clearData = function() {
  // intended for overriding classes to remove internal application data
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.isLocal = function() {
  return this.local_;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setLocal = function(value) {
  this.local_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * Sets the loading state
 * @param {boolean} value
 */
os.data.BaseDescriptor.prototype.setLoading = function(value) {
  this.loading_ = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getTags = function() {
  return this.tags;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.setTags = function(value) {
  this.tags = value;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getSearchText = function() {
  var tags = this.getTags();
  return this.getTitle() + ' ' + this.getType() + ' ' + this.getDescription() + ' ' + this.getProvider() +
      (tags && tags.length ? tags.join(' ') : '');
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.getNodeUI = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.matchesURL = function(url) {
  return false;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['id'] = this.getId();
  opt_obj['provider'] = this.getProvider();
  opt_obj['providerType'] = this.getProviderType();
  opt_obj['title'] = this.getTitle();
  opt_obj['type'] = this.getType();
  opt_obj['color'] = this.getColor();
  opt_obj['description'] = this.getDescription();
  opt_obj['maxDate'] = this.getMaxDate();
  opt_obj['minDate'] = this.getMinDate();
  opt_obj['lastActive'] = this.getLastActive();
  opt_obj['deleteTime'] = this.getDeleteTime();
  opt_obj['tags'] = this.getTags();
  opt_obj['dType'] = this.getDescriptorType();
  opt_obj['active'] = this.isActive();

  if (this.columns_ && this.columns_.length > 0) {
    try {
      var persistColumns = [];
      for (var i = 0, n = this.columns_.length; i < n; i++) {
        if (!this.columns_[i]['temp']) {
          persistColumns.push(this.columns_[i].persist());
        }
      }
      opt_obj['columns'] = persistColumns;
    } catch (e) {
      // don't persist columns if there is an error.
    }
  }

  return opt_obj;
};


/**
 * @inheritDoc
 */
os.data.BaseDescriptor.prototype.restore = function(from) {
  this.setId(from['id']);
  this.setProvider(from['provider']);
  this.setProviderType(from['providerType']);
  this.setTitle(from['title']);
  this.setType(from['type']);
  this.setColor(from['color']);
  this.setDescription(from['description']);
  this.setMaxDate(from['maxDate'] || NaN);
  this.setMinDate(from['minDate'] || NaN);
  this.lastActive_ = from['lastActive'] || NaN;
  this.deleteTime_ = from['deleteTime'] || NaN;
  this.setTags(from['tags']);
  this.tempActive = from['active'];

  var columns = from['columns'];
  if (columns && columns.length > 0) {
    try {
      var deserializedColumns = [];
      for (var i = 0, n = columns.length; i < n; i++) {
        var column = new os.data.ColumnDefinition();
        column.restore(columns[i]);
        deserializedColumns.push(column);
      }
      this.setColumns(deserializedColumns);
    } catch (e) {
      // don't restore columns if there is an error. they'll be reloaded instead.
    }
  }
};


/**
 * Updates the active state from the temporary value
 */
os.data.BaseDescriptor.prototype.updateActiveFromTemp = function() {
  if (this.tempActive === true) {
    // defer to the next tick, in case the descriptor is in the process of being restored and hasn't been added to the
    // data manager yet.
    goog.async.nextTick(this.setActive.bind(this, this.tempActive));
  }

  // unset temp active. It should only run once at load.
  this.tempActive = undefined;
};


/**
 * Compares descriptors by title.
 * @param {os.data.IDataDescriptor} a A descriptor
 * @param {os.data.IDataDescriptor} b Another descriptor
 * @return {number} The comparison
 */
os.data.BaseDescriptor.titleCompare = function(a, b) {
  return goog.string.caseInsensitiveCompare(/** @type {string} */ (a.getTitle()), /** @type {string} */ (b.getTitle()));
};


/**
 * Compares descriptors by title.
 * @param {os.data.IDataDescriptor} a A descriptor
 * @param {os.data.IDataDescriptor} b Another descriptor
 * @return {number} The comparison
 */
os.data.BaseDescriptor.lastActive = function(a, b) {
  if (isNaN(a.getLastActive()) && isNaN(b.getLastActive())) {
    return 0;
  } else if (isNaN(a.getLastActive()) && !isNaN(b.getLastActive())) {
    return 1;
  } else if (!isNaN(a.getLastActive()) && isNaN(b.getLastActive())) {
    return -1;
  } else {
    return goog.array.defaultCompare(a.getLastActive(), b.getLastActive());
  }
};


/**
 * Compares descriptors by title.
 * @param {os.data.IDataDescriptor} a A descriptor
 * @param {os.data.IDataDescriptor} b Another descriptor
 * @return {number} The comparison
 */
os.data.BaseDescriptor.lastActiveReverse = function(a, b) {
  return os.data.BaseDescriptor.lastActive(b, a);
};

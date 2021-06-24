goog.module('os.data.BaseDescriptor');
goog.module.declareLegacyNamespace();

const nextTick = goog.require('goog.async.nextTick');
const UtcDateTime = goog.require('goog.date.UtcDateTime');
const EventTarget = goog.require('goog.events.EventTarget');
const {caseInsensitiveCompare, endsWith} = goog.require('goog.string');
const dispatcher = goog.require('os.Dispatcher');
const ColumnDefinition = goog.require('os.data.ColumnDefinition');
const DataManager = goog.require('os.data.DataManager');
const DescriptorEvent = goog.require('os.data.DescriptorEvent');
const IDataDescriptor = goog.require('os.data.IDataDescriptor');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const osImplements = goog.require('os.implements');
const Metrics = goog.require('os.metrics.Metrics');
const keys = goog.require('os.metrics.keys');

const ISearchable = goog.requireType('os.data.ISearchable');


/**
 * The base implementation of a data descriptor
 *
 * @implements {IDataDescriptor}
 * @implements {ISearchable}
 */
class BaseDescriptor extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

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
     * @type {?Array<ColumnDefinition>}
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
    this.log = logger;

    /**
     * NodeUI
     * @type {string}
     */
    this.nodeUI = '';
  }

  /**
   * @inheritDoc
   * @export
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  setId(value) {
    this.id_ = value;
  }

  /**
   * @inheritDoc
   */
  getAliases() {
    return [this.getId()];
  }

  /**
   * @inheritDoc
   */
  getDescriptorType() {
    return this.descriptorType;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return this.provider_;
  }

  /**
   * @inheritDoc
   */
  setProvider(value) {
    this.provider_ = value;
  }

  /**
   * @inheritDoc
   */
  getProviderType() {
    return this.providerType_;
  }

  /**
   * @inheritDoc
   */
  setProviderType(value) {
    this.providerType_ = value;
  }

  /**
   * @inheritDoc
   */
  getDataProvider() {
    if (this.dataProvider) {
      return this.dataProvider;
    }

    var dm = DataManager.getInstance();
    var id = this.getId();

    if (id) {
      var ids = id.split(BaseDescriptor.ID_DELIMITER);

      if (ids.length) {
        return dm.getProvider(ids[0]);
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  setDataProvider(value) {
    this.dataProvider = value;
  }

  /**
   * @inheritDoc
   * @export
   */
  getTitle() {
    return this.title_;
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    var old = this.title_;
    this.title_ = value;
    this.dispatchEvent(new PropertyChangeEvent('title', value, old));
  }

  /**
   * @inheritDoc
   */
  getExplicitTitle() {
    return this.explicitTitle_;
  }

  /**
   * @inheritDoc
   */
  setExplicitTitle(value) {
    var old = this.explicitTitle_;
    this.explicitTitle_ = value;
    this.dispatchEvent(new PropertyChangeEvent('explicitTitle', value, old));
  }

  /**
   * @inheritDoc
   */
  getSearchType() {
    return this.getType();
  }

  /**
   * @inheritDoc
   */
  getType() {
    return this.type_;
  }

  /**
   * Sets the type of the descriptor
   *
   * @param {?string} value The type
   */
  setType(value) {
    this.type_ = value;
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    return this.columns_;
  }

  /**
   * Sets the column definitions of the descriptor
   *
   * @param {?Array<ColumnDefinition>} value The column definitions
   */
  setColumns(value) {
    this.columns_ = value;
  }

  /**
   * @inheritDoc
   */
  getColor() {
    return this.color_;
  }

  /**
   * Sets the color of the descriptor
   *
   * @param {?string} value The color
   */
  setColor(value) {
    this.color_ = value;
  }

  /**
   * @inheritDoc
   * @export
   */
  getDescription() {
    return this.desc_;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return null;
  }

  /**
   * @inheritDoc
   */
  setDescription(value) {
    this.desc_ = value;
  }

  /**
   * @inheritDoc
   */
  getMaxDate() {
    return this.maxDate_;
  }

  /**
   * Sets the maximum date
   *
   * @param {number} value The maximum date
   */
  setMaxDate(value) {
    this.maxDate_ = value;
  }

  /**
   * @inheritDoc
   */
  getMinDate() {
    return this.minDate_;
  }

  /**
   * Sets the minimum date
   *
   * @param {number} value The minimum date
   */
  setMinDate(value) {
    this.minDate_ = value;
  }

  /**
   * @inheritDoc
   */
  getDeleteTime() {
    return this.deleteTime_;
  }

  /**
   * Sets the delete time
   *
   * @param {number} value The delete time
   */
  setDeleteTime(value) {
    this.deleteTime_ = value;
  }

  /**
   * @inheritDoc
   */
  getLastActive() {
    return this.lastActive_;
  }

  /**
   * There are times when we need to update the last active without actually activating the descriptor.
   */
  touchLastActive() {
    this.lastActive_ = Date.now();
  }

  /**
   * @inheritDoc
   */
  isActive() {
    return this.active_;
  }

  /**
   * @inheritDoc
   */
  setActive(value) {
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
      this.dispatchEvent(new PropertyChangeEvent('active', value, !value));
    }
  }

  /**
   * Perform internal tasks for descriptor activation/deactivation.
   *
   * If activation tasks are asynchronous, this function should return false and the descriptor should call
   * {@link os.data.BaseDescriptor#onDescriptorReady} when all tasks complete, whether they succeed or fail.
   *
   * If these tasks are asynchronous, this function should return false
   *
   * @return {boolean} If the descriptor state has been finalized
   * @protected
   */
  setActiveInternal() {
    return true;
  }

  /**
   * Fire events when all activation/deactivation tasks have completed.
   *
   * @protected
   */
  onDescriptorReady() {
    // if the descriptor was activated, update the last active time
    if (this.isActive()) {
      this.lastActive_ = Date.now();
    }

    this.recordActivationMetric();

    var eventType = this.isActive() ? os.data.DescriptorEventType.ACTIVATED : os.data.DescriptorEventType.DEACTIVATED;
    this.dispatchEvent(eventType);
    dispatcher.getInstance().dispatchEvent(new DescriptorEvent(eventType, this));
  }

  /**
   * Records descriptor activate/deactivate metrics.
   *
   * @protected
   */
  recordActivationMetric() {
    var key = this.isActive() ? keys.Descriptor.ACTIVATE : keys.Descriptor.DEACTIVATE;
    Metrics.getInstance().updateMetric(key + '.' + this.getDescriptorType(), 1);
  }

  /**
   * @inheritDoc
   */
  clearData() {
    // intended for overriding classes to remove internal application data
  }

  /**
   * @inheritDoc
   */
  isLocal() {
    return this.local_;
  }

  /**
   * @inheritDoc
   */
  setLocal(value) {
    this.local_ = value;
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    return this.loading_;
  }

  /**
   * Sets the loading state
   *
   * @param {boolean} value
   */
  setLoading(value) {
    this.loading_ = value;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return this.tags;
  }

  /**
   * @inheritDoc
   */
  setTags(value) {
    this.tags = value;
  }

  /**
   * @inheritDoc
   */
  getSearchText() {
    var tags = this.getTags();
    return this.getTitle() + ' ' + this.getType() + ' ' + this.getDescription() + ' ' + this.getProvider() +
        (tags && tags.length ? tags.join(' ') : '');
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    return this.nodeUI;
  }

  /**
   * Sets the Node UI for this descriptor
   * @param {string} value - node UI HTML
   */
  setNodeUI(value) {
    this.nodeUI = value;
  }

  /**
   * @inheritDoc
   */
  matchesURL(url) {
    return false;
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
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
  }

  /**
   * @inheritDoc
   */
  restore(from) {
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
          var column = new ColumnDefinition();
          column.restore(columns[i]);
          deserializedColumns.push(column);
        }
        this.setColumns(deserializedColumns);
      } catch (e) {
        // don't restore columns if there is an error. they'll be reloaded instead.
      }
    }
  }

  /**
   * @inheritDoc
   */
  getHtmlDescription() {
    var text = 'Layer Name: ' + this.getTitle() + '<br>';
    var provider = this.getProvider();
    if (provider) {
      text += 'Provider: ' + provider + '<br>';
    }
    var type = this.getType() || '';
    if (endsWith(type, 's')) {
      type = type.substring(0, type.length - 1);
    }

    if (type) {
      text += 'Type: ' + type + '<br>';
    }

    if (!isNaN(this.getMinDate()) && !isNaN(this.getMaxDate())) {
      var s = new UtcDateTime();
      s.setTime(this.getMinDate());

      var e = new UtcDateTime();
      e.setTime(this.getMaxDate());

      text += 'Time: ' + s.toUTCIsoString(true, true) + ' to ' + e.toUTCIsoString(true, true) + '<br>';
    }

    text += '<br>';

    var desc = this.getDescription();
    text += (desc ? desc : 'No description provided') + '<br><br>';
    text += 'Tags: ' + (this.getTags() ? this.getTags().join(', ') : '(none)');
    text += '<br><br>';
    return text;
  }

  /**
   * Updates the active state from the temporary value
   */
  updateActiveFromTemp() {
    if (this.tempActive === true) {
      // defer to the next tick, in case the descriptor is in the process of being restored and hasn't been added to the
      // data manager yet.
      nextTick(this.setActive.bind(this, this.tempActive));
    }

    // unset temp active. It should only run once at load.
    this.tempActive = undefined;
  }

  /**
   * Compares descriptors by title.
   *
   * @param {IDataDescriptor} a A descriptor
   * @param {os.data.IDataDescriptor} b Another descriptor
   * @return {number} The comparison
   */
  static titleCompare(a, b) {
    return caseInsensitiveCompare(/** @type {string} */ (a.getTitle()), /** @type {string} */ (b.getTitle()));
  }

  /**
   * Compares descriptors by title.
   *
   * @param {IDataDescriptor} a A descriptor
   * @param {os.data.IDataDescriptor} b Another descriptor
   * @return {number} The comparison
   */
  static lastActive(a, b) {
    if (isNaN(a.getLastActive()) && isNaN(b.getLastActive())) {
      return 0;
    } else if (isNaN(a.getLastActive()) && !isNaN(b.getLastActive())) {
      return 1;
    } else if (!isNaN(a.getLastActive()) && isNaN(b.getLastActive())) {
      return -1;
    } else {
      return goog.array.defaultCompare(a.getLastActive(), b.getLastActive());
    }
  }

  /**
   * Compares descriptors by title.
   *
   * @param {IDataDescriptor} a A descriptor
   * @param {os.data.IDataDescriptor} b Another descriptor
   * @return {number} The comparison
   */
  static lastActiveReverse(a, b) {
    return BaseDescriptor.lastActive(b, a);
  }
}
osImplements(BaseDescriptor, IDataDescriptor.ID);


/**
 * The delimiter for descriptor and layer IDs
 * @type {string}
 * @const
 */
BaseDescriptor.ID_DELIMITER = '#';


/**
 * Logger for os.data.BaseDescriptor
 * @type {goog.log.Logger}
 */
const logger = goog.log.getLogger('os.data.BaseDescriptor');


exports = BaseDescriptor;

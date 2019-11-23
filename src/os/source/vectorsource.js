goog.provide('os.source.Vector');

goog.require('goog.Timer');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('goog.color');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string');
goog.require('ol.color');
goog.require('ol.geom.Geometry');
goog.require('ol.source.Vector');
goog.require('os');
goog.require('os.Fields');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.DataManager');
goog.require('os.data.RecordField');
goog.require('os.data.event.DataEvent');
goog.require('os.data.event.DataEventType');
goog.require('os.data.histo.ColorModel');
goog.require('os.data.histo.SourceHistogram');
goog.require('os.defines');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.events.SelectionType');
goog.require('os.feature.DynamicPropertyChange');
goog.require('os.geo');
goog.require('os.geo.jsts');
goog.require('os.hist.HistogramData');
goog.require('os.hist.IHistogramProvider');
goog.require('os.implements');
goog.require('os.interpolate');
goog.require('os.layer.AnimationOverlay');
goog.require('os.load.LoadingManager');
goog.require('os.mixin.rbush');
goog.require('os.ogc');
goog.require('os.registerClass');
goog.require('os.source');
goog.require('os.source.ISource');
goog.require('os.source.PropertyChange');
goog.require('os.source.column');
goog.require('os.string');
goog.require('os.style.StyleManager');
goog.require('os.style.label');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineController');
goog.require('os.time.xf.TimeModel');
goog.require('os.ui.slick.column');
goog.require('os.webgl');



/**
 * @extends {ol.source.Vector}
 * @implements {os.source.ISource}
 * @implements {os.hist.IHistogramProvider}
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @constructor
 */
os.source.Vector = function(opt_options) {
  // remove things from our layer options that we don't want managed by ol3
  var options = opt_options ? goog.object.clone(opt_options) : {};
  delete options['url'];

  /**
   * The logger to use for the source.
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.source.Vector.LOGGER_;

  /**
   * @type {boolean}
   * @private
   */
  this.animationEnabled_ = false;

  /**
   * If WebGL is enabled (not rendering directly to Openlayers).
   * @type {boolean}
   * @protected
   */
  this.webGLEnabled = false;

  /**
   * @type {!Array<!os.data.ColumnDefinition>}
   * @protected
   */
  this.columns = [];

  /**
   * The number of features to check when auto detecting columns
   * @type {number}
   * @protected
   */
  this.columnAutoDetectLimit = 1;

  /**
   * @type {string}
   * @private
   */
  this.id_ = '';

  /**
   * @type {boolean}
   * @protected
   */
  this.externalColumns = false;

  /**
   * @type {string}
   * @private
   */
  this.geometryShape_ = os.style.DEFAULT_SHAPE;

  /**
   * @type {string}
   * @private
   */
  this.centerGeometryShape_ = os.style.DEFAULT_CENTER_SHAPE;

  /**
   * @type {number}
   * @private
   */
  this.lastEllipseNotification_ = 0;

  /**
   * @type {boolean}
   * @private
   */
  this.loading_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.locked_ = false;

  /**
   * @type {number}
   * @private
   */
  this.minDate_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.maxDate_ = 0;

  /**
   * @type {string}
   * @private
   */
  this.title_ = '';

  /**
   * @type {boolean}
   * @private
   */
  this.replaceDupes_ = true;

  /**
   * @type {Object}
   * @private
   */
  this.supportedActions_ = {};

  // setup defaults
  this.setSupportsAction(os.action.EventType.GOTO, true);
  this.setSupportsAction(os.action.EventType.IDENTIFY, true);
  this.setSupportsAction(os.action.EventType.BUFFER, true);
  this.setSupportsAction(os.action.EventType.EXPORT, true);
  this.setSupportsAction(os.action.EventType.CLEAR_SELECTION, true);

  /**
   * @type {boolean}
   * @private
   */
  this.timeEnabled_ = false;

  /**
   * Histogram used to time filter data in the source.
   * @type {os.time.xf.TimeModel}
   * @protected
   */
  this.timeModel = new os.time.xf.TimeModel(os.source.getRecordTime, os.source.getHoldRecordTime);

  /**
   * Histogram used to color features in the source.
   * @type {os.data.histo.ColorModel}
   * @protected
   */
  this.colorModel = null;

  /**
   * @type {boolean}
   * @protected
   */
  this.visible = true;

  /**
   * @type {Array<!ol.Feature>}
   * @private
   */
  this.highlightedItems_ = null;

  /**
   * @type {!Array<!ol.Feature>}
   * @private
   */
  this.selected_ = [];

  /**
   * @type {!Object<string, boolean>}
   * @private
   */
  this.selectedById_ = {};

  /**
   * @type {!Object<string, boolean|undefined>}
   * @protected
   */
  this.shownRecordMap = {};

  /**
   * @type {boolean}
   * @private
   */
  this.previousFade_ = false;

  /**
   * Array of new features waiting to be processed.
   * @type {!Array<!ol.Feature>}
   * @private
   */
  this.processQueue_ = [];

  /**
   * Delay to handle bulk processing of new features as they're added to the source. This vastly improves time model
   * insertion performance.
   * @type {goog.async.Delay}
   * @protected
   */
  this.processTimer = new goog.async.Delay(this.onProcessTimer_, 250, this);

  /**
   * Array of features waiting to be unprocessed.
   * @type {!Array<!ol.Feature>}
   * @private
   */
  this.unprocessQueue_ = [];

  /**
   * Delay to handle bulk unprocessing of features as they're removed from the source.
   * @type {goog.async.Delay}
   * @protected
   */
  this.unprocessTimer = new goog.async.Delay(this.onUnprocessTimer_, 250, this);

  /**
   * Delay to reduce frequency of reindexing the time model.
   * @type {goog.async.Delay}
   * @protected
   */
  this.reindexTimer = new goog.async.Delay(this.reindexTimeModel_, 100, this);

  /**
   * @type {os.time.TimelineController}
   * @protected
   */
  this.tlc = os.time.TimelineController.getInstance();

  /**
   * @type {?os.layer.AnimationOverlay}
   * @protected
   */
  this.animationOverlay = null;

  /**
   * Map of dynamic features that update on every animation frame.
   * @type {!Object<string, (os.feature.DynamicFeature|undefined)>}
   * @private
   */
  this.dynamicFeatures_ = {};

  /**
   * Map of dynamic feature listeners.
   * @type {!Object<string, (ol.EventsKey|undefined)>}
   * @private
   */
  this.dynamicListeners_ = {};

  /**
   * @type {!Object<string, Array<ol.Feature>>}
   * @private
   */
  this.rangeCollections_ = {};

  /**
   * @type {!os.time.TimeRange}
   * @private
   */
  this.displayRange_ = os.time.UNBOUNDED;

  /**
   * @type {!os.time.TimeRange}
   * @private
   */
  this.previousRange_ = os.time.UNBOUNDED;

  /**
   * @type {boolean}
   * @private
   */
  this.timeFilterEnabled_ = true;

  /**
   * @type {number}
   * @private
   */
  this.featureCount_ = 0;

  /**
   * Feature hover handler
   * @type {os.source.FeatureHoverFn|undefined}
   * @private
   */
  this.hoverHandler_ = options['hoverHandler'] || undefined;

  /**
   * @type {boolean}
   * @private
   */
  this.lockable_ = false;

  /**
   * @type {os.webgl.AltitudeMode}
   * @private
   */
  this.altitudeMode_ = os.webgl.AltitudeMode.ABSOLUTE;

  /**
   * How often the source will automatically refresh itself.
   * @type {number}
   * @protected
   */
  this.refreshInterval = 0;

  /**
   * The delay used to auto refresh the source.
   * @type {goog.Timer}
   * @protected
   */
  this.refreshTimer = null;

  /**
   * If the source can be refreshed.
   * @type {boolean}
   * @protected
   */
  this.refreshEnabled = false;

  /**
   * Features queued to be cleared.
   * @type {?Array<ol.Feature>}
   */
  this.toClear = null;

  /**
   * Unique ID column.
   * @type {?os.data.ColumnDefinition}
   * @private
   */
  this.uniqueId_ = null;

  /**
   * Stats of column data types.
   * @type {?Object}
   * @private
   */
  this.stats_ = {};

  /**
   * If the feature data column type should try to be determined.
   * @type {boolean}
   * @private
   */
  this.detectColumnTypes_ = false;

  if (!options['disableAreaSelection']) {
    os.dispatcher.listen(os.action.EventType.SELECT, this.onFeatureAction_, false, this);
    os.dispatcher.listen(os.action.EventType.SELECT_EXCLUSIVE, this.onFeatureAction_, false, this);
    os.dispatcher.listen(os.action.EventType.DESELECT, this.onFeatureAction_, false, this);
    os.dispatcher.listen(os.action.EventType.REMOVE_FEATURE, this.onFeatureAction_, false, this);
    os.dispatcher.listen(os.action.EventType.REMOVE_FEATURES, this.onFeatureAction_, false, this);
  }

  this.tlc.listen(os.time.TimelineEventType.FADE_TOGGLE, this.fadeToggle_, false, this);
  this.tlc.listen(os.time.TimelineEventType.HOLD_RANGE_CHANGED, this.reindexTimeModel, false, this);
  // do this last in case options contain features
  os.source.Vector.base(this, 'constructor', /** @type {!olx.source.VectorOptions} */ (options));
};
goog.inherits(os.source.Vector, ol.source.Vector);
os.implements(os.source.Vector, os.hist.IHistogramProvider.ID);
os.implements(os.source.Vector, os.source.ISource.ID);


/**
 * Class name
 * @type {string}
 * @const
 */
os.source.Vector.NAME = 'os.source.Vector';
os.registerClass(os.source.Vector.NAME, os.source.Vector);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.source.Vector.LOGGER_ = goog.log.getLogger(os.source.Vector.NAME);


/**
 * @type {string}
 * @const
 */
os.source.Vector.HIDDEN = 'hidden';


/**
 * @type {string}
 * @const
 */
os.source.Vector.VISIBLE = 'visible';


/**
 * @inheritDoc
 */
os.source.Vector.prototype.disposeInternal = function() {
  os.source.Vector.base(this, 'disposeInternal');

  if (this.refreshTimer) {
    this.refreshTimer.unlisten(goog.Timer.TICK, this.onRefreshTimer, false, this);
    this.refreshTimer = null;
  }

  os.dispatcher.unlisten(os.action.EventType.SELECT, this.onFeatureAction_, false, this);
  os.dispatcher.unlisten(os.action.EventType.DESELECT, this.onFeatureAction_, false, this);
  os.dispatcher.unlisten(os.action.EventType.SELECT_EXCLUSIVE, this.onFeatureAction_, false, this);
  os.dispatcher.unlisten(os.action.EventType.REMOVE_FEATURE, this.onFeatureAction_, false, this);
  os.dispatcher.unlisten(os.action.EventType.REMOVE_FEATURES, this.onFeatureAction_, false, this);

  this.tlc.unlisten(os.time.TimelineEventType.SHOW, this.onTimelineShow_, false, this);
  this.tlc.unlisten(os.time.TimelineEventType.FADE_TOGGLE, this.fadeToggle_, false, this);
  this.tlc.unlisten(os.time.TimelineEventType.HOLD_RANGE_CHANGED, this.reindexTimeModel, false, this);
  this.tlc = null;

  this.disposeAnimationOverlay();

  goog.dispose(this.processTimer);
  this.processTimer = null;
  this.processQueue_.length = 0;

  goog.dispose(this.unprocessTimer);
  this.unprocessTimer = null;
  this.unprocessQueue_.length = 0;

  goog.dispose(this.reindexTimer);
  this.reindexTimer = null;

  if (this.timeModel) {
    this.timeModel.dispose();
    this.timeModel = null;
  }

  if (this.colorModel) {
    this.colorModel.dispose();
    this.colorModel = null;
  }

  // unlock the layer so clear isn't blocked
  this.setLocked(false);
  this.clear();
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.changed = function() {
  if (!this.webGLEnabled) {
    // skip this in 3D mode to prevent Openlayers from drawing anything that isn't being displayed
    os.source.Vector.base(this, 'changed');

    if (this.animationOverlay) {
      // make sure features are rendered on the overlay if it exists
      this.animationOverlay.changed();
    }
  }
};


/**
 * The listeners Openlayers adds are never used, and are a waste of memory. This trims some fat off each feature.
 *
 * @param {string} featureKey
 * @param {ol.Feature} feature
 * @override
 *
 * @suppress {accessControls|duplicate|unusedPrivateMembers}
 * @see THIN-4494
 */
os.source.Vector.prototype.setupChangeEvents_ = function(featureKey, feature) {
  // these listeners have been disabled for performance reasons. the original removeFeatureInternal has an assertion
  // to make sure featureChangeKeys_ has an entry for the feature id, so we remove that as well.
  this.featureChangeKeys_[featureKey] = [
    ol.events.listen(feature, ol.events.EventType.CHANGE, this.handleFeatureChange_, this)
  ];
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.source.Vector.prototype.clear = function(opt_fast) {
  if (!this.isLocked()) {
    // clear selection/hidden structures. using selectNone so the selected style will be removed from features.
    this.selectNone();
    this.shownRecordMap = {};

    this.minDate_ = 0;
    this.maxDate_ = 0;

    if (this.timeModel) {
      this.timeModel.clear();
    }

    // clear out all of the collections/Rtree
    if (this.featuresRtree_) {
      var rTreeFeatures = this.featuresRtree_.getAll();
      for (var i = 0; i < rTreeFeatures.length; i++) {
        this.removeFeatureInternal(rTreeFeatures[i], true);
      }

      for (var id in this.nullGeometryFeatures_) {
        this.removeFeatureInternal(this.nullGeometryFeatures_[id]);
      }
    }

    if (this.featuresCollection_) {
      this.featuresCollection_.clear();
    }

    if (this.featuresRtree_) {
      this.featuresRtree_.clear();
    }

    this.loadedExtentsRtree_.clear();
    this.nullGeometryFeatures_ = {};

    var clearEvent = new ol.source.Vector.Event(ol.source.VectorEventType.CLEAR);
    this.dispatchEvent(clearEvent);
    this.changed();

    // fire this immediately so the source is fully cleared.
    this.unprocessNow();

    if (this.processTimer && this.processQueue_) {
      // make sure nothing is left in the queue
      this.processTimer.stop();
      this.processQueue_.length = 0;
    }

    this.updateLabels();
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.CLEARED));
  }
};


/**
 * Clears any features in the toClear queue
 */
os.source.Vector.prototype.clearQueue = function() {
  if (this.toClear) {
    this.removeFeatures(this.toClear);
    this.toClear = null;
  }
};


/**
 * Reindex the R-tree. This should *only* be done in place of removing a large number of features from the tree since
 * there is no bulk removal endpoint.
 *
 * @private
 * @suppress {accessControls}
 */
os.source.Vector.prototype.reindexRtree_ = function() {
  if (this.featuresRtree_) {
    var feature;
    var length;
    var i;

    var extents = [];
    var indexFeatures = [];
    var geometryFeatures = [];

    var features = this.getFeatures();
    for (i = 0, length = features.length; i < length; i++) {
      feature = features[i];

      if (this.idIndex_[feature.id_.toString()] !== undefined) {
        indexFeatures.push(feature);
      }
    }

    for (i = 0, length = indexFeatures.length; i < length; i++) {
      feature = indexFeatures[i];

      var geometry = feature.getGeometry();
      if (geometry) {
        var extent = geometry.getExtent();
        extents.push(extent);
        geometryFeatures.push(feature);
      }
    }

    this.featuresRtree_.clear();
    this.featuresRtree_.load(extents, geometryFeatures);
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.refresh = goog.nullFunction;


/**
 * @inheritDoc
 */
os.source.Vector.prototype.isRefreshEnabled = function() {
  return this.refreshEnabled;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getRefreshInterval = function() {
  return this.refreshInterval;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setRefreshInterval = function(value) {
  if (this.refreshInterval != value) {
    this.refreshInterval = value;

    if (this.refreshTimer) {
      this.refreshTimer.unlisten(goog.Timer.TICK, this.onRefreshTimer, false, this);
      if (!this.refreshTimer.hasListener()) {
        // nobody's listening, so stop it
        this.refreshTimer.stop();
      }
    }

    this.refreshTimer = null;

    if (this.refreshInterval > 0) {
      this.refreshTimer = os.source.RefreshTimers[value];

      if (!this.refreshTimer) {
        // didn't find one for that time, so make a new one and save it off
        this.refreshTimer = new goog.Timer(1000 * value);
        os.source.RefreshTimers[value] = this.refreshTimer;
      }

      this.refreshTimer.listen(goog.Timer.TICK, this.onRefreshTimer, false, this);
      this.refreshTimer.start();
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.REFRESH_INTERVAL));
  }
};


/**
 * Refreshes the source on refresh timer tick.
 */
os.source.Vector.prototype.onRefreshTimer = function() {
  // if the source is still loading from a previous user-driven action, don't refresh it until the next timer tick
  if (this.isRefreshEnabled() && !this.isLoading()) {
    this.refresh();
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getColumns = function() {
  return this.columns.slice();
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getColumnsArray = function() {
  return this.columns;
};


/**
 * Get columns that do not contain data on any features in the source.
 *
 * @return {!Array<!os.data.ColumnDefinition>}
 *
 * @suppress {accessControls}
 */
os.source.Vector.prototype.getEmptyColumns = function() {
  if (!this.getFeatureCount()) {
    return [];
  }

  // make sure columns are all non-null and have a field
  var empty = this.getColumnsArray().filter(function(col) {
    return !!col && !!col['field'];
  });

  if (empty.length > 0) {
    var features = this.getFeatures();
    for (var i = 0; i < features.length && empty.length > 0; i++) {
      var j = empty.length;
      while (j--) {
        if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(features[i].values_[empty[j]['field']]))) {
          // if a value is encountered, remove the column so it's no longer considered
          empty.splice(j, 1);
        }
      }
    }
  }

  return empty;
};


/**
 * @inheritDoc
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.source.Vector.prototype.setColumns = function(columns) {
  if (columns) {
    this.externalColumns = true;

    // ensure all columns are column definition objects
    this.columns = columns.map(os.source.column.mapStringOrDef);

    // add defaults columns
    os.source.column.addDefaults(this);

    // test for shape support
    this.testShapeFields_(this.geometryShape_);

    // clean up the columns
    this.processColumns();
  }
};


/**
 * Adds a column to the source if a matching one doesn't exist already.
 *
 * @param {string} field The data field for the column.
 * @param {string=} opt_header Optional header. If not specified, field will be used instead.
 * @param {boolean=} opt_temp Optional flag for temp columns. Defaults to false.
 * @param {boolean=} opt_event Optional flag to fire the property change event.
 */
os.source.Vector.prototype.addColumn = function(field, opt_header, opt_temp, opt_event) {
  if (!this.hasColumn(field)) {
    var column = os.source.column.create(field, opt_header, opt_temp);
    this.columns.push(column);

    if (opt_event) {
      this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLUMN_ADDED, column));
    }
  }
};


/**
 * Gets a flag to determine whether to attempt to convert feature data to a type.
 *
 * @return {boolean}
 */
os.source.Vector.prototype.getDetectColumnTypes = function() {
  return this.detectColumnTypes_;
};


/**
 * Sets a flag to determine whether to attempt to convert feature data to a type.
 *
 * @param {boolean} value
 */
os.source.Vector.prototype.setDetectColumnTypes = function(value) {
  this.detectColumnTypes_ = value;
};


/**
 * Perform cleanup actions on columns.
 *
 * @param {boolean=} opt_silent If events should not be dispatched.
 * @protected
 */
os.source.Vector.prototype.processColumns = function(opt_silent) {
  if (this.columns) {
    // remove any duplicates
    var colByName = /** @type {function((os.data.ColumnDefinition|string)):string} */ (
      os.object.getValueExtractor('name'));
    goog.array.removeDuplicates(this.columns, this.columns, colByName);

    var descriptor = os.dataManager.getDescriptor(this.getId());
    if (descriptor) {
      // restore descriptor column information to the source columns
      var descriptorColumns = descriptor.getColumns();
      if (descriptorColumns) {
        os.ui.slick.column.restore(descriptorColumns, this.columns);
      }
    }

    this.columns.forEach(function(column) {
      // mark internal columns that were derived from another
      os.fields.markDerived(column);

      // add custom formatters
      os.source.column.addFormatter(column);

      // update the column type based on the data
      if (!goog.object.isEmpty(this.stats_)) {
        var types = this.stats_[column['name']];

        if (types) {
          // ignore the empty data
          goog.object.remove(types, 'empty');

          if (goog.object.getCount(types) == 1) {
            column['type'] = goog.object.getAnyKey(types);
          } else if (goog.object.getCount(types) == 2) {
            if (goog.object.containsKey(types, 'integer') && goog.object.containsKey(types, 'decimal')) {
              column['type'] = 'decimal';
            }
          }
        }
      }
    }, this);

    if (descriptor) {
      // save columns to the descriptor
      descriptor.setColumns(this.columns);
    }

    // apply default values if the user has not modified any columns
    if (!this.columns.some(os.ui.slick.column.isUserModified)) {
      // initialize sort/widths
      this.columns.sort(os.ui.slick.column.autoSizeAndSortColumns);

      this.columns.forEach(function(column) {
        // hide specific columns by default
        os.fields.hideSpecialColumns(column);
      });
    }

    // detect and apply an icon rotation column
    if (this.hasColumn(os.Fields.BEARING)) {
      var styleConfig = os.style.StyleManager.getInstance().getLayerConfig(this.getId());
      if (styleConfig && !styleConfig[os.style.StyleField.ROTATION_COLUMN]) {
        styleConfig[os.style.StyleField.ROTATION_COLUMN] = os.Fields.BEARING;
      }
    }

    // notify that columns have changed
    if (!opt_silent) {
      this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLUMNS, this.columns));
    }
  }
};


/**
 * Make updates to columns based on feature properties
 *
 * @param {!Array<!ol.Feature>} features
 * @protected
 * @suppress {accessControls}
 */
os.source.Vector.prototype.updateColumns = function(features) {
  if (!this.externalColumns && features.length > 0) {
    var change = false;
    var feature = null;

    for (var i = 0; i < features.length; i++) {
      feature = features[i];
      var properties = feature.values_;
      for (var key in properties) {
        if (!this.hasColumn(key) && !os.feature.isInternalField(key)) {
          this.addColumn(key);
          change = true;
        } else if (key === os.data.RecordField.TIME && !this.hasColumn(os.data.RecordField.TIME)) {
          // a time column was mapped, so add it to the source if there isn't one
          var column = os.source.column.create(os.data.RecordField.TIME, 'TIME');
          this.columns.unshift(column); // always keep record time over any other TIME column
          change = true;
        }
      }
    }

    if (change) {
      this.processColumns();
    }
  }
};


/**
 * Searches for a column on the source.
 *
 * @param {string|os.data.ColumnDefinition} value
 * @return {boolean}
 */
os.source.Vector.prototype.hasColumn = function(value) {
  var field = null;
  if (typeof value === 'string') {
    field = value;
  } else if (goog.isObject(value)) {
    field = /** @type {os.data.ColumnDefinition} */ (value)['field'];
  }

  if (field) {
    field = field.toUpperCase();
    var i = this.columns.length;
    while (i--) {
      if (this.columns[i]['field'].toUpperCase() == field) {
        return true;
      }
    }
  }

  return false;
};


/**
 * Gets the column limit used to determine how many features to check for unique column keys
 *
 * @return {number}
 */
os.source.Vector.prototype.getColumnAutoDetectLimit = function() {
  return this.columnAutoDetectLimit;
};


/**
 * Sets the column limit used to determine how many features to check for unique column keys
 *
 * @param {number} value
 */
os.source.Vector.prototype.setColumnAutoDetectLimit = function(value) {
  this.columnAutoDetectLimit = value;
};


/**
 * Gets the geometry shape used by features in the source.
 *
 * @return {string}
 */
os.source.Vector.prototype.getGeometryShape = function() {
  return this.geometryShape_;
};


/**
 * Sets the geometry shape used by features in the source.
 *
 * @param {string} value
 */
os.source.Vector.prototype.setGeometryShape = function(value) {
  var oldGeomShape = this.geometryShape_;
  this.geometryShape_ = value;
  this.testShapeFields_(value);

  // we are converting to an ellipse shape
  var ellipseTest = os.style.ELLIPSE_REGEXP.test(value);
  // we are converting to a lob shape
  var lobTest = os.style.LOB_REGEXP.test(value);
  // we are converting back from an ellipse or lob shape and need to reindex the original
  var revertIndexTest = os.style.ELLIPSE_REGEXP.test(oldGeomShape) || os.style.LOB_REGEXP.test(oldGeomShape);

  if (ellipseTest || lobTest || revertIndexTest) {
    var features = this.getFeatures();
    var layerConf = os.style.StyleManager.getInstance().getLayerConfig(this.getId());
    var lobOptions = /** type {os.feature.LOBOptions} */ ({
      arrowLength: layerConf[os.style.StyleField.ARROW_SIZE],
      arrowUnits: layerConf[os.style.StyleField.ARROW_UNITS],
      bearingColumn: layerConf[os.style.StyleField.LOB_BEARING_COLUMN],
      bearingError: layerConf[os.style.StyleField.LOB_BEARING_ERROR],
      bearingErrorColumn: layerConf[os.style.StyleField.LOB_BEARING_ERROR_COLUMN],
      columnLength: layerConf[os.style.StyleField.LOB_COLUMN_LENGTH],
      length: layerConf[os.style.StyleField.LOB_LENGTH],
      lengthType: layerConf[os.style.StyleField.LOB_LENGTH_TYPE],
      lengthColumn: layerConf[os.style.StyleField.LOB_LENGTH_COLUMN],
      lengthUnits: layerConf[os.style.StyleField.LOB_LENGTH_UNITS],
      lengthError: layerConf[os.style.StyleField.LOB_LENGTH_ERROR],
      lengthErrorColumn: layerConf[os.style.StyleField.LOB_LENGTH_ERROR_COLUMN],
      lengthErrorUnits: layerConf[os.style.StyleField.LOB_LENGTH_ERROR_UNITS],
      showArrow: layerConf[os.style.StyleField.SHOW_ARROW],
      showEllipse: layerConf[os.style.StyleField.SHOW_ELLIPSE],
      showError: layerConf[os.style.StyleField.SHOW_ERROR]
    });

    for (var i = 0, n = features.length; i < n; i++) {
      var geoms = [features[i].getGeometry()];

      if (ellipseTest) {
        os.feature.createEllipse(features[i]);
        geoms.push(/** @type {ol.geom.Geometry} */ (features[i].get(os.data.RecordField.ELLIPSE)));
      }

      if (lobTest) {
        os.feature.createLineOfBearing(features[i], true, lobOptions);
      }

      this.updateIndex(features[i]);
    }
  }
};


/**
 * @type {ol.Extent}
 * @private
 */
os.source.Vector.scratchExtent_ = ol.extent.createEmpty();


/**
 * @param {ol.geom.Geometry} g
 */
os.source.Vector.updateScratchExtent_ = function(g) {
  if (g) {
    var e = os.extent.getFunctionalExtent(g);
    if (e) {
      ol.extent.extend(os.source.Vector.scratchExtent_, e);
    }
  }
};


/**
 * @param {ol.Feature} feature
 * @suppress {accessControls}
 */
os.source.Vector.prototype.updateIndex = function(feature) {
  if (feature) {
    var extent = os.source.Vector.scratchExtent_;
    extent[0] = Infinity;
    extent[1] = Infinity;
    extent[2] = -Infinity;
    extent[3] = -Infinity;

    os.feature.forEachGeometry(feature, os.source.Vector.updateScratchExtent_);

    if (!ol.extent.isEmpty(extent)) {
      var id = ol.getUid(feature);
      if (id in this.featuresRtree_.items_) {
        this.featuresRtree_.update(extent, feature);
      } else {
        this.featuresRtree_.insert(extent, feature);
      }
    }
  }
};


/**
 * If the provided geometry shape is supported by this source.
 *
 * @param {string} shapeName
 * @return {boolean}
 */
os.source.Vector.prototype.supportsShape = function(shapeName) {
  if (os.style.ELLIPSE_REGEXP.test(shapeName) &&
      (!this.hasColumn(os.Fields.RADIUS) && !this.hasColumn(os.fields.DEFAULT_RADIUS_COL_NAME) &&
      (!this.hasColumn(os.Fields.SEMI_MAJOR) || !this.hasColumn(os.Fields.SEMI_MINOR)) &&
      (!this.hasColumn(os.fields.DEFAULT_SEMI_MAJ_COL_NAME) || !this.hasColumn(os.fields.DEFAULT_SEMI_MIN_COL_NAME)))) {
    return false;
  }

  return true;
};


/**
 * Gets the center geometry shape used by features in the source.
 *
 * @return {string}
 */
os.source.Vector.prototype.getCenterGeometryShape = function() {
  return this.centerGeometryShape_;
};


/**
 * Sets the geometry shape used by features in the source.
 *
 * @param {string} value
 */
os.source.Vector.prototype.setCenterGeometryShape = function(value) {
  this.centerGeometryShape_ = value;
};


/**
 * If the provided geometry shape is an ellipse
 *
 * @param {string} shapeName
 * @return {boolean}
 */
os.source.Vector.prototype.isNotEllipseOrLOBOrDefault = function(shapeName) {
  return !os.style.ELLIPSE_REGEXP.test(shapeName) && !os.style.DEFAULT_REGEXP.test(shapeName) &&
      !os.style.LOB_REGEXP.test(shapeName);
};


/**
 * Fire shape-specific alerts to the user if the source can't appropriately display the shape or if there are any
 * applicable notices.
 *
 * @param {string} value
 * @private
 */
os.source.Vector.prototype.testShapeFields_ = function(value) {
  var am = os.alert.AlertManager.getInstance();
  var now = goog.now();

  if (this.columns.length > 0) {
    if (os.style.ELLIPSE_REGEXP.test(value)) {
      if ((!this.hasColumn(os.fields.DEFAULT_SEMI_MAJ_COL_NAME) || !this.hasColumn(os.fields.DEFAULT_SEMI_MIN_COL_NAME))
          && !this.hasColumn(os.fields.DEFAULT_RADIUS_COL_NAME)) {
        var msg = 'The ' + value + ' style assumes that the SEMI_MAJOR & SEMI_MINOR fields or RADIUS/CEP exist. ' +
            'If not, a point will be shown instead.';
        am.sendAlert(msg, os.alert.AlertEventSeverity.WARNING, this.log, 1);
      } else if (this.lastEllipseNotification_ == 0 || (now - this.lastEllipseNotification_ > 300000)) {
        // only show the alert if we don't have either axis unit column and we don't have a radius units column
        if (!(this.hasColumn(os.Fields.SEMI_MAJOR_UNITS) && this.hasColumn(os.Fields.SEMI_MINOR_UNITS)) &&
            !this.hasColumn(os.Fields.RADIUS_UNITS)) {
          var msg = 'The ' + value + ' style assumes that the SEMI_MAJOR, SEMI_MINOR or RADIUS/CEP fields are in ' +
              'nautical miles. If the values are greater than or equal to 250, they are assumed to be in meters.';
          am.sendAlert(msg, os.alert.AlertEventSeverity.INFO, this.log, 1);

          this.lastEllipseNotification_ = now;
        }
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getId = function() {
  return this.id_;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setId = function(value) {
  if (this.id_ !== value) {
    var old = this.id_;
    this.id_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.ID, value, old));
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.isLoading = function() {
  return this.loading_;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setLoading = function(value) {
  if (this.loading_ !== value) {
    var old = this.loading_;
    this.loading_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.LOADING, value, old));

    var cm = os.load.LoadingManager.getInstance();
    value ? cm.addLoadingTask(this.getId(), this.getTitle()) : cm.removeLoadingTask(this.getId());

    if (!value && this.processTimer) {
      this.processTimer.start();
      this.dispatchEvent(goog.events.EventType.LOAD);
    }
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getColor = function() {
  var layerConf = os.style.StyleManager.getInstance().getLayerConfig(this.getId());
  return /** @type {string} */ (os.style.getConfigColor(layerConf)) || os.style.DEFAULT_LAYER_COLOR;
};


/**
 * @return {os.webgl.AltitudeMode}
 */
os.source.Vector.prototype.getAltitudeMode = function() {
  return this.altitudeMode_;
};


/**
 * @param {os.webgl.AltitudeMode} value
 */
os.source.Vector.prototype.setAltitudeMode = function(value) {
  var old = this.altitudeMode_;
  this.altitudeMode_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.ALTITUDE, value, old));
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.isLockable = function() {
  return this.lockable_;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setLockable = function(value) {
  this.lockable_ = value;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.isLocked = function() {
  return this.locked_;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setLocked = function(value) {
  var old = this.locked_;
  this.locked_ = value;
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.LOCK, value, old));
};


/**
 * @return {number}
 */
os.source.Vector.prototype.getMinDate = function() {
  return this.minDate_;
};


/**
 * @return {number}
 */
os.source.Vector.prototype.getMaxDate = function() {
  return this.maxDate_;
};


/**
 * Gets the layer title
 *
 * @param {boolean=} opt_doNoUseTypeInName turns off the inclusion of the explicit type in the name
 * @return {!string} The title
 * @override
 */
os.source.Vector.prototype.getTitle = function(opt_doNoUseTypeInName) {
  var layer = /** @type {os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(this.getId()));
  var explicitType = !opt_doNoUseTypeInName && layer ? layer.getExplicitType() : '';
  if (explicitType) {
    return this.title_ + ' ' + explicitType;
  } else {
    return this.title_;
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setTitle = function(value) {
  if (this.title_ !== value) {
    var old = this.title_;
    this.title_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.TITLE, value, old));
  }
};


/**
 * If the source has been enabled for animation. When animation/time enabled, the source will start listening
 * to the timeline controller and enable the animation overlay for faster feature rendering.
 *
 * @return {boolean}
 */
os.source.Vector.prototype.getAnimationEnabled = function() {
  return this.animationEnabled_;
};


/**
 * Marks the source as being in the animating state.
 *
 * @param {boolean} value
 */
os.source.Vector.prototype.setAnimationEnabled = function(value) {
  if (this.animationEnabled_ !== value) {
    this.animationEnabled_ = value;
    this.updateAnimationState_();
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.FEATURE_VISIBILITY));
  }
};


/**
 * Sets if animation events are enabled on the source. If enabled, the source will dispatch change events with a map of
 * feature visibility changes on each animation frame.
 *
 * @param {boolean} value
 */
os.source.Vector.prototype.setWebGLEnabled = function(value) {
  this.webGLEnabled = value;

  if (!value) {
    // re-render the layer when switching back to 2D mode
    this.changed();
  }

  if (this.animationOverlay) {
    if (value) {
      // prevent the animation overlay from being rendered on the 2D map
      this.animationOverlay.setMap(null);

      // once the stack clears (and WebGL has been enabled/initialized), fire an animation event to update feature
      // visibility
      goog.async.nextTick(function() {
        this.dispatchAnimationFrame(undefined, this.animationOverlay.getFeatures());
      }, this);
    } else {
      // clear displayed features. the overlay will be used to render them.
      this.dispatchAnimationFrame(this.animationOverlay.getFeatures());

      // set the map so the overlay is rendered again, and fire the change event to trigger a refresh
      this.animationOverlay.setMap(os.MapContainer.getInstance().getMap());
      this.animationOverlay.changed();
    }
  }
};


/**
 * Return the key mapping if there is one
 *
 * @param {string} key
 * @return {boolean}
 */
os.source.Vector.prototype.getSupportsAction = function(key) {
  return this.supportedActions_[key];
};


/**
 * Set the key mapping, extendable for plugins
 *
 * @param {string} key
 * @param {boolean} value
 */
os.source.Vector.prototype.setSupportsAction = function(key, value) {
  this.supportedActions_[key] = value;
};


/**
 * @return {boolean}
 */
os.source.Vector.prototype.hasTimeData = function() {
  return this.minDate_ !== 0 || this.maxDate_ !== 0;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getTimeEnabled = function() {
  return this.timeEnabled_;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setTimeEnabled = function(value) {
  if (this.timeEnabled_ !== value) {
    this.timeEnabled_ = value;

    // correct the animation state and features on the overlay
    this.updateAnimationState_();
    this.updateAnimationOverlay();

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.TIME_ENABLED, value, !value));
  }
};


/**
 * Update the time range of displayed data.
 *
 * @param {os.time.TimeRange} range The new time range
 * @param {boolean=} opt_update If the time model should be updated. Defaults to true, and should be set to false if
 *                              the model will be updated elsewhere.
 *
 * @protected
 */
os.source.Vector.prototype.setDisplayRange = function(range, opt_update) {
  // sources must have a display range, so default to unbounded
  range = range || os.time.UNBOUNDED;

  if (range && this.displayRange_ != range) {
    this.displayRange_ = range;

    var updateModel = opt_update != null ? opt_update : true;
    if (updateModel && this.timeModel) {
      this.timeModel.intersection(range, false, false);
    }
  }
};


/**
 * If added features should replace existing features with the same id.
 *
 * @return {boolean}
 */
os.source.Vector.prototype.getReplaceDuplicates = function() {
  return this.replaceDupes_;
};


/**
 * Set if added features should replace existing features with the same id.
 *
 * @param {boolean} value
 */
os.source.Vector.prototype.setReplaceDuplicates = function(value) {
  this.replaceDupes_ = value;
};


/**
 * Sets if the time filter will be used when calling os.source.Vector#getFilteredFeatures.
 *
 * @param {boolean} value
 */
os.source.Vector.prototype.setTimeFilterEnabled = function(value) {
  if (this.timeFilterEnabled_ != value) {
    this.timeFilterEnabled_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.TIME_FILTER, value, !value));
  }
};


/**
 * Get whether time filtering is enabled.
 *
 * @return {boolean}
 */
os.source.Vector.prototype.getTimeFilterEnabled = function() {
  return this.timeFilterEnabled_;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.isTimeEditEnabled = function() {
  return false;
};


/**
 * Enables/disables the animation overlay. Enabling the overlay will greatly increase animation performance,
 * at the cost of interaction performance when features are off the screen. Interaction performance will be
 * uniform regardless of how many features are within the viewable extent because all features will be drawn
 * on each frame.
 *
 * @private
 */
os.source.Vector.prototype.updateAnimationState_ = function() {
  if (this.animationEnabled_ && this.timeEnabled_) {
    // show data based on the last timeline show event, or all data if there isn't a last event
    var lastEvent = this.tlc.getLastEvent();

    // creating the animation overlay will update the time model
    this.setDisplayRange(lastEvent ? lastEvent.getRange() : os.time.UNBOUNDED, false);
    this.createAnimationOverlay();

    // start listening to timeline events - display data is now affected by the timeline
    this.tlc.listen(os.time.TimelineEventType.SHOW, this.onTimelineShow_, false, this);
    this.tlc.listen(os.time.TimelineEventType.PLAY, this.onTimelinePlayChange_, false, this);
    this.tlc.listen(os.time.TimelineEventType.STOP, this.onTimelinePlayChange_, false, this);
  } else {
    // show data for all time
    this.setDisplayRange(os.time.UNBOUNDED);

    // stop listening to timeline events - displayed data is no longer affected by the timeline
    this.tlc.unlisten(os.time.TimelineEventType.SHOW, this.onTimelineShow_, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.PLAY, this.onTimelinePlayChange_, false, this);
    this.tlc.unlisten(os.time.TimelineEventType.STOP, this.onTimelinePlayChange_, false, this);

    this.disposeAnimationOverlay();
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getHistogram = function(options) {
  var start = options.start;
  var end = options.end;
  var interval = options.interval;

  if (interval > 0) {
    var model = this.getTimeModel();
    if (model && this.getVisible() && this.getTimeEnabled()) {
      var counts = {};
      var lastRange = model.getLastRange();

      var min = Math.floor(start / interval) * interval;
      while (min <= end) {
        var next = min + interval;
        var matches = model.intersection(new os.time.TimeRange(min, next), false, true).length;
        counts[min] = matches;
        min = next;
      }

      // reset time filters on the model to the last used range, or groupData calls will use the last range of this
      // histogram
      if (lastRange) {
        model.intersection(lastRange, false, true);
      }

      if (goog.object.getCount(counts) > 0) {
        var sourceHisto = new os.hist.HistogramData();
        sourceHisto.setId(this.getId());
        sourceHisto.setColor(os.color.toHexString(this.getColor()));
        sourceHisto.setCounts(counts);
        sourceHisto.setOptions(options);
        sourceHisto.setTitle(this.getTitle());
        sourceHisto.setVisible(this.getVisible());
        sourceHisto.setRange(model.getRange());

        return sourceHisto;
      }
    }
  }

  return null;
};


/**
 * Create a new histogram for this source.
 *
 * @param {os.data.histo.SourceHistogram=} opt_parent The parent histogram.
 * @return {!os.data.histo.SourceHistogram}
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.source.Vector.prototype.createHistogram = function(opt_parent) {
  return new os.data.histo.SourceHistogram(this, opt_parent);
};


/**
 * Create a new color model for this source, and a histogram unless one is provided. If a histogram is provided to this
 * function, the reference count on the histogram will be incremented so it *must* be disposed properly by the creator.
 *
 * @param {os.data.histo.SourceHistogram=} opt_histogram The histogram
 * @param {os.data.histo.GradientFn=} opt_gradientFn The gradient function
 * @return {!os.data.histo.ColorModel}
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.source.Vector.prototype.createColorModel = function(opt_histogram, opt_gradientFn) {
  var model = new os.data.histo.ColorModel(opt_gradientFn);
  model.setHistogram(opt_histogram || this.createHistogram());

  return model;
};


/**
 * Get the histogram used to color features on the source.
 *
 * @return {os.data.histo.ColorModel}
 *
 * @export Prevent the compiler from moving the function off the prototype.
 */
os.source.Vector.prototype.getColorModel = function() {
  return this.colorModel;
};


/**
 * Set the histogram used to color features on the source.
 *
 * @param {os.data.histo.ColorModel} model
 */
os.source.Vector.prototype.setColorModel = function(model) {
  if (model !== this.colorModel) {
    if (this.colorModel) {
      this.colorModel.dispose();
      this.colorModel = null;
    }

    this.colorModel = model;

    if (this.colorModel) {
      this.colorModel.listen(goog.events.EventType.PROPERTYCHANGE, this.onColorModelChange_, false, this);
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLOR_MODEL));
  }
};


/**
 * Handle color model change event.
 *
 * @param {os.events.PropertyChangeEvent} event The event
 * @private
 */
os.source.Vector.prototype.onColorModelChange_ = function(event) {
  var p = event.getProperty();
  if (p === os.source.PropertyChange.STYLE) {
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.STYLE));
    this.changed();
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getTimeModel = function() {
  return this.timeModel;
};


/**
 * Reindex the time model with current features/times.
 */
os.source.Vector.prototype.reindexTimeModel = function() {
  if (this.reindexTimer && !this.reindexTimer.isActive()) {
    this.reindexTimer.start();
  }
};


/**
 * Reindex the time model with current features/times.
 * @private
 */
os.source.Vector.prototype.reindexTimeModel_ = function() {
  if (this.timeModel) {
    // process any pending features before reindexing the model to avoid double adds
    this.processNow();

    this.rangeCollections_ = {};
    this.timeModel.clear();
    this.timeModel.add(this.getFeatures());
    this.updateAnimationOverlay();

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.TIME_MODEL));
  }
};


/**
 * Gets the filtered set of features from the source.
 *
 * @param {boolean=} opt_allTime If time bounds should be ignored. If this value differs from the current default,
 *                               intersection will be called twice on the data model! Please use sparingly.
 * @return {Array<ol.Feature>}
 */
os.source.Vector.prototype.getFilteredFeatures = function(opt_allTime) {
  if (this.getVisible() && this.tlc) {
    // ignore time filter if we're animating. this prevents UI's like the list tool from rapidly updating, beyond
    // what is useful to the user.
    var defaultAllTime = !this.timeFilterEnabled_ || this.tlc.isPlaying();
    var allTime = opt_allTime != null ? opt_allTime : defaultAllTime;
    var range = allTime ? os.time.UNBOUNDED : this.displayRange_;
    var features = this.timeModel.intersection(range, true);

    //
    // if allTime was forced via parameter and it differs from the source setting, call intersection again so the
    // crossfilter dimensions are in the correct state for other users of intersection/groupData.
    //
    // this will cause a minor slowdown per call, but if this is called a lot it may noticeably impact performance
    //
    // @see THIN-7810
    //
    if (allTime != defaultAllTime) {
      range = defaultAllTime ? os.time.UNBOUNDED : this.displayRange_;
      this.timeModel.intersection(range, true);
    }

    return features;
  }

  // if the source is hidden, don't return any features
  return [];
};


/**
 * Convenience get features by id
 * @param {string|number|Array<string>|Array<number>} ids
 * @return {!Array<ol.Feature>}
 */
os.source.Vector.prototype.getFeaturesById = function(ids) {
  if (ids == null) {
    return [];
  } else if (!Array.isArray(ids)) {
    ids = [ids];
  }

  return ids.map(this.getFeatureById, this).filter(os.fn.filterFalsey);
};


/**
 * @inheritDoc
 * @suppress {accessControls} To allow direct access to feature id.
 */
os.source.Vector.prototype.isHidden = function(feature) {
  var id = typeof feature == 'string' ? feature : /** @type {string} */ (feature.id_);
  return !this.shownRecordMap[id];
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getVisible = function() {
  return this.visible;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setVisible = function(value) {
  if (value !== this.visible) {
    this.visible = value;
    this.updateAnimationOverlay();
    this.updateLabels();
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.VISIBLE, value, !value));
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.addFeature = function(feature) {
  this.addFeatures([feature]);
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.source.Vector.prototype.addFeatures = function(features) {
  this.clearQueue();

  if (features && features.length > 0) {
    // make sure any features queued for removal are handled before adding new features, or we may get duplicates in
    // the time model
    this.unprocessNow();

    // remove duplicates and process features before adding them to the source
    this.processFeatures(features);

    // we want OpenLayers to skip its default r-tree load since we are doing a better version
    var tree = this.featuresRtree_;
    this.featuresRtree_ = null;

    // add to the source
    os.source.Vector.base(this, 'addFeatures', features);

    // restore r-tree
    this.featuresRtree_ = tree;
  }
};


/**
 * Remove a feature from the source. This intentionally replaces the Openlayers function to support bulk remove.
 *
 * @param {ol.Feature} feature Feature to remove.
 * @param {boolean=} opt_isBulk If this was called by bulk removal
 *
 * @override
 * @suppress {accessControls}
 */
os.source.Vector.prototype.removeFeature = function(feature, opt_isBulk) {
  this.removeFeatureInternal(feature, opt_isBulk);
  this.changed();
};


/**
 * Remove features from the source.
 *
 * @param {!Array<!ol.Feature>} features The features to remove.
 */
os.source.Vector.prototype.removeFeatures = function(features) {
  // reindexing is fairly expensive, so only do it when removing a lot of features
  var reindexRtree = features.length > 10000;

  for (var i = 0, n = features.length; i < n; i++) {
    try {
      this.removeFeature(features[i], reindexRtree);
    } catch (e) {
      // Isn't this typically just 'feature not in layer'? If so, do we care?
    }
  }

  if (reindexRtree) {
    this.reindexRtree_();
  }
};


/**
 * @param {ol.Feature} feature The feature.
 * @param {boolean=} opt_isBulk If this was called by bulk removal
 * @override
 *
 * @suppress {accessControls}
 */
os.source.Vector.prototype.removeFeatureInternal = function(feature, opt_isBulk) {
  if (feature) {
    this.processNow();

    var featureKey = ol.getUid(feature).toString();
    if (featureKey in this.nullGeometryFeatures_) {
      // keeping delete here because it's very rarely used, and ol.source.Vector uses "key in obj" on this map
      delete this.nullGeometryFeatures_[featureKey];
    } else if (!opt_isBulk && this.featuresRtree_) {
      this.featuresRtree_.remove(feature);
    }

    this.featureCount_ = Math.max(this.featureCount_ - 1, 0);
    this.unprocessFeature(feature);

    this.featureChangeKeys_[featureKey].forEach(ol.events.unlistenByKey);
    /** @type {Object} */ (this.featureChangeKeys_)[featureKey] = undefined;

    if (feature.id_ !== undefined) {
      /** @type {Object} */ (this.idIndex_)[feature.id_.toString()] = undefined;
    } else {
      /** @type {Object} */ (this.undefIdIndex_)[featureKey] = undefined;
    }
  }
};


/**
 * Gets the feature count
 *
 * @return {number}
 */
os.source.Vector.prototype.getFeatureCount = function() {
  return this.featureCount_;
};


/**
 * Checks the new features array to see if it will push us past the feature limit.
 *
 * @param {!Array<!ol.Feature>} features The new features.
 */
os.source.Vector.prototype.checkFeatureLimit = function(features) {
  var totalCount = os.data.DataManager.getInstance().getTotalFeatureCount();
  var maxFeatures = os.ogc.getMaxFeatures();

  if (totalCount + features.length >= maxFeatures) {
    // max feature count hit, only add features up to the limit
    try {
      features.length = Math.max(maxFeatures - totalCount, 0);
    } catch (e) {
      // This is to help catch a weird production error to determine the root cause
      // See THIN-12518
      goog.log.error(this.log, 'totalCount ' + totalCount + 'maxFeatures ' + maxFeatures, e);
      features.length = 0;
    }

    os.source.handleMaxFeatureCount(maxFeatures);
  }
};


/**
 * Process a set of features before they're added to the source.
 *
 * @param {!Array<!ol.Feature>} features The features.
 * @protected
 */
os.source.Vector.prototype.processFeatures = function(features) {
  this.checkFeatureLimit(features);

  this.featureCount_ += features.length;

  this.stats_ = {};

  // handle immediate processing on all features
  for (var i = 0, n = features.length; i < n; i++) {
    features[i].suppressEvents();
    this.processImmediate(features[i]);
    features[i].enableEvents();
  }

  // allow features to be preprocessed before they're added to the source
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.PREPROCESS_FEATURES, features));

  // add features to the batch processing queue
  if (this.processTimer) {
    this.processQueue_ = this.processQueue_.concat(features);

    if (!this.webGLEnabled || !this.isLoading()) {
      // when WebGL is enabled, defer the process timer until loading completes to optimize loading performance
      this.processTimer.start();
    }
  }
};


/**
 * Perform processing actions that aren't performance sensitive.
 *
 * @param {!ol.Feature} feature
 * @protected
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.source.Vector.prototype.processImmediate = function(feature) {
  // slickgrid, 3D renderers, and other things depend on features having a unique id. ensure they have one if not
  // already set.
  if (feature.id_ === undefined) {
    feature.setId(ol.getUid(feature));
  }

  // all features are initially visible
  var featureId = /** @type {string} */ (feature.id_);
  this.shownRecordMap[featureId] = true;

  // save the source id on the feature
  feature.values_[os.data.RecordField.SOURCE_ID] = this.getId();

  var geom = feature.getGeometry();

  if (geom) {
    if (geom.getExtent().some(isNaN)) {
      // the underlying RBush implementation in Openlayers chokes on invalid geometries/extents
      feature.setGeometry(null);
    }

    var geomType = geom.getType();
    if (geomType === ol.geom.GeometryType.POINT) {
      // if displaying ellipses, make sure it's generated on the feature
      if (os.style.ELLIPSE_REGEXP.test(this.geometryShape_)) {
        os.feature.createEllipse(feature);
      }

      // sets lat, lon, latdms, londms, and mgrs fields
      os.feature.populateCoordFields(feature);
    } else if (geomType === ol.geom.GeometryType.LINE_STRING ||
        geomType === ol.geom.GeometryType.MULTI_LINE_STRING) {
      // split lines across the date line so they don't draw horizontal lines across the 2D map
      geom.toLonLat();
      geom = os.geo.splitOnDateLine(/** @type {!(ol.geom.LineString|ol.geom.MultiLineString)} */ (geom));
      geom.osTransform();
      feature.setGeometry(geom);
    } else if (!geom.get(os.geom.GeometryField.NORMALIZED)) {
      // normalize non-point geometries unless they were normalized elsewhere
      os.geo2.normalizeGeometryCoordinates(geom);
    }
  }

  os.interpolate.interpolateFeature(feature);

  // make sure the internal feature ID field is set
  if (feature.values_[os.Fields.ID] == null) {
    feature.values_[os.Fields.ID] = featureId;
  }

  // initially set labels to disabled unless the value has been set elsewhere. they will be turned on later based on
  // hit detection.
  if (feature.values_[os.style.StyleField.SHOW_LABELS] == null) {
    feature.values_[os.style.StyleField.SHOW_LABELS] = false;
  }

  // dynamic features are treated differently by animation, so track them in a map
  if (feature instanceof os.feature.DynamicFeature) {
    this.dynamicFeatures_[featureId] = feature;

    if (this.animationOverlay) {
      feature.initDynamic();
      this.addDynamicListener(feature);
    }
  }

  os.style.setFeatureStyle(feature, this);
  this.updateIndex(feature);

  if (this.getDetectColumnTypes()) {
    this.columnTypeDetection_(feature);
  }
};


/**
 * Detects the column types.
 *
 * @param {!ol.Feature} feature
 * @private
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.source.Vector.prototype.columnTypeDetection_ = function(feature) {
  var keys = feature.getKeys();
  keys.forEach(function(col) {
    var value = feature.values_[col];
    var type = typeof (value);

    if (value === '') {
      type = 'empty';
    } else if (type === 'number') {
      type = Math.floor(value) === value ? 'integer' : 'decimal';
    } else if (type === 'string') {
      if (os.string.isFloat(String(value))) {
        value = parseFloat(value);

        if (Math.floor(value) === value) {
          type = 'integer';
        } else {
          type = 'decimal';
        }

        feature.values_[col] = value;
      }
    }

    // keep stats of the different types for each column
    if (!(col in this.stats_)) {
      this.stats_[col] = {};
    }

    if (!(type in this.stats_[col])) {
      this.stats_[col][type] = 0;
    }

    this.stats_[col][type]++;
  }, this);
};


/**
 * Process features in the process queue.
 *
 * @private
 */
os.source.Vector.prototype.onProcessTimer_ = function() {
  if (this.processQueue_ && this.processQueue_.length) {
    var features = this.processQueue_;
    this.processQueue_ = [];
    this.processDeferred(features);
  }
};


/**
 * Perform processing actions that need to be batched for performance reasons.
 *
 * @param {!Array<!ol.Feature>} features
 * @protected
 */
os.source.Vector.prototype.processDeferred = function(features) {
  goog.log.fine(this.log, this.getTitle() + ' processing ' + features.length + ' new features.');

  this.updateColumns(features);

  if (this.timeModel) {
    this.timeModel.add(features);

    var range = this.timeModel.getRange();
    this.minDate_ = range.getStart();
    this.maxDate_ = range.getEnd();
  }

  // clear the range collections so animations will show new features
  this.rangeCollections_ = {};

  this.updateLabels();

  // fire the feature event to update views and WebGL sync
  this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.FEATURES, features));

  // repeat the last timeline event to update which features are displayed
  var lastTimeEvent = this.tlc.getLastEvent();
  if (lastTimeEvent) {
    this.onTimelineShow_(lastTimeEvent);
  }

  var om = os.ui.onboarding.OnboardingManager.getInstance();
  if (om) {
    om.displayOnboarding(os.ROOT + 'onboarding/features.json');
  }
};


/**
 * Fires the deferred unprocess handler immediately to ensure the queue is cleared.
 *
 * @protected
 */
os.source.Vector.prototype.processNow = function() {
  if (this.processTimer) {
    this.processTimer.fire();
  }
};


/**
 * Handle a feature being removed from the source. Always process removed features on a timer
 * because Openlayers doesn't have bulk remove.
 *
 * @param {!ol.Feature} feature
 * @protected
 *
 * @todo Switch this back to unprocessFeatures when (if) Openlayers supports bulk removal and
 *       refactor to work similarly to processFeatures.
 */
os.source.Vector.prototype.unprocessFeature = function(feature) {
  feature.suppressEvents();
  this.unprocessImmediate(feature);
  feature.enableEvents();

  if (this.unprocessTimer) {
    this.unprocessQueue_.push(feature);
    this.unprocessTimer.startIfNotActive();
  }
};


/**
 * Perform processing actions that aren't performance sensitive.
 *
 * @param {!ol.Feature} feature
 * @protected
 *
 * @suppress {accessControls} To allow direct access to feature id.
 */
os.source.Vector.prototype.unprocessImmediate = function(feature) {
  var featureId = /** @type {string} */ (feature.id_);
  this.shownRecordMap[featureId] = undefined;

  if (feature instanceof os.feature.DynamicFeature) {
    this.removeDynamicListener(feature);

    feature.disposeDynamic(true);
    this.dynamicFeatures_[featureId] = undefined;
  }
};


/**
 * @private
 */
os.source.Vector.prototype.onUnprocessTimer_ = function() {
  var features = this.unprocessQueue_;
  this.unprocessQueue_ = [];

  if (features && features.length > 0) {
    this.unprocessDeferred(features);
  }
};


/**
 * Perform unprocessing actions that need to be batched for performance reasons.
 *
 * @param {!Array<!ol.Feature>} features
 * @protected
 *
 * @suppress {accessControls}
 */
os.source.Vector.prototype.unprocessDeferred = function(features) {
  goog.log.fine(this.log, this.getTitle() + ' unprocessing ' + features.length + ' features.');

  // clear the range collections so animations will remove features
  this.rangeCollections_ = {};

  // trim undefined values from maps
  this.shownRecordMap = os.object.prune(this.shownRecordMap);
  this.idIndex_ = os.object.prune(this.idIndex_);
  this.undefIdIndex_ = os.object.prune(this.undefIdIndex_);
  this.dynamicFeatures_ = os.object.prune(this.dynamicFeatures_);
  this.dynamicListeners_ = os.object.prune(this.dynamicListeners_);

  // removed features should never remain in the selection
  this.removeFromSelected(features, true);

  // update the time model from remaining data
  if (this.timeModel) {
    this.timeModel.setData(this.getFeatures());

    var range = this.timeModel.getRange();
    this.minDate_ = range.getStart();
    this.maxDate_ = range.getEnd();
  }

  // refresh displayed labels
  this.updateLabels();

  // repeat the last timeline event to update which features are displayed
  var lastTimeEvent = this.tlc.getLastEvent();
  if (lastTimeEvent) {
    this.onTimelineShow_(lastTimeEvent);
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.FEATURES, undefined, features));
};


/**
 * Fires the deferred unprocess handler immediately to ensure the queue is cleared.
 *
 * @protected
 */
os.source.Vector.prototype.unprocessNow = function() {
  if (this.unprocessTimer && this.unprocessTimer.isActive()) {
    this.unprocessTimer.fire();
  }
};


/**
 * Handle timeline controller show event.
 * @param {os.time.TimelineControllerEvent} event The event.
 * @private
 */
os.source.Vector.prototype.onTimelineShow_ = function(event) {
  if (this.animationEnabled_) {
    this.previousRange_ = this.displayRange_;

    // updating the animation overlay will update the time model
    this.setDisplayRange(event.getRange(), false);

    // this is going to be fired a lot by each source while using the timeline
    this.updateAnimationOverlay();
    this.updateLabels();

    // only dispatch a feature visibility event if the timeline is not playing and time filtering is enabled. this event
    // is used by histograms to update and in either case they will be displaying data for all time
    if (!this.tlc.isPlaying() && this.timeFilterEnabled_) {
      this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.FEATURE_VISIBILITY));
    }
  }
};


/**
 * Fires a visibility change event when the timeline plays/stops so the UI updates appropriately. All data will be
 * displayed while animating to prevent excessive UI updates, and while stopped the data will be filtered.
 *
 * @param {os.time.TimelineControllerEvent} event
 * @private
 */
os.source.Vector.prototype.onTimelinePlayChange_ = function(event) {
  // if the time filter isn't enabled, the play state won't affect feature visibility so don't fire the event
  if (this.timeFilterEnabled_) {
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.FEATURE_VISIBILITY));
  }
};


/**
 * Get the animation overlay.
 *
 * @return {?os.layer.AnimationOverlay}
 */
os.source.Vector.prototype.getAnimationOverlay = function() {
  return this.animationOverlay;
};


/**
 * Creates a basic feature overlay used to animate features on the map.
 *
 * @protected
 */
os.source.Vector.prototype.createAnimationOverlay = function() {
  if (!this.animationOverlay) {
    var layer = os.MapContainer.getInstance().getLayer(this.getId());
    var opacity = /** @type {os.layer.ILayer} */ (layer).getOpacity();
    var zIndex = layer.getZIndex();

    // only set the map in 2D mode. we don't want the overlay to render while in 3D.
    this.animationOverlay = new os.layer.AnimationOverlay({
      map: this.webGLEnabled ? null : os.MapContainer.getInstance().getMap(),
      opacity: opacity,
      zIndex: zIndex
    });

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.ANIMATION_ENABLED, true));

    // initialize animation state for dynamic features
    this.initDynamicAnimation();
  }
};


/**
 * Update the animation fade information
 */
os.source.Vector.prototype.refreshAnimationFade = function() {
  if (this.tlc.getFade()) {
    this.updateAnimationOverlay();
  }
};


/**
 * Fade was toggled on/off. If off, make sure everything is back to opacity of 1
 *
 * @private
 */
os.source.Vector.prototype.fadeToggle_ = function() {
  if (!this.tlc.getFade() && this.previousFade_ && this.animationOverlay) {
    // went from on to off similar to when we close the timeline
    this.updateFadeStyle_(this.animationOverlay.getFeatures(), 1);
    if (this.webGLEnabled) {
      // tell the WebGL synchronizer which features changed visibility
      this.dispatchAnimationFrame(undefined, this.animationOverlay.getFeatures());
    }
  }

  this.previousFade_ = this.tlc.getFade();
};


/**
 * Updates features displayed by the animation overlay if it exists.
 *
 * @protected
 */
os.source.Vector.prototype.updateAnimationOverlay = function() {
  if (this.animationOverlay) {
    if (this.visible) {
      var displayedFeatures = undefined;
      var lookAheadFeatures25 = undefined; // features within 25% of new window
      var lookAheadFeatures50 = undefined; // features within 25-50% of new window
      var lookAheadFeatures75 = undefined; // features within 50-75% of new window
      var lookAheadRange25 = os.time.UNBOUNDED;
      var lookAheadRange50 = os.time.UNBOUNDED;
      var lookAheadRange75 = os.time.UNBOUNDED;
      var displayStart = this.displayRange_.getStart();
      var displayEnd = this.displayRange_.getEnd();
      var windowSize = (displayEnd - displayStart) * .25;
      var lookAhead = false;

      // look for features to fade in/out based on the previous window
      if (this.tlc.getFade() && this.previousRange_ != os.time.UNBOUNDED) {
        if (this.previousRange_.getEnd() < this.displayRange_.getEnd()) {
          // moving forward, get trailing features to fade out
          lookAheadRange25 = new os.time.TimeRange(this.displayRange_.getStart() - windowSize,
              this.displayRange_.getStart());

          lookAheadRange50 = new os.time.TimeRange(lookAheadRange25.getStart() - windowSize,
              lookAheadRange25.getStart());

          lookAheadRange75 = new os.time.TimeRange(lookAheadRange50.getStart() - windowSize,
              lookAheadRange50.getStart());

          displayStart = lookAheadRange75.getStart();
          lookAhead = true;
        } else if (this.previousRange_.getStart() > this.displayRange_.getStart()) {
          // moving backward, get features ahead of current window to fade out
          lookAheadRange25 = new os.time.TimeRange(this.displayRange_.getEnd(),
              this.displayRange_.getEnd() + windowSize);

          lookAheadRange50 = new os.time.TimeRange(lookAheadRange25.getEnd(),
              lookAheadRange25.getEnd() + windowSize);

          lookAheadRange75 = new os.time.TimeRange(lookAheadRange50.getEnd(),
              lookAheadRange50.getEnd() + windowSize);

          displayEnd = lookAheadRange75.getEnd();
          lookAhead = true;
        }
      }

      if (this.tlc.isPlaying()) {
        var rangeKey = this.displayRange_.toISOString();
        if (!(rangeKey in this.rangeCollections_)) {
          this.rangeCollections_[rangeKey] = this.timeModel.intersection(this.displayRange_, true);
        }
        displayedFeatures = this.rangeCollections_[rangeKey];
      } else {
        displayedFeatures = this.timeModel.intersection(this.displayRange_, true);
      }

      // fade out features outside of the window
      if (lookAhead) {
        // make sure all the displayed features are back to 100% opacity
        this.updateFadeStyle_(this.animationOverlay.getFeatures(), 1);

        lookAheadFeatures25 = /** @type {Array<!ol.Feature>} */ (this.timeModel.intersection(lookAheadRange25));
        lookAheadFeatures50 = /** @type {Array<!ol.Feature>} */ (this.timeModel.intersection(lookAheadRange50));
        lookAheadFeatures75 = /** @type {Array<!ol.Feature>} */ (this.timeModel.intersection(lookAheadRange75));

        this.updateFadeStyle_(lookAheadFeatures25, 0.75);
        this.updateFadeStyle_(lookAheadFeatures50, 0.50);
        this.updateFadeStyle_(lookAheadFeatures75, 0.25);

        displayedFeatures = displayedFeatures.concat(lookAheadFeatures25, lookAheadFeatures50, lookAheadFeatures75);
      }

      // dynamic features should always be displayed, so add them if they wouldn't have been returned by the time model
      // intersection
      var hasDynamic = false;
      for (var dynamicId in this.dynamicFeatures_) {
        var dynamicFeature = this.dynamicFeatures_[dynamicId];
        if (dynamicFeature) {
          hasDynamic = true;

          var featureTime = /** @type {os.time.ITime|undefined} */ (dynamicFeature.get(os.data.RecordField.TIME));
          if (featureTime && (featureTime.getStart() > displayEnd || featureTime.getEnd() < displayStart) &&
              !this.isHidden(dynamicFeature)) {
            displayedFeatures.push(dynamicFeature);
          }
        }
      }

      // tell the WebGL synchronizer which features changed visibility
      if (this.webGLEnabled) {
        this.dispatchAnimationFrame(undefined, this.animationOverlay.getFeatures());
        this.dispatchAnimationFrame(this.animationOverlay.getFeatures(), displayedFeatures);
      }

      // update the 2D animation overlay features
      this.animationOverlay.setFeatures(displayedFeatures);

      // update dynamic features. this must happen after WebGL animation frames are dispatched to avoid initial
      // visibility state issues with WebGL.
      for (var dynamicId in this.dynamicFeatures_) {
        var dynamicFeature = this.dynamicFeatures_[dynamicId];
        if (dynamicFeature) {
          dynamicFeature.updateDynamic(displayStart, displayEnd);
        }
      }

      // notify data consumers if dynamic data has changed
      if (hasDynamic) {
        this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.DATA));
      }
    } else {
      this.animationOverlay.setFeatures(undefined);

      if (this.webGLEnabled) {
        // we need to let WebGL know that the layer is now invisible, so hide every feature
        this.dispatchAnimationFrame(this.getFeatures(), []);
      }
    }
  }
};


/**
 * Update all of the features with the specified fade level/opacity. The opacity is set as a feature level parameter,
 * which is multiplied by the layer level opacity before rendering.
 *
 * @param {Array<!ol.Feature>} features
 * @param {number} opacity
 * @private
 *
 * @suppress {checkTypes} To ignore errors caused by ol.style.Style being a struct.
 */
os.source.Vector.prototype.updateFadeStyle_ = function(features, opacity) {
  os.feature.updateFeaturesFadeStyle(features, opacity, this);
};


/**
 * Sets the opacity on the animation overlay. Used to sync the overlay layer with the actual layer.
 *
 * @param {number} value
 */
os.source.Vector.prototype.setOverlayOpacity = function(value) {
  if (this.animationOverlay) {
    this.animationOverlay.setOpacity(value);
  }
};


/**
 * Sets the z-index on the animation overlay. Used to sync the overlay layer with the actual layer.
 *
 * @param {number} value
 */
os.source.Vector.prototype.setOverlayZIndex = function(value) {
  if (this.animationOverlay) {
    this.animationOverlay.setZIndex(value);
  }
};


/**
 * Dispatches an animation frame event with a map of visibility changes.
 *
 * @param {Array<!ol.Feature>=} opt_hide Features to hide
 * @param {Array<!ol.Feature>=} opt_show Features to show
 * @protected
 *
 * @suppress {accessControls} To allow direct access to feature id.
 */
os.source.Vector.prototype.dispatchAnimationFrame = function(opt_hide, opt_show) {
  var changeMap = {};
  if (opt_hide) {
    for (var i = 0, n = opt_hide.length; i < n; i++) {
      changeMap[opt_hide[i].id_] = false;
    }
  }

  if (opt_show) {
    for (var i = 0, n = opt_show.length; i < n; i++) {
      var id = opt_show[i].id_;
      if (id in changeMap && !this.tlc.getFade()) {
        // only remove items if we are not fading anything out
        delete changeMap[id];
      } else {
        changeMap[id] = true;
      }
    }
  }

  this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.ANIMATION_FRAME, changeMap));
};


/**
 * Disposes of the animation overlay and cached features.
 *
 * @protected
 */
os.source.Vector.prototype.disposeAnimationOverlay = function() {
  if (this.animationOverlay) {
    // dispose animation state for dynamic features
    this.disposeDynamicAnimation();

    // remove fade if necessary from the last shown features
    if (this.tlc && this.tlc.getFade()) {
      this.updateFadeStyle_(this.getFeatures(), 1);
      if (this.webGLEnabled) {
        // tell the WebGL synchronizer which features changed visibility
        this.dispatchAnimationFrame(undefined, this.animationOverlay.getFeatures());
      }
    }

    this.animationOverlay.dispose();
    this.animationOverlay = null;
    this.rangeCollections_ = {};

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.ANIMATION_ENABLED, false));
  }
};


/**
 * Set up animation state for dynamic features.
 *
 * @protected
 */
os.source.Vector.prototype.initDynamicAnimation = function() {
  for (var id in this.dynamicFeatures_) {
    var feature = this.dynamicFeatures_[id];
    if (feature) {
      feature.initDynamic();
      this.addDynamicListener(feature);
    }
  }
};


/**
 * Add a listener for a dynamic feature.
 *
 * @param {!ol.Feature} feature The feature.
 * @protected
 *
 * @suppress {accessControls} To allow direct access to feature id.
 */
os.source.Vector.prototype.addDynamicListener = function(feature) {
  // update the overlay when the original geometry changes
  var featureId = /** @type {string} */ (feature.id_);
  var geometry = feature.getGeometry();
  if (geometry) {
    var listenKey = this.dynamicListeners_[featureId];
    if (listenKey) {
      ol.events.unlistenByKey(listenKey);
    }

    // if the original geometry changes, recreate the displayed line
    this.dynamicListeners_[featureId] = ol.events.listen(feature, goog.events.EventType.PROPERTYCHANGE,
        this.onDynamicFeatureChange, this);
  }
};


/**
 * Remove a listener for a dynamic feature.
 *
 * @param {!ol.Feature} feature The feature.
 * @protected
 *
 * @suppress {accessControls} To allow direct access to feature id.
 */
os.source.Vector.prototype.removeDynamicListener = function(feature) {
  // update the overlay when the original geometry changes
  var featureId = /** @type {string} */ (feature.id_);
  var listenKey = this.dynamicListeners_[featureId];
  if (listenKey) {
    ol.events.unlistenByKey(listenKey);
    this.dynamicListeners_[featureId] = undefined;
  }
};


/**
 * Handle dynamic feature property change events.
 *
 * @param {!(os.events.PropertyChangeEvent|ol.events.Event)} event The change event.
 * @protected
 */
os.source.Vector.prototype.onDynamicFeatureChange = function(event) {
  if (event instanceof os.events.PropertyChangeEvent) {
    var p = event.getProperty();
    if (p === os.feature.DynamicPropertyChange.GEOMETRY) {
      // if the original geometry changes, update the dynamic geometry
      var feature = /** @type {os.feature.DynamicFeature} */ (event.target);
      if (feature && feature.isDynamicEnabled) {
        // dispose of the animation geometries
        feature.disposeDynamic(true);
        // and recreate them
        feature.updateDynamic(this.displayRange_.getStart(), this.displayRange_.getEnd());
      }
    }
  }
};


/**
 * Dispose animation state for dynamic features.
 *
 * @protected
 */
os.source.Vector.prototype.disposeDynamicAnimation = function() {
  var hasDynamic = false;
  for (var id in this.dynamicFeatures_) {
    var feature = this.dynamicFeatures_[id];
    if (feature) {
      hasDynamic = true;

      this.removeDynamicListener(feature);
      feature.disposeDynamic();
    }
  }

  this.dynamicListeners_ = {};

  if (hasDynamic) {
    // notify data consumers that the dynamic data has changed
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.DATA));
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getHighlightedItems = function() {
  return this.highlightedItems_;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setHighlightedItems = function(items) {
  if (items !== this.highlightedItems_) {
    var old = this.highlightedItems_;
    if (old) {
      for (var i = 0, n = old.length; i < n; i++) {
        old[i].set(os.style.StyleType.HIGHLIGHT, null);
      }

      os.style.setFeaturesStyle(old, this);
    }

    this.highlightedItems_ = items;

    if (items) {
      var defaultStyle = os.style.DEFAULT_HIGHLIGHT_CONFIG;
      var replace = false;

      if (items.length > 0) {
        var config = os.style.getLayerConfig(items[0], this);
        replace = config ? config[os.style.StyleField.REPLACE_STYLE] : false;
      }

      for (var i = 0, n = items.length; i < n; i++) {
        var customStyle = items[i].get(os.style.StyleType.CUSTOM_HIGHLIGHT);
        var style = replace ? defaultStyle : customStyle || defaultStyle;

        items[i].set(os.style.StyleType.HIGHLIGHT, style);
      }
      os.style.setFeaturesStyle(items, this);
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.HIGHLIGHTED_ITEMS, items, old,
        this));
    this.changed();
  }
};


/**
 * Convenience method highlight by id/array of ids
 * @param {number|Array<number>} ids
 */
os.source.Vector.prototype.highlightById = function(ids) {
  var features = this.getFeaturesById(ids);
  this.setHighlightedItems(features);
};


/**
 * Area selection listener
 *
 * @param {os.ui.action.ActionEvent} event
 * @private
 *
 * @suppress {accessControls|checkTypes} To allow direct access to feature id.
 */
os.source.Vector.prototype.onFeatureAction_ = function(event) {
  var context = event.getContext();

  if (context && os.action) {
    context = !goog.isArray(context) ? [context] : context;

    var features = [];
    for (var i = 0, n = context.length; i < n; i++) {
      if (event.type == os.action.EventType.REMOVE_FEATURE) {
        var feature = /** @type {ol.Feature|undefined} */ (context[i].feature);
        if (feature && this.idIndex_[feature.id_]) {
          features.push(feature);
        }
      } else {
        var geometry = /** @type {ol.geom.Geometry|undefined} */ (context[i].geometry);
        if (geometry) {
          features = features.concat(this.getFeaturesInGeometry(geometry));
        }
      }
    }

    if (features.length > 0) {
      switch (event.type) {
        case os.action.EventType.SELECT:
          this.addToSelected(features);
          break;
        case os.action.EventType.SELECT_EXCLUSIVE:
          this.setSelectedItems(features);
          break;
        case os.action.EventType.DESELECT:
          this.removeFromSelected(features);
          break;
        case os.action.EventType.REMOVE_FEATURE:
        case os.action.EventType.REMOVE_FEATURES:
          if (features) {
            this.removeFeatures(features);
          }
          break;
        default:
          break;
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getFeaturesInExtent = function(extent) {
  // if the source is hidden, don't return any features
  return this.getVisible() ? os.source.Vector.base(this, 'getFeaturesInExtent', extent) : [];
};


/**
 * Get all features inside the provided geometry.
 *
 * @param {!ol.geom.Geometry} geometry The geometry
 * @param {Array<ol.Feature>=} opt_features The list of features to search
 * @return {Array<ol.Feature>}
 */
os.source.Vector.prototype.getFeaturesInGeometry = function(geometry, opt_features) {
  var extent = geometry.getExtent();
  var features = opt_features;
  var isRectangular = false;

  if (!features) {
    if (this.animationEnabled_ && this.timeEnabled_) {
      // when the timeline is up, we have to use the filtered list and rely on JSTS for hit detection. we pass false to
      // ensure we get a filtered list while animating as well.
      features = this.getFilteredFeatures(false);
    } else {
      // features weren't provided, so search all source features. short-circuit on the geometry's extent first so we
      // don't consider features that can't be inside the geometry
      features = this.getFeaturesInExtent(extent);

      // check if the geometry is rectangular. points will not use JSTS for a rectangular area because the above
      // function call will accurately hit detect them.
      var geomType = geometry.getType();
      switch (geomType) {
        case ol.geom.GeometryType.LINE_STRING:
          geometry = /** @type {!ol.geom.LineString} */ (geometry);

          var coords = geometry.getCoordinates();
          isRectangular = os.geo.isRectangular(coords, extent);
          break;
        case ol.geom.GeometryType.POLYGON:
          geometry = /** @type {!ol.geom.Polygon} */ (geometry);

          var coords = geometry.getCoordinates();
          isRectangular = coords.length == 1 && os.geo.isRectangular(coords[0], extent);
          break;
        default:
          break;
      }
    }
  }

  var results = [];
  var jstsGeometry = os.geo.jsts.OLParser.getInstance().read(geometry);
  if (jstsGeometry && features.length > 0) {
    var numCoords = jstsGeometry.getCoordinates().length;
    if (numCoords > 100) {
      // simplify complex geometries to avoid taking a year computing the contained features. the threshold is
      // 0.25%, 0.5% or 1% of the maximum height/width of the geometry's extent. this seemed to be a
      // good compromise between performance and precision.
      var maxDistance = Math.max(ol.extent.getWidth(extent), ol.extent.getHeight(extent));
      var numFeatures = features.length;
      var per = 0;
      per = numFeatures > 10000 ? 0.0025 : per;
      per = numFeatures > 50000 ? 0.005 : per;
      per = numFeatures > 100000 ? 0.01 : per;

      var threshold = maxDistance * per;
      if (threshold > 0) {
        goog.log.fine(this.log, 'Simplifying geometry with ' + numCoords + ' vertices and threshold ' + threshold);
        jstsGeometry = jsts.simplify.DouglasPeuckerSimplifier.simplify(jstsGeometry, threshold);
        goog.log.fine(this.log, 'New geometry: ' + jstsGeometry.getCoordinates().length + ' vertices');
      }
    }

    // multi polygons need to be searched individually.
    // Warning this will not support multi-geometries that are nested inside a multi-geometry.
    // To do so vertX/Y would need to be added to all nested multi-geoms not just one level deep.
    var allGeoms = [];
    if (jstsGeometry.getGeometryType() == ol.geom.GeometryType.MULTI_POLYGON) {
      var nGeometries = jstsGeometry.getNumGeometries();
      for (var i = 0; i < nGeometries; i++) {
        var nextGeom = jstsGeometry.getGeometryN(i);
        if (nextGeom) {
          allGeoms.push(nextGeom);
        }
      }
    } else {
      allGeoms.push(jstsGeometry);
    }

    // create vertices arrays for testing points. these are added to the JSTS geometry so they can be used in the
    // multi geometry sub-tests for points.
    for (var i = 0, n = allGeoms.length; i < n; i++) {
      var vertices = allGeoms[i].getCoordinates();
      allGeoms[i].nVert = vertices.length;
      allGeoms[i].vertX = [];
      allGeoms[i].vertY = [];
      for (var j = 0; j < allGeoms[i].nVert; j++) {
        allGeoms[i].vertX.push(vertices[j].x);
        allGeoms[i].vertY.push(vertices[j].y);
      }
    }

    for (var i = 0, n = features.length; i < n; i++) {
      var testGeo = features[i].getGeometry();
      if (testGeo) {
        if (this.isGeometryInArea_(jstsGeometry, testGeo, isRectangular)) {
          results.push(features[i]);
        }
      }
    }
  }

  return results;
};


/**
 * Tests if a JSTS area (polygon) contains/crosses/overlaps an Openlayers geometry.
 *
 * @param {!jsts.geom.Geometry} area The JSTS geometry
 * @param {!ol.geom.Geometry} geometry The Openlayers geometry
 * @param {boolean=} opt_rectangular If the provided area is a rectangle. This function assumes features have been
 *                                   short-circuited on the area's extent already, so points will be assumed to be
 *                                   matches.
 * @return {boolean}
 * @private
 *
 * Expose {@link ol.geom.SimpleGeometry#flatCoordinates} for points.
 * @suppress {accessControls}
 */
os.source.Vector.prototype.isGeometryInArea_ = function(area, geometry, opt_rectangular) {
  var match = false;
  var proj = os.map.PROJECTION;
  var wrap = proj.canWrapX() && this.getWrapX();
  var projExtent = proj.getExtent();
  var halfWidth = (projExtent[2] - projExtent[0]) / 2;

  var geomType = geometry.getType();
  switch (geomType) {
    case ol.geom.GeometryType.GEOMETRY_COLLECTION:
      // test internal geometries - if one matches the collection matches
      var geometries = /** @type {!ol.geom.GeometryCollection} */ (geometry).getGeometriesArray();
      if (geometries) {
        for (var i = 0, n = geometries.length; i < n; i++) {
          var subGeo = geometries[i];
          if (subGeo && this.isGeometryInArea_(area, subGeo, false)) {
            match = true;
            break;
          }
        }
      }
      break;
    case ol.geom.GeometryType.MULTI_POINT:
      // converting to JSTS will call getPoints anyway, so just do it here and operate on a single point at a time. this
      // can potentially save converting every point to JSTS, assuming an earlier point matches.
      var points = /** @type {!ol.geom.MultiPoint} */ (geometry).getPoints();
      if (points) {
        for (var i = 0, n = points.length; i < n; i++) {
          // this forces JSTS because the extent short-circuit is applied to the multi geometry.
          var point = points[i];
          if (point && this.isGeometryInArea_(area, point, false)) {
            match = true;
            break;
          }
        }
      }
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      // converting to JSTS will call getPoints anyway, so just do it here and operate on a single point at a time. this
      // can potentially save converting every point to JSTS, assuming an earlier point matches.
      var polys = /** @type {!ol.geom.MultiPolygon} */ (geometry).getPolygons();
      if (polys) {
        for (var i = 0, n = polys.length; i < n; i++) {
          var poly = polys[i];
          if (poly && this.isGeometryInArea_(area, poly, false)) {
            match = true;
            break;
          }
        }
      }
      break;
    case ol.geom.GeometryType.LINE_STRING:
    case ol.geom.GeometryType.LINEAR_RING:
    case ol.geom.GeometryType.POLYGON:
    case ol.geom.GeometryType.CIRCLE:
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      geometry = geometry.clone();
      geometry.set(os.geom.GeometryField.NORMALIZED, false);
      os.geo2.normalizeGeometryCoordinates(geometry, area.getCoordinates()[0].x);
      var jstsGeometry = os.geo.jsts.OLParser.getInstance().read(geometry);
      match = jstsGeometry != null &&
          (area.contains(jstsGeometry) || area.crosses(jstsGeometry) || area.overlaps(jstsGeometry));
      break;
    case ol.geom.GeometryType.POINT:
      var x = /** @type {!ol.geom.Point} */ (geometry).flatCoordinates[0];
      var y = /** @type {!ol.geom.Point} */ (geometry).flatCoordinates[1];

      // multipolygons need to be checked individually
      var jstsAreas = [];
      if (area.getGeometryType() == ol.geom.GeometryType.MULTI_POLYGON) {
        var nGeometries = area.getNumGeometries();
        for (var i = 0; i < nGeometries; i++) {
          var nextArea = area.getGeometryN(i);
          if (nextArea) {
            jstsAreas.push(nextArea);
          }
        }
      } else {
        jstsAreas.push(area);
      }

      for (i = 0, n = jstsAreas.length; i < n; i++) {
        if (wrap) {
          var first = jstsAreas[i].vertX[0];
          x = os.geo2.normalizeLongitude(x, first - halfWidth, first + halfWidth);
        }

        if (opt_rectangular || os.geo.isCoordInArea(x, y, jstsAreas[i].vertX, jstsAreas[i].vertY, jstsAreas[i].nVert)) {
          match = true;
          break;
        }
        match = false;
      }
      break;
    default:
      break;
  }

  return match;
};


/**
 * @inheritDoc
 *
 * Inlined everything for performance reasons. Function calls are too expensive for how often this can be called.
 * @suppress {checkTypes}
 */
os.source.Vector.prototype.isSelected = function(feature) {
  var id = typeof feature == 'object' ? feature['id'] : feature;
  return id in this.selectedById_;
};


/**
 * Convenience check for whether something in array is selected
 *
 * @param {Array<!ol.Feature>} features
 * @return {boolean|undefined} All == true; partial === undefined; none === false
 * @suppress {checkTypes}
 */
os.source.Vector.prototype.isSelectedArray = function(features) {
  var l = features.length;
  if (!l || !(Object.keys(this.selectedById_).length)) {
    // nothing selected, don't bother
    return false;
  }
  var value = this.selectedById_[features[0]['id']];
  for (var i = 1; i < l; i++) {
    if (!value != !this.selectedById_[features[i]['id']]) {
      // previous wasn't selected but this one is (or vice versa)
      return undefined;
    }
  }
  return value || false;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.forEachFeature = function(callback, opt_this) {
  // The Openlayers default is to run this over the RBush. However, that only iterates over features with geometries.
  // Sources can contain tabular vector data without geometries, so we'll do this instead.
  this.getFeatures().forEach(callback, opt_this);
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getSelectedItems = function() {
  return this.selected_.slice();
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.setSelectedItems = function(items) {
  if (!goog.isArray(items)) {
    items = [items];
  }

  if (this.selected_ !== items) {
    var old = this.selected_.slice();
    this.selected_.length = 0;

    var i = old.length;
    while (i--) {
      this.deselect(old[i]);
    }

    if (items && items.length > 0) {
      i = items.length;
      while (i--) {
        this.select(items[i]);
      }
    }

    // update styles for all modified features
    os.style.setFeaturesStyle(old, this);
    os.style.setFeaturesStyle(this.selected_, this);

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.events.SelectionType.CHANGED, this.selected_, old));
    this.changed();
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.addToSelected = function(features) {
  if (!goog.isArray(features)) {
    features = [features];
  }

  if (features && features.length > 0) {
    var added = [];
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];
      if (this.select(feature)) {
        added.push(feature);
      }
    }

    if (added.length > 0) {
      // update styles for all features added to the selection
      os.style.setFeaturesStyle(added, this);
      this.dispatchEvent(new os.events.PropertyChangeEvent(os.events.SelectionType.ADDED, added));
      this.changed();
    }
  }
};


/**
 * @override
 * @param {!ol.Feature|Array<!ol.Feature>} features
 * @param {boolean=} opt_skipStyle
 */
os.source.Vector.prototype.removeFromSelected = function(features, opt_skipStyle) {
  if (!goog.isArray(features)) {
    features = [features];
  }

  if (features && features.length > 0) {
    var removed = [];
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];
      if (this.deselect(feature)) {
        removed.push(feature);
      }
    }

    if (removed.length > 0) {
      // update styles for all features removed from the selection
      if (opt_skipStyle !== true) {
        os.style.setFeaturesStyle(removed, this);
      }

      this.dispatchEvent(new os.events.PropertyChangeEvent(os.events.SelectionType.REMOVED, removed));
      this.changed();
    }
  }
};


/**
 * Invert the current selection
 */
os.source.Vector.prototype.invertSelection = function() {
  var selected = this.selected_.slice();
  this.selectAll();
  this.removeFromSelected(selected);
};


/**
 * Convenience method select by id/array of ids
 * @param {number|Array<number>} ids
 * @param {boolean=} opt_deselect
 */
os.source.Vector.prototype.selectById = function(ids, opt_deselect) {
  var features = this.getFeaturesById(ids);
  if (opt_deselect) {
    this.removeFromSelected(features);
  } else {
    this.addToSelected(features);
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.selectAll = function() {
  var added = [];
  var features = this.getFilteredFeatures();
  for (var i = 0, n = features.length; i < n; i++) {
    // only select items that are not already selected
    if (this.select(features[i])) {
      added.push(features[i]);
    }
  }

  if (added.length > 0) {
    // update styles on all features that were not previously selected
    os.style.setFeaturesStyle(added, this);

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.events.SelectionType.ADDED, added));
    this.changed();
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.selectNone = function() {
  var i = this.selected_.length;
  if (i > 0) {
    var selected = this.selected_.slice();
    this.selected_.length = 0;
    this.selectedById_ = {};

    // remove selection style from selected items
    while (i--) {
      selected[i].set(os.style.StyleType.SELECT, null);
    }

    // update styles for all features that were previously selected
    os.style.setFeaturesStyle(selected, this);

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.events.SelectionType.REMOVED, selected));
    this.changed();
  }
};


/**
 * Select a feature in the source.
 *
 * @param {ol.Feature} feature
 * @return {boolean} If the feature was added to the selection.
 * @protected
 * @suppress {accessControls|checkTypes}
 */
os.source.Vector.prototype.select = function(feature) {
  if (feature) {
    // our selection map uses the 'id' field because that's what slickgrid references. our selection array uses the id_
    // field because it's typically a faster value to compare.
    //
    // THIN-6499 added a check to make sure the feature is shown to avoid having to filter out hidden features when
    // the timeline is closed. we want to use the rbush in that case, which doesn't consider shown/hidden.
    var id = /** @type {string} */ (feature['id']);
    if (id != null && !this.selectedById_[id] &&
        feature.id_ != null && this.idIndex_[feature.id_] && this.shownRecordMap[feature.id_]) {
      goog.array.binaryInsert(this.selected_, feature, os.feature.idCompare);
      this.selectedById_[id] = true;
      feature.set(os.style.StyleType.SELECT, os.style.DEFAULT_SELECT_CONFIG);
      return true;
    }
  }

  return false;
};


/**
 * Deselect a feature in the source.
 *
 * @param {ol.Feature} feature Feature to deselect
 * @return {boolean} If the feature was added to the selection.
 * @protected
 * @suppress {checkTypes}
 */
os.source.Vector.prototype.deselect = function(feature) {
  if (feature) {
    var id = /** @type {string} */ (feature['id']);
    if (id != null && this.selectedById_[id]) {
      goog.array.binaryRemove(this.selected_, feature, os.feature.idCompare);
      delete this.selectedById_[id];
      feature.set(os.style.StyleType.SELECT, null);
      return true;
    }
  }

  return false;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.displayAll = function() {
  this.showFeatures(this.getFeatures());
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.hideAll = function() {
  this.hideFeatures(this.getFeatures());
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.hideFeatures = function(features) {
  if (!goog.isArray(features)) {
    features = [features];
  }

  this.updateFeaturesVisibility(features, false);
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.showFeatures = function(features) {
  if (!goog.isArray(features)) {
    features = [features];
  }

  this.updateFeaturesVisibility(features, true);
};


/**
 * Convenience method hide by id/array of ids
 * @param {number|Array<number>} ids
 * @param {boolean=} opt_show
 */
os.source.Vector.prototype.hideById = function(ids, opt_show) {
  var features = this.getFeaturesById(ids);
  if (opt_show) {
    this.showFeatures(features);
  } else {
    this.hideFeatures(features);
  }
};


/**
 * Convenience show only the given features; hide others; maintain selection on visible features
 *
 * @param {!ol.Feature|Array<!ol.Feature>} features
 */
os.source.Vector.prototype.setVisibleFeatures = function(features) {
  if (!goog.isArray(features)) {
    features = [features];
  }

  var selected = [];
  if (this.selected_.length > 0) {
    features.forEach(function(v) {
      if (this.selectedById_[v.id]) {
        selected.push(v);
      }
    }.bind(this));
  }

  this.updateFeaturesVisibility(this.getFeatures(), false);
  this.updateFeaturesVisibility(features, true);

  if (selected.length) {
    this.setSelectedItems(selected);
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.hideSelected = function() {
  this.hideFeatures(this.selected_);
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.hideUnselected = function() {
  this.hideFeatures(this.getUnselectedItems());
};


/**
 * @inheritDoc
 *
 * @suppress {accessControls} To allow direct access to feature id.
 */
os.source.Vector.prototype.getHiddenItems = function() {
  var map = this.shownRecordMap;
  return this.getFeatures().filter(function(feature) {
    return feature && !map[/** @type {string} */ (feature.id_)];
  });
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.getUnselectedItems = function() {
  return this.getFilteredFeatures().filter(function(feature) {
    return feature && !this.isSelected(feature);
  }, this);
};


/**
 * @param {Array<ol.Feature>} features
 * @param {boolean} visible
 * @protected
 *
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.source.Vector.prototype.updateFeaturesVisibility = function(features, visible) {
  var changed = [];
  var hidden = [];

  // always update labels when showing features. if hiding features, only update them if features displaying a label
  // are hidden.
  var updateLabels = visible;

  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];
    var featureId = /** @type {string} */ (feature.id_);
    if (featureId != null && visible != this.shownRecordMap[featureId]) {
      this.shownRecordMap[featureId] = visible;

      if (!visible) {
        // check if the label needs to be hidden
        if (os.feature.hideLabel(feature)) {
          feature.values_[os.style.StyleField.LAST_SHOW_LABELS] = true;
          updateLabels = true;
        }

        hidden.push(feature);
      } else if (feature.values_[os.style.StyleField.LAST_SHOW_LABELS]) {
        // label was shown before the feature was hidden, so show it again. this is intended for labels that are not
        // managed by hit detection
        os.feature.showLabel(feature);
        feature.values_[os.style.StyleField.LAST_SHOW_LABELS] = undefined;
        updateLabels = true;
      }

      changed.push(feature);
    }
  }

  if (hidden.length > 0) {
    this.removeFromSelected(hidden);
  }

  if (changed.length > 0) {
    // reset the visibility filter so the data will be reindexed
    if (this.timeModel) {
      this.timeModel.addDimension('hidden', this.isHidden.bind(this));
      this.timeModel.filterDimension('hidden', false);
      this.rangeCollections_ = {};
      this.updateAnimationOverlay();
    }

    // one or more labels changed, so run hit detection
    if (updateLabels) {
      this.updateLabels();
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.FEATURE_VISIBILITY, changed));
  }
};


/**
 * Triggers an application label update if this source is configured to show labels.
 *
 * @protected
 */
os.source.Vector.prototype.updateLabels = function() {
  // if this source has a label field configured, update which labels should be shown
  var config = os.style.StyleManager.getInstance().getLayerConfig(this.getId());
  if (config && config[os.style.StyleField.LABELS] && config[os.style.StyleField.SHOW_LABELS]) {
    os.style.label.updateShown();
  }
};


/**
 * Handler for a feature being hovered on the map.
 *
 * @param {ol.Feature} feature The feature
 */
os.source.Vector.prototype.handleFeatureHover = function(feature) {
  if (this.hoverHandler_ == null || !this.hoverHandler_(feature)) {
    this.defaultFeatureHover_(feature);
  }
};


/**
 * Set the feature hover handler function.
 *
 * @param {os.source.FeatureHoverFn=} opt_fn The handler function
 * @param {T=} opt_context The this context for the handler
 * @template T
 */
os.source.Vector.prototype.setHoverHandler = function(opt_fn, opt_context) {
  var fn = opt_fn || undefined;
  var ctx = opt_context || this;
  this.hoverHandler_ = fn !== undefined ? fn.bind(ctx) : undefined;
};


/**
 * Default feature hover handler. Highlights the feature.
 *
 * @param {ol.Feature} feature The hovered feature.
 * @private
 */
os.source.Vector.prototype.defaultFeatureHover_ = function(feature) {
  this.setHighlightedItems(feature ? [feature] : null);
};


/**
 * Gets the unique ID used by features in the source.
 *
 * @return {os.data.ColumnDefinition}
 */
os.source.Vector.prototype.getUniqueId = function() {
  return this.uniqueId_;
};


/**
 * Sets the unique ID used by features in the source.
 *
 * @param {os.data.ColumnDefinition} value
 */
os.source.Vector.prototype.setUniqueId = function(value) {
  if (this.uniqueId_ !== value) {
    var old = this.uniqueId_;
    this.uniqueId_ = value;
    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.UNIQUE_ID, value, old));
  }
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.persist = function(opt_to) {
  var options = opt_to || {};
  options['shapeName'] = this.getGeometryShape();
  options['centerShapeName'] = this.getCenterGeometryShape();
  options['timeEnabled'] = this.getTimeEnabled();
  options['altitudeMode'] = this.getAltitudeMode();
  options['refreshInterval'] = this.refreshInterval;

  if (this.uniqueId_) {
    options['uniqueId'] = this.uniqueId_.persist();
  }

  if (this.colorModel) {
    options['colorModel'] = this.colorModel.persist();
  }

  return options;
};


/**
 * @inheritDoc
 */
os.source.Vector.prototype.restore = function(config) {
  if (config['shapeName']) {
    this.setGeometryShape(config['shapeName']);
  }

  if (config['centerShapeName']) {
    this.setCenterGeometryShape(config['centerShapeName']);
  }

  if (config['timeEnabled'] != undefined) {
    this.setTimeEnabled(config['timeEnabled']);
  }

  if (config['columnDetectLimit'] != null) {
    this.setColumnAutoDetectLimit(config['columnDetectLimit']);
  }

  if (config['altitudeMode'] != undefined) {
    this.setAltitudeMode(config['altitudeMode']);
  }

  if (config['refreshInterval']) {
    this.setRefreshInterval(config['refreshInterval']);
  }

  if (config['colorModel']) {
    var colorModel = this.createColorModel();
    colorModel.restore(config['colorModel']);

    this.setColorModel(colorModel);
  }

  if (config['uniqueId']) {
    var columnDef = new os.data.ColumnDefinition();
    columnDef.restore(config['uniqueId']);
    this.setUniqueId(columnDef);
  }

  if (config['detectColumnTypes']) {
    this.setDetectColumnTypes(config['detectColumnTypes']);
  }
};

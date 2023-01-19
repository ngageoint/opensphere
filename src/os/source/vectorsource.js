goog.declareModuleId('os.source.Vector');

import Collection from 'ol/src/Collection.js';
import OLEventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import {extend, createEmpty, getWidth, getHeight, isEmpty} from 'ol/src/extent.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import OLVectorSource, {VectorSourceEvent} from 'ol/src/source/Vector.js';
import VectorEventType from 'ol/src/source/VectorEventType.js';
import {getUid} from 'ol/src/util.js';

import '../mixin/rbushmixin.js';
import EventType from '../action/eventtype.js';
import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import {registerClass} from '../classregistry.js';
import {toHexString} from '../color.js';
import ColumnDefinition from '../data/columndefinition.js';
import DataManager from '../data/datamanager.js';
import ColorModel from '../data/histo/colormodel.js';
import SourceHistogram from '../data/histo/sourcehistogram.js';
import RecordField from '../data/recordfield.js';
import * as dispatcher from '../dispatcher.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import SelectionType from '../events/selectiontype.js';
import * as osExtent from '../extent.js';
import DynamicFeature from '../feature/dynamicfeature.js';
import DynamicPropertyChange from '../feature/dynamicpropertychange.js';
import * as osFeature from '../feature/feature.js';
import Fields from '../fields/fields.js';
import * as fields from '../fields/index.js';
import {filterFalsey} from '../fn/fn.js';
import {isCoordInArea, isRectangular, splitOnDateLine} from '../geo/geo.js';
import {normalizeGeometryCoordinates, normalizeLongitude} from '../geo/geo2.js';
import OLParser from '../geo/olparser.js';
import GeometryField from '../geom/geometryfield.js';
import HistogramData from '../hist/histogramdata.js';
import IHistogramProvider from '../hist/ihistogramprovider.js';
import IAnimationSupport from '../ianimationsupport.js';
import osImplements from '../implements.js';
import {ORIGINAL_GEOM_FIELD, interpolateFeature} from '../interpolate.js';
import AnimationOverlay from '../layer/animationoverlay.js';
import LoadingManager from '../load/loadingmanager.js';
import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import {getValueExtractor, prune} from '../object/object.js';
import {getMaxFeatures} from '../ogc/ogc.js';
import {ROOT} from '../os.js';
import {isFloat} from '../string/string.js';
import {updateShown} from '../style/label.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleManager from '../style/stylemanager_shim.js';
import StyleType from '../style/styletype.js';
import TimelineController from '../time/timelinecontroller.js';
import TimelineEventType from '../time/timelineeventtype.js';
import TimeRange from '../time/timerange.js';
import TimeModel from '../time/xf/timemodel.js';
import OnboardingManager from '../ui/onboarding/onboardingmanager.js';
import {autoSizeAndSortColumns, isUserModified, restore as restoreColumns} from '../ui/slick/column.js';
import AltitudeMode from '../webgl/altitudemode.js';
import IModifiableSource from './imodifiablesource.js';
import ISource from './isource.js';
import PropertyChange from './propertychange.js';
import {RefreshTimers, getHoldRecordTime, getRecordTime, handleMaxFeatureCount} from './source.js';
import SourceClass from './sourceclass.js';
import * as sourceColumn from './sourcecolumn.js';

const Timer = goog.require('goog.Timer');
const {binaryInsert, binaryRemove, removeDuplicates} = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const nextTick = goog.require('goog.async.nextTick');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');

const Logger = goog.requireType('goog.log.Logger');
const histo = goog.requireType('os.data.histo');
const {LOBOptions} = goog.requireType('os.feature');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {FeatureHoverFn} = goog.requireType('os.source');
const {default: ITime} = goog.requireType('os.time.ITime');
const {default: TimelineControllerEvent} = goog.requireType('os.time.TimelineControllerEvent');
const {default: ActionEvent} = goog.requireType('os.ui.action.ActionEvent');


/**
 * @implements {IAnimationSupport}
 * @implements {ISource}
 * @implements {IHistogramProvider}
 * @implements {IModifiableSource}
 */
export default class Vector extends OLVectorSource {
  /**
   * Constructor.
   * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
   */
  constructor(opt_options) {
    // remove things from our layer options that we don't want managed by ol3
    const options = opt_options ? Object.assign({}, opt_options) : {};
    delete options['url'];

    // features will be added at the end of this constructor's execution via addFeaturesFromOptions_
    const pendingFeatures = options.features;
    if (pendingFeatures) {
      delete options.features;
    }

    super(options);

    /**
     * The logger to use for the source.
     * @type {Logger}
     * @protected
     */
    this.log = logger;

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
     * @type {!Array<!ColumnDefinition>}
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
    this.geometryShape_ = osStyle.DEFAULT_SHAPE;

    /**
     * @type {string}
     * @private
     */
    this.centerGeometryShape_ = osStyle.DEFAULT_CENTER_SHAPE;

    /**
     * @type {number}
     * @private
     */
    this.lastEllipseNotification_ = 0;

    /**
     * If the source is enabled.
     * @type {boolean}
     * @private
     */
    this.enabled_ = true;

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
    this.setSupportsAction(EventType.GOTO, true);
    this.setSupportsAction(EventType.IDENTIFY, true);
    this.setSupportsAction(EventType.BUFFER, true);
    this.setSupportsAction(EventType.EXPORT, true);
    this.setSupportsAction(EventType.CLEAR_SELECTION, true);

    /**
     * @type {boolean}
     * @private
     */
    this.timeEnabled_ = false;

    /**
     * Histogram used to time filter data in the source.
     * @type {TimeModel}
     * @protected
     */
    this.timeModel = new TimeModel(getRecordTime, getHoldRecordTime);

    /**
     * Histogram used to color features in the source.
     * @type {ColorModel}
     * @protected
     */
    this.colorModel = null;

    /**
     * @type {boolean}
     * @protected
     */
    this.visible = true;

    /**
     * @type {Array<!Feature>}
     * @private
     */
    this.highlightedItems_ = null;

    /**
     * @type {!Array<!Feature>}
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
     * @type {!Array<!Feature>}
     * @private
     */
    this.processQueue_ = [];

    /**
     * Delay to handle bulk processing of new features as they're added to the source. This vastly improves time model
     * insertion performance.
     * @type {Delay}
     * @protected
     */
    this.processTimer = new Delay(this.onProcessTimer_, 250, this);

    /**
     * Array of features waiting to be unprocessed.
     * @type {!Array<!Feature>}
     * @private
     */
    this.unprocessQueue_ = [];

    /**
     * Delay to handle bulk unprocessing of features as they're removed from the source.
     * @type {Delay}
     * @protected
     */
    this.unprocessTimer = new Delay(this.onUnprocessTimer_, 250, this);

    /**
     * Delay to reduce frequency of reindexing the time model.
     * @type {Delay}
     * @protected
     */
    this.reindexTimer = new Delay(this.reindexTimeModel_, 100, this);

    /**
     * @type {TimelineController}
     * @protected
     */
    this.tlc = TimelineController.getInstance();

    /**
     * @type {?AnimationOverlay}
     * @protected
     */
    this.animationOverlay = null;

    /**
     * Map of dynamic features that update on every animation frame.
     * @type {!Object<string, (DynamicFeature|undefined)>}
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
     * @type {!Object<string, Array<Feature>>}
     * @private
     */
    this.rangeCollections_ = {};

    /**
     * @type {!TimeRange}
     * @private
     */
    this.displayRange_ = TimeRange.UNBOUNDED;

    /**
     * @type {!TimeRange}
     * @private
     */
    this.previousRange_ = TimeRange.UNBOUNDED;

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
     * @type {FeatureHoverFn|undefined}
     * @private
     */
    this.hoverHandler_ = options['hoverHandler'] || undefined;

    /**
     * @type {boolean}
     * @private
     */
    this.lockable_ = false;

    /**
     * @type {AltitudeMode}
     * @private
     */
    this.altitudeMode_ = AltitudeMode.ABSOLUTE;

    /**
     * How often the source will automatically refresh itself.
     * @type {number}
     * @protected
     */
    this.refreshInterval = 0;

    /**
     * The delay used to auto refresh the source.
     * @type {Timer}
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
     * @type {?Array<Feature>}
     */
    this.toClear = null;

    /**
     * Unique ID column.
     * @type {?ColumnDefinition}
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

    /**
     * Flag for whether this source supports modify.
     * @type {boolean}
     * @protected
     */
    this.canModify = true;

    /**
     * Flag for whether this source has pending modifications.
     * @type {boolean}
     * @protected
     */
    this.hasModifications = false;

    if (!options['disableAreaSelection']) {
      dispatcher.getInstance().listen(EventType.SELECT, this.onFeatureAction_, false, this);
      dispatcher.getInstance().listen(EventType.SELECT_EXCLUSIVE, this.onFeatureAction_, false, this);
      dispatcher.getInstance().listen(EventType.DESELECT, this.onFeatureAction_, false, this);
      dispatcher.getInstance().listen(EventType.REMOVE_FEATURE, this.onFeatureAction_, false, this);
      dispatcher.getInstance().listen(EventType.REMOVE_FEATURES, this.onFeatureAction_, false, this);
    }

    this.tlc.listen(TimelineEventType.FADE_TOGGLE, this.fadeToggle_, false, this);
    this.tlc.listen(TimelineEventType.HOLD_RANGE_CHANGED, this.reindexTimeModel, false, this);

    this.addFeaturesFromOptions_(pendingFeatures);
  }

  /**
   * Add pending features from the source options.
   *
   * This code was copied from the OL source to defer adding features from the options until the end of this
   * constructor's execution.
   *
   * @param {Array<Feature>|Collection<Feature>|undefined} pendingFeatures The pending features.
   * @private
   *
   * @suppress {accessControls} To allow access to private properties/methods.
   */
  addFeaturesFromOptions_(pendingFeatures) {
    if (pendingFeatures) {
      let collection;
      let features;
      if (pendingFeatures instanceof Collection) {
        collection = pendingFeatures;
        features = collection.getArray();
      } else if (Array.isArray(pendingFeatures)) {
        features = pendingFeatures;
      }
      // replaced useSpatialIndex check from the original code with a featuresRtree_ check
      if (!this.featuresRtree_ && collection === undefined) {
        collection = new Collection(features);
      }
      if (features !== undefined) {
        this.addFeaturesInternal(features);
      }
      if (collection !== undefined) {
        this.bindFeaturesCollection_(collection);
      }
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.refreshTimer) {
      this.refreshTimer.unlisten(Timer.TICK, this.onRefreshTimer, false, this);
      this.refreshTimer = null;
    }

    dispatcher.getInstance().unlisten(EventType.SELECT, this.onFeatureAction_, false, this);
    dispatcher.getInstance().unlisten(EventType.DESELECT, this.onFeatureAction_, false, this);
    dispatcher.getInstance().unlisten(EventType.SELECT_EXCLUSIVE, this.onFeatureAction_, false, this);
    dispatcher.getInstance().unlisten(EventType.REMOVE_FEATURE, this.onFeatureAction_, false, this);
    dispatcher.getInstance().unlisten(EventType.REMOVE_FEATURES, this.onFeatureAction_, false, this);

    this.tlc.unlisten(TimelineEventType.SHOW, this.onTimelineShow_, false, this);
    this.tlc.unlisten(TimelineEventType.FADE_TOGGLE, this.fadeToggle_, false, this);
    this.tlc.unlisten(TimelineEventType.HOLD_RANGE_CHANGED, this.reindexTimeModel, false, this);
    this.tlc = null;

    this.disposeAnimationOverlay();

    dispose(this.processTimer);
    this.processTimer = null;
    this.processQueue_.length = 0;

    dispose(this.unprocessTimer);
    this.unprocessTimer = null;
    this.unprocessQueue_.length = 0;

    dispose(this.reindexTimer);
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
  }

  /**
   * @inheritDoc
   */
  changed() {
    if (!this.webGLEnabled) {
      // skip this in 3D mode to prevent Openlayers from drawing anything that isn't being displayed
      super.changed();

      if (this.animationOverlay) {
        // make sure features are rendered on the overlay if it exists
        this.animationOverlay.changed();
      }
    }
  }

  /**
   * The listeners Openlayers adds are never used, and are a waste of memory. This trims some fat off each feature.
   *
   * @param {string} featureKey
   * @param {Feature} feature
   * @override
   *
   * @suppress {accessControls|duplicate|unusedPrivateMembers}
   * @see THIN-4494
   */
  setupChangeEvents_(featureKey, feature) {
    // these listeners have been disabled for performance reasons. the original removeFeatureInternal has an assertion
    // to make sure featureChangeKeys_ has an entry for the feature id, so we remove that as well.
    this.featureChangeKeys_[featureKey] = [
      listen(feature, OLEventType.CHANGE, this.handleFeatureChange_, this)
    ];
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  clear(opt_fast) {
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

      var clearEvent = new VectorSourceEvent(VectorEventType.CLEAR);
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
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.CLEARED));
    }
  }

  /**
   * Clears any features in the toClear queue
   */
  clearQueue() {
    if (this.toClear) {
      this.removeFeatures(this.toClear);
      this.toClear = null;
    }
  }

  /**
   * Reindex the R-tree. This should *only* be done in place of removing a large number of features from the tree since
   * there is no bulk removal endpoint.
   *
   * @private
   * @suppress {accessControls}
   */
  reindexRtree_() {
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
  }

  /**
   * @inheritDoc
   */
  isRefreshEnabled() {
    return this.refreshEnabled;
  }

  /**
   * @inheritDoc
   */
  getRefreshInterval() {
    return this.refreshInterval;
  }

  /**
   * @inheritDoc
   */
  setRefreshInterval(value) {
    if (this.refreshInterval != value) {
      this.refreshInterval = value;

      if (this.refreshTimer) {
        this.refreshTimer.unlisten(Timer.TICK, this.onRefreshTimer, false, this);
        if (!this.refreshTimer.hasListener()) {
          // nobody's listening, so stop it
          this.refreshTimer.stop();
        }
      }

      this.refreshTimer = null;

      if (this.refreshInterval > 0) {
        this.refreshTimer = RefreshTimers[value];

        if (!this.refreshTimer) {
          // didn't find one for that time, so make a new one and save it off
          this.refreshTimer = new Timer(1000 * value);
          RefreshTimers[value] = this.refreshTimer;
        }

        this.refreshTimer.listen(Timer.TICK, this.onRefreshTimer, false, this);
        this.refreshTimer.start();
      }

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.REFRESH_INTERVAL));
    }
  }

  /**
   * Refreshes the source on refresh timer tick.
   */
  onRefreshTimer() {
    // if the source is still loading from a previous user-driven action, don't refresh it until the next timer tick
    if (this.isRefreshEnabled() && !this.isLoading()) {
      this.refresh();
    }
  }

  /**
   * @inheritDoc
   */
  refresh() {}

  /**
   * @inheritDoc
   */
  getColumns() {
    return this.columns.slice();
  }

  /**
   * @inheritDoc
   */
  getColumnsArray() {
    return this.columns;
  }

  /**
   * Get columns that do not contain data on any features in the source.
   *
   * @return {!Array<!ColumnDefinition>}
   *
   * @suppress {accessControls}
   */
  getEmptyColumns() {
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
          if (!isEmptyOrWhitespace(makeSafe(features[i].values_[empty[j]['field']]))) {
            // if a value is encountered, remove the column so it's no longer considered
            empty.splice(j, 1);
          }
        }
      }
    }

    return empty;
  }

  /**
   * @inheritDoc
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  setColumns(columns) {
    if (columns) {
      this.externalColumns = true;

      // ensure all columns are column definition objects
      this.columns = columns.map(sourceColumn.mapStringOrDef);

      // add defaults columns
      sourceColumn.addDefaults(this);

      // test for shape support
      this.testShapeFields_(this.geometryShape_);

      // clean up the columns
      this.processColumns();
    }
  }

  /**
   * Adds a column to the source if a matching one doesn't exist already.
   *
   * @param {string} field The data field for the column.
   * @param {string=} opt_header Optional header. If not specified, field will be used instead.
   * @param {boolean=} opt_temp Optional flag for temp columns. Defaults to false.
   * @param {boolean=} opt_event Optional flag to fire the property change event.
   */
  addColumn(field, opt_header, opt_temp, opt_event) {
    if (!this.hasColumn(field)) {
      var column = sourceColumn.create(field, opt_header, opt_temp);
      this.columns.push(column);

      if (opt_event) {
        this.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLUMN_ADDED, column));
      }
    }
  }

  /**
   * Gets a flag to determine whether to attempt to convert feature data to a type.
   *
   * @return {boolean}
   */
  getDetectColumnTypes() {
    return this.detectColumnTypes_;
  }

  /**
   * Sets a flag to determine whether to attempt to convert feature data to a type.
   *
   * @param {boolean} value
   */
  setDetectColumnTypes(value) {
    this.detectColumnTypes_ = value;
  }

  /**
   * Perform cleanup actions on columns.
   *
   * @param {boolean=} opt_silent If events should not be dispatched.
   * @protected
   */
  processColumns(opt_silent) {
    if (this.columns) {
      // remove any duplicates
      var colByName = /** @type {function((ColumnDefinition|string)):string} */ (getValueExtractor('name'));
      removeDuplicates(this.columns, this.columns, colByName);

      var descriptor = DataManager.getInstance().getDescriptor(this.getId());
      if (descriptor) {
        // restore descriptor column information to the source columns
        var descriptorColumns = descriptor.getColumns();
        if (descriptorColumns) {
          restoreColumns(descriptorColumns, this.columns);
        }
      }

      this.columns.forEach(function(column) {
        // mark internal columns that were derived from another
        fields.markDerived(column);

        // add custom formatters
        sourceColumn.addFormatter(column);

        // update the column type based on the data
        if (!googObject.isEmpty(this.stats_)) {
          var types = this.stats_[column['name']];

          if (types) {
            // ignore the empty data
            googObject.remove(types, 'empty');

            if (googObject.getCount(types) == 1) {
              column['type'] = googObject.getAnyKey(types);
            } else if (googObject.getCount(types) == 2) {
              if (googObject.containsKey(types, 'integer') && googObject.containsKey(types, 'decimal')) {
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
      if (!this.columns.some(isUserModified)) {
        // initialize sort/widths
        this.columns.sort(autoSizeAndSortColumns);

        this.columns.forEach(function(column) {
          // hide specific columns by default
          fields.hideSpecialColumns(column);
        });
      }

      // detect and apply an icon rotation column
      if (this.hasColumn(Fields.BEARING)) {
        var styleConfig = StyleManager.getInstance().getLayerConfig(this.getId());
        if (styleConfig && !styleConfig[StyleField.ROTATION_COLUMN]) {
          styleConfig[StyleField.ROTATION_COLUMN] = Fields.BEARING;
        }
      }

      // notify that columns have changed
      if (!opt_silent) {
        this.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLUMNS, this.columns));
      }
    }
  }

  /**
   * Make updates to columns based on feature properties
   *
   * @param {!Array<!Feature>} features
   * @protected
   * @suppress {accessControls}
   */
  updateColumns(features) {
    if (!this.externalColumns && features.length > 0) {
      var change = false;
      var feature = null;

      for (var i = 0; i < features.length; i++) {
        feature = features[i];
        var properties = feature.values_;
        for (var key in properties) {
          if (!this.hasColumn(key) && !osFeature.isInternalField(key)) {
            this.addColumn(key);
            change = true;
          } else if (key === RecordField.TIME && !this.hasColumn(RecordField.TIME)) {
            // a time column was mapped, so add it to the source if there isn't one
            var column = sourceColumn.create(RecordField.TIME, 'TIME');
            this.columns.unshift(column); // always keep record time over any other TIME column
            change = true;
          }
        }
      }

      if (change) {
        this.processColumns();
      }
    }
  }

  /**
   * Searches for a column on the source.
   *
   * @param {string|ColumnDefinition} value
   * @return {boolean}
   */
  hasColumn(value) {
    var field = null;
    if (typeof value === 'string') {
      field = value;
    } else if (goog.isObject(value)) {
      field = /** @type {ColumnDefinition} */ (value)['field'];
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
  }

  /**
   * Gets the column limit used to determine how many features to check for unique column keys
   *
   * @return {number}
   */
  getColumnAutoDetectLimit() {
    return this.columnAutoDetectLimit;
  }

  /**
   * Sets the column limit used to determine how many features to check for unique column keys
   *
   * @param {number} value
   */
  setColumnAutoDetectLimit(value) {
    this.columnAutoDetectLimit = value;
  }

  /**
   * Sets the colors of the provided features; uses the ColorModel's colorFeatures() if it exists, otherwise
   * does a fast-color on the Features directly.
   *
   * @param {Array<!Feature>|null} items
   * @param {string=} opt_color rgba-color or clear with a null or undefined (which colormodel treats differently)
   *
   * @suppress {accessControls}
   */
  setColor(items, opt_color) {
    if (!items) return;
    if (!this.colorModel) this.setColorModel(this.createColorModel());
    if (this.colorModel) {
      this.colorModel.colorFeatures(items, opt_color);
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.STYLE));
      this.changed();
    }
  }

  /**
   * Gets the geometry shape used by features in the source.
   *
   * @return {string}
   */
  getGeometryShape() {
    return this.geometryShape_;
  }

  /**
   * Sets the geometry shape used by features in the source.
   *
   * @param {string} value
   */
  setGeometryShape(value) {
    var oldGeomShape = this.geometryShape_;
    this.geometryShape_ = value;
    this.testShapeFields_(value);

    // we are converting to an ellipse shape
    var ellipseTest = osStyle.ELLIPSE_REGEXP.test(value);
    // we are converting to a lob shape
    var lobTest = osStyle.LOB_REGEXP.test(value);
    // we are converting back from an ellipse or lob shape and need to reindex the original
    var revertIndexTest = osStyle.ELLIPSE_REGEXP.test(oldGeomShape) || osStyle.LOB_REGEXP.test(oldGeomShape);

    if (ellipseTest || lobTest || revertIndexTest) {
      var features = this.getFeatures();
      var layerConf = StyleManager.getInstance().getLayerConfig(this.getId());
      var lobOptions = /** type {LOBOptions} */ ({
        arrowLength: layerConf[StyleField.ARROW_SIZE],
        arrowUnits: layerConf[StyleField.ARROW_UNITS],
        bearingColumn: layerConf[StyleField.LOB_BEARING_COLUMN],
        bearingError: layerConf[StyleField.LOB_BEARING_ERROR],
        bearingErrorColumn: layerConf[StyleField.LOB_BEARING_ERROR_COLUMN],
        columnLength: layerConf[StyleField.LOB_COLUMN_LENGTH],
        length: layerConf[StyleField.LOB_LENGTH],
        lengthType: layerConf[StyleField.LOB_LENGTH_TYPE],
        lengthColumn: layerConf[StyleField.LOB_LENGTH_COLUMN],
        lengthUnits: layerConf[StyleField.LOB_LENGTH_UNITS],
        lengthError: layerConf[StyleField.LOB_LENGTH_ERROR],
        lengthErrorColumn: layerConf[StyleField.LOB_LENGTH_ERROR_COLUMN],
        lengthErrorUnits: layerConf[StyleField.LOB_LENGTH_ERROR_UNITS],
        showArrow: layerConf[StyleField.SHOW_ARROW],
        showEllipse: layerConf[StyleField.SHOW_ELLIPSE],
        showError: layerConf[StyleField.SHOW_ERROR]
      });

      for (var i = 0, n = features.length; i < n; i++) {
        var geoms = [features[i].getGeometry()];

        if (ellipseTest) {
          osFeature.createEllipse(features[i]);
          geoms.push(/** @type {Geometry} */ (features[i].get(RecordField.ELLIPSE)));
        }

        if (lobTest) {
          osFeature.createLineOfBearing(features[i], true, lobOptions);
        }

        this.updateIndex(features[i]);
      }
    }
  }

  /**
   * @param {Feature} feature
   * @suppress {accessControls}
   */
  updateIndex(feature) {
    if (feature && this.featuresRtree_) {
      var extent = scratchExtent;
      extent[0] = Infinity;
      extent[1] = Infinity;
      extent[2] = -Infinity;
      extent[3] = -Infinity;

      osFeature.forEachGeometry(feature, Vector.updateScratchExtent_);

      if (!isEmpty(extent)) {
        var id = getUid(feature);
        if (id in this.featuresRtree_.items_) {
          this.featuresRtree_.update(extent, feature);
        } else {
          this.featuresRtree_.insert(extent, feature);
        }
      }
    }
  }

  /**
   * If the provided geometry shape is supported by this source.
   *
   * @param {string} shapeName
   * @return {boolean}
   */
  supportsShape(shapeName) {
    if (osStyle.ELLIPSE_REGEXP.test(shapeName) &&
        (!this.hasColumn(Fields.RADIUS) && !this.hasColumn(fields.DEFAULT_RADIUS_COL_NAME) &&
        (!this.hasColumn(Fields.SEMI_MAJOR) || !this.hasColumn(Fields.SEMI_MINOR)) &&
        (!this.hasColumn(fields.DEFAULT_SEMI_MAJ_COL_NAME) || !this.hasColumn(fields.DEFAULT_SEMI_MIN_COL_NAME)))) {
      return false;
    }

    return true;
  }

  /**
   * Gets the center geometry shape used by features in the source.
   *
   * @return {string}
   */
  getCenterGeometryShape() {
    return this.centerGeometryShape_;
  }

  /**
   * Sets the geometry shape used by features in the source.
   *
   * @param {string} value
   */
  setCenterGeometryShape(value) {
    this.centerGeometryShape_ = value;
  }

  /**
   * If the provided geometry shape is an ellipse
   *
   * @param {string} shapeName
   * @return {boolean}
   */
  isNotEllipseOrLOBOrDefault(shapeName) {
    return !osStyle.ELLIPSE_REGEXP.test(shapeName) && !osStyle.DEFAULT_REGEXP.test(shapeName) &&
        !osStyle.LOB_REGEXP.test(shapeName);
  }

  /**
   * Fire shape-specific alerts to the user if the source can't appropriately display the shape or if there are any
   * applicable notices.
   *
   * @param {string} value
   * @private
   */
  testShapeFields_(value) {
    var am = AlertManager.getInstance();
    var now = Date.now();

    if (this.columns.length > 0) {
      if (osStyle.ELLIPSE_REGEXP.test(value)) {
        if ((!this.hasColumn(fields.DEFAULT_SEMI_MAJ_COL_NAME) ||
            !this.hasColumn(fields.DEFAULT_SEMI_MIN_COL_NAME)) &&
            !this.hasColumn(fields.DEFAULT_RADIUS_COL_NAME)) {
          var msg = 'The ' + value + ' style assumes that the SEMI_MAJOR & SEMI_MINOR fields or RADIUS/CEP exist. ' +
              'If not, a point will be shown instead.';
          am.sendAlert(msg, AlertEventSeverity.WARNING, this.log, 1);
        } else if (this.lastEllipseNotification_ == 0 || (now - this.lastEllipseNotification_ > 300000)) {
          // only show the alert if we don't have either axis unit column and we don't have a radius units column
          if (!(this.hasColumn(Fields.SEMI_MAJOR_UNITS) && this.hasColumn(Fields.SEMI_MINOR_UNITS)) &&
              !this.hasColumn(Fields.RADIUS_UNITS)) {
            var msg = 'The ' + value + ' style assumes that the SEMI_MAJOR, SEMI_MINOR or RADIUS/CEP fields are in ' +
                'nautical miles. If the values are greater than or equal to 250, they are assumed to be in meters.';
            am.sendAlert(msg, AlertEventSeverity.INFO, this.log, 1);

            this.lastEllipseNotification_ = now;
          }
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  setId(value) {
    if (this.id_ !== value) {
      var old = this.id_;
      this.id_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ID, value, old));
    }
  }

  /**
   * @inheritDoc
   */
  isEnabled() {
    return this.enabled_;
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    if (this.enabled_ !== value) {
      this.enabled_ = value;
      this.setEnabledInternal(value);
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ENABLED, value, !value));
    }
  }

  /**
   * Perform internal source actions when the enabled state changes.
   * @param {boolean} value The new value.
   * @protected
   */
  setEnabledInternal(value) {
    if (value) {
      this.refresh();
    } else {
      this.setLocked(false);
      this.clear();
    }
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    return this.loading_;
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    if (this.loading_ !== value) {
      var old = this.loading_;
      this.loading_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.LOADING, value, old));

      var cm = LoadingManager.getInstance();
      value ? cm.addLoadingTask(this.getId(), this.getTitle()) : cm.removeLoadingTask(this.getId());

      if (!value && this.processTimer) {
        this.processTimer.start();
        this.dispatchEvent(GoogEventType.LOAD);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getColor() {
    var layerConf = StyleManager.getInstance().getLayerConfig(this.getId());
    return (
      /** @type {string} */ (osStyle.getConfigColor(layerConf)) || osStyle.DEFAULT_LAYER_COLOR
    );
  }

  /**
   * @return {AltitudeMode}
   */
  getAltitudeMode() {
    return this.altitudeMode_;
  }

  /**
   * @param {AltitudeMode} value
   */
  setAltitudeMode(value) {
    var old = this.altitudeMode_;
    this.altitudeMode_ = value;
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ALTITUDE, value, old));
  }

  /**
   * @inheritDoc
   */
  isLockable() {
    return this.lockable_;
  }

  /**
   * @inheritDoc
   */
  setLockable(value) {
    this.lockable_ = value;
  }

  /**
   * @inheritDoc
   */
  isLocked() {
    return this.locked_;
  }

  /**
   * @inheritDoc
   */
  setLocked(value) {
    if (this.locked_ !== value) {
      this.locked_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.LOCK, value, !value));
    }
  }

  /**
   * @return {number}
   */
  getMinDate() {
    return this.minDate_;
  }

  /**
   * @return {number}
   */
  getMaxDate() {
    return this.maxDate_;
  }

  /**
   * Gets the layer title
   *
   * @param {boolean=} opt_doNoUseTypeInName turns off the inclusion of the explicit type in the name
   * @return {!string} The title
   * @override
   */
  getTitle(opt_doNoUseTypeInName) {
    var layer = /** @type {ILayer} */ (getMapContainer().getLayer(this.getId()));
    var explicitType = !opt_doNoUseTypeInName && layer ? layer.getExplicitType() : '';
    if (explicitType) {
      return this.title_ + ' ' + explicitType;
    } else {
      return this.title_;
    }
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    if (this.title_ !== value) {
      var old = this.title_;
      this.title_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TITLE, value, old));
    }
  }

  /**
   * If the source has been enabled for animation. When animation/time enabled, the source will start listening
   * to the timeline controller and enable the animation overlay for faster feature rendering.
   *
   * @return {boolean}
   * @override
   */
  getAnimationEnabled() {
    return this.animationEnabled_;
  }

  /**
   * Marks the source as being in the animating state.
   *
   * @param {boolean} value
   * @override
   */
  setAnimationEnabled(value) {
    if (this.animationEnabled_ !== value) {
      this.animationEnabled_ = value;
      this.updateAnimationState_();
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.FEATURE_VISIBILITY));
    }
  }

  /**
   * Sets if animation events are enabled on the source. If enabled, the source will dispatch change events with a map of
   * feature visibility changes on each animation frame.
   *
   * @param {boolean} value
   */
  setWebGLEnabled(value) {
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
        nextTick(() => {
          this.dispatchAnimationFrame(undefined, this.animationOverlay.getFeatures());
        });
      } else {
        // clear displayed features. the overlay will be used to render them.
        this.dispatchAnimationFrame(this.animationOverlay.getFeatures());

        // set the map so the overlay is rendered again, and fire the change event to trigger a refresh
        this.animationOverlay.setMap(getMapContainer().getMap());
        this.animationOverlay.changed();
      }
    }
  }

  /**
   * Return the key mapping if there is one
   *
   * @param {string} key
   * @return {boolean}
   */
  getSupportsAction(key) {
    return this.supportedActions_[key];
  }

  /**
   * Set the key mapping, extendable for plugins
   *
   * @param {string} key
   * @param {boolean} value
   */
  setSupportsAction(key, value) {
    this.supportedActions_[key] = value;
  }

  /**
   * @return {boolean}
   */
  hasTimeData() {
    return this.minDate_ !== 0 || this.maxDate_ !== 0;
  }

  /**
   * @inheritDoc
   */
  getTimeEnabled() {
    return this.timeEnabled_;
  }

  /**
   * @inheritDoc
   */
  setTimeEnabled(value) {
    if (this.timeEnabled_ !== value) {
      this.timeEnabled_ = value;

      // correct the animation state and features on the overlay
      this.updateAnimationState_();
      this.updateAnimationOverlay();

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TIME_ENABLED, value, !value));
    }
  }

  /**
   * Update the time range of displayed data.
   *
   * @param {TimeRange} range The new time range
   * @param {boolean=} opt_update If the time model should be updated. Defaults to true, and should be set to false if
   *                              the model will be updated elsewhere.
   *
   * @protected
   */
  setDisplayRange(range, opt_update) {
    // sources must have a display range, so default to unbounded
    range = range || TimeRange.UNBOUNDED;

    if (range && this.displayRange_ != range) {
      this.displayRange_ = range;

      var updateModel = opt_update != null ? opt_update : true;
      if (updateModel && this.timeModel) {
        this.timeModel.intersection(range, false, false);
      }
    }
  }

  /**
   * If added features should replace existing features with the same id.
   *
   * @return {boolean}
   */
  getReplaceDuplicates() {
    return this.replaceDupes_;
  }

  /**
   * Set if added features should replace existing features with the same id.
   *
   * @param {boolean} value
   */
  setReplaceDuplicates(value) {
    this.replaceDupes_ = value;
  }

  /**
   * Sets if the time filter will be used when calling source.Vector#getFilteredFeatures.
   *
   * @param {boolean} value
   */
  setTimeFilterEnabled(value) {
    if (this.timeFilterEnabled_ != value) {
      this.timeFilterEnabled_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TIME_FILTER, value, !value));
    }
  }

  /**
   * Get whether time filtering is enabled.
   *
   * @return {boolean}
   */
  getTimeFilterEnabled() {
    return this.timeFilterEnabled_;
  }

  /**
   * @inheritDoc
   */
  isTimeEditEnabled() {
    return false;
  }

  /**
   * Enables/disables the animation overlay. Enabling the overlay will greatly increase animation performance,
   * at the cost of interaction performance when features are off the screen. Interaction performance will be
   * uniform regardless of how many features are within the viewable extent because all features will be drawn
   * on each frame.
   *
   * @private
   */
  updateAnimationState_() {
    if (this.animationEnabled_ && this.timeEnabled_) {
      // show data based on the last timeline show event, or all data if there isn't a last event
      var lastEvent = this.tlc.getLastEvent();

      // creating the animation overlay will update the time model
      this.setDisplayRange(lastEvent ? lastEvent.getRange() : TimeRange.UNBOUNDED, false);
      this.createAnimationOverlay();

      // start listening to timeline events - display data is now affected by the timeline
      this.tlc.listen(TimelineEventType.SHOW, this.onTimelineShow_, false, this);
      this.tlc.listen(TimelineEventType.PLAY, this.onTimelinePlayChange_, false, this);
      this.tlc.listen(TimelineEventType.STOP, this.onTimelinePlayChange_, false, this);
    } else {
      // show data for all time
      this.setDisplayRange(TimeRange.UNBOUNDED);

      // stop listening to timeline events - displayed data is no longer affected by the timeline
      this.tlc.unlisten(TimelineEventType.SHOW, this.onTimelineShow_, false, this);
      this.tlc.unlisten(TimelineEventType.PLAY, this.onTimelinePlayChange_, false, this);
      this.tlc.unlisten(TimelineEventType.STOP, this.onTimelinePlayChange_, false, this);

      this.disposeAnimationOverlay();
    }
  }

  /**
   * @inheritDoc
   */
  getHistogram(options) {
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
          var matches = model.intersection(new TimeRange(min, next), false, true).length;
          counts[min] = matches;
          min = next;
        }

        // reset time filters on the model to the last used range, or groupData calls will use the last range of this
        // histogram
        if (lastRange) {
          model.intersection(lastRange, false, true);
        }

        if (googObject.getCount(counts) > 0) {
          var sourceHisto = new HistogramData();
          sourceHisto.setId(this.getId());
          sourceHisto.setColor(toHexString(this.getColor()));
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
  }

  /**
   * Create a new histogram for this source.
   *
   * @param {SourceHistogram=} opt_parent The parent histogram.
   * @return {!SourceHistogram}
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  createHistogram(opt_parent) {
    return new SourceHistogram(this, opt_parent);
  }

  /**
   * Create a new color model for this source, and a histogram unless one is provided. If a histogram is provided to this
   * function, the reference count on the histogram will be incremented so it *must* be disposed properly by the creator.
   *
   * @param {SourceHistogram=} opt_histogram The histogram
   * @param {histo.GradientFn=} opt_gradientFn The gradient function
   * @return {!ColorModel}
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  createColorModel(opt_histogram, opt_gradientFn) {
    var model = new ColorModel(opt_gradientFn);
    model.setHistogram(opt_histogram || this.createHistogram());

    return model;
  }

  /**
   * Check for a color model or manually colored items in the Source
   *
   * @return {boolean}
   */
  hasColors() {
    return (this.colorModel != null);
  }

  /**
   * Get the histogram used to color features on the source.
   *
   * @return {ColorModel}
   *
   * @export Prevent the compiler from moving the function off the prototype.
   */
  getColorModel() {
    return this.colorModel;
  }

  /**
   * Set the histogram used to color features on the source.
   *
   * @param {ColorModel} model
   */
  setColorModel(model) {
    // update the color model
    if (model !== this.colorModel) {
      if (this.colorModel) {
        this.colorModel.dispose();
        this.colorModel = null;
      }

      this.colorModel = model;

      if (this.colorModel) {
        this.colorModel.listen(GoogEventType.PROPERTYCHANGE, this.onColorModelChange_, false, this);
      }

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLOR_MODEL));
    }
  }

  /**
   * Handle color model change event.
   *
   * @param {PropertyChangeEvent} event The event
   * @private
   */
  onColorModelChange_(event) {
    var p = event.getProperty();
    if (p === PropertyChange.STYLE) {
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.STYLE));
      this.changed();
    }
  }

  /**
   * @inheritDoc
   */
  getTimeModel() {
    return this.timeModel;
  }

  /**
   * Reindex the time model with current features/times.
   */
  reindexTimeModel() {
    if (this.reindexTimer && !this.reindexTimer.isActive()) {
      this.reindexTimer.start();
    }
  }

  /**
   * Reindex the time model with current features/times.
   * @private
   */
  reindexTimeModel_() {
    if (this.timeModel) {
      // process any pending features before reindexing the model to avoid double adds
      this.processNow();

      this.rangeCollections_ = {};
      this.timeModel.clear();
      this.timeModel.add(this.getFeatures());
      this.updateAnimationOverlay();

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TIME_MODEL));
    }
  }

  /**
   * Gets the filtered set of features from the source.
   *
   * @param {boolean=} opt_allTime If time bounds should be ignored. If this value differs from the current default,
   *                               intersection will be called twice on the data model! Please use sparingly.
   * @return {Array<Feature>}
   */
  getFilteredFeatures(opt_allTime) {
    if (this.getVisible() && this.tlc) {
      // ignore time filter if we're animating. this prevents UI's like the list tool from rapidly updating, beyond
      // what is useful to the user.
      var defaultAllTime = !this.timeFilterEnabled_ || this.tlc.isPlaying();
      var allTime = opt_allTime != null ? opt_allTime : defaultAllTime;
      var range = allTime ? TimeRange.UNBOUNDED : this.displayRange_;
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
        range = defaultAllTime ? TimeRange.UNBOUNDED : this.displayRange_;
        this.timeModel.intersection(range, true);
      }

      return features;
    }

    // if the source is hidden, don't return any features
    return [];
  }

  /**
   * Convenience get features by id
   * @param {string|number|Array<string>|Array<number>} ids
   * @return {!Array<Feature>}
   */
  getFeaturesById(ids) {
    if (ids == null) {
      return [];
    } else if (!Array.isArray(ids)) {
      ids = [ids];
    }

    return ids.map(this.getFeatureById, this).filter(filterFalsey);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow direct access to feature id.
   */
  isHidden(feature) {
    var id = typeof feature == 'string' ? feature : /** @type {string} */ (feature.id_);
    return !this.shownRecordMap[id];
  }

  /**
   * @inheritDoc
   */
  getVisible() {
    return this.visible;
  }

  /**
   * @inheritDoc
   */
  setVisible(value) {
    if (value !== this.visible) {
      this.visible = value;
      this.updateAnimationOverlay();
      this.updateLabels();
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.VISIBLE, value, !value));
    }
  }

  /**
   * @inheritDoc
   */
  addFeature(feature) {
    this.addFeatures([feature]);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  addFeatures(features) {
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
      super.addFeatures(features);

      // restore r-tree
      this.featuresRtree_ = tree;
    }
  }

  /**
   * Remove a feature from the source. This intentionally replaces the Openlayers function to support bulk remove.
   *
   * @param {Feature} feature Feature to remove.
   * @param {boolean=} opt_isBulk If this was called by bulk removal
   *
   * @override
   * @suppress {accessControls}
   */
  removeFeature(feature, opt_isBulk) {
    this.removeFeatureInternal(feature, opt_isBulk);
    this.changed();
  }

  /**
   * Remove features from the source.
   *
   * @param {!Array<!Feature>} features The features to remove.
   */
  removeFeatures(features) {
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
  }

  /**
   * @param {Feature} feature The feature.
   * @param {boolean=} opt_isBulk If this was called by bulk removal
   * @override
   *
   * @suppress {accessControls}
   */
  removeFeatureInternal(feature, opt_isBulk) {
    const featureKey = getUid(feature).toString();

    if (feature && this.featureChangeKeys_[featureKey]) {
      this.processNow();

      if (featureKey in this.nullGeometryFeatures_) {
        // keeping delete here because it's very rarely used, and OLVectorSource uses "key in obj" on this map
        delete this.nullGeometryFeatures_[featureKey];
      } else if (!opt_isBulk && this.featuresRtree_) {
        this.featuresRtree_.remove(feature);
      } else if (!this.featuresRtree_) {
        this.dispatchEvent(new VectorSourceEvent(
            VectorEventType.REMOVEFEATURE, feature));
      }

      this.featureCount_ = Math.max(this.featureCount_ - 1, 0);
      this.unprocessFeature(feature);

      this.featureChangeKeys_[featureKey].forEach(unlistenByKey);
      /** @type {Object} */ (this.featureChangeKeys_)[featureKey] = undefined;

      if (feature.id_ !== undefined) {
        /** @type {Object} */ (this.idIndex_)[feature.id_.toString()] = undefined;
      } else {
        /** @type {Object} */ (this.undefIdIndex_)[featureKey] = undefined;
      }
    }
  }

  /**
   * Gets the feature count
   *
   * @return {number}
   */
  getFeatureCount() {
    return this.featureCount_;
  }

  /**
   * Checks the new features array to see if it will push us past the feature limit.
   *
   * @param {!Array<!Feature>} features The new features.
   */
  checkFeatureLimit(features) {
    var totalCount = DataManager.getInstance().getTotalFeatureCount();
    var maxFeatures = getMaxFeatures();

    if (totalCount + features.length >= maxFeatures) {
      // max feature count hit, only add features up to the limit
      try {
        features.length = Math.max(maxFeatures - totalCount, 0);
      } catch (e) {
        // This is to help catch a weird production error to determine the root cause
        // See THIN-12518
        log.error(this.log, 'totalCount ' + totalCount + 'maxFeatures ' + maxFeatures, e);
        features.length = 0;
      }

      handleMaxFeatureCount(maxFeatures);
    }
  }

  /**
   * Process a set of features before they're added to the source.
   *
   * @param {!Array<!Feature>} features The features.
   * @protected
   */
  processFeatures(features) {
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
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.PREPROCESS_FEATURES, features));

    // add features to the batch processing queue
    if (this.processTimer) {
      this.processQueue_ = this.processQueue_.concat(features);

      if (!this.webGLEnabled || !this.isLoading()) {
        // when WebGL is enabled, defer the process timer until loading completes to optimize loading performance
        this.processTimer.start();
      }
    }
  }

  /**
   * Perform processing actions that aren't performance sensitive.
   *
   * @param {!Feature} feature
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  processImmediate(feature) {
    // slickgrid, 3D renderers, and other things depend on features having a unique id. ensure they have one if not
    // already set.
    if (feature.id_ === undefined) {
      feature.setId(getUid(feature));
    }

    // all features are initially visible
    var featureId = /** @type {string} */ (feature.id_);
    this.shownRecordMap[featureId] = true;

    if (!feature.values_) {
      feature.values_ = {};
    }

    // save the source id on the feature
    feature.values_[RecordField.SOURCE_ID] = this.getId();

    var geom = feature.getGeometry();

    if (geom) {
      if (geom.getExtent().some(isNaN) || !geom.getExtent().some(isFinite)) {
        // the underlying RBush implementation in Openlayers chokes on invalid geometries/extents
        feature.setGeometry(null);
      }

      var geomType = geom.getType();
      if (geomType === GeometryType.POINT) {
        // if displaying ellipses, make sure it's generated on the feature
        if (osStyle.ELLIPSE_REGEXP.test(this.geometryShape_)) {
          osFeature.createEllipse(feature);
        }

        // sets lat, lon, latdms, londms, and mgrs fields
        osFeature.populateCoordFields(feature);
      } else if (geomType === GeometryType.LINE_STRING ||
          geomType === GeometryType.MULTI_LINE_STRING) {
        // split lines across the date line so they don't draw horizontal lines across the 2D map
        geom.toLonLat();
        geom = splitOnDateLine(/** @type {!(LineString|MultiLineString)} */ (geom));
        geom.osTransform();
        feature.setGeometry(geom);
      } else if (!geom.get(GeometryField.NORMALIZED)) {
        // normalize non-point geometries unless they were normalized elsewhere
        normalizeGeometryCoordinates(geom);
      }
    }

    interpolateFeature(feature);

    // make sure the internal feature ID field is set
    if (feature.values_[Fields.ID] == null) {
      feature.values_[Fields.ID] = featureId;
    }

    // initially set labels to disabled unless the value has been set elsewhere. they will be turned on later based on
    // hit detection.
    if (feature.values_[StyleField.SHOW_LABELS] == null) {
      feature.values_[StyleField.SHOW_LABELS] = false;
    }

    // dynamic features are treated differently by animation, so track them in a map
    if (feature instanceof DynamicFeature) {
      this.dynamicFeatures_[featureId] = feature;

      if (this.animationOverlay) {
        feature.initDynamic();
        this.addDynamicListener(feature);
      }
    }

    osStyle.setFeatureStyle(feature, this);
    this.updateIndex(feature);

    if (this.getDetectColumnTypes()) {
      this.columnTypeDetection_(feature);
    }
  }

  /**
   * Detects the column types.
   *
   * @param {!Feature} feature
   * @private
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  columnTypeDetection_(feature) {
    const keys = feature.getKeys();
    for (let i = 0, n = keys.length; i !== n; i++) {
      const col = keys[i];
      let value = feature.values_[col];
      let type = typeof (value);

      if (value === '') {
        type = 'empty';
      } else if (type === 'number') {
        type = Math.floor(value) === value ? 'integer' : 'decimal';
      } else if (type === 'string') {
        if (isFloat(/** @type {string} */ (value))) {
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
    }
  }

  /**
   * Process features in the process queue.
   *
   * @private
   */
  onProcessTimer_() {
    if (this.processQueue_ && this.processQueue_.length) {
      var features = this.processQueue_;
      this.processQueue_ = [];
      this.processDeferred(features);
    }
  }

  /**
   * Perform processing actions that need to be batched for performance reasons.
   *
   * @param {!Array<!Feature>} features
   * @protected
   */
  processDeferred(features) {
    log.fine(this.log, this.getTitle() + ' processing ' + features.length + ' new features.');

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
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.FEATURES, features));

    // repeat the last timeline event to update which features are displayed
    var lastTimeEvent = this.tlc.getLastEvent();
    if (lastTimeEvent) {
      this.onTimelineShow_(lastTimeEvent);
    }

    var om = OnboardingManager.getInstance();
    if (om) {
      om.displayOnboarding(ROOT + 'onboarding/features.json');
    }
  }

  /**
   * Fires the deferred unprocess handler immediately to ensure the queue is cleared.
   *
   * @protected
   */
  processNow() {
    if (this.processTimer) {
      this.processTimer.fire();
    }
  }

  /**
   * Handle a feature being removed from the source. Always process removed features on a timer
   * because Openlayers doesn't have bulk remove.
   *
   * @param {!Feature} feature
   * @protected
   *
   * @todo Switch this back to unprocessFeatures when (if) Openlayers supports bulk removal and
   *       refactor to work similarly to processFeatures.
   */
  unprocessFeature(feature) {
    feature.suppressEvents();
    this.unprocessImmediate(feature);
    feature.enableEvents();

    if (this.unprocessTimer) {
      this.unprocessQueue_.push(feature);
      this.unprocessTimer.startIfNotActive();
    }
  }

  /**
   * Perform processing actions that aren't performance sensitive.
   *
   * @param {!Feature} feature
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature id.
   */
  unprocessImmediate(feature) {
    var featureId = /** @type {string} */ (feature.id_);
    this.shownRecordMap[featureId] = undefined;

    if (feature instanceof DynamicFeature) {
      this.removeDynamicListener(feature);

      feature.disposeDynamic(true);
      this.dynamicFeatures_[featureId] = undefined;
    }
  }

  /**
   * @private
   */
  onUnprocessTimer_() {
    var features = this.unprocessQueue_;
    this.unprocessQueue_ = [];

    if (features && features.length > 0) {
      this.unprocessDeferred(features);
    }
  }

  /**
   * Perform unprocessing actions that need to be batched for performance reasons.
   *
   * @param {!Array<!Feature>} features
   * @protected
   *
   * @suppress {accessControls}
   */
  unprocessDeferred(features) {
    log.fine(this.log, this.getTitle() + ' unprocessing ' + features.length + ' features.');

    // clear the range collections so animations will remove features
    this.rangeCollections_ = {};

    // trim undefined values from maps
    this.shownRecordMap = prune(this.shownRecordMap);
    this.idIndex_ = prune(this.idIndex_);
    this.undefIdIndex_ = prune(this.undefIdIndex_);
    this.dynamicFeatures_ = prune(this.dynamicFeatures_);
    this.dynamicListeners_ = prune(this.dynamicListeners_);

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

    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.FEATURES, undefined, features));
  }

  /**
   * Fires the deferred unprocess handler immediately to ensure the queue is cleared.
   *
   * @protected
   */
  unprocessNow() {
    if (this.unprocessTimer && this.unprocessTimer.isActive()) {
      this.unprocessTimer.fire();
    }
  }

  /**
   * Handle timeline controller show event.
   * @param {TimelineControllerEvent} event The event.
   * @private
   */
  onTimelineShow_(event) {
    if (this.animationEnabled_) {
      this.previousRange_ = this.displayRange_;

      // updating the animation overlay will update the time model
      this.setDisplayRange(event.getRange(), false);

      // this is going to be fired a lot by each source while using the timeline
      this.updateAnimationOverlay();
      this.updateLabels();

      // only dispatch a feature visibility event if the timeline is not playing
      if (!this.tlc.isPlaying()) {
        this.dispatchEvent(new PropertyChangeEvent(PropertyChange.FEATURE_VISIBILITY));
      }
    }
  }

  /**
   * Fires a visibility change event when the timeline plays/stops so the UI updates appropriately. All data will be
   * displayed while animating to prevent excessive UI updates, and while stopped the data will be filtered.
   *
   * @param {TimelineControllerEvent} event
   * @private
   */
  onTimelinePlayChange_(event) {
    // if the time filter isn't enabled, the play state won't affect feature visibility so don't fire the event
    if (this.timeFilterEnabled_) {
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.FEATURE_VISIBILITY));
    }
  }

  /**
   * Get the animation overlay.
   *
   * @return {?AnimationOverlay}
   */
  getAnimationOverlay() {
    return this.animationOverlay;
  }

  /**
   * Creates a basic feature overlay used to animate features on the map.
   *
   * @protected
   */
  createAnimationOverlay() {
    if (!this.animationOverlay) {
      var layer = getMapContainer().getLayer(this.getId());
      var opacity = /** @type {ILayer} */ (layer).getOpacity();
      var zIndex = layer.getZIndex();

      // only set the map in 2D mode. we don't want the overlay to render while in 3D.
      this.animationOverlay = new AnimationOverlay({
        map: this.webGLEnabled ? null : getMapContainer().getMap(),
        opacity: opacity,
        zIndex: zIndex
      });

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ANIMATION_ENABLED, true));

      // initialize animation state for dynamic features
      this.initDynamicAnimation();
    }
  }

  /**
   * Update the animation fade information
   */
  refreshAnimationFade() {
    if (this.tlc.getFade()) {
      this.updateAnimationOverlay();
    }
  }

  /**
   * Fade was toggled on/off. If off, make sure everything is back to opacity of 1
   *
   * @private
   */
  fadeToggle_() {
    if (!this.tlc.getFade() && this.previousFade_ && this.animationOverlay) {
      // went from on to off similar to when we close the timeline
      this.updateFadeStyle_(this.animationOverlay.getFeatures(), 1);
      if (this.webGLEnabled) {
        // tell the WebGL synchronizer which features changed visibility
        this.dispatchAnimationFrame(undefined, this.animationOverlay.getFeatures());
      }
    }

    this.previousFade_ = this.tlc.getFade();
  }

  /**
   * Updates features displayed by the animation overlay if it exists.
   *
   * @protected
   */
  updateAnimationOverlay() {
    if (this.animationOverlay) {
      if (this.visible) {
        var displayedFeatures = undefined;
        var lookAheadFeatures25 = undefined; // features within 25% of new window
        var lookAheadFeatures50 = undefined; // features within 25-50% of new window
        var lookAheadFeatures75 = undefined; // features within 50-75% of new window
        var lookAheadRange25 = TimeRange.UNBOUNDED;
        var lookAheadRange50 = TimeRange.UNBOUNDED;
        var lookAheadRange75 = TimeRange.UNBOUNDED;
        var displayStart = this.displayRange_.getStart();
        var displayEnd = this.displayRange_.getEnd();
        var windowSize = (displayEnd - displayStart) * .25;
        var lookAhead = false;

        // look for features to fade in/out based on the previous window
        if (this.tlc.getFade() && this.previousRange_ != TimeRange.UNBOUNDED) {
          if (this.previousRange_.getEnd() < this.displayRange_.getEnd()) {
            // moving forward, get trailing features to fade out
            lookAheadRange25 = new TimeRange(this.displayRange_.getStart() - windowSize,
                this.displayRange_.getStart());

            lookAheadRange50 = new TimeRange(lookAheadRange25.getStart() - windowSize,
                lookAheadRange25.getStart());

            lookAheadRange75 = new TimeRange(lookAheadRange50.getStart() - windowSize,
                lookAheadRange50.getStart());

            displayStart = lookAheadRange75.getStart();
            lookAhead = true;
          } else if (this.previousRange_.getStart() > this.displayRange_.getStart()) {
            // moving backward, get features ahead of current window to fade out
            lookAheadRange25 = new TimeRange(this.displayRange_.getEnd(),
                this.displayRange_.getEnd() + windowSize);

            lookAheadRange50 = new TimeRange(lookAheadRange25.getEnd(),
                lookAheadRange25.getEnd() + windowSize);

            lookAheadRange75 = new TimeRange(lookAheadRange50.getEnd(),
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

          lookAheadFeatures25 = /** @type {Array<!Feature>} */ (this.timeModel.intersection(lookAheadRange25));
          lookAheadFeatures50 = /** @type {Array<!Feature>} */ (this.timeModel.intersection(lookAheadRange50));
          lookAheadFeatures75 = /** @type {Array<!Feature>} */ (this.timeModel.intersection(lookAheadRange75));

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

            var featureTime = /** @type {ITime|undefined} */ (dynamicFeature.get(RecordField.TIME));
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
          this.notifyDataChange();
        }
      } else {
        this.animationOverlay.setFeatures(undefined);

        if (this.webGLEnabled) {
          // we need to let WebGL know that the layer is now invisible, so hide every feature
          this.dispatchAnimationFrame(this.getFeatures(), []);
        }
      }
    }
  }

  /**
   * Update all of the features with the specified fade level/opacity. The opacity is set as a feature level parameter,
   * which is multiplied by the layer level opacity before rendering.
   *
   * @param {Array<!Feature>} features
   * @param {number} opacity
   * @private
   *
   * @suppress {checkTypes} To ignore errors caused by ol.style.Style being a struct.
   */
  updateFadeStyle_(features, opacity) {
    osFeature.updateFeaturesFadeStyle(features, opacity, this);
  }

  /**
   * Sets the opacity on the animation overlay. Used to sync the overlay layer with the actual layer.
   *
   * @param {number} value
   */
  setOverlayOpacity(value) {
    if (this.animationOverlay) {
      this.animationOverlay.setOpacity(value);
    }
  }

  /**
   * Sets the z-index on the animation overlay. Used to sync the overlay layer with the actual layer.
   *
   * @param {number} value
   */
  setOverlayZIndex(value) {
    if (this.animationOverlay) {
      this.animationOverlay.setZIndex(value);
    }
  }

  /**
   * Dispatches an animation frame event with a map of visibility changes.
   *
   * @param {Array<!Feature>=} opt_hide Features to hide
   * @param {Array<!Feature>=} opt_show Features to show
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature id.
   */
  dispatchAnimationFrame(opt_hide, opt_show) {
    this.dispatchEvent(new PropertyChangeEvent(
        PropertyChange.ANIMATION_FRAME, opt_show, opt_hide));
  }

  /**
   * Disposes of the animation overlay and cached features.
   *
   * @protected
   */
  disposeAnimationOverlay() {
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

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ANIMATION_ENABLED, false));
    }
  }

  /**
   * Set up animation state for dynamic features.
   *
   * @protected
   */
  initDynamicAnimation() {
    for (var id in this.dynamicFeatures_) {
      var feature = this.dynamicFeatures_[id];
      if (feature) {
        feature.initDynamic();
        this.addDynamicListener(feature);
      }
    }
  }

  /**
   * Add a listener for a dynamic feature.
   *
   * @param {!Feature} feature The feature.
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature id.
   */
  addDynamicListener(feature) {
    // update the overlay when the original geometry changes
    var featureId = /** @type {string} */ (feature.id_);
    var geometry = feature.getGeometry();
    if (geometry) {
      var listenKey = this.dynamicListeners_[featureId];
      if (listenKey) {
        unlistenByKey(listenKey);
      }

      // if the original geometry changes, recreate the displayed line
      this.dynamicListeners_[featureId] = listen(feature, GoogEventType.PROPERTYCHANGE,
          this.onDynamicFeatureChange, this);
    }
  }

  /**
   * Remove a listener for a dynamic feature.
   *
   * @param {!Feature} feature The feature.
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature id.
   */
  removeDynamicListener(feature) {
    // update the overlay when the original geometry changes
    var featureId = /** @type {string} */ (feature.id_);
    var listenKey = this.dynamicListeners_[featureId];
    if (listenKey) {
      unlistenByKey(listenKey);
      this.dynamicListeners_[featureId] = undefined;
    }
  }

  /**
   * Handle dynamic feature property change events.
   *
   * @param {!(PropertyChangeEvent|OLEvent)} event The change event.
   * @protected
   */
  onDynamicFeatureChange(event) {
    if (event instanceof PropertyChangeEvent) {
      var p = event.getProperty();
      if (p === DynamicPropertyChange.GEOMETRY) {
        // if the original geometry changes, update the dynamic geometry
        var feature = /** @type {DynamicFeature} */ (event.target);
        if (feature && feature.isDynamicEnabled) {
          // dispose of the animation geometries
          feature.disposeDynamic(true);
          // and recreate them
          feature.updateDynamic(this.displayRange_.getStart(), this.displayRange_.getEnd());
        }
      }
    }
  }

  /**
   * Dispose animation state for dynamic features.
   *
   * @protected
   */
  disposeDynamicAnimation() {
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
      this.notifyDataChange();
    }
  }

  /**
   * @inheritDoc
   */
  getHighlightedItems() {
    return this.highlightedItems_;
  }

  /**
   * @inheritDoc
   */
  setHighlightedItems(items) {
    if (items !== this.highlightedItems_) {
      var old = this.highlightedItems_;
      if (old) {
        for (var i = 0, n = old.length; i < n; i++) {
          old[i].set(StyleType.HIGHLIGHT, null);
        }

        osStyle.setFeaturesStyle(old, this);
      }

      this.highlightedItems_ = items;

      if (items) {
        var defaultStyle = osStyle.DEFAULT_HIGHLIGHT_CONFIG;
        var replace = false;

        if (items.length > 0) {
          var config = osStyle.getLayerConfig(items[0], this);
          replace = config ? config[StyleField.REPLACE_STYLE] : false;
        }

        for (var i = 0, n = items.length; i < n; i++) {
          var feature = items[i];
          var customStyle = /** @type {osStyle.StyleConfigLike} */ (feature.get(StyleType.CUSTOM_HIGHLIGHT));
          var style = replace ? defaultStyle : customStyle || defaultStyle;
          if (typeof style === 'function') {
            style = style(feature);
          }

          feature.set(StyleType.HIGHLIGHT, style);
        }
        osStyle.setFeaturesStyle(items, this);
      }

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.HIGHLIGHTED_ITEMS, items, old,
          this));
      this.changed();
    }
  }

  /**
   * Convenience method highlight by id/array of ids
   * @param {number|Array<number>} ids
   */
  highlightById(ids) {
    var features = this.getFeaturesById(ids);
    this.setHighlightedItems(features);
  }

  /**
   * Area selection listener
   *
   * @param {ActionEvent} event
   * @private
   *
   * @suppress {accessControls|checkTypes} To allow direct access to feature id.
   */
  onFeatureAction_(event) {
    var context = event.getContext();

    if (context) {
      context = !Array.isArray(context) ? [context] : context;

      var features = [];
      for (var i = 0, n = context.length; i < n; i++) {
        if (event.type == EventType.REMOVE_FEATURE) {
          var feature = /** @type {Feature|undefined} */ (context[i].feature);
          if (feature && this.idIndex_[feature.id_]) {
            features.push(feature);
          }
        } else {
          var geometry = /** @type {Geometry|undefined} */ (context[i].geometry);
          if (geometry) {
            features = features.concat(this.getFeaturesInGeometry(geometry));
          }
        }
      }

      if (features.length > 0) {
        switch (event.type) {
          case EventType.SELECT:
            this.addToSelected(features);
            break;
          case EventType.SELECT_EXCLUSIVE:
            this.setSelectedItems(features);
            break;
          case EventType.DESELECT:
            this.removeFromSelected(features);
            break;
          case EventType.REMOVE_FEATURE:
          case EventType.REMOVE_FEATURES:
            if (features) {
              this.removeFeatures(features);
            }
            break;
          default:
            break;
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  getFeaturesInExtent(extent) {
    // if the source is hidden, don't return any features
    return this.getVisible() ? super.getFeaturesInExtent(extent) : [];
  }

  /**
   * Get all features inside the provided geometry.
   *
   * @param {!Geometry} geometry The geometry
   * @param {Array<Feature>=} opt_features The list of features to search
   * @return {Array<Feature>}
   */
  getFeaturesInGeometry(geometry, opt_features) {
    var extent = geometry.getExtent();
    var features = opt_features;
    var isGeomRectangular = false;

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
          case GeometryType.LINE_STRING:
            geometry = /** @type {!LineString} */ (geometry);

            var coords = geometry.getCoordinates();
            isGeomRectangular = isRectangular(coords, extent);
            break;
          case GeometryType.POLYGON:
            geometry = /** @type {!Polygon} */ (geometry);

            var coords = geometry.getCoordinates();
            isGeomRectangular = coords.length == 1 && isRectangular(coords[0], extent);
            break;
          default:
            break;
        }
      }
    }

    var results = [];
    var jstsGeometry = OLParser.getInstance().read(geometry);
    if (jstsGeometry && features.length > 0) {
      var numCoords = jstsGeometry.getCoordinates().length;
      if (numCoords > 100) {
        // simplify complex geometries to avoid taking a year computing the contained features. the threshold is
        // 0.25%, 0.5% or 1% of the maximum height/width of the geometry's extent. this seemed to be a
        // good compromise between performance and precision.
        var maxDistance = Math.max(getWidth(extent), getHeight(extent));
        var numFeatures = features.length;
        var per = 0;
        per = numFeatures > 10000 ? 0.0025 : per;
        per = numFeatures > 50000 ? 0.005 : per;
        per = numFeatures > 100000 ? 0.01 : per;

        var threshold = maxDistance * per;
        if (threshold > 0) {
          log.fine(this.log, 'Simplifying geometry with ' + numCoords + ' vertices and threshold ' + threshold);
          jstsGeometry = jsts.simplify.DouglasPeuckerSimplifier.simplify(jstsGeometry, threshold);
          log.fine(this.log, 'New geometry: ' + jstsGeometry.getCoordinates().length + ' vertices');
        }
      }

      // multi polygons need to be searched individually.
      // Warning this will not support multi-geometries that are nested inside a multi-geometry.
      // To do so vertX/Y would need to be added to all nested multi-geoms not just one level deep.
      var allGeoms = [];
      if (jstsGeometry.getGeometryType() == GeometryType.MULTI_POLYGON) {
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
          if (this.isGeometryInArea_(jstsGeometry, testGeo, isGeomRectangular)) {
            results.push(features[i]);
          }
        }
      }
    }

    return results;
  }

  /**
   * Tests if a JSTS area (polygon) contains/crosses/overlaps an Openlayers geometry.
   *
   * @param {!jsts.geom.Geometry} area The JSTS geometry
   * @param {!Geometry} geometry The Openlayers geometry
   * @param {boolean=} opt_rectangular If the provided area is a rectangle. This function assumes features have been
   *                                   short-circuited on the area's extent already, so points will be assumed to be
   *                                   matches.
   * @return {boolean}
   * @private
   *
   * Expose {@link ol.geom.SimpleGeometry#flatCoordinates} for points.
   * @suppress {accessControls}
   */
  isGeometryInArea_(area, geometry, opt_rectangular) {
    var match = false;
    var proj = osMap.PROJECTION;
    var wrap = proj.canWrapX() && this.getWrapX();
    var projExtent = proj.getExtent();
    var halfWidth = (projExtent[2] - projExtent[0]) / 2;

    var geomType = geometry.getType();
    switch (geomType) {
      case GeometryType.GEOMETRY_COLLECTION:
        // test internal geometries - if one matches the collection matches
        var geometries = /** @type {!GeometryCollection} */ (geometry).getGeometriesArray();
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
      case GeometryType.MULTI_POINT:
        // converting to JSTS will call getPoints anyway, so just do it here and operate on a single point at a time. this
        // can potentially save converting every point to JSTS, assuming an earlier point matches.
        var points = /** @type {!MultiPoint} */ (geometry).getPoints();
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
      case GeometryType.MULTI_POLYGON:
        // converting to JSTS will call getPoints anyway, so just do it here and operate on a single point at a time. this
        // can potentially save converting every point to JSTS, assuming an earlier point matches.
        var polys = /** @type {!MultiPolygon} */ (geometry).getPolygons();
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
      case GeometryType.LINE_STRING:
      case GeometryType.LINEAR_RING:
      case GeometryType.POLYGON:
      case GeometryType.CIRCLE:
      case GeometryType.MULTI_LINE_STRING:
        geometry = geometry.clone();
        geometry.set(GeometryField.NORMALIZED, false);
        normalizeGeometryCoordinates(geometry, area.getCoordinates()[0].x);
        var jstsGeometry = OLParser.getInstance().read(geometry);
        match = jstsGeometry != null &&
            (area.contains(jstsGeometry) || area.crosses(jstsGeometry) || area.overlaps(jstsGeometry));
        break;
      case GeometryType.POINT:
        var x = /** @type {!Point} */ (geometry).flatCoordinates[0];
        var y = /** @type {!Point} */ (geometry).flatCoordinates[1];

        // multipolygons need to be checked individually
        var jstsAreas = [];
        if (area.getGeometryType() == GeometryType.MULTI_POLYGON) {
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
            x = normalizeLongitude(x, first - halfWidth, first + halfWidth);
          }

          if (opt_rectangular || isCoordInArea(x, y, jstsAreas[i].vertX, jstsAreas[i].vertY, jstsAreas[i].nVert)) {
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
  }

  /**
   * @inheritDoc
   *
   * Inlined everything for performance reasons. Function calls are too expensive for how often this can be called.
   * @suppress {checkTypes}
   */
  isSelected(feature) {
    var id = typeof feature == 'object' ? feature['id'] : feature;
    return id in this.selectedById_;
  }

  /**
   * Convenience check for whether something in array is selected
   *
   * @param {Array<!Feature>} features
   * @return {boolean|undefined} All == true; partial === undefined; none === false
   * @suppress {checkTypes}
   */
  isSelectedArray(features) {
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
  }

  /**
   * @inheritDoc
   */
  forEachFeature(callback, opt_this) {
    // The Openlayers default is to run this over the RBush. However, that only iterates over features with geometries.
    // Sources can contain tabular vector data without geometries, so we'll do this instead.
    this.getFeatures().forEach(callback, opt_this);
  }

  /**
   * @inheritDoc
   */
  getSelectedItems() {
    return this.selected_.slice();
  }

  /**
   * @inheritDoc
   */
  setSelectedItems(items) {
    if (!Array.isArray(items)) {
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
      osStyle.setFeaturesStyle(old, this);
      osStyle.setFeaturesStyle(this.selected_, this);

      this.dispatchEvent(new PropertyChangeEvent(SelectionType.CHANGED, this.selected_, old));
      this.changed();
    }
  }

  /**
   * @inheritDoc
   */
  addToSelected(features) {
    if (!Array.isArray(features)) {
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
        osStyle.setFeaturesStyle(added, this);
        this.dispatchEvent(new PropertyChangeEvent(SelectionType.ADDED, added));
        this.changed();
      }
    }
  }

  /**
   * @override
   * @param {!Feature|Array<!Feature>} features
   * @param {boolean=} opt_skipStyle
   */
  removeFromSelected(features, opt_skipStyle) {
    if (!Array.isArray(features)) {
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
          osStyle.setFeaturesStyle(removed, this);
        }

        this.dispatchEvent(new PropertyChangeEvent(SelectionType.REMOVED, removed));
        this.changed();
      }
    }
  }

  /**
   * Invert the current selection
   */
  invertSelection() {
    var selected = this.selected_.slice();
    this.selectAll();
    this.removeFromSelected(selected);
  }

  /**
   * Convenience method select by id/array of ids
   * @param {number|Array<number>} ids
   * @param {boolean=} opt_deselect
   */
  selectById(ids, opt_deselect) {
    var features = this.getFeaturesById(ids);
    if (opt_deselect) {
      this.removeFromSelected(features);
    } else {
      this.addToSelected(features);
    }
  }

  /**
   * @inheritDoc
   */
  selectAll() {
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
      osStyle.setFeaturesStyle(added, this);

      this.dispatchEvent(new PropertyChangeEvent(SelectionType.ADDED, added));
      this.changed();
    }
  }

  /**
   * @inheritDoc
   */
  selectNone() {
    var i = this.selected_.length;
    if (i > 0) {
      var selected = this.selected_.slice();
      this.selected_.length = 0;
      this.selectedById_ = {};

      // remove selection style from selected items
      while (i--) {
        selected[i].set(StyleType.SELECT, null);
      }

      // update styles for all features that were previously selected
      osStyle.setFeaturesStyle(selected, this);

      this.dispatchEvent(new PropertyChangeEvent(SelectionType.REMOVED, selected));
      this.changed();
    }
  }

  /**
   * Select a feature in the source.
   *
   * @param {Feature} feature
   * @return {boolean} If the feature was added to the selection.
   * @protected
   * @suppress {accessControls|checkTypes}
   */
  select(feature) {
    if (feature) {
      // our selection map uses the 'id' field because that's what slickgrid references. our selection array uses the id_
      // field because it's typically a faster value to compare.
      //
      // THIN-6499 added a check to make sure the feature is shown to avoid having to filter out hidden features when
      // the timeline is closed. we want to use the rbush in that case, which doesn't consider shown/hidden.
      var id = /** @type {string} */ (feature['id']);
      if (id != null && !this.selectedById_[id] &&
          feature.id_ != null && this.idIndex_[feature.id_] && this.shownRecordMap[feature.id_]) {
        binaryInsert(this.selected_, feature, osFeature.idCompare);
        this.selectedById_[id] = true;
        var selectCfg = feature.get(StyleType.CUSTOM_SELECT) || osStyle.DEFAULT_SELECT_CONFIG;
        feature.set(StyleType.SELECT, selectCfg);
        return true;
      }
    }

    return false;
  }

  /**
   * Deselect a feature in the source.
   *
   * @param {Feature} feature Feature to deselect
   * @return {boolean} If the feature was added to the selection.
   * @protected
   * @suppress {checkTypes}
   */
  deselect(feature) {
    if (feature) {
      var id = /** @type {string} */ (feature['id']);
      if (id != null && this.selectedById_[id]) {
        binaryRemove(this.selected_, feature, osFeature.idCompare);
        delete this.selectedById_[id];
        feature.set(StyleType.SELECT, null);
        return true;
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  displayAll() {
    this.showFeatures(this.getFeatures());
  }

  /**
   * @inheritDoc
   */
  hideAll() {
    this.hideFeatures(this.getFeatures());
  }

  /**
   * @inheritDoc
   */
  hideFeatures(features) {
    if (!Array.isArray(features)) {
      features = [features];
    }

    this.updateFeaturesVisibility(features, false);
  }

  /**
   * @inheritDoc
   */
  showFeatures(features) {
    if (!Array.isArray(features)) {
      features = [features];
    }

    this.updateFeaturesVisibility(features, true);
  }

  /**
   * Convenience method hide by id/array of ids
   * @param {number|Array<number>} ids
   * @param {boolean=} opt_show
   */
  hideById(ids, opt_show) {
    var features = this.getFeaturesById(ids);
    if (opt_show) {
      this.showFeatures(features);
    } else {
      this.hideFeatures(features);
    }
  }

  /**
   * Convenience show only the given features; hide others; maintain selection on visible features
   *
   * @param {!Feature|Array<!Feature>} features
   */
  setVisibleFeatures(features) {
    if (!Array.isArray(features)) {
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
  }

  /**
   * @inheritDoc
   */
  hideSelected() {
    this.hideFeatures(this.selected_);
  }

  /**
   * @inheritDoc
   */
  hideUnselected() {
    this.hideFeatures(this.getUnselectedItems());
  }

  /**
   * @inheritDoc
   *
   * @suppress {accessControls} To allow direct access to feature id.
   */
  getHiddenItems() {
    var map = this.shownRecordMap;
    return this.getFeatures().filter(function(feature) {
      return feature && !map[/** @type {string} */ (feature.id_)];
    });
  }

  /**
   * @inheritDoc
   */
  getUnselectedItems() {
    return this.getFilteredFeatures().filter(function(feature) {
      return feature && !this.isSelected(feature);
    }, this);
  }

  /**
   * @param {Array<Feature>} features
   * @param {boolean} visible
   * @protected
   *
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  updateFeaturesVisibility(features, visible) {
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
          if (osFeature.hideLabel(feature)) {
            feature.values_[StyleField.LAST_SHOW_LABELS] = true;
            updateLabels = true;
          }

          hidden.push(feature);
        } else if (feature.values_[StyleField.LAST_SHOW_LABELS]) {
          // label was shown before the feature was hidden, so show it again. this is intended for labels that are not
          // managed by hit detection
          osFeature.showLabel(feature);
          feature.values_[StyleField.LAST_SHOW_LABELS] = undefined;
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

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.FEATURE_VISIBILITY, changed));
      this.changed();
    }
  }

  /**
   * Triggers an application label update if this source is configured to show labels.
   *
   * @protected
   */
  updateLabels() {
    // if this source has a label field configured, update which labels should be shown
    var config = StyleManager.getInstance().getLayerConfig(this.getId());
    if (config && config[StyleField.LABELS] && config[StyleField.SHOW_LABELS]) {
      updateShown();
    }
  }

  /**
   * Handler for a feature being hovered on the map.
   *
   * @param {Feature} feature The feature
   */
  handleFeatureHover(feature) {
    if (this.hoverHandler_ == null || !this.hoverHandler_(feature)) {
      this.defaultFeatureHover_(feature);
    }
  }

  /**
   * Set the feature hover handler function.
   *
   * @param {FeatureHoverFn=} opt_fn The handler function
   * @param {T=} opt_context The this context for the handler
   * @template T
   */
  setHoverHandler(opt_fn, opt_context) {
    var fn = opt_fn || undefined;
    var ctx = opt_context || this;
    this.hoverHandler_ = fn !== undefined ? fn.bind(ctx) : undefined;
  }

  /**
   * Default feature hover handler. Highlights the feature.
   *
   * @param {Feature} feature The hovered feature.
   * @private
   */
  defaultFeatureHover_(feature) {
    this.setHighlightedItems(feature ? [feature] : null);
  }

  /**
   * Gets the unique ID used by features in the source.
   *
   * @return {ColumnDefinition}
   */
  getUniqueId() {
    return this.uniqueId_;
  }

  /**
   * Sets the unique ID used by features in the source.
   *
   * @param {ColumnDefinition} value
   */
  setUniqueId(value) {
    if (this.uniqueId_ !== value) {
      var old = this.uniqueId_;
      this.uniqueId_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.UNIQUE_ID, value, old));
    }
  }

  /**
   * Fire a data change notify event.
   */
  notifyDataChange() {
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.DATA));
  }

  /**
   * @inheritDoc
   */
  supportsModify() {
    return this.canModify;
  }

  /**
   * @inheritDoc
   */
  getModifyFunction() {
    return (originalFeature, modifiedFeature) => {
      // Replace the geometry on the feature and interpolate the new geometry.
      originalFeature.setGeometry(modifiedFeature.getGeometry());
      originalFeature.unset(ORIGINAL_GEOM_FIELD, true);
      interpolateFeature(originalFeature);

      // Update the ellipse, if needed.
      osFeature.createEllipse(originalFeature, true);

      // Notify that the feature/geometry changed, in case previous steps did not do this.
      originalFeature.changed();

      this.setHasModifications(true);
      this.notifyDataChange();
    };
  }

  /**
   * Gets whether the source has pending changes.
   * @return {boolean}
   */
  getHasModifications() {
    return this.hasModifications;
  }

  /**
   * Gets whether the source has pending changes.
   * @param {boolean} value
   */
  setHasModifications(value) {
    if (value != this.hasModifications) {
      const old = this.hasModifications;
      this.hasModifications = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.HAS_MODIFICATIONS, value, old));
    }
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
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
  }

  /**
   * @inheritDoc
   */
  restore(config) {
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
      var columnDef = new ColumnDefinition();
      columnDef.restore(config['uniqueId']);
      this.setUniqueId(columnDef);
    }

    if (config['detectColumnTypes']) {
      this.setDetectColumnTypes(config['detectColumnTypes']);
    }

    if (config['supportsModify'] != null) {
      this.canModify = /** @type {boolean} */ (config['supportsModify']);
    }
  }

  /**
   * @param {Geometry} g
   */
  static updateScratchExtent_(g) {
    if (g) {
      var e = osExtent.getFunctionalExtent(g);
      if (e) {
        extend(scratchExtent, e);
      }
    }
  }
}

osImplements(Vector, IHistogramProvider.ID);
osImplements(Vector, ISource.ID);
osImplements(Vector, IAnimationSupport.ID);
osImplements(Vector, IModifiableSource.ID);

/**
 * Class name
 * @type {string}
 */
Vector.NAME = SourceClass.VECTOR;
registerClass(SourceClass.VECTOR, Vector);

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger(Vector.NAME);

/**
 * @type {string}
 * @const
 */
Vector.HIDDEN = 'hidden';

/**
 * @type {string}
 * @const
 */
Vector.VISIBLE = 'visible';

/**
 * @type {ol.Extent}
 */
const scratchExtent = createEmpty();

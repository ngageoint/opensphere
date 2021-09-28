goog.declareModuleId('plugin.arc.layer.ArcLayerDescriptor');

import * as arc from '../arc.js';
import ArcFeatureLayerConfig from './arcfeaturelayerconfig.js';
import ArcTileLayerConfig from './arctilelayerconfig.js';

const QueryData = goog.require('goog.Uri.QueryData');
const googColor = goog.require('goog.color');
const googObject = goog.require('goog.object');
const LayerSyncDescriptor = goog.require('os.data.LayerSyncDescriptor');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');
const IFilterable = goog.require('os.filter.IFilterable');
const TimeFormat = goog.require('os.im.mapping.TimeFormat');
const TimeType = goog.require('os.im.mapping.TimeType');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');
const osImplements = goog.require('os.implements');
const LayerType = goog.require('os.layer.LayerType');
const registerClass = goog.require('os.registerClass');
const ControlType = goog.require('os.ui.ControlType');
const Icons = goog.require('os.ui.Icons');
const ColorControlType = goog.require('os.ui.ColorControlType');
const IARCDescriptor = goog.require('os.ui.arc.IARCDescriptor');
const BaseProvider = goog.require('os.ui.data.BaseProvider');
const IFeatureTypeDescriptor = goog.require('os.ui.ogc.IFeatureTypeDescriptor');
const {launchForLayer} = goog.require('os.ui.query.CombinatorUI');

const {default: ArcFeatureType} = goog.requireType('plugin.arc.ArcFeatureType');


/**
 * Descriptor representing an Arc layer.
 *
 * @implements {IARCDescriptor}
 * @implements {IFilterable}
 */
class ArcLayerDescriptor extends LayerSyncDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?string}
     * @private
     */
    this.attribution_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.tilesEnabled_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.featuresEnabled_ = false;

    /**
     * @type {?string}
     * @private
     */
    this.layerId_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.url_ = null;

    /**
     * @type {?ol.Extent}
     * @private
     */
    this.extent_ = null;

    /**
     * @type {ArcFeatureType}
     * @private
     */
    this.featureType_ = null;

    /**
     * Marker for whether the layer is deprecated. If a layer is deprecated, it will pop up a notification to the user
     * to stop using it when the descriptor is activated.
     * @type {boolean}
     * @private
     */
    this.deprecated_ = false;

    this.descriptorType = arc.ID;
  }

  /**
   * @inheritDoc
   */
  getUrl() {
    return this.url_;
  }

  /**
   * @inheritDoc
   */
  setUrl(value) {
    this.url_ = value;
  }

  /**
   * Get the layerId
   *
   * @return {?string}
   */
  getLayerId() {
    return this.layerId_;
  }

  /**
   * Set the layerId
   *
   * @param {?string} value
   */
  setLayerId(value) {
    this.layerId_ = value;
  }

  /**
   * Get the layer extent
   *
   * @return {?ol.Extent}
   */
  getExtent() {
    return this.extent_;
  }

  /**
   * Set the layer extent
   *
   * @param {?ol.Extent} value
   */
  setExtent(value) {
    this.extent_ = value;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return null;
  }

  /**
   * @inheritDoc
   */
  getType() {
    if (this.tilesEnabled_ && this.featuresEnabled_) {
      return LayerType.GROUPS;
    } else if (this.tilesEnabled_) {
      return LayerType.TILES;
    } else if (this.featuresEnabled_) {
      return LayerType.FEATURES;
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    var s = '';

    if (this.tilesEnabled_) {
      s += Icons.TILES;
    }

    if (this.featuresEnabled_) {
      s += Icons.FEATURES;
    }

    if (this.hasTimeExtent()) {
      s += Icons.TIME;
    }

    return s;
  }

  /**
   * Whether the layer has a time extent.
   *
   * @return {boolean}
   */
  hasTimeExtent() {
    return !!this.getMinDate() || !!this.getMaxDate();
  }

  /**
   * @return {?string} The attribution
   */
  getAttribution() {
    return this.attribution_;
  }

  /**
   * @param {?string} value The attribution
   */
  setAttribution(value) {
    this.attribution_ = value;
  }

  /**
   * @inheritDoc
   */
  getAliases() {
    var aliases = [this.getId()];
    if (this.tilesEnabled_) {
      aliases.push(this.getId() + BaseProvider.ID_DELIMITER + 'tiles');
    }
    if (this.featuresEnabled_) {
      aliases.push(this.getId() + BaseProvider.ID_DELIMITER + 'features');
    }

    return aliases;
  }

  /**
   * Configures the descriptor from an Arc layer object.
   *
   * @param {Object} config
   * @param {string} id
   * @param {string} url
   */
  configureDescriptor(config, id, url) {
    this.setUrl(url);
    this.setId(id);
    this.setTitle(/** @type {string} */ (config['name']));
    this.setDescription(/** @type {string} */ (config['description']));
    this.setLayerId(/** @type {string} */ (config['id']));

    var ct = /** @type {string} */ (config['copyrightText']);
    if (ct) {
      var desc = this.getDescription();
      this.setDescription(desc + '\n\nCopyright: ' + ct);
      this.setAttribution(ct);
    }

    var extent = /** @type {Object} */ (config['extent']);
    if (extent) {
      try {
        if (extent['wkid'] === 4326) {
          var olExtent = [extent['xmin'], extent['ymin'], extent['xmax'], extent['ymax']];
          this.setExtent(olExtent);
        }
      } catch (e) {
        // failed to extract extent info from the config
      }
    }

    var timeInfo = /** @type {Object} */ (config['timeInfo']);
    if (timeInfo) {
      try {
        this.setMinDate(/** @type {number} */ (timeInfo['timeExtent'][0]));
        this.setMaxDate(/** @type {number} */ (timeInfo['timeExtent'][1]));
      } catch (e) {
        // failed to parse time info
      }
    }

    var drawingInfo = /** @type {Object} */ (config['drawingInfo']);
    this.setColor('#ffffff');
    if (drawingInfo) {
      try {
        // for non-point layers, try the outline style first
        var colorArray;
        if (config['geometryType'] != 'esriGeometryPoint') {
          colorArray = /** @type {Array<number>|undefined} */ (googObject.getValueByKeys(drawingInfo,
              ['renderer', 'symbol', 'outline', 'color']));
        }

        // if that doesn't exist, try the fill color
        if (!colorArray) {
          colorArray = /** @type {Array<number>|undefined} */ (googObject.getValueByKeys(drawingInfo,
              ['renderer', 'symbol', 'color']));
        }

        if (colorArray) {
          // use the color from the config if found
          var color = googColor.rgbArrayToHex(colorArray);
          this.setColor(color);
        }
      } catch (e) {
        // failed to parse color info
      }
    }

    var capabilities = /** @type {string} */ (config['capabilities']);
    if (capabilities) {
      var capsArr = capabilities.split(/\s*,\s*/);
      this.setTilesEnabled(capsArr.includes('Map'));
      this.setFeaturesEnabled(capsArr.includes('Data') || capsArr.includes('Query'));
    } else {
      this.setTilesEnabled(true);
      this.setFeaturesEnabled(true);
    }

    this.featureType_ = arc.createFeatureType(config);
    if (!this.featureType_) {
      // if a feature type could not be created, assume features aren't supported
      this.setFeaturesEnabled(false);
    }

    this.updateActiveFromTemp();
  }

  /**
   * @inheritDoc
   */
  getFeatureType() {
    return this.featureType_;
  }

  /**
   * @inheritDoc
   */
  isFeatureTypeReady() {
    return !!this.featureType_;
  }

  /**
   * Get whether features are enabled.
   *
   * @return {boolean}
   */
  getFeaturesEnabled() {
    return this.featuresEnabled_;
  }

  /**
   * Set whether features are enabled.
   *
   * @param {boolean} value
   */
  setFeaturesEnabled(value) {
    this.featuresEnabled_ = value;
  }

  /**
   * Get whether tiles are enabled.
   *
   * @return {boolean}
   */
  getTilesEnabled() {
    return this.tilesEnabled_;
  }

  /**
   * Set whether tiles are enabled.
   *
   * @param {boolean} value
   */
  setTilesEnabled(value) {
    this.tilesEnabled_ = value;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = [];

    if (this.getFeaturesEnabled()) {
      options.push(this.getFeatureOptions());
    }

    if (this.getTilesEnabled()) {
      options.push(this.getTileOptions());
    }

    return options;
  }

  /**
   * Gets the tile options object.
   *
   * @return {Object.<string, *>}
   * @protected
   */
  getTileOptions() {
    var options = {};
    var params = new QueryData();
    params.set('layers', 'show: ' + this.getLayerId());

    options['type'] = ArcTileLayerConfig.ID;
    options['id'] = this.getId() + BaseProvider.ID_DELIMITER + 'tiles';
    options['layerType'] = this.getType();
    options['providedBy'] = this.getProvider();
    options['animate'] = this.hasTimeExtent();
    options['tags'] = this.getTags();
    options['url'] = this.getUrl();
    options['params'] = params;
    options['title'] = this.getTitle();
    options['extent'] = this.getExtent();

    var attribution = this.getAttribution();

    if (attribution) {
      options['attributions'] = [attribution];
    }

    // enable the hue slider for Arc tile layers
    options[ControlType.COLOR] = ColorControlType.PICKER_RESET;
    options['baseColor'] = this.getColor();

    if (this.hasTimeExtent()) {
      options['timeParam'] = 'time';
      options['timeFormat'] = '{start},{end}';
      options['dateFormat'] = 'timestamp';
    }

    return options;
  }

  /**
   * Gets the feature options object.
   *
   * @return {Object<string, *>}
   * @protected
   */
  getFeatureOptions() {
    var options = {};
    options['id'] = this.getId() + BaseProvider.ID_DELIMITER + 'features';

    var params = new QueryData();
    params.set('f', 'json');
    params.set('inSR', '4326');
    params.set('outSR', '4326');
    params.set('outFields', '*');
    params.set('geometryType', 'esriGeometryPolygon');
    params.set('geometry', '{geom}');
    params.set('returnIdsOnly', true);
    params.set('spatialRel', 'esriSpatialRelIntersects');

    if (this.hasTimeExtent()) {
      params.set('time', '{time}');
    }

    options['type'] = ArcFeatureLayerConfig.ID;
    options['layerType'] = this.getType();
    options['animate'] = this.hasTimeExtent();
    options['url'] = this.getUrl() + '/' + this.getLayerId() + '/query';
    options['params'] = params;
    options['usePost'] = true;
    options['title'] = this.getTitle();
    options['spatial'] = true;
    options['temporal'] = this.hasTimeExtent();
    options['filter'] = true;
    options['load'] = true;
    options['tags'] = this.getTags();
    options['provider'] = this.getProvider();

    if (!this.getTilesEnabled()) {
      options['attributions'] = [this.getAttribution()];
    }

    // add time mappings - we are configuring these, no autodetection needed
    var featureType = this.getFeatureType();
    options['featureType'] = featureType;
    var mappings = [];

    if (this.hasTimeExtent() && featureType) {
      var startField = featureType.getStartDateColumnName();

      if (startField) {
        var endField = featureType.getEndDateColumnName();
        var timeType = endField ? TimeType.START : TimeType.INSTANT;
        var startMapping = new DateTimeMapping(timeType);
        startMapping.field = startField;
        startMapping.setFormat(TimeFormat.TIMESTAMP);
        mappings.push(startMapping);

        if (endField) {
          var endMapping = new DateTimeMapping(TimeType.END);
          endMapping.field = endField;
          endMapping.setFormat(TimeFormat.TIMESTAMP);
          mappings.push(endMapping);
        }
      }
    }

    if (mappings.length > 0) {
      options['mappings'] = mappings;
    }

    return options;
  }

  /**
   * @inheritDoc
   */
  isFilterable() {
    return this.featuresEnabled_;
  }

  /**
   * @inheritDoc
   */
  launchFilterManager() {
    var id = this.getId() + BaseProvider.ID_DELIMITER + 'features';
    launchForLayer(id, this.getTitle() + ' Features');
  }

  /**
   * @inheritDoc
   */
  getFilterKey() {
    return this.url_ + '/' + this.layerId_ + '/query!!' + this.getTitle();
  }

  /**
   * @inheritDoc
   */
  getFilterColumns() {
    return this.featureType_ ? this.featureType_.getColumns() : null;
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    var nodeUI = super.getNodeUI();

    if (this.isFilterable()) {
      nodeUI = '<filterabledescriptornodeui></filterabledescriptornodeui>' + nodeUI;
    }

    return nodeUI;
  }

  /**
   * @inheritDoc
   */
  getFilterableTypes() {
    return [this.getId() + BaseProvider.ID_DELIMITER + 'features'];
  }

  /**
   * @inheritDoc
   */
  updatedFromServer() {
    this.updateTags();
  }

  /**
   * @inheritDoc
   */
  setDeprecated(value) {
    this.deprecated_ = value;
  }

  /**
   * @inheritDoc
   */
  getDeprecated() {
    return this.deprecated_;
  }

  /**
   * @protected
   */
  updateTags() {
    this.dispatchEvent(new PropertyChangeEvent('title'));
  }
}


/**
 * Class name
 * @type {string}
 * @const
 */
ArcLayerDescriptor.NAME = 'plugin.arc.layer.ArcLayerDescriptor';
registerClass(ArcLayerDescriptor.NAME, ArcLayerDescriptor);
osImplements(ArcLayerDescriptor, IFeatureTypeDescriptor.ID);
osImplements(ArcLayerDescriptor, IFilterable.ID);
osImplements(ArcLayerDescriptor, IARCDescriptor.ID);

export default ArcLayerDescriptor;

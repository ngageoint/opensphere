goog.provide('plugin.arc.layer.ArcLayerDescriptor');

goog.require('goog.Uri.QueryData');
goog.require('goog.array');
goog.require('goog.string');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerRemove');
goog.require('os.command.SequenceCommand');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.events.LayerConfigEvent');
goog.require('os.events.LayerConfigEventType');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');
goog.require('os.filter.IFilterable');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.im.mapping.SemiMajorMapping');
goog.require('os.im.mapping.SemiMinorMapping');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.layer.LayerType');
goog.require('os.ui.CombinatorCtrl');
goog.require('os.ui.ControlType');
goog.require('os.ui.Icons');
goog.require('os.ui.ogc.IFeatureType');
goog.require('plugin.arc.ArcFeatureType');



/**
 * Descriptor representing an Arc layer.
 * @extends {os.data.LayerSyncDescriptor}
 * @implements {os.filter.IFilterable}
 * @implements {os.ui.ogc.IFeatureType}
 * @constructor
 */
plugin.arc.layer.ArcLayerDescriptor = function() {
  plugin.arc.layer.ArcLayerDescriptor.base(this, 'constructor');

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
   * @type {plugin.arc.ArcFeatureType}
   * @private
   */
  this.featureType_ = null;

  this.descriptorType = plugin.arc.ArcPlugin.ID;
};
goog.inherits(plugin.arc.layer.ArcLayerDescriptor, os.data.LayerSyncDescriptor);


/**
 * Class name
 * @type {string}
 * @const
 */
plugin.arc.layer.ArcLayerDescriptor.NAME = 'plugin.arc.layer.ArcLayerDescriptor';
os.registerClass(plugin.arc.layer.ArcLayerDescriptor.NAME, plugin.arc.layer.ArcLayerDescriptor);
os.implements(plugin.arc.layer.ArcLayerDescriptor, os.filter.IFilterable.ID);


/**
 * Get the URL
 * @return {?string}
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getUrl = function() {
  return this.url_;
};


/**
 * Set the URL
 * @param {?string} value
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.setUrl = function(value) {
  this.url_ = value;
};


/**
 * Get the layerId
 * @return {?string}
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getLayerId = function() {
  return this.layerId_;
};


/**
 * Set the layerId
 * @param {?string} value
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.setLayerId = function(value) {
  this.layerId_ = value;
};


/**
 * Get the layer extent
 * @return {?ol.Extent}
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getExtent = function() {
  return this.extent_;
};


/**
 * Set the layer extent
 * @param {?ol.Extent} value
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.setExtent = function(value) {
  this.extent_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getTags = function() {
  return null;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getType = function() {
  if (this.tilesEnabled_ && this.featuresEnabled_) {
    return os.layer.LayerType.GROUPS;
  } else if (this.tilesEnabled_) {
    return os.layer.LayerType.TILES;
  } else if (this.featuresEnabled_) {
    return os.layer.LayerType.FEATURES;
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getIcons = function() {
  var s = '';

  if (this.tilesEnabled_) {
    s += os.ui.Icons.TILES;
  }

  if (this.featuresEnabled_) {
    s += os.ui.Icons.FEATURES;
  }

  if (this.hasTimeExtent()) {
    s += os.ui.Icons.TIME;
  }

  return s;
};


/**
 * Whether the layer has a time extent.
 * @return {boolean}
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.hasTimeExtent = function() {
  return !!this.getMinDate() || !!this.getMaxDate();
};


/**
 * @return {?string} The attribution
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getAttribution = function() {
  return this.attribution_;
};


/**
 * @param {?string} value The attribution
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.setAttribution = function(value) {
  this.attribution_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getAliases = function() {
  var aliases = [this.getId()];
  if (this.tilesEnabled_) {
    aliases.push(this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'tiles');
  }
  if (this.featuresEnabled_) {
    aliases.push(this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'features');
  }

  return aliases;
};


/**
 * Configures the descriptor from an Arc layer object.
 * @param {Object} config
 * @param {string} id
 * @param {string} url
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.configureDescriptor = function(config, id, url) {
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

  var startField = null;
  var endField = null;
  var timeInfo = /** @type {Object} */ (config['timeInfo']);
  if (timeInfo) {
    try {
      startField = /** @type {string} */ (timeInfo['startTimeField']);
      endField = /** @type {string} */ (timeInfo['endTimeField']);
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
        colorArray = /** @type {Array<number>|undefined} */ (goog.object.getValueByKeys(drawingInfo,
            ['renderer', 'symbol', 'outline', 'color']));
      }

      // if that doesn't exist, try the fill color
      if (!colorArray) {
        colorArray = /** @type {Array<number>|undefined} */ (goog.object.getValueByKeys(drawingInfo,
            ['renderer', 'symbol', 'color']));
      }

      if (colorArray) {
        // use the color from the config if found
        var color = goog.color.rgbArrayToHex(colorArray);
        this.setColor(color);
      }
    } catch (e) {
      // failed to parse color info
    }
  }

  var capabilities = /** @type {string} */ (config['capabilities']);
  if (capabilities) {
    var capsArr = capabilities.split(/\s*,\s*/);
    this.setTilesEnabled(goog.array.contains(capsArr, 'Map'));
    this.setFeaturesEnabled(goog.array.contains(capsArr, 'Data'));
  } else {
    this.setTilesEnabled(true);
    this.setFeaturesEnabled(true);
  }

  var fields = /** @type {Array} */ (config['fields']);
  if (fields && goog.isArray(fields) && fields.length > 0) {
    this.featureType_ = new plugin.arc.ArcFeatureType();
    var columns = [];

    for (var i = 0, ii = fields.length; i < ii; i++) {
      var field = fields[i];
      var name = /** @type {string} */ (field['name']);
      var type = plugin.arc.getColumnType(/** @type {string} */ (field['type']));
      var c = /** @type {os.ogc.FeatureTypeColumn} */ ({
        'name': name,
        'type': type
      });
      columns.push(c);

      if (name === startField) {
        this.featureType_.setStartDateColumnName(startField);
      } else if (name === endField) {
        this.featureType_.setEndDateColumnName(endField);
      } else if (name === 'esriFieldTypeGeometry') {
        this.featureType_.setGeometryColumnName(name);
      }
    }

    columns.sort(function(a, b) {
      return goog.string.numerateCompare(a.name, b.name);
    });
    this.featureType_.setColumns(columns);
  } else {
    // if there aren't any fields, assume features aren't supported
    this.setFeaturesEnabled(false);
  }

  this.updateActiveFromTemp();
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getFeatureType = function() {
  return this.featureType_;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.isFeatureTypeReady = function() {
  return !!this.featureType_;
};


/**
 * Get whether features are enabled.
 * @return {boolean}
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getFeaturesEnabled = function() {
  return this.featuresEnabled_;
};


/**
 * Set whether features are enabled.
 * @param {boolean} value
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.setFeaturesEnabled = function(value) {
  this.featuresEnabled_ = value;
};


/**
 * Get whether tiles are enabled.
 * @return {boolean}
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getTilesEnabled = function() {
  return this.tilesEnabled_;
};


/**
 * Set whether tiles are enabled.
 * @param {boolean} value
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.setTilesEnabled = function(value) {
  this.tilesEnabled_ = value;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getLayerOptions = function() {
  var options = [];

  if (this.getFeaturesEnabled()) {
    options.push(this.getFeatureOptions());
  }

  if (this.getTilesEnabled()) {
    options.push(this.getTileOptions());
  }

  return options;
};


/**
 * Gets the tile options object.
 * @return {Object.<string, *>}
 * @protected
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getTileOptions = function() {
  var options = {};
  var params = new goog.Uri.QueryData();
  params.set('layers', 'show: ' + this.getLayerId());

  options['type'] = plugin.arc.layer.ArcTileLayerConfig.ID;
  options['id'] = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'tiles';
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
  options[os.ui.ControlType.COLOR] = os.ui.ColorControlType.PICKER_RESET;
  options['baseColor'] = this.getColor();

  if (this.hasTimeExtent()) {
    options['timeParam'] = 'time';
    options['timeFormat'] = '{start},{end}';
    options['dateFormat'] = 'timestamp';
  }

  return options;
};


/**
 * Gets the feature options object.
 * @return {Object<string, *>}
 * @protected
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getFeatureOptions = function() {
  var options = {};
  options['id'] = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'features';

  var params = new goog.Uri.QueryData();
  params.set('f', 'json');
  params.set('inSR', '4326');
  params.set('outSR', '4326');
  params.set('outFields', '*');
  params.set('geometryType', 'esriGeometryPolygon');
  params.set('geometry', '{geom}');
  params.set('returnIdsOnly', true);

  if (this.hasTimeExtent()) {
    params.set('time', '{time}');
  }

  options['type'] = plugin.arc.layer.ArcFeatureLayerConfig.ID;
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
      var timeType = endField ? os.im.mapping.TimeType.START : os.im.mapping.TimeType.INSTANT;
      var startMapping = new os.im.mapping.time.DateTimeMapping(timeType);
      startMapping.field = startField;
      startMapping.setFormat(os.im.mapping.TimeFormat.TIMESTAMP);
      mappings.push(startMapping);

      if (endField) {
        var endMapping = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.END);
        endMapping.field = endField;
        endMapping.setFormat(os.im.mapping.TimeFormat.TIMESTAMP);
        mappings.push(endMapping);
      }
    }
  }

  if (mappings.length > 0) {
    options['mappings'] = mappings;
  }

  return options;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.isFilterable = function() {
  return this.featuresEnabled_;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.launchFilterManager = function() {
  var id = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'features';
  os.ui.CombinatorCtrl.launchForLayer(id, this.getTitle() + ' Features');
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getFilterKey = function() {
  return this.url_ + '/' + this.layerId_ + '/query!!' + this.getTitle();
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getFilterColumns = function() {
  return this.featureType_ ? this.featureType_.getColumns() : null;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getNodeUI = function() {
  var nodeUI = plugin.arc.layer.ArcLayerDescriptor.base(this, 'getNodeUI');

  if (this.isFilterable()) {
    nodeUI = '<filterabledescriptornodeui></filterabledescriptornodeui>' + nodeUI;
  }

  return nodeUI;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcLayerDescriptor.prototype.getFilterableTypes = function() {
  return [this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'features'];
};

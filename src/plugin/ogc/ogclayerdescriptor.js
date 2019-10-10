goog.provide('plugin.ogc.OGCLayerDescriptor');

goog.require('goog.Uri.QueryData');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerRemove');
goog.require('os.command.SequenceCommand');
goog.require('os.data');
goog.require('os.data.IAreaTest');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.events.LayerConfigEvent');
goog.require('os.events.LayerConfigEventType');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.filter.IFilterable');
goog.require('os.implements');
goog.require('os.layer.LayerType');
goog.require('os.ogc.wfs.DescribeFeatureLoader');
goog.require('os.ui.ControlType');
goog.require('os.ui.Icons');
goog.require('os.ui.filter.ui.filterableDescriptorNodeUIDirective');
goog.require('os.ui.ogc.IOGCDescriptor');
goog.require('os.ui.query.BaseCombinatorCtrl');
goog.require('os.ui.query.CombinatorCtrl');
goog.require('os.ui.util.deprecated');



/**
 * @extends {os.data.LayerSyncDescriptor}
 * @implements {os.ui.ogc.IOGCDescriptor}
 * @implements {os.filter.IFilterable}
 * @implements {os.data.IAreaTest}
 * @constructor
 */
plugin.ogc.OGCLayerDescriptor = function() {
  plugin.ogc.OGCLayerDescriptor.base(this, 'constructor');

  /**
   * @type {?string}
   * @private
   */
  this.attribution_ = null;

  /**
   * @type {?ol.Extent}
   * @private
   */
  this.bbox_ = null;

  /**
   * @type {?function()}
   * @protected
   */
  this.describeCallback = null;

  /**
   * @type {?Object.<string, string>}
   * @private
   */
  this.dimensions_ = null;

  /**
   * @type {os.ogc.IFeatureType}
   * @private
   */
  this.featureType_ = null;

  /**
   * @type {?Array.<!string>}
   * @private
   */
  this.legends_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.opaque_ = false;

  /**
   * @type {?Array.<osx.ogc.TileStyle>}
   * @private
   */
  this.styles_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.usePost_ = false;

  /**
   * @type {boolean}
   * @private
   */
  this.wfsEnabled_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.wfsName_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.wfsNameSpace_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.wfsUrl_ = null;

  /**
   * @type {?Array<string>}
   * @private
   */
  this.wfsFormats_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.wmsEnabled_ = false;

  /**
   * @type {?string}
   * @private
   */
  this.wmsName_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.wmsDateFormat_ = null;

  /**
   * @type {goog.Uri.QueryData}
   * @private
   */
  this.wmsParams_ = null;

  /**
   * @type {goog.Uri.QueryData}
   * @private
   */
  this.wfsParams_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.wmsTimeFormat_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.wmsUrl_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.wmsVersion_ = null;

  /**
   * @type {?Array<!string>}
   * @private
   */
  this.wmsSupportedCRS_ = null;

  /**
   * Marker for whether the layer is deprecated. If a layer is deprecated, it will pop up a notification to the user
   * to stop using it when the descriptor is activated.
   * @type {boolean}
   * @private
   */
  this.deprecated_ = false;

  /**
   * Regular expression to test for filterable types.
   * @type {RegExp}
   * @protected
   */
  this.filterableRegexp = plugin.ogc.OGCLayerDescriptor.FILTERABLE_RE;

  this.descriptorType = os.ogc.ID;
};
goog.inherits(plugin.ogc.OGCLayerDescriptor, os.data.LayerSyncDescriptor);


/**
 * Class name
 * @type {string}
 * @const
 */
plugin.ogc.OGCLayerDescriptor.NAME = 'plugin.ogc.OGCLayerDescriptor';
os.registerClass(plugin.ogc.OGCLayerDescriptor.NAME, plugin.ogc.OGCLayerDescriptor);
os.implements(plugin.ogc.OGCLayerDescriptor, os.data.IAreaTest.ID);
os.implements(plugin.ogc.OGCLayerDescriptor, os.filter.IFilterable.ID);
os.implements(plugin.ogc.OGCLayerDescriptor, os.ui.ogc.IFeatureTypeDescriptor.ID);
os.implements(plugin.ogc.OGCLayerDescriptor, os.ui.ogc.IOGCDescriptor.ID);


/**
 * Regular expression to test for filterable types.
 * @type {RegExp}
 * @const
 */
plugin.ogc.OGCLayerDescriptor.FILTERABLE_RE = /#features/;


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getSearchType = function() {
  return 'Layer';
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getType = function() {
  if (this.wmsEnabled_ && this.wfsEnabled_) {
    return os.layer.LayerType.GROUPS;
  } else if (this.wmsEnabled_) {
    return os.layer.LayerType.TILES;
  } else if (this.wfsEnabled_) {
    return os.layer.LayerType.FEATURES;
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getIcons = function() {
  var iconsSVG = this.getSVGSet();
  var s = '';
  var color = this.getColor() ? os.color.toRgbArray(this.getColor()) : [255, 255, 255, 1];

  if (this.deprecated_) {
    s += os.ui.Icons.DEPRECATED;
  }

  s += os.ui.createIconSet(goog.string.getRandomString(), iconsSVG, [], color);

  return s;
};


/**
 * Gets the set of appropriate layer icons as SVG.
 *
 * @return {Array<string>}
 */
plugin.ogc.OGCLayerDescriptor.prototype.getSVGSet = function() {
  var iconsSVG = [];

  if (this.wmsEnabled_) {
    iconsSVG.push(os.ui.IconsSVG.TILES);
  }

  if (this.wfsEnabled_) {
    iconsSVG.push(os.ui.IconsSVG.FEATURES);
  }

  if (this.hasTimeExtent()) {
    iconsSVG.push(os.ui.IconsSVG.TIME);
  }

  return iconsSVG;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getAbstract = function() {
  return this.getDescription();
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setAbstract = function(value) {
  this.setDescription(value);
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getExplicitTitle = function() {
  var title = '';

  if (this.isWmsEnabled()) {
    title = 'Tiles';
  }
  if (this.isWfsEnabled()) {
    title += this.wmsEnabled_ ? ' and Features' : 'Features';
  }

  return title;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getAliases = function() {
  var aliases = [this.getId()];
  if (this.wmsEnabled_) {
    aliases.push(this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'tiles');
  }
  if (this.wfsEnabled_) {
    aliases.push(this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'features');
  }

  return aliases;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getAttribution = function() {
  return this.attribution_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setAttribution = function(value) {
  this.attribution_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getStyles = function() {
  return this.styles_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setStyles = function(value) {
  this.styles_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getOpaque = function() {
  return this.opaque_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setOpaque = function(value) {
  this.opaque_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getDimensions = function() {
  return this.dimensions_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setDimensions = function(value) {
  this.dimensions_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getBBox = function() {
  return this.bbox_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setBBox = function(value) {
  this.bbox_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getSupportedCRS = function() {
  return this.wmsSupportedCRS_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setSupportedCRS = function(values) {
  this.wmsSupportedCRS_ = values;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getKeywords = function() {
  return this.getTags();
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setKeywords = function(value) {
  this.setTags(value);
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getLegends = function() {
  return this.legends_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setLegends = function(value) {
  this.legends_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getFeatureType = function() {
  return this.featureType_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.isWfsEnabled = function() {
  return this.wfsEnabled_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWfsEnabled = function(value) {
  this.wfsEnabled_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWfsName = function() {
  return this.wfsName_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWfsName = function(value) {
  this.wfsName_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWfsNamespace = function() {
  return this.wfsNameSpace_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWfsNamespace = function(value) {
  this.wfsNameSpace_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.isFilterable = function() {
  return this.isWfsEnabled();
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWfsUrl = function() {
  return this.wfsUrl_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWfsUrl = function(value) {
  this.wfsUrl_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWfsFormats = function() {
  return this.wfsFormats_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWfsFormats = function(value) {
  this.wfsFormats_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.isWmsEnabled = function() {
  return this.wmsEnabled_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWmsEnabled = function(value) {
  this.wmsEnabled_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWmsDateFormat = function() {
  return this.wmsDateFormat_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWmsDateFormat = function(value) {
  this.wmsDateFormat_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWmsParams = function() {
  return this.wmsParams_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWmsParams = function(value) {
  this.wmsParams_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWfsParams = function() {
  return this.wfsParams_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWfsParams = function(value) {
  this.wfsParams_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWmsName = function() {
  return this.wmsName_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWmsName = function(value) {
  this.wmsName_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWmsTimeFormat = function() {
  return this.wmsTimeFormat_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWmsTimeFormat = function(value) {
  this.wmsTimeFormat_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWmsUrl = function() {
  return this.wmsUrl_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWmsUrl = function(value) {
  this.wmsUrl_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWmsVersion = function() {
  return this.wmsVersion_ || ol.DEFAULT_WMS_VERSION;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setWmsVersion = function(value) {
  this.wmsVersion_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getUsePost = function() {
  return this.usePost_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setUsePost = function(value) {
  this.usePost_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getUrlKey = function() {
  return this.getFilterKey();
};


/**
 * If the provider is available and has alternate URLs, replaces the URL with the next available URL from the server.
 *
 * @param {?string} url The URL to replace
 * @return {?string}
 * @protected
 */
plugin.ogc.OGCLayerDescriptor.prototype.replaceWithNextUrl = function(url) {
  if (url && this.dataProvider instanceof os.ui.server.AbstractLoadingServer) {
    var providerUrl = this.dataProvider.getUrl();
    var nextUrl = this.dataProvider.getNextUrl();

    if (providerUrl && nextUrl) {
      url = url.replace(providerUrl, nextUrl);
    }
  }

  return url;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getDeprecated = function() {
  return this.deprecated_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setDeprecated = function(value) {
  this.deprecated_ = value;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.addDimension = function(key, value) {
  if (this.dimensions_ == null) {
    this.dimensions_ = {};
  }

  this.dimensions_[key] = value;

  if (key == 'time') {
    var extents = value.split('/');
    if (extents.length > 1) {
      var n = new Date(extents[0]).getTime();
      var m = new Date(extents[1]).getTime();

      this.setMinDate(Math.min(m, n));
      this.setMaxDate(Math.max(m, n));
    } else {
      this.setMinDate(NaN);
      this.setMaxDate(NaN);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setActiveInternal = function() {
  if (this.isActive()) {
    // call this again when the feature type is ready, if necessary
    this.describeCallback = this.setActiveInternal.bind(this);

    // check if the feature type has been loaded
    if (this.isFeatureTypeReady()) {
      plugin.ogc.OGCLayerDescriptor.base(this, 'setActiveInternal');

      // check for deprecated layers
      if (this.getDeprecated()) {
        os.ui.util.deprecated.showDeprecatedWarning(this.getTitle());
      }

      // notify that the descriptor is ready since this may be async
      this.onDescriptorReady();
    }
  } else {
    return plugin.ogc.OGCLayerDescriptor.base(this, 'setActiveInternal');
  }

  // default to returning false so ready events aren't fired automatically
  return false;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.isFeatureTypeReady = function() {
  if (this.isWfsEnabled() && !this.featureType_) {
    // lazy load the feature type
    this.loadWFSDescribeFeature();
    return false;
  }

  return true;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.isFolder = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.isBaseLayer = function() {
  return this.opaque_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.hasTimeExtent = function() {
  if (this.isWmsEnabled()) {
    return this.dimensions_ != null && 'time' in this.dimensions_;
  }

  if (this.featureType_ != null) {
    return this.featureType_.getStartDateColumnName() !== null || this.featureType_.getEndDateColumnName() !== null;
  }

  return false;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.updatedFromServer = function() {
  this.setDeleteTime(NaN);
  this.updateActiveFromTemp();
  this.updateTags();
};


/**
 * @protected
 */
plugin.ogc.OGCLayerDescriptor.prototype.updateTags = function() {
  this.dispatchEvent(new os.events.PropertyChangeEvent('title'));
};


/**
 *
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.parseBBox = function(node, opt_forcedCrs) {
  var forcedCrs = opt_forcedCrs || /** @type {string} */ (node['CRS']);

  var minx = parseFloat(node['minx']);
  var miny = parseFloat(node['miny']);
  var maxx = parseFloat(node['maxx']);
  var maxy = parseFloat(node['maxy']);

  if (forcedCrs == os.proj.EPSG4326) {
    this.bbox_ = [minx, miny, maxx, maxy];
  } else {
    this.bbox_ = [miny, minx, maxy, maxx];
  }
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getLayerOptions = function() {
  var options = [];

  if (this.isWmsEnabled()) {
    options.push(this.getWmsOptions());
  }

  if (this.isWfsEnabled()) {
    options.push(this.getWfsOptions());
  }

  return options;
};


/**
 * @return {Object.<string, *>}
 * @protected
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWmsOptions = function() {
  var options = {};
  options['id'] = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'tiles';

  var params = new goog.Uri.QueryData();
  params.set('LAYERS', this.getWmsName());
  params.set('VERSION', this.getWmsVersion());

  // merge custom WMS params
  if (this.getWmsParams() != null) {
    params.extend(this.getWmsParams());
  }

  options['baseColor'] = this.getColor();
  options[os.ui.ControlType.COLOR] = os.ui.ColorControlType.PICKER_RESET;

  options['animate'] = this.hasTimeExtent();
  options['dateFormat'] = this.getWmsDateFormat();
  options['extent'] = this.getBBox();
  options['layerType'] = this.getType();
  options['legends'] = this.getLegends();
  options['params'] = params;
  options['provider'] = this.getProvider();
  options['styles'] = this.getStyles();
  options['tags'] = this.getTags();
  options['timeFormat'] = this.getWmsTimeFormat();
  options['title'] = this.getTitle();
  options['type'] = 'WMS';
  options['projections'] = this.getSupportedCRS();

  var attribution = this.getAttribution();
  if (attribution) {
    options['attributions'] = [attribution];
  }

  var wmsUrl = this.getWmsUrl();
  var urls = [wmsUrl];

  if (this.dataProvider) {
    var url = this.dataProvider.getUrl();
    var alternateUrls = this.dataProvider.getAlternateUrls();

    if (url && alternateUrls) {
      for (var i = 0; i < alternateUrls.length; i++) {
        urls.push(wmsUrl.replace(url, alternateUrls[i]));
      }
    }
  }

  options['urls'] = urls;

  if (options['provider']) {
    // check to see if the visibility is configured to false, if not visibility should be true
    options['visible'] = os.settings.get(
        [os.data.ProviderKey.ADMIN, this.getProvider().toLowerCase(), 'visible'], true);
  }

  return options;
};


/**
 * @return {Object<string, *>}
 * @param {Object<string, *>=} opt_options
 * @protected
 */
plugin.ogc.OGCLayerDescriptor.prototype.getWfsOptions = function(opt_options) {
  var options = opt_options || {};
  options['id'] = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'features';

  // color will change with user choices, baseColor maintains the original layer color for reset
  options['baseColor'] = this.getColor();
  options['color'] = this.getColor();
  options[os.ui.ControlType.COLOR] = os.ui.ColorControlType.PICKER_RESET;

  options['animate'] = this.hasTimeExtent();
  options['exclusions'] = true;
  options['featureType'] = this.featureType_;
  options['filter'] = true;
  options['layerType'] = this.getType();
  options['load'] = true;
  options['params'] = os.ogc.getWfsParams(this);
  options['provider'] = this.getProvider();
  options['spatial'] = true;
  options['tags'] = this.getTags();
  options['temporal'] = this.hasTimeExtent();
  options['title'] = this.getTitle();
  options['type'] = 'WFS';
  options['url'] = this.replaceWithNextUrl(this.getWfsUrl());
  options['usePost'] = this.getUsePost();
  options['formats'] = this.getWfsFormats();

  if (options['provider']) {
    // check to see if the visibility is configured to false, if not visibility should be true
    options['visible'] = os.settings.get(
        [os.data.ProviderKey.ADMIN, this.getProvider().toLowerCase(), 'visible'], true);
  }

  return options;
};


/**
 * @protected
 */
plugin.ogc.OGCLayerDescriptor.prototype.loadWFSDescribeFeature = function() {
  var loader = new os.ogc.wfs.DescribeFeatureLoader();
  loader.setUrl(this.getWfsUrl());
  loader.setTypename(this.getWfsName());
  loader.listenOnce(goog.net.EventType.COMPLETE, this.onDescribeComplete_, false, this);
  loader.load();
};


/**
 * @param {goog.events.Event} event
 * @private
 */
plugin.ogc.OGCLayerDescriptor.prototype.onDescribeComplete_ = function(event) {
  var loader = /** @type {os.ogc.wfs.DescribeFeatureLoader} */ (event.target);
  var featureType = loader.getFeatureType();
  if (featureType) {
    this.featureType_ = featureType;
    // apply any presisted settings that may have been restored
    if (this.restoreSettings_) {
      this.featureType_.restore(this.restoreSettings_);
      this.restoreSettings_ = null;
      delete this.restoreSettings_;
    }
  } else {
    this.onDescribeError();
  }

  if (this.describeCallback) {
    this.describeCallback();
    this.describeCallback = null;
  }
};


/**
 * Handle failure to load the feature type.
 *
 * @protected
 */
plugin.ogc.OGCLayerDescriptor.prototype.onDescribeError = function() {
  if (!this.online.refreshStatus()) {
    // disable due to offline status
    this.setActive(false);
  } else {
    // feature type could not be loaded, so disable WFS for the layer
    this.setWfsEnabled(false);
  }

  var msg = this.getFeatureTypeErrorMsg();
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.setDescribeCallback = function(fn) {
  this.describeCallback = fn;
};


/**
 * Gets the error message to show when the DFT fails to load.
 *
 * @return {string}
 */
plugin.ogc.OGCLayerDescriptor.prototype.getFeatureTypeErrorMsg = function() {
  if (!this.online.refreshStatus()) {
    return 'Network is disconnected. ' + this.getWfsName() + ' is unavailable.';
  }

  return 'Failed loading DescribeFeatureType for ' + this.getWfsName() +
      '. Feature requests have been disabled for this layer.';
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.launchFilterManager = function() {
  this.describeCallback = this.launchFilterManager;

  if (this.isFeatureTypeReady()) {
    var id = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + 'features';
    os.ui.query.CombinatorCtrl.launchForLayer(id, this.getTitle() + ' Features');
  }
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getFilterKey = function() {
  return this.wfsUrl_ + os.ui.filter.FILTER_KEY_DELIMITER + this.wfsName_;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getLayerName = function() {
  var name = this.wfsName_;
  if (this.wfsName_) {
    var idx = name.indexOf(':') + 1;
    name = name.substring(idx);
  }
  return name;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getFilterColumns = function() {
  return this.featureType_ ? this.featureType_.getColumns() : null;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getNodeUI = function() {
  var nodeUI = plugin.ogc.OGCLayerDescriptor.base(this, 'getNodeUI');
  nodeUI += '<filterabledescriptornodeui></filterabledescriptornodeui>';
  return nodeUI;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.persist = function(opt_obj) {
  opt_obj = plugin.ogc.OGCLayerDescriptor.base(this, 'persist', opt_obj);
  if (this.featureType_) {
    opt_obj = this.featureType_.persist(opt_obj);
  }
  return opt_obj;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.restore = function(from) {
  plugin.ogc.OGCLayerDescriptor.base(this, 'restore', from);
  if (this.featureType_) {
    this.featureType_.restore(from);
  } else {
    // The featureType has not been created yet, hold the restored
    // settings and apply after featureType is set.
    this.restoreSettings_ = from;
  }
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getTestAreaKey = function(area) {
  var key = [];

  if (this.hasTimeExtent()) {
    var tlc = os.time.TimelineController.getInstance();
    key.push('' + tlc.getStart());
    key.push('' + tlc.getEnd());
  }

  key.push(this.getId());
  key.push(area.getId());

  return key.join('|');
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.testArea = function(area) {
  var result = false;

  // simple bbox check
  try {
    var areaBox = area.getGeometry().getExtent();
    var layerBox = this.getBBox();

    if (areaBox && layerBox) {
      result = ol.extent.intersects(areaBox, layerBox);
    }
  } catch (e) {
  }

  // TODO: if not result, return; otherwise, do more complex check
  return result;
};


/**
 * @inheritDoc
 */
plugin.ogc.OGCLayerDescriptor.prototype.getFilterableTypes = function() {
  return this.getAliases().filter(function(alias) {
    return this.filterableRegexp.test(alias);
  }, this);
};

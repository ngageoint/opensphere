goog.provide('os.ui.ogc.OGCDescriptor');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.data.BaseDescriptor');
goog.require('os.filter.IFilterable');
goog.require('os.ogc');
goog.require('os.ogc.wfs.DescribeFeatureLoader');
goog.require('os.ui.ogc.IOGCDescriptor');



/**
 * @extends {os.data.BaseDescriptor}
 * @implements {os.ui.ogc.IOGCDescriptor}
 * @constructor
 */
os.ui.ogc.OGCDescriptor = function() {
  os.ui.ogc.OGCDescriptor.base(this, 'constructor');

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
   * @private
   */
  this.describeCallback_ = null;

  /**
   * @type {?Object<string, string>}
   * @private
   */
  this.dimensions_ = null;

  /**
   * @type {os.ogc.wfs.FeatureType}
   * @private
   */
  this.featureType_ = null;

  /**
   * @type {?Array<!string>}
   * @private
   */
  this.legends_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.opaque_ = false;

  /**
   * @type {?Array<osx.ogc.TileStyle>}
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
   * Marker for whether the layer is deprecated.
   * @type {boolean}
   * @private
   */
  this.deprecated_ = false;

  this.descriptorType = os.ogc.ID;
};
goog.inherits(os.ui.ogc.OGCDescriptor, os.data.BaseDescriptor);
os.implements(os.ui.ogc.OGCDescriptor, os.filter.IFilterable.ID);
os.implements(os.ui.ogc.OGCDescriptor, os.ui.ogc.IOGCDescriptor.ID);


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getSearchType = function() {
  return 'Layer';
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getType = function() {
  // TODO: do we need this?
  return null;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getIcons = function() {
  // TODO: do we need this?
  return '';
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getAbstract = function() {
  return this.getDescription();
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setAbstract = function(value) {
  this.setDescription(value);
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setActive = function(value) {
  if (this.isWmsEnabled() || this.isWfsEnabled()) {
    // only activate the descriptor if at least one layer type is enabled
    os.ui.ogc.OGCDescriptor.base(this, 'setActive', value);
  } else {
    // otherwise stay deactivated
    this.onDescriptorReady();
  }
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getAliases = function() {
  var aliases = [this.getId()];
  return aliases;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getAttribution = function() {
  return this.attribution_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setAttribution = function(value) {
  this.attribution_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getStyles = function() {
  return this.styles_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setStyles = function(value) {
  this.styles_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getOpaque = function() {
  return this.opaque_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setOpaque = function(value) {
  this.opaque_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getDimensions = function() {
  return this.dimensions_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setDimensions = function(value) {
  this.dimensions_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getBBox = function() {
  return this.bbox_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setBBox = function(value) {
  this.bbox_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getKeywords = function() {
  return this.getTags();
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setKeywords = function(value) {
  this.setTags(value);
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getLegends = function() {
  return this.legends_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setLegends = function(value) {
  this.legends_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getFeatureType = function() {
  return this.featureType_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.isWfsEnabled = function() {
  return this.wfsEnabled_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWfsEnabled = function(value) {
  this.wfsEnabled_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWfsName = function() {
  return this.wfsName_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWfsName = function(value) {
  this.wfsName_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWfsNamespace = function() {
  return this.wfsNameSpace_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWfsNamespace = function(value) {
  this.wfsNameSpace_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWfsUrl = function() {
  return this.wfsUrl_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWfsUrl = function(value) {
  this.wfsUrl_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWfsFormats = function() {
  return this.wfsFormats_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWfsFormats = function(value) {
  this.wfsFormats_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.isWmsEnabled = function() {
  return this.wmsEnabled_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWmsEnabled = function(value) {
  this.wmsEnabled_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWmsVersion = function(value) {
  this.wmsVersion_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWmsVersion = function() {
  return this.wmsVersion_ || ol.DEFAULT_WMS_VERSION;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWmsDateFormat = function() {
  return this.wmsDateFormat_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWmsDateFormat = function(value) {
  this.wmsDateFormat_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWmsParams = function() {
  return this.wmsParams_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWmsParams = function(value) {
  this.wmsParams_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWmsName = function() {
  return this.wmsName_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWmsName = function(value) {
  this.wmsName_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWmsTimeFormat = function() {
  return this.wmsTimeFormat_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWmsTimeFormat = function(value) {
  this.wmsTimeFormat_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getWmsUrl = function() {
  return this.wmsUrl_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setWmsUrl = function(value) {
  this.wmsUrl_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getUsePost = function() {
  return this.usePost_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setUsePost = function(value) {
  this.usePost_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getUrlKey = function() {
  return this.wfsUrl_ + '!!' + this.wfsName_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getDeprecated = function() {
  return this.deprecated_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setDeprecated = function(value) {
  this.deprecated_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.addDimension = function(key, value) {
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
os.ui.ogc.OGCDescriptor.prototype.isFeatureTypeReady = function() {
  if (this.isWfsEnabled() && this.featureType_ == null) {
    // lazy load the feature type
    this.loadWFSDescribeFeature_();
    return false;
  }

  return true;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.isFolder = function() {
  return false;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.isBaseLayer = function() {
  return this.opaque_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.hasTimeExtent = function() {
  return (goog.isDefAndNotNull(this.dimensions_) && 'time' in this.dimensions_) ||
      (goog.isDefAndNotNull(this.featureType_) && (this.featureType_.getStartDateColumnName() != null ||
      this.featureType_.getEndDateColumnName() != null));
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.updatedFromServer = function() {
  this.setDeleteTime(NaN);
  this.updateActiveFromTemp();
};


/**
 *
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.parseBBox = function(node, opt_forcedCrs) {
  var forcedCrs = opt_forcedCrs || /** @type {string} */ (node['CRS']);

  var minx = parseFloat(node['minx']);
  var miny = parseFloat(node['miny']);
  var maxx = parseFloat(node['maxx']);
  var maxy = parseFloat(node['maxy']);

  if (forcedCrs == 'EPSG:4326') {
    this.bbox_ = [minx, miny, maxx, maxy];
  } else {
    this.bbox_ = [miny, minx, maxy, maxx];
  }
};


/**
 * @private
 */
os.ui.ogc.OGCDescriptor.prototype.loadWFSDescribeFeature_ = function() {
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
os.ui.ogc.OGCDescriptor.prototype.onDescribeComplete_ = function(event) {
  var loader = /** @type {os.ogc.wfs.DescribeFeatureLoader} */ (event.target);
  var featureType = loader.getFeatureType();
  if (featureType) {
    this.featureType_ = featureType;
  } else {
    // feature type could not be loaded, so disable WFS for the layer
    this.setWfsEnabled(false);

    var msg = 'Failed loading DescribeFeatureType for ' + this.getWfsName() +
        '. Features related to this layer may not work!';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
  }

  if (this.describeCallback_) {
    this.describeCallback_();
    this.describeCallback_ = null;
  }
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setDescribeCallback = function(fn) {
  this.describeCallback_ = fn;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getLayerName = function() {
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
os.ui.ogc.OGCDescriptor.prototype.isFilterable = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getFilterKey = function() {
  return this.getUrlKey();
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.launchFilterManager = function() {};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getFilterColumns = function() {
  return this.featureType_ ? this.featureType_.getColumns() : null;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.getSupportedCRS = function() {
  return this.wmsSupportedCRS_;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCDescriptor.prototype.setSupportedCRS = function(values) {
  this.wmsSupportedCRS_ = values;
};

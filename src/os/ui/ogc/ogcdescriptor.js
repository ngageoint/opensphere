goog.declareModuleId('os.ui.ogc.OGCDescriptor');

import {DEFAULT_WMS_VERSION} from 'ol/src/source/common.js';

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import BaseDescriptor from '../../data/basedescriptor.js';
import IFilterable from '../../filter/ifilterable.js';
import osImplements from '../../implements.js';
import {ID} from '../../ogc/ogc.js';
import DescribeFeatureLoader from '../../ogc/wfs/describefeatureloader.js';
import {FILTER_KEY_DELIMITER} from '../filter/filter.js';
import IOGCDescriptor from './iogcdescriptor.js';

const EventType = goog.require('goog.net.EventType');

const {default: FeatureType} = goog.requireType('os.ogc.wfs.FeatureType');


/**
 * @implements {IOGCDescriptor}
 */
export default class OGCDescriptor extends BaseDescriptor {
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
     * @type {FeatureType}
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
     * The WFS Content-Type request header.
     * @type {string}
     * @private
     */
    this.wfsContentType_ = 'text/xml';

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
     * If WMTS is enabled for this descriptor.
     * @type {boolean}
     * @private
     */
    this.wmtsEnabled_ = false;

    /**
     * The WMTS date format.
     * @type {?string}
     * @private
     */
    this.wmtsDateFormat_ = null;

    /**
     * The WMTS options.
     * @type {Array<olx.source.WMTSOptions>}
     * @private
     */
    this.wmtsOptions_ = null;

    /**
     * The WMTS time format.
     * @type {?string}
     * @private
     */
    this.wmtsTimeFormat_ = null;

    /**
     * Marker for whether the layer is deprecated.
     * @type {boolean}
     * @private
     */
    this.deprecated_ = false;

    this.descriptorType = ID;
  }

  /**
   * @inheritDoc
   */
  getSearchType() {
    return 'Layer';
  }

  /**
   * @inheritDoc
   */
  getType() {
    // TODO: do we need this?
    return null;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    // TODO: do we need this?
    return '';
  }

  /**
   * @inheritDoc
   */
  getAbstract() {
    return this.getDescription();
  }

  /**
   * @inheritDoc
   */
  setAbstract(value) {
    this.setDescription(value);
  }

  /**
   * @inheritDoc
   */
  setActive(value) {
    if (this.isWmsEnabled() || this.isWmtsEnabled() || this.isWfsEnabled()) {
      // only activate the descriptor if at least one layer type is enabled
      super.setActive(value);
    } else {
      // otherwise stay deactivated
      this.onDescriptorReady();
    }
  }

  /**
   * @inheritDoc
   */
  getAttribution() {
    return this.attribution_;
  }

  /**
   * @inheritDoc
   */
  setAttribution(value) {
    this.attribution_ = value;
  }

  /**
   * @inheritDoc
   */
  getStyles() {
    return this.styles_;
  }

  /**
   * @inheritDoc
   */
  setStyles(value) {
    this.styles_ = value;
  }

  /**
   * @inheritDoc
   */
  getOpaque() {
    return this.opaque_;
  }

  /**
   * @inheritDoc
   */
  setOpaque(value) {
    this.opaque_ = value;
  }

  /**
   * @inheritDoc
   */
  getDimensions() {
    return this.dimensions_;
  }

  /**
   * @inheritDoc
   */
  setDimensions(value) {
    this.dimensions_ = value;
  }

  /**
   * @inheritDoc
   */
  getBBox() {
    return this.bbox_;
  }

  /**
   * @inheritDoc
   */
  setBBox(value) {
    this.bbox_ = value;
  }

  /**
   * @inheritDoc
   */
  getKeywords() {
    return this.getTags();
  }

  /**
   * @inheritDoc
   */
  setKeywords(value) {
    this.setTags(value);
  }

  /**
   * @inheritDoc
   */
  getLegends() {
    return this.legends_;
  }

  /**
   * @inheritDoc
   */
  setLegends(value) {
    this.legends_ = value;
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
  isWfsEnabled() {
    return this.wfsEnabled_;
  }

  /**
   * @inheritDoc
   */
  setWfsEnabled(value) {
    this.wfsEnabled_ = value;
  }

  /**
   * @inheritDoc
   */
  getWfsName() {
    return this.wfsName_;
  }

  /**
   * @inheritDoc
   */
  setWfsName(value) {
    this.wfsName_ = value;
  }

  /**
   * @inheritDoc
   */
  getWfsNamespace() {
    return this.wfsNameSpace_;
  }

  /**
   * @inheritDoc
   */
  setWfsNamespace(value) {
    this.wfsNameSpace_ = value;
  }

  /**
   * @inheritDoc
   */
  getWfsUrl() {
    return this.wfsUrl_;
  }

  /**
   * @inheritDoc
   */
  setWfsUrl(value) {
    this.wfsUrl_ = value;
  }

  /**
   * @inheritDoc
   */
  getWfsContentType() {
    return this.wfsContentType_;
  }

  /**
   * @inheritDoc
   */
  setWfsContentType(value) {
    this.wfsContentType_ = value;
  }

  /**
   * @inheritDoc
   */
  getWfsFormats() {
    return this.wfsFormats_;
  }

  /**
   * @inheritDoc
   */
  setWfsFormats(value) {
    this.wfsFormats_ = value;
  }

  /**
   * @inheritDoc
   */
  isWmsEnabled() {
    return this.wmsEnabled_;
  }

  /**
   * @inheritDoc
   */
  setWmsEnabled(value) {
    this.wmsEnabled_ = value;
  }

  /**
   * @inheritDoc
   */
  setWmsVersion(value) {
    this.wmsVersion_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmsVersion() {
    return this.wmsVersion_ || DEFAULT_WMS_VERSION;
  }

  /**
   * @inheritDoc
   */
  getWmsDateFormat() {
    return this.wmsDateFormat_;
  }

  /**
   * @inheritDoc
   */
  setWmsDateFormat(value) {
    this.wmsDateFormat_ = value;
  }

  /**
   * @inheritDoc
   */
  getWfsParams() {
    return this.wfsParams_;
  }

  /**
   * @inheritDoc
   */
  setWfsParams(value) {
    this.wfsParams_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmsParams() {
    return this.wmsParams_;
  }

  /**
   * @inheritDoc
   */
  setWmsParams(value) {
    this.wmsParams_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmsName() {
    return this.wmsName_;
  }

  /**
   * @inheritDoc
   */
  setWmsName(value) {
    this.wmsName_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmsTimeFormat() {
    return this.wmsTimeFormat_;
  }

  /**
   * @inheritDoc
   */
  setWmsTimeFormat(value) {
    this.wmsTimeFormat_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmsUrl() {
    return this.wmsUrl_;
  }

  /**
   * @inheritDoc
   */
  setWmsUrl(value) {
    this.wmsUrl_ = value;
  }

  /**
   * @inheritDoc
   */
  isWmtsEnabled() {
    return this.wmtsEnabled_;
  }

  /**
   * @inheritDoc
   */
  setWmtsEnabled(value) {
    this.wmtsEnabled_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmtsDateFormat() {
    return this.wmtsDateFormat_;
  }

  /**
   * @inheritDoc
   */
  setWmtsDateFormat(value) {
    this.wmtsDateFormat_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmtsOptions() {
    return this.wmtsOptions_;
  }

  /**
   * @inheritDoc
   */
  setWmtsOptions(value) {
    this.wmtsOptions_ = value;
  }

  /**
   * @inheritDoc
   */
  getWmtsTimeFormat() {
    return this.wmtsTimeFormat_;
  }

  /**
   * @inheritDoc
   */
  setWmtsTimeFormat(value) {
    this.wmtsTimeFormat_ = value;
  }

  /**
   * @inheritDoc
   */
  getUsePost() {
    return this.usePost_;
  }

  /**
   * @inheritDoc
   */
  setUsePost(value) {
    this.usePost_ = value;
  }

  /**
   * @inheritDoc
   */
  getUrlKey() {
    return this.getFilterKey();
  }

  /**
   * @inheritDoc
   */
  getDeprecated() {
    return this.deprecated_;
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
  addDimension(key, value) {
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
  }

  /**
   * @inheritDoc
   */
  isFeatureTypeReady() {
    if (this.isWfsEnabled() && this.featureType_ == null) {
      // lazy load the feature type
      this.loadWFSDescribeFeature_();
      return false;
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  isFolder() {
    return false;
  }

  /**
   * @inheritDoc
   */
  isBaseLayer() {
    return this.opaque_;
  }

  /**
   * @inheritDoc
   */
  hasTimeExtent() {
    return (this.dimensions_ != null && 'time' in this.dimensions_) ||
        (this.featureType_ != null && (this.featureType_.getStartDateColumnName() != null ||
        this.featureType_.getEndDateColumnName() != null));
  }

  /**
   * @inheritDoc
   */
  updatedFromServer() {
    this.setDeleteTime(NaN);
    this.updateActiveFromTemp();
  }

  /**
   *
   * @inheritDoc
   */
  parseBBox(node, opt_forcedCrs) {
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
  }

  /**
   * @private
   */
  loadWFSDescribeFeature_() {
    var loader = new DescribeFeatureLoader();
    loader.setUrl(this.getWfsUrl());
    loader.setTypename(this.getWfsName());
    loader.listenOnce(EventType.COMPLETE, this.onDescribeComplete_, false, this);
    loader.load();
  }

  /**
   * @param {goog.events.Event} event
   * @private
   */
  onDescribeComplete_(event) {
    var loader = /** @type {DescribeFeatureLoader} */ (event.target);
    var featureType = loader.getFeatureType();
    if (featureType) {
      this.featureType_ = featureType;
    } else {
      // feature type could not be loaded, so disable WFS for the layer
      this.setWfsEnabled(false);

      var msg = 'Failed loading DescribeFeatureType for ' + this.getWfsName() +
          '. Features related to this layer may not work!';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
    }

    if (this.describeCallback_) {
      this.describeCallback_();
      this.describeCallback_ = null;
    }
  }

  /**
   * @inheritDoc
   */
  setDescribeCallback(fn) {
    this.describeCallback_ = fn;
  }

  /**
   * @inheritDoc
   */
  getLayerName() {
    var name = this.wfsName_;
    if (this.wfsName_) {
      var idx = name.indexOf(':') + 1;
      name = name.substring(idx);
    }
    return name;
  }

  /**
   * @inheritDoc
   */
  isFilterable() {
    return true;
  }

  /**
   * @inheritDoc
   */
  getFilterKey() {
    return this.wfsUrl_ + FILTER_KEY_DELIMITER + this.wfsName_;
  }

  /**
   * @inheritDoc
   */
  launchFilterManager() {}

  /**
   * @inheritDoc
   */
  getFilterColumns() {
    return this.featureType_ ? this.featureType_.getColumns() : null;
  }

  /**
   * @inheritDoc
   */
  getSupportedCRS() {
    return this.wmsSupportedCRS_;
  }

  /**
   * @inheritDoc
   */
  setSupportedCRS(values) {
    this.wmsSupportedCRS_ = values;
  }
}

osImplements(OGCDescriptor, IFilterable.ID);
osImplements(OGCDescriptor, IOGCDescriptor.ID);

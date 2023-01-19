goog.declareModuleId('plugin.ogc.OGCLayerDescriptor');

import {intersects} from 'ol/src/extent.js';
import {DEFAULT_WMS_VERSION} from 'ol/src/source/common.js';
import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import * as osColor from '../../os/color.js';
import Settings from '../../os/config/settings.js';
import * as data from '../../os/data/data.js';
import IAreaTest from '../../os/data/iareatest.js';
import LayerSyncDescriptor from '../../os/data/layersyncdescriptor.js';
import PropertyChangeEvent from '../../os/events/propertychangeevent.js';
import IFilterable from '../../os/filter/ifilterable.js';
import MappingManager from '../../os/im/mapping/mappingmanager.js';
import osImplements from '../../os/implements.js';
import LayerType from '../../os/layer/layertype.js';
import osOgcLayerType from '../../os/ogc/layertype.js';
import * as ogc from '../../os/ogc/ogc.js';
import DescribeFeatureLoader from '../../os/ogc/wfs/describefeatureloader.js';
import * as wmts from '../../os/ogc/wmts/wmts.js';
import * as osProj from '../../os/proj/proj.js';
import registerClass from '../../os/registerclass.js';
import TimelineController from '../../os/time/timelinecontroller.js';
import ColorControlType from '../../os/ui/colorcontroltype.js';
import ControlType from '../../os/ui/controltype.js';
import BaseProvider from '../../os/ui/data/baseprovider.js';
import * as filter from '../../os/ui/filter/filter.js';
import {directiveTag as nodeUi} from '../../os/ui/filter/ui/filterabledescriptornodeui.js';
import * as icons from '../../os/ui/icons/index.js';
import Icons from '../../os/ui/icons.js';
import IconsSVG from '../../os/ui/iconssvg.js';
import IFeatureTypeDescriptor from '../../os/ui/ogc/ifeaturetypedescriptor.js';
import IOGCDescriptor from '../../os/ui/ogc/iogcdescriptor.js';
import {launchForLayer} from '../../os/ui/query/combinator.js';
import AbstractLoadingServer from '../../os/ui/server/abstractloadingserver.js';
import * as deprecated from '../../os/ui/util/deprecated.js';

const QueryData = goog.require('goog.Uri.QueryData');
const EventType = goog.require('goog.net.EventType');
const googString = goog.require('goog.string');

/**
 * @implements {IOGCDescriptor}
 * @implements {IFilterable}
 * @implements {IAreaTest}
 */
export default class OGCLayerDescriptor extends LayerSyncDescriptor {
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
     * @protected
     */
    this.describeCallback = null;

    /**
     * @type {?Object<string, string>}
     * @private
     */
    this.dimensions_ = null;

    /**
     * @type {IFeatureType}
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
     * @type {QueryData}
     * @private
     */
    this.wmsParams_ = null;

    /**
     * @type {QueryData}
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
     * Marker for whether the layer is deprecated. If a layer is deprecated, it will pop up a notification to the user
     * to stop using it when the descriptor is activated.
     * @type {boolean}
     * @private
     */
    this.deprecated_ = false;

    /**
     * Persisted settings to restore.
     * @type {Object}
     * @private
     */
    this.restoreSettings_ = null;

    /**
     * Regular expression to test for filterable types.
     * @type {RegExp}
     * @protected
     */
    this.filterableRegexp = OGCLayerDescriptor.FILTERABLE_RE;

    this.descriptorType = ogc.ID;
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
    const hasTileLayer = this.wmsEnabled_ || this.wmtsEnabled_;
    if (hasTileLayer && this.wfsEnabled_) {
      return LayerType.GROUPS;
    } else if (hasTileLayer) {
      return LayerType.TILES;
    } else if (this.wfsEnabled_) {
      return LayerType.FEATURES;
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    var iconsSVG = this.getSVGSet();
    var s = '';
    var color = this.getColor() ? osColor.toRgbArray(this.getColor()) : [255, 255, 255, 1];

    if (this.deprecated_) {
      s += Icons.DEPRECATED;
    }

    s += icons.createIconSet(googString.getRandomString(), iconsSVG, [], color);

    return s;
  }

  /**
   * Gets the set of appropriate layer icons as SVG.
   *
   * @return {Array<string>}
   */
  getSVGSet() {
    var iconsSVG = [];

    if (this.wmsEnabled_ || this.wmtsEnabled_) {
      iconsSVG.push(IconsSVG.TILES);
    }

    if (this.wfsEnabled_) {
      iconsSVG.push(IconsSVG.FEATURES);
    }

    if (this.hasTimeExtent()) {
      iconsSVG.push(IconsSVG.TIME);
    }

    return iconsSVG;
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
  getExplicitTitle() {
    var title = '';

    if (this.isWmsEnabled() || this.isWmtsEnabled()) {
      title = 'Tiles';
    }
    if (this.isWfsEnabled()) {
      title += title ? ' and Features' : 'Features';
    }

    return title;
  }

  /**
   * @inheritDoc
   */
  getAliases() {
    var aliases = [this.getId()];
    if (this.wmsEnabled_ || this.wmtsEnabled_) {
      aliases.push(this.getId() + BaseProvider.ID_DELIMITER + 'tiles');
    }
    if (this.wfsEnabled_) {
      aliases.push(this.getId() + BaseProvider.ID_DELIMITER + 'features');
    }

    return aliases;
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
  getSupportedCRS() {
    return this.wmsSupportedCRS_;
  }

  /**
   * @inheritDoc
   */
  setSupportedCRS(values) {
    this.wmsSupportedCRS_ = values;
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
  isFilterable() {
    return this.isWfsEnabled();
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
  getWmsVersion() {
    return this.wmsVersion_ || DEFAULT_WMS_VERSION;
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
   * If the provider is available and has alternate URLs, replaces the URL with the next available URL from the server.
   *
   * @param {?string} url The URL to replace
   * @return {?string}
   * @protected
   */
  replaceWithNextUrl(url) {
    if (url && this.dataProvider instanceof AbstractLoadingServer) {
      var providerUrl = this.dataProvider.getUrl();
      var nextUrl = this.dataProvider.getNextUrl();

      if (providerUrl && nextUrl) {
        url = url.replace(providerUrl, nextUrl);
      }
    }

    return url;
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
  setActiveInternal() {
    if (this.isActive()) {
      // call this again when the feature type is ready, if necessary
      this.describeCallback = this.setActiveInternal.bind(this);

      // check if the feature type has been loaded
      if (this.isFeatureTypeReady()) {
        super.setActiveInternal();

        // check for deprecated layers
        if (this.getDeprecated()) {
          deprecated.showDeprecatedWarning(this.getTitle());
        }

        // notify that the descriptor is ready since this may be async
        this.onDescriptorReady();
      }
    } else {
      return super.setActiveInternal();
    }

    // default to returning false so ready events aren't fired automatically
    return false;
  }

  /**
   * @inheritDoc
   */
  isFeatureTypeReady() {
    if (this.isWfsEnabled() && !this.featureType_) {
      // lazy load the feature type
      this.loadWFSDescribeFeature();
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
    if (this.isWmsEnabled()) {
      return this.dimensions_ != null && 'time' in this.dimensions_;
    }

    if (this.isWmtsEnabled() && this.wmtsOptions_) {
      return this.wmtsOptions_.some((options) => !!wmts.getTimeKey(options && options.dimensions || null));
    }

    if (this.featureType_ != null) {
      return this.featureType_.getStartDateColumnName() !== null || this.featureType_.getEndDateColumnName() !== null;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  updatedFromServer() {
    this.setDeleteTime(NaN);
    this.updateActiveFromTemp();
    this.updateTags();
  }

  /**
   * @protected
   */
  updateTags() {
    this.dispatchEvent(new PropertyChangeEvent('title'));
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

    if (forcedCrs == osProj.EPSG4326) {
      this.bbox_ = [minx, miny, maxx, maxy];
    } else {
      this.bbox_ = [miny, minx, maxy, maxx];
    }
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    var options = [];

    if (this.isWmsEnabled()) {
      options.push(this.getWmsOptions());
    }

    if (this.isWmtsEnabled()) {
      options.push(this.getWmtsLayerOptions());
    }

    if (this.isWfsEnabled()) {
      options.push(this.getWfsOptions());
    }

    return options;
  }

  /**
   * @return {Object<string, *>}
   * @protected
   */
  getWmsOptions() {
    var options = {};
    options['id'] = this.getId() + BaseProvider.ID_DELIMITER + 'tiles';

    var params = new QueryData();
    params.set('LAYERS', this.getWmsName());
    params.set('VERSION', this.getWmsVersion());

    // merge custom WMS params
    if (this.getWmsParams() != null) {
      params.extend(this.getWmsParams());
    }

    options['baseColor'] = this.getColor();
    options[ControlType.COLOR] = ColorControlType.PICKER_RESET;

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
      const ogcServer = /** @type {OGCServer} */ (this.dataProvider);

      var url = ogcServer.getUrl();
      var alternateUrls = ogcServer.getAlternateUrls();

      if (url && alternateUrls) {
        for (var i = 0; i < alternateUrls.length; i++) {
          urls.push(wmsUrl.replace(url, alternateUrls[i]));
        }
      }
    }

    options['urls'] = urls;

    if (options['provider']) {
      // check to see if the visibility is configured to false, if not visibility should be true
      options['visible'] = Settings.getInstance().get(
          [data.ProviderKey.ADMIN, this.getProvider().toLowerCase(), 'visible'], true);
    }

    return options;
  }

  /**
   * Get the options object for the WMTS layer.
   * @return {Object<string, *>}
   * @protected
   */
  getWmtsLayerOptions() {
    const id = this.getId() + BaseProvider.ID_DELIMITER + 'tiles';
    const wmtsOptions = this.getWmtsOptions();
    const projections = wmtsOptions.map(wmts.optionsToProjection);

    const options = {
      'id': id,
      'type': osOgcLayerType.WMTS,
      'provider': this.getProvider(),
      'title': this.getTitle(),
      'extent': this.getBBox(),
      'layerType': this.getType(),
      'animate': this.hasTimeExtent(),
      'dateFormat': this.getWmtsDateFormat(),
      'timeFormat': this.getWmtsTimeFormat(),
      'crossOrigin': wmtsOptions.crossOrigin,
      'projections': projections,
      'wmtsOptions': wmtsOptions
    };

    return options;
  }

  /**
   * @return {Object<string, *>}
   * @param {Object<string, *>=} opt_options
   * @protected
   */
  getWfsOptions(opt_options) {
    var options = opt_options || {};
    options['id'] = this.getId() + BaseProvider.ID_DELIMITER + 'features';

    // color will change with user choices, baseColor maintains the original layer color for reset
    options['baseColor'] = this.getColor();
    options['color'] = this.getColor();
    options[ControlType.COLOR] = ColorControlType.PICKER_RESET;

    options['animate'] = this.hasTimeExtent();
    options['contentType'] = this.getWfsContentType();
    options['exclusions'] = true;
    options['featureType'] = this.featureType_;
    options['filter'] = true;
    options['layerType'] = this.getType();
    options['load'] = true;
    options['params'] = ogc.getWfsParams(this);
    options['provider'] = this.getProvider();
    options['spatial'] = true;
    options['tags'] = this.getTags();
    options['temporal'] = this.hasTimeExtent();
    options['title'] = this.getTitle();
    options['type'] = 'WFS';
    options['url'] = this.replaceWithNextUrl(this.getWfsUrl());
    options['usePost'] = this.getUsePost();
    options['formats'] = this.getWfsFormats();

    const mappings = this.getMappings();
    if (mappings) {
      options['mappings'] = this.getMappings();
    }

    if (options['provider']) {
      // check to see if the visibility is configured to false, if not visibility should be true
      options['visible'] = Settings.getInstance().get(
          [data.ProviderKey.ADMIN, this.getProvider().toLowerCase(), 'visible'], true);
    }

    return options;
  }

  /**
   * @protected
   */
  loadWFSDescribeFeature() {
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
      // apply any persisted settings that may have been restored
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
  }

  /**
   * Handle failure to load the feature type.
   *
   * @protected
   */
  onDescribeError() {
    if (!this.online.refreshStatus()) {
      // disable due to offline status
      this.setActive(false);
    } else {
      // feature type could not be loaded, so disable WFS for the layer
      this.setWfsEnabled(false);
    }

    var msg = this.getFeatureTypeErrorMsg();
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
  }

  /**
   * @inheritDoc
   */
  setDescribeCallback(fn) {
    this.describeCallback = fn;
  }

  /**
   * Gets the error message to show when the DFT fails to load.
   *
   * @return {string}
   */
  getFeatureTypeErrorMsg() {
    if (!this.online.refreshStatus()) {
      return 'Network is disconnected. ' + this.getWfsName() + ' is unavailable.';
    }

    return 'Failed loading DescribeFeatureType for ' + this.getWfsName() +
        '. Feature requests have been disabled for this layer.';
  }

  /**
   * @inheritDoc
   */
  launchFilterManager() {
    this.describeCallback = this.launchFilterManager;

    if (this.isFeatureTypeReady()) {
      var id = this.getId() + BaseProvider.ID_DELIMITER + 'features';
      launchForLayer(id, this.getTitle() + ' Features');
    }
  }

  /**
   * @inheritDoc
   */
  getFilterKey() {
    return this.wfsUrl_ + filter.FILTER_KEY_DELIMITER + this.wfsName_;
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
  getFilterColumns() {
    return this.featureType_ ? this.featureType_.getColumns() : null;
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    var nodeUI = super.getNodeUI();
    nodeUI += `<${nodeUi}></${nodeUi}>`;
    return nodeUI;
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    opt_obj = super.persist(opt_obj);

    var mappings = this.getMappings();
    if (mappings) {
      var mm = MappingManager.getInstance();
      opt_obj['mappings'] = mm.persistMappings(mappings);
    }

    if (this.featureType_) {
      opt_obj = this.featureType_.persist(opt_obj);
    }
    return opt_obj;
  }

  /**
   * @inheritDoc
   */
  restore(from) {
    super.restore(from);

    if (from['mappings']) {
      var mm = MappingManager.getInstance();
      this.setMappings(mm.restoreMappings(from['mappings']));
    }

    if (this.featureType_) {
      this.featureType_.restore(from);
    } else {
      // The featureType has not been created yet, hold the restored
      // settings and apply after featureType is set.
      this.restoreSettings_ = from;
    }
  }

  /**
   * @inheritDoc
   */
  getTestAreaKey(area) {
    var key = [];

    if (this.hasTimeExtent()) {
      var tlc = TimelineController.getInstance();
      key.push('' + tlc.getStart());
      key.push('' + tlc.getEnd());
    }

    key.push(this.getId());
    key.push(area.getId());

    return key.join('|');
  }

  /**
   * @inheritDoc
   */
  testArea(area) {
    var result = false;

    // simple bbox check
    try {
      var areaBox = area.getGeometry().getExtent();
      var layerBox = this.getBBox();

      if (areaBox && layerBox) {
        result = intersects(areaBox, layerBox);
      }
    } catch (e) {
    }

    // TODO: if not result, return; otherwise, do more complex check
    return result;
  }

  /**
   * @inheritDoc
   */
  getFilterableTypes() {
    return this.getAliases().filter(function(alias) {
      return this.filterableRegexp.test(alias);
    }, this);
  }
}


/**
 * Class name
 * @type {string}
 */
OGCLayerDescriptor.NAME = 'plugin.ogc.OGCLayerDescriptor';
registerClass(OGCLayerDescriptor.NAME, OGCLayerDescriptor);
osImplements(OGCLayerDescriptor, IAreaTest.ID);
osImplements(OGCLayerDescriptor, IFilterable.ID);
osImplements(OGCLayerDescriptor, IFeatureTypeDescriptor.ID);
osImplements(OGCLayerDescriptor, IOGCDescriptor.ID);


/**
 * Regular expression to test for filterable types.
 * @type {RegExp}
 * @const
 */
OGCLayerDescriptor.FILTERABLE_RE = /#features/;

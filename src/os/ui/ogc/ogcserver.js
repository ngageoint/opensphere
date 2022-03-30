goog.declareModuleId('os.ui.ogc.OGCServer');

import WMSCapabilities from 'ol/src/format/WMSCapabilities.js';
import WMTSCapabilities from 'ol/src/format/WMTSCapabilities.js';
import {readHref} from 'ol/src/format/xlink.js';

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import Settings from '../../config/settings.js';
import DataManager from '../../data/datamanager.js';
import IDataProvider from '../../data/idataprovider.js';
import {isLocal} from '../../file/index.js';
import osImplements from '../../implements.js';
import Request from '../../net/request.js';
import {ID, getException} from '../../ogc/ogc.js';
import WMTSLayerParsers from '../../ogc/wmts/wmtslayerparsers.js';
import BaseProvider from '../data/baseprovider.js';
import DescriptorNode from '../data/descriptornode.js';
import AbstractLoadingServer from '../server/abstractloadingserver.js';
import SlickTreeNode from '../slick/slicktreenode.js';
import {isLayerDeprecated} from '../util/deprecated.js';
import IOGCDescriptor from './iogcdescriptor.js';
import LayerParsers from './wms/layerparsers.js';

const Uri = goog.require('goog.Uri');
const QueryData = goog.require('goog.Uri.QueryData');
const {removeDuplicates} = goog.require('goog.array');
const dispose = goog.require('goog.dispose');
const {loadXml} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const {getValueByKeys} = goog.require('goog.object');
const {contains: stringContains, unescapeEntities} = goog.require('goog.string');


const Logger = goog.requireType('goog.log.Logger');
const {default: IDataDescriptor} = goog.requireType('os.data.IDataDescriptor');
const {default: IServerDescriptor} = goog.requireType('os.data.IServerDescriptor');
const {default: OSFile} = goog.requireType('os.file.File');
const {default: IWMTSLayerParser} = goog.requireType('os.ogc.wmts.IWMTSLayerParser');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');
const {default: IWMSLayerParser} = goog.requireType('os.ui.ogc.wms.IWMSLayerParser');


/**
 * Names used by fixed subfolders for OGC servers.
 * @enum {string}
 */
const OGCFolderType = {
  WFS_ONLY: 'WFS (Features) Only'
};


/**
 * The OGC server provider
 *
 * @implements {IDataProvider}
 */
export default class OGCServer extends AbstractLoadingServer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = OGCServer.LOGGER_;
    this.providerType = ID;

    /**
     * @type {Array<string>}
     * @private
     */
    this.abstracts_ = [];

    /**
     * @type {?IWMSLayerParser}
     * @private
     */
    this.parser_ = null;

    /**
     * @type {?IWMTSLayerParser}
     * @private
     */
    this.wmtsLayerParser_ = null;

    /**
     * @type {!Object<string, number>}
     * @protected
     */
    this.folderPriority = {};

    /**
     * @type {!SlickTreeNode}
     * @protected
     * @todo This needs to be a DataTreeNode with min/max date
     */
    this.wfsOnlyFolder = new SlickTreeNode();

    /**
     * @type {!Array<!ITreeNode>}
     * @private
     */
    this.toAdd_ = [];

    /**
     * @type {boolean}
     * @private
     */
    this.lowerCase_ = false;

    /**
     * @type {string}
     * @private
     */
    this.originalWfsUrl_ = '';

    /**
     * @type {string}
     * @private
     */
    this.originalWmsUrl_ = '';

    /**
     * @type {string}
     * @private
     */
    this.originalWmtsUrl_ = '';

    /**
     * If WMTS is preferred over WMS, when both are available.
     * @type {boolean}
     * @private
     */
    this.wmtsPreferred_ = false;

    /**
     * The WFS Content-Type request header.
     * @type {string}
     * @private
     */
    this.wfsContentType_ = 'text/xml';

    /**
     * @type {QueryData}
     * @private
     */
    this.wfsParams_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.wfsPost_ = false;

    /**
     * @type {string}
     * @private
     */
    this.wfsUrl_ = '';

    /**
     * @type {Array<string>}
     * @private
     */
    this.wfsFormats_ = [];

    /**
     * @type {string}
     * @private
     */
    this.wmsDateFormat_ = '';

    /**
     * @type {QueryData}
     * @private
     */
    this.wmsParams_ = null;

    /**
     * @type {string}
     * @private
     */
    this.wmsTimeFormat_ = '';

    /**
     * @type {string}
     * @private
     */
    this.wmsUrl_ = '';

    /**
     * The WMTS capabilities document.
     * @type {Object}
     * @private
     */
    this.wmtsCapabilities_ = null;

    /**
     * @type {QueryData}
     * @private
     */
    this.wmtsParams_ = null;

    /**
     * @type {string}
     * @private
     */
    this.wmtsDateFormat_ = '';

    /**
     * @type {string}
     * @private
     */
    this.wmtsTimeFormat_ = '';

    /**
     * @type {string}
     * @private
     */
    this.wmtsUrl_ = '';

    /**
     * @type {boolean}
     * @private
     */
    this.wmsDone_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.wmtsDone_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.wfsDone_ = false;

    /**
     * @type {string}
     * @private
     */
    this.wpsUrl_ = '';

    /**
     * Flag to indicate whether GetMap & GetFeature operation URLs should
     * be parsed from the Capabilities documents and used for layer queries.
     * If false, the original URLs set in the server config will be used
     * for layer queries.
     *
     * @type {boolean}
     * @private
     */
    this.parseOperationURLs_ = true;

    /**
     * The number of alternate WMS URL tests pending.
     * @type {number}
     * @private
     */
    this.pendingAlternateTests_ = 0;
  }

  /**
   * @return {Array<string>}
   */
  getAbstracts() {
    return this.abstracts_;
  }

  /**
   * @return {boolean}
   */
  getLowerCase() {
    return this.lowerCase_;
  }

  /**
   * @param {boolean} value
   */
  setLowerCase(value) {
    this.lowerCase_ = value;
  }

  /**
   * @return {string}
   */
  getOriginalWfsUrl() {
    return this.originalWfsUrl_ || this.wfsUrl_;
  }

  /**
   * @param {string} value
   */
  setOriginalWfsUrl(value) {
    this.originalWfsUrl_ = value;
  }

  /**
   * @return {string}
   */
  getOriginalWmsUrl() {
    return this.originalWmsUrl_ || this.wmsUrl_;
  }

  /**
   * @param {string} value
   */
  setOriginalWmsUrl(value) {
    this.originalWmsUrl_ = value;
  }

  /**
   * @return {string}
   */
  getOriginalWmtsUrl() {
    return this.originalWmtsUrl_ || this.wmtsUrl_;
  }

  /**
   * @param {string} value
   */
  setOriginalWmtsUrl(value) {
    this.originalWmtsUrl_ = value;
  }

  /**
   * If WMTS is preferred over WMS, when both are available.
   * @return {boolean}
   */
  isWmtsPreferred() {
    return this.wmtsPreferred_;
  }

  /**
   * Set if WMTS is preferred over WMS, when both are available.
   * @param {boolean} value
   */
  setWmtsPreferred(value) {
    this.wmtsPreferred_ = value;
  }

  /**
   * @return {string}
   */
  getWfsContentType() {
    return this.wfsContentType_;
  }

  /**
   * @param {string} value
   */
  setWfsContentType(value) {
    this.wfsContentType_ = value;
  }

  /**
   * @return {Array<string>}
   */
  getWfsFormats() {
    return this.wfsFormats_;
  }

  /**
   * @return {QueryData}
   */
  getWfsParams() {
    return this.wfsParams_;
  }

  /**
   * @param {QueryData} value
   */
  setWfsParams(value) {
    this.wfsParams_ = value;
  }

  /**
   * @return {boolean}
   */
  getWfsPost() {
    return this.wfsPost_;
  }

  /**
   * @param {boolean} value
   */
  setWfsPost(value) {
    this.wfsPost_ = value;
  }

  /**
   * @return {string}
   */
  getWfsUrl() {
    return this.wfsUrl_ || this.getOriginalWfsUrl();
  }

  /**
   * @param {string} value
   */
  setWfsUrl(value) {
    this.wfsUrl_ = value;
  }

  /**
   * @return {string}
   */
  getWmsDateFormat() {
    return this.wmsDateFormat_;
  }

  /**
   * @param {string} value
   */
  setWmsDateFormat(value) {
    this.wmsDateFormat_ = value;
  }

  /**
   * @return {QueryData}
   */
  getWmsParams() {
    return this.wmsParams_;
  }

  /**
   * @param {QueryData} value
   */
  setWmsParams(value) {
    this.wmsParams_ = value;
  }

  /**
   * @return {string}
   */
  getWmsTimeFormat() {
    return this.wmsTimeFormat_;
  }

  /**
   * @param {string} value
   */
  setWmsTimeFormat(value) {
    this.wmsTimeFormat_ = value;
  }

  /**
   * @return {string}
   */
  getWmsUrl() {
    return this.wmsUrl_ || this.getOriginalWmsUrl();
  }

  /**
   * @param {string} value
   */
  setWmsUrl(value) {
    this.wmsUrl_ = value;
  }

  /**
   * @return {string}
   */
  getWmtsDateFormat() {
    return this.wmtsDateFormat_;
  }

  /**
   * @param {string} dateFormat The date format
   */
  setWmtsDateFormat(dateFormat) {
    this.wmtsDateFormat_ = dateFormat;
  }

  /**
   * @return {QueryData}
   */
  getWmtsParams() {
    return this.wmtsParams_;
  }

  /**
   * @param {QueryData} value
   */
  setWmtsParams(value) {
    this.wmtsParams_ = value;
  }

  /**
   * @return {string}
   */
  getWmtsTimeFormat() {
    return this.wmtsTimeFormat_;
  }

  /**
   * @param {string} timeFormat The time format
   */
  setWmtsTimeFormat(timeFormat) {
    this.wmtsTimeFormat_ = timeFormat;
  }

  /**
   * @return {string}
   */
  getWmtsUrl() {
    return this.wmtsUrl_ || this.getOriginalWmtsUrl();
  }

  /**
   * @param {string} value
   */
  setWmtsUrl(value) {
    this.wmtsUrl_ = value;
  }

  /**
   * @return {string}
   */
  getWpsUrl() {
    return this.wpsUrl_;
  }

  /**
   * @param {string} value
   */
  setWpsUrl(value) {
    this.wpsUrl_ = value;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();

    this.wfsOnlyFolder.setId(OGCFolderType.WFS_ONLY);
    this.wfsOnlyFolder.setLabel(OGCFolderType.WFS_ONLY);
    this.folderPriority[OGCFolderType.WFS_ONLY] = 0;

    // TODO: Do we need to set min/max date on the WFS only folder?
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);

    this.setWmsUrl(/** @type {string} */ (config['wms']));
    this.setOriginalWmsUrl(/** @type {string} */ (config['wms']));
    this.setWmsTimeFormat(/** @type {string} */ (config['wmsTimeFormat']));
    this.setWmsDateFormat(/** @type {string} */ (config['wmsDateFormat']));

    this.setWmtsUrl(/** @type {string} */ (config['wmts']));
    this.setOriginalWmtsUrl(/** @type {string} */ (config['wmts']));
    this.setWmtsDateFormat(/** @type {string} */ (config['wmtsDateFormat']));
    this.setWmtsTimeFormat(/** @type {string} */ (config['wmtsTimeFormat']));

    var wmtsParams = /** @type {string|undefined} */ (config['wmtsParams']);
    this.setWmtsParams(wmtsParams ? new QueryData(wmtsParams) : null);

    // default to using WMS
    this.setWmtsPreferred(!!config['wmtsPreferred']);

    this.setWfsUrl(/** @type {string} */ (config['wfs']));
    this.setOriginalWfsUrl(/** @type {string} */ (config['wfs']));

    this.setLowerCase(/** @type {boolean} */ (config['lowerCase']));
    this.setWpsUrl(/** @type {string} */ (config['wps']));

    if (config['parseOperationURLs'] !== undefined) {
      this.parseOperationURLs_ = /** @type {boolean} */ (config['parseOperationURLs']);
    }

    var wfsContentType = /** @type {string|undefined} */ (config['wfsContentType']);
    if (wfsContentType) {
      this.setWfsContentType(wfsContentType);
    }

    var wfsUrl = this.getWfsUrl();
    if ('wfsParams' in config) {
      this.setWfsParams(new QueryData(/** @type {string} */ (config['wfsParams'])));
    } else if (wfsUrl) {
      // attempt to generate custom WFS params from the wfsUrl
      var wfsUri = new Uri(wfsUrl);
      var queryData = wfsUri.getQueryData();
      queryData.setIgnoreCase(true);
      queryData.remove('request');
      this.setWfsParams(queryData.getCount() ? queryData : null);
    } else {
      this.setWfsParams(null);
    }

    var wmsUrl = this.getWmsUrl();
    if ('wmsParams' in config) {
      this.setWmsParams(new QueryData(/** @type {string} */ (config['wmsParams'])));
    } else if (wmsUrl) {
      // attempt to generate custom WMS params from the wmsUrl
      var wmsUri = new Uri(wmsUrl);
      queryData = wmsUri.getQueryData();
      queryData.setIgnoreCase(true);
      queryData.remove('request');
      this.setWmsParams(queryData.getCount() ? queryData : null);
    } else {
      this.setWmsParams(null);
    }
  }

  /**
   * @inheritDoc
   */
  finish() {
    if (this.isLoaded()) {
      if (this.toAdd_.length) {
        this.addChildren(this.toAdd_);
        this.toAdd_.length = 0;

        this.addParentTags_(this);
      }

      if (this.wfsOnlyFolder.hasChildren()) {
        this.addFolder(this.wfsOnlyFolder);
      }

      this.finalizeFinish();

      if (!this.getPing()) {
        this.markAllDescriptors();
      }

      super.finish();
    }
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    super.load(opt_ping);

    this.setChildren(null);
    this.toAdd_.length = 0;
    this.wmtsCapabilities_ = null;

    this.wmsDone_ = false;
    this.wmtsDone_ = false;
    this.wfsDone_ = false;
    this.pendingAlternateTests_ = 0;

    this.loadWmsCapabilities();
    this.loadWmtsCapabilities();
    this.loadWfsCapabilities();
  }

  /**
   * @inheritDoc
   */
  isLoaded() {
    return super.isLoaded() &&
        this.wmsDone_ && this.wmtsDone_ && this.wfsDone_ && this.pendingAlternateTests_ <= 0;
  }

  /**
   * Called after finishing the load of the OGC layers. Used by extending classes.
   *
   * @protected
   */
  finalizeFinish() {}

  /**
   * Builds query data from the WFS params.
   *
   * @return {QueryData}
   * @private
   */
  getWfsQueryData_() {
    var queryData = this.wfsParams_ ? this.wfsParams_.clone() : new QueryData();
    queryData.setIgnoreCase(true);

    if (!queryData.containsKey('service')) {
      queryData.set('service', 'WFS');
    }
    queryData.set('request', 'GetCapabilities');
    return queryData;
  }

  /**
   * Builds query data from the WMS params.
   *
   * @return {QueryData}
   * @private
   */
  getWmsQueryData_() {
    var queryData = this.wmsParams_ ? this.wmsParams_.clone() : new QueryData();
    queryData.setIgnoreCase(true);

    if (!queryData.containsKey('service')) {
      queryData.set('service', 'WMS');
    }
    queryData.set('request', 'GetCapabilities');

    var version = OGCServer.DEFAULT_WMS_VERSION;
    if (queryData.containsKey('version')) {
      version = queryData.get('version');
    }

    queryData.set('version', version);
    return queryData;
  }

  /**
   * Loads WMS GetCapabilities from the configured server.
   *
   * @protected
   */
  loadWmsCapabilities() {
    var wmsUrl = this.getOriginalWmsUrl();
    if (wmsUrl) {
      log.info(OGCServer.LOGGER_, this.getLabel() + ' requesting WMS GetCapabilities');
      this.testWmsUrl(wmsUrl);

      var alternateUrls = this.getAlternateUrls();
      if (alternateUrls && alternateUrls.length > 0) {
        this.pendingAlternateTests_ = alternateUrls.length;

        var serverUrl = this.getUrl();
        for (var i = 0; i < alternateUrls.length; i++) {
          var url = wmsUrl.replace(serverUrl, alternateUrls[i]);
          this.testWmsUrl(url, this.onAlternateSuccess, this.onAlternateError.bind(this, alternateUrls[i]));
        }
      }
    } else {
      this.wmsDone_ = true;
      this.finish();
    }
  }

  /**
   * Handle successful load of alternate URL.
   *
   * @param {goog.events.Event} event The error event
   * @protected
   */
  onAlternateSuccess(event) {
    dispose(event.target);
    this.pendingAlternateTests_--;
    this.finish();
  }

  /**
   * Handle failure to load alternate URL.
   *
   * @param {string} value The alternate URL
   * @param {goog.events.Event} event The error event
   * @protected
   */
  onAlternateError(value, event) {
    // remove the failed URL and alert the user
    this.removeAlternateUrl(value);

    var errorMsg = 'Alternate URL "' + value + '" for ' + this.getLabel() + ' failed loading WMS GetCapabilities and ' +
        'has been removed.';
    AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR, this.log);

    // finished testing the URL
    this.onAlternateSuccess(event);
  }

  /**
   * Test a WMS URL to check if its GetCapabilities is valid.
   *
   * @param {string} url The WMS URL
   * @param {function(goog.events.Event)=} opt_success The success handler
   * @param {function(goog.events.Event)=} opt_error The error handler
   * @protected
   */
  testWmsUrl(url, opt_success, opt_error) {
    var uri = new Uri(url);
    var queryData = this.getWmsQueryData_();
    uri.setQueryData(queryData);

    var onSuccess = opt_success || this.handleWmsGetCapabilities;
    var onError = opt_error || this.onOGCError;

    var request = new Request(uri);
    request.setHeader('Accept', '*/*');
    request.listen(EventType.SUCCESS, onSuccess, false, this);
    request.listen(EventType.ERROR, onError, false, this);
    request.setValidator(getException);

    log.fine(OGCServer.LOGGER_, 'Loading WMS GetCapabilities from URL: ' + uri.toString());
    this.setLoading(true);
    request.load();
  }

  /**
   * Updates query data from the WMTS params.
   *
   * @param {QueryData} queryData The query data.
   * @private
   */
  updateWmtsQueryData_(queryData) {
    queryData.setIgnoreCase(true);

    if (this.wmtsParams_) {
      queryData.extend(this.wmtsParams_);
    }

    if (!queryData.containsKey('request')) {
      queryData.set('request', 'GetCapabilities');
    }

    if (!queryData.containsKey('service')) {
      queryData.set('service', 'WMTS');
    }

    if (!queryData.containsKey('version')) {
      queryData.set('version', OGCServer.DEFAULT_WMTS_VERSION);
    }
  }

  /**
   * Loads WMTS GetCapabilities from the configured server.
   *
   * @protected
   */
  loadWmtsCapabilities() {
    var url = this.getOriginalWmtsUrl();
    if (url) {
      log.info(OGCServer.LOGGER_, this.getLabel() + ' requesting WMTS GetCapabilities');
      this.testWmtsUrl(url);
    } else {
      this.wmtsDone_ = true;
      this.finish();
    }
  }

  /**
   * Test a WMTS URL to check if its GetCapabilities is valid.
   *
   * @param {string} url The WMTS URL
   * @param {function(goog.events.Event)=} opt_success The success handler
   * @param {function(goog.events.Event)=} opt_error The error handler
   * @protected
   */
  testWmtsUrl(url, opt_success, opt_error) {
    var uri = new Uri(url);
    this.updateWmtsQueryData_(uri.getQueryData());

    var onSuccess = opt_success || this.handleWmtsCapabilities;
    var onError = opt_error || this.onOGCError;

    var request = new Request(uri);
    request.setHeader('Accept', '*/*');
    request.listen(EventType.SUCCESS, onSuccess, false, this);
    request.listen(EventType.ERROR, onError, false, this);
    request.setValidator(getException);

    log.fine(OGCServer.LOGGER_, 'Loading WMTS GetCapabilities from URL: ' + uri.toString());
    this.setLoading(true);
    request.load();
  }

  /**
   * @param {goog.events.Event} event
   * @protected
   */
  handleWmtsCapabilities(event) {
    log.info(OGCServer.LOGGER_, this.getLabel() +
        ' WMTS GetCapabilities request completed. Parsing data...');

    var req = /** @type {Request} */ (event.target);
    req.unlisten(EventType.SUCCESS, this.handleWmtsCapabilities);
    req.unlisten(EventType.ERROR, this.onOGCError);
    var response = /** @type {string} */ (req.getResponse());

    this.parseWmtsCapabilities(response, req.getUri().toString());
  }

  /**
   * Parse the WMTS GetCapabilities document.
   * @param {string} response The WMTS capabilities response.
   * @param {string} uri The WMTS URI.
   * @protected
   */
  parseWmtsCapabilities(response, uri) {
    const link = '<a target="_blank" href="' + uri + '">WMTS Capabilities</a>';
    if (response) {
      let doc = undefined;
      let result = undefined;
      try {
        doc = loadXml(response);
        result = /** @type {Object} */ (new WMTSCapabilities().read(doc));
      } catch (e) {
        this.logError('The response XML for ' + link + ' is invalid!');
        return;
      }

      if (result) {
        if (!this.getLabel()) {
          try {
            this.setLabel(/** @type {string} */ (getValueByKeys(result, 'ServiceIdentification', 'Title')));
          } catch (e) {
          }
        }

        const serviceAbstract = getValueByKeys(result, 'ServiceIdentification', 'Abstract');
        if (serviceAbstract && typeof serviceAbstract === 'string') {
          this.abstracts_.push(serviceAbstract);
        }

        const version = /** @type {string} */ (result['version']);
        const parserClass = WMTSLayerParsers[version] ||
            WMTSLayerParsers[OGCServer.DEFAULT_WMTS_VERSION];

        this.wmtsLayerParser_ = new parserClass();
        this.wmtsLayerParser_.initialize(result);

        // parse WMTS layers after WMS has completed, so WMTS can update descriptors as needed.
        if (this.wmsDone_) {
          this.parseWmtsLayers(result);
        } else {
          this.wmtsCapabilities_ = result;
        }
      } else {
        this.wmtsDone_ = true;
        this.finish();
      }
    } else {
      this.logError(link + ' response is empty!');
    }
  }

  /**
   * Parse WMTS layers from the capabilities document.
   * @param {!Object} capabilities The capabilities document.
   * @protected
   */
  parseWmtsLayers(capabilities) {
    const layers = getValueByKeys(capabilities, 'Contents', 'Layer');
    layers.forEach((layer) => {
      // check if the descriptor already exists
      let existing;
      let descriptorId;

      const layerId = this.wmtsLayerParser_.parseLayerId(layer);
      if (layerId) {
        descriptorId = this.getId() + BaseProvider.ID_DELIMITER + layerId;
        existing = /** @type {IOGCDescriptor} */ (DataManager.getInstance().getDescriptor(descriptorId));
      }

      if (!existing) {
        const title = this.wmtsLayerParser_.parseLayerTitle(layer);
        existing = title ? this.getDescriptorByTitle(title) : undefined;
      }

      let layerDescriptor = null;

      // if the existing descriptor does not implement IOGCDescriptor, it will not be compatible with following code and
      // must be recreated. this may happen if an old WMTS-only descriptor is present.
      if (existing && osImplements(existing, IOGCDescriptor.ID)) {
        layerDescriptor = existing;
        this.removeFromWfsOnly(existing);
      } else if (descriptorId) {
        layerDescriptor = this.createDescriptor();
        layerDescriptor.setId(descriptorId);
        layerDescriptor.setProvider(this.getLabel());
        layerDescriptor.setProviderType(this.providerType);
      }

      this.wmtsLayerParser_.parseLayer(capabilities, layer, layerDescriptor);

      if (this.isValidWMTSLayer(layerDescriptor)) {
        layerDescriptor.setWmtsEnabled(true);

        // override the date/time formats if set on the server
        if (!layerDescriptor.getWmtsDateFormat()) {
          layerDescriptor.setWmtsDateFormat(this.getWmtsDateFormat());
        }
        if (!layerDescriptor.getWmtsTimeFormat()) {
          layerDescriptor.setWmtsTimeFormat(this.getWmtsTimeFormat());
        }

        if (layerDescriptor.isWmsEnabled()) {
          layerDescriptor.setWmsEnabled(false);
        } else {
          this.addDescriptor(layerDescriptor);

          const node = new DescriptorNode();
          node.setDescriptor(layerDescriptor);
          this.toAdd_.push(node);
        }
      }
    });

    this.wmtsCapabilities_ = null;
    this.wmtsDone_ = true;
    this.finish();
  }

  /**
   * Loads WFS GetCapabilities from the configured server.
   *
   * @protected
   */
  loadWfsCapabilities() {
    this.setError(false);
    this.wfsOnlyFolder.setChildren(null);

    if (this.getOriginalWfsUrl()) {
      log.info(OGCServer.LOGGER_, this.getLabel() + ' requesting WFS GetCapabilities');

      var uri = new Uri(this.getOriginalWfsUrl());
      var queryData = this.getWfsQueryData_();
      uri.setQueryData(queryData);

      var request = new Request(uri);
      request.setHeader('Accept', '*/*');
      request.listen(EventType.SUCCESS, this.handleWfsGetCapabilities, false, this);
      request.listen(EventType.ERROR, this.onOGCError, false, this);
      request.setValidator(getException);

      log.fine(OGCServer.LOGGER_, 'Loading WFS GetCapabilities from URL: ' + uri.toString());
      this.setLoading(true);
      request.load();
    } else {
      this.wfsDone_ = true;
      this.finish();
    }
  }

  /**
   * @param {goog.events.Event} event
   * @protected
   */
  handleWmsGetCapabilities(event) {
    log.info(OGCServer.LOGGER_, this.getLabel() +
        ' WMS GetCapabilities request completed. Parsing data...');

    var req = /** @type {Request} */ (event.target);
    req.unlisten(EventType.SUCCESS, this.handleWmsGetCapabilities);
    req.unlisten(EventType.ERROR, this.onOGCError);
    var response = /** @type {string} */ (req.getResponse());

    this.parseWmsCapabilities(response, req.getUri().toString());
  }

  /**
   * @param {string} response
   * @param {string} uri
   */
  parseWmsCapabilities(response, uri) {
    var link = '<a target="_blank" href="' + uri + '">WMS Capabilities</a>';
    if (response) {
      var doc = undefined;
      var result = undefined;
      try {
        // do a couple of things to help 1.1.1 versions parse better with the OL formatter
        response = response.replace(/<(\/)?SRS>/g, '<$1CRS>');
        response = response.replace(/<LatLonBoundingBox/g, '<BoundingBox CRS="CRS:84"');
        doc = loadXml(response);
        result = new WMSCapabilities().read(doc);
      } catch (e) {
        this.logError('The response XML for ' + link + ' is invalid!');
        return;
      }

      if (result) {
        var version = result['version'];

        if (!this.getLabel()) {
          try {
            this.setLabel(result['Service']['Title']);
          } catch (e) {
          }
        }

        if (version in LayerParsers) {
          this.parser_ = LayerParsers[version];
        } else {
          // just try with the 1.1.1 parser
          this.parser_ = LayerParsers['1.1.1'];
        }

        // If desired, find the URL specified for GetMap requests
        if (this.parseOperationURLs_) {
          var resource = /** @type {string} */ (getValueByKeys(result, 'Capability', 'Request',
              'GetMap', 'DCPType', 0, 'HTTP', 'Get', 'OnlineResource'));
          if (resource) {
            const newWms = Uri.resolve(uri, resource);
            let newParams = null;

            if (newWms.getQuery()) {
              newParams = newWms.getQueryData();
              newWms.setQuery('');
            }

            this.setWmsUrl(newWms.toString());
            if (newParams) {
              if (!this.wmsParams_) {
                this.wmsParams_ = new QueryData();
              }
              this.wmsParams_.extend(newParams);

              // if the resource has a trailing &, the QueryData ends up with empty key/value pairs,
              // which causes issues elsewhere, so strip them here
              this.wmsParams_.remove('');
            }
          }
        }

        this.displayConsentAlerts(result);

        var serviceAbstract = getValueByKeys(result, 'Service', 'Abstract');
        if (serviceAbstract && typeof serviceAbstract === 'string') {
          this.abstracts_.push(serviceAbstract);
        }

        var layerList = getValueByKeys(result, 'Capability', 'Layer');
        if (layerList) {
          // if the WMS server only has a single root layer folder, then we'll save the user a click by removing it
          var crsList;
          if (!Array.isArray(layerList) && 'Layer' in layerList) {
            crsList = /** @type {?Array<string>} */ (getValueByKeys(result, 'Capability', 'Layer', 'CRS') ||
                getValueByKeys(result, 'Capability', 'Layer', 'SRS'));

            layerList = layerList['Layer'];
          }

          for (var i = 0, n = layerList.length; i < n; i++) {
            var child = this.parseLayer(layerList[i], version, crsList);
            if (child) {
              this.toAdd_.push(child);
            }
          }
        }
      }

      // if the WMTS capabilities document hasn't been parsed yet, do so now.
      if (this.wmtsCapabilities_) {
        this.parseWmtsLayers(this.wmtsCapabilities_);
      }

      this.wmsDone_ = true;
      this.finish();
    } else {
      this.logError(link + ' response is empty!');
    }
  }

  /**
   * @param {Object} result
   * Display the consent alerts
   */
  displayConsentAlerts(result) {
    if (result && !this.getPing() && !Settings.getInstance().get(['devSanity'], false)) {
      // DO NOT REMOVE THIS WARNING BLOCK!
      // Display government warning.
      var constraints = /** @type {string} */ (getValueByKeys(result, 'Service', 'AccessConstraints'));
      if (constraints) {
        var xmlConstraints = loadXml(unescapeEntities(constraints));
        var consentStatements = xmlConstraints.querySelectorAll('ConsentStatement');
        for (var i = 0, n = consentStatements.length; i < n; i++) {
          var msg = consentStatements[i].textContent;
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.INFO);
        }
      }
    }
  }

  /**
   * @param {goog.events.Event} event
   * @protected
   */
  handleWfsGetCapabilities(event) {
    log.info(OGCServer.LOGGER_, this.getLabel() +
        ' WFS GetCapabilities request completed. Parsing data...');

    var req = /** @type {Request} */ (event.target);
    req.unlisten(EventType.SUCCESS, this.handleWfsGetCapabilities);
    req.unlisten(EventType.ERROR, this.onOGCError);

    var response = /** @type {string} */ (req.getResponse());
    this.parseWfsCapabilities(response, req.getUri().toString());
  }

  /**
   * @param {string} response
   * @param {string} uri
   * @protected
   */
  parseWfsCapabilities(response, uri) {
    var link = '<a target="_blank" href="' + uri + '">WFS Capabilities</a>';
    if (response) {
      var wfsCapabilities = null;
      try {
        wfsCapabilities = loadXml(response);
      } catch (e) {
        this.logError('The response XML for ' + link + ' is invalid!');
        return;
      }

      if (!this.getLabel()) {
        try {
          var title = wfsCapabilities.querySelector('Title');
          this.setLabel(title.textContent || title.value || title.nodeValue);
        } catch (e) {
        }
      }

      var op = wfsCapabilities.querySelector('Operation[name=GetFeature]');
      if (op) {
        const updateUrls = (getFeatureEl) => {
          if (this.parseOperationURLs_ && getFeatureEl) {
            const attr = getFeatureEl.attributes[0];
            const url = readHref(getFeatureEl) ||
              attr.value || attr.nodeValue;
            this.setWfsUrl(Uri.resolve(uri, url).toString());
          }
        };

        var getFeatureEl = op.querySelector('Post');
        if (getFeatureEl != null) {
          updateUrls(getFeatureEl);
          this.setWfsPost(true);
        } else {
          getFeatureEl = op.querySelector('Get');
          updateUrls(getFeatureEl);
        }

        // CSS3 does not have a good backwards-compatible case-insensitive query
        var outputFormatNames = ['OUTPUTFORMAT', 'OutputFormat', 'outputFormat', 'outputformat'];
        var formatNodes = [];
        for (var i = 0, n = outputFormatNames.length; i < n && !formatNodes.length; i++) {
          formatNodes = op.querySelectorAll('Parameter[name=' + outputFormatNames[i] + ']  Value');
        }

        var formats = [];

        for (i = 0, n = formatNodes.length; i < n; i++) {
          formats.push(formatNodes[i].textContent);
        }

        this.wfsFormats_ = formats;
      }

      var serviceId = wfsCapabilities.querySelectorAll('ServiceIdentification');
      if (serviceId.length > 0) {
        var serviceAbstract = serviceId[0].querySelectorAll('Abstract');
        if (serviceAbstract.length > 0) {
          this.abstracts_.push(serviceAbstract[0].textContent);
        }
      }

      var idPrefix = this.getId() + BaseProvider.ID_DELIMITER;
      var wfsList = wfsCapabilities.querySelectorAll('FeatureType');
      var dataManager = DataManager.getInstance();
      for (i = 0, n = wfsList.length; i < n; i++) {
        var node = wfsList[i];
        var nameNode = node.querySelectorAll('Name')[0];
        var nodeTitle = node.querySelectorAll('Title')[0].textContent;

        var nameSpace = null;
        var name = nameNode.textContent;

        var prefix = '';
        var localName = name;

        if (stringContains(name, ':')) {
          var parts = name.split(':');
          prefix = parts[0];
          localName = parts[1];
        }

        if (prefix) {
          var ns = 'xmlns:' + prefix;
          var nsContent = nameNode.lookupNamespaceURI(prefix);
          if (nsContent) {
            nameSpace = ns + '="' + nsContent + '"';
          }
        }

        // find the first layer descendant that has the attribute "name" = name
        var descriptor = /** @type {IOGCDescriptor} */ (dataManager.getDescriptor(idPrefix + name));

        if (!descriptor) {
          descriptor = /** @type {IOGCDescriptor} */ (dataManager.getDescriptor(idPrefix + localName));
        }

        if (!descriptor) {
          // try matching just on the title
          descriptor = this.getDescriptorByTitle(nodeTitle);
        }

        if (!descriptor) {
          descriptor = this.createDescriptor();
          descriptor.setId(idPrefix + name);
          descriptor.setWfsEnabled(true);
          descriptor.setColor(OGCServer.DEFAULT_COLOR);
          descriptor.setTitle(nodeTitle);
          // TODO: descriptor.setMinDate(this.wfsOnlyFolder.getMinDate().getTime());
          // TODO: descriptor.setMaxDate(this.wfsOnlyFolder.getMaxDate().getTime());
          descriptor.setProvider(this.getLabel());
        }

        descriptor.setWfsParams(this.getWfsParams());

        // set the provider type so we know which type of OGC server the descriptor was created by
        descriptor.setProviderType(this.providerType);

        // parse keywords from WFS
        var keywords = node.querySelectorAll('Keyword');
        if (keywords) {
          var tags = descriptor.getKeywords() || [];
          for (var j = 0, m = keywords.length; j < m; j++) {
            var tag = keywords[j].textContent;
            if (tags.indexOf(tag) == -1) {
              tags.push(tag);
            }
          }

          descriptor.setKeywords(tags);
        }

        if (isLayerDeprecated(localName)) {
          descriptor.setDeprecated(true);
        }

        var desc = node.querySelector('Abstract');
        if (desc && !descriptor.getAbstract()) {
          descriptor.setAbstract(desc.textContent);
        }

        descriptor.setWfsEnabled(true);
        descriptor.setWfsUrl(this.getWfsUrl());
        descriptor.setUsePost(this.getWfsPost());
        descriptor.setWfsName(name);
        descriptor.setWfsNamespace(nameSpace);
        descriptor.setWfsFormats(this.getWfsFormats());
        descriptor.setWfsContentType(this.getWfsContentType());

        if (!descriptor.isWmsEnabled() && !descriptor.isWmtsEnabled()) {
          node = new DescriptorNode();
          node.setDescriptor(descriptor);

          this.wfsOnlyFolder.addChild(node);
        }

        // update the descriptor so it maps the WFS alias
        this.addDescriptor(descriptor);
      }

      this.wfsDone_ = true;
      this.finish();
    } else {
      this.logError(link + ' response is empty!');
    }
  }

  /**
   * Adds the descriptor.
   *
   * @param {!IDataDescriptor} descriptor
   */
  addDescriptor(descriptor) {
    descriptor.setDataProvider(this);
    DataManager.getInstance().addDescriptor(descriptor);
  }

  /**
   * Gets a descriptor that matches the given title
   *
   * @param {!string} title
   * @return {?IOGCDescriptor} the descriptor or null
   * @protected
   */
  getDescriptorByTitle(title) {
    var list = /** @type {Array<!IOGCDescriptor>} */ (DataManager.getInstance().getDescriptors(
        this.getId() + BaseProvider.ID_DELIMITER));

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        var desc = list[i];

        if (desc.getDescriptorType() === ID && desc.getTitle() == title &&
            (desc.isWmsEnabled() || desc.isWmtsEnabled() || desc.isWfsEnabled())) {
          return list[i];
        }
      }
    }

    return null;
  }

  /**
   * Creates a new layer descriptor
   *
   * @return {!IOGCDescriptor} the descriptor
   * @protected
   */
  createDescriptor() {
    return /** @type {!IOGCDescriptor} */ (DataManager.getInstance().createDescriptor(ID));
  }

  /**
   * @param {goog.events.Event} event
   * @protected
   */
  onOGCError(event) {
    var req = /** @type {Request} */ (event.target);
    var errors = req.getErrors();
    var uri = req.getUri();
    dispose(req);

    var href = uri.toString();
    var service = uri.getQueryData().get('service');
    var msg = 'Request failed for <a target="_blank" href="' + href + '">' + service + ' Capabilities</a>: ';

    if (errors) {
      msg += errors.join(' ');
    }

    this.logError(msg);
  }

  /**
   * @param {string} msg The error message.
   * @protected
   */
  logError(msg) {
    if (!this.getError()) {
      var errorMsg = 'Server [' + this.getLabel() + ']: ' + msg;

      if (!this.getPing()) {
        AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
      }

      log.error(OGCServer.LOGGER_, errorMsg);

      this.setErrorMessage(errorMsg);
      this.setLoading(false);
    }
  }

  /**
   * Remove a descriptor from the WFS-only folder, if present.
   * @param {IOGCDescriptor} descriptor The descriptor.
   * @protected
   */
  removeFromWfsOnly(descriptor) {
    if (descriptor) {
      var children = this.wfsOnlyFolder.getChildren();
      if (children) {
        for (var i = 0, n = children.length; i < n; i++) {
          if (children[i].getId() == descriptor.getId()) {
            this.wfsOnlyFolder.removeChild(children[i]);
            break;
          }
        }
      }
    }
  }

  /**
   * @param {Object} node
   * @param {string} version
   * @param {undefined|Array<!string>|null} crsList
   * @param {?string=} opt_attribution
   * @return {?ITreeNode}
   * @protected
   */
  parseLayer(node, version, crsList, opt_attribution) {
    var layer = null;

    if (this.parser_) {
      // check if the descriptor already exists
      var existing = null;
      var layerId = this.parser_.parseLayerId(node);
      if (layerId) {
        var fullId = this.getId() + BaseProvider.ID_DELIMITER + layerId;
        existing = /** @type {IOGCDescriptor} */ (DataManager.getInstance().getDescriptor(fullId));
      }

      if (!existing) {
        var title = this.parser_.parseLayerTitle(node);

        if (title) {
          existing = this.getDescriptorByTitle(title);
        }
      }

      this.removeFromWfsOnly(existing);

      // parse the layer on top of the existing descriptor, or a new one if it wasn't found
      var layerDescriptor = existing || this.createDescriptor();
      layerDescriptor.setProviderType(this.providerType);

      this.parser_.parseLayer(node, layerDescriptor);

      // layers should inherit attribution unless they override it
      opt_attribution = layerDescriptor.getAttribution() || opt_attribution;
      layerDescriptor.setAttribution(opt_attribution || null);

      var newCRSList = (layerDescriptor.getSupportedCRS() || []).concat(crsList);
      removeDuplicates(newCRSList);
      layerDescriptor.setSupportedCRS(newCRSList);

      var isFolder = false;
      if (this.isValidWMSLayer(layerDescriptor)) {
        // node is a wms layer
        layer = new DescriptorNode();
        var name = layerDescriptor.getWmsName();
        if (name && name != 'IWMSLayer') {
          if (layerDescriptor.hasTimeExtent()) {
            // TODO: Does the server node need min/max date?
            // Store the start and end dates.
            // if (!this.getMinDate() || layerDescriptor.getMinDate() < this.getMinDate().getTime()) {
            //  this.setMinDate(new Date(layerDescriptor.getMinDate()));
            // }
            //
            // if (!this.getMaxDate() || layerDescriptor.getMaxDate() > this.getMaxDate().getTime()) {
            //  this.setMaxDate(new Date(layerDescriptor.getMaxDate()));
            // }
          }

          layerDescriptor.setWmsEnabled(true);
          layerDescriptor.setWmsParams(this.getWmsParams());
          layerDescriptor.setWmsVersion(version);
          layerDescriptor.setWmsUrl(this.getWmsUrl());
          layerDescriptor.setWmsDateFormat(this.getWmsDateFormat());
          layerDescriptor.setWmsTimeFormat(this.getWmsTimeFormat());
          layerDescriptor.setProvider(this.getLabel());
          layerDescriptor.setId(this.getId() + BaseProvider.ID_DELIMITER + layerDescriptor.getWmsName());

          this.addDescriptor(layerDescriptor);

          // add the complete descriptor to the layer
          layer.setDescriptor(layerDescriptor);
        } else {
          isFolder = true;
        }
      }

      if ('Layer' in node) {
        // node is a folder
        isFolder = true;
        layer = new SlickTreeNode();
        layer.setId(layerDescriptor.getTitle() || '');
        layer.setLabel(layerDescriptor.getTitle());
        layer.setToolTip(layerDescriptor.getDescription() || '');

        var childList = node['Layer'];
        if (!Array.isArray(childList)) {
          childList = [childList];
        }

        for (var i = 0, n = childList.length; i < n; i++) {
          var child = this.parseLayer(childList[i], version, newCRSList, opt_attribution);
          if (child) {
            layer.addChild(child);
          }
        }
      }

      if (layer && isFolder) {
        var children = layer.getChildren();
        if (!children || children.length === 0) {
          return null;
        }
      }
    }
    return layer;
  }

  /**
   * @param {IOGCDescriptor} layerDescriptor
   * @return {boolean} Whether or not it should be included
   * @protected
   */
  isValidWMSLayer(layerDescriptor) {
    return !layerDescriptor.getOpaque();
  }

  /**
   * If WMTS should be enabled for a descriptor.
   * @param {IOGCDescriptor|undefined} descriptor The descriptor.
   * @return {boolean}
   * @protected
   */
  isValidWMTSLayer(descriptor) {
    if (descriptor && (this.isWmtsPreferred() || !descriptor.isWmsEnabled())) {
      const wmtsOptions = descriptor.getWmtsOptions();
      return !!wmtsOptions && wmtsOptions.length > 0;
    }

    return false;
  }

  /**
   * @param {!ITreeNode} folder
   * @protected
   */
  addFolder(folder) {
    var index;
    var id = folder.getId();
    if (id && id in this.folderPriority) {
      if (this.hasChildren()) {
        var priority = this.folderPriority[id];
        var children = this.getChildren();
        for (var i = 0, n = children.length; i < n; i++) {
          var currId = children[i].getId();
          if (!currId || !(currId in this.folderPriority) || this.folderPriority[currId] < priority) {
            index = i;
            break;
          }
        }
      }
    }

    this.addChild(folder, false, index);
  }

  /**
   * @param {ITreeNode} node
   * @param {Array<string>=} opt_tags
   * @private
   */
  addParentTags_(node, opt_tags) {
    var children = node.getChildren();
    if (children && children.length > 0) {
      if (node.getParent()) {
        var label = node.getLabel();

        if (label) {
          if (!opt_tags) {
            opt_tags = [label];
          } else {
            opt_tags.push(label);
          }
        }

        for (var i = 0, n = children.length; i < n; i++) {
          this.addParentTags_(children[i], opt_tags);
        }

        if (opt_tags) {
          opt_tags.pop();
        }
      }
    } else if (opt_tags != null && node instanceof DescriptorNode) {
      var dn = /** @type {DescriptorNode} */ (node);
      var descriptor = /** @type {IOGCDescriptor} */ (dn.getDescriptor());
      if (descriptor) {
        try {
          if (!descriptor.getKeywords()) {
            descriptor.setKeywords([]);
          }

          var keywords = descriptor.getKeywords();
          for (i = 0, n = opt_tags.length; i < n; i++) {
            var tag = opt_tags[i];
            if (!keywords.includes(tag)) {
              keywords.push(tag);
            }
          }
        } catch (e) {
          // descriptor doesn't implement keywords
        }
      }
    }
  }

  /**
   * @param {ITreeNode=} opt_node
   * @protected
   */
  markAllDescriptors(opt_node) {
    var node = opt_node || this;

    if (node instanceof DescriptorNode) {
      var dn = /** @type {DescriptorNode} */ (node);
      var descriptor = /** @type {IServerDescriptor} */ (dn.getDescriptor());
      if (descriptor) {
        try {
          descriptor.updatedFromServer();
        } catch (e) {
          // must not implement that interface.
        }
      }
    }

    var nodeChildren = node.getChildren();
    if (nodeChildren && nodeChildren.length > 0) {
      var i = nodeChildren.length;
      while (i--) {
        this.markAllDescriptors(nodeChildren[i]);
      }
    }
  }

  /**
   * Finds and removes the descriptor.
   *
   * @param {IDataDescriptor} descriptor
   */
  removeDescriptor(descriptor) {
    var children = this.getChildren();
    if (!children || children.length == 0) {
      return;
    }

    var node = this.findNode_(descriptor, children);
    if (node) {
      var par = node.getParent();
      par.removeChild(node);
      // work our way up the tree to remove parent nodes if we just removed the last item.
      while (!par.getChildren() || par.getChildren().length == 0) {
        node = par;
        par = par.getParent();
        par.removeChild(node);
      }
    }

    descriptor.setActive(false);
  }

  /**
   * @param {IDataDescriptor} descriptor
   * @param {?Array<!ITreeNode>} children
   * @return {?ITreeNode}
   * @private
   */
  findNode_(descriptor, children) {
    var child;
    for (var i = 0, n = children.length; i < n; i++) {
      child = children[i];
      var grandChildren = child.getChildren();

      if (grandChildren && grandChildren.length >= 0) {
        var node = this.findNode_(descriptor, grandChildren);
        if (node) {
          return node;
        }
      } else {
        child = /** @type {SlickTreeNode} */ (child);
        if (child.getDescriptor() == descriptor || child.getDescriptor().getId() == descriptor.getId()) {
          return child;
        }
      }
    }
    return null;
  }

  /**
   * @param {OSFile} file
   * @return {number}
   */
  static isOGCResponse(file) {
    var score = 0;

    if (file && !isLocal(file)) {
      var uri = file.getUrl();

      if (uri && uri.indexOf('GetFeature') == -1) {
        score += OGCServer.URI_REGEXP_.test(uri) ? 3 : 0;
      }

      var content = file.getContent();
      if (typeof content === 'string') {
        score += OGCServer.CONTENT_REGEXP_.test(content) ? 3 : 0;
      }
    }

    return score;
  }
}

osImplements(OGCServer, IDataProvider.ID);


/**
 * The logger.
 * @const
 * @type {Logger}
 * @private
 */
OGCServer.LOGGER_ = log.getLogger('os.ui.ogc.OGCServer');


/**
 * @const
 * @type {string}
 */
OGCServer.DEFAULT_WMS_VERSION = '1.3.0';


/**
 * @const
 * @type {string}
 */
OGCServer.DEFAULT_WMTS_VERSION = '1.0.0';


/**
 * Default color for OGC descriptors.
 * @const
 * @type {string}
 */
OGCServer.DEFAULT_COLOR = 'rgba(255,255,255,1)';


/**
 * @type {RegExp}
 * @const
 * @private
 */
OGCServer.URI_REGEXP_ = /(wms|wmts|wfs)/i;


/**
 * @type {RegExp}
 * @const
 * @private
 */
OGCServer.CONTENT_REGEXP_ = /(WMS|WMTS|WFS)_Capabilities/;

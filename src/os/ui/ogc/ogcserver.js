goog.provide('os.ui.ogc.OGCServer');

goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.array');
goog.require('ol.format.WMSCapabilities');
goog.require('ol.format.XLink');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.color');
goog.require('os.data.DataProviderEvent');
goog.require('os.data.DataProviderEventType');
goog.require('os.data.IDataProvider');
goog.require('os.file');
goog.require('os.net.HandlerType');
goog.require('os.net.Request');
goog.require('os.ogc');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.ogc.wms.IWMSLayerParser');
goog.require('os.ui.ogc.wms.LayerParsers');
goog.require('os.ui.server.AbstractLoadingServer');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.util.deprecated');


/**
 * Names used by fixed subfolders for OGC servers.
 * @enum {string}
 */
os.ui.ogc.OGCFolderType = {
  WFS_ONLY: 'WFS (Features) Only'
};


/**
 * The OGC server provider
 *
 * @implements {os.data.IDataProvider}
 * @extends {os.ui.server.AbstractLoadingServer}
 * @constructor
 */
os.ui.ogc.OGCServer = function() {
  os.ui.ogc.OGCServer.base(this, 'constructor');
  this.log = os.ui.ogc.OGCServer.LOGGER_;
  this.providerType = os.ogc.ID;

  /**
   * @type {Array.<string>}
   * @private
   */
  this.abstracts_ = [];

  /**
   * @type {?os.ui.ogc.wms.IWMSLayerParser}
   * @private
   */
  this.parser_ = null;

  /**
   * @type {!Object<string, number>}
   * @protected
   */
  this.folderPriority = {};

  /**
   * @type {!os.ui.slick.SlickTreeNode}
   * @protected
   * @todo This needs to be a DataTreeNode with min/max date
   */
  this.wfsOnlyFolder = new os.ui.slick.SlickTreeNode();

  /**
   * @type {?Array.<!os.ui.slick.SlickTreeNode>}
   * @private
   */
  this.toAdd_ = null;

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
   * @type {goog.Uri.QueryData}
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
   * @type {goog.Uri.QueryData}
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
   * @type {boolean}
   * @private
   */
  this.wmsDone_ = false;

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
};
goog.inherits(os.ui.ogc.OGCServer, os.ui.server.AbstractLoadingServer);
os.implements(os.ui.ogc.OGCServer, os.data.IDataProvider.ID);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
os.ui.ogc.OGCServer.LOGGER_ = goog.log.getLogger('os.ui.ogc.OGCServer');


/**
 * @const
 * @type {string}
 */
os.ui.ogc.OGCServer.DEFAULT_WMS_VERSION = '1.3.0';


/**
 * Default color for OGC descriptors.
 * @const
 * @type {string}
 */
os.ui.ogc.OGCServer.DEFAULT_COLOR = 'rgba(255,255,255,1)';


/**
 * @return {Array.<string>}
 */
os.ui.ogc.OGCServer.prototype.getAbstracts = function() {
  return this.abstracts_;
};


/**
 * @return {boolean}
 */
os.ui.ogc.OGCServer.prototype.getLowerCase = function() {
  return this.lowerCase_;
};


/**
 * @param {boolean} value
 */
os.ui.ogc.OGCServer.prototype.setLowerCase = function(value) {
  this.lowerCase_ = value;
};


/**
 * @return {string}
 */
os.ui.ogc.OGCServer.prototype.getOriginalWfsUrl = function() {
  return this.originalWfsUrl_ || this.wfsUrl_;
};


/**
 * @param {string} value
 */
os.ui.ogc.OGCServer.prototype.setOriginalWfsUrl = function(value) {
  this.originalWfsUrl_ = value;
};


/**
 * @return {string}
 */
os.ui.ogc.OGCServer.prototype.getOriginalWmsUrl = function() {
  return this.originalWmsUrl_ || this.wmsUrl_;
};


/**
 * @param {string} value
 */
os.ui.ogc.OGCServer.prototype.setOriginalWmsUrl = function(value) {
  this.originalWmsUrl_ = value;
};


/**
 * @return {Array<string>}
 */
os.ui.ogc.OGCServer.prototype.getWfsFormats = function() {
  return this.wfsFormats_;
};


/**
 * @return {goog.Uri.QueryData}
 */
os.ui.ogc.OGCServer.prototype.getWfsParams = function() {
  return this.wfsParams_;
};


/**
 * @param {goog.Uri.QueryData} value
 */
os.ui.ogc.OGCServer.prototype.setWfsParams = function(value) {
  this.wfsParams_ = value;
};


/**
 * @return {boolean}
 */
os.ui.ogc.OGCServer.prototype.getWfsPost = function() {
  return this.wfsPost_;
};


/**
 * @param {boolean} value
 */
os.ui.ogc.OGCServer.prototype.setWfsPost = function(value) {
  this.wfsPost_ = value;
};


/**
 * @return {string}
 */
os.ui.ogc.OGCServer.prototype.getWfsUrl = function() {
  return this.wfsUrl_ || this.getOriginalWfsUrl();
};


/**
 * @param {string} value
 */
os.ui.ogc.OGCServer.prototype.setWfsUrl = function(value) {
  this.wfsUrl_ = value;
};


/**
 * @return {string}
 */
os.ui.ogc.OGCServer.prototype.getWmsDateFormat = function() {
  return this.wmsDateFormat_;
};


/**
 * @param {string} value
 */
os.ui.ogc.OGCServer.prototype.setWmsDateFormat = function(value) {
  this.wmsDateFormat_ = value;
};


/**
 * @return {goog.Uri.QueryData}
 */
os.ui.ogc.OGCServer.prototype.getWmsParams = function() {
  return this.wmsParams_;
};


/**
 * @param {goog.Uri.QueryData} value
 */
os.ui.ogc.OGCServer.prototype.setWmsParams = function(value) {
  this.wmsParams_ = value;
};


/**
 * @return {string}
 */
os.ui.ogc.OGCServer.prototype.getWmsTimeFormat = function() {
  return this.wmsTimeFormat_;
};


/**
 * @param {string} value
 */
os.ui.ogc.OGCServer.prototype.setWmsTimeFormat = function(value) {
  this.wmsTimeFormat_ = value;
};


/**
 * @return {string}
 */
os.ui.ogc.OGCServer.prototype.getWmsUrl = function() {
  return this.wmsUrl_ || this.getOriginalWmsUrl();
};


/**
 * @param {string} value
 */
os.ui.ogc.OGCServer.prototype.setWmsUrl = function(value) {
  this.wmsUrl_ = value;
};


/**
 * @return {string}
 */
os.ui.ogc.OGCServer.prototype.getWpsUrl = function() {
  return this.wpsUrl_;
};


/**
 * @param {string} value
 */
os.ui.ogc.OGCServer.prototype.setWpsUrl = function(value) {
  this.wpsUrl_ = value;
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCServer.prototype.init = function() {
  os.ui.ogc.OGCServer.base(this, 'init');

  this.wfsOnlyFolder.setId(os.ui.ogc.OGCFolderType.WFS_ONLY);
  this.wfsOnlyFolder.setLabel(os.ui.ogc.OGCFolderType.WFS_ONLY);
  this.folderPriority[os.ui.ogc.OGCFolderType.WFS_ONLY] = 0;

  // TODO: Do we need to set min/max date on the WFS only folder?
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCServer.prototype.configure = function(config) {
  os.ui.ogc.OGCServer.base(this, 'configure', config);

  this.setWmsUrl(/** @type {string} */ (config['wms']));
  this.setOriginalWmsUrl(/** @type {string} */ (config['wms']));
  this.setWmsTimeFormat(/** @type {string} */ (config['wmsTimeFormat']));
  this.setWmsDateFormat(/** @type {string} */ (config['wmsDateFormat']));
  this.setWfsUrl(/** @type {string} */ (config['wfs']));
  this.setOriginalWfsUrl(/** @type {string} */ (config['wfs']));
  this.setLowerCase(/** @type {boolean} */ (config['lowerCase']));
  this.setWpsUrl(/** @type {string} */ (config['wps']));
  if (config['parseOperationURLs'] !== undefined) {
    this.parseOperationURLs_ = /** @type {boolean} */ (config['parseOperationURLs']);
  }

  var wfsUrl = this.getWfsUrl();
  if ('wfsParams' in config) {
    this.setWfsParams(new goog.Uri.QueryData(/** @type {string} */ (config['wfsParams'])));
  } else if (wfsUrl) {
    // attempt to generate custom WFS params from the wfsUrl
    var wfsUri = new goog.Uri(wfsUrl);
    var queryData = wfsUri.getQueryData();
    queryData.setIgnoreCase(true);
    queryData.remove('request');
    this.setWfsParams(queryData.getCount() ? queryData : null);
  } else {
    this.setWfsParams(null);
  }

  var wmsUrl = this.getWmsUrl();
  if ('wmsParams' in config) {
    this.setWmsParams(new goog.Uri.QueryData(/** @type {string} */ (config['wmsParams'])));
  } else if (wmsUrl) {
    // attempt to generate custom WMS params from the wmsUrl
    var wmsUri = new goog.Uri(wmsUrl);
    queryData = wmsUri.getQueryData();
    queryData.setIgnoreCase(true);
    queryData.remove('request');
    this.setWmsParams(queryData.getCount() ? queryData : null);
  } else {
    this.setWmsParams(null);
  }
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCServer.prototype.finish = function() {
  if (this.isLoaded()) {
    if (this.toAdd_) {
      this.addChildren(this.toAdd_);
      this.toAdd_ = null;

      this.addParentTags_(this);
    }

    if (this.wfsOnlyFolder.hasChildren()) {
      this.addFolder(this.wfsOnlyFolder);
    }

    this.finalizeFinish();

    if (!this.getPing()) {
      this.markAllDescriptors();
    }

    os.ui.ogc.OGCServer.superClass_.finish.call(this);
  }
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCServer.prototype.load = function(opt_ping) {
  os.ui.ogc.OGCServer.base(this, 'load', opt_ping);

  this.setChildren(null);

  this.wmsDone_ = false;
  this.wfsDone_ = false;
  this.pendingAlternateTests_ = 0;

  this.loadWmsCapabilities();
  this.loadWfsCapabilities();
};


/**
 * @inheritDoc
 */
os.ui.ogc.OGCServer.prototype.isLoaded = function() {
  return os.ui.ogc.OGCServer.base(this, 'isLoaded') &&
      this.wmsDone_ && this.wfsDone_ && this.pendingAlternateTests_ <= 0;
};


/**
 * Called after finishing the load of the OGC layers. Used by extending classes.
 *
 * @protected
 */
os.ui.ogc.OGCServer.prototype.finalizeFinish = function() {};


/**
 * Builds query data from the WFS params.
 *
 * @return {goog.Uri.QueryData}
 * @private
 */
os.ui.ogc.OGCServer.prototype.getWfsQueryData_ = function() {
  var queryData = this.wfsParams_ ? this.wfsParams_.clone() : new goog.Uri.QueryData();
  queryData.setIgnoreCase(true);

  if (!queryData.containsKey('service')) {
    queryData.set('service', 'WFS');
  }
  queryData.set('request', 'GetCapabilities');
  return queryData;
};


/**
 * Builds query data from the WMS params.
 *
 * @return {goog.Uri.QueryData}
 * @private
 */
os.ui.ogc.OGCServer.prototype.getWmsQueryData_ = function() {
  var queryData = this.wmsParams_ ? this.wmsParams_.clone() : new goog.Uri.QueryData();
  queryData.setIgnoreCase(true);

  if (!queryData.containsKey('service')) {
    queryData.set('service', 'WMS');
  }
  queryData.set('request', 'GetCapabilities');

  var version = os.ui.ogc.OGCServer.DEFAULT_WMS_VERSION;
  if (queryData.containsKey('version')) {
    version = queryData.get('version');
  }

  queryData.set('version', version);
  return queryData;
};


/**
 * Loads WMS GetCapabilities from the configured server.
 *
 * @protected
 */
os.ui.ogc.OGCServer.prototype.loadWmsCapabilities = function() {
  var wmsUrl = this.getOriginalWmsUrl();
  if (wmsUrl) {
    goog.log.info(os.ui.ogc.OGCServer.LOGGER_, this.getLabel() + ' requesting WMS GetCapabilities');
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
};


/**
 * Handle successful load of alternate URL.
 *
 * @param {goog.events.Event} event The error event
 * @protected
 */
os.ui.ogc.OGCServer.prototype.onAlternateSuccess = function(event) {
  goog.dispose(event.target);
  this.pendingAlternateTests_--;
  this.finish();
};


/**
 * Handle failure to load alternate URL.
 *
 * @param {string} value The alternate URL
 * @param {goog.events.Event} event The error event
 * @protected
 */
os.ui.ogc.OGCServer.prototype.onAlternateError = function(value, event) {
  // remove the failed URL and alert the user
  this.removeAlternateUrl(value);

  var errorMsg = 'Alternate URL "' + value + '" for ' + this.getLabel() + ' failed loading WMS GetCapabilities and ' +
      'has been removed.';
  os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR, this.log);

  // finished testing the URL
  this.onAlternateSuccess(event);
};


/**
 * Test a WMS URL to check if its GetCapabilities is valid.
 *
 * @param {string} url The WMS URL
 * @param {function(goog.events.Event)=} opt_success The success handler
 * @param {function(goog.events.Event)=} opt_error The error handler
 * @protected
 */
os.ui.ogc.OGCServer.prototype.testWmsUrl = function(url, opt_success, opt_error) {
  var uri = new goog.Uri(url);
  var queryData = this.getWmsQueryData_();
  uri.setQueryData(queryData);

  var onSuccess = opt_success || this.handleWmsGetCapabilities;
  var onError = opt_error || this.onOGCError;

  var request = new os.net.Request(uri);
  request.setHeader('Accept', '*/*');
  request.listen(goog.net.EventType.SUCCESS, onSuccess, false, this);
  request.listen(goog.net.EventType.ERROR, onError, false, this);
  request.setValidator(os.ogc.getException);

  goog.log.fine(os.ui.ogc.OGCServer.LOGGER_, 'Loading WMS GetCapabilities from URL: ' + uri.toString());
  this.setLoading(true);
  request.load();
};


/**
 * Loads WFS GetCapabilities from the configured server.
 *
 * @protected
 */
os.ui.ogc.OGCServer.prototype.loadWfsCapabilities = function() {
  this.setError(false);
  this.wfsOnlyFolder.setChildren(null);

  if (this.getOriginalWfsUrl()) {
    goog.log.info(os.ui.ogc.OGCServer.LOGGER_, this.getLabel() + ' requesting WFS GetCapabilities');

    var uri = new goog.Uri(this.getOriginalWfsUrl());
    var queryData = this.getWfsQueryData_();
    uri.setQueryData(queryData);

    var request = new os.net.Request(uri);
    request.setHeader('Accept', '*/*');
    request.listen(goog.net.EventType.SUCCESS, this.handleWfsGetCapabilities, false, this);
    request.listen(goog.net.EventType.ERROR, this.onOGCError, false, this);
    request.setValidator(os.ogc.getException);

    goog.log.fine(os.ui.ogc.OGCServer.LOGGER_, 'Loading WFS GetCapabilities from URL: ' + uri.toString());
    this.setLoading(true);
    request.load();
  } else {
    this.wfsDone_ = true;
    this.finish();
  }
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.ogc.OGCServer.prototype.handleWmsGetCapabilities = function(event) {
  goog.log.info(os.ui.ogc.OGCServer.LOGGER_, this.getLabel() +
      ' WMS GetCapabilities request completed. Parsing data...');

  var req = /** @type {os.net.Request} */ (event.target);
  req.unlisten(goog.net.EventType.SUCCESS, this.handleWmsGetCapabilities);
  req.unlisten(goog.net.EventType.ERROR, this.onOGCError);
  var response = /** @type {string} */ (req.getResponse());

  this.parseWmsCapabilities(response, req.getUri().toString());
};


/**
 * @param {string} response
 * @param {string} uri
 */
os.ui.ogc.OGCServer.prototype.parseWmsCapabilities = function(response, uri) {
  var link = '<a target="_blank" href="' + uri + '">WMS Capabilities</a>';
  if (response) {
    var doc = undefined;
    var result = undefined;
    try {
      // do a couple of things to help 1.1.1 versions parse better with the OL formatter
      response = response.replace(/<(\/)?SRS>/g, '<$1CRS>');
      response = response.replace(/<LatLonBoundingBox/g, '<BoundingBox CRS="CRS:84"');
      doc = goog.dom.xml.loadXml(response);
      result = new ol.format.WMSCapabilities().read(doc);
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

      if (version in os.ui.ogc.wms.LayerParsers) {
        this.parser_ = os.ui.ogc.wms.LayerParsers[version];
      } else {
        // just try with the 1.1.1 parser
        this.parser_ = os.ui.ogc.wms.LayerParsers['1.1.1'];
      }

      // If desired, find the URL specified for GetMap requests
      if (this.parseOperationURLs_) {
        var resource = /** @type {string} */ (goog.object.getValueByKeys(result, 'Capability', 'Request',
            'GetMap', 'DCPType', 0, 'HTTP', 'Get', 'OnlineResource'));
        if (resource) {
          var newWms = null;
          var newParams = null;
          var q = resource.indexOf('?');
          if (q > -1) {
            newWms = resource.substring(0, q);
            if (q < newWms.length - 1) {
              var query = newWms.substring(q + 1);
              newParams = new goog.Uri.QueryData(query);
            }
          } else {
            newWms = resource;
          }
          this.setWmsUrl(newWms);
          if (newParams != null) {
            if (!this.wmsParams_) {
              this.wmsParams_ = new goog.Uri.QueryData();
            }
            this.wmsParams_.extend(newParams);
          }
        }
      }

      this.displayConsentAlerts(result);

      var serviceAbstract = goog.object.getValueByKeys(result, 'Service', 'Abstract');
      if (serviceAbstract && typeof serviceAbstract === 'string') {
        this.abstracts_.push(serviceAbstract);
      }

      var layerList = goog.object.getValueByKeys(result, 'Capability', 'Layer');
      if (layerList) {
        // if the WMS server only has a single root layer folder, then we'll save the user a click by removing it
        var crsList;
        if (!goog.isArray(layerList) && 'Layer' in layerList) {
          crsList = /** @type {?Array<string>} */ (goog.object.getValueByKeys(result, 'Capability', 'Layer', 'CRS') ||
              goog.object.getValueByKeys(result, 'Capability', 'Layer', 'SRS'));

          layerList = layerList['Layer'];
        }

        this.toAdd_ = [];

        for (var i = 0, n = layerList.length; i < n; i++) {
          var child = this.parseLayer(layerList[i], version, crsList);
          if (child) {
            this.toAdd_.push(child);
          }
        }
      }
    }

    this.wmsDone_ = true;
    this.finish();
  } else {
    this.logError(link + ' response is empty!');
  }
};


/**
 * @param {Object} result
 * Display the consent alerts
 */
os.ui.ogc.OGCServer.prototype.displayConsentAlerts = function(result) {
  if (result && !this.getPing() && !os.settings.get(['devSanity'], false)) {
    // DO NOT REMOVE THIS WARNING BLOCK!
    // Display government warning.
    var constraints = /** @type {string} */ (goog.object.getValueByKeys(result, 'Service', 'AccessConstraints'));
    if (constraints) {
      var xmlConstraints = goog.dom.xml.loadXml(goog.string.unescapeEntities(constraints));
      var consentStatements = xmlConstraints.querySelectorAll('ConsentStatement');
      for (var i = 0, n = consentStatements.length; i < n; i++) {
        var msg = consentStatements[i].textContent;
        os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.INFO);
      }
    }
  }
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.ogc.OGCServer.prototype.handleWfsGetCapabilities = function(event) {
  goog.log.info(os.ui.ogc.OGCServer.LOGGER_, this.getLabel() +
      ' WFS GetCapabilities request completed. Parsing data...');

  var req = /** @type {os.net.Request} */ (event.target);
  req.unlisten(goog.net.EventType.SUCCESS, this.handleWfsGetCapabilities);
  req.unlisten(goog.net.EventType.ERROR, this.onOGCError);

  var response = /** @type {string} */ (req.getResponse());
  this.parseWfsCapabilities(response, req.getUri().toString());
};


/**
 * @param {string} response
 * @param {string} uri
 * @protected
 */
os.ui.ogc.OGCServer.prototype.parseWfsCapabilities = function(response, uri) {
  var link = '<a target="_blank" href="' + uri + '">WFS Capabilities</a>';
  if (response) {
    var wfsCapabilities = null;
    try {
      wfsCapabilities = goog.dom.xml.loadXml(response);
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
      var getFeatureEl = op.querySelector('Post');
      if (getFeatureEl != null) {
        if (this.parseOperationURLs_) {
          if (getFeatureEl.hasAttributeNS(ol.format.XLink.NAMESPACE_URI, 'href')) {
            this.setWfsUrl(getFeatureEl.getAttributeNS(ol.format.XLink.NAMESPACE_URI, 'href'));
          } else {
            var attr = getFeatureEl.attributes[0];
            // Attr.value is the DOM4 property, while Attr.nodeValue inherited from Node should work on older browsers
            this.setWfsUrl(attr.value || attr.nodeValue);
          }
        }
        this.setWfsPost(true);
      } else {
        getFeatureEl = op.querySelector('Get');
        if (getFeatureEl != null && this.parseOperationURLs_) {
          if (getFeatureEl.hasAttributeNS(ol.format.XLink.NAMESPACE_URI, 'href')) {
            this.setWfsUrl(getFeatureEl.getAttributeNS(ol.format.XLink.NAMESPACE_URI, 'href'));
          } else {
            var attr = getFeatureEl.attributes[0];
            // Attr.value is the DOM4 property, while Attr.nodeValue inherited from Node should work on older browsers
            this.setWfsUrl(attr.value || attr.nodeValue);
          }
        }
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

    var idPrefix = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER;
    var wfsList = wfsCapabilities.querySelectorAll('FeatureType');
    var dataManager = os.dataManager;
    for (i = 0, n = wfsList.length; i < n; i++) {
      var node = wfsList[i];
      var nameNode = node.querySelectorAll('Name')[0];
      var nodeTitle = node.querySelectorAll('Title')[0].textContent;

      var nameSpace = null;
      var name = nameNode.textContent;

      var prefix = '';
      var localName = name;

      if (goog.string.contains(name, ':')) {
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
      var descriptor = /** @type {os.ui.ogc.IOGCDescriptor} */ (dataManager.getDescriptor(idPrefix + name));

      if (!descriptor) {
        descriptor = /** @type {os.ui.ogc.IOGCDescriptor} */ (dataManager.getDescriptor(idPrefix + localName));
      }

      if (!descriptor) {
        // try matching just on the title
        descriptor = this.getDescriptorByTitle(nodeTitle);
      }

      if (!descriptor) {
        descriptor = this.createDescriptor();
        descriptor.setId(idPrefix + name);
        descriptor.setWfsEnabled(true);
        descriptor.setColor(os.ui.ogc.OGCServer.DEFAULT_COLOR);
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

      if (os.ui.util.deprecated.isLayerDeprecated(localName)) {
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

      if (!descriptor.isWmsEnabled()) {
        node = new os.ui.data.DescriptorNode();
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
};


/**
 * Adds the descriptor.
 *
 * @param {!os.data.IDataDescriptor} descriptor
 */
os.ui.ogc.OGCServer.prototype.addDescriptor = function(descriptor) {
  descriptor.setDataProvider(this);
  os.dataManager.addDescriptor(descriptor);
};


/**
 * Gets a descriptor that matches the given title
 *
 * @param {!string} title
 * @return {?os.ui.ogc.IOGCDescriptor} the descriptor or null
 * @protected
 */
os.ui.ogc.OGCServer.prototype.getDescriptorByTitle = function(title) {
  var list = /** @type {Array<!os.ui.ogc.IOGCDescriptor>} */ (os.dataManager.getDescriptors(
      this.getId() + os.ui.data.BaseProvider.ID_DELIMITER));

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      var desc = list[i];

      if (desc.getDescriptorType() === os.ogc.ID && desc.getTitle() == title &&
          (desc.isWmsEnabled() || desc.isWfsEnabled())) {
        return list[i];
      }
    }
  }

  return null;
};


/**
 * Creates a new layer descriptor
 *
 * @return {!os.ui.ogc.IOGCDescriptor} the descriptor
 * @protected
 */
os.ui.ogc.OGCServer.prototype.createDescriptor = function() {
  return /** @type {!os.ui.ogc.IOGCDescriptor} */ (os.dataManager.createDescriptor(os.ogc.ID));
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.ogc.OGCServer.prototype.onOGCError = function(event) {
  var req = /** @type {os.net.Request} */ (event.target);
  var errors = req.getErrors();
  var uri = req.getUri();
  goog.dispose(req);

  var href = uri.toString();
  var service = uri.getQueryData().get('service');
  var msg = 'Request failed for <a target="_blank" href="' + href + '">' + service + ' Capabilities</a>: ';

  if (errors) {
    msg += errors.join(' ');
  }

  this.logError(msg);
};


/**
 * @param {string} msg The error message.
 * @protected
 */
os.ui.ogc.OGCServer.prototype.logError = function(msg) {
  if (!this.getError()) {
    var errorMsg = 'Server [' + this.getLabel() + ']: ' + msg;

    if (!this.getPing()) {
      os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
    }

    goog.log.error(os.ui.ogc.OGCServer.LOGGER_, errorMsg);

    this.setErrorMessage(errorMsg);
    this.setLoading(false);
  }
};


/**
 * @param {Object} node
 * @param {string} version
 * @param {undefined|Array<!string>|null} crsList
 * @param {?string=} opt_attribution
 * @return {?os.structs.ITreeNode}
 * @protected
 */
os.ui.ogc.OGCServer.prototype.parseLayer = function(node, version, crsList, opt_attribution) {
  var layer = null;

  if (this.parser_) {
    // check if the descriptor already exists
    var existing = null;
    var layerId = this.parser_.parseLayerId(node);
    if (layerId) {
      var fullId = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + layerId;
      existing = /** @type {os.ui.ogc.IOGCDescriptor} */ (os.dataManager.getDescriptor(fullId));
    }

    if (!existing) {
      var title = this.parser_.parseLayerTitle(node);

      if (title) {
        existing = this.getDescriptorByTitle(title);
      }
    }

    if (existing) {
      var children = this.wfsOnlyFolder.getChildren();
      if (children) {
        for (var i = 0, n = children.length; i < n; i++) {
          if (children[i].getId() == existing.getId()) {
            this.wfsOnlyFolder.removeChild(children[i]);
            break;
          }
        }
      }
    }

    // parse the layer on top of the existing descriptor, or a new one if it wasn't found
    var layerDescriptor = existing || this.createDescriptor();
    layerDescriptor.setProviderType(this.providerType);

    this.parser_.parseLayer(node, layerDescriptor);

    // layers should inherit attribution unless they override it
    opt_attribution = layerDescriptor.getAttribution() || opt_attribution;
    layerDescriptor.setAttribution(opt_attribution || null);

    var newCRSList = (layerDescriptor.getSupportedCRS() || []).concat(crsList);
    goog.array.removeDuplicates(newCRSList);
    layerDescriptor.setSupportedCRS(newCRSList);

    var isFolder = false;
    if (this.isValidWMSLayer(layerDescriptor)) {
      // node is a wms layer
      layer = new os.ui.data.DescriptorNode();
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
        layerDescriptor.setId(this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + layerDescriptor.getWmsName());

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
      layer = new os.ui.slick.SlickTreeNode();
      layer.setId(layerDescriptor.getTitle() || '');
      layer.setLabel(layerDescriptor.getTitle());
      layer.setToolTip(layerDescriptor.getDescription() || '');

      var childList = node['Layer'];
      if (!goog.isArray(childList)) {
        childList = [childList];
      }

      for (i = 0, n = childList.length; i < n; i++) {
        var child = this.parseLayer(childList[i], version, newCRSList, opt_attribution);
        if (child) {
          layer.addChild(child);
        }
      }
    }

    if (isFolder) {
      children = layer.getChildren();
      if (!children || children.length === 0) {
        return null;
      }
    }
  }
  return layer;
};


/**
 * @param {os.ui.ogc.IOGCDescriptor} layerDescriptor
 * @return {boolean} Whether or not it should be included
 * @protected
 */
os.ui.ogc.OGCServer.prototype.isValidWMSLayer = function(layerDescriptor) {
  return !layerDescriptor.getOpaque();
};


/**
 * @param {!os.structs.ITreeNode} folder
 * @protected
 */
os.ui.ogc.OGCServer.prototype.addFolder = function(folder) {
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
};


/**
 * @param {os.structs.ITreeNode} node
 * @param {Array.<string>=} opt_tags
 * @private
 */
os.ui.ogc.OGCServer.prototype.addParentTags_ = function(node, opt_tags) {
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
  } else if (opt_tags != null && node instanceof os.ui.data.DescriptorNode) {
    var dn = /** @type {os.ui.data.DescriptorNode} */ (node);
    var descriptor = /** @type {os.ui.ogc.IOGCDescriptor} */ (dn.getDescriptor());
    if (descriptor) {
      try {
        if (!descriptor.getKeywords()) {
          descriptor.setKeywords([]);
        }

        var keywords = descriptor.getKeywords();
        for (i = 0, n = opt_tags.length; i < n; i++) {
          var tag = opt_tags[i];
          if (!ol.array.includes(keywords, tag)) {
            keywords.push(tag);
          }
        }
      } catch (e) {
        // descriptor doesn't implement keywords
      }
    }
  }
};


/**
 * @param {os.structs.ITreeNode=} opt_node
 * @protected
 */
os.ui.ogc.OGCServer.prototype.markAllDescriptors = function(opt_node) {
  var node = opt_node || this;

  if (node instanceof os.ui.data.DescriptorNode) {
    var dn = /** @type {os.ui.data.DescriptorNode} */ (node);
    var descriptor = /** @type {os.data.IServerDescriptor} */ (dn.getDescriptor());
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
};


/**
 * Finds and removes the descriptor.
 *
 * @param {os.ui.ogc.IOGCDescriptor} descriptor
 */
os.ui.ogc.OGCServer.prototype.removeDescriptor = function(descriptor) {
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
};


/**
 * @param {os.ui.ogc.IOGCDescriptor} descriptor
 * @param {?Array.<!os.structs.ITreeNode>} children
 * @return {?os.structs.ITreeNode}
 * @private
 */
os.ui.ogc.OGCServer.prototype.findNode_ = function(descriptor, children) {
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
      child = /** @type {os.ui.slick.SlickTreeNode} */ (child);
      if (child.getDescriptor() == descriptor || child.getDescriptor().getId() == descriptor.getId()) {
        return child;
      }
    }
  }
  return null;
};


/**
 * @type {RegExp}
 * @const
 * @private
 */
os.ui.ogc.OGCServer.URI_REGEXP_ = /w[mf]s/i;


/**
 * @type {RegExp}
 * @const
 * @private
 */
os.ui.ogc.OGCServer.CONTENT_REGEXP_ = /W[MF]S_Capabilities/;


/**
 * @param {os.file.File} file
 * @return {number}
 */
os.ui.ogc.OGCServer.isOGCResponse = function(file) {
  var score = 0;

  if (file && !os.file.isLocal(file)) {
    var uri = file.getUrl();

    if (uri && uri.indexOf('GetFeature') == -1) {
      score += os.ui.ogc.OGCServer.URI_REGEXP_.test(uri) ? 3 : 0;
    }

    var content = file.getContent();
    if (typeof content === 'string') {
      score += os.ui.ogc.OGCServer.CONTENT_REGEXP_.test(content) ? 3 : 0;
    }
  }

  return score;
};

goog.provide('plugin.wmts.Server');

goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');
goog.require('goog.array');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.format.WMTSCapabilities');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.color');
goog.require('os.data.ConfigDescriptor');
goog.require('os.data.DataProviderEvent');
goog.require('os.data.DataProviderEventType');
goog.require('os.data.IDataProvider');
goog.require('os.file');
goog.require('os.layer.LayerType');
goog.require('os.net.HandlerType');
goog.require('os.net.Request');
goog.require('os.ui.Icons');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.server.AbstractLoadingServer');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('plugin.wmts');


/**
 * The OGC server provider
 *
 * @implements {os.data.IDataProvider}
 * @extends {os.ui.server.AbstractLoadingServer}
 * @constructor
 */
plugin.wmts.Server = function() {
  plugin.wmts.Server.base(this, 'constructor');
  this.log = plugin.wmts.Server.LOGGER_;
  this.providerType = os.ogc.ID;

  /**
   * @type {Array.<string>}
   * @private
   */
  this.abstracts_ = [];

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
  this.originalUrl_ = '';

  /**
   * @type {goog.Uri.QueryData}
   * @private
   */
  this.params_ = null;

  /**
   * @type {string}
   * @private
   */
  this.dateFormat_ = '';

  /**
   * @type {string}
   * @private
   */
  this.timeFormat_ = '';
};
goog.inherits(plugin.wmts.Server, os.ui.server.AbstractLoadingServer);
os.implements(plugin.wmts.Server, os.data.IDataProvider.ID);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.wmts.Server.LOGGER_ = goog.log.getLogger('plugin.wmts.Server');


/**
 * Default color for descriptors.
 * @const
 * @type {string}
 */
plugin.wmts.Server.DEFAULT_COLOR = 'rgba(255,255,255,1)';


/**
 * @type {string}
 * @const
 */
plugin.wmts.Server.DEFAULT_VERSION = '1.0.0';


/**
 * @return {Array.<string>}
 */
plugin.wmts.Server.prototype.getAbstracts = function() {
  return this.abstracts_;
};


/**
 * @return {boolean}
 */
plugin.wmts.Server.prototype.getLowerCase = function() {
  return this.lowerCase_;
};


/**
 * @param {boolean} value
 */
plugin.wmts.Server.prototype.setLowerCase = function(value) {
  this.lowerCase_ = value;
};


/**
 * @return {string}
 */
plugin.wmts.Server.prototype.getOriginalUrl = function() {
  return this.originalUrl_ || this.getUrl();
};


/**
 * @param {string} value
 */
plugin.wmts.Server.prototype.setOriginalUrl = function(value) {
  this.originalUrl_ = value;
};


/**
 * @return {goog.Uri.QueryData}
 */
plugin.wmts.Server.prototype.getParams = function() {
  return this.params_;
};


/**
 * @param {goog.Uri.QueryData} value
 */
plugin.wmts.Server.prototype.setParams = function(value) {
  this.params_ = value;
};


/**
 * @return {string}
 */
plugin.wmts.Server.prototype.getDateFormat = function() {
  return this.dateFormat_;
};


/**
 * @param {string} dateFormat The date format
 */
plugin.wmts.Server.prototype.setDateFormat = function(dateFormat) {
  this.dateFormat_ = dateFormat;
};


/**
 * @return {string}
 */
plugin.wmts.Server.prototype.getTimeFormat = function() {
  return this.timeFormat_;
};


/**
 * @param {string} timeFormat The time format
 */
plugin.wmts.Server.prototype.setTimeFormat = function(timeFormat) {
  this.timeFormat_ = timeFormat;
};


/**
 * @inheritDoc
 */
plugin.wmts.Server.prototype.configure = function(config) {
  plugin.wmts.Server.base(this, 'configure', config);

  this.setUrl(/** @type {string} */ (config['url']));
  this.setOriginalUrl(/** @type {string} */ (config['url']));
  this.setLowerCase(/** @type {boolean} */ (config['lowerCase']));
  this.setDateFormat(/** @type {string} */ (config['dateFormat']));
  this.setTimeFormat(/** @type {string} */ (config['timeFormat']));

  this.setParams('params' in config ? new goog.Uri.QueryData(/** @type {string} */ (config['params'])) : null);
};


/**
 * @inheritDoc
 */
plugin.wmts.Server.prototype.finish = function() {
  if (this.isLoaded()) {
    if (this.toAdd_) {
      this.addChildren(this.toAdd_);
      this.toAdd_ = null;
    }

    if (!this.getPing()) {
      this.markAllDescriptors();
    }

    plugin.wmts.Server.base(this, 'finish');
  }
};


/**
 * @inheritDoc
 */
plugin.wmts.Server.prototype.load = function(opt_ping) {
  plugin.wmts.Server.base(this, 'load', opt_ping);
  this.setChildren(null);
  this.loadCapabilities();
};


/**
 * Updates query data from the WMTS params.
 *
 * @param {goog.Uri.QueryData} queryData The query data.
 * @private
 */
plugin.wmts.Server.prototype.updateQueryData_ = function(queryData) {
  queryData.setIgnoreCase(true);

  if (this.params_) {
    queryData.extend(this.params_);
  }

  if (!queryData.containsKey('request')) {
    queryData.set('request', 'GetCapabilities');
  }

  if (!queryData.containsKey('service')) {
    queryData.set('service', 'WMTS');
  }

  if (!queryData.containsKey('version')) {
    queryData.set('version', plugin.wmts.Server.DEFAULT_VERSION);
  }
};


/**
 * Loads WMTS GetCapabilities from the configured server.
 *
 * @protected
 */
plugin.wmts.Server.prototype.loadCapabilities = function() {
  var url = this.getOriginalUrl();
  if (url) {
    goog.log.info(plugin.wmts.Server.LOGGER_, this.getLabel() + ' requesting WMTS GetCapabilities');
    this.testUrl(url);
  } else {
    this.finish();
  }
};


/**
 * Test a WMTS URL to check if its GetCapabilities is valid.
 *
 * @param {string} url The WMTS URL
 * @param {function(goog.events.Event)=} opt_success The success handler
 * @param {function(goog.events.Event)=} opt_error The error handler
 * @protected
 */
plugin.wmts.Server.prototype.testUrl = function(url, opt_success, opt_error) {
  var uri = new goog.Uri(url);
  this.updateQueryData_(uri.getQueryData());

  var onSuccess = opt_success || this.handleCapabilities;
  var onError = opt_error || this.onOGCError;

  var request = new os.net.Request(uri);
  request.setHeader('Accept', '*/*');
  request.listen(goog.net.EventType.SUCCESS, onSuccess, false, this);
  request.listen(goog.net.EventType.ERROR, onError, false, this);
  request.setValidator(os.ogc.getException);

  goog.log.fine(plugin.wmts.Server.LOGGER_, 'Loading WMTS GetCapabilities from URL: ' + uri.toString());
  this.setLoading(true);
  request.load();
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
plugin.wmts.Server.prototype.handleCapabilities = function(event) {
  goog.log.info(plugin.wmts.Server.LOGGER_, this.getLabel() +
      ' WMTS GetCapabilities request completed. Parsing data...');

  var req = /** @type {os.net.Request} */ (event.target);
  req.unlisten(goog.net.EventType.SUCCESS, this.handleCapabilities);
  req.unlisten(goog.net.EventType.ERROR, this.onOGCError);
  var response = /** @type {string} */ (req.getResponse());

  this.parseCapabilities(response, req.getUri().toString());
};


/**
 * @param {string} response
 * @param {string} uri
 */
plugin.wmts.Server.prototype.parseCapabilities = function(response, uri) {
  var link = '<a target="_blank" href="' + uri + '">WMTS Capabilities</a>';
  if (response) {
    var doc = undefined;
    var result = undefined;
    try {
      doc = goog.dom.xml.loadXml(response);
      result = new ol.format.WMTSCapabilities().read(doc);
    } catch (e) {
      this.logError('The response XML for ' + link + ' is invalid!');
      return;
    }

    if (result) {
      if (!this.getLabel()) {
        try {
          this.setLabel(/** @type {string} */ (goog.object.getValueByKeys(result, 'ServiceIdentification', 'Title')));
        } catch (e) {
        }
      }

      var serviceAbstract = goog.object.getValueByKeys(result, 'ServiceIdentification', 'Abstract');
      if (serviceAbstract && typeof serviceAbstract === 'string') {
        this.abstracts_.push(serviceAbstract);
      }

      // prune sets in unsupported projections since OL will throw an exception if it can't find the projection
      var matrixSets = result['Contents']['TileMatrixSet'] = result['Contents']['TileMatrixSet'].filter(
          function(matrixSet) {
            // openlayers/src/ol/source/wmts.js is the source for these lines
            var code = matrixSet['SupportedCRS'];
            return code && !!(ol.proj.get(code.replace(/urn:ogc:def:crs:(\w+):(.*:)?(\w+)$/, '$1:$3')) ||
              ol.proj.get(code));
          });

      var availableSets = matrixSets.reduce(function(map, matrixSet) {
        map[matrixSet['Identifier']] = true;
        return map;
      }, {});

      var layers = goog.object.getValueByKeys(result, 'Contents', 'Layer');

      this.toAdd_ = [];
      layers.forEach(function(layer) {
        var id = layer['Identifier'];
        var fullId = this.getId() + os.ui.data.BaseProvider.ID_DELIMITER + id;

        var hasTimeExtent = 'Dimension' in layer ?
          ol.array.find(layer['Dimension'], plugin.wmts.Server.hasTimeExtent_) : false;

        var overrides = {};
        if (!this.getDateFormat() && !this.getTimeFormat()) {
          this.detectFormats_(layer['Dimension'], overrides);
        }

        var config = {
          'id': fullId,
          'type': plugin.wmts.ID,
          'description': layer['Abstract'],
          'provider': this.getLabel(),
          'title': layer['Title'],
          'extent': layer['WGS84BoundingBox'],
          'extentProjection': 'EPSG:4326',
          'layerType': os.layer.LayerType.TILES,
          'icons': os.ui.Icons.TILES + (hasTimeExtent ? os.ui.Icons.TIME : ''),
          'animate': hasTimeExtent,
          'dateFormat': this.getDateFormat() || null,
          'timeFormat': this.getTimeFormat() || null,
          'delayUpdateActive': true
        };

        ol.obj.assign(config, overrides);

        // OpenLayers defaults to the first format so get them sorted in our preferred order
        layer['Format'].sort(plugin.wmts.Server.sortFormats_);

        var crossOrigin = null;
        config['wmtsOptions'] = layer['TileMatrixSetLink'].reduce(function(wmtsOptions, setLink) {
          if (setLink['TileMatrixSet'] in availableSets) {
            var options = ol.source.WMTS.optionsFromCapabilities(/** @type {!Object} */ (result), {
              'layer': id,
              'matrixSet': setLink['TileMatrixSet']
            });
            options.crossOrigin = os.net.getCrossOrigin(options.urls[0]);
            if (!crossOrigin) {
              crossOrigin = options.crossOrigin;
            }
            wmtsOptions.push(options);
          }

          return wmtsOptions;
        }, []);

        config['crossOrigin'] = crossOrigin;
        config['projections'] = config['wmtsOptions'].map(plugin.wmts.Server.wmtsOptionsToProjection_);

        if (config['wmtsOptions'].length) {
          var descriptor = /** @type {os.data.ConfigDescriptor} */ (os.dataManager.getDescriptor(fullId));
          if (!descriptor) {
            descriptor = new os.data.ConfigDescriptor();
          }

          descriptor.setBaseConfig(config);
          var node = new os.ui.data.DescriptorNode();
          node.setDescriptor(descriptor);
          this.toAdd_.push(node);
          this.addDescriptor(descriptor);
        }
      }, this);
    }

    this.finish();
  } else {
    this.logError(link + ' response is empty!');
  }
};


/**
 * @type {!Array<!string>}
 * @const
 */
plugin.wmts.Server.PREFERRED_FORMATS_ = ['image/vnd.jpeg-png', 'image/png', 'image/jpeg'];


/**
 * @param {string} a Format a
 * @param {string} b Format b
 * @return {number} per typical compare function
 */
plugin.wmts.Server.sortFormats_ = function(a, b) {
  var preferred = plugin.wmts.Server.PREFERRED_FORMATS_;
  var ax = preferred.indexOf(a);
  ax = ax < 0 ? Number.MAX_SAFE_INTEGER : ax;
  var bx = preferred.indexOf(b);
  bx = bx < 0 ? Number.MAX_SAFE_INTEGER : bx;
  return ax - bx;
};



/**
 * @param {Object} dimension
 * @return {boolean}
 * @private
 */
plugin.wmts.Server.hasTimeExtent_ = function(dimension) {
  return /time/i.test(dimension['Identifier']);
};


/**
 * @param {?olx.source.WMTSOptions} wmtsOptions
 * @return {?string}
 */
plugin.wmts.Server.wmtsOptionsToProjection_ = function(wmtsOptions) {
  return wmtsOptions && wmtsOptions['projection'] ?
    /** @type {ol.proj.Projection} */ (wmtsOptions['projection']).getCode() : null;
};


/**
 * @param {Array<Object>} dimensions
 * @param {Object<string, *>} config
 */
plugin.wmts.Server.prototype.detectFormats_ = function(dimensions, config) {
  if (dimensions) {
    var timeDimension = ol.array.find(dimensions, plugin.wmts.Server.hasTimeExtent_);
    if (timeDimension) {
      // note that this assumes that the Units of Measure is ISO8601, but the OL parser
      // does not pull out that information to check it
      var defaultValue = timeDimension['Default'];
      if (defaultValue) {
        var timeFormat = '{start}';

        if (defaultValue.indexOf('/') > -1) {
          defaultValue = defaultValue.split(/\//)[0];
          timeFormat += '/{end}';
        }

        config['dateFormat'] = os.time.DATETIME_FORMATS[0].substring(0, defaultValue.length);
        config['timeFormat'] = timeFormat;
      }
    }
  }
};


/**
 * Adds the descriptor.
 *
 * @param {!os.data.IDataDescriptor} descriptor
 */
plugin.wmts.Server.prototype.addDescriptor = function(descriptor) {
  descriptor.setDataProvider(this);
  os.dataManager.addDescriptor(descriptor);
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
plugin.wmts.Server.prototype.onOGCError = function(event) {
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
plugin.wmts.Server.prototype.logError = function(msg) {
  if (!this.getError()) {
    var errorMsg = 'Server [' + this.getLabel() + ']: ' + msg;

    if (!this.getPing()) {
      os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
    }

    goog.log.error(plugin.wmts.Server.LOGGER_, errorMsg);

    this.setErrorMessage(errorMsg);
    this.setLoading(false);
  }
};


/**
 * @param {os.structs.ITreeNode=} opt_node
 * @protected
 */
plugin.wmts.Server.prototype.markAllDescriptors = function(opt_node) {
  var node = opt_node || this;

  if (node instanceof os.ui.data.DescriptorNode) {
    var dn = /** @type {os.ui.data.DescriptorNode} */ (node);
    var descriptor = /** @type {os.data.ConfigDescriptor} */ (dn.getDescriptor());
    descriptor.updateActiveFromTemp();
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
plugin.wmts.Server.prototype.removeDescriptor = function(descriptor) {
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
plugin.wmts.Server.prototype.findNode_ = function(descriptor, children) {
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
plugin.wmts.Server.URI_REGEXP_ = /wmts/i;


/**
 * @type {RegExp}
 * @const
 * @private
 */
plugin.wmts.Server.CONTENT_REGEXP_ = /https?:\/\/www.opengis.net\/wmts\/1.0/;


/**
 * @param {os.file.File} file
 * @return {number}
 */
plugin.wmts.Server.isOGCResponse = function(file) {
  var score = 0;

  if (file && !os.file.isLocal(file)) {
    var uri = file.getUrl();

    if (uri) {
      score += plugin.wmts.Server.URI_REGEXP_.test(uri) ? 3 : 0;
    }

    var content = file.getContent();
    if (typeof content === 'string') {
      score += plugin.wmts.Server.CONTENT_REGEXP_.test(content) ? 3 : 0;
    }
  }

  return score;
};

goog.provide('os.state.v4.BaseLayerState');
goog.provide('os.state.v4.LayerTag');

goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.format.XSD');
goog.require('os.array');
goog.require('os.color');
goog.require('os.command.LayerAdd');
goog.require('os.data.DataManager');
goog.require('os.file');
goog.require('os.im.mapping.MappingManager');
goog.require('os.net');
goog.require('os.state.XMLState');
goog.require('os.string');
goog.require('os.style.label');
goog.require('os.tag');
goog.require('os.ui.util.deprecated');
goog.require('os.uri');
goog.require('os.xml');


/**
 * XML tags for layer state
 * @enum {string}
 */
os.state.v4.LayerTag = {
  ANIMATE: 'animate',
  ARROW_SIZE: 'arrowSize',
  ARROW_UNITS: 'arrowUnits',
  BFS: 'basicFeatureStyle',
  COLOR: 'color',
  CONTRAST: 'contrast',
  CSV_COMMENT_CHAR: 'commentChar',
  CSV_HEADER_ROW: 'headerRow',
  CSV_DATA_ROW: 'dataRow',
  CSV_USE_HEADER: 'useHeader',
  DATA_PROVIDER: 'dataProvider',
  IS_BASE_LAYER: 'isBaseLayer',
  FILL_COLOR: 'fillColor',
  FILL_OPACITY: 'fillOpacity',
  LABEL_COLUMN: 'labelColumn',
  LABEL_COLUMNS: 'labelColumns',
  LABEL: 'label',
  LABEL_COLOR: 'labelColor',
  LABEL_SIZE: 'labelSize',
  LOB_COLUMN_LENGTH: 'lobColumnLength',
  LOB_LENGTH: 'lobLength',
  LOB_LENGTH_TYPE: 'lobLengthType',
  LOB_LENGTH_ERROR: 'lobLengthError',
  LOB_LENGTH_COLUMN: 'lobLengthColumn',
  LOB_LENGTH_UNITS: 'lobLengthUnits',
  LOB_LENGTH_ERROR_UNITS: 'lobLengthErrorUnits',
  LOB_LENGTH_ERROR_COLUMN: 'lobLengthErrorColumn',
  LOB_BEARING_COLUMN: 'lobBearingColumn',
  LOB_BEARING_ERROR: 'lobBearingError',
  LOB_BEARING_ERROR_COLUMN: 'lobBearingErrorColumn',
  ICON_STYLE: 'iconStyle',
  MAP_URL: 'getMapUrl',
  MAPPINGS: 'mappings',
  PARAMS: 'params',
  PARSER_CONFIG: 'parserConfig',
  PROVIDER_TYPE: 'provider',
  PT_COLOR: 'pointColor',
  PT_OPACITY: 'pointOpacity',
  PT_SIZE: 'pointSize',
  TITLE: 'title',
  SHOW_LABELS: 'showLabels',
  SHOW_ARROW: 'showArrow',
  SHOW_ELLIPSE: 'showEllipse',
  SHOW_ELLIPSOIDS: 'showEllipsoids',
  SHOW_ERROR: 'showError',
  SHOW_GROUND_REF: 'showGroundRef',
  SHOW_ROTATION: 'showRotation',
  ROTATION_COLUMN: 'rotationColumn',
  STYLES: 'styles',
  TAGS: 'tags',
  TIME_ENABLED: 'timeEnabled',
  USE_HEADER: 'useHeader',
  REFRESH_RATE: 'refreshRate',
  EXTENTS: 'extents',
  EXTENT: 'extent',
  OPACITY: 'opacity',
  ALPHA: 'alpha',
  BIN_SETTINGS: 'binSettings',
  BIN: 'bin',
  BIN_SIZE: 'binSize',
  BINS: 'bins',
  ACTIVE: 'active',
  BIN_FIELD: 'field',
  BIN_TYPE: 'type',
  BIN_WIDTH: 'width',
  BIN_OFFSET: 'offset',
  COLOR_MODEL: 'colorModel',
  COLOR_MODEL_METHOD: 'colorMethod',
  COLOR_MODEL_BIN_METHOD: 'binMethod',
  COLOR_MODEL_MANUAL_COLORS: 'manualColors',
  COLOR_MODEL_NAME: 'name',
  COLOR_MODEL_VALUE: 'value',
  COLOR_MODEL_PAIR: 'pair'
};


/**
 * XML tags for icons in the layer state.
 * @enum {string}
 */
os.state.v4.IconTag = {
  POINT_SIZE: 'iconDefaultPointSize',
  DEFAULT: 'iconDefaultTo',
  SCALE: 'iconScale',
  OPTIONS: 'iconOptions',
  URL: 'defaultIconURL',
  X_OFFSET: 'iconXOffset',
  Y_OFFSET: 'iconYOffset',
  MIX_COLOR: 'mixIconElementColor'
};



/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v4.BaseLayerState = function() {
  os.state.v4.BaseLayerState.base(this, 'constructor');
  this.description = 'Saves the current layers';
  this.rootName = 'dataLayers';
  this.title = 'Data Layers';
  // TODO:STATE -> Is type still needed, given we have mapLayers / localData
  this.rootAttrs = {
    'type': 'data'
  };

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.logger = os.state.v4.BaseLayerState.LOGGER_;

  /**
   * @type {!Array<!ol.layer.Layer>}
   */
  this.layers = [];
};
goog.inherits(os.state.v4.BaseLayerState, os.state.XMLState);


/**
 * LoggerparserConfig
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v4.BaseLayerState.LOGGER_ = goog.log.getLogger('os.state.v4.BaseLayerState');


/**
 * Checks if a layer was loaded from local data
 *
 * @param {Object.<string, *>} layerOptions The layer options
 * @return {boolean} If the layer contains local data
 * @protected
 */
os.state.v4.BaseLayerState.prototype.hasLocalData = function(layerOptions) {
  return os.file.isLocal(/** @type {string|undefined} */ (layerOptions['url'])) ||
      os.file.isLocal(/** @type {string|undefined} */ (layerOptions['url2']));
};


/**
 * Checks if a layer was loaded from the file system.
 *
 * @param {Object.<string, *>} layerOptions The layer options.
 * @return {boolean} If the layer was loaded from the file system.
 * @protected
 */
os.state.v4.BaseLayerState.prototype.hasFileSystemData = function(layerOptions) {
  return os.file.isFileSystem(/** @type {string|undefined} */ (layerOptions['url'])) ||
      os.file.isFileSystem(/** @type {string|undefined} */ (layerOptions['url2']));
};


/**
 * Checks if the provided layer is valid for addition to the state file
 *
 * @param {os.layer.ILayer} layer The layer
 * @return {boolean} If the layer should be added
 * @protected
 */
os.state.v4.BaseLayerState.prototype.isValid = function(layer) {
  try {
    // skip the layer if it doesn't have options to persist, doesn't have a type, is a one-off (loadOnce) layer,
    // or it shouldn't be saved (skipState)
    var layerOptions = layer.getLayerOptions();
    if (!layerOptions || !layerOptions['type'] || layerOptions['loadOnce'] || layerOptions['skipState']) {
      return false;
    }

    // skip base maps, static layers, and reference layers
    var type = layerOptions['type'].toLowerCase();
    if (type === 'basemap' || type === 'static' || type === 'ref') {
      return false;
    }

    // skip local/file system data (these are handled separately)
    return !this.hasLocalData(layerOptions) && !this.hasFileSystemData(layerOptions);
  } catch (e) {
    // may not be a os.layer.ILayer... so don't persist it
  }

  return false;
};


/**
 * @inheritDoc
 */
os.state.v4.BaseLayerState.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v4.BaseLayerState.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    var layers = obj.querySelectorAll('layer');
    if (layers) {
      var options = [];
      for (var i = 0, n = layers.length; i < n; i++) {
        var layerOptions = this.xmlToOptions(layers[i]);
        if (layerOptions) {
          options.push(layerOptions);
        }
      }

      options.reverse();
      this.analyzeOptions(options, id);

      for (i = 0, n = options.length; i < n; i++) {
        // execute the command directly - states should not put anything on the stack
        var cmd = new os.command.LayerAdd(options[i]);
        cmd.execute();
        cmd.dispose();
      }
    }
  } catch (e) {
    // que pasa, hombre?
    goog.log.error(os.state.v4.BaseLayerState.LOGGER_, 'Error loading layer in state ' + id, e);
  }
};


/**
 * returns the layer type
 *
 * @param {os.layer.ILayer} layer
 * @return {string}
 * @private
 */
os.state.v4.BaseLayerState.prototype.getLayerType_ = function(layer) {
  if (layer.getLayerOptions()) {
    var type = layer.getLayerOptions()['type'];
    return goog.string.isEmptyOrWhitespace(goog.string.makeSafe(type)) ?
      '' : /** @type {string} */ (layer.getLayerOptions()['type']);
  }
  return '';
};


/**
 * returns the layers
 *
 * @return {!Array<!ol.layer.Layer>}
 */
os.state.v4.BaseLayerState.prototype.getLayers = function() {
  return this.layers;
};


/**
 * @param {!Array<!ol.layer.Layer>} layers
 */
os.state.v4.BaseLayerState.prototype.setLayers = function(layers) {
  this.layers = layers;
};


/**
 * @inheritDoc
 */
os.state.v4.BaseLayerState.prototype.saveInternal = function(options, rootObj) {
  try {
    var layers = this.getLayers();
    var hasLocked = false;
    var skippedLayers = [];

    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = /** @type {os.layer.ILayer} */ (layers[i]);
      if (this.isValid(layer)) {
        var layerEl = this.layerToXML(layer, options, undefined, {'title': layer.getTitle()});
        if (layerEl) {
          rootObj.appendChild(layerEl);
        }

        var source = /** @type {ol.layer.Layer} */ (layer).getSource();
        if (!hasLocked && source instanceof os.source.Vector) {
          hasLocked = source.isLocked();
        }
      }

      var layerOptions = layer.getLayerOptions();
      if (layerOptions && layerOptions['skipState']) {
        skippedLayers.push(layer.getTitle());
      }
    }

    if (skippedLayers.length > 0) {
      var joined = '';

      skippedLayers.forEach(function(l) {
        joined += '<li>' + l + '</li>';
      });

      var msg = 'The following layer(s) are not supported by state files: <ul class="my-2"><b>' + joined +
          '</b></ul> and have been excluded. The state file will look different from what you currently see!';
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    }

    if (hasLocked) {
      var msg = 'You have at least one of your layers locked. Locked layers are included in state files, ' +
          'but they <b>will not be locked</b> when the state is loaded. The state file may look different ' +
          'from what you currently see!';
      os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
    }

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};


/**
 * Converts a {@link os.layer.ILayer} to an XML element
 * Default tag exclusions: locked, featureType, type
 *
 * @param {os.layer.ILayer} layer The layer
 * @param {os.state.XMLStateOptions} options The save options
 * @param {string|Array.<string>=} opt_exclusions exclude these additional tags from the output.
 * @param {Object.<string, *>=} opt_layerConfig force these options to be used in the xml.
 * @return {?Element} The XML element
 * @protected
 */
os.state.v4.BaseLayerState.prototype.layerToXML = function(layer, options, opt_exclusions, opt_layerConfig) {
  // setting locked=true will just guarantee empty layers on the other end
  // any layer that needs featureType should be capable of grabbing it on load
  // the type will be set as an attribute, so don't add it as an element
  var tagExclusions = ['locked', 'featureType', 'type'];

  var layerOptions = layer.getLayerOptions();
  if (!layerOptions) {
    return null;
  }

  // write the persisted layer on top of the cloned options so we have (most) everything in one place
  var layerConfig = goog.object.clone(layer.getLayerOptions());
  if (opt_layerConfig != null) {
    Object.assign(layerConfig, opt_layerConfig);
  }

  layer.persist(layerConfig);

  var url = /** @type {string|undefined} */ (layerConfig['url']);
  if (typeof url === 'string' && !os.file.isLocal(url)) {
    // writing to xml, do not encode URLs, we are looking for specific values like the {X}/{Y}/{Z} layer
    url = layerConfig['url'] = decodeURIComponent(os.uri.addBase(url));
  }

  // make sure a single <url> tag is included for apps that do not support multiple
  var urls = /** @type {Array<string>|undefined} */ (layerConfig['urls']);
  if (urls && urls.length > 0 && !url) {
    layerConfig['url'] = urls[0];
  }

  var type = this.getLayerType_(layer);

  if (opt_exclusions != null) {
    var exclusions = goog.isArray(opt_exclusions) ? opt_exclusions : [opt_exclusions];
    tagExclusions = goog.array.join(tagExclusions, exclusions);
  }
  for (var i = 0, n = tagExclusions.length; i < n; i++) {
    if (layerConfig[tagExclusions[i]] != null) {
      delete layerConfig[tagExclusions[i]];
    }
  }

  var layerEl = os.xml.createElement('layer', options.doc);
  var bfs = type != 'wms' ? os.xml.createElement(os.state.v4.LayerTag.BFS, options.doc) : null;

  for (var key in layerConfig) {
    var value = layerConfig[key];
    if (value != null) {
      this.configKeyToXML(layerConfig, type, key, value, bfs, layerEl);
    }
  }

  if (bfs && bfs.childElementCount > 0) {
    layerEl.appendChild(bfs);
  }

  if (type == 'wms' && url) {
    os.xml.appendElement(os.state.v4.LayerTag.MAP_URL, layerEl, url);
  }

  goog.dom.xml.setAttributes(layerEl, {
    'type': type
  });

  return layerEl;
};


/**
 * @param {!Object<string, *>} layerConfig The layer config object
 * @param {!string} type The layer type
 * @param {!string} key The key to write
 * @param {*} value The value to write
 * @param {?Element} bfs The basicFeatureStyle element
 * @param {!Element} layerEl The layer element
 * @protected
 */
os.state.v4.BaseLayerState.prototype.configKeyToXML = function(layerConfig, type, key, value, bfs, layerEl) {
  switch (key) {
    case 'params':
      var paramsEl = os.xml.appendElement(os.state.v4.LayerTag.PARAMS, layerEl);
      var qd = os.net.paramsToQueryData(/** @type {string|goog.Uri.QueryData|Object} */ (value));
      var qdKeys = qd.getKeys();
      for (var i = 0, n = qdKeys.length; i < n; i++) {
        var qdKey = qdKeys[i];
        var qdValue = String(qd.get(qdKey));
        if (type == 'wms') {
          qdKey = qdKey.toUpperCase();
        } else if (type == 'wfs') {
          qdKey = qdKey.toLowerCase();
        }

        os.xml.appendElement(qdKey, paramsEl, qdValue);
      }
      break;
    case 'provider':
      os.xml.appendElement(os.state.v4.LayerTag.DATA_PROVIDER, layerEl, value);
      break;
    case 'baseType':
      // include the provider tag
      os.xml.appendElement(os.state.v4.LayerTag.PROVIDER_TYPE, layerEl, value);
      this.defaultConfigToXML(key, value, layerEl);
      break;
    case os.style.StyleField.COLOR:
      if (bfs) {
        // hex string without the leading hash
        var pointColor = os.color.toServerString(/** @type {string} */ (value));
        os.xml.appendElement(os.state.v4.LayerTag.PT_COLOR, bfs, pointColor);
      } else {
        // tile layer
        this.defaultConfigToXML(key, value, layerEl);
      }
      break;
    case os.style.StyleField.FILL_COLOR:
      if (bfs) {
        // hex string without the leading hash
        var xmlColor = os.color.toServerString(/** @type {string} */ (value));
        os.xml.appendElement(os.state.v4.LayerTag.FILL_COLOR, bfs, xmlColor);

        // extract opacity from the color string
        var colorArr = os.color.toRgbArray(/** @type {string} */ (value));
        var fillOpacity = colorArr.length == 4 ? colorArr[3] : os.style.DEFAULT_FILL_ALPHA;
        os.xml.appendElement(os.state.v4.LayerTag.FILL_OPACITY, bfs, fillOpacity);
      } else {
        // tile layer
        this.defaultConfigToXML(key, value, layerEl);
      }
      break;
    case 'contrast':
      if (typeof value === 'number' && !isNaN(value)) {
        // Cesium contrast: 0 is gray, 1 is normal, > 1 increases contrast. we allow from 0 to 2.
        os.xml.appendElement(os.state.v4.LayerTag.CONTRAST, layerEl, Math.round((value - 1) * 100));
      }
      break;
    case 'alpha':
    case 'opacity':
      if (bfs) {
        value = value != null ? Number(value) : os.style.DEFAULT_ALPHA;
        var opacity = Math.round(value * 255);
        var pointOpacityElement = bfs.querySelector(os.state.v4.LayerTag.PT_OPACITY);
        if (pointOpacityElement) {
          pointOpacityElement.textContent = opacity;
        } else {
          os.xml.appendElement(os.state.v4.LayerTag.PT_OPACITY, bfs, opacity);
        }
      } else {
        // write tile layer opacity/alpha as alpha
        value = value != null ? Number(value) : os.style.DEFAULT_ALPHA;
        os.xml.appendElement(os.state.v4.LayerTag.ALPHA, layerEl, value);
      }
      break;
    case 'size':
      if (bfs) {
        value = value != null ? Math.floor(value) : os.style.DEFAULT_FEATURE_SIZE;

        var pointSize = value * 2;
        os.xml.appendElement(os.state.v4.LayerTag.PT_SIZE, bfs, pointSize);
      }
      break;
    case 'styles':
      var stylesEl = os.xml.appendElement(os.state.v4.LayerTag.STYLES, layerEl);
      var styles = /** @type {Array} */ (value);

      for (var i = 0, n = styles.length; i < n; i++) {
        if (styles[i]['data']) {
          var styleEl = os.xml.appendElement('style', stylesEl);
          os.xml.appendElement('name', styleEl, styles[i]['data']);
          os.xml.appendElement('title', styleEl, styles[i]['label']);
        }
      }
      break;
    case os.style.StyleField.LABELS:
      var labelColumn = /** @type {Array<os.style.label.LabelConfig>} */ (value);
      if (bfs && labelColumn.length > 0 &&
          !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(labelColumn[0]['column']))) {
        // New Multi column
        var labelColumns = os.xml.appendElement(os.state.v4.LayerTag.LABEL_COLUMNS, bfs);
        os.array.forEach(labelColumn, function(label) {
          os.xml.appendElement(os.state.v4.LayerTag.LABEL, labelColumns, undefined, {
            'column': label['column'],
            'showColumn': label['showColumn']
          });
        });
      }
      break;
    case os.style.StyleField.LABEL_COLOR:
      if (bfs && typeof value === 'string' && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(value))) {
        var color = os.color.toServerString(value);
        os.xml.appendElement(os.state.v4.LayerTag.LABEL_COLOR, bfs, color);
      }
      break;
    case os.style.StyleField.LABEL_SIZE:
      if (bfs && typeof value === 'number') {
        os.xml.appendElement(os.state.v4.LayerTag.LABEL_SIZE, bfs, value);
      }
      break;
    case os.style.StyleField.SHOW_LABELS:
      os.xml.appendElement(os.state.v4.LayerTag.SHOW_LABELS, layerEl, value);
      break;
    case os.style.StyleField.ICON:
      var iconEl = os.xml.appendElement(os.state.v4.LayerTag.ICON_STYLE, layerEl);

      // append the boilerplate values
      os.xml.appendElement(os.state.v4.IconTag.POINT_SIZE, iconEl, '4.0');
      os.xml.appendElement(os.state.v4.IconTag.DEFAULT, iconEl, 'Icon');

      // size and the value: convert to 0-100 iconScale and add the URL
      var iconScale = os.style.DEFAULT_FEATURE_SIZE * 10;
      if (layerConfig['size'] && typeof layerConfig['size'] === 'number') {
        // use the feature size to convert into a scale if it's available
        iconScale = Math.floor(/** @type {number} */ (layerConfig['size']) * 10);
      }
      var iconOptions = value['options'] || undefined;
      if (iconOptions) {
        os.xml.appendElement(os.state.v4.IconTag.OPTIONS, iconEl, JSON.stringify(iconOptions));
      }
      os.xml.appendElement(os.state.v4.IconTag.SCALE, iconEl, iconScale);
      os.xml.appendElement(os.state.v4.IconTag.URL, iconEl, value['path']);

      // more boilerplate
      os.xml.appendElement(os.state.v4.IconTag.X_OFFSET, iconEl, 0);
      os.xml.appendElement(os.state.v4.IconTag.Y_OFFSET, iconEl, 0);
      os.xml.appendElement(os.state.v4.IconTag.MIX_COLOR, iconEl, true);
      break;
    case 'mappings':
      var mappings = /** @type {Array.<os.im.mapping.IMapping>} */ (layerConfig['mappings']);
      if (mappings && mappings.length > 0) {
        var mappingsStateEl = os.xml.appendElement(os.state.v4.LayerTag.MAPPINGS, layerEl);
        var mappingsEl = os.im.mapping.MappingManager.getInstance().toXml(mappings);

        var elements = mappingsEl.getElementsByTagName('mapping');
        // Not exactly sure why, but the elements array gets modified
        // when appendChild gets called. Going through the array in reverse
        // order mitigates this index issues.
        for (var i = elements.length; i > 0; i--) {
          mappingsStateEl.appendChild(elements[i - 1]);
        }
      }
      break;
    case os.state.v4.LayerTag.CSV_COMMENT_CHAR:
      this.defaultConfigToXML('comment', value, layerEl);
      this.defaultConfigToXML('quote', '"', layerEl);
      break;
    case os.state.v4.LayerTag.CSV_DATA_ROW:
      // convert from 1 based indexing to 0 based.
      this.defaultConfigToXML(os.state.v4.LayerTag.CSV_DATA_ROW, /** @type {number} */ (value) - 1, layerEl);
      break;
    case os.state.v4.LayerTag.CSV_HEADER_ROW:
      // convert from 1 based indexing to 0 based. But needs to be set to -1 when useHeader is false.
      if (layerConfig[os.state.v4.LayerTag.CSV_USE_HEADER]) {
        this.defaultConfigToXML(os.state.v4.LayerTag.CSV_HEADER_ROW, /** @type {number} */ (value) - 1, layerEl);
      } else {
        this.defaultConfigToXML(os.state.v4.LayerTag.CSV_HEADER_ROW, -1, layerEl);
      }
      break;
    case os.state.v4.LayerTag.CSV_USE_HEADER:
    case os.state.v4.LayerTag.PARSER_CONFIG:
      // NO-OP
      break;
    case os.state.v4.LayerTag.ANIMATE:
      // animate comes from the original layer options, while timeEnabled is the user-controlled value. if timeEnabled
      // exists, skip this key in favor of the user value.
      if (!(os.state.v4.LayerTag.TIME_ENABLED in layerConfig)) {
        this.defaultConfigToXML(key, value, layerEl);
      }
      break;
    case os.state.v4.LayerTag.TIME_ENABLED:
      // save under the animate element
      this.defaultConfigToXML(os.state.v4.LayerTag.ANIMATE, value, layerEl);
      break;
    case os.state.v4.LayerTag.IS_BASE_LAYER:
      this.defaultConfigToXML('baseLayer', value, layerEl);
      break;
    case 'refreshInterval':
      os.xml.appendElement(os.state.v4.LayerTag.REFRESH_RATE, layerEl, value);
      break;
    case os.state.v4.LayerTag.EXTENT:
      layerEl.appendChild(this.extentsToXML_(/** @type {Array<number>} */ (value)));
      break;
    case os.state.v4.LayerTag.COLOR_MODEL:
      var colorModelEle = this.colorModeOptionsToXml_(value);
      layerEl.appendChild(colorModelEle);
      break;
    default:
      this.defaultConfigToXML(key, value, layerEl);
      break;
  }
};


/**
 * Converts an extent to a kml:LatLonBoxType
 *
 * @param {Array<number>} extents
 * @return {!Element} the extents element
 * @private
 */
os.state.v4.BaseLayerState.prototype.extentsToXML_ = function(extents) {
  var element = os.xml.createElement(os.state.v4.LayerTag.EXTENTS);
  var normalizedExtent = ol.proj.transformExtent(extents, os.proj.EPSG4326, os.map.PROJECTION);
  var ns = 'http://www.opengis.net/kml/2.2';
  os.xml.appendElementNS('north', ns, element, normalizedExtent[3]);
  os.xml.appendElementNS('south', ns, element, normalizedExtent[1]);
  os.xml.appendElementNS('east', ns, element, normalizedExtent[2]);
  os.xml.appendElementNS('west', ns, element, normalizedExtent[0]);
  return element;
};


/**
 * Transforms an kml:LatLonBoxType element to an extent.
 *
 * @param {Element} element
 * @return {Array<number>}
 * @private
 */
os.state.v4.BaseLayerState.prototype.extentsFromXML_ = function(element) {
  var result = [];
  result.push(parseFloat(os.xml.getElementValueOrDefault(element.querySelector('west'), -179)));
  result.push(parseFloat(os.xml.getElementValueOrDefault(element.querySelector('south'), -89)));
  result.push(parseFloat(os.xml.getElementValueOrDefault(element.querySelector('east'), 179)));
  result.push(parseFloat(os.xml.getElementValueOrDefault(element.querySelector('north'), 89)));
  return ol.proj.transformExtent(result, os.map.PROJECTION, os.proj.EPSG4326);
};


/**
 * Default handler for unknown layer configuration keys.
 *
 * @param {string} key The key
 * @param {*} value The value
 * @param {!Element} layerEl The layer element
 * @protected
 */
os.state.v4.BaseLayerState.prototype.defaultConfigToXML = function(key, value, layerEl) {
  var node = null;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value === 'string' && key.search(/color/i) > -1 && key != 'colorize' && os.color.isColorString(value)) {
      try {
        // output hex
        value = os.color.toServerString(value);
      } catch (e) {
        // default to white
        value = '0xffffff';
      }
    } else if (typeof value === 'string' && goog.string.startsWith(value, 'url')) {
      // make sure url's are qualified
      value = os.uri.addBase(value);
    }

    // don't include the hash key since it will cause a crash
    if (typeof value === 'string' && key == '$$hashKey') {
      return;
    }

    os.xml.appendElement(key, layerEl, value);
  } else if (goog.isArray(value)) {
    var arr = /** @type {Array} */ (value);
    var childName = goog.string.endsWith(key, 's') ? key.substring(0, key.length - 1) : key;
    node = os.xml.appendElement(key, layerEl);

    for (var i = 0, n = arr.length; i < n; i++) {
      this.defaultConfigToXML(childName, arr[i], node);
    }
  } else {
    // classes
    var persistable = os.stateManager.isPersistable(key);
    if (persistable) {
      // only try this if the key is registered with the state manager
      try {
        var obj = /** @type {os.IPersistable} */ (value).persist();
        os.xml.appendElement(key, layerEl, JSON.stringify(obj));
      } catch (e) {
        // don't persist it
      }
    } else if (goog.isObject(value) && !goog.isFunction(value)) {
      // plain objects
      // create the node for this key and recurse
      node = os.xml.appendElement(key, layerEl);

      for (var field in value) {
        this.defaultConfigToXML(field, value[field], node);
      }
    }
  }
};


/**
 * Default handler for unknown XML nodes.
 *
 * @param {string} key The key
 * @param {Element} el The element
 * @return {*} The config value
 * @protected
 */
os.state.v4.BaseLayerState.prototype.defaultXmlToConfig = function(key, el) {
  var result = null;
  var persistObj = os.stateManager.getPersistable(key);
  var value = el.textContent;
  var children = goog.dom.getChildren(el);

  if (persistObj) {
    var jsonObj = /** @type {!Object} */ (JSON.parse(value));
    persistObj.restore(jsonObj);
    result = persistObj;
  } else if (key.search(/color/i) > -1 && key != 'colorize' && children.length == 0 &&
      os.color.isColorString(value)) {
    result = os.color.padHexColor(value, '0x');
  } else if (children && children.length > 0) {
    var i;
    var n;

    if (el.localName == children[0].localName + 's' ||
        (children.length > 1 && children[1].localName == children[0].localName)) {
      // this is an array
      result = [];

      for (i = 0, n = children.length; i < n; i++) {
        result.push(this.defaultXmlToConfig(children[i].localName, children[i]));
      }
    } else {
      // plain objects
      result = {};

      for (i = 0, n = children.length; i < n; i++) {
        var child = children[i];
        result[child.localName] = this.defaultXmlToConfig(child.localName, child);
      }
    }
  } else if (os.string.isFloat(value)) {
    // can't use goog.string.isNumeric() for this check because it doesn't support floats or negative integers
    result = parseFloat(value);
  } else if (os.string.isHex(value)) {
    result = parseInt(value, 16);
  } else if (os.string.isBoolean(value)) {
    result = value.toLowerCase() == 'true';
  } else {
    result = value;
  }

  return result;
};


/**
 * Analyzes all layer options objects in the state file
 *
 * @param {Array.<Object.<string, *>>} options The array of layer options objects
 * @param {string} id The state file id
 * @protected
 */
os.state.v4.BaseLayerState.prototype.analyzeOptions = function(options, id) {
  for (var i = 0, n = options.length; i < n; i++) {
    var layerOptions = options[i];
    layerOptions['id'] = os.state.AbstractState.createId(id, /** @type {string} */ (layerOptions['id']));
    layerOptions['exportEnabled'] = true;

    var descriptor = os.dataManager.getDescriptor(id.substring(0, id.length - 1));
    if (descriptor) {
      layerOptions['provider'] = descriptor.getTitle();
    }

    var typeName = layerOptions['layer'];
    if (!typeName) {
      var params = layerOptions['params'];
      if (params) {
        var paramsTypeName = params.get('typename');
        if (goog.isArray(paramsTypeName)) {
          typeName = paramsTypeName[0];
        } else {
          typeName = paramsTypeName;
        }

        if (typeof typeName === 'string') {
          var idx = typeName.indexOf(':');
          if (idx > -1) {
            typeName = typeName.substring(idx + 1);
          }
        }
      }
    }

    var style = /** @type {string} */ (layerOptions['style']);
    var styles = /** @type {Array<Object>} */ (layerOptions['styles']);
    // fix any styles that don't reference the data
    if (style != null && styles != null) {
      var matchesStyle = false;
      for (var j = 0, m = styles.length; j < m; j++) {
        if (styles[j]['data'] === style) {
          matchesStyle = true;
          break;
        }
        if (styles[j]['label'] === style) {
          matchesStyle = true;
          layerOptions['style'] = styles[j].data;
          break;
        }
      }

      if (!matchesStyle) {
        layerOptions['style'] = '';
      }
    }

    if (typeName && os.ui.util.deprecated.isLayerDeprecated(/** @type {string} */ (typeName))) {
      os.ui.util.deprecated.showDeprecatedWarning(/** @type {string} */ (layerOptions['title']));
    }
  }
};


/**
 * Converts an XML node into layer options
 *
 * @param {Element} node The XML element representing the layer
 * @return {Object.<string, *>} The layer options
 * @protected
 */
os.state.v4.BaseLayerState.prototype.xmlToOptions = function(node) {
  if (node) {
    var children = goog.dom.getChildren(node);
    if (children) {
      var type = String(node.getAttribute('type'));
      var options = os.layer.config.LayerConfigManager.getInstance().getDefaultLayerConfig(type);

      for (var i = 0, n = children.length; i < n; i++) {
        var child = children[i];
        var name = child.localName;

        if (goog.string.contains(name, 'FileSource')) {
          // ignore this layer
          return null;
        }

        this.xmlToConfigKey(node, child, name, options);
      }

      // set the type from the node attribute
      options['type'] = type.toUpperCase();

      if ('typeOverride' in options) {
        var typeOverride = /** @type {string} */ (options['typeOverride']);
        var lcm = os.layer.config.LayerConfigManager.getInstance();
        if (lcm.getLayerConfig(typeOverride)) {
          // we have a layerConfig for the override, so use it
          options['type'] = typeOverride;
          delete options['typeOverride'];
        }
      }

      return options;
    }
  }

  return null;
};


/**
 * @param {!Element} node The root layers node
 * @param {!Element} child The node
 * @param {!string} name The node name
 * @param {!Object<string, *>} options The config options
 */
os.state.v4.BaseLayerState.prototype.xmlToConfigKey = function(node, child, name, options) {
  switch (name) {
    case os.state.v4.LayerTag.BFS:
      var styleList = goog.dom.getChildren(child);
      for (var j = 0, m = styleList.length; j < m; j++) {
        var styleName = styleList[j].localName;
        var styleVal = styleList[j].textContent;

        switch (styleName) {
          case os.state.v4.LayerTag.PT_COLOR:
            try {
              styleVal = os.color.padHexColor(styleVal, '#');
              options['color'] = os.style.toRgbaString(styleVal);
            } catch (e) {
              options['color'] = os.style.DEFAULT_LAYER_COLOR;
            }
            break;
          case os.state.v4.LayerTag.PT_OPACITY:
            options['opacity'] = goog.string.isNumeric(styleVal) ? Number(styleVal) / 255 :
              os.style.DEFAULT_ALPHA;
            break;
          case os.state.v4.LayerTag.PT_SIZE:
            options['size'] = goog.string.isNumeric(styleVal) ? Number(styleVal) / 2 :
              os.style.DEFAULT_FEATURE_SIZE;
            break;
          case os.state.v4.LayerTag.FILL_COLOR:
            try {
              styleVal = os.color.padHexColor(styleVal, '#');
              options[os.style.StyleField.FILL_COLOR] = os.style.toRgbaString(styleVal);
            } catch (e) {
            }
            break;
          case os.state.v4.LayerTag.FILL_OPACITY:
            var fillOpacity = Number(styleVal);
            if (isNaN(fillOpacity)) {
              fillOpacity = os.style.DEFAULT_FILL_ALPHA;
            }
            options[os.style.StyleField.FILL_OPACITY] = goog.math.clamp(fillOpacity, 0, 1);
            break;
          case os.state.v4.LayerTag.LABEL_COLUMN:
            var column = typeof styleVal === 'string' ? goog.string.trim(styleVal) : '';
            // Is this the default?
            if (options[os.style.StyleField.LABELS] == undefined) {
              options[os.style.StyleField.LABELS] = [os.style.label.cloneConfig()];
              options[os.style.StyleField.LABELS][0]['column'] = column;
              options[os.style.StyleField.LABELS][0]['showColumn'] = false;
            }
            var source = this.getSource(node);
            if (source && source.indexOf('MIST3D') > -1) {
              options[os.style.StyleField.SHOW_LABELS] = !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(column));
            }
            break;
          case os.state.v4.LayerTag.LABEL_COLUMNS:
            var labels = [];
            var labelColumns = goog.dom.getChildren(styleList[j]);
            os.array.forEach(labelColumns, function(label) {
              labels.push({
                'column': label.getAttribute('column'),
                'showColumn': label.getAttribute('showColumn') == 'true' ? true : false
              });
            });
            options[os.style.StyleField.LABELS] = labels;
            break;
          case os.state.v4.LayerTag.LABEL_COLOR:
            try {
              styleVal = os.color.padHexColor(styleVal, '#');
              options[os.style.StyleField.LABEL_COLOR] = os.style.toRgbaString(styleVal);
            } catch (e) {
              options[os.style.StyleField.LABEL_COLOR] = '';
            }
            break;
          case os.state.v4.LayerTag.LABEL_SIZE:
            // make sure the label size is between allowed values, and use the default value if none specified
            var styleSize = goog.string.isNumeric(styleVal) ? Number(styleVal) : 0;
            var size = styleSize > 0 ?
              goog.math.clamp(styleSize, os.style.label.MIN_SIZE, os.style.label.MAX_SIZE) :
              os.style.label.DEFAULT_SIZE;
            options[os.style.StyleField.LABEL_SIZE] = size;
            break;
          default:
            break;
        }
      }
      break;
    case os.state.v4.LayerTag.CONTRAST:
      // Desktop doesn't have contrast, and Cesium treats 1.0 as normal.
      var contrast = Number(child.textContent);
      var adjustedContrast = (contrast / 100) + 1;
      options['contrast'] = !isNaN(contrast) ? goog.math.clamp(adjustedContrast, 0, 2) : 1.0;
      break;
    case os.state.v4.LayerTag.DATA_PROVIDER:
      options['provider'] = child.textContent;
      break;
    case os.state.v4.LayerTag.MAP_URL:
      // trim trailing ? from the url
      options['url'] = child.textContent.replace(/[?]+$/, '');
      break;
    case os.state.v4.LayerTag.PARAMS:
      var qd = options['params'] || new goog.Uri.QueryData();
      var pc = goog.dom.getChildren(child);
      for (var j = 0, m = pc.length; j < m; j++) {
        qd.set(pc[j].localName, pc[j].textContent);
      }

      options['params'] = qd;
      break;
    case os.state.v4.LayerTag.STYLES:
      var styles = [{'data': '', 'label': 'Default'}];
      var list = goog.dom.getChildren(child);

      if (list) {
        for (j = 0, m = list.length; j < m; j++) {
          var sn = list[j].querySelector('name');
          var st = list[j].querySelector('title');
          styles.push({
            'data': sn && sn.textContent || '',
            'label': st && st.textContent || ''
          });
        }

        options['styles'] = styles;
      }
      break;
    case os.state.v4.LayerTag.TAGS:
      options['tags'] = os.tag.tagsFromXML(child);
      break;
    case os.state.v4.LayerTag.TITLE:
      // Desktop add 'Tiles' and 'Features' to the exported layer titles, but we add that in a separate directive
      options['title'] = child.textContent.replace(/\s*(Tiles|Features)\s*$/, '');
      break;
    case os.state.v4.LayerTag.SHOW_LABELS:
      options[os.style.StyleField.SHOW_LABELS] = child.textContent == 'true';
      break;
    case os.state.v4.LayerTag.ICON_STYLE:
      var urlEle = child.querySelector(os.state.v4.IconTag.URL);
      if (urlEle) {
        var iconOptions = child.querySelector(os.state.v4.IconTag.OPTIONS) || undefined;
        if (iconOptions) {
          iconOptions = JSON.parse(iconOptions.innerHTML);
        }
        // massage the URL a bit as Desktop writes it out as a local file protocol
        var urlText = urlEle.textContent;
        var i = urlText.indexOf('maps.google.com');
        // if it's a google maps icon, we reference it locally
        if (i > -1) {
          urlText = 'http://' + urlText.substring(i);
        }
        options[os.style.StyleField.ICON] = {
          'path': urlText,
          'options': iconOptions
        };
      }
      break;
    case os.state.v4.LayerTag.MAPPINGS:
      var mappingManager = os.im.mapping.MappingManager.getInstance();
      var mappings = [];
      var mappingEls = goog.dom.getChildren(child);
      for (var j = 0, m = mappingEls.length; j < m; j++) {
        var mappingElement = mappingEls[j];
        var mapping = mappingManager.fromXml(mappingElement);
        mappings.push(mapping);
      }

      options['mappings'] = mappings;
      break;
    case os.state.v4.LayerTag.ANIMATE:
      options[name] = this.defaultXmlToConfig(name, child);
      options[os.state.v4.LayerTag.TIME_ENABLED] = options[name];
      break;
    case os.state.v4.LayerTag.TIME_ENABLED:
      // NO-OP (handled by the animate element)
      break;
    case 'comment':
      options[os.state.v4.LayerTag.CSV_COMMENT_CHAR] = this.defaultXmlToConfig(name, child);
      break;
    case os.state.v4.LayerTag.CSV_DATA_ROW:
      // convert from 0 based indexing to 1 based indexing.
      options[os.state.v4.LayerTag.CSV_DATA_ROW] = this.defaultXmlToConfig(name, child) + 1;
      break;
    case os.state.v4.LayerTag.CSV_HEADER_ROW:
      // convert from 0 based indexing to 1 based indexing.
      var val = /** @type {number} */ (this.defaultXmlToConfig(name, child));
      options[os.state.v4.LayerTag.CSV_USE_HEADER] = val < 0 ? false : true;
      options[os.state.v4.LayerTag.CSV_HEADER_ROW] = val + 1;
      break;
    case 'baseLayer':
      options[os.state.v4.LayerTag.IS_BASE_LAYER] = this.defaultXmlToConfig(name, child);
      break;
    case os.state.v4.LayerTag.REFRESH_RATE:
      options['refreshInterval'] = this.defaultXmlToConfig(name, child);
      break;
    case os.state.v4.LayerTag.EXTENTS:
      options[os.state.v4.LayerTag.EXTENT] = this.extentsFromXML_(child);
      break;
    case os.state.v4.LayerTag.COLOR_MODEL:
      var cm = this.colorModeOptionsFromXml_(child);
      options[os.state.v4.LayerTag.COLOR_MODEL] = cm;
      break;
    default:
      options[name] = this.defaultXmlToConfig(name, child);
      break;
  }
};


/**
 * Converts the colorModel node to a colorModel options object.
 *
 * @param {Element} node
 * @return {Object}
 * @private
 */
os.state.v4.BaseLayerState.prototype.colorModeOptionsFromXml_ = function(node) {
  var result = {
    'colorMethod': 0,
    'binMethod': {},
    'manualColors': {}
  };
  var cmv = os.xml.getElementValueOrDefault(node.querySelector(os.state.v4.LayerTag.COLOR_MODEL_METHOD), 0);
  result['colorMethod'] = parseInt(cmv, 10);

  var binElement = node.querySelector(os.state.v4.LayerTag.COLOR_MODEL_BIN_METHOD);
  if (binElement) {
    var binFieldEl = binElement.querySelector(os.state.v4.LayerTag.BIN_FIELD);
    if (binFieldEl) {
      var binField = ol.format.XSD.readString(binFieldEl);
      result['binMethod'][os.state.v4.LayerTag.BIN_FIELD] = binField || '';
    }

    var binTypeEl = binElement.querySelector(os.state.v4.LayerTag.BIN_TYPE);
    if (binTypeEl) {
      var binType = ol.format.XSD.readString(binTypeEl);
      result['binMethod'][os.state.v4.LayerTag.BIN_TYPE] = binType || '';
    }

    var widthEl = binElement.querySelector(os.state.v4.LayerTag.BIN_WIDTH);
    if (widthEl) {
      var width = ol.format.XSD.readDecimal(widthEl);
      if (width != null) {
        result['binMethod']['width'] = width;
      }
    }

    var offsetEl = binElement.querySelector(os.state.v4.LayerTag.BIN_OFFSET);
    if (offsetEl) {
      var offset = ol.format.XSD.readDecimal(offsetEl);
      if (offset != null) {
        result['binMethod']['offset'] = offset;
      }
    }
  }

  var manColorElement = node.querySelector(os.state.v4.LayerTag.COLOR_MODEL_MANUAL_COLORS);
  var manColorPairs = manColorElement.querySelectorAll(os.state.v4.LayerTag.COLOR_MODEL_PAIR);
  var pairElement;
  var valElement;
  var nameElement;
  var name;
  var value;

  for (var i = 0; i < manColorPairs.length; i++) {
    pairElement = manColorPairs[i];
    nameElement = pairElement.querySelector(os.state.v4.LayerTag.COLOR_MODEL_NAME);
    valElement = pairElement.querySelector(os.state.v4.LayerTag.COLOR_MODEL_VALUE);
    name = os.xml.getElementValueOrDefault(nameElement, null);
    value = os.xml.getElementValueOrDefault(valElement, null);
    if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(name))) {
      result['manualColors'][name] = value;
    }
  }
  return result;
};


/**
 * Returns the colorModel xml node for the color model.
 *
 * @param {*} colorModel
 * @return {Element}
 * @private
 */
os.state.v4.BaseLayerState.prototype.colorModeOptionsToXml_ = function(colorModel) {
  var element = os.xml.createElement(os.state.v4.LayerTag.COLOR_MODEL);
  if (colorModel) {
    os.xml.appendElement(os.state.v4.LayerTag.COLOR_MODEL_METHOD, element, colorModel['colorMethod']);

    var binMethod = colorModel['binMethod'];
    if (binMethod) {
      var binElement = os.xml.appendElement(os.state.v4.LayerTag.COLOR_MODEL_BIN_METHOD, element);
      os.xml.appendElement(os.state.v4.LayerTag.BIN_FIELD, binElement, binMethod['field']);
      os.xml.appendElement(os.state.v4.LayerTag.BIN_TYPE, binElement, binMethod['type']);

      if (binMethod['width'] != null) {
        os.xml.appendElement(os.state.v4.LayerTag.BIN_WIDTH, binElement, binMethod['width']);
      }

      if (binMethod['offset'] != null) {
        os.xml.appendElement(os.state.v4.LayerTag.BIN_OFFSET, binElement, binMethod['offset']);
      }
    }

    var manColorElement = os.xml.appendElement(os.state.v4.LayerTag.COLOR_MODEL_MANUAL_COLORS, element);
    var pair;
    for (var prop in colorModel['manualColors']) {
      if (colorModel['manualColors'].hasOwnProperty(prop)) {
        pair = os.xml.appendElement(os.state.v4.LayerTag.COLOR_MODEL_PAIR, manColorElement);
        os.xml.appendElement(os.state.v4.LayerTag.COLOR_MODEL_NAME, pair, prop);
        os.xml.appendElement(os.state.v4.LayerTag.COLOR_MODEL_VALUE, pair,
            colorModel['manualColors'][prop]);
      }
    }
  }
  return element;
};


/**
 * @inheritDoc
 */
os.state.v4.BaseLayerState.prototype.remove = function(id) {};

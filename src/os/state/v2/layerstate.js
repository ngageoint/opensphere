goog.provide('os.state.v2.LayerState');
goog.provide('os.state.v2.LayerTag');

goog.require('goog.Uri.QueryData');
goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('goog.string');
goog.require('os.array');
goog.require('os.color');
goog.require('os.command.LayerAdd');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.DataManager');
goog.require('os.events.LayerConfigEvent');
goog.require('os.events.LayerConfigEventType');
goog.require('os.file');
goog.require('os.im.mapping.MappingManager');
goog.require('os.state.XMLState');
goog.require('os.string');
goog.require('os.style.label');
goog.require('os.tag');
goog.require('os.ui.data.BaseProvider');
goog.require('os.ui.util.deprecated');
goog.require('os.uri');
goog.require('os.xml');


/**
 * XML tags for layer state
 * @enum {string}
 */
os.state.v2.LayerTag = {
  BFS: 'basicFeatureStyle',
  COLOR: 'color',
  CONTRAST: 'contrast',
  DATA_PROVIDER: 'dataProvider',
  LABEL_COLUMN: 'labelColumn',
  LABEL_COLUMNS: 'labelColumns',
  LABEL: 'label',
  LABEL_COLOR: 'labelColor',
  LABEL_SIZE: 'labelSize',
  MAP_URL: 'getMapUrl',
  MAPPINGS: 'mappings',
  PARAMS: 'params',
  PROVIDER_TYPE: 'provider',
  PT_COLOR: 'pointColor',
  PT_OPACITY: 'pointOpacity',
  PT_SIZE: 'pointSize',
  TITLE: 'title',
  SHOW_LABELS: 'showLabels',
  STYLES: 'styles',
  TAGS: 'tags',
  REFRESH_RATE: 'refreshRate',
  // support both opacity and alpha
  OPACITY: 'opacity',
  ALPHA: 'alpha'
};



/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v2.LayerState = function() {
  os.state.v2.LayerState.base(this, 'constructor');
  this.description = 'Saves the current layers';
  this.rootAttrs = {
    'type': 'data'
  };
  this.rootName = 'layers';
  this.title = 'Layers';

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.logger = os.state.v2.LayerState.LOGGER_;
};
goog.inherits(os.state.v2.LayerState, os.state.XMLState);


/**
 * LoggerparserConfig
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v2.LayerState.LOGGER_ = goog.log.getLogger('os.state.v2.LayerState');


/**
 * Checks if a layer was loaded from local data
 *
 * @param {Object.<string, *>} layerOptions The layer options
 * @return {boolean} If the layer contains local data
 * @protected
 */
os.state.v2.LayerState.prototype.hasLocalData = function(layerOptions) {
  return os.file.isLocal(/** @type {string|undefined} */ (layerOptions['url'])) ||
      os.file.isLocal(/** @type {string|undefined} */ (layerOptions['url2'])) ||
      layerOptions['originalUrl'] != null || layerOptions['originalUrl2'] != null;
};


/**
 * Checks if the provided layer is valid for addition to the state file
 *
 * @param {os.layer.ILayer} layer The layer
 * @return {boolean} If the layer should be added
 * @protected
 */
os.state.v2.LayerState.prototype.isValid = function(layer) {
  try {
    // skip the layer if it doesn't have options to persist, doesn't have a type, or is a one-off (loadOnce) layer
    var layerOptions = layer.getLayerOptions();
    if (!layerOptions || !layerOptions['type'] || layerOptions['loadOnce']) {
      return false;
    }

    // skip base maps, static layers, and reference layers
    var type = layerOptions['type'].toLowerCase();
    if (type === 'basemap' || type === 'static' || type === 'ref') {
      return false;
    }

    // skip local data (these are handled separately)
    return !this.hasLocalData(layerOptions);
  } catch (e) {
    // may not be a os.layer.ILayer... so don't persist it
  }

  return false;
};


/**
 * @inheritDoc
 */
os.state.v2.LayerState.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v2.LayerState.LOGGER_, 'Unable to load state content!');
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
    goog.log.error(os.state.v2.LayerState.LOGGER_, 'Error loading layer in state ' + id, e);
  }
};


/**
 * @inheritDoc
 */
os.state.v2.LayerState.prototype.remove = function(id) {
  var layers = os.MapContainer.getInstance().getLayers();
  var i = layers.length;

  while (i--) {
    var layer = layers[i];
    if (layer) {
      try {
        var layerId = /** @type {os.layer.ILayer} */ (layer).getId();
        if (layerId && goog.string.startsWith(layerId, id)) {
          os.MapContainer.getInstance().removeLayer(layer);
        }
      } catch (e) {
        // probably not actually a os.layer.ILayer - wtb implements in JS, pst
      }
    }
  }
};


/**
 * @inheritDoc
 */
os.state.v2.LayerState.prototype.saveInternal = function(options, rootObj) {
  try {
    var layers = os.MapContainer.getInstance().getLayers();
    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = /** @type {os.layer.ILayer} */ (layers[i]);
      if (this.isValid(layer)) {
        var layerEl = this.layerToXML(layer, options, undefined, {'title': layer.getTitle()});
        if (layerEl) {
          rootObj.appendChild(layerEl);
        }
      }
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
 * @param {Object.<string, *>=} opt_layerConfigOverride force these options to be used in the xml.
 * @return {?Element} The XML element
 * @protected
 */
os.state.v2.LayerState.prototype.layerToXML = function(layer, options, opt_exclusions, opt_layerConfigOverride) {
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
  if (opt_layerConfigOverride != null) {
    Object.assign(layerConfig, opt_layerConfigOverride);
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

  var type = typeof layerConfig['type'] === 'string' ? layerConfig['type'].toLowerCase() : '';

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
  var bfs = type != 'wms' ? os.xml.createElement(os.state.v2.LayerTag.BFS, options.doc) : null;

  for (var key in layerConfig) {
    var value = layerConfig[key];
    if (value != null) {
      switch (key) {
        case 'params':
          var paramsEl = os.xml.appendElement(os.state.v2.LayerTag.PARAMS, layerEl);
          var qd = typeof value === 'string' ? new goog.Uri.QueryData(value) :
          /** @type {goog.Uri.QueryData} */ (value);
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
          os.xml.appendElement(os.state.v2.LayerTag.DATA_PROVIDER, layerEl, value);
          break;
        case 'baseType':
          // include the provider tag
          os.xml.appendElement(os.state.v2.LayerTag.PROVIDER_TYPE, layerEl, value);
          this.defaultConfigToXML(key, value, layerEl);
          break;
        case os.style.StyleField.COLOR:
          if (bfs) {
            // hex string without the leading hash
            var pointColor = os.color.toHexString(/** @type {string} */ (value)).slice(1);
            os.xml.appendElement(os.state.v2.LayerTag.PT_COLOR, bfs, pointColor);
          } else {
            // tile layer
            this.defaultConfigToXML(key, value, layerEl);
          }
          break;
        case 'contrast':
          if (typeof value === 'number' && !isNaN(value)) {
            // Cesium contrast: 0 is gray, 1 is normal, > 1 increases contrast. we allow from 0 to 2.
            // 2D contrast: -100 is gray, 0 is normal, 100 is max.
            os.xml.appendElement(os.state.v2.LayerTag.CONTRAST, layerEl, Math.round((value - 1) * 100));
          }
          break;
        case 'alpha':
        case 'opacity':
          if (bfs) {
            value = value != null ? Number(value) : os.style.DEFAULT_ALPHA;

            var opacity = Math.round(value * 255);
            os.xml.appendElement(os.state.v2.LayerTag.PT_OPACITY, bfs, opacity);
          } else {
            // write tile layer opacity/alpha as alpha
            value = value != null ? Number(value) : os.style.DEFAULT_ALPHA;
            os.xml.appendElement(os.state.v2.LayerTag.ALPHA, layerEl, value);
          }
          break;
        case 'size':
          if (bfs) {
            value = value != null ? Math.floor(value) : os.style.DEFAULT_FEATURE_SIZE;

            var pointSize = value * 2;
            os.xml.appendElement(os.state.v2.LayerTag.PT_SIZE, bfs, pointSize);
          }
          break;
        case 'styles':
          var stylesEl = os.xml.appendElement(os.state.v2.LayerTag.STYLES, layerEl);
          var styles = /** @type {Array} */ (value);
          var legends = /** @type {Array} */ (layerConfig['legends']);

          for (var i = 0, n = styles.length; i < n; i++) {
            if (styles[i]['data']) {
              var styleEl = os.xml.appendElement('style', stylesEl);
              os.xml.appendElement('name', styleEl, styles[i]['data']);
              os.xml.appendElement('title', styleEl, styles[i]['label']);

              if (legends && legends.length == styles.length) {
                os.xml.appendElement('legend', styleEl, (legends[i] || ''));
              }
            }
          }
          break;
        case os.style.StyleField.LABELS:
          var labelColumn = /** @type {Array<os.style.label.LabelConfig>} */ (value);
          if (bfs && labelColumn.length > 0 &&
              !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(labelColumn[0]['column']))) {
            // Support legacy
            os.xml.appendElement(os.state.v2.LayerTag.LABEL_COLUMN, bfs, labelColumn[0]['column']);

            // New Multi column
            var labelColumns = os.xml.appendElement(os.state.v2.LayerTag.LABEL_COLUMNS, bfs);
            os.array.forEach(labelColumn, function(label) {
              os.xml.appendElement(os.state.v2.LayerTag.LABEL, labelColumns, undefined, {
                'column': label['column'],
                'showColumn': label['showColumn']
              });
            });
          }
          break;
        case os.style.StyleField.LABEL_COLOR:
          if (bfs && typeof value === 'string' && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(value))) {
            var color = os.color.toHexString(value).replace(/^#/, '');
            os.xml.appendElement(os.state.v2.LayerTag.LABEL_COLOR, bfs, color);
          }
          break;
        case os.style.StyleField.LABEL_SIZE:
          if (bfs && typeof value === 'number') {
            os.xml.appendElement(os.state.v2.LayerTag.LABEL_SIZE, bfs, value);
          }
          break;
        case os.style.StyleField.SHOW_LABELS:
          os.xml.appendElement(os.state.v2.LayerTag.SHOW_LABELS, layerEl, value);
          break;
        case 'mappings':
          var mappings = /** @type {Array.<os.im.mapping.IMapping>} */ (layerConfig['mappings']);
          if (mappings && mappings.length > 0) {
            var mappingsEl = os.xml.appendElement(os.state.v2.LayerTag.MAPPINGS, layerEl);
            var mappingsConfig = os.im.mapping.MappingManager.getInstance().persistMappings(mappings);
            for (var mappingKey in mappingsConfig) {
              var serializedConfig = JSON.stringify(mappingsConfig[mappingKey]);
              os.xml.appendElement('mapping.' + mappingKey, mappingsEl, serializedConfig);
            }
          }
          break;
        case 'refreshInterval':
          os.xml.appendElement(os.state.v2.LayerTag.REFRESH_RATE, layerEl, value);
          break;
        default:
          this.defaultConfigToXML(key, value, layerEl);
          break;
      }
    }
  }

  if (bfs && bfs.childElementCount > 0) {
    layerEl.appendChild(bfs);
  }

  if (type == 'wms' && url) {
    os.xml.appendElement(os.state.v2.LayerTag.MAP_URL, layerEl, url);
  }

  goog.dom.xml.setAttributes(layerEl, {
    'type': type
  });

  return layerEl;
};


/**
 * Default handler for unknown layer configuration keys.
 *
 * @param {string} key The key
 * @param {*} value The value
 * @param {!Element} layerEl The layer element
 * @protected
 */
os.state.v2.LayerState.prototype.defaultConfigToXML = function(key, value, layerEl) {
  var node = null;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    if (typeof value === 'string' && key.search(/color/i) > -1 && key != 'colorize' && os.color.isColorString(value)) {
      try {
        // output hex
        value = os.color.toHexString(value).replace(/^#/, '0x');
      } catch (e) {
        // default to white
        value = '0xffffff';
      }
    } else if (typeof value === 'string' && goog.string.startsWith(value, 'url')) {
      // make sure url's are qualified
      value = os.uri.addBase(value);
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
os.state.v2.LayerState.prototype.defaultXmlToConfig = function(key, el) {
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
os.state.v2.LayerState.prototype.analyzeOptions = function(options, id) {
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
os.state.v2.LayerState.prototype.xmlToOptions = function(node) {
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

        switch (name) {
          case os.state.v2.LayerTag.BFS:
            var styleList = goog.dom.getChildren(child);
            for (var j = 0, m = styleList.length; j < m; j++) {
              var styleName = styleList[j].localName;
              var styleVal = styleList[j].textContent;

              switch (styleName) {
                case os.state.v2.LayerTag.PT_COLOR:
                  try {
                    styleVal = os.color.padHexColor(styleVal, '#');
                    options['color'] = os.style.toRgbaString(styleVal);
                  } catch (e) {
                    options['color'] = os.style.DEFAULT_LAYER_COLOR;
                  }
                  break;
                case os.state.v2.LayerTag.PT_OPACITY:
                  options['opacity'] = goog.string.isNumeric(styleVal) ? Number(styleVal) / 255 :
                    os.style.DEFAULT_ALPHA;
                  break;
                case os.state.v2.LayerTag.PT_SIZE:
                  options['size'] = goog.string.isNumeric(styleVal) ? Number(styleVal) / 2 :
                    os.style.DEFAULT_FEATURE_SIZE;
                  break;
                case os.state.v2.LayerTag.LABEL_COLUMN:
                  var column = typeof styleVal === 'string' ? goog.string.trim(styleVal) : '';
                  // Is this the default?
                  if (options[os.style.StyleField.LABELS] == undefined) {
                    options[os.style.StyleField.LABELS] = [os.style.label.cloneConfig()];
                    options[os.style.StyleField.LABELS][0]['column'] = column;
                    options[os.style.StyleField.LABELS][0]['showColumn'] = false;
                  }
                  var source = this.getSource(node);
                  if (source && source.indexOf('MIST3D') > -1) {
                    options[os.style.StyleField.SHOW_LABELS] =
                        !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(column));
                  }
                  break;
                case os.state.v2.LayerTag.LABEL_COLUMNS:
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
                case os.state.v2.LayerTag.LABEL_COLOR:
                  try {
                    styleVal = os.color.padHexColor(styleVal, '#');
                    options[os.style.StyleField.LABEL_COLOR] = os.style.toRgbaString(styleVal);
                  } catch (e) {
                    options[os.style.StyleField.LABEL_COLOR] = '';
                  }
                  break;
                case os.state.v2.LayerTag.LABEL_SIZE:
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
          case os.state.v2.LayerTag.CONTRAST:
            // 2D exports contrast from -100 to 100, 3D doesn't have contrast, and Cesium treats 1.0 as normal.
            var contrast = Number(child.textContent);
            var adjustedContrast = (contrast / 100) + 1;
            options['contrast'] = !isNaN(contrast) ? goog.math.clamp(adjustedContrast, 0, 2) : 1.0;
            break;
          case os.state.v2.LayerTag.DATA_PROVIDER:
            options['provider'] = child.textContent;
            break;
          case os.state.v2.LayerTag.MAP_URL:
            // trim trailing ? from the url
            options['url'] = child.textContent.replace(/[?]+$/, '');
            break;
          case os.state.v2.LayerTag.PARAMS:
            var qd = options['params'] || new goog.Uri.QueryData();
            var pc = goog.dom.getChildren(child);
            for (j = 0, m = pc.length; j < m; j++) {
              qd.set(pc[j].localName, pc[j].textContent);
            }

            options['params'] = qd;
            break;
          case os.state.v2.LayerTag.STYLES:
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
          case os.state.v2.LayerTag.TAGS:
            options['tags'] = os.tag.tagsFromXML(child);
            break;
          case os.state.v2.LayerTag.TITLE:
            // 2D/3D add 'Tiles' and 'Features' to the exported layer titles, but we add that in a separate directive
            options['title'] = child.textContent.replace(/\s*(Tiles|Features)\s*$/, '');
            break;
          case os.state.v2.LayerTag.SHOW_LABELS:
            options[os.style.StyleField.SHOW_LABELS] = child.textContent == 'true';
            break;
          case os.state.v2.LayerTag.MAPPINGS:
            var mappings = {};
            var mappingEls = goog.dom.getChildren(child);
            for (var j = 0, m = mappingEls.length; j < m; j++) {
              var mappingElement = mappingEls[j];
              mappings[mappingElement.localName] = JSON.parse(mappingElement.textContent);
            }

            options['mappings'] = os.im.mapping.MappingManager.getInstance().restoreMappings(mappings);
            break;
          case os.state.v2.LayerTag.REFRESH_RATE:
            options['refreshInterval'] = this.defaultXmlToConfig(name, child);
            break;
          default:
            options[name] = this.defaultXmlToConfig(name, child);
            break;
        }
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

goog.declareModuleId('os.state.v2.LayerState');

import {forEach} from '../../array/array.js';
import {isColorString, padHexColor, toHexString} from '../../color.js';
import LayerAdd from '../../command/layeraddcmd.js';
import DataManager from '../../data/datamanager.js';
import {isLocal} from '../../file/index.js';
import MappingManager from '../../im/mapping/mappingmanager.js';
import LayerConfigManager from '../../layer/config/layerconfigmanager.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {isObject} from '../../object/object.js';
import {isBoolean, isFloat, isHex} from '../../string/string.js';
import * as osLabel from '../../style/label.js';
import * as osStyle from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import {tagsFromXML} from '../../tag/tag.js';
import {isLayerDeprecated, showDeprecatedWarning} from '../../ui/util/deprecated.js';
import {addBase} from '../../uri/uri.js';
import {appendElement, createElement} from '../../xml.js';
import AbstractState from '../abstractstate.js';
import {getStateManager} from '../stateinstance.js';
import XMLState from '../xmlstate.js';
import LayerTag from './layertag.js';

const QueryData = goog.require('goog.Uri.QueryData');
const {getChildren} = goog.require('goog.dom');
const {setAttributes} = goog.require('goog.dom.xml');
const log = goog.require('goog.log');
const {clamp} = goog.require('goog.math');
const {isEmptyOrWhitespace, isNumeric, makeSafe} = goog.require('goog.string');

const Logger = goog.requireType('goog.log.Logger');
const {default: IPersistable} = goog.requireType('os.IPersistable');
const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: XMLStateOptions} = goog.requireType('os.state.XMLStateOptions');
const {LabelConfig} = goog.requireType('os.style.label');


/**
 */
export default class LayerState extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.description = 'Saves the current layers';
    this.rootAttrs = {
      'type': 'data'
    };
    this.rootName = 'layers';
    this.title = 'Layers';

    /**
     * @type {Logger}
     * @protected
     */
    this.logger = logger;
  }

  /**
   * Checks if a layer was loaded from local data
   *
   * @param {Object<string, *>} layerOptions The layer options
   * @return {boolean} If the layer contains local data
   * @protected
   */
  hasLocalData(layerOptions) {
    return isLocal(/** @type {string|undefined} */ (layerOptions['url'])) ||
        isLocal(/** @type {string|undefined} */ (layerOptions['url2'])) ||
        layerOptions['originalUrl'] != null || layerOptions['originalUrl2'] != null;
  }

  /**
   * Checks if the provided layer is valid for addition to the state file
   *
   * @param {ILayer} layer The layer
   * @return {boolean} If the layer should be added
   * @protected
   */
  isValid(layer) {
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
      // may not be a ILayer... so don't persist it
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  load(obj, id) {
    obj = XMLState.ensureXML(obj);

    if (!(obj instanceof Element)) {
      log.error(logger, 'Unable to load state content!');
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
          var cmd = new LayerAdd(options[i]);
          cmd.execute();
          cmd.dispose();
        }
      }
    } catch (e) {
      // que pasa, hombre?
      log.error(logger, 'Error loading layer in state ' + id, e);
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    var layers = getMapContainer().getLayers();
    var i = layers.length;

    while (i--) {
      var layer = layers[i];
      if (layer) {
        try {
          var layerId = /** @type {ILayer} */ (layer).getId();
          if (layerId && layerId.startsWith(id)) {
            getMapContainer().removeLayer(layer);
          }
        } catch (e) {
          // probably not actually a ILayer - wtb implements in JS, pst
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var layers = getMapContainer().getLayers();
      for (var i = 0, n = layers.length; i < n; i++) {
        var layer = /** @type {ILayer} */ (layers[i]);
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
  }

  /**
   * Converts a {@link ILayer} to an XML element
   * Default tag exclusions: locked, featureType, type
   *
   * @param {ILayer} layer The layer
   * @param {XMLStateOptions} options The save options
   * @param {string|Array<string>=} opt_exclusions exclude these additional tags from the output.
   * @param {Object<string, *>=} opt_layerConfigOverride force these options to be used in the xml.
   * @return {?Element} The XML element
   * @protected
   */
  layerToXML(layer, options, opt_exclusions, opt_layerConfigOverride) {
    // setting locked=true will just guarantee empty layers on the other end
    // any layer that needs featureType should be capable of grabbing it on load
    // the type will be set as an attribute, so don't add it as an element
    var tagExclusions = ['locked', 'featureType', 'type'];

    var layerOptions = layer.getLayerOptions();
    if (!layerOptions) {
      return null;
    }

    // write the persisted layer on top of the cloned options so we have (most) everything in one place
    var layerConfig = Object.assign({}, layer.getLayerOptions());
    if (opt_layerConfigOverride != null) {
      Object.assign(layerConfig, opt_layerConfigOverride);
    }

    layer.persist(layerConfig);

    var url = /** @type {string|undefined} */ (layerConfig['url']);
    if (typeof url === 'string' && !isLocal(url)) {
      // writing to xml, do not encode URLs, we are looking for specific values like the {X}/{Y}/{Z} layer
      url = layerConfig['url'] = decodeURIComponent(addBase(url));
    }

    // make sure a single <url> tag is included for apps that do not support multiple
    var urls = /** @type {Array<string>|undefined} */ (layerConfig['urls']);
    if (urls && urls.length > 0 && !url) {
      layerConfig['url'] = urls[0];
    }

    var type = typeof layerConfig['type'] === 'string' ? layerConfig['type'].toLowerCase() : '';

    if (opt_exclusions != null) {
      var exclusions = Array.isArray(opt_exclusions) ? opt_exclusions : [opt_exclusions];
      tagExclusions = tagExclusions.concat(exclusions);
    }
    for (var i = 0, n = tagExclusions.length; i < n; i++) {
      if (layerConfig[tagExclusions[i]] != null) {
        delete layerConfig[tagExclusions[i]];
      }
    }

    var layerEl = createElement('layer', options.doc);
    var bfs = type != 'wms' ? createElement(LayerTag.BFS, options.doc) : null;

    for (var key in layerConfig) {
      var value = layerConfig[key];
      if (value != null) {
        switch (key) {
          case 'params':
            var paramsEl = appendElement(LayerTag.PARAMS, layerEl);
            var qd = typeof value === 'string' ? new QueryData(value) :
            /** @type {QueryData} */ (value);
            var qdKeys = qd.getKeys();
            for (var i = 0, n = qdKeys.length; i < n; i++) {
              var qdKey = qdKeys[i];
              var qdValue = String(qd.get(qdKey));
              if (type == 'wms') {
                qdKey = qdKey.toUpperCase();
              } else if (type == 'wfs') {
                qdKey = qdKey.toLowerCase();
              }

              appendElement(qdKey, paramsEl, qdValue);
            }
            break;
          case 'provider':
            appendElement(LayerTag.DATA_PROVIDER, layerEl, value);
            break;
          case 'baseType':
            // include the provider tag
            appendElement(LayerTag.PROVIDER_TYPE, layerEl, value);
            this.defaultConfigToXML(key, value, layerEl);
            break;
          case StyleField.COLOR:
            if (bfs) {
              // hex string without the leading hash
              var pointColor = toHexString(/** @type {string} */ (value)).slice(1);
              appendElement(LayerTag.PT_COLOR, bfs, pointColor);
            } else {
              // tile layer
              this.defaultConfigToXML(key, value, layerEl);
            }
            break;
          case 'contrast':
            if (typeof value === 'number' && !isNaN(value)) {
              // Cesium contrast: 0 is gray, 1 is normal, > 1 increases contrast. we allow from 0 to 2.
              // 2D contrast: -100 is gray, 0 is normal, 100 is max.
              appendElement(LayerTag.CONTRAST, layerEl, Math.round((value - 1) * 100));
            }
            break;
          case 'alpha':
          case 'opacity':
            if (bfs) {
              value = value != null ? Number(value) : osStyle.DEFAULT_ALPHA;

              var opacity = Math.round(value * 255);
              appendElement(LayerTag.PT_OPACITY, bfs, opacity);
            } else {
              // write tile layer opacity/alpha as alpha
              value = value != null ? Number(value) : osStyle.DEFAULT_ALPHA;
              appendElement(LayerTag.ALPHA, layerEl, value);
            }
            break;
          case 'size':
            if (bfs) {
              value = value != null ? Math.floor(value) : osStyle.DEFAULT_FEATURE_SIZE;

              var pointSize = value * 2;
              appendElement(LayerTag.PT_SIZE, bfs, pointSize);
            }
            break;
          case 'styles':
            var stylesEl = appendElement(LayerTag.STYLES, layerEl);
            var styles = /** @type {Array} */ (value);
            var legends = /** @type {Array} */ (layerConfig['legends']);

            for (var i = 0, n = styles.length; i < n; i++) {
              if (styles[i]['data']) {
                var styleEl = appendElement('style', stylesEl);
                appendElement('name', styleEl, styles[i]['data']);
                appendElement('title', styleEl, styles[i]['label']);

                if (legends && legends.length == styles.length) {
                  appendElement('legend', styleEl, (legends[i] || ''));
                }
              }
            }
            break;
          case StyleField.LABELS:
            var labelColumn = /** @type {Array<LabelConfig>} */ (value);
            if (bfs && labelColumn.length > 0 &&
                !isEmptyOrWhitespace(makeSafe(labelColumn[0]['column']))) {
              // Support legacy
              appendElement(LayerTag.LABEL_COLUMN, bfs, labelColumn[0]['column']);

              // New Multi column
              var labelColumns = appendElement(LayerTag.LABEL_COLUMNS, bfs);
              labelColumn.forEach(function(label) {
                appendElement(LayerTag.LABEL, labelColumns, undefined, {
                  'column': label['column'],
                  'showColumn': label['showColumn']
                });
              });
            }
            break;
          case StyleField.LABEL_COLOR:
            if (bfs && typeof value === 'string' && !isEmptyOrWhitespace(makeSafe(value))) {
              var color = toHexString(value).replace(/^#/, '');
              appendElement(LayerTag.LABEL_COLOR, bfs, color);
            }
            break;
          case StyleField.LABEL_SIZE:
            if (bfs && typeof value === 'number') {
              appendElement(LayerTag.LABEL_SIZE, bfs, value);
            }
            break;
          case StyleField.SHOW_LABELS:
            appendElement(LayerTag.SHOW_LABELS, layerEl, value);
            break;
          case 'mappings':
            var mappings = /** @type {Array<IMapping>} */ (layerConfig['mappings']);
            if (mappings && mappings.length > 0) {
              var mappingsEl = appendElement(LayerTag.MAPPINGS, layerEl);
              var mappingsConfig = MappingManager.getInstance().persistMappings(mappings);
              for (var mappingKey in mappingsConfig) {
                var serializedConfig = JSON.stringify(mappingsConfig[mappingKey]);
                appendElement('mapping.' + mappingKey, mappingsEl, serializedConfig);
              }
            }
            break;
          case 'refreshInterval':
            appendElement(LayerTag.REFRESH_RATE, layerEl, value);
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
      appendElement(LayerTag.MAP_URL, layerEl, url);
    }

    setAttributes(layerEl, {
      'type': type
    });

    return layerEl;
  }

  /**
   * Default handler for unknown layer configuration keys.
   *
   * @param {string} key The key
   * @param {*} value The value
   * @param {!Element} layerEl The layer element
   * @protected
   */
  defaultConfigToXML(key, value, layerEl) {
    var node = null;

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      if (typeof value === 'string' && key.search(/color/i) > -1 && key != 'colorize' && isColorString(value)) {
        try {
          // output hex
          value = toHexString(value).replace(/^#/, '0x');
        } catch (e) {
          // default to white
          value = '0xffffff';
        }
      } else if (typeof value === 'string' && value.startsWith('url')) {
        // make sure url's are qualified
        value = addBase(value);
      }

      appendElement(key, layerEl, value);
    } else if (Array.isArray(value)) {
      var arr = /** @type {Array} */ (value);
      var childName = key.endsWith('s') ? key.substring(0, key.length - 1) : key;
      node = appendElement(key, layerEl);

      for (var i = 0, n = arr.length; i < n; i++) {
        this.defaultConfigToXML(childName, arr[i], node);
      }
    } else {
      // classes
      var persistable = getStateManager().isPersistable(key);
      if (persistable) {
        // only try this if the key is registered with the state manager
        try {
          var obj = /** @type {IPersistable} */ (value).persist();
          appendElement(key, layerEl, JSON.stringify(obj));
        } catch (e) {
          // don't persist it
        }
      } else if (isObject(value) && typeof value !== 'function') {
        // plain objects
        // create the node for this key and recurse
        node = appendElement(key, layerEl);

        for (var field in value) {
          this.defaultConfigToXML(field, value[field], node);
        }
      }
    }
  }

  /**
   * Default handler for unknown XML nodes.
   *
   * @param {string} key The key
   * @param {Element} el The element
   * @return {*} The config value
   * @protected
   */
  defaultXmlToConfig(key, el) {
    var result = null;
    var persistObj = getStateManager().getPersistable(key);
    var value = el.textContent;
    var children = getChildren(el);

    if (persistObj) {
      var jsonObj = /** @type {!Object} */ (JSON.parse(value));
      persistObj.restore(jsonObj);
      result = persistObj;
    } else if (key.search(/color/i) > -1 && key != 'colorize' && children.length == 0 &&
        isColorString(value)) {
      result = padHexColor(value, '0x');
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
    } else if (isFloat(value)) {
      // can't use isNumeric() for this check because it doesn't support floats or negative integers
      result = parseFloat(value);
    } else if (isHex(value)) {
      result = parseInt(value, 16);
    } else if (isBoolean(value)) {
      result = value.toLowerCase() == 'true';
    } else {
      result = value;
    }

    return result;
  }

  /**
   * Analyzes all layer options objects in the state file
   *
   * @param {Array<Object<string, *>>} options The array of layer options objects
   * @param {string} id The state file id
   * @protected
   */
  analyzeOptions(options, id) {
    for (var i = 0, n = options.length; i < n; i++) {
      var layerOptions = options[i];
      layerOptions['id'] = AbstractState.createId(id, /** @type {string} */ (layerOptions['id']));
      layerOptions['exportEnabled'] = true;

      var descriptor = DataManager.getInstance().getDescriptor(id.substring(0, id.length - 1));
      if (descriptor) {
        layerOptions['provider'] = descriptor.getTitle();
      }

      var typeName = layerOptions['layer'];
      if (!typeName) {
        var params = layerOptions['params'];
        if (params) {
          var paramsTypeName = params.get('typename');
          if (Array.isArray(paramsTypeName)) {
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

      if (typeName && isLayerDeprecated(/** @type {string} */ (typeName))) {
        showDeprecatedWarning(/** @type {string} */ (layerOptions['title']));
      }
    }
  }

  /**
   * Converts an XML node into layer options
   *
   * @param {Element} node The XML element representing the layer
   * @return {Object<string, *>} The layer options
   * @protected
   */
  xmlToOptions(node) {
    if (node) {
      var children = getChildren(node);
      if (children) {
        var type = String(node.getAttribute('type'));
        var options = LayerConfigManager.getInstance().getDefaultLayerConfig(type);

        for (var i = 0, n = children.length; i < n; i++) {
          var child = children[i];
          var name = child.localName;

          if (name.includes('FileSource')) {
            // ignore this layer
            return null;
          }

          switch (name) {
            case LayerTag.BFS:
              var styleList = getChildren(child);
              for (var j = 0, m = styleList.length; j < m; j++) {
                var styleName = styleList[j].localName;
                var styleVal = styleList[j].textContent;

                switch (styleName) {
                  case LayerTag.PT_COLOR:
                    try {
                      styleVal = padHexColor(styleVal, '#');
                      options['color'] = osStyle.toRgbaString(styleVal);
                    } catch (e) {
                      options['color'] = osStyle.DEFAULT_LAYER_COLOR;
                    }
                    break;
                  case LayerTag.PT_OPACITY:
                    options['opacity'] = isNumeric(styleVal) ? Number(styleVal) / 255 :
                      osStyle.DEFAULT_ALPHA;
                    break;
                  case LayerTag.PT_SIZE:
                    options['size'] = isNumeric(styleVal) ? Number(styleVal) / 2 :
                      osStyle.DEFAULT_FEATURE_SIZE;
                    break;
                  case LayerTag.LABEL_COLUMN:
                    var column = typeof styleVal === 'string' ? styleVal.trim() : '';
                    // Is this the default?
                    if (options[StyleField.LABELS] == undefined) {
                      options[StyleField.LABELS] = [osLabel.cloneConfig()];
                      options[StyleField.LABELS][0]['column'] = column;
                      options[StyleField.LABELS][0]['showColumn'] = false;
                    }
                    var source = this.getSource(node);
                    if (source && source.indexOf('MIST3D') > -1) {
                      options[StyleField.SHOW_LABELS] =
                          !isEmptyOrWhitespace(makeSafe(column));
                    }
                    break;
                  case LayerTag.LABEL_COLUMNS:
                    var labels = [];
                    var labelColumns = getChildren(styleList[j]);
                    forEach(labelColumns, function(label) {
                      labels.push({
                        'column': label.getAttribute('column'),
                        'showColumn': label.getAttribute('showColumn') == 'true' ? true : false
                      });
                    });
                    options[StyleField.LABELS] = labels;
                    break;
                  case LayerTag.LABEL_COLOR:
                    try {
                      styleVal = padHexColor(styleVal, '#');
                      options[StyleField.LABEL_COLOR] = osStyle.toRgbaString(styleVal);
                    } catch (e) {
                      options[StyleField.LABEL_COLOR] = '';
                    }
                    break;
                  case LayerTag.LABEL_SIZE:
                    // make sure the label size is between allowed values, and use the default value if none specified
                    var styleSize = isNumeric(styleVal) ? Number(styleVal) : 0;
                    var size = styleSize > 0 ?
                      clamp(styleSize, osLabel.MIN_SIZE, osLabel.MAX_SIZE) : osLabel.DEFAULT_SIZE;
                    options[StyleField.LABEL_SIZE] = size;
                    break;
                  default:
                    break;
                }
              }
              break;
            case LayerTag.CONTRAST:
              // 2D exports contrast from -100 to 100, 3D doesn't have contrast, and Cesium treats 1.0 as normal.
              var contrast = Number(child.textContent);
              var adjustedContrast = (contrast / 100) + 1;
              options['contrast'] = !isNaN(contrast) ? clamp(adjustedContrast, 0, 2) : 1.0;
              break;
            case LayerTag.DATA_PROVIDER:
              options['provider'] = child.textContent;
              break;
            case LayerTag.MAP_URL:
              // trim trailing ? from the url
              options['url'] = child.textContent.replace(/[?]+$/, '');
              break;
            case LayerTag.PARAMS:
              var qd = options['params'] || new QueryData();
              var pc = getChildren(child);
              for (j = 0, m = pc.length; j < m; j++) {
                qd.set(pc[j].localName, pc[j].textContent);
              }

              options['params'] = qd;
              break;
            case LayerTag.STYLES:
              var styles = [{'data': '', 'label': 'Default'}];
              var list = getChildren(child);

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
            case LayerTag.TAGS:
              options['tags'] = tagsFromXML(child);
              break;
            case LayerTag.TITLE:
              // 2D/3D add 'Tiles' and 'Features' to the exported layer titles, but we add that in a separate directive
              options['title'] = child.textContent.replace(/\s*(Tiles|Features)\s*$/, '');
              break;
            case LayerTag.SHOW_LABELS:
              options[StyleField.SHOW_LABELS] = child.textContent == 'true';
              break;
            case LayerTag.MAPPINGS:
              var mappings = {};
              var mappingEls = getChildren(child);
              for (var j = 0, m = mappingEls.length; j < m; j++) {
                var mappingElement = mappingEls[j];
                mappings[mappingElement.localName] = JSON.parse(mappingElement.textContent);
              }

              options['mappings'] = MappingManager.getInstance().restoreMappings(mappings);
              break;
            case LayerTag.REFRESH_RATE:
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
          var lcm = LayerConfigManager.getInstance();
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
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v2.LayerState');

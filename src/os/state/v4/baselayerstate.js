goog.declareModuleId('os.state.v4.BaseLayerState');

import {readDecimal, readString} from 'ol/src/format/xsd.js';
import {transformExtent} from 'ol/src/proj.js';

import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import {forEach} from '../../array/array.js';
import {isColorString, padHexColor, toRgbArray, toServerString} from '../../color.js';
import LayerAdd from '../../command/layeraddcmd.js';
import DataManager from '../../data/datamanager.js';
import {isLocal} from '../../file/index.js';
import MappingManager from '../../im/mapping/mappingmanager.js';
import LayerConfigManager from '../../layer/config/layerconfigmanager.js';
import * as osMap from '../../map/map.js';
import {paramsToQueryData} from '../../net/net.js';
import {EPSG4326} from '../../proj/proj.js';
import VectorSource from '../../source/vectorsource.js';
import {isBoolean, isFloat, isHex} from '../../string/string.js';
import * as osLabel from '../../style/label.js';
import * as osStyle from '../../style/style.js';
import StyleField from '../../style/stylefield.js';
import {tagsFromXML} from '../../tag/tag.js';
import {isLayerDeprecated, showDeprecatedWarning} from '../../ui/util/deprecated.js';
import {addBase} from '../../uri/uri.js';
import {appendElement, appendElementNS, createElement, getElementValueOrDefault} from '../../xml.js';
import AbstractState from '../abstractstate.js';
import {isLayerRemote} from '../state.js';
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
 * XML tags for icons in the layer state.
 * @enum {string}
 */
const IconTag = {
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
 */
export default class BaseLayerState extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.description = 'Saves the current layers';
    this.rootName = 'dataLayers';
    this.title = 'Data Layers';
    // TODO:STATE -> Is type still needed, given we have mapLayers / localData
    this.rootAttrs = {
      'type': 'data'
    };

    /**
     * @type {Logger}
     * @protected
     */
    this.logger = logger;

    /**
     * @type {!Array<!ol.layer.Layer>}
     */
    this.layers = [];
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

      // skip resources that are not remote (these are handled separately)
      return isLayerRemote(layerOptions);
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
   * returns the layer type
   *
   * @param {ILayer} layer
   * @return {string}
   * @private
   */
  getLayerType_(layer) {
    if (layer.getLayerOptions()) {
      var type = layer.getLayerOptions()['type'];
      return isEmptyOrWhitespace(makeSafe(type)) ?
        '' : /** @type {string} */ (layer.getLayerOptions()['type']);
    }
    return '';
  }

  /**
   * returns the layers
   *
   * @return {!Array<!ol.layer.Layer>}
   */
  getLayers() {
    return this.layers;
  }

  /**
   * @param {!Array<!ol.layer.Layer>} layers
   */
  setLayers(layers) {
    this.layers = layers;
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var layers = this.getLayers();
      var hasLocked = false;
      var skippedLayers = [];

      for (var i = 0, n = layers.length; i < n; i++) {
        var layer = /** @type {ILayer} */ (layers[i]);
        if (this.isValid(layer)) {
          var layerEl = this.layerToXML(layer, options, undefined, {'title': layer.getTitle()});
          if (layerEl) {
            rootObj.appendChild(layerEl);
          }

          var source = /** @type {ol.layer.Layer} */ (layer).getSource();
          if (!hasLocked && source instanceof VectorSource) {
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
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
      }

      if (hasLocked) {
        var msg = 'You have at least one of your layers locked. Locked layers are included in state files, ' +
            'but they <b>will not be locked</b> when the state is loaded. The state file may look different ' +
            'from what you currently see!';
        AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
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
   * @param {Object<string, *>=} opt_layerConfig force these options to be used in the xml.
   * @return {?Element} The XML element
   * @protected
   */
  layerToXML(layer, options, opt_exclusions, opt_layerConfig) {
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
    if (opt_layerConfig != null) {
      Object.assign(layerConfig, opt_layerConfig);
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

    var type = this.getLayerType_(layer);

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
        this.configKeyToXML(layerConfig, type, key, value, bfs, layerEl);
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
   * @param {!Object<string, *>} layerConfig The layer config object
   * @param {!string} type The layer type
   * @param {!string} key The key to write
   * @param {*} value The value to write
   * @param {?Element} bfs The basicFeatureStyle element
   * @param {!Element} layerEl The layer element
   * @protected
   */
  configKeyToXML(layerConfig, type, key, value, bfs, layerEl) {
    switch (key) {
      case 'params':
        var paramsEl = appendElement(LayerTag.PARAMS, layerEl);
        var qd = paramsToQueryData(/** @type {string|QueryData|Object} */ (value));
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
          var pointColor = toServerString(/** @type {string} */ (value));
          appendElement(LayerTag.PT_COLOR, bfs, pointColor);
        } else {
          // tile layer
          this.defaultConfigToXML(key, value, layerEl);
        }
        break;
      case StyleField.FILL_COLOR:
        if (bfs) {
          // hex string without the leading hash
          var xmlColor = toServerString(/** @type {string} */ (value));
          appendElement(LayerTag.FILL_COLOR, bfs, xmlColor);

          // extract opacity from the color string
          var colorArr = toRgbArray(/** @type {string} */ (value));
          var fillOpacity = colorArr.length == 4 ? colorArr[3] : osStyle.DEFAULT_FILL_ALPHA;
          appendElement(LayerTag.FILL_OPACITY, bfs, fillOpacity);
        } else {
          // tile layer
          this.defaultConfigToXML(key, value, layerEl);
        }
        break;
      case 'contrast':
        if (typeof value === 'number' && !isNaN(value)) {
          // Cesium contrast: 0 is gray, 1 is normal, > 1 increases contrast. we allow from 0 to 2.
          appendElement(LayerTag.CONTRAST, layerEl, Math.round((value - 1) * 100));
        }
        break;
      case 'alpha':
      case 'opacity':
        if (bfs) {
          value = value != null ? Number(value) : osStyle.DEFAULT_ALPHA;
          var opacity = Math.round(value * 255);
          var pointOpacityElement = bfs.querySelector(LayerTag.PT_OPACITY);
          if (pointOpacityElement) {
            pointOpacityElement.textContent = opacity;
          } else {
            appendElement(LayerTag.PT_OPACITY, bfs, opacity);
          }
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

        for (var i = 0, n = styles.length; i < n; i++) {
          if (styles[i]['data']) {
            var styleEl = appendElement('style', stylesEl);
            appendElement('name', styleEl, styles[i]['data']);
            appendElement('title', styleEl, styles[i]['label']);
          }
        }
        break;
      case StyleField.LABELS:
        var labelColumn = /** @type {Array<LabelConfig>} */ (value);
        if (bfs && labelColumn.length > 0 &&
            !isEmptyOrWhitespace(makeSafe(labelColumn[0]['column']))) {
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
          var color = toServerString(value);
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
      case StyleField.ICON:
        var iconEl = appendElement(LayerTag.ICON_STYLE, layerEl);

        // append the boilerplate values
        appendElement(IconTag.POINT_SIZE, iconEl, '4.0');
        appendElement(IconTag.DEFAULT, iconEl, 'Icon');

        // size and the value: convert to 0-100 iconScale and add the URL
        var iconScale = osStyle.DEFAULT_FEATURE_SIZE * 10;
        if (layerConfig['size'] && typeof layerConfig['size'] === 'number') {
          // use the feature size to convert into a scale if it's available
          iconScale = Math.floor(/** @type {number} */ (layerConfig['size']) * 10);
        }
        var iconOptions = value['options'] || undefined;
        if (iconOptions) {
          appendElement(IconTag.OPTIONS, iconEl, JSON.stringify(iconOptions));
        }
        appendElement(IconTag.SCALE, iconEl, iconScale);
        appendElement(IconTag.URL, iconEl, value['path']);

        // more boilerplate
        appendElement(IconTag.X_OFFSET, iconEl, 0);
        appendElement(IconTag.Y_OFFSET, iconEl, 0);
        appendElement(IconTag.MIX_COLOR, iconEl, true);
        break;
      case 'mappings':
        var mappings = /** @type {Array<IMapping>} */ (layerConfig['mappings']);
        if (mappings && mappings.length > 0) {
          var mappingsStateEl = appendElement(LayerTag.MAPPINGS, layerEl);
          var mappingsEl = MappingManager.getInstance().toXml(mappings);

          var elements = mappingsEl.getElementsByTagName('mapping');
          // Not exactly sure why, but the elements array gets modified
          // when appendChild gets called. Going through the array in reverse
          // order mitigates this index issues.
          for (var i = elements.length; i > 0; i--) {
            mappingsStateEl.appendChild(elements[i - 1]);
          }
        }
        break;
      case LayerTag.CSV_COMMENT_CHAR:
        this.defaultConfigToXML('comment', value, layerEl);
        this.defaultConfigToXML('quote', '"', layerEl);
        break;
      case LayerTag.CSV_DATA_ROW:
        // convert from 1 based indexing to 0 based.
        this.defaultConfigToXML(LayerTag.CSV_DATA_ROW, /** @type {number} */ (value) - 1, layerEl);
        break;
      case LayerTag.CSV_HEADER_ROW:
        // convert from 1 based indexing to 0 based. But needs to be set to -1 when useHeader is false.
        if (layerConfig[LayerTag.CSV_USE_HEADER]) {
          this.defaultConfigToXML(LayerTag.CSV_HEADER_ROW, /** @type {number} */ (value) - 1, layerEl);
        } else {
          this.defaultConfigToXML(LayerTag.CSV_HEADER_ROW, -1, layerEl);
        }
        break;
      case LayerTag.CSV_USE_HEADER:
      case LayerTag.PARSER_CONFIG:
        // NO-OP
        break;
      case LayerTag.ANIMATE:
        // animate comes from the original layer options, while timeEnabled is the user-controlled value. if timeEnabled
        // exists, skip this key in favor of the user value.
        if (!(LayerTag.TIME_ENABLED in layerConfig)) {
          this.defaultConfigToXML(key, value, layerEl);
        }
        break;
      case LayerTag.TIME_ENABLED:
        // save under the animate element
        this.defaultConfigToXML(LayerTag.ANIMATE, value, layerEl);
        break;
      case LayerTag.IS_BASE_LAYER:
        this.defaultConfigToXML('baseLayer', value, layerEl);
        break;
      case 'refreshInterval':
        appendElement(LayerTag.REFRESH_RATE, layerEl, value);
        break;
      case LayerTag.EXTENT:
        layerEl.appendChild(this.extentsToXML_(/** @type {Array<number>} */ (value)));
        break;
      case LayerTag.COLOR_MODEL:
        var colorModelEle = this.colorModeOptionsToXml_(value);
        layerEl.appendChild(colorModelEle);
        break;
      default:
        this.defaultConfigToXML(key, value, layerEl);
        break;
    }
  }

  /**
   * Converts an extent to a kml:LatLonBoxType
   *
   * @param {Array<number>} extents
   * @return {!Element} the extents element
   * @private
   */
  extentsToXML_(extents) {
    var element = createElement(LayerTag.EXTENTS);
    var normalizedExtent = transformExtent(extents, EPSG4326, osMap.PROJECTION);
    var ns = 'http://www.opengis.net/kml/2.2';
    appendElementNS('north', ns, element, normalizedExtent[3]);
    appendElementNS('south', ns, element, normalizedExtent[1]);
    appendElementNS('east', ns, element, normalizedExtent[2]);
    appendElementNS('west', ns, element, normalizedExtent[0]);
    return element;
  }

  /**
   * Transforms an kml:LatLonBoxType element to an extent.
   *
   * @param {Element} element
   * @return {Array<number>}
   * @private
   */
  extentsFromXML_(element) {
    var result = [];
    result.push(parseFloat(getElementValueOrDefault(element.querySelector('west'), -179)));
    result.push(parseFloat(getElementValueOrDefault(element.querySelector('south'), -89)));
    result.push(parseFloat(getElementValueOrDefault(element.querySelector('east'), 179)));
    result.push(parseFloat(getElementValueOrDefault(element.querySelector('north'), 89)));
    return transformExtent(result, osMap.PROJECTION, EPSG4326);
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
          value = toServerString(value);
        } catch (e) {
          // default to white
          value = '0xffffff';
        }
      } else if (typeof value === 'string' && value.startsWith('url')) {
        // make sure url's are qualified
        value = addBase(value);
      }

      // don't include the hash key since it will cause a crash
      if (typeof value === 'string' && key == '$$hashKey') {
        return;
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
      } else if (goog.isObject(value) && typeof value !== 'function') {
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

      if (layerOptions['groupId']) {
        // update the group ID if it's present to be unique to this state
        layerOptions['groupId'] = AbstractState.createId(id, /** @type {string} */ (layerOptions['groupId']));
      }

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

          this.xmlToConfigKey(node, child, name, options);
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

  /**
   * @param {!Element} node The root layers node
   * @param {!Element} child The node
   * @param {!string} name The node name
   * @param {!Object<string, *>} options The config options
   */
  xmlToConfigKey(node, child, name, options) {
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
            case LayerTag.FILL_COLOR:
              try {
                styleVal = padHexColor(styleVal, '#');
                options[StyleField.FILL_COLOR] = osStyle.toRgbaString(styleVal);
              } catch (e) {
              }
              break;
            case LayerTag.FILL_OPACITY:
              var fillOpacity = Number(styleVal);
              if (isNaN(fillOpacity)) {
                fillOpacity = osStyle.DEFAULT_FILL_ALPHA;
              }
              options[StyleField.FILL_OPACITY] = clamp(fillOpacity, 0, 1);
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
                options[StyleField.SHOW_LABELS] = !isEmptyOrWhitespace(makeSafe(column));
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
                clamp(styleSize, osLabel.MIN_SIZE, osLabel.MAX_SIZE) :
                osLabel.DEFAULT_SIZE;
              options[StyleField.LABEL_SIZE] = size;
              break;
            default:
              break;
          }
        }
        break;
      case LayerTag.CONTRAST:
        // Desktop doesn't have contrast, and Cesium treats 1.0 as normal.
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
        for (var j = 0, m = pc.length; j < m; j++) {
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
        // Desktop add 'Tiles' and 'Features' to the exported layer titles, but we add that in a separate directive
        options['title'] = child.textContent.replace(/\s*(Tiles|Features)\s*$/, '');
        break;
      case LayerTag.SHOW_LABELS:
        options[StyleField.SHOW_LABELS] = child.textContent == 'true';
        break;
      case LayerTag.ICON_STYLE:
        var urlEle = child.querySelector(IconTag.URL);
        if (urlEle) {
          var iconOptions = child.querySelector(IconTag.OPTIONS) || undefined;
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
          options[StyleField.ICON] = {
            'path': urlText,
            'options': iconOptions
          };
        }
        break;
      case LayerTag.MAPPINGS:
        var mappingManager = MappingManager.getInstance();
        var mappings = [];
        var mappingEls = getChildren(child);
        for (var j = 0, m = mappingEls.length; j < m; j++) {
          var mappingElement = mappingEls[j];
          var mapping = mappingManager.fromXml(mappingElement);
          mappings.push(mapping);
        }

        options['mappings'] = mappings;
        break;
      case LayerTag.ANIMATE:
        options[name] = this.defaultXmlToConfig(name, child);
        options[LayerTag.TIME_ENABLED] = options[name];
        break;
      case LayerTag.TIME_ENABLED:
        // NO-OP (handled by the animate element)
        break;
      case 'comment':
        options[LayerTag.CSV_COMMENT_CHAR] = this.defaultXmlToConfig(name, child);
        break;
      case LayerTag.CSV_DATA_ROW:
        // convert from 0 based indexing to 1 based indexing.
        options[LayerTag.CSV_DATA_ROW] = this.defaultXmlToConfig(name, child) + 1;
        break;
      case LayerTag.CSV_HEADER_ROW:
        // convert from 0 based indexing to 1 based indexing.
        var val = /** @type {number} */ (this.defaultXmlToConfig(name, child));
        options[LayerTag.CSV_USE_HEADER] = val < 0 ? false : true;
        options[LayerTag.CSV_HEADER_ROW] = val + 1;
        break;
      case 'baseLayer':
        options[LayerTag.IS_BASE_LAYER] = this.defaultXmlToConfig(name, child);
        break;
      case LayerTag.REFRESH_RATE:
        options['refreshInterval'] = this.defaultXmlToConfig(name, child);
        break;
      case LayerTag.EXTENTS:
        options[LayerTag.EXTENT] = this.extentsFromXML_(child);
        break;
      case LayerTag.COLOR_MODEL:
        var cm = this.colorModeOptionsFromXml_(child);
        options[LayerTag.COLOR_MODEL] = cm;
        break;
      default:
        options[name] = this.defaultXmlToConfig(name, child);
        break;
    }
  }

  /**
   * Converts the colorModel node to a colorModel options object.
   *
   * @param {Element} node
   * @return {Object}
   * @private
   */
  colorModeOptionsFromXml_(node) {
    var result = {
      'colorMethod': 0,
      'binMethod': {},
      'manualColors': {}
    };
    var cmv = getElementValueOrDefault(node.querySelector(LayerTag.COLOR_MODEL_METHOD), 0);
    result['colorMethod'] = parseInt(cmv, 10);

    var binElement = node.querySelector(LayerTag.COLOR_MODEL_BIN_METHOD);
    if (binElement) {
      var binFieldEl = binElement.querySelector(LayerTag.BIN_FIELD);
      if (binFieldEl) {
        var binField = readString(binFieldEl);
        result['binMethod'][LayerTag.BIN_FIELD] = binField || '';
      }

      var binTypeEl = binElement.querySelector(LayerTag.BIN_TYPE);
      if (binTypeEl) {
        var binType = readString(binTypeEl);
        result['binMethod'][LayerTag.BIN_TYPE] = binType || '';
      }

      var widthEl = binElement.querySelector(LayerTag.BIN_WIDTH);
      if (widthEl) {
        var width = readDecimal(widthEl);
        if (width != null) {
          result['binMethod']['width'] = width;
        }
      }

      var offsetEl = binElement.querySelector(LayerTag.BIN_OFFSET);
      if (offsetEl) {
        var offset = readDecimal(offsetEl);
        if (offset != null) {
          result['binMethod']['offset'] = offset;
        }
      }
    }

    var manColorElement = node.querySelector(LayerTag.COLOR_MODEL_MANUAL_COLORS);
    var manColorPairs = manColorElement.querySelectorAll(LayerTag.COLOR_MODEL_PAIR);
    var pairElement;
    var valElement;
    var nameElement;
    var name;
    var value;

    for (var i = 0; i < manColorPairs.length; i++) {
      pairElement = manColorPairs[i];
      nameElement = pairElement.querySelector(LayerTag.COLOR_MODEL_NAME);
      valElement = pairElement.querySelector(LayerTag.COLOR_MODEL_VALUE);
      name = getElementValueOrDefault(nameElement, null);
      value = getElementValueOrDefault(valElement, null);
      if (!isEmptyOrWhitespace(makeSafe(name))) {
        result['manualColors'][name] = value;
      }
    }
    return result;
  }

  /**
   * Returns the colorModel xml node for the color model.
   *
   * @param {*} colorModel
   * @return {Element}
   * @private
   */
  colorModeOptionsToXml_(colorModel) {
    var element = createElement(LayerTag.COLOR_MODEL);
    if (colorModel) {
      appendElement(LayerTag.COLOR_MODEL_METHOD, element, colorModel['colorMethod']);

      var binMethod = colorModel['binMethod'];
      if (binMethod) {
        var binElement = appendElement(LayerTag.COLOR_MODEL_BIN_METHOD, element);
        appendElement(LayerTag.BIN_FIELD, binElement, binMethod['field']);
        appendElement(LayerTag.BIN_TYPE, binElement, binMethod['type']);

        if (binMethod['width'] != null) {
          appendElement(LayerTag.BIN_WIDTH, binElement, binMethod['width']);
        }

        if (binMethod['offset'] != null) {
          appendElement(LayerTag.BIN_OFFSET, binElement, binMethod['offset']);
        }
      }

      var manColorElement = appendElement(LayerTag.COLOR_MODEL_MANUAL_COLORS, element);
      var pair;
      for (var prop in colorModel['manualColors']) {
        if (colorModel['manualColors'].hasOwnProperty(prop)) {
          pair = appendElement(LayerTag.COLOR_MODEL_PAIR, manColorElement);
          appendElement(LayerTag.COLOR_MODEL_NAME, pair, prop);
          appendElement(LayerTag.COLOR_MODEL_VALUE, pair,
              colorModel['manualColors'][prop]);
        }
      }
    }
    return element;
  }

  /**
   * @inheritDoc
   */
  remove(id) {}
}

/**
 * LoggerparserConfig
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v4.BaseLayerState');

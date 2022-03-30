goog.declareModuleId('os.data.LayerSyncDescriptor');

import * as olArray from 'ol/src/array.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import {ObjectEvent} from 'ol/src/Object.js';

import '../ui/layer/ellipsecolumns.js';
import {registerClass} from '../classregistry.js';
import * as dispatcher from '../dispatcher.js';
import LayerEventType from '../events/layereventtype.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import osImplements from '../implements.js';
import {createFromOptions} from '../layer/layer.js';
import PropertyChange from '../layer/propertychange.js';
import {getMapContainer} from '../map/mapinstance.js';
import Online from '../net/online.js';
import {merge} from '../object/object.js';
import {directiveTag as nodeUi} from '../ui/node/defaultlayernodeui.js';
import BaseDescriptor from './basedescriptor.js';
import {DescriptorClass} from './data.js';
import DataManager from './datamanager.js';
import IMappingDescriptor from './imappingdescriptor.js';

const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');

const Logger = goog.requireType('goog.log.Logger');
const {default: LayerEvent} = goog.requireType('os.events.LayerEvent');
const {default: IMapping} = goog.requireType('os.im.mapping.IMapping');


const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * A descriptor that synchronizes one or more layers on the map. This descriptor should be extended to implement the
 * getLayerOptions function, which should produce the options object(s) to be used in creating the layers synchronized
 * to this descriptor.
 *
 * @implements {IMappingDescriptor}
 * @abstract
 */
export default class LayerSyncDescriptor extends BaseDescriptor {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * @type {!Array<!ILayer>}
     * @protected
     */
    this.layers = [];

    /**
     * @type {!Array<string>}
     * @protected
     */
    this.layerIds = [];

    /**
     * @type {!Object<string, *>}
     * @protected
     */
    this.layerConfig = {};

    /**
     * @type {Online}
     * @protected
     */
    this.online = Online.getInstance();

    /**
     * @type {Array<IMapping>}
     */
    this.mappings = [];

    this.setNodeUI(`<${nodeUi}></${nodeUi}>`);

    dispatcher.getInstance().listen(LayerEventType.ADD, this.onLayerAdded, false, this);
    dispatcher.getInstance().listen(LayerEventType.REMOVE, this.onLayerRemoved, false, this);

    this.listenKey = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    dispatcher.getInstance().unlisten(LayerEventType.ADD, this.onLayerAdded, false, this);
    dispatcher.getInstance().unlisten(LayerEventType.REMOVE, this.onLayerRemoved, false, this);
    this.removeLayers_();
  }

  /**
   * @inheritDoc
   */
  getMappings() {
    return this.mappings;
  }

  /**
   * @inheritDoc
   */
  setMappings(value) {
    this.mappings = value;
  }

  /**
   * @inheritDoc
   */
  updateMappings(layer) {
    this.saveDescriptor();

    // Delete the layer, then prompt the descriptor to make new layers
    getMapContainer().removeLayer(/** @type {!ILayer} */ (layer));
    this.setActiveInternal();
  }

  /**
   * @inheritDoc
   */
  supportsMapping() {
    return false;
  }

  /**
   * Get the layers currently being synchronized by this descriptor.
   *
   * @return {!Array<!ILayer>} layers
   */
  getLayers() {
    return this.layers;
  }

  /**
   * @param {Array<Object<string, *>>=} opt_options
   */
  populateLayerIds(opt_options) {
    this.layerIds = (opt_options || this.getOptions()).map(mapLayerIds);
  }

  /**
   * Get the options object(s) for each layer synchronized to this descriptor. Each options object will have the saved
   * layer config applied to it, then will be passed to {@link os.layer.createFromOptions} to create the layer prior to
   * adding it to the map.
   *
   * @abstract
   * @return {(Array<!Object<string, *>>|Object<string, *>)} An options object that can be used to create a layer, or an
   *                                                         array of options objects.
   */
  getLayerOptions() {}

  /**
   * @return {?Array<!Object<string, *>>} An options object that can be used to create a layer
   */
  getOptions() {
    var options = this.getLayerOptions();
    if (options) {
      if (!Array.isArray(options)) {
        options['defaults'] = this.extractConfigDefaults(options);
        options = [options];
      }
      return options.map(this.applyLayerConfig, this);
    }

    return options;
  }

  /**
   * @param {!Object<string, *>} options
   * @return {!Object<string, *>}
   */
  extractConfigDefaults(options) {
    return {
      'opacity': options['opacity'],
      'brightness': options['brightness'],
      'contrast': options['contrast'],
      'saturation': options['saturation']
    };
  }

  /**
   * If the layer is being synchronized by this descriptor.
   *
   * @param {!ILayer} layer The layer
   * @return {boolean}
   */
  containsLayer(layer) {
    return this.layers.indexOf(layer) > -1;
  }

  /**
   * @inheritDoc
   */
  setActiveInternal() {
    if (this.isActive()) {
      this.createLayers_();
    } else {
      this.removeLayers_();
    }

    // update the descriptor loading state
    this.onLoadingChange();

    return true;
  }

  /**
   * @param {!ILayer} layer
   * @protected
   */
  addLayer(layer) {
    if (this.layers.indexOf(layer) === -1) {
      // listen for changes to the layer
      this.listenKey = listen(/** @type {events.EventTarget} */ (layer), GoogEventType.PROPERTYCHANGE,
          this.onLayerChange, this);

      // add the layer to the map and the layer list
      this.layers.push(layer);
      this.setActive(true);
    }
  }

  /**
   * @param {!ILayer} layer
   * @protected
   */
  removeLayer(layer) {
    if (this.layers.indexOf(layer) > -1) {
      // merge things on the layer that might have changed with the current layer options
      var config = this.persistLayerConfig();
      var keys = googObject.getKeys(config);
      keys.forEach(function(key) {
        merge(/** @type {!Object} */(this.layerConfig[key]), /** @type {!Object} */(config[key]), true);
      }, this);

      unlistenByKey(this.listenKey);

      olArray.remove(this.layers, layer);
    }

    if (!this.layers.length) {
      this.setActive(false);
    }
  }

  /**
   * @param {!LayerEvent} evt
   * @protected
   */
  onLayerAdded(evt) {
    if (typeof evt.layer !== 'string') {
      var layer = /** @type {ILayer} */ (evt.layer);

      if (!this.layerIds.length) {
        this.populateLayerIds();
      }

      if (this.layerIds.indexOf(layer.getId()) > -1) {
        this.addLayer(layer);
      }
    }
  }

  /**
   * @param {!LayerEvent} evt
   * @protected
   */
  onLayerRemoved(evt) {
    if (typeof evt.layer !== 'string') {
      var layer = /** @type {ILayer} */ (evt.layer);

      if (!this.layerIds.length) {
        this.populateLayerIds();
      }

      if (this.layerIds.indexOf(layer.getId()) > -1 && this.layers.indexOf(layer) > -1) {
        this.removeLayer(layer);
      }
    }
  }

  /**
   * Create layers to be synchronized by this descriptor and add them to the map.
   *
   * @private
   */
  createLayers_() {
    var options = this.getOptions();
    this.populateLayerIds(options);

    if (options) {
      for (var i = 0; i < options.length; i++) {
        var layerOptions = options[i];

        // create the layer if it doesn't already exist on the map
        var layerId = /** @type {string|undefined} */ (layerOptions['id']) || '';
        if (layerId) {
          var layer = getMapContainer().getLayer(layerId);
          if (!layer) {
            layer = createFromOptions(layerOptions);

            if (layer) {
              getMapContainer().addLayer(layer);
            }
          } else {
            this.addLayer(/** @type {!ILayer} */ (layer));
          }
        }
      }
    }
  }

  /**
   * Remove layers synchronized by this descriptor.
   *
   * @private
   */
  removeLayers_() {
    // save the config prior to removing layers
    this.layerConfig = this.persistLayerConfig();

    for (var i = this.layers.length - 1; i >= 0; i--) {
      var layer = this.layers[i];
      if (layer) {
        // remove it from the map
        getMapContainer().removeLayer(layer);
      }
    }

    this.setLoading(false);
  }

  /**
   * Merge the layer configuration into the options used to create a layer.
   *
   * @param {!Object<string, *>} options
   * @return {!Object<string, *>} The merged options
   * @protected
   */
  applyLayerConfig(options) {
    var opts = {};
    merge(options, opts, true);

    if (this.layerConfig) {
      var id = /** @type {string} */ (options['id']);
      if (id && id in this.layerConfig) {
        merge(/** @type {!Object} */ (this.layerConfig[id]), opts, true);
      }
    }

    return opts;
  }

  /**
   * Handles layer property change
   *
   * @param {(PropertyChangeEvent|ol.Object.Event)} e
   * @protected
   */
  onLayerChange(e) {
    // OL3 also fires 'propertychange' events, so separate handling of each
    if (e instanceof PropertyChangeEvent) {
      // handle our own change event
      var p = e.getProperty() || '';
      if (p == 'loading') {
        this.onLoadingChange(e);
      } else if (styleChangeEvents.indexOf(p) > -1) {
        // only handle these events if they aren't for a specific set of features, to avoid unnecessary processing
        var features = e.getNewValue();
        if (!features || !features.length) {
          this.onStyleChange();
        }
      } else {
        this.saveDescriptor();
      }
    } else if (e instanceof ObjectEvent) {
      // handle the OL3 change event
      if (styleKeys.indexOf(e.key) > -1) {
        this.onStyleChange();
      } else if (changeKeys.indexOf(e.key) > -1) {
        this.saveDescriptor();
      }
    }
  }

  /**
   * Handle changes to the loading state on a synchronized layer.
   *
   * @param {PropertyChangeEvent=} opt_event
   * @protected
   */
  onLoadingChange(opt_event) {
    var layers = this.getLayers();
    if (layers) {
      for (var i = 0, n = layers.length; i < n; i++) {
        if (layers[i].isLoading()) {
          this.setLoading(true);
          return;
        }
      }
    }

    this.setLoading(false);
  }

  /**
   * Handles layer style change.
   *
   * @protected
   */
  onStyleChange() {
    // update the layer config when styles change
    this.saveDescriptor();
  }

  /**
   * Save the descriptor to storage.
   *
   * @protected
   */
  saveDescriptor() {
    this.layerConfig = this.persistLayerConfig();
    DataManager.getInstance().persistDescriptors();
  }

  /**
   * @inheritDoc
   */
  persist(opt_obj) {
    if (!opt_obj) {
      opt_obj = {};
    }

    opt_obj['layer'] = this.persistLayerConfig();
    return super.persist(opt_obj);
  }

  /**
   * @inheritDoc
   */
  restore(conf) {
    this.layerConfig = conf['layer'] || {};
    super.restore(conf);
  }

  /**
   * Persist each synchronized layer to an object keyed by layer id.
   *
   * @return {!Object<string, *>} config
   */
  persistLayerConfig() {
    var config = {};

    var layers = this.getLayers();
    for (var i = 0, n = layers.length; i < n; i++) {
      config[layers[i].getId()] = layers[i].persist();
    }

    return config;
  }
}

osImplements(LayerSyncDescriptor, IMappingDescriptor.ID);
registerClass(DescriptorClass.LAYER_SYNC, LayerSyncDescriptor);

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.data.LayerSyncDescriptor');

/**
 * Map layer options to the layer ID.
 * @param {Object<string, *>} options
 * @return {string}
 */
const mapLayerIds = (options) => /** @type {string} */ (options['id'] || '');

/**
 * Style change keys that descriptor needs to handle.
 * @type {Array<string>}
 */
const styleKeys = ['opacity', 'contrast', 'brightness', 'saturation', 'sharpness'];


/**
 * Keys that cause the descriptor to save.
 * @type {Array<string>}
 */
const changeKeys = ['minResolution', 'maxResolution'];


/**
 * @type {!Array<!string>}
 */
const styleChangeEvents = [
  PropertyChange.STYLE,
  PropertyChange.REFRESH_INTERVAL,
  PropertyChange.TIME_ENABLED,
  PropertyChange.VISIBLE
];

goog.declareModuleId('os.layer.LayerGroup');

import {remove} from 'ol/src/array.js';

import {registerClass} from '../classregistry.js';
import IGroupable from '../igroupable.js';
import osImplements from '../implements.js';
import {directiveTag as nodeUi} from '../ui/node/defaultlayernodeui.js';
import ILayer from './ilayer.js';
import LayerClass from './layerclass.js';

const EventTarget = goog.require('goog.events.EventTarget');
const {clamp} = goog.require('goog.math');
const {getRandomString} = goog.require('goog.string');


/**
 * Logical grouping of layers
 *
 * @implements {ILayer}
 * @implements {IGroupable}
 */
export default class LayerGroup extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!string}
     * @private
     */
    this.id_ = getRandomString();

    /**
     * @type {!Array<!ILayer>}
     * @private
     */
    this.layers_ = [];

    /**
     * @type {Object<string, *>}
     * @private
     */
    this.layerOptions_ = null;

    /**
     * If the layer is enabled.
     * @type {boolean}
     * @private
     */
    this.enabled_ = true;

    /**
     * @type {boolean}
     * @private
     */
    this.loading_ = false;

    /**
     * @type {?string}
     * @private
     */
    this.provider_ = null;

    /**
     * @type {?Array<!string>}
     * @private
     */
    this.tags_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.removable_ = true;

    /**
     * @type {string}
     * @private
     */
    this.nodeUi_ = `<${nodeUi}></${nodeUi}>`;

    /**
     * @type {string}
     * @private
     */
    this.layerUi_ = 'defaultlayerui';

    /**
     * @type {boolean}
     * @private
     */
    this.hidden_ = false;

    /**
     * @type {string}
     * @private
     */
    this.title_ = '';
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.layers_.length = 0;
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id_;
  }

  /**
   * @inheritDoc
   */
  setId(value) {
    this.id_ = value;
  }

  /**
   * @inheritDoc
   */
  getGroupId() {
    return this.getId();
  }

  /**
   * @inheritDoc
   */
  getGroupLabel() {
    return this.getTitle();
  }

  /**
   * @inheritDoc
   */
  getSource() {
    return null;
  }

  /**
   * @inheritDoc
   */
  isEnabled() {
    try {
      if (this.layers_ && this.layers_.some((layer) => layer.isEnabled())) {
        return true;
      }
    } catch (e) {
      // Likely a non-ILayer in the group, defer to the group flag.
    }

    return this.enabled_;
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    this.enabled_ = value;
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    try {
      if (this.layers_ && this.layers_.some((layer) => layer.isLoading())) {
        return true;
      }
    } catch (e) {
      // Likely a non-ILayer in the group, defer to the group flag.
    }

    return this.loading_;
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    // manually set the loading flag.  this is used when children aren't
    // present yet because there is intermediate loading to be done before
    // we can figure out what the children should actually be.
    this.loading_ = value;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return this.title_;
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    this.title_ = value;
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return '';
  }

  /**
   * @inheritDoc
   */
  getOSType() {
    if (this.layers_.length > 0) {
      return this.layers_[0].getOSType();
    }
    return 'group';
  }

  /**
   * @inheritDoc
   */
  setOSType(value) {}

  /**
   * @inheritDoc
   */
  getExplicitType() {
    return '';
  }

  /**
   * @inheritDoc
   */
  setExplicitType(value) {}

  /**
   * @inheritDoc
   */
  getProvider() {
    if (this.layers_.length > 0) {
      return this.layers_[0].getProvider();
    }
    return this.provider_;
  }

  /**
   * @inheritDoc
   */
  setProvider(value) {
    this.provider_ = value;
  }

  /**
   * @inheritDoc
   */
  getBrightness() {
    var maxBrightness = 0;
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        maxBrightness = Math.max(maxBrightness, this.layers_[i].getBrightness());
      } catch (e) {
      }
    }

    return clamp(maxBrightness, 0, 1);
  }

  /**
   * @inheritDoc
   */
  setBrightness(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setBrightness(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  getContrast() {
    var maxContrast = 0;
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        maxContrast = Math.max(maxContrast, this.layers_[i].getContrast());
      } catch (e) {
      }
    }

    return clamp(maxContrast, 0, 1);
  }

  /**
   * @inheritDoc
   */
  setContrast(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setContrast(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  getHue() {
    var maxHue = -180;
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        maxHue = Math.max(maxHue, this.layers_[i].getHue());
      } catch (e) {
      }
    }

    return clamp(maxHue, -180, 180);
  }

  /**
   * @inheritDoc
   */
  setHue(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setHue(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  getOpacity() {
    var maxOpacity = 0;
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        maxOpacity = Math.max(maxOpacity, this.layers_[i].getOpacity());
      } catch (e) {
      }
    }

    return clamp(maxOpacity, 0, 1);
  }

  /**
   * @inheritDoc
   */
  setOpacity(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setOpacity(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  getSaturation() {
    var maxSaturation = 0;
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        maxSaturation = Math.max(maxSaturation, this.layers_[i].getSaturation());
      } catch (e) {
      }
    }

    return clamp(maxSaturation, 0, 1);
  }

  /**
   * @inheritDoc
   */
  setSaturation(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setSaturation(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  getSharpness() {
    var maxSharpness = 0;
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        maxSharpness = Math.max(maxSharpness, this.layers_[i].getSharpness());
      } catch (e) {
      }
    }

    return clamp(maxSharpness, 0, 1);
  }

  /**
   * @inheritDoc
   */
  setSharpness(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setSharpness(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  getLayerVisible() {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        if (this.layers_[i].getLayerVisible()) {
          return true;
        }
      } catch (e) {
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setLayerVisible(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  setBaseVisible(value) {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        this.layers_[i].setBaseVisible(value);
      } catch (e) {
      }
    }
  }

  /**
   * @inheritDoc
   */
  getBaseVisible() {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        if (this.layers_[i].getBaseVisible()) {
          return true;
        }
      } catch (e) {
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  getTags() {
    return this.tags_;
  }

  /**
   * @inheritDoc
   */
  setTags(value) {
    this.tags_ = value;
  }

  /**
   * @inheritDoc
   */
  getLayerOptions() {
    return this.layerOptions_;
  }

  /**
   * @inheritDoc
   */
  setLayerOptions(value) {
    this.layerOptions_ = value;
  }

  /**
   * @inheritDoc
   */
  isRemovable() {
    for (var i = 0, n = this.layers_.length; i < n; i++) {
      try {
        if (!this.layers_[i].isRemovable()) {
          return false;
        }
      } catch (e) {
      }
    }

    return this.removable_;
  }

  /**
   * @inheritDoc
   */
  setRemovable(value) {
    this.removable_ = value;
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    var set = {};
    var max = 0;
    var maxGroup = null;

    for (var i = 0, n = this.layers_.length; i < n; i++) {
      var group = this.layers_[i].getGroupUI();

      if (group) {
        if (group in set) {
          set[group]++;
        } else {
          set[group] = 1;
        }

        if (set[group] > max) {
          max = set[group];
          maxGroup = group;
        }
      }
    }

    if (maxGroup) {
      return '<' + maxGroup + '></' + maxGroup + '>';
    }

    return this.nodeUi_;
  }

  /**
   * @inheritDoc
   */
  setNodeUI(value) {}

  /**
   * @inheritDoc
   */
  getLayerUI() {
    return this.layerUi_;
  }

  /**
   * @inheritDoc
   */
  setLayerUI(value) {
    this.layerUi_ = value;
  }

  /**
   * @inheritDoc
   */
  getGroupUI() {
    return null;
  }

  /**
   * Adds a layer to the group.
   *
   * @param {!ILayer} layer
   */
  addLayer(layer) {
    this.layers_.push(layer);
  }

  /**
   * Get the layers in the group.
   *
   * @return {!Array<!ILayer>}
   */
  getLayers() {
    return this.layers_;
  }

  /**
   * Removes a layer from the group.
   *
   * @param {!ILayer} layer
   */
  removeLayer(layer) {
    remove(this.layers_, layer);
  }

  /**
   * @inheritDoc
   */
  callAction(type) {
    // unsupported
  }

  /**
   * @inheritDoc
   */
  supportsAction(type, opt_actionArgs) {
    return false;
  }

  /**
   * @inheritDoc
   */
  getSynchronizerType() {
    return null;
  }

  /**
   * @inheritDoc
   */
  setSynchronizerType(value) {}

  /**
   * @inheritDoc
   */
  getHidden() {
    return this.hidden_;
  }

  /**
   * @inheritDoc
   */
  setHidden(value) {
    this.hidden_ = value;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    // intentionally empty
    return opt_to || {};
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    // intentionally empty
  }
}

osImplements(LayerGroup, ILayer.ID);
osImplements(LayerGroup, IGroupable.ID);
registerClass(LayerClass.GROUP, LayerGroup);

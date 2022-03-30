goog.declareModuleId('os.layer.Image');

import {listen} from 'ol/src/events.js';
import {createEmpty, isEmpty} from 'ol/src/extent.js';
import ImageLayer from 'ol/src/layer/Image.js';
import ImageSource from 'ol/src/source/Image.js';
import ImageStatic from 'ol/src/source/ImageStatic.js';

import EventType from '../action/eventtype.js';
import {adjustColor, adjustSharpness} from '../color.js';
import * as dispatcher from '../dispatcher.js';
import LayerEvent from '../events/layerevent.js';
import LayerEventType from '../events/layereventtype.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {reduceExtentFromLayers} from '../fn/fn.js';
import IGroupable from '../igroupable.js';
import osImplements from '../implements.js';
import SourcePropertyChange from '../source/propertychange.js';
import Icons from '../ui/icons.js';
import IconsSVG from '../ui/iconssvg.js';
import * as ImageLayerUI from '../ui/layer/imagelayerui.js';
import {directiveTag as nodeUi} from '../ui/node/defaultlayernodeui.js';
import {launchRenameDialog} from '../ui/renamelayer.js';
import ExplicitLayerType from './explicitlayertype.js';
import ILayer from './ilayer.js';
import {identifyLayer} from './layer.js';
import LayerType from './layertype.js';
import PropertyChange from './propertychange.js';
import SynchronizerType from './synchronizertype.js';

const {assert} = goog.require('goog.asserts');
const GoogEventType = goog.require('goog.events.EventType');
const {getRandomString} = goog.require('goog.string');


/**
 * @implements {ILayer}
 * @implements {IGroupable}
 */
export default class Image extends ImageLayer {
  /**
   * Constructor.
   * @param {olx.layer.ImageOptions} options image layer options
   */
  constructor(options) {
    super(options);

    /**
     * @type {!string}
     * @private
     */
    this.id_ = getRandomString();

    /**
     * @type {?string}
     * @private
     */
    this.osType_ = LayerType.IMAGE;

    /**
     * @type {string}
     * @private
     */
    this.explicitType_ = ExplicitLayerType.IMAGE;

    /**
     * @type {!string}
     * @private
     */
    this.title_ = 'Image Overlay';

    if (options['title']) {
      this.setTitle(this.title_ + ' - ' + options['title']);
    }

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
     * @type {?Array.<!string>}
     * @private
     */
    this.tags_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.removable_ = true;

    /**
     * @type {Object.<string, *>}
     * @private
     */
    this.layerOptions_ = null;

    /**
     * @type {string}
     * @private
     */
    this.layerUi_ = ImageLayerUI.directiveTag;

    /**
     * @type {boolean}
     * @private
     */
    this.visible_ = true;

    /**
     * @type {boolean}
     * @private
     */
    this.mapVisibilityLocked_ = false;

    /**
     * @type {?string}
     * @private
     */
    this.syncType_ = null;

    /**
     * Image overlays are hidden by default.
     * @type {boolean}
     * @private
     */
    this.hidden_ = true;

    /**
     * @type {function(Uint8ClampedArray, number, number)}
     * @private
     */
    this.colorFilter_ = this.applyColors.bind(this);

    /**
     * @type {?string}
     * @private
     */
    this.groupId_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.groupLabel_ = null;

    var source = this.getSource();
    if (source) {
      listen(source, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
    }

    this.setZIndex(999);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    // call the parent chain first to remove listeners
    super.disposeInternal();

    // make sure the map loading counters are updated since the layer is being removed
    this.setLoading(false);

    var source = this.getSource();
    if (source) {
      source.dispose();
    }
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

    // reapply the color filter as changing the layerOptions can change the layer color/colorize
    this.updateColorFilter();
  }

  /**
   * @inheritDoc
   */
  isEnabled() {
    // Layer does not have separate enabled/visible states, so this is a pass-through.
    return this.getLayerVisible();
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    // Layer does not have separate enabled/visible states, so this is a pass-through.
    this.setLayerVisible(value);
  }

  /**
   * @inheritDoc
   */
  isLoading() {
    return this.loading_;
  }

  /**
   * @inheritDoc
   */
  setLoading(value) {
    if (this.loading_ !== value) {
      var old = this.loading_;
      this.loading_ = value;
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.LOADING, value, old));
    }
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
    return this.groupId_ != null ? this.groupId_ : this.getId();
  }

  /**
   * @inheritDoc
   */
  getGroupLabel() {
    return this.groupLabel_ != null ? this.groupLabel_ : this.getTitle();
  }

  /**
   * @inheritDoc
   */
  getProvider() {
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
  isRemovable() {
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
  getTitle() {
    return this.title_;
  }

  /**
   * @inheritDoc
   */
  setTitle(value) {
    if (this.title_ !== value) {
      var old = this.title_;
      this.title_ = value;
      this.dispatchEvent(new PropertyChangeEvent('title', value, old));
    }
  }

  /**
   * @inheritDoc
   */
  getOSType() {
    return this.osType_;
  }

  /**
   * @inheritDoc
   */
  setOSType(value) {
    this.osType_ = value;
  }

  /**
   * @inheritDoc
   */
  getExplicitType() {
    return this.explicitType_;
  }

  /**
   * @inheritDoc
   */
  setExplicitType(value) {
    this.explicitType_ = value;
  }

  /**
   * @inheritDoc
   */
  getLayerVisible() {
    return this.visible_;
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {
    value = !!value;

    if (this.visible_ != value) {
      this.visible_ = value;
      if (!this.mapVisibilityLocked_) {
        this.setVisible(value);
      }

      this.dispatchEvent(new PropertyChangeEvent('visible', value, !value));
    }
  }

  /**
   * @inheritDoc
   */
  setBaseVisible(value) {
    this.setVisible(value);
  }

  /**
   * @inheritDoc
   */
  getBaseVisible() {
    return this.getVisible();
  }

  /**
   * @inheritDoc
   */
  getNodeUI() {
    return `<${nodeUi}></${nodeUi}>`;
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
   * @return {Array<string>}
   * @protected
   */
  getSVGSet() {
    return [IconsSVG.FEATURES];
  }

  /**
   * Get the brightness for the image layer.
   *
   * @return {number}
   * @override
   */
  getBrightness() {
    if (this.layerOptions_) {
      return /** @type {number} */ (this.layerOptions_['brightness'] || 0);
    }
    return 0;
  }

  /**
   * Get the contrast for the image layer.
   *
   * @override
   * @return {number}
   */
  getContrast() {
    if (this.layerOptions_ && this.layerOptions_['contrast'] != null) {
      return /** @type {number} */ (this.layerOptions_['contrast']);
    }
    return 1;
  }

  /**
   * Get the saturation for the image layer.
   *
   * @override
   * @return {number}
   */
  getSaturation() {
    if (this.layerOptions_ && this.layerOptions_['saturation'] != null) {
      return /** @type {number} */ (this.layerOptions_['saturation']);
    }
    return 1;
  }

  /**
   * Get the sharpness for the image layer.
   *
   * @override
   * @return {number}
   */
  getSharpness() {
    if (this.layerOptions_ && this.layerOptions_['sharpness'] != null) {
      return /** @type {number} */ (this.layerOptions_['sharpness']);
    }
    return 0;
  }

  /**
   * Adjust the layer brightness.  A value of -1 will render the layer completely
   * black.  A value of 0 will leave the brightness unchanged.  A value of 1 will
   * render the layer completely white.  Other values are linear multipliers on
   * the effect (values are clamped between -1 and 1).
   *
   * @override
   * @param {number} value The brightness of the layer (values clamped between -1 and 1)
   * @param {Object=} opt_options The layer options to use
   */
  setBrightness(value, opt_options) {
    assert(value >= -1 && value <= 1, 'brightness is not between -1 and 1');
    var options = opt_options || this.layerOptions_;
    if (options) {
      options['brightness'] = value;
      this.updateColorFilter();
    }
    super.setBrightness(value);
  }

  /**
   * Adjust the layer contrast.  A value of 0 will render the layer completely
   * grey.  A value of 1 will leave the contrast unchanged.  Other values are
   * linear multipliers on the effect (and values over 1 are permitted).
   *
   * @override
   * @param {number} value The contrast of the layer (values clamped between 0 and 2)
   * @param {Object=} opt_options The layer options to use
   */
  setContrast(value, opt_options) {
    assert(value >= 0 && value <= 2, 'contrast is not between 0 and 2');
    var options = opt_options || this.layerOptions_;
    if (options) {
      options['contrast'] = value;
      this.updateColorFilter();
    }
    super.setContrast(value);
  }

  /**
   * Adjust layer saturation.  A value of 0 will render the layer completely
   * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
   * values are linear multipliers of the effect (and values over 1 are
   * permitted).
   *
   * @override
   * @param {number} value The saturation of the layer (values clamped between 0 and 1)
   * @param {Object=} opt_options The layer options to use
   */
  setSaturation(value, opt_options) {
    assert(value >= 0, 'saturation is greater than 0');
    var options = opt_options || this.layerOptions_;
    if (options) {
      options['saturation'] = value;
      this.updateColorFilter();
    }
    super.setSaturation(value);
  }

  /**
   * Adjust layer sharpness. A value of 0 will not adjust layer sharpness. A value of 1 will apply the maximum
   * sharpness adjustment to the image.
   *
   * @override
   * @param {number} value The sharpness of the layer (values clamped between 0 and 1)
   * @param {Object=} opt_options The layer options to use
   */
  setSharpness(value, opt_options) {
    assert(value >= 0 && value <= 1, 'sharpness is between 0 and 1');
    var options = opt_options || this.layerOptions_;
    if (options) {
      options['sharpness'] = value;
      this.updateColorFilter();
    }
    super.setSharpness(value);
  }

  /**
   * Updates the color filter, either adding or removing depending on whether the layer is colored to a non-default
   * color or colorized.
   *
   * @protected
   */
  updateColorFilter() {
    var source = this.getSource();
    if (source instanceof ImageSource) {
      if (this.getBrightness() != 0 || this.getContrast() != 1 || this.getSaturation() != 1 ||
          this.getSharpness() != 0) {
        // put the colorFilter in place if we are colorized or the current color is different from the default
        source.addImageFilter(this.colorFilter_);
      } else {
        source.removeImageFilter(this.colorFilter_);
      }
    }
  }

  /**
   * Filter function that applies the layer color image data. This filter is always in the filter array, but it
   * only runs if the current color is different from the default or if the colorize option is active.
   *
   * @param {Uint8ClampedArray} data The image data.
   * @param {number} width The image width.
   * @param {number} height The image height.
   */
  applyColors(data, width, height) {
    if (!data) {
      return;
    }

    var brightness = this.getBrightness();
    var contrast = this.getContrast();
    var saturation = this.getSaturation();
    var sharpness = this.getSharpness();
    if (brightness != 0 || contrast != 1 || saturation != 1 || sharpness != 0) {
      adjustColor(data, brightness, contrast, saturation);

      if (sharpness > 0) {
        // sharpness is in the range [0, 1]. use a multiplier to enhance the convolution effect.
        adjustSharpness(data, width, height, sharpness * 2);
      }
    }
  }

  /**
   * @return {Array<string>}
   * @protected
   */
  getIconSet() {
    return [Icons.FEATURES];
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    return this.getIconSet().join('');
  }

  /**
   * @return {Array<string>}
   * @protected
   */
  getFASet() {
    return [];
  }

  /**
   * Identify the layer on the map.
   *
   * @protected
   */
  identify() {
    identifyLayer(this);
  }

  /**
   * @inheritDoc
   */
  getGroupUI() {
    return null; // no grouping
  }

  /**
   * @inheritDoc
   */
  getSynchronizerType() {
    if (this.syncType_) {
      return this.syncType_;
    }

    return this.getSource() instanceof ImageStatic ? SynchronizerType.IMAGE_STATIC : SynchronizerType.IMAGE;
  }

  /**
   * @inheritDoc
   */
  setSynchronizerType(value) {
    this.syncType_ = value;
  }

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
   * @see {IActionTarget}
   */
  supportsAction(type, opt_actionArgs) {
    switch (type) {
      case EventType.GOTO:
        const layerExtent = reduceExtentFromLayers(/** @type {!ol.Extent} */ (createEmpty()), this);
        return !isEmpty(layerExtent);
      case EventType.IDENTIFY:
      case EventType.REFRESH:
        return true;
      case EventType.RENAME:
        return !!opt_actionArgs && goog.isArrayLike(opt_actionArgs) && opt_actionArgs.length === 1;
      case EventType.REMOVE_LAYER:
        return this.isRemovable();
      default:
        break;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  callAction(type) {
    switch (type) {
      case EventType.IDENTIFY:
        this.identify();
        break;
      case EventType.REMOVE_LAYER:
        var removeEvent = new LayerEvent(LayerEventType.REMOVE, this.getId());
        dispatcher.getInstance().dispatchEvent(removeEvent);
        break;
      case EventType.RENAME:
        launchRenameDialog(this);
        break;
      default:
        break;
    }
  }

  /**
   * Handler for source change events.
   *
   * @param {PropertyChangeEvent} event
   * @private
   */
  onSourcePropertyChange_(event) {
    if (event instanceof PropertyChangeEvent) {
      var p = event.getProperty();
      if (p == SourcePropertyChange.LOADING) {
        this.setLoading(/** @type {boolean} */ (event.getNewValue()));
      }
    }
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = opt_to || {};

    opt_to['visible'] = this.getLayerVisible();
    opt_to['opacity'] = this.getOpacity();
    opt_to['contrast'] = this.getContrast();
    opt_to['brightness'] = this.getBrightness();
    opt_to['saturation'] = this.getSaturation();
    opt_to['sharpness'] = this.getSharpness();
    opt_to['minResolution'] = this.getMinResolution();
    opt_to['maxResolution'] = this.getMaxResolution();
    opt_to['groupId'] = this.getGroupId();
    opt_to['groupLabel'] = this.getGroupLabel();

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    if (config['id'] != null) {
      this.setId(config['id']);
    }

    if (config['provider'] != null) {
      this.setProvider(config['provider']);
    }

    if (config['tags'] != null) {
      this.setTags(config['tags']);
    }

    if (config['title'] != null) {
      this.setTitle(config['title']);
    }

    if (config['layerType'] != null) {
      this.setOSType(config['layerType']);
    }

    if (config['explicitType'] != null) {
      this.setExplicitType(config['explicitType']);
    }

    if (config['visible'] != null) {
      this.setLayerVisible(config['visible']);
    }

    var opacity = config['alpha'] || config['opacity'];
    if (opacity != null) {
      this.setOpacity(opacity);
    }

    if (config['contrast'] != null) {
      this.setContrast(config['contrast']);
    }

    if (config['brightness'] != null) {
      this.setBrightness(config['brightness']);
    }

    if (config['saturation'] != null) {
      this.setSaturation(config['saturation']);
    }

    if (config['sharpness'] != null) {
      this.setSharpness(config['sharpness']);
    }

    if (config['groupId'] != null) {
      this.groupId_ = /** @type {string} */ (config['groupId']);
    }

    if (config['groupLabel'] != null) {
      this.groupLabel_ = /** @type {string} */ (config['groupLabel']);
    }

    this.setMinResolution(config['minResolution'] || this.getMinResolution());
    this.setMaxResolution(config['maxResolution'] || this.getMaxResolution());
  }
}

osImplements(Image, ILayer.ID);
osImplements(Image, IGroupable.ID);

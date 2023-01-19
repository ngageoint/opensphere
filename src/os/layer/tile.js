goog.declareModuleId('os.layer.Tile');

import {listen} from 'ol/src/events.js';
import {createEmpty, isEmpty} from 'ol/src/extent.js';
import Property from 'ol/src/layer/Property.js';
import OLTileLayer from 'ol/src/layer/Tile.js';
import TileImage from 'ol/src/source/TileImage.js';
import UrlTile from 'ol/src/source/UrlTile.js';

import '../mixin/tileimagemixin.js';
import '../mixin/urltilemixin.js';
import EventType from '../action/eventtype.js';
import * as osColor from '../color.js';
import DataManager from '../data/datamanager.js';
import * as dispatcher from '../dispatcher.js';
import LayerEvent from '../events/layerevent.js';
import LayerEventType from '../events/layereventtype.js';
import PropertyChangeEvent from '../events/propertychangeevent.js';
import {reduceExtentFromLayers} from '../fn/fn.js';
import IGroupable from '../igroupable.js';
import osImplements from '../implements.js';
import ILegendRenderer from '../legend/ilegendrenderer.js';
import {drawTileLayer} from '../legend/legend.js';
import * as osMap from '../map/map.js';
import {precision} from '../math/math.js';
import {DEFAULT_TILE_STYLE} from '../ogc/ogc.js';
import registerClass from '../registerclass.js';
import IStyle from '../source/istylesource.js';
import SourcePropertyChange from '../source/propertychange.js';
import {isStateFile} from '../state/state.js';
import {notifyStyleChange} from '../style/style.js';
import TimeInstant from '../time/timeinstant.js';
import {adjustIconSet, createIconSet} from '../ui/icons/index.js';
import Icons from '../ui/icons.js';
import IconsSVG from '../ui/iconssvg.js';
import {directiveTag as layerUi} from '../ui/layer/tilelayerui.js';
import {directiveTag as nodeUi} from '../ui/node/defaultlayernodeui.js';
import {launchRenameDialog} from '../ui/renamelayer.js';
import ExplicitLayerType from './explicitlayertype.js';
import IColorableLayer from './icolorablelayer.js';
import ILayer from './ilayer.js';
import {identifyLayer} from './layer.js';
import LayerClass from './layerclass.js';
import LayerType from './layertype.js';
import PropertyChange from './propertychange.js';
import SynchronizerType from './synchronizertype.js';

const {assert} = goog.require('goog.asserts');
const GoogEventType = goog.require('goog.events.EventType');
const {getRandomString} = goog.require('goog.string');

const {TileFilterFn} = goog.requireType('os.tile');


/**
 * @implements {ILayer}
 * @implements {IColorableLayer}
 * @implements {IGroupable}
 * @implements {ILegendRenderer}
 */
export default class Tile extends OLTileLayer {
  /**
   * Constructor.
   * @param {olx.layer.TileOptions} options Tile layer options
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
    this.osType_ = LayerType.TILES;

    /**
     * @type {string}
     * @private
     */
    this.explicitType_ = ExplicitLayerType.TILES;

    /**
     * @type {!string}
     * @private
     */
    this.title_ = 'New Layer';

    /**
     * @type {boolean}
     * @private
     */
    this.error_ = false;

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
     * @type {Object<string, *>}
     * @private
     */
    this.layerOptions_ = null;

    /**
     * The current layer style.
     * @type {?osx.ogc.TileStyle}
     * @private
     */
    this.style_ = null;

    /**
     * @type {?Array<!osx.ogc.TileStyle>}
     * @private
     */
    this.styles_ = null;

    /**
     * @type {!string}
     * @private
     */
    this.nodeUI_ = `<${nodeUi}></${nodeUi}>`;

    /**
     * @type {!string}
     * @private
     */
    this.layerUi_ = layerUi;

    /**
     * @type {?string}
     * @private
     */
    this.syncType_ = SynchronizerType.TILE;

    /**
     * @type {boolean}
     * @private
     */
    this.hidden_ = false;

    /**
     * @type {TileFilterFn}
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

    this.propertyChangeListenKey_ = null;

    var source = this.getSource();
    if (source) {
      this.propertyChangeListenKey_ = listen(source, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);
    }
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    var source = this.getSource();
    if (source) {
      source.dispose();
    }
  }

  /**
   * @inheritDoc
   */
  setMinResolution(value) {
    var source = this.getSource();
    if (source) {
      // If you don't suppress the event for this set, you'll get an infinite, asynchronous
      // loop with the layer UI. Debugging that was fun. Like "shaving your head with a cheese
      // grater" fun.
      source.set(Property.MIN_RESOLUTION, value, true);
    }

    super.setMinResolution(value);
  }

  /**
   * @inheritDoc
   */
  setMaxResolution(value) {
    // OL treats max resolution as an exclusive value and we want it to be inclusive. determine value to add based on
    // the decimal precision, since it may vary by OS/browser.
    if (isFinite(value)) {
      var resolutionPrecision = precision(value);
      value = value + Math.pow(10, -resolutionPrecision);
    }

    var source = this.getSource();
    if (source) {
      // If you don't suppress the event for this set, you'll get an infinite, asynchronous
      // loop with the layer UI. Debugging that was fun. Like "shaving your head with a cheese
      // grater" fun.
      source.set(Property.MAX_RESOLUTION, value, true);
    }

    super.setMaxResolution(value);
  }

  /**
   * Update icons to use the current layer color.
   *
   * @private
   */
  updateIcons_() {
    var color = this.getColor();
    if (color) {
      adjustIconSet(this.getId(), osColor.toHexString(color));
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
      } else if (p == SourcePropertyChange.REFRESH_INTERVAL) {
        var e = new PropertyChangeEvent(PropertyChange.REFRESH_INTERVAL, event.getNewValue(),
            event.getOldValue());
        this.dispatchEvent(e);
      }
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
   * Get the default color for the tile layer.
   *
   * @return {?string}
   */
  getDefaultColor() {
    if (this.layerOptions_) {
      return /** @type {string} */ (this.layerOptions_['baseColor']);
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getColor() {
    if (this.layerOptions_) {
      return /** @type {string} */ (this.layerOptions_['color'] || this.layerOptions_['baseColor']);
    }

    return null;
  }

  /**
   * Get the brightness for the tile layer.
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
   * Get the contrast for the tile layer.
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
   * Get the saturation for the tile layer.
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
   * Get the sharpness for the tile layer.
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
   * Get the whether the tile layer is being colorized.
   *
   * @return {boolean}
   */
  getColorize() {
    if (this.layerOptions_) {
      return /** @type {boolean} */ (this.layerOptions_['colorize']) || false;
    }

    return false;
  }

  /**
   * Get the whether the tile layer is being colorized.
   *
   * @param {boolean} value
   */
  setColorize(value) {
    if (this.layerOptions_) {
      this.layerOptions_['colorize'] = value;
      this.updateColorFilter();

      notifyStyleChange(this);
    }
  }

  /**
   * @inheritDoc
   */
  setColor(value, opt_options) {
    var options = opt_options || this.layerOptions_;
    if (options) {
      if (value && typeof value == 'string') {
        options['color'] = osColor.toHexString(value);
      } else {
        // color was reset, so use the original
        options['color'] = null;
      }

      this.updateColorFilter();
      this.updateIcons_();

      notifyStyleChange(this);
    }
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
      this.updateIcons_();
      notifyStyleChange(this);
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
      this.updateIcons_();
      notifyStyleChange(this);
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
      this.updateIcons_();
      notifyStyleChange(this);
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
      this.updateIcons_();
      notifyStyleChange(this);
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
    if (source instanceof TileImage) {
      if (this.getColorize() || !osColor.equals(this.getColor(), this.getDefaultColor()) ||
          this.getBrightness() != 0 || this.getContrast() != 1 || this.getSaturation() != 1 ||
          this.getSharpness() != 0) {
        // put the colorFilter in place if we are colorized or the current color is different from the default
        source.addTileFilter(this.colorFilter_);
      } else {
        source.removeTileFilter(this.colorFilter_);
      }
    }
  }

  /**
   * Filter function that applies the layer color tile image data. This filter is always in the filter array, but it
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

    var srcColor = this.getDefaultColor() || '#fffffe';
    var tgtColor = this.getColor() || '#fffffe';
    var brightness = this.getBrightness();
    var contrast = this.getContrast();
    var saturation = this.getSaturation();
    var sharpness = this.getSharpness();
    var colorize = this.getColorize();
    if (colorize || !osColor.equals(srcColor, tgtColor) ||
        brightness != 0 || contrast != 1 || saturation != 1 || sharpness != 0) {
      if (tgtColor) {
        if (colorize) {
          // colorize will set all of the colors to the target
          osColor.colorize(data, tgtColor);
        } else if (!osColor.equals(srcColor, tgtColor)) {
          // transformColor blends between the src and target color, leaving densitization intact
          osColor.transformColor(data, srcColor, tgtColor);
        }
        osColor.adjustColor(data, brightness, contrast, saturation);

        if (sharpness > 0) {
          // sharpness is in the range [0, 1]. use a multiplier to enhance the convolution effect.
          osColor.adjustSharpness(data, width, height, sharpness * 2);
        }
      }
    }
  }

  /**
   * @return {?Array<!osx.ogc.TileStyle>}
   */
  getStyles() {
    return this.styles_;
  }

  /**
   * @param {?Array<!osx.ogc.TileStyle>} value
   */
  setStyles(value) {
    this.styles_ = value;
  }

  /**
   * Get the default server style.
   *
   * @return {?osx.ogc.TileStyle}
   */
  getDefaultStyle() {
    if (this.styles_) {
      for (var i = 0; i < this.styles_.length; i++) {
        if (this.styles_[i].label == DEFAULT_TILE_STYLE.label) {
          return this.styles_[i];
        }
      }
    }

    return null;
  }

  /**
   * @return {?(string|osx.ogc.TileStyle)}
   */
  getStyle() {
    var style = this.style_;
    if (!style) {
      var source = this.getSource();

      if (osImplements(source, IStyle.ID)) {
        style = /** @type {IStyle} */ (source).getStyle();
        var styles = this.getStyles();

        if (styles) {
          // find style in styles and return that
          for (var i = 0, n = styles.length; i < n; i++) {
            if (styles[i].data == style) {
              return styles[i];
            }
          }
        }
      }
    }

    return style;
  }

  /**
   * @param {?(string|osx.ogc.TileStyle)} value
   */
  setStyle(value) {
    if (typeof value == 'string') {
      value = this.styles_ ? (this.styles_.find(Tile.findStyleByData.bind(null, value)) || null) : null;
    }

    this.style_ = value;

    var source = this.getSource();
    if (osImplements(source, IStyle.ID)) {
      /** @type {IStyle} */ (source).setStyle(value);
      notifyStyleChange(this);
    }
  }

  /**
   * @inheritDoc
   */
  getIcons() {
    var color;

    var html = '';
    if (this.error_) {
      html += '<i class="fa fa-warning text-warning" title="There were errors accessing the tiles for this layer"></i>';
    }

    var layerColor = this.getColor();
    if (layerColor) {
      color = osColor.toRgbArray(layerColor);
    }

    html += color ? createIconSet(this.getId(), this.getSVGIconsInternal(), this.getStateBadge(), color) :
      this.getIconsInternal();
    return html;
  }

  /**
   * @return {Array<string>}
   * @protected
   */
  getStateBadge() {
    if (isStateFile(this.getId())) {
      return [Icons.STATE];
    } else {
      return null;
    }
  }

  /**
   * @return {Array<string>}
   * @protected
   */
  getSVGIconsInternal() {
    return [IconsSVG.TILES];
  }

  /**
   * @return {string}
   * @protected
   */
  getIconsInternal() {
    return Icons.TILES;
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
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ENABLED, value, !value));
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

      var source = this.getSource();
      if (source instanceof UrlTile) {
        var error = source.hasError();

        if (error !== this.error_) {
          this.error_ = error;
          this.dispatchEvent(new PropertyChangeEvent(PropertyChange.ERROR, this.error_, !this.error_));
        }
      }
    }
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
    this.dispatchEvent(new PropertyChangeEvent(PropertyChange.TITLE, value));
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
   * @return {boolean} Whether or not the layer is in error
   */
  getError() {
    return this.error_;
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
  getNodeUI() {
    return this.nodeUI_;
  }

  /**
   * @inheritDoc
   */
  setNodeUI(value) {
    this.nodeUI_ = value;
  }

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
  getLayerVisible() {
    // always use the inherited OpenLayers value
    return OLTileLayer.prototype.getVisible.call(this);
  }

  /**
   * @inheritDoc
   */
  setLayerVisible(value) {
    if (value !== this.getLayerVisible()) {
      this.setVisible(value);
      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.VISIBLE, value, !value));
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
  callAction(type) {
    var source = this.getSource();

    switch (type) {
      case EventType.IDENTIFY:
        this.identify();
        break;
      case EventType.MOST_RECENT:
        DataManager.getInstance().setTimeFromDescriptor(this.getId());
        break;
      case EventType.REFRESH:
        source.refresh();
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
   * @inheritDoc
   */
  getGroupUI() {
    return null;
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
      case EventType.SHOW_DESCRIPTION:
        return true;
      case EventType.RENAME:
        return !!opt_actionArgs && goog.isArrayLike(opt_actionArgs) && opt_actionArgs.length === 1;
      case EventType.MOST_RECENT:
        // only enable if descriptor exists and max date is greater than 0
        var desc = DataManager.getInstance().getDescriptor(this.getId());
        if (desc != null) {
          var maxDate = desc.getMaxDate();
          return maxDate > 0 && maxDate < TimeInstant.MAX_TIME;
        }

        break;
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
  getSynchronizerType() {
    return this.syncType_;
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
   */
  renderLegend(options) {
    // use default tile layer legend renderer
    drawTileLayer(this, options);
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
    opt_to['color'] = this.getColor();
    opt_to['colorize'] = this.getColorize();
    opt_to['groupId'] = this.getGroupId();
    opt_to['groupLabel'] = this.getGroupLabel();

    // we now store min and max zoom rather than resolution because the resolutions can change
    // drastically if the user or admin switches the default projection (resulting in the layer
    // being basically invisible)
    var tilegrid = this.getSource().getTileGrid();

    var config = this.getLayerOptions();
    var offset = /** @type {number} */ (config ? config['zoomOffset'] || 0 : 0);

    opt_to['maxZoom'] = Math.min(osMap.MAX_ZOOM, tilegrid.getZForResolution(this.getMinResolution()) - offset);
    opt_to['minZoom'] = Math.max(osMap.MIN_ZOOM, tilegrid.getZForResolution(this.getMaxResolution()) - offset);

    var style = this.getStyle();
    if (style) {
      opt_to['style'] = typeof style === 'string' ? style : style.data;
    }

    var source = this.getSource();
    if (source && source instanceof UrlTile) {
      opt_to['refreshInterval'] = source.getRefreshInterval();
    }

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

    if (config['color']) {
      var color = /** @type {string} */ (config['color']);
      this.setColor(color, config);
    }

    if (config['colorize']) {
      var colorize = /** @type {boolean} */ (config['colorize']);
      this.setColorize(colorize);
    }

    if (config['refreshInterval'] !== undefined) {
      var source = this.getSource();
      if (source && source instanceof UrlTile) {
        source.setRefreshInterval(/** @type {number} */ (config['refreshInterval']));
      }
    }

    if (config['groupId'] != null) {
      this.groupId_ = /** @type {string} */ (config['groupId']);
    }

    if (config['groupLabel'] != null) {
      this.groupLabel_ = /** @type {string} */ (config['groupLabel']);
    }

    // A layer's min/max resolution depends directly on its own tile grid.
    //
    // Do not use MapContainer.zoomToResolution here. That is for overall map/view
    // purposes and not for individual layers, which may have discrete tile matrices.
    var offset = config['zoomOffset'] || 0;
    var grid = this.getSource().getTileGrid();
    var tgMin = grid.getMinZoom();
    var tgMax = grid.getMaxZoom();

    if (config['minZoom'] != null) {
      var z = Math.min(tgMax, Math.max(tgMin, Math.round(config['minZoom']) + offset));
      this.setMaxResolution(grid.getResolution(z));
    }

    if (config['maxZoom'] != null) {
      z = Math.min(tgMax, Math.max(tgMin, Math.round(config['maxZoom']) + offset));
      this.setMinResolution(grid.getResolution(z));
    }

    var style = config['style'] || '';
    var currStyle = this.getStyle();

    if (!currStyle || (typeof currStyle === 'string' && style != currStyle) || style != currStyle.data) {
      this.setStyle(style);
    }
  }

  /**
   * @param {string} data The style data
   * @param {!osx.ogc.TileStyle} style The style
   * @return {boolean}
   */
  static findStyleByData(data, style) {
    return style.data == data;
  }
}

osImplements(Tile, ILayer.ID);
osImplements(Tile, IColorableLayer.ID);
osImplements(Tile, IGroupable.ID);
osImplements(Tile, ILegendRenderer.ID);
registerClass(LayerClass.TILE, Tile);

goog.declareModuleId('os.ui.layer.compare.LayerCompareNode');

import {listen, unlistenByKey} from 'ol/src/events.js';

import {instanceOf} from '../../../classregistry.js';
import {toRgbArray} from '../../../color.js';
import PropertyChangeEvent from '../../../events/propertychangeevent.js';
import osImplements from '../../../implements.js';
import ILayerProvider from '../../../layer/ilayerprovider.js';
import LayerClass from '../../../layer/layerclass.js';
import LayerGroup from '../../../layer/layergroup.js';
import LayerPropertyChange from '../../../layer/propertychange.js';
import Tile from '../../../layer/tile.js';
import TriState from '../../../structs/tristate.js';
import {getConfigColor} from '../../../style/style.js';
import StyleManager from '../../../style/stylemanager.js';
import {createIconSet} from '../../icons/index.js';
import IconsSVG from '../../iconssvg.js';
import {directiveTag as featureCount} from '../../node/featurecount.js';
import {directiveTag as layerType} from '../../node/layertype.js';
import {directiveTag as tileLoading} from '../../node/tileloading.js';
import SlickTreeNode from '../../slick/slicktreenode.js';
import {directiveTag as layerVisibility} from '../layervisibility.js';

const GoogEventType = goog.require('goog.events.EventType');

const {default: IExtent} = goog.requireType('os.data.IExtent');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: VectorLayer} = goog.requireType('os.layer.Vector');


/**
 * Tree node for representing layers being compared.
 * @implements {IExtent}
 * @implements {ILayerProvider}
 */
export default class LayerCompareNode extends SlickTreeNode {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // hide the node toggle to save space on the left, this tree is meant to be flat anyway.
    this.setNodetoggleVisible(false);
    this.childrenAllowed = false;

    /**
     * @type {ILayer}
     * @private
     */
    this.layer_ = null;

    this.listenKey = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.setLayer(null);
  }

  /**
   * @inheritDoc
   */
  getExtent() {
    let extent = null;
    const layer = this.getLayer();

    if (instanceOf(layer, LayerClass.VECTOR)) {
      extent = /** @type {VectorLayer} */ (layer).getSource().getExtent();
    }

    return extent;
  }

  /**
   * @inheritDoc
   */
  setState(value) {
    const children = this.getChildren();
    if (value !== TriState.BOTH || (children && children.length)) {
      const old = this.getState();
      super.setState(value);
      const s = this.getState();

      if (old != s && value !== TriState.BOTH && this.layer_) {
        this.layer_.setEnabled(s !== TriState.OFF);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * @inheritDoc
   */
  formatCheckbox() {
    return `<${layerVisibility} class="c-glyph"></${layerVisibility}>`;
  }

  /**
   * Sets the layer.
   * @param {ILayer} value
   */
  setLayer(value) {
    if (value !== this.layer_) {
      if (this.layer_) {
        unlistenByKey(this.listenKey);
      }

      this.layer_ = value;

      if (value) {
        this.listenKey = listen(/** @type {events.EventTarget} */ (value), GoogEventType.PROPERTYCHANGE,
            this.onPropertyChange, this);
        this.setLabel(value.getTitle());
        this.setToolTip(value.getTitle());
        this.setState(value.isEnabled() ? TriState.ON : TriState.OFF);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return this.layer_ ? this.layer_.getTitle() : this.getId();
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    const isVector = instanceOf(this.layer_, LayerClass.VECTOR);
    const id = this.layer_.getId();

    if (isVector) {
      const icons = [IconsSVG.FEATURES];
      const config = StyleManager.getInstance().getLayerConfig(id);

      if (config) {
        const color = getConfigColor(config, true);
        if (color) {
          return createIconSet(id, icons, [], color);
        }
      }
    } else if (this.layer_ instanceof Tile) {
      const icons = [IconsSVG.TILES];
      const layerColor = /** {Tile} */ (this.layer_).getColor();
      let color = [255, 255, 255, 1];
      if (layerColor) {
        color = toRgbArray(layerColor);
      }

      return createIconSet(id, icons, [], color);
    }

    return super.formatIcons();
  }

  /**
   * Whether or not the layer is loading
   * @return {boolean}
   * @export
   */
  isLoading() {
    if (this.layer_) {
      return this.layer_.isLoading();
    }

    return false;
  }

  /**
   * Handles changes on the layer
   * @param {PropertyChangeEvent} e The event
   * @protected
   */
  onPropertyChange(e) {
    if (e instanceof PropertyChangeEvent) {
      const p = e.getProperty();
      switch (p) {
        case LayerPropertyChange.LOADING:
          this.dispatchEvent(new PropertyChangeEvent('loading', e.getOldValue(), e.getNewValue()));
          break;
        case LayerPropertyChange.ENABLED:
          // force the checkbox to update
          this.setState(e.getNewValue() ? TriState.ON : TriState.OFF);
          // update the label (styled differently when disabled/hidden)
          this.dispatchEvent(new PropertyChangeEvent('label'));
          break;
        case LayerPropertyChange.VISIBLE:
          // update the label (styled differently when disabled/hidden)
          this.dispatchEvent(new PropertyChangeEvent('label'));
          break;
        case LayerPropertyChange.TITLE:
          // change the label
          this.setLabel(this.layer_.getTitle());
          this.dispatchEvent(new PropertyChangeEvent('label'));
          break;
        case LayerPropertyChange.COLOR_MODEL:
        case LayerPropertyChange.ICONS:
        case LayerPropertyChange.STYLE:
          // updates icons on the node
          this.dispatchEvent(new PropertyChangeEvent('icons'));
          break;
        default:
          break;
      }
    }
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    this.setLayer(/** @type {LayerCompareNode} */ (other).getLayer());
    super.updateFrom(other);
  }

  /**
   * @inheritDoc
   */
  formatLabel(value) {
    let labelClass = 'text-truncate flex-fill';
    if (this.layer_ && (!this.layer_.isEnabled() || !this.layer_.getLayerVisible())) {
      // if the layer is disabled/hidden, adjust the style to indicate the change
      labelClass += ' text-muted';
    }

    return `<span class="${labelClass}">${this.formatValue(value)}</span>`;
  }

  /**
   * @inheritDoc
   */
  formatValue(value) {
    let s = super.formatValue(value);
    const layer = this.getLayer();

    if (layer instanceof LayerGroup) {
      s += ' (' + this.getLayer().getProvider() + ')';
    } else {
      s += ` <${layerType}></${layerType}>`;

      if (instanceOf(layer, LayerClass.VECTOR)) {
        s += ` <${featureCount}></${featureCount}>`;
      } else if (instanceOf(layer, LayerClass.TILE)) {
        s += ` <${tileLoading}></${tileLoading}>`;
      }
    }

    return s;
  }
}

osImplements(LayerCompareNode, ILayerProvider.ID);

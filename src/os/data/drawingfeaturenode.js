goog.declareModuleId('os.data.DrawingFeatureNode');

import CircleStyle from 'ol/src/style/Circle.js';
import RegularShape from 'ol/src/style/RegularShape.js';

import '../mixin/objectmixin.js';
import {registerClass} from '../classregistry.js';
import * as osFeature from '../feature/feature.js';
import osImplements from '../implements.js';
import TriState from '../structs/tristate.js';
import * as osStyle from '../style/style.js';
import StyleField from '../style/stylefield.js';
import StyleType from '../style/styletype.js';
import IMenuSupplier from '../ui/menu/imenusupplier.js';
import * as spatial from '../ui/menu/spatial.js';
import {directiveTag as nodeUi} from '../ui/node/drawingfeaturenodeui.js';
import SlickTreeNode from '../ui/slick/slicktreenode.js';
import {NodeClass} from './data.js';



/**
 * @implements {IMenuSupplier}
 */
export default class DrawingFeatureNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {!ol.Feature} feature The feature
   */
  constructor(feature) {
    super();
    this.nodeUI = `<${nodeUi}></${nodeUi}>`;

    /**
     * @type {ol.Feature}
     * @private
     */
    this.feature_ = null;

    /**
     * If the feature has its own style configuration.
     * @type {boolean}
     * @private
     */
    this.hasFeatureConfig_ = false;

    this.setFeature(feature);
  }

  /**
   * @inheritDoc
   */
  getMenu() {
    return spatial.getMenu();
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  setState(state) {
    super.setState(state);

    if (this.feature_) {
      var layer = osFeature.getLayer(this.feature_);
      var source = /** @type {ol.source.Vector} */ (layer.getSource());

      if (this.getState() === TriState.OFF) {
        this.feature_.values_[StyleField.OPACITY] = 0;

        if (this.hasFeatureConfig_) {
          // remove the highlight config or it will replace the opacity on the merged config
          this.feature_.unset(StyleType.HIGHLIGHT, true);
        }

        osStyle.setFeatureStyle(this.feature_);
      } else {
        this.feature_.values_[StyleField.OPACITY] = undefined;
        if (this.hasFeatureConfig_) {
          osStyle.setFeatureStyle(this.feature_);
        } else {
          this.feature_.setStyle(/** @type {Array<ol.style.Style>} */ (
            this.feature_.get(DrawingFeatureNode.ORIGINAL_STYLE)));
        }
      }

      osFeature.update(this.feature_, source);
    }
  }

  /**
   * @return {ol.Feature} The feature
   */
  getFeature() {
    return this.feature_;
  }

  /**
   * Set the feature for the node.
   *
   * @param {!ol.Feature} feature The feature.
   */
  setFeature(feature) {
    if (this.feature_ !== feature) {
      this.feature_ = feature;
      this.feature_.enableEvents();

      // if the feature has a style config, the style can be manipulated more easily and we don't need to save off the
      // Openlayers style.
      var featureConfig = feature.get(StyleType.FEATURE);
      if (!featureConfig) {
        var key = DrawingFeatureNode.ORIGINAL_STYLE;

        if (!this.feature_.get(key)) {
          var style = this.feature_.getStyle();
          this.feature_.set(key, Array.isArray(style) ? style : [style], true);
        }
      }
    }

    // always update, in case the feature changed
    this.updateFromFeature();
  }

  /**
   * Update the node from the current feature.
   *
   * @protected
   */
  updateFromFeature() {
    var feature = this.feature_;
    if (feature) {
      this.hasFeatureConfig_ = !!feature.get(StyleType.FEATURE);

      this.setLabel(/** @type {!string} */ (
        feature.get('title') || feature.get('label') || feature.get('name') || String(feature.getId())));

      var opacity = /** @type {number|undefined} */ (feature.get(StyleField.OPACITY));
      this.setState(opacity === 0 ? TriState.OFF : TriState.ON);
    }
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    if (this.feature_) {
      var val = this.feature_.get('icons') || this.feature_.get('icon') || '';
      return /** @type {!string} */ (val);
    }

    return '';
  }

  /**
   * @inheritDoc
   */
  onMouseEnter() {
    if (!this.feature_) {
      return;
    }

    if (this.getState() !== TriState.OFF) {
      if (this.hasFeatureConfig_) {
        // add a highlight config and refresh the style
        this.feature_.set(StyleType.HIGHLIGHT, osStyle.DEFAULT_HIGHLIGHT_CONFIG, true);
        osStyle.setFeatureStyle(this.feature_);
      } else {
        // modify the Openlayers style to highlight the feature
        var originalStyle = /** @type {Array<ol.style.Style>} */ (
          this.feature_.get(DrawingFeatureNode.ORIGINAL_STYLE));
        var style = originalStyle.map(DrawingFeatureNode.mapStyles_);
        this.feature_.setStyle(style);
      }

      var layer = osFeature.getLayer(this.feature_);
      if (layer) {
        osStyle.notifyStyleChange(layer, [this.feature_]);
      }
    }
  }

  /**
   * @inheritDoc
   */
  onMouseLeave() {
    if (!this.feature_) {
      return;
    }

    if (this.getState() !== TriState.OFF) {
      if (this.hasFeatureConfig_) {
        // clear the highlight config and update the style
        this.feature_.unset(StyleType.HIGHLIGHT, true);
        osStyle.setFeatureStyle(this.feature_);
      } else {
        // replace the style with the original
        this.feature_.setStyle(/** @type {Array<ol.style.Style>} */ (
          this.feature_.get(DrawingFeatureNode.ORIGINAL_STYLE)));
      }

      var layer = osFeature.getLayer(this.feature_);
      if (layer) {
        osStyle.notifyStyleChange(layer, [this.feature_]);
      }
    }
  }

  /**
   * Maps a style to a highlight style
   *
   * @param {ol.style.Style} s The style to highlight
   * @return {ol.style.Style} The highlighted style
   * @private
   */
  static mapStyles_(s) {
    if (s) {
      s = s.clone();

      var fillColor = [0, 0xff, 0xff, 0.5];
      var strokeColor = [0, 0xff, 0xff, 1.0];

      var stroke;
      var fill;
      var image = s.getImage();

      if (image instanceof CircleStyle || image instanceof RegularShape) {
        var fillable = /** @type {ol.style.Circle|ol.style.RegularShape} */ (image);
        fill = fillable.getFill();

        if (fill) {
          fill.setColor(fillColor);
        }

        stroke = fillable.getStroke();
        if (stroke) {
          stroke.setColor(strokeColor);
        }
      }

      stroke = s.getStroke();
      if (stroke) {
        stroke.setColor(strokeColor);
      }

      fill = s.getFill();
      if (fill) {
        fill.setColor(fillColor);
      }

      return s;
    }

    return null;
  }
}

osImplements(DrawingFeatureNode, IMenuSupplier.ID);
registerClass(NodeClass.DRAW_FEATURE, DrawingFeatureNode);

/**
 * @type {string}
 * @const
 */
DrawingFeatureNode.ORIGINAL_STYLE = '_originalStyle';

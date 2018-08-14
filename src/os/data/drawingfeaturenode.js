goog.provide('os.data.DrawingFeatureNode');

goog.require('os.ui.menu.IMenuSupplier');
goog.require('os.ui.menu.spatial');
goog.require('os.ui.node.drawingFeatureNodeUIDirective');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * @param {!ol.Feature} feature The feature
 * @extends {os.ui.slick.SlickTreeNode}
 * @implements {os.ui.menu.IMenuSupplier}
 * @constructor
 */
os.data.DrawingFeatureNode = function(feature) {
  os.data.DrawingFeatureNode.base(this, 'constructor');
  this.nodeUI = '<drawingfeaturenodeui></drawingfeaturenodeui>';

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
};
goog.inherits(os.data.DrawingFeatureNode, os.ui.slick.SlickTreeNode);
os.implements(os.data.DrawingFeatureNode, os.ui.menu.IMenuSupplier.ID);


/**
 * @type {string}
 * @const
 */
os.data.DrawingFeatureNode.ORIGINAL_STYLE = '_originalStyle';


/**
 * @inheritDoc
 */
os.data.DrawingFeatureNode.prototype.getMenu = function() {
  return os.ui.menu.SPATIAL;
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.data.DrawingFeatureNode.prototype.setState = function(state) {
  os.data.DrawingFeatureNode.base(this, 'setState', state);

  if (this.feature_) {
    var layer = os.feature.getLayer(this.feature_);
    var source = /** @type {ol.source.Vector} */ (layer.getSource());

    if (this.getState() === os.structs.TriState.OFF) {
      this.feature_.values_[os.style.StyleField.OPACITY] = 0;

      if (this.hasFeatureConfig_) {
        // remove the highlight config or it will replace the opacity on the merged config
        this.feature_.unset(os.style.StyleType.HIGHLIGHT, true);
      }

      os.style.setFeatureStyle(this.feature_);
    } else {
      this.feature_.values_[os.style.StyleField.OPACITY] = undefined;
      if (this.hasFeatureConfig_) {
        os.style.setFeatureStyle(this.feature_);
      } else {
        this.feature_.setStyle(/** @type {Array<ol.style.Style>} */ (
            this.feature_.get(os.data.DrawingFeatureNode.ORIGINAL_STYLE)));
      }
    }

    os.feature.update(this.feature_, source);
  }
};


/**
 * @return {ol.Feature} The feature
 */
os.data.DrawingFeatureNode.prototype.getFeature = function() {
  return this.feature_;
};


/**
 * Set the feature for the node.
 * @param {!ol.Feature} feature The feature.
 */
os.data.DrawingFeatureNode.prototype.setFeature = function(feature) {
  if (this.feature_ !== feature) {
    this.feature_ = feature;
    this.feature_.enableEvents();

    // if the feature has a style config, the style can be manipulated more easily and we don't need to save off the
    // Openlayers style.
    var featureConfig = feature.get(os.style.StyleType.FEATURE);
    if (!featureConfig) {
      var key = os.data.DrawingFeatureNode.ORIGINAL_STYLE;

      if (!this.feature_.get(key)) {
        var style = this.feature_.getStyle();
        this.feature_.set(key, goog.isArray(style) ? style : [style], true);
      }
    }
  }

  // always update, in case the feature changed
  this.updateFromFeature();
};


/**
 * Update the node from the current feature.
 * @protected
 */
os.data.DrawingFeatureNode.prototype.updateFromFeature = function() {
  var feature = this.feature_;
  if (feature) {
    this.hasFeatureConfig_ = !!feature.get(os.style.StyleType.FEATURE);

    this.setLabel(/** @type {!string} */ (
        feature.get('title') || feature.get('label') || feature.get('name') || String(feature.getId())));

    var opacity = /** @type {number|undefined} */ (feature.get(os.style.StyleField.OPACITY));
    this.setState(opacity === 0 ? os.structs.TriState.OFF : os.structs.TriState.ON);
  }
};


/**
 * @inheritDoc
 */
os.data.DrawingFeatureNode.prototype.formatIcons = function() {
  if (this.feature_) {
    var val = this.feature_.get('icons') || this.feature_.get('icon') || '';
    return /** @type {!string} */ (val);
  }

  return '';
};


/**
 * @inheritDoc
 */
os.data.DrawingFeatureNode.prototype.onMouseEnter = function() {
  if (!this.feature_) {
    return;
  }

  if (this.getState() !== os.structs.TriState.OFF) {
    if (this.hasFeatureConfig_) {
      // add a highlight config and refresh the style
      this.feature_.set(os.style.StyleType.HIGHLIGHT, os.style.DEFAULT_HIGHLIGHT_CONFIG, true);
      os.style.setFeatureStyle(this.feature_);
    } else {
      // modify the Openlayers style to highlight the feature
      var originalStyle = /** @type {Array<ol.style.Style>} */ (
          this.feature_.get(os.data.DrawingFeatureNode.ORIGINAL_STYLE));
      var style = originalStyle.map(os.data.DrawingFeatureNode.mapStyles_);
      this.feature_.setStyle(style);
    }

    var layer = os.feature.getLayer(this.feature_);
    if (layer) {
      os.style.notifyStyleChange(layer, [this.feature_]);
    }
  }
};


/**
 * Maps a style to a highlight style
 * @param {ol.style.Style} s The style to highlight
 * @return {ol.style.Style} The highlighted style
 * @private
 */
os.data.DrawingFeatureNode.mapStyles_ = function(s) {
  if (s) {
    s = s.clone();

    var fillColor = [0, 0xff, 0xff, 0.5];
    var strokeColor = [0, 0xff, 0xff, 1.0];

    var stroke;
    var fill;
    var image = s.getImage();

    if (image instanceof ol.style.Circle || image instanceof ol.style.RegularShape) {
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
};


/**
 * @inheritDoc
 */
os.data.DrawingFeatureNode.prototype.onMouseLeave = function() {
  if (!this.feature_) {
    return;
  }

  if (this.getState() !== os.structs.TriState.OFF) {
    if (this.hasFeatureConfig_) {
      // clear the highlight config and update the style
      this.feature_.unset(os.style.StyleType.HIGHLIGHT, true);
      os.style.setFeatureStyle(this.feature_);
    } else {
      // replace the style with the original
      this.feature_.setStyle(/** @type {Array<ol.style.Style>} */ (
          this.feature_.get(os.data.DrawingFeatureNode.ORIGINAL_STYLE)));
    }

    var layer = os.feature.getLayer(this.feature_);
    if (layer) {
      os.style.notifyStyleChange(layer, [this.feature_]);
    }
  }
};

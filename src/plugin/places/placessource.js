goog.module('plugin.places.PlacesSource');
goog.module.declareLegacyNamespace();

const osFeature = goog.require('os.feature');
const interpolate = goog.require('os.interpolate');
const track = goog.require('os.track');
const KMLSource = goog.require('plugin.file.kml.KMLSource');
const {updatePlacemark} = goog.require('plugin.file.kml.ui');


/**
 * Vector source to manage places created in the application. Also adds specialized handling for tracks.
 */
class PlacesSource extends KMLSource {
  /**
   * Constructor.
   * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
   */
  constructor(opt_options) {
    super(opt_options);

    // don't allow refreshing the places layer - it won't do anything useful
    this.refreshEnabled = false;
  }

  /**
   * @inheritDoc
   */
  supportsModify() {
    return true;
  }

  /**
   * @inheritDoc
   */
  getModifyFunction() {
    return (originalFeature, modifiedFeature) => {
      const node = this.getFeatureNode(originalFeature);

      if (node) {
        originalFeature.setGeometry(modifiedFeature.getGeometry());
        originalFeature.unset(interpolate.ORIGINAL_GEOM_FIELD, true);
        interpolate.interpolateFeature(originalFeature);

        const options = {
          'node': node,
          'feature': originalFeature
        };

        updatePlacemark(options);
        osFeature.createEllipse(originalFeature, true);
        this.notifyDataChange();
      }
    };
  }

  /**
   * @inheritDoc
   */
  getFilteredFeatures(opt_allTime) {
    // the most recent track position is always displayed, so force all time for track layers
    return super.getFilteredFeatures(true);
  }

  /**
   * @inheritDoc
   */
  processDeferred(features) {
    super.processDeferred(features);
    this.updateTrackZIndex();
  }

  /**
   * @inheritDoc
   */
  updateVisibilityFromNodes() {
    super.updateVisibilityFromNodes();
    this.updateTrackZIndex();
  }

  /**
   * Updates the z-index of all tracks in the layer.
   * @protected
   */
  updateTrackZIndex() {
    if (this.rootNode) {
      track.updateTrackZIndex(this.rootNode.getFeatures(false));
    }
  }
}

exports = PlacesSource;

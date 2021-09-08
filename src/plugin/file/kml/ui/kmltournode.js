goog.module('plugin.file.kml.ui.KMLTourNode');

const dispose = goog.require('goog.dispose');

const KMLNode = goog.require('plugin.file.kml.ui.KMLNode');
const {directiveTag: kmlTourNodeUi} = goog.require('plugin.file.kml.ui.KMLTourNodeUI');


/**
 * Tree node for a KML tour.
 */
class KMLTourNode extends KMLNode {
  /**
   * Constructor.
   * @param {!plugin.file.kml.tour.Tour} tour The KML tour.
   */
  constructor(tour) {
    super();
    this.setCheckboxVisible(false);
    this.nodeUI = `<${kmlTourNodeUi}></${kmlTourNodeUi}>`;

    /**
     * The KML tour.
     * @type {plugin.file.kml.tour.Tour|undefined}
     * @private
     */
    this.tour_ = tour;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.tour_);
    this.tour_ = undefined;
  }

  /**
   * Get the KML tour object for the node.
   *
   * @return {plugin.file.kml.tour.Tour|undefined}
   */
  getTour() {
    return this.tour_;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    if (this.tour_) {
      return this.tour_['name'];
    }

    return super.getLabel();
  }

  /**
   * @inheritDoc
   */
  getToolTip() {
    if (this.tour_) {
      return this.tour_['description'];
    }

    return super.getToolTip();
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    return '<i class="fa fa-video-camera fa-fw" title="KML Tour"></i>';
  }
}

exports = KMLTourNode;

goog.declareModuleId('plugin.file.kml.ui.KMLTourNode');

import KMLNode from './kmlnode.js';
import {directiveTag as kmlTourNodeUi} from './kmltournodeui.js';

const dispose = goog.require('goog.dispose');

/**
 * Tree node for a KML tour.
 */
export default class KMLTourNode extends KMLNode {
  /**
   * Constructor.
   * @param {!Tour} tour The KML tour.
   */
  constructor(tour) {
    super();
    this.setCheckboxVisible(false);
    this.nodeUI = `<${kmlTourNodeUi}></${kmlTourNodeUi}>`;

    /**
     * The KML tour.
     * @type {Tour|undefined}
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
   * @return {Tour|undefined}
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

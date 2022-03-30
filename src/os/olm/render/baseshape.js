goog.declareModuleId('os.olm.render.BaseShape');

import Feature from 'ol/src/Feature.js';
import OLVectorLayer from 'ol/src/layer/Vector.js';
import OLVectorSource from 'ol/src/source/Vector.js';

import * as osMap from '../../map/map.js';

const Disposable = goog.require('goog.Disposable');

/**
 * @abstract
 */
export default class BaseShape extends Disposable {
  /**
   * Constructor.
   * @param {Style|Array<Style>} style Style.
   */
  constructor(style) {
    super();

    /**
     * @private
     e @type {PluggableMap}
     */
    this.map_ = null;

    /**
     * @private
     * @type {Style|Array<Style>}
     */
    this.style_ = style;

    /**
     * Draw overlay where our sketch features are drawn.
     * @type {OLVectorLayer}
     * @private
     */
    this.overlay_ = new OLVectorLayer({
      source: new OLVectorSource({
        useSpatialIndex: false,
        wrapX: osMap.PROJECTION.canWrapX()
      }),
      style: style,
      updateWhileAnimating: true,
      updateWhileInteracting: true
    });

    /**
     * @type {Feature}
     * @private
     */
    this.feature_ = new Feature();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.setMap(null);
  }

  /**
   * @protected
   */
  render() {
    var geom = this.getGeometry();
    var overlaySource = this.overlay_.getSource();
    overlaySource.clear(true);

    if (this.map_ !== null && geom) {
      this.feature_.setGeometry(geom);
      this.feature_.setStyle(this.getStyle());
      overlaySource.addFeature(this.feature_);
    }
  }

  /**
   * @return {PluggableMap} The map
   */
  getMap() {
    return this.map_;
  }

  /**
   * @param {PluggableMap} map Map.
   *
   * @suppress {accessControls}
   */
  setMap(map) {
    this.overlay_.setMap(map);
    // update the wrap value in the event that the projection has changed since creation
    this.overlay_.getSource().wrapX_ = osMap.PROJECTION.canWrapX();
    this.map_ = map;
    this.render();
  }

  /**
   * @abstract
   * @return {Geometry} The geometry to draw
   */
  getGeometry() {}

  /**
   * @return {Style|Array<Style>} The style
   */
  getStyle() {
    return this.style_;
  }
}

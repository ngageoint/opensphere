goog.declareModuleId('os.feature.DynamicFeature');

import Feature from 'ol/src/Feature.js';

import registerClass from '../registerclass.js';



/**
 * A dynamic feature that changes with time.
 */
export default class DynamicFeature extends Feature {
  /**
   * Constructor.
   * @param {Geometry|Object<string, *>=} opt_geometryOrProperties
   *     You may pass a Geometry object directly, or an object literal
   *     containing properties.  If you pass an object literal, you may
   *     include a Geometry associated with a `geometry` key.
   * @param {function(!Feature)=} opt_initFn Initialize the feature into the animating state.
   * @param {function(!Feature, boolean=)=} opt_disposeFn Restore the feature to the non-animating state.
   * @param {function(!Feature, number, number)=} opt_updateFn Update the animating state for the given timestamp.
   * @param {boolean=} opt_dynamicEnabled Whether the track is being dynamic or not
   */
  constructor(opt_geometryOrProperties, opt_initFn, opt_disposeFn, opt_updateFn, opt_dynamicEnabled) {
    super(opt_geometryOrProperties);

    /**
     * Initialize the feature into the animating state.
     * @type {function(!Feature)}
     */
    this.initFn = opt_initFn || (() => {});

    /**
     * Restore the feature to the non-animating state.
     * @type {function(!Feature, boolean=)}
     */
    this.disposeFn = opt_disposeFn || (() => {});

    /**
     * Update the animating state for the given timestamp.
     * @type {function(!Feature, number, number)}
     */
    this.updateFn = opt_updateFn || (() => {});

    /**
     * Whether the track is being dynamic or not
     * @type {boolean}
     */
    this.isDynamicEnabled = opt_dynamicEnabled || false;
  }

  /**
   * Initialize the feature into the animating state.
   */
  initDynamic() {
    this.isDynamicEnabled = true;
    this.initFn(this);
  }

  /**
   * Restore the feature to the non-animating state.
   *
   * @param {boolean=} opt_disposing If the feature is being disposed.
   */
  disposeDynamic(opt_disposing) {
    this.isDynamicEnabled = false;
    this.disposeFn(this, opt_disposing);
  }

  /**
   * Update the animating state for the given timestamp.
   *
   * @param {number} startTime The start timestamp.
   * @param {number} endTime The ebd timestamp.
   */
  updateDynamic(startTime, endTime) {
    this.updateFn(this, startTime, endTime);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls} To allow direct access to feature metadata.
   */
  clone() {
    var clone = new DynamicFeature(undefined, this.initFn, this.disposeFn, this.updateFn,
        this.isDynamicEnabled);
    clone.setProperties(this.values_, true);
    clone.setGeometryName(this.getGeometryName());
    var geometry = this.getGeometry();
    if (geometry != null) {
      clone.setGeometry(geometry.clone());
    }
    clone.setId(this.getId());
    return clone;
  }
}

/**
 * Class name.
 * @type {string}
 * @override
 */
DynamicFeature.NAME = 'os.feature.DynamicFeature';
registerClass(DynamicFeature.NAME, DynamicFeature);

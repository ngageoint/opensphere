goog.module('os.interaction.Modify');
goog.module.declareLegacyNamespace();

const dispose = goog.require('goog.dispose');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const {getRandomString} = goog.require('goog.string');
const {getUid} = goog.require('ol');
const Collection = goog.require('ol.Collection');
const Feature = goog.require('ol.Feature');
const olEvents = goog.require('ol.events');
const OLEventType = goog.require('ol.events.EventType');
const Point = goog.require('ol.geom.Point');
const OLModify = goog.require('ol.interaction.Modify');
const olModifyEventType = goog.require('ol.interaction.ModifyEventType');
const RBush = goog.require('ol.structs.RBush');
const Circle = goog.require('ol.style.Circle');
const Fill = goog.require('ol.style.Fill');
const Stroke = goog.require('ol.style.Stroke');
const Style = goog.require('ol.style.Style');
const I3DSupport = goog.require('os.I3DSupport');
const RecordField = goog.require('os.data.RecordField');
const PayloadEvent = goog.require('os.events.PayloadEvent');
const DynamicFeature = goog.require('os.feature.DynamicFeature');
const osImplements = goog.require('os.implements');
const {ModifyEventType} = goog.require('os.interaction');
const interpolate = goog.require('os.interpolate');
const {getMapContainer} = goog.require('os.map.instance');
const {notifyStyleChange} = goog.require('os.style');
const {MODAL_SELECTOR} = goog.require('os.ui');
const Controls = goog.require('os.ui.help.Controls');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');

const MapBrowserPointerEvent = goog.requireType('ol.MapBrowserPointerEvent');
const Geometry = goog.requireType('ol.geom.Geometry');
const OSMap = goog.requireType('os.Map');


/**
 * Field for the interpolated/rendered geometry.
 * @type {string}
 */
const INTERPOLATED_GEOMETRY = '_interpolatedGeometry';


/**
 * ID for the control window.
 * @type {string}
 * @const
 */
const WIN_ID = 'modifyControls';


/**
 * Style for the feature being modified.
 * @type {Array<Style>}
 */
const FEATURE_STYLE = [
  new Style({
    // Render the interpolated geometry.
    geometry: INTERPOLATED_GEOMETRY,
    stroke: new Stroke({
      color: [0, 153, 255, 1],
      width: 3
    }),
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: [0, 153, 255, 1]
      }),
      stroke: new Stroke({
        color: [255, 255, 255, 1],
        width: 2
      })
    }),
    zIndex: Infinity
  })
];


/**
 * Style for the vertex feature.
 * @type {Array<Style>}
 */
const VERTEX_STYLE = [
  new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: [0, 153, 255, 1]
      }),
      stroke: new Stroke({
        color: [255, 255, 255, 1],
        width: 2
      })
    }),
    zIndex: Infinity
  })
];


/**
 * Clone the feature to be modified.
 * @param {!Feature} feature The feature.
 * @return {!Feature} The clone.
 */
const cloneFeature = (feature) => {
  // Use the original geom, interpolated coordinates make for a weird UX.
  const originalGeom = /** @type {!ol.geom.Geometry} */ (feature.get(interpolate.ORIGINAL_GEOM_FIELD) ||
      feature.getGeometry());

  // Clone the feature so we don't modify the existing geom.
  const clone = new DynamicFeature(originalGeom.clone());
  clone.setId(getRandomString());
  clone.setStyle(FEATURE_STYLE);

  // Hide the temporary feature from the Drawing Layer node.
  clone.set(RecordField.DRAWING_LAYER_NODE, false);

  // Do not interpolate the geometry. The interaction will handle that internally.
  clone.set(interpolate.METHOD_FIELD, interpolate.Method.NONE);

  // Enable events on the feature, then force the feature to listen to geometry changes. WebGL renderers in particular
  // rely on these change events to know when to update the rendered geometry.
  clone.enableEvents();
  clone.setGeometryName(clone.getGeometryName());

  return clone;
};


/**
 * Allows the user to modify geometries on the map directly.
 *
 * @implements {I3DSupport}
 */
class Modify extends OLModify {
  /**
   * Constructor.
   * @param {!Feature} feature The feature to modify.
   */
  constructor(feature) {
    const interpolationMethod = /** @type {interpolate.Method} */ (feature.get(interpolate.METHOD_FIELD)) ||
        interpolate.getMethod();
    const clone = cloneFeature(feature);
    const options = {
      features: new Collection([clone])
    };

    super(options);

    /**
     * The cloned feature.
     * @type {!Feature}
     * @private
     */
    this.clone_ = clone;

    /**
     * If a mouse down event is currently being handled.
     * @type {boolean}
     * @private
     */
    this.inDownEvent_ = false;

    /**
     * The interpolation method used by the original feature.
     * @type {interpolate.Method}
     * @private
     */
    this.interpolationMethod_ = interpolationMethod;

    /**
     * Segment RTree for the interpolated/rendered geometry.
     * @type {RBush<ol.ModifySegmentDataType>}
     * @private
     */
    this.interpolatedRBush_ = new RBush();

    /**
     * @type {KeyHandler}
     * @protected
     */
    this.keyHandler = new KeyHandler(document, true);
    this.keyHandler.listen(KeyEvent.EventType.KEY, this.handleKeyEvent, true, this);

    // jank alert: the functions that are called when the interaction starts and ends are hard to override, so instead
    // listen to our own events and toggle the map movement on and off
    olEvents.listen(this, olModifyEventType.MODIFYSTART, this.handleStart, this);
    olEvents.listen(this, olModifyEventType.MODIFYEND, this.handleEnd, this);

    this.updateInterpolatedGeometry();

    // the base class constructor calls setActive(true) before we've done our initialization, so redo that here
    this.setActive(false);
    this.setActive(true);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.setActive(false);

    if (this.getMap()) {
      this.getMap().removeInteraction(this);
    }

    dispose(this.keyHandler);

    olEvents.unlisten(this, olModifyEventType.MODIFYSTART, this.handleStart, this);
    olEvents.unlisten(this, olModifyEventType.MODIFYEND, this.handleEnd, this);

    this.removeControls();
  }

  /**
   * @inheritDoc
   */
  setActive(value) {
    const changed = value !== this.getActive();

    if (changed && this.clone_) {
      if (!value) {
        const geometry = this.clone_.getGeometry();
        if (geometry) {
          olEvents.unlisten(geometry, OLEventType.CHANGE, this.onGeometryChange, this);
        }

        getMapContainer().removeFeature(this.clone_);
      } else {
        this.updateInterpolatedGeometry();
        const geometry = this.clone_.getGeometry();
        if (geometry) {
          olEvents.listen(geometry, OLEventType.CHANGE, this.onGeometryChange, this);
        }

        getMapContainer().addFeature(this.clone_);
      }
    }

    super.setActive(value);
  }

  /**
   * Handle geometry changes from the feature.
   * @protected
   */
  onGeometryChange() {
    // When the original geometry is modified, update the interpolated geometry so the change will be rendered properly
    // on the map.
    this.updateInterpolatedGeometry();
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * Set an overlay to use instead of the default one used by the interaction.
   * @param {ol.layer.Vector} layer
   *
   * @suppress {accessControls}
   */
  setOverlay(layer) {
    this.overlay_ = layer;
  }

  /**
   * Handles modify start events by disabling map movement.
   * @param {OLModify.Event} event The event.
   * @protected
   */
  handleStart(event) {
    /** @type {OSMap} */ (this.getMap()).toggleMovement(false);
  }

  /**
   * Handles modify end events by enabling map movement.
   * @param {OLModify.Event} event The event.
   * @protected
   */
  handleEnd(event) {
    /** @type {OSMap} */ (this.getMap()).toggleMovement(true);
  }

  /**
   * Handles keydown events for stopping the interaction.
   * @param {KeyEvent} event The key event.
   * @protected
   *
   * @suppress {accessControls}
   */
  handleKeyEvent(event) {
    if (!document.querySelector(MODAL_SELECTOR)) {
      let handled = false;
      switch (event.keyCode) {
        case KeyCodes.ESC:
          this.cancel();
          handled = true;
          break;
        case KeyCodes.ENTER:
          this.complete();
          handled = true;
          break;
        default:
          break;
      }

      if (handled) {
        this.notifyFeatureChange();
      }
    }
  }

  /**
   * Cancel the modify operation.
   */
  cancel() {
    this.dispatchEvent(new PayloadEvent(ModifyEventType.CANCEL, this.clone_));
    this.setActive(false);
  }

  /**
   * Complete the modify operation.
   */
  complete() {
    const geometry = this.clone_.getGeometry();
    if (geometry) {
      // Clear the interpolate method from the geometry so the original feature can determine interpolation.
      geometry.unset(interpolate.METHOD_FIELD);
    }

    this.dispatchEvent(new PayloadEvent(ModifyEventType.COMPLETE, this.clone_));
    this.setActive(false);
  }

  /**
   * Shows control information for this interaction.
   */
  showControls() {
    const container = angular.element(windowSelector.CONTAINER);
    const injector = container.injector();
    const scope = injector.get('$rootScope').$new();
    const controls = [
      {
        'text': 'Remove Vertex',
        'keys': [KeyCodes.ALT, '+'],
        'other': [Controls.MOUSE.LEFT_MOUSE]
      },
      {
        'text': 'Save Changes',
        'keys': [KeyCodes.ENTER]
      },
      {
        'text': 'Cancel',
        'keys': [KeyCodes.ESC]
      }
    ];

    const scopeOptions = {
      'controls': controls
    };

    const windowOptions = {
      'id': WIN_ID,
      'label': 'Modify Geometry Controls',
      'x': 'center',
      'y': container.height() - 220,
      'width': 290,
      'height': 'auto',
      'show-close': true
    };

    const template = '<controlblock class="u-bg-body-offset" controls="controls"></controlblock>';
    osWindow.create(windowOptions, template, undefined, scope, undefined, scopeOptions);
  }

  /**
   * Remove the controls element.
   */
  removeControls() {
    const win = osWindow.getById(WIN_ID);
    osWindow.close(win);
  }

  /**
   * Notify that the feature being modified has changed.
   *
   * @suppress {accessControls}
   */
  notifyFeatureChange() {
    notifyStyleChange(this.overlay_, this.features_.getArray());
  }

  /**
   * Update the interpolated geometry on the feature.
   * @protected
   */
  updateInterpolatedGeometry() {
    if (this.clone_) {
      const originalGeom = this.clone_.getGeometry();
      if (originalGeom) {
        const interpolatedGeom = originalGeom.clone();
        interpolatedGeom.unset(interpolate.METHOD_FIELD, true);

        interpolate.beginTempInterpolation(undefined, this.interpolationMethod_);
        interpolate.interpolateGeom(interpolatedGeom);
        interpolate.endTempInterpolation();

        this.clone_.set(INTERPOLATED_GEOMETRY, interpolatedGeom);

        this.updateInterpolatedRBush();
      }
    }
  }

  /**
   * Update the RBush for the rendered geometry.
   * @protected
   *
   * @suppress {accessControls} Access the parent RBush.
   */
  updateInterpolatedRBush() {
    this.interpolatedRBush_.clear();

    const rBush = this.rBush_;
    this.rBush_ = this.interpolatedRBush_;

    const interpolatedGeom = /** @type {Geometry} */ (this.clone_.get(INTERPOLATED_GEOMETRY));
    if (interpolatedGeom && interpolatedGeom.getType() in this.SEGMENT_WRITERS_) {
      this.SEGMENT_WRITERS_[interpolatedGeom.getType()].call(this, this.clone_, interpolatedGeom);
    }

    this.rBush_ = rBush;
  }

  /**
   * @inheritDoc
   *
   * @suppress {accessControls} Overriding to add feature change notifications.
   */
  createOrUpdateVertexFeature_(coordinates) {
    let feature = this.vertexFeature_;
    if (!feature) {
      feature = new Feature(new Point(coordinates));
      feature.set(RecordField.DRAWING_LAYER_NODE, false);
      feature.setStyle(VERTEX_STYLE);
      feature.setId(getUid(feature));

      // The feature mixin disables events by default for performance reasons. We want this feature to update when the
      // geometry changes, so enable events and update the geometry listener.
      feature.enableEvents();
      feature.setGeometryName(feature.getGeometryName());

      this.vertexFeature_ = feature;
      this.overlay_.getSource().addFeature(feature);
    } else {
      const geometry = /** @type {Point} */ (feature.getGeometry());
      geometry.setCoordinates(coordinates);
    }

    return feature;
  }

  /**
   * @inheritDoc
   *
   * @suppress {accessControls} Overriding to handle null coordinate case in 3D and change RBush.
   */
  handlePointerAtPixel_(pixel, map) {
    if (map.getCoordinateFromPixel(pixel) != null) {
      // When handling a mouse down event we want to use the RBush for the original geometry so it can be modified.
      // Otherwise, use the RBush for the rendered geometry to show the correct vertex position.
      const rBush = this.rBush_;
      if (!this.inDownEvent_) {
        this.rBush_ = this.interpolatedRBush_;
      }
      super.handlePointerAtPixel_(pixel, map);
      this.rBush_ = rBush;
    }
  }

  /**
   * @inheritDoc
   */
  removePoint() {
    const removed = super.removePoint();

    if (removed) {
      this.notifyFeatureChange();
    }

    return removed;
  }
}

osImplements(Modify, I3DSupport.ID);


/**
 * The original OL mouse down event handler.
 * @type {function(MapBrowserPointerEvent):boolean}
 * @suppress {accessControls} Access to the original OL function.
 */
const oldHandleDownEvent = OLModify.handleDownEvent_;


/**
 * Mixin to the OL mouse down event handler.
 * @param {MapBrowserPointerEvent} evt Event.
 * @return {boolean} Start drag sequence?
 * @this {Modify}
 * @private
 *
 * @suppress {accessControls} Replace OL function and access vertex feature.
 */
OLModify.handleDownEvent_ = function(evt) {
  this.inDownEvent_ = true;

  //
  // The vertex is displayed along the rendered geometry, but on mouse down we want to target the original geometry so
  // it can be modified. Find the closest coordinate on the original geometry from the current mouse position, and
  // update the event pixel so it intersects the original geom.
  //
  // This is only done if a vertex is displayed, indicating we're ready to modify.
  //
  if (this.vertexFeature_) {
    const geometry = this.clone_.getGeometry();
    const vertexGeometry = /** @type {Point} */ (this.vertexFeature_.getGeometry());
    if (geometry && vertexGeometry) {
      const vertexCoord = vertexGeometry.getCoordinates();
      const closest = geometry.getClosestPoint(vertexCoord);
      evt.pixel = evt.map.getPixelFromCoordinate(closest);
    }
  }

  const result = oldHandleDownEvent.call(this, evt);

  // Call the drag handler so the rendered geometry is updated relative to the interpolated geometry.
  if (this.vertexFeature_) {
    this.handleDragEvent_(evt);
  }

  this.inDownEvent_ = false;

  return result;
};

exports = Modify;

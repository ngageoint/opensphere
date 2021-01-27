goog.module('os.interaction.Modify');
goog.module.declareLegacyNamespace();

const {getRandomString} = goog.require('goog.string');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyHandler = goog.require('goog.events.KeyHandler');
const {getUid} = goog.require('ol');
const Collection = goog.require('ol.Collection');
const Circle = goog.require('ol.style.Circle');
const Feature = goog.require('ol.Feature');
const olEvents = goog.require('ol.events');
const Point = goog.require('ol.geom.Point');
const OLModify = goog.require('ol.interaction.Modify');
const olModifyEventType = goog.require('ol.interaction.ModifyEventType');
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
const {notifyStyleChange} = goog.require('os.style');
const Controls = goog.require('os.ui.help.Controls');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');
const {MODAL_SELECTOR} = goog.require('os.ui');

const KeyEvent = goog.requireType('goog.events.KeyEvent');
const OSMap = goog.requireType('os.Map');


/**
 * Style for the feature being modified.
 * @type {Array<Style>}
 */
const FEATURE_STYLE = [
  new Style({
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
 * ID for the control window.
 * @type {string}
 * @const
 */
const WIN_ID = 'modifyControls';


/**
 * Clone the feature to be modified.
 * @param {!Feature} feature The feature.
 * @return {!Feature} The clone.
 */
const cloneFeature = (feature) => {
  // use the original geom, interpolated coordinates make for a weird UX
  const originalGeom = /** @type {!ol.geom.Geometry} */ (feature.get(interpolate.ORIGINAL_GEOM_FIELD) ||
      feature.getGeometry());

  // clone the feature so we don't modify the existing geom
  const clone = new DynamicFeature(originalGeom.clone());

  clone.setStyle(FEATURE_STYLE);
  clone.set(RecordField.DRAWING_LAYER_NODE, false);
  clone.set(interpolate.METHOD_FIELD, interpolate.Method.NONE);
  clone.setId(getRandomString());

  os.MapContainer.getInstance().addFeature(clone);

  //
  // enable events on the feature and force an update on the geometry listener. these events will be used
  // by the WebGL renderer to update the geometry as it changes.
  //
  // this is intentionally done after adding the feature to the drawing layer, because the addFeature call
  // will interpolate and update the geometry.
  //
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
     * @type {KeyHandler}
     * @protected
     */
    this.keyHandler = new KeyHandler(document, true);

    this.keyHandler.listen(KeyHandler.EventType.KEY, this.handleKeyEvent, true, this);

    // jank alert: the functions that are called when the interaction starts and ends are hard to override, so instead
    // listen to our own events and toggle the map movement on and off
    olEvents.listen(this, olModifyEventType.MODIFYSTART, this.handleStart, this);
    olEvents.listen(this, olModifyEventType.MODIFYEND, this.handleEnd, this);

    this.showControls();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    os.MapContainer.getInstance().removeFeature(this.clone_);

    goog.dispose(this.keyHandler);

    olEvents.unlisten(this, ol.interaction.ModifyEventType.MODIFYSTART, this.handleStart, this);
    olEvents.unlisten(this, ol.interaction.ModifyEventType.MODIFYEND, this.handleEnd, this);

    this.removeControls();
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
          this.onCancel();
          handled = true;
          break;
        case KeyCodes.ENTER:
          this.onComplete();
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
   * @protected
   */
  onCancel() {
    this.dispatchEvent(new PayloadEvent(ModifyEventType.CANCEL, this.clone_));
    this.setActive(false);
  }

  /**
   * Complete the modify operation.
   * @protected
   */
  onComplete() {
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

      this.vertexFeature_ = feature;
      this.overlay_.getSource().addFeature(feature);
    } else {
      var geometry = /** @type {Point} */ (feature.getGeometry());
      geometry.setCoordinates(coordinates);
      feature.changed();
    }

    // update the vertex feature
    notifyStyleChange(this.overlay_, [feature]);

    return feature;
  }

  /**
   * @inheritDoc
   *
   * @suppress {accessControls} Overriding to handle null coordinate case in 3D.
   */
  handlePointerAtPixel_(pixel, map) {
    if (map.getCoordinateFromPixel(pixel) != null) {
      super.handlePointerAtPixel_(pixel, map);
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

exports = Modify;

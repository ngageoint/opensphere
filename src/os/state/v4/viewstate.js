goog.module('os.state.v4.ViewState');

const log = goog.require('goog.log');
const {clamp} = goog.require('goog.math');
const MapMode = goog.require('os.MapMode');
const {getMapContainer} = goog.require('os.map.instance');
const XMLState = goog.require('os.state.XMLState');
const BaseViewState = goog.require('os.state.v4.BaseViewState');
const ViewProjection = goog.require('os.state.v4.ViewProjection');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
class ViewState extends BaseViewState {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  load(obj, id) {
    obj = XMLState.ensureXML(obj);

    if (!(obj instanceof Element)) {
      log.error(logger, 'Unable to load state content!');
      return;
    }

    try {
      var projection;
      var projectionEl = obj.querySelector('projection');
      if (projectionEl) {
        projection = projectionEl.textContent;
      }

      // switch the map to the correct mode (2d or 3d)
      var mapContainer = getMapContainer();
      var mapMode = projection == ViewProjection.VIEW_3D ? MapMode.VIEW_3D : MapMode.VIEW_2D;
      var is3DEnabled = mapContainer.is3DEnabled();
      if ((mapMode == MapMode.VIEW_2D && is3DEnabled) || (mapMode == MapMode.VIEW_3D && !is3DEnabled)) {
        mapContainer.setWebGLEnabled(!is3DEnabled);
      }

      // update the camera
      var latitude = Number(obj.querySelector('latitude').textContent);
      var longitude = Number(obj.querySelector('longitude').textContent);
      var altitude = Number(obj.querySelector('altitude').textContent);
      var heading = Number(obj.querySelector('heading').textContent);

      // the KML spec roll value goes from (-180, 180) while Cesium's roll goes from (0, 360)
      var roll = Number(obj.querySelector('roll').textContent);
      roll = roll > 180 ? roll - 360 : roll;

      var tilt = clamp(Number(obj.querySelector('tilt').textContent), 0, 90);

      mapContainer.restoreCameraState(/** @type {!osx.map.CameraState} */ ({
        center: [longitude, latitude],
        altitude: altitude,
        heading: heading,
        roll: roll,
        tilt: tilt
      }));
    } catch (e) { // que pasa, hombre?
      log.error(logger, 'Error loading viewstate:', e);
    }
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    var mc = getMapContainer();
    this.setProjection(mc.is3DEnabled() ? ViewProjection.VIEW_3D : ViewProjection.VIEW_2D);
    this.setCameraState(mc.persistCameraState());
    super.saveInternal(options, rootObj);
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v4.ViewState');

exports = ViewState;

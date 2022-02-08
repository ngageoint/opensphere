goog.declareModuleId('os.state.v2.ViewState');

import {getMapContainer} from '../../map/mapinstance.js';
import MapMode from '../../map/mapmode.js';
import {KMLNS, XMLNS, appendElement, appendElementNS} from '../../xml.js';
import XMLState from '../xmlstate.js';
import ViewProjection from './viewprojection.js';

const log = goog.require('goog.log');
const {clamp} = goog.require('goog.math');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
export default class ViewState extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.description = 'Saves the current map view/position';
    this.priority = 100;
    this.rootName = 'map';
    this.title = 'Current View';
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
      if ((mapMode == MapMode.VIEW_2D && is3DEnabled) ||
          (mapMode == MapMode.VIEW_3D && !is3DEnabled)) {
        mapContainer.setWebGLEnabled(!is3DEnabled);
      }

      // update the camera
      var latitude = Number(obj.querySelector('latitude').textContent);
      var longitude = Number(obj.querySelector('longitude').textContent);

      // THIN-9621 don't allow lat/lon to be NaN, use 0 instead
      latitude = latitude ? latitude : 0;
      longitude = longitude ? longitude : 0;

      var altitude = Number(obj.querySelector('altitude').textContent);
      var heading = Number(obj.querySelector('heading').textContent);
      var roll = Number(obj.querySelector('roll').textContent);
      var tilt = clamp(Number(obj.querySelector('tilt').textContent), 0, 90);

      mapContainer.restoreCameraState(/** @type {!osx.map.CameraState} */ ({
        center: [longitude, latitude],
        altitude: altitude,
        heading: heading,
        roll: roll,
        tilt: tilt
      }));
    } catch (e) {
      // que pasa, hombre?
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    // do nothing
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var mapContainer = getMapContainer();
      var camera = appendElementNS('kml:Camera', KMLNS, rootObj);
      camera.setAttributeNS(XMLNS, 'xmlns:kml', KMLNS);

      // append the view projection (2d or 3d mode)
      var projection = mapContainer.is3DEnabled() ? ViewProjection.VIEW_3D :
        ViewProjection.VIEW_2D;
      appendElement('projection', rootObj, projection);

      // append the camera state
      var cameraState = mapContainer.persistCameraState();
      appendElementNS('kml:latitude', KMLNS, camera, cameraState.center[1]);
      appendElementNS('kml:longitude', KMLNS, camera, cameraState.center[0]);
      appendElementNS('kml:altitude', KMLNS, camera, cameraState.altitude);
      appendElementNS('kml:tilt', KMLNS, camera, cameraState.tilt);
      appendElementNS('kml:heading', KMLNS, camera, cameraState.heading);
      appendElementNS('kml:roll', KMLNS, camera, cameraState.roll);
      appendElementNS('kml:altitudeMode', KMLNS, camera, 'clampToGround');

      this.saveComplete(options, rootObj);
    } catch (e) {
      this.saveFailed(e.message || 'Unspecified error.');
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v2.ViewState');

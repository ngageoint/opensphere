goog.declareModuleId('os.state.v4.BaseViewState');

import {KMLNS, XMLNS, appendElement, appendElementNS} from '../../xml.js';
import XMLState from '../xmlstate.js';
import ViewProjection from './viewprojection.js';
import ViewTag from './viewtag.js';


/**
 */
export default class BaseViewState extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.description = 'Saves the current map view/position';
    this.priority = 100;
    this.rootName = ViewTag.VIEW;
    this.title = 'Current View';

    /**
     * default camera state
     * @type {osx.map.CameraState}
     */
    this.cameraState = /** @type {osx.map.CameraState} */ ({
      center: [0, 0],
      altitude: 1000000,
      heading: 0,
      roll: 0,
      tilt: 0
    });

    /**
     * @type {ViewProjection}
     */
    this.projection = ViewProjection.VIEW_2D;
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    // do nothing
  }

  /**
   * @param {osx.map.CameraState} cameraState
   */
  setCameraState(cameraState) {
    this.cameraState = cameraState;
  }

  /**
   * @return {osx.map.CameraState}
   */
  getCameraState() {
    return this.cameraState;
  }

  /**
   * @param {ViewProjection} projection
   */
  setProjection(projection) {
    this.projection = projection;
  }

  /**
   * @return {ViewProjection}
   */
  getProjection() {
    return this.projection;
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var camera = appendElementNS('kml:Camera', KMLNS, rootObj);
      camera.setAttributeNS(XMLNS, 'xmlns:kml', KMLNS);

      // append the view projection (2d or 3d mode)
      appendElement('projection', rootObj, this.getProjection());

      // append the camera state, the order of these KML elements matters!
      var cameraState = this.getCameraState();
      appendElementNS('kml:longitude', KMLNS, camera, cameraState.center[0]);
      appendElementNS('kml:latitude', KMLNS, camera, cameraState.center[1]);
      appendElementNS('kml:altitude', KMLNS, camera, cameraState.altitude);
      appendElementNS('kml:heading', KMLNS, camera, cameraState.heading);
      appendElementNS('kml:tilt', KMLNS, camera, cameraState.tilt);

      // Cesium maintains roll as a value from (0, 360) while the KML spec states that roll must be between (-180, 180)
      var roll = cameraState.roll > 180 ? cameraState.roll - 360 : cameraState.roll;
      appendElementNS('kml:roll', KMLNS, camera, roll);
      appendElementNS('kml:altitudeMode', KMLNS, camera, 'clampToGround');

      this.saveComplete(options, rootObj);
    } catch (e) {
      this.saveFailed(e.message || 'Unspecified error.');
    }
  }
}

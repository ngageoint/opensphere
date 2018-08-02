goog.provide('os.state.v4.BaseViewState');
goog.provide('os.state.v4.ViewProjection');
goog.provide('os.state.v4.ViewTag');
goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('os.state.XMLState');
goog.require('os.xml');



/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v4.BaseViewState = function() {
  os.state.v4.BaseViewState.base(this, 'constructor');

  this.description = 'Saves the current map view/position';
  this.priority = 100;
  this.rootName = os.state.v4.ViewTag.VIEW;
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
   * @type {os.state.v4.ViewProjection}
   */
  this.projection = os.state.v4.ViewProjection.VIEW_2D;
};
goog.inherits(os.state.v4.BaseViewState, os.state.XMLState);


/**
 * View projections
 * @enum {string}
 * @const
 */
os.state.v4.ViewProjection = {
  VIEW_2D: 'Equirectangular',
  VIEW_3D: 'Perspective'
};


/**
 * XML tags for view state
 * @enum {string}
 * @const
 */
os.state.v4.ViewTag = {
  VIEW: 'map'
};


/**
 * @inheritDoc
 */
os.state.v4.BaseViewState.prototype.remove = function(id) {
  // do nothing
};


/**
 * @param {osx.map.CameraState} cameraState
 */
os.state.v4.BaseViewState.prototype.setCameraState = function(cameraState) {
  this.cameraState = cameraState;
};


/**
 * @return {osx.map.CameraState}
 */
os.state.v4.BaseViewState.prototype.getCameraState = function() {
  return this.cameraState;
};


/**
 * @param {os.state.v4.ViewProjection} projection
 */
os.state.v4.BaseViewState.prototype.setProjection = function(projection) {
  this.projection = projection;
};


/**
 * @return {os.state.v4.ViewProjection}
 */
os.state.v4.BaseViewState.prototype.getProjection = function() {
  return this.projection;
};


/**
 * @inheritDoc
 */
os.state.v4.BaseViewState.prototype.saveInternal = function(options, rootObj) {
  try {
    var camera = os.xml.appendElementNS('kml:Camera', os.xml.KMLNS, rootObj);
    ol.xml.setAttributeNS(camera, os.xml.XMLNS, 'xmlns:kml', os.xml.KMLNS);

    // append the view projection (2d or 3d mode)
    os.xml.appendElement('projection', rootObj, this.getProjection());

    // append the camera state, the order of these KML elements matters!
    var cameraState = this.getCameraState();
    os.xml.appendElementNS('kml:longitude', os.xml.KMLNS, camera, cameraState.center[0]);
    os.xml.appendElementNS('kml:latitude', os.xml.KMLNS, camera, cameraState.center[1]);
    os.xml.appendElementNS('kml:altitude', os.xml.KMLNS, camera, cameraState.altitude);
    os.xml.appendElementNS('kml:heading', os.xml.KMLNS, camera, cameraState.heading);
    os.xml.appendElementNS('kml:tilt', os.xml.KMLNS, camera, cameraState.tilt);

    // Cesium maintains roll as a value from (0, 360) while the KML spec states that roll must be between (-180, 180)
    var roll = cameraState.roll > 180 ? cameraState.roll - 360 : cameraState.roll;
    os.xml.appendElementNS('kml:roll', os.xml.KMLNS, camera, roll);
    os.xml.appendElementNS('kml:altitudeMode', os.xml.KMLNS, camera, 'clampToGround');

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};

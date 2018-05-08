goog.provide('os.state.v2.ViewProjection');
goog.provide('os.state.v2.ViewState');
goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.math');
goog.require('os.MapContainer');
goog.require('os.map');
goog.require('os.state.XMLState');
goog.require('os.xml');



/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v2.ViewState = function() {
  os.state.v2.ViewState.base(this, 'constructor');

  this.description = 'Saves the current map view/position';
  this.priority = 100;
  this.rootName = 'map';
  this.title = 'Current View';
};
goog.inherits(os.state.v2.ViewState, os.state.XMLState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v2.ViewState.LOGGER_ = goog.log.getLogger('os.state.v2.ViewState');


/**
 * View projections
 * @enum {string}
 * @const
 */
os.state.v2.ViewProjection = {
  VIEW_2D: 'Equirectangular',
  VIEW_3D: 'Perspective'
};


/**
 * @inheritDoc
 */
os.state.v2.ViewState.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v2.ViewState.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    var projection;
    var projectionEl = obj.querySelector('projection');
    if (projectionEl) {
      projection = projectionEl.textContent;
    }

    // switch the map to the correct mode (2d or 3d)
    var mapContainer = os.MapContainer.getInstance();
    var mapMode = projection == os.state.v2.ViewProjection.VIEW_3D ? os.MapMode.VIEW_3D : os.MapMode.VIEW_2D;
    var is3DEnabled = mapContainer.is3DEnabled();
    if ((mapMode == os.MapMode.VIEW_2D && is3DEnabled) ||
        (mapMode == os.MapMode.VIEW_3D && !is3DEnabled)) {
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
    var tilt = goog.math.clamp(Number(obj.querySelector('tilt').textContent), 0, 90);

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
};


/**
 * @inheritDoc
 */
os.state.v2.ViewState.prototype.remove = function(id) {
  // do nothing
};


/**
 * @inheritDoc
 */
os.state.v2.ViewState.prototype.saveInternal = function(options, rootObj) {
  try {
    var mapContainer = os.MapContainer.getInstance();
    var camera = os.xml.appendElementNS('kml:Camera', os.xml.KMLNS, rootObj);
    ol.xml.setAttributeNS(camera, os.xml.XMLNS, 'xmlns:kml', os.xml.KMLNS);

    // append the view projection (2d or 3d mode)
    var projection = mapContainer.is3DEnabled() ? os.state.v2.ViewProjection.VIEW_3D :
        os.state.v2.ViewProjection.VIEW_2D;
    os.xml.appendElement('projection', rootObj, projection);

    // append the camera state
    var cameraState = mapContainer.persistCameraState();
    os.xml.appendElementNS('kml:latitude', os.xml.KMLNS, camera, cameraState.center[1]);
    os.xml.appendElementNS('kml:longitude', os.xml.KMLNS, camera, cameraState.center[0]);
    os.xml.appendElementNS('kml:altitude', os.xml.KMLNS, camera, cameraState.altitude);
    os.xml.appendElementNS('kml:tilt', os.xml.KMLNS, camera, cameraState.tilt);
    os.xml.appendElementNS('kml:heading', os.xml.KMLNS, camera, cameraState.heading);
    os.xml.appendElementNS('kml:roll', os.xml.KMLNS, camera, cameraState.roll);
    os.xml.appendElementNS('kml:altitudeMode', os.xml.KMLNS, camera, 'clampToGround');

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};

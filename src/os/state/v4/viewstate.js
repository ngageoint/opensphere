goog.provide('os.state.v4.ViewState');
goog.require('goog.asserts');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.math');
goog.require('os.MapContainer');
goog.require('os.map');
goog.require('os.state.XMLState');
goog.require('os.state.v4.BaseViewState');
goog.require('os.state.v4.ViewProjection');
goog.require('os.xml');



/**
 * @extends {os.state.v4.BaseViewState}
 * @constructor
 */
os.state.v4.ViewState = function() {
  os.state.v4.ViewState.base(this, 'constructor');
};
goog.inherits(os.state.v4.ViewState, os.state.v4.BaseViewState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v4.ViewState.LOGGER_ = goog.log.getLogger('os.state.v4.ViewState');


/**
 * @inheritDoc
 */
os.state.v4.ViewState.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v4.ViewState.LOGGER_, 'Unable to load state content!');
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
    var mapMode = projection == os.state.v4.ViewProjection.VIEW_3D ? os.MapMode.VIEW_3D : os.MapMode.VIEW_2D;
    var is3DEnabled = mapContainer.is3DEnabled();
    if ((mapMode == os.MapMode.VIEW_2D && is3DEnabled) || (mapMode == os.MapMode.VIEW_3D && !is3DEnabled)) {
      mapContainer.setCesiumEnabled(!is3DEnabled);
    }

    // update the camera
    var latitude = Number(obj.querySelector('latitude').textContent);
    var longitude = Number(obj.querySelector('longitude').textContent);
    var altitude = Number(obj.querySelector('altitude').textContent);
    var heading = Number(obj.querySelector('heading').textContent);

    // the KML spec roll value goes from (-180, 180) while Cesium's roll goes from (0, 360)
    var roll = Number(obj.querySelector('roll').textContent);
    roll = roll > 180 ? roll - 360 : roll;

    var tilt = goog.math.clamp(Number(obj.querySelector('tilt').textContent), 0, 90);

    mapContainer.restoreCameraState(/** @type {!osx.map.CameraState} */ ({
      center: [longitude, latitude],
      altitude: altitude,
      heading: heading,
      roll: roll,
      tilt: tilt
    }));
  } catch (e) { // que pasa, hombre?
    goog.log.error(os.state.v4.ViewState.LOGGER_, 'Error loading viewstate:', e);
  }
};


/**
 * @inheritDoc
 */
os.state.v4.ViewState.prototype.saveInternal = function(options, rootObj) {
  var mc = os.MapContainer.getInstance();
  this.setProjection(mc.is3DEnabled() ? os.state.v4.ViewProjection.VIEW_3D : os.state.v4.ViewProjection.VIEW_2D);
  this.setCameraState(mc.persistCameraState());
  os.state.v4.ViewState.base(this, 'saveInternal', options, rootObj);
};

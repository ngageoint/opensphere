/**
 * @fileoverview ol3-cesium camera replacement.
 *
 * @suppress {accessControls}
 */
goog.provide('os.olcs.Camera');

goog.require('goog.async.Throttle');
goog.require('ol.Observable');
goog.require('ol.events');
goog.require('ol.proj');
goog.require('olcs.Camera');
goog.require('olcs.core');
goog.require('os.map');
goog.require('os.olcs');



/**
 * This object takes care of additional 3d-specific properties of the view and ensures proper synchronization with the
 * underlying raw Cesium.Camera object.
 *
 * This replaces {@link olcs.Camera}, which syncs the 2D view to the 3D camera instead of using native Cesium camera
 * conrols.
 *
 * @param {!Cesium.Scene} scene
 * @param {!ol.Map} map
 *
 * @extends {olcs.Camera}
 * @constructor
 */
os.olcs.Camera = function(scene, map) {
  this.scene_ = scene;
  this.cam_ = scene.camera;
  this.map_ = map;
  this.tilt_ = 0;
  this.distance_ = 0;
  this.lastCameraViewMatrix_ = null;
  this.viewUpdateInProgress_ = false;

  /**
   * This is used to disable any camera updates while not in use.
   * @type {boolean}
   * @private
   */
  this.enabled_ = false;

  /**
   * Rate limit how often we update the OL camera to reduce CPU overhead
   * @type {goog.async.Throttle}
   * @private
   */
  this.updateThrottle_ = new goog.async.Throttle(this.updateView, 100, this);
};
goog.inherits(os.olcs.Camera, olcs.Camera);


/**
 * Replace the olcs camera with ours.
 * @suppress {checkTypes} Because hacks.
 */
os.olcs.replaceCamera = function() {
  olcs.Camera = os.olcs.Camera;
};
os.olcs.replaceCamera();


/**
 * @return {boolean}
 */
os.olcs.Camera.prototype.getEnabled = function() {
  return this.enabled_;
};


/**
 * @param {boolean} value
 */
os.olcs.Camera.prototype.setEnabled = function(value) {
  this.enabled_ = value;

  if (this.enabled_) {
    this.readFromView();
  }
};


/**
 * @return {number|undefined} Heading in radians.
 */
os.olcs.Camera.prototype.getHeading = function() {
  return this.cam_.heading;
};


/**
 * @param {number} heading In radians.
 */
os.olcs.Camera.prototype.setHeading = function(heading) {
  var carto = this.cam_.positionCartographic;
  this.cam_.setView({
    destionation: carto,
    orientation: {
      heading: 0,
      pitch: this.cam_.pitch,
      roll: this.cam_.roll
    }
  });
};


/**
 * @return {number} Tilt in radians.
 */
os.olcs.Camera.prototype.getTilt = function() {
  return this.tilt_;
};


/**
 * @param {number} tilt In radians.
 */
os.olcs.Camera.prototype.setTilt = function(tilt) {
  this.tilt_ = tilt;
  this.updateCamera_();
};


/**
 * Shortcut for ol.View.getCenter().
 * @return {ol.Coordinate|undefined} Same projection as the ol.View.
 */
os.olcs.Camera.prototype.getCenter = function() {
  var view = this.map_.getView();

  if (!view) {
    return undefined;
  }

  return view.getCenter();
};


/**
 * Shortcut for ol.View.setCenter().
 * @param {ol.Coordinate} center Same projection as the ol.View.
 */
os.olcs.Camera.prototype.setCenter = function(center) {
  this.flyTo(center);
};


/**
 * Sets the position of the camera.
 * @param {ol.Coordinate} position Same projection as the ol.View.
 */
os.olcs.Camera.prototype.setPosition = function(position) {
  this.flyTo(position);
};


/**
 * @return {number} Altitude in meters.
 */
os.olcs.Camera.prototype.getAltitude = function() {
  return this.cam_.positionCartographic.height;
};


/**
 * @param {number} altitude In meters.
 */
os.olcs.Camera.prototype.setAltitude = function(altitude) {
  this.flyTo(undefined, altitude);
};


/**
 * @return {ol.Extent|undefined} The extent in degrees or undefined if the ellipsoid is not visible
 */
os.olcs.Camera.prototype.getExtent = function() {
  var rect = this.cam_.computeViewRectangle();
  if (rect) {
    return [rect.west, rect.south, rect.east, rect.north];
  }
};


/**
 * Flies the camera to point at the specified target.
 * @param {ol.Coordinate=} opt_center The destination center point.
 * @param {number=} opt_altitude The destination altitude.
 * @param {number=} opt_duration The fly duration, in milliseconds.
 */
os.olcs.Camera.prototype.flyTo = function(opt_center, opt_altitude, opt_duration) {
  if (this.enabled_) {
    var target;
    if (opt_center) {
      opt_center = ol.proj.transform(opt_center, os.map.PROJECTION, os.proj.EPSG4326);

      var lon = ol.math.toRadians(opt_center[0]);
      var lat = ol.math.toRadians(opt_center[1]);
      target = new Cesium.Cartographic(lon, lat);
    } else {
      // clone the current position or Cesium won't animate the change
      target = this.cam_.positionCartographic.clone();
    }

    target.height = 0;
    var height = opt_altitude != null ? opt_altitude : this.getAltitude();
    var maxHeight = this.scene_.screenSpaceCameraController.maximumZoomDistance;
    var destination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(target);
    var duration = opt_duration != null ? opt_duration : 500;
    var bounds = new Cesium.BoundingSphere(destination);
    var hpr = new Cesium.HeadingPitchRange(this.cam_.heading, this.cam_.pitch, Math.min(height, maxHeight));

    this.cam_.flyToBoundingSphere(bounds, {
      offset: hpr,
      duration: duration / 1000
    });
  }
};


/**
 * Gets the distance to the center of the screen
 * @return {number}
 */
os.olcs.Camera.prototype.getDistanceToCenter = function() {
  var center;
  var canvas = /** @type {HTMLCanvasElement} */ (document.querySelector(os.olcs.CESIUM_CANVAS_SELECTOR));
  if (canvas) {
    center = this.cam_.pickEllipsoid(new Cesium.Cartesian2(canvas.width / 2, canvas.height / 2));
  }

  // try to base zoom on the distance from the camera to the globe at the center of the screen, otherwise use the
  // camera's current altitude from the globe.
  return center ? Cesium.Cartesian3.distance(this.cam_.positionWC, center) : this.getAltitude();
};


/**
 * Gets the distance from the camera to a world coordinate. Returns undefined if the coordinate is obscured by the
 * ellipsoid.
 * @param {!Cesium.Cartesian3} position The position
 * @return {number|undefined}
 */
os.olcs.Camera.prototype.getDistanceToPosition = function(position) {
  var distance;

  // get the window pixel of the position within the scene. make sure a pixel is returned and is not negative.
  var pixel = Cesium.SceneTransforms.wgs84ToWindowCoordinates(this.scene_, position);
  if (pixel && pixel.x > 0 && pixel.y > 0) {
    // make sure the pixel is within the bounds of the canvas
    var canvas = /** @type {HTMLCanvasElement} */ (document.querySelector(os.olcs.CESIUM_CANVAS_SELECTOR));
    if (pixel.x <= canvas.width && pixel.y <= canvas.height) {
      // get the distance to the position
      distance = Cesium.Cartesian3.distance(position, this.cam_.positionWC);

      // try to pick the ellipsoid. if it isn't picked, the position is off the ellipsoid and is in view. if it is
      // picked, check if the ellipsoid is blocking the position.
      var ellipsoidPosition = this.cam_.pickEllipsoid(pixel);
      if (ellipsoidPosition) {
        var ellipsoidDistance = Cesium.Cartesian3.distance(ellipsoidPosition, this.cam_.positionWC);
        if (ellipsoidDistance < distance) {
          // ellipsoid is closer to the camera, so the position isn't in view
          distance = undefined;
        }
      }
    }
  }

  return distance;
};


/**
 * Zooms the camera by the provided delta value.
 * @param {number} delta The zoom delta.
 */
os.olcs.Camera.prototype.zoomByDelta = function(delta) {
  var camDistance = this.getDistanceToCenter();
  var distance = camDistance - camDistance * delta;

  // don't zoom out beyond the maximum zoom distance set on the controller
  var sscc = this.scene_.screenSpaceCameraController;
  var maxDistance = sscc.maximumZoomDistance;
  if (distance < camDistance - maxDistance) {
    distance = camDistance - maxDistance;
  }

  // only zoom if the distance exceeds the minimum zoom distance set on the controller
  if (Math.abs(distance) > sscc.minimumZoomDistance) {
    this.cam_.zoomIn(distance);
  }
};


/**
 * Updates the state of the underlying Cesium.Camera
 * according to the current values of the properties.
 * @private
 */
os.olcs.Camera.prototype.updateCamera_ = function() {
  var view = this.map_.getView();
  if (!view) {
    return;
  }
  var center = view.getCenter();
  if (!center) {
    return;
  }
  var ll = ol.proj.transform(center, os.map.PROJECTION, os.proj.EPSG4326);
  goog.asserts.assert(ll != null);

  var carto = new Cesium.Cartographic(ol.math.toRadians(ll[0]),
                                      ol.math.toRadians(ll[1]));
  if (this.scene_.globe) {
    var height = this.scene_.globe.getHeight(carto);
    carto.height = height != null ? height : 0;
  }

  var destination = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

  /** @type {Cesium.optionsOrientation} */
  var orientation = {
    pitch: this.tilt_ - Cesium.Math.PI_OVER_TWO,
    heading: -view.getRotation(),
    roll: undefined
  };
  this.cam_.setView({
    destination: destination,
    orientation: orientation
  });

  this.cam_.moveBackward(this.distance_);

  this.checkCameraChange(true);
};


/**
 * Calculates the values of the properties from the current ol.View state.
 */
os.olcs.Camera.prototype.readFromView = function() {
  var view = this.map_.getView();
  if (!this.enabled_ || !view) {
    return;
  }

  var center = view.getCenter();
  if (!center) {
    return;
  }

  var ll = ol.proj.transform(center, os.map.PROJECTION, os.proj.EPSG4326);
  goog.asserts.assert(ll != null);

  // determine distance at equator so the projection doesn't cause a large difference between 2d/3d
  var resolution = view.getResolution() || 0;
  this.distance_ = this.calcDistanceForResolution(resolution, 0);

  this.updateCamera_();
};


/**
 * Calculates the values of the properties from the current Cesium.Camera state.
 * Modifies the center, resolution and rotation properties of the view.
 */
os.olcs.Camera.prototype.updateView = function() {
  var view = this.map_.getView();
  if (!this.enabled_ || !view) {
    return;
  }
  this.viewUpdateInProgress_ = true;

  // target & distance
  var ellipsoid = Cesium.Ellipsoid.WGS84;
  var scene = this.scene_;
  var target = olcs.core.pickCenterPoint(scene);

  var bestTarget = target;
  if (!bestTarget) {
    // TODO: how to handle this properly ?
    var globe = scene.globe;
    var carto = this.cam_.positionCartographic.clone();
    var height = globe.getHeight(carto);
    carto.height = height != null ? height : 0;
    bestTarget = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
  }

  this.distance_ = Cesium.Cartesian3.distance(bestTarget, this.cam_.position);

  var bestTargetCartographic = ellipsoid.cartesianToCartographic(bestTarget);
  var longitude = bestTargetCartographic ? bestTargetCartographic.longitude : 0;
  var latitude = bestTargetCartographic ? bestTargetCartographic.latitude : 0;


  view.setCenter(ol.proj.transform([
    ol.math.toDegrees(longitude),
    ol.math.toDegrees(latitude)], os.proj.EPSG4326, os.map.PROJECTION));

  // determine distance at equator so the projection doesn't cause a large difference between 2d/3d
  var resolution = this.calcResolutionForDistance(this.distance_, 0);
  view.setResolution(view.constrainResolution(resolution, 0, 0));

  /*
   * Since we are positioning the target, the values of heading and tilt
   * need to be calculated _at the target_.
   */
  if (target) {
    var pos = this.cam_.position;

    // normal to the ellipsoid at the target
    var targetNormal = new Cesium.Cartesian3();
    ellipsoid.geocentricSurfaceNormal(target, targetNormal);

    // vector from the target to the camera
    var targetToCamera = new Cesium.Cartesian3();
    Cesium.Cartesian3.subtract(pos, target, targetToCamera);
    Cesium.Cartesian3.normalize(targetToCamera, targetToCamera);

    // HEADING
    var up = this.cam_.up;
    var right = this.cam_.right;
    var normal = new Cesium.Cartesian3(-target.y, target.x, 0); // what is it?
    var heading = Cesium.Cartesian3.angleBetween(right, normal);
    var cross = Cesium.Cartesian3.cross(target, up, new Cesium.Cartesian3());
    var orientation = cross.z;

    view.setRotation((orientation < 0 ? heading : -heading));

    // TILT
    var tiltAngle = Math.acos(Cesium.Cartesian3.dot(targetNormal, targetToCamera));
    this.tilt_ = isNaN(tiltAngle) ? 0 : tiltAngle;
  } else {
    // fallback when there is no target
    view.setRotation(this.cam_.heading);
    this.tilt_ = -this.cam_.pitch + Math.PI / 2;
  }

  this.viewUpdateInProgress_ = false;
};


/**
 * Check if the underlying camera state has changed and ensure synchronization.
 * @param {boolean=} opt_dontSync Do not synchronize the view.
 */
os.olcs.Camera.prototype.checkCameraChange = function(opt_dontSync) {
  var old = this.lastCameraViewMatrix_;
  var current = this.cam_.viewMatrix;

  if (!old || !Cesium.Matrix4.equalsEpsilon(old, current, 1e-5)) {
    this.lastCameraViewMatrix_ = current.clone();
    if (opt_dontSync !== true) {
      this.updateThrottle_.fire();
    }
  }
};


/**
 * @param {number} resolution Number of map units per pixel.
 * @param {number} latitude Latitude in radians.
 * @return {number} The calculated distance.
 */
os.olcs.Camera.prototype.calcDistanceForResolution = function(resolution, latitude) {
  var canvas = this.scene_.canvas;
  var fovy = this.cam_.frustum.fovy; // vertical field of view
  var view = this.map_.getView();
  var metersPerUnit = view.getProjection().getMetersPerUnit();

  // canvas.clientHeight can in some cases be 0, which breaks this entire calculation. If that is the case, it's
  // better to choose some arbitrary non-zero value and use it.
  var height = canvas.clientHeight || 300;

  // number of "map units" visible in 2D (vertically)
  var visibleMapUnits = resolution * height;

  // The metersPerUnit does not take latitude into account, but it should
  // be lower with increasing latitude -- we have to compensate.
  // In 3D it is not possible to maintain the resolution at more than one point,
  // so it only makes sense to use the latitude of the "target" point.
  var relativeCircumference = Math.cos(Math.abs(latitude));

  // how many meters should be visible in 3D
  var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

  // distance required to view the calculated length in meters
  //
  //  fovy/2
  //    |\
  //  x | \
  //    |--\
  // visibleMeters/2
  var requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

  // NOTE: This calculation is not absolutely precise, because metersPerUnit
  // is a great simplification. It does not take ellipsoid/terrain into account.

  return requiredDistance;
};


/**
 * @param {number} distance
 * @param {number} latitude
 * @return {number} The calculated resolution.
 */
os.olcs.Camera.prototype.calcResolutionForDistance = function(distance, latitude) {
  // See the reverse calculation (calcDistanceForResolution) for details
  var canvas = this.scene_.canvas;
  var fovy = this.cam_.frustum.fovy;
  var view = this.map_.getView();
  var metersPerUnit = view.getProjection().getMetersPerUnit();

  var visibleMeters = 2 * distance * Math.tan(fovy / 2);
  var relativeCircumference = Math.cos(Math.abs(latitude));
  var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
  var resolution = visibleMapUnits / canvas.clientHeight;

  return resolution;
};

goog.provide('os.Map');

goog.require('goog.dom.TagName');
goog.require('goog.userAgent');
goog.require('ol.Feature');
goog.require('ol.Map');
goog.require('os.geo');
goog.require('os.map');



/**
 * @param {olx.MapOptions} options Map options
 * @extends {ol.Map}
 * @constructor
 */
os.Map = function(options) {
  os.Map.base(this, 'constructor', options);
};
goog.inherits(os.Map, ol.Map);


/**
 * @return {ol.Extent} The extent of the map
 */
os.Map.prototype.getExtent = function() {
  var mc = os.MapContainer.getInstance();
  if (mc.is3DEnabled()) {
    var camera = mc.getOLCesium().getCamera();

    if (camera instanceof os.olcs.Camera) {
      var extent = camera.getExtent();

      if (extent) {
        return ol.proj.transformExtent(extent, os.proj.EPSG4326, os.map.PROJECTION);
      }
    }
  }

  var size = this.getSize();
  return this.getView().calculateExtent(size || [0, 0]);
};


/**
 * Pick the Cesium globe at the specified pixel and return the lon/lat coordinate.
 * @param {Array<number>} pixel The pixel.
 * @return {?Array<number>} coordinate The coordinate, in Lon, Lat (EPSG:4326), or null if not picked.
 * @private
 */
os.Map.prototype.get3DLonLat_ = function(pixel) {
  // verify the pixel is valid and numeric. key events in particular can provide NaN pixels.
  if (pixel && pixel.length == 2 && !isNaN(pixel[0]) && !isNaN(pixel[1])) {
    var olCesium = os.MapContainer.getInstance().getOLCesium();
    var cartesian = new Cesium.Cartesian2(pixel[0], pixel[1]);
    var scene = olCesium.getCesiumScene();
    cartesian = scene.camera.pickEllipsoid(cartesian);

    if (cartesian) {
      var cartographic = scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      return [
        Cesium.Math.toDegrees(cartographic.longitude),
        Cesium.Math.toDegrees(cartographic.latitude)
      ];
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
os.Map.prototype.getCoordinateFromPixel = function(pixel) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    var coord = this.get3DLonLat_(pixel);

    if (coord) {
      return ol.proj.fromLonLat(coord, os.map.PROJECTION);
    }

    return null;
  }

  var coord = os.Map.base(this, 'getCoordinateFromPixel', pixel);
  var extent = this.getView().getProjection().getExtent();
  if (coord && (coord[1] < extent[1] || coord[1] > extent[3])) {
    // don't return coordinates outside of the projection bounds
    return null;
  }

  return coord;
};


/**
 * @inheritDoc
 */
os.Map.prototype.getPixelFromCoordinate = function(coordinate) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    if (!coordinate) {
      return null;
    }

    coordinate = ol.proj.toLonLat(coordinate, os.map.PROJECTION);
    var olCesium = os.MapContainer.getInstance().getOLCesium();
    var cartesian = olcs.core.ol4326CoordinateToCesiumCartesian(coordinate);

    cartesian = Cesium.SceneTransforms.wgs84ToWindowCoordinates(olCesium.getCesiumScene(), cartesian);
    return cartesian ? [cartesian.x, cartesian.y] : null;
  }

  return os.Map.base(this, 'getPixelFromCoordinate', coordinate);
};


/**
 * Get the 2D pixel from a coordinate. This is the same as getPixelFromCoordinate except that it only returns
 * the 2D map's pixel.
 * @param {ol.Coordinate} coordinate A map coordinate.
 * @return {ol.Pixel} A pixel position in the map viewport.
 */
os.Map.prototype.get2DPixelFromCoordinate = function(coordinate) {
  return os.Map.superClass_.getPixelFromCoordinate.call(this, coordinate);
};


/**
 * @inheritDoc
 */
os.Map.prototype.forEachFeatureAtPixel = function(pixel, callback, opt_options) {
  // TODO: in the future, attempt this on the surrounding pixels as well
  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    // NOTE: The 3D version does not follow the full spec for forEachFeatureAtPixel. In all of our current
    // calls, we are only concerned with the top feature. Therefore, Scene.pick() is used instead of
    // Scene.drillPick(). If the calling method is attempting to loop over more than the top pixel, the 3D
    // method will fail over to the OL3 method.

    var olCesium = mapContainer.getOLCesium();
    var cartesian = new Cesium.Cartesian2(pixel[0], pixel[1]);
    var picked = /** @type {Cesium.Primitive} */ (olCesium.getCesiumScene().pick(cartesian));
    if (picked && picked.primitive) {
      // convert primitive to feature
      var feature = picked.primitive.olFeature;
      var layer = picked.primitive.olLayer;

      // todo For collections (polygons and perhaps others?), olFeature is put on the PrimitiveCollection rather
      // than the primitive itself. How do we get at those?

      if (feature && layer) {
        var layerFilter = opt_options ? opt_options.layerFilter : undefined;
        if (!layerFilter || layerFilter(layer)) {
          var result = callback(feature, layer);
          if (result) {
            return result;
          }
        }
      }
    } else {
      return null;
    }
  }

  // Due to the TODO above with polygons and lines, this needs to be a failover and not in an else block, as it should
  // still work for features on the globe (but not for features with altitude). Make sure it's on the globe by getting
  // the coordinate first, or OL3 will throw an exception.
  var coordinate = this.getCoordinateFromPixel(pixel);
  if (coordinate) {
    return os.Map.base(this, 'forEachFeatureAtPixel', pixel, callback, opt_options);
  }

  return null;
};


/**
 * Toggles user movement of the 3D globe
 * @param {boolean} value
 */
os.Map.prototype.toggleMovement = function(value) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    var olCesium = os.MapContainer.getInstance().getOLCesium();
    var cc = olCesium.getCesiumScene().screenSpaceCameraController;
    cc.enableInputs = value;
  }
};


/**
 * override so we can ignore events if there is an input box as the target
 * @inheritDoc
 */
os.Map.prototype.handleBrowserEvent = function(browserEvent, opt_type) {
  if (!browserEvent.defaultPrevented) {
    // Only pass to interactions if not in input / text box
    var target = /** @type {Element} */ (browserEvent.target);
    if (target.tagName !== goog.dom.TagName.INPUT.toString() &&
        target.tagName !== goog.dom.TagName.TEXTAREA.toString() &&
        !document.querySelector(os.ui.MODAL_SELECTOR)) {
      os.Map.superClass_.handleBrowserEvent.call(this, browserEvent, opt_type);
    }
  }
};


/**
 * `ol.Map` registers this function as the `ol.events.EventType.RESIZE` resize handler, and we want to call it
 * ourselves after resetting the canvas size. We override it to fix a bug in Firefox where the computed style is
 * null in a hidden IFrame and for IE 10 sizing issues. Without this override, map initialization will fail.
 *
 * @override
 */
os.Map.prototype.updateSize = function() {
  var targetElement = this.getTargetElement();

  if (!targetElement) {
    this.setSize(undefined);
  } else {
    var computedStyle = getComputedStyle(targetElement);
    if (computedStyle) {
      if (goog.userAgent.IE && (targetElement.offsetWidth == 0 || targetElement.offsetHeight == 0)) {
        // IE 10 hack - element offsetHeight is sometimes 0, so manually determine values
        var navbars = document.getElementsByClassName('navbar');
        var navbarHeight = 0;
        for (var i = 0; i < navbars.length; i++) {
          navbarHeight += navbars[0].offsetHeight;
        }
        var height = document.documentElement.clientHeight - navbarHeight;
        height = height > 0 ? height : 0;
        var width = document.documentElement.clientWidth;

        this.setSize([width, height]);
      } else {
        this.setSize([
          targetElement.offsetWidth -
              parseFloat(computedStyle['borderLeftWidth']) -
              parseFloat(computedStyle['paddingLeft']) -
              parseFloat(computedStyle['paddingRight']) -
              parseFloat(computedStyle['borderRightWidth']),
          targetElement.offsetHeight -
              parseFloat(computedStyle['borderTopWidth']) -
              parseFloat(computedStyle['paddingTop']) -
              parseFloat(computedStyle['paddingBottom']) -
              parseFloat(computedStyle['borderBottomWidth'])
        ]);
      }
    } else {
      this.setSize(undefined);
    }
  }
};

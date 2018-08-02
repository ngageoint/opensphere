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
    var camera = mc.getWebGLCamera();
    if (camera) {
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
 * @inheritDoc
 */
os.Map.prototype.getCoordinateFromPixel = function(pixel) {
  if (os.MapContainer.getInstance().is3DEnabled()) {
    var webGL = os.MapContainer.getInstance().getWebGLRenderer();
    var coord = webGL ? webGL.getCoordinateFromPixel(pixel) : null;
    return coord ? ol.proj.fromLonLat(coord, os.map.PROJECTION) : null;
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
  if (os.MapContainer.getInstance().is3DEnabled() && coordinate) {
    coordinate = ol.proj.toLonLat(coordinate, os.map.PROJECTION);

    var webGL = os.MapContainer.getInstance().getWebGLRenderer();
    return webGL ? webGL.getPixelFromCoordinate(coordinate) : null;
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
    var webGL = os.MapContainer.getInstance().getWebGLRenderer();
    return webGL ? webGL.forEachFeatureAtPixel(pixel, callback, opt_options) : null;
  }

  // Due to the TODO above with polygons and lines, this needs to be a failover and not in an else block, as it should
  // still work for features on the globe (but not for features with altitude). Make sure it's on the globe by getting
  // the coordinate first, or OpenLayers will throw an exception.
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
  var mc = os.MapContainer.getInstance();
  if (mc.is3DEnabled()) {
    var webGL = mc.getWebGLRenderer();
    if (webGL) {
      webGL.toggleMovement(value);
    }
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

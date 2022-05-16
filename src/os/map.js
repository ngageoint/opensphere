goog.declareModuleId('os.Map');

import OLMap from 'ol/src/Map.js';
import {fromLonLat, toLonLat, transformExtent} from 'ol/src/proj.js';

import './mixin/canvasreplaygroupmixin.js';
import './mixin/canvasreplaymixin.js';
import './mixin/canvasexecutormixin.js';
import * as osMap from './map/map.js';
import {getMapContainer} from './map/mapinstance.js';
import {EPSG4326} from './proj/proj.js';
import {MODAL_SELECTOR} from './ui/ui.js';

const TagName = goog.require('goog.dom.TagName');
const {IE} = goog.require('goog.userAgent');


/**
 * The OpenSphere map.
 */
export default class Map extends OLMap {
  /**
   * Constructor.
   * @param {olx.MapOptions} options Map options
   */
  constructor(options) {
    super(options);
  }

  /**
   * @return {ol.Extent} The extent of the map
   */
  getExtent() {
    var mc = getMapContainer();
    if (mc.is3DEnabled()) {
      var camera = mc.getWebGLCamera();
      if (camera) {
        var extent = camera.getExtent();
        if (extent) {
          return transformExtent(extent, EPSG4326, osMap.PROJECTION);
        }
      }
    }

    var size = this.getSize();
    return this.getView().calculateExtent(size || [0, 0]);
  }

  /**
   * @inheritDoc
   */
  getCoordinateFromPixelInternal(pixel) {
    if (getMapContainer().is3DEnabled()) {
      var webGL = getMapContainer().getWebGLRenderer();
      var coord = webGL ? webGL.getCoordinateFromPixel(pixel) : null;
      return coord ? fromLonLat(coord, osMap.PROJECTION) : null;
    }

    var coord = super.getCoordinateFromPixelInternal(pixel);
    var extent = this.getView().getProjection().getExtent();
    if (coord && (coord[1] < extent[1] || coord[1] > extent[3])) {
      // don't return coordinates outside of the projection bounds
      return null;
    }

    return coord;
  }

  /**
   * @inheritDoc
   */
  getPixelFromCoordinateInternal(coordinate) {
    if (getMapContainer().is3DEnabled() && coordinate) {
      coordinate = toLonLat(coordinate, osMap.PROJECTION);

      var webGL = getMapContainer().getWebGLRenderer();
      return webGL ? webGL.getPixelFromCoordinate(coordinate) : null;
    }

    return super.getPixelFromCoordinateInternal(coordinate);
  }

  /**
   * Get the 2D pixel from a coordinate. This is the same as getPixelFromCoordinate except that it only returns
   * the 2D map's pixel.
   *
   * @param {ol.Coordinate} coordinate A map coordinate.
   * @return {ol.Pixel} A pixel position in the map viewport.
   */
  get2DPixelFromCoordinate(coordinate) {
    return super.getPixelFromCoordinate(coordinate);
  }

  /**
   * @inheritDoc
   */
  forEachFeatureAtPixel(pixel, callback, opt_options) {
    // TODO: in the future, attempt this on the surrounding pixels as well

    var mapContainer = getMapContainer();
    if (mapContainer.is3DEnabled()) {
      var webGL = getMapContainer().getWebGLRenderer();
      return webGL ? webGL.forEachFeatureAtPixel(pixel, callback, opt_options) : null;
    }

    // Due to the TODO above with polygons and lines, this needs to be a failover and not in an else block, as it should
    // still work for features on the globe (but not for features with altitude). Make sure it's on the globe by getting
    // the coordinate first, or OpenLayers will throw an exception.
    var coordinate = this.getCoordinateFromPixel(pixel);
    if (coordinate) {
      return super.forEachFeatureAtPixel(pixel, callback, opt_options);
    }

    return null;
  }

  /**
   * Toggles user movement of the 3D globe
   *
   * @param {boolean} value
   */
  toggleMovement(value) {
    var mc = getMapContainer();
    if (mc.is3DEnabled()) {
      var webGL = mc.getWebGLRenderer();
      if (webGL) {
        webGL.toggleMovement(value);
      }
    }
  }

  /**
   * override so we can ignore events if there is an input box as the target
   *
   * @inheritDoc
   */
  handleBrowserEvent(browserEvent, opt_type) {
    if (!browserEvent.defaultPrevented) {
      // Only pass to interactions if not in input / text box
      var target = /** @type {Element} */ (browserEvent.target);
      if (target.tagName !== TagName.INPUT.toString() &&
          target.tagName !== TagName.TEXTAREA.toString() &&
          !document.querySelector(MODAL_SELECTOR)) {
        super.handleBrowserEvent(browserEvent, opt_type);
      }
    }
  }

  /**
   * `OLMap` registers this function as the `ol.events.EventType.RESIZE` resize handler, and we want to call it
   * ourselves after resetting the canvas size. We override it to fix a bug in Firefox where the computed style is
   * null in a hidden IFrame and for IE 10 sizing issues. Without this override, map initialization will fail.
   *
   * @override
   */
  updateSize() {
    var targetElement = this.getTargetElement();

    if (!targetElement) {
      this.setSize(undefined);
    } else {
      var computedStyle = getComputedStyle(targetElement);
      if (computedStyle) {
        if (IE && (targetElement.offsetWidth == 0 || targetElement.offsetHeight == 0)) {
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
  }
}

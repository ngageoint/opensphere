goog.declareModuleId('os.control.ZoomLevel');

import Control from 'ol/src/control/Control.js';
import {CLASS_UNSELECTABLE} from 'ol/src/css.js';

import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import UnitManager from '../unit/unitmanager.js';

const dom = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');
const safe = goog.require('goog.dom.safe');
const GoogEventType = goog.require('goog.events.EventType');
const SafeHtml = goog.require('goog.html.SafeHtml');
const style = goog.require('goog.style');

const {default: ZoomLevelOptions} = goog.requireType('os.control.ZoomLevelOptions');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');


/**
 * Displays the current zoom level and altitude.
 */
export default class ZoomLevel extends Control {
  /**
   * Constructor.
   * @param {ZoomLevelOptions=} opt_options Scale line options.
   */
  constructor(opt_options) {
    var options = opt_options || {};

    var className = options.className !== undefined ? options.className : 'ol-zoom-level';
    var element = dom.createDom(TagName.DIV, {
      'class': className + ' ' + CLASS_UNSELECTABLE
    });

    super({
      element: element,
      render: render,
      target: options.target
    });

    /**
     * @type {Element}
     * @private
     */
    this.element_ = element;

    /**
     * @type {Element}
     * @private
     */
    this.altElement_ = dom.createDom(TagName.SPAN, {
      'class': 'altitude-text mr-1'
    });
    this.element_.appendChild(this.altElement_);

    var separator = dom.createDom(TagName.SPAN, {
      'class': 'separator mr-1'
    });
    safe.setInnerHtml(separator, SafeHtml.htmlEscape('|'));
    this.element_.appendChild(separator);

    /**
     * @type {Element}
     * @private
     */
    this.zoomElement_ = dom.createDom(TagName.SPAN, {
      'class': 'zoom-text mr-1'
    });
    this.element_.appendChild(this.zoomElement_);

    /**
     * @type {number|undefined}
     * @private
     */
    this.lastAltitudeVal_ = undefined;

    /**
     * @type {number|undefined}
     * @private
     */
    this.lastZoomVal_ = undefined;

    /**
     * @type {?olx.ViewState}
     * @private
     */
    this.viewState_ = null;

    // initialize from unit manager
    var um = UnitManager.getInstance();
    var units = /** @type {ScaleLineUnits<string>} */ (um.getSelectedSystem());
    this.setAltitudeUnits(units);

    // listen for unit manager changes
    um.listen(GoogEventType.PROPERTYCHANGE, this.onUnitsChange, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    UnitManager.getInstance().unlisten(GoogEventType.PROPERTYCHANGE, this.onUnitsChange, false, this);
  }

  /**
   * Toggle showing zoom/altitude on mouse click.
   *
   * @protected
   */
  reset() {
    // clear cached values
    this.lastAltitudeVal_ = undefined;
    this.lastZoomVal_ = undefined;

    // update the text
    this.updateElement();
  }

  /**
   * Return the units to use in the zoom level when displaying altitude.
   *
   * @return {ScaleLineUnits|undefined}
   */
  getAltitudeUnits() {
    return /** @type {ScaleLineUnits|undefined} */ (this.get(Property.UNITS));
  }

  /**
   * Set the units to use in the zoom level when displaying altitude.
   *
   * @param {ScaleLineUnits} units The units to use
   */
  setAltitudeUnits(units) {
    this.set(Property.UNITS, units);
  }

  /**
   * @param {PropertyChangeEvent} event
   * @protected
   */
  onUnitsChange(event) {
    var newVal = event.getNewValue();
    if (typeof newVal === 'string' && newVal != this.getAltitudeUnits()) {
      this.setAltitudeUnits(/** @type {ScaleLineUnits<string>} */ (newVal));
      this.reset();
    }
  }

  /**
   * Hide the altitude control.
   *
   * @protected
   */
  hideAltitude() {
    style.setElementShown(this.altElement_, false);
    this.lastAltitudeVal_ = undefined;
  }

  /**
   * Hide the zoom level control.
   *
   * @protected
   */
  hideZoom() {
    style.setElementShown(this.zoomElement_, false);
    this.lastZoomVal_ = undefined;
  }

  /**
   * Update the control text.
   *
   * @protected
   */
  updateElement() {
    this.updateAltitudeText();
    this.updateZoomText();
  }

  /**
   * Update the control text for altitude.
   *
   * @protected
   */
  updateAltitudeText() {
    // this value should *only* be set if the displayed text needs to change
    var altitude;

    var map = getMapContainer();
    if (map.is3DEnabled()) {
      var camera = map.getWebGLCamera();
      if (!camera) {
        this.hideAltitude();
        return;
      }

      // in 3d mode, track the last altitude by camera altitude
      var camAltitude = camera.getAltitude();
      if (camAltitude != this.lastAltitudeVal_) {
        this.lastAltitudeVal_ = altitude = camAltitude;
      }
    } else {
      var viewState = this.viewState_;
      if (!viewState) {
        this.hideAltitude();
        return;
      }

      // in 2d mode, track the last altitude by view resolution
      if (viewState.resolution != this.lastAltitudeVal_) {
        this.lastAltitudeVal_ = viewState.resolution;
        var sizeObj = map.getMap().getSize();
        altitude = osMap.distanceForResolution([sizeObj[0], sizeObj[1]], viewState.resolution);
      }
    }

    // null/undefined likely means the value hasn't changed
    if (altitude != null) {
      if (isNaN(altitude)) {
        this.hideAltitude();
      }

      // altitude value has been set, so update the displayed value
      var um = UnitManager.getInstance();
      if (this.altElement_) {
        safe.setInnerHtml(this.altElement_, SafeHtml.htmlEscape(
            'Altitude: ' + um.formatToBestFit('distance', altitude, 'm', um.getBaseSystem(), 3)));
        style.setElementShown(this.altElement_, true);
      }
    }
  }

  /**
   * Update the control text for zoom level.
   *
   * @protected
   */
  updateZoomText() {
    var viewState = this.viewState_;
    if (!viewState) {
      this.hideZoom();
      return;
    }

    // this value should *only* be set if the displayed text needs to change
    var resolution;

    var map = getMapContainer();
    if (map.is3DEnabled()) {
      var camera = map.getWebGLCamera();
      if (!camera) {
        this.hideZoom();
        return;
      }

      // in 3d mode, track the last zoom level by camera altitude. this prevents converting the altitude on every render.
      var altitude = camera.getAltitude();
      if (this.lastZoomVal_ != altitude) {
        this.lastZoomVal_ = altitude;
        resolution = camera.calcResolutionForDistance(altitude, 0);
      }
    } else if (viewState.resolution != this.lastZoomVal_) {
      // in 2d mode, track the last zoom level by view resolution
      this.lastZoomVal_ = viewState.resolution;
      resolution = viewState.resolution;
    }

    // null/undefined likely means the value hasn't changed
    if (resolution != null) {
      // resolution value has been set, so update the displayed zoom level
      var zoom = osMap.resolutionToZoom(resolution, viewState.projection);
      if (zoom == null || zoom == Infinity || isNaN(zoom)) {
        this.hideZoom();
      } else {
        safe.setInnerHtml(/** @type {!Element} */ (this.zoomElement_),
            SafeHtml.htmlEscape('Zoom: ' + zoom.toFixed(1)));
        style.setElementShown(this.zoomElement_, true);
      }
    }
  }

  /**
   * Get the element
   *
   * @return {Element}
   */
  getElement() {
    return this.element_;
  }
}

/**
 * @param {ol.MapEvent} mapEvent Event.
 * @this ZoomLevel
 */
const render = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (frameState === null) {
    this.viewState_ = null;
  } else {
    this.viewState_ = frameState.viewState;
  }
  this.updateElement();
};


/**
 * @enum {string}
 */
const Property = {
  UNITS: 'units'
};

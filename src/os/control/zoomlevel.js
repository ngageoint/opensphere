goog.provide('os.control.ZoomLevel');
goog.provide('os.control.ZoomLevelOptions');

goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.dom.classes');
goog.require('goog.dom.safe');
goog.require('goog.html.SafeHtml');
goog.require('ol.control.Control');
goog.require('ol.control.ScaleLineUnits');
goog.require('ol.css');
goog.require('os.map');
goog.require('os.unit.UnitManager');


/**
 * @typedef {{
 *   className: (string|undefined),
 *   target: (Element|undefined)
 *   }}
 */
os.control.ZoomLevelOptions;



/**
 * @param {os.control.ZoomLevelOptions=} opt_options Scale line options.
 * @extends {ol.control.Control}
 * @constructor
 */
os.control.ZoomLevel = function(opt_options) {
  var options = opt_options || {};

  var className = goog.isDef(options.className) ? options.className : 'ol-zoom-level';

  /**
   * @type {Element}
   * @private
   */
  this.element_ = goog.dom.createDom(goog.dom.TagName.DIV, {
    'class': className + ' ' + ol.css.CLASS_UNSELECTABLE
  });

  /**
   * @type {Element}
   * @private
   */
  this.altElement_ = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'class': 'altitude-text'
  });
  this.element_.appendChild(this.altElement_);

  /**
   * @type {Element}
   * @private
   */
  this.zoomElement_ = goog.dom.createDom(goog.dom.TagName.SPAN, {
    'class': 'zoom-text'
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

  os.control.ZoomLevel.base(this, 'constructor', {
    element: this.element_,
    render: os.control.ZoomLevel.render_,
    target: options.target
  });

  // initialize from unit manager
  var um = os.unit.UnitManager.getInstance();
  var units = /** @type {ol.control.ScaleLineUnits<string>} */ (um.getSelectedSystem());
  this.setAltitudeUnits(units);

  // listen for unit manager changes
  um.listen(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange, false, this);
};
goog.inherits(os.control.ZoomLevel, ol.control.Control);


/**
 * @inheritDoc
 */
os.control.ZoomLevel.prototype.disposeInternal = function() {
  os.control.ZoomLevel.base(this, 'disposeInternal');
  os.unit.UnitManager.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange, false, this);
};


/**
 * Toggle showing zoom/altitude on mouse click.
 * @protected
 */
os.control.ZoomLevel.prototype.reset = function() {
  // clear cached values
  this.lastAltitudeVal_ = undefined;
  this.lastZoomVal_ = undefined;

  // update the text
  this.updateElement();
};


/**
 * Return the units to use in the zoom level when displaying altitude.
 * @return {ol.control.ScaleLineUnits|undefined}
 */
os.control.ZoomLevel.prototype.getAltitudeUnits = function() {
  return /** @type {ol.control.ScaleLineUnits|undefined} */ (this.get(os.control.ZoomLevel.Property_.UNITS));
};


/**
 * Set the units to use in the zoom level when displaying altitude.
 * @param {ol.control.ScaleLineUnits} units The units to use
 */
os.control.ZoomLevel.prototype.setAltitudeUnits = function(units) {
  this.set(os.control.ZoomLevel.Property_.UNITS, units);
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
os.control.ZoomLevel.prototype.onUnitsChange = function(event) {
  var newVal = event.getNewValue();
  if (typeof newVal === 'string' && newVal != this.getAltitudeUnits()) {
    this.setAltitudeUnits(/** @type {ol.control.ScaleLineUnits<string>} */ (newVal));
    this.reset();
  }
};


/**
 * @param {ol.MapEvent} mapEvent Event.
 * @this os.control.ZoomLevel
 * @private
 */
os.control.ZoomLevel.render_ = function(mapEvent) {
  var frameState = mapEvent.frameState;
  if (goog.isNull(frameState)) {
    this.viewState_ = null;
  } else {
    this.viewState_ = frameState.viewState;
  }
  this.updateElement();
};


/**
 * Hide the altitude control.
 * @protected
 */
os.control.ZoomLevel.prototype.hideAltitude = function() {
  goog.style.setElementShown(this.altElement_, false);
  this.lastAltitudeVal_ = undefined;
};


/**
 * Hide the zoom level control.
 * @protected
 */
os.control.ZoomLevel.prototype.hideZoom = function() {
  goog.style.setElementShown(this.zoomElement_, false);
  this.lastZoomVal_ = undefined;
};


/**
 * Update the control text.
 * @protected
 */
os.control.ZoomLevel.prototype.updateElement = function() {
  this.updateAltitudeText();
  this.updateZoomText();
};


/**
 * Update the control text for altitude.
 * @protected
 */
os.control.ZoomLevel.prototype.updateAltitudeText = function() {
  // this value should *only* be set if the displayed text needs to change
  var altitude;

  var map = os.MapContainer.getInstance();
  if (map.is3DEnabled()) {
    var camera = map.getCesiumCamera();
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
      altitude = os.map.distanceForResolution([sizeObj[0], sizeObj[1]], viewState.resolution);
    }
  }

  // null/undefined likely means the value hasn't changed
  if (altitude != null) {
    if (isNaN(altitude)) {
      this.hideAltitude();
    }

    // altitude value has been set, so update the displayed value
    var um = os.unit.UnitManager.getInstance();
    if (this.altElement_) {
      goog.dom.safe.setInnerHtml(this.altElement_, goog.html.SafeHtml.htmlEscape(
          'Altitude: ' + um.formatToBestFit('distance', altitude, 'm', um.getBaseSystem(), 3)));
      goog.style.setElementShown(this.altElement_, true);
    }
  }
};


/**
 * Update the control text for zoom level.
 * @protected
 */
os.control.ZoomLevel.prototype.updateZoomText = function() {
  var viewState = this.viewState_;
  if (!viewState) {
    this.hideZoom();
    return;
  }

  // this value should *only* be set if the displayed text needs to change
  var resolution;

  var map = os.MapContainer.getInstance();
  if (map.is3DEnabled()) {
    var camera = map.getCesiumCamera();
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
    var zoom = os.map.resolutionToZoom(resolution, viewState.projection);
    if (zoom == null || zoom == Infinity || isNaN(zoom)) {
      this.hideZoom();
    } else {
      goog.dom.safe.setInnerHtml(/** @type {!Element} */ (this.zoomElement_),
          goog.html.SafeHtml.htmlEscape('Zoom: ' + zoom.toFixed(1)));
      goog.style.setElementShown(this.zoomElement_, true);
    }
  }
};


/**
 * @enum {string}
 * @private
 */
os.control.ZoomLevel.Property_ = {
  UNITS: 'units'
};

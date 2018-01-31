goog.provide('os.control.ScaleLine');

goog.require('goog.dom');
goog.require('goog.dom.safe');
goog.require('goog.html.SafeHtml');
goog.require('ol.control.ScaleLine');
goog.require('ol.control.ScaleLineUnits');
goog.require('ol.proj');
goog.require('os.config.Settings');
goog.require('os.geo');
goog.require('os.map');
goog.require('os.math');



/**
 * @constructor
 * @param {olx.control.ScaleLineOptions=} opt_options
 * @extends {ol.control.ScaleLine}
 */
os.control.ScaleLine = function(opt_options) {
  os.control.ScaleLine.base(this, 'constructor', opt_options);

  // initialize from unit manager
  var um = os.unit.UnitManager.getInstance();
  this.setUnits(/** @type {ol.control.ScaleLineUnits<string>} */ (um.getSelectedSystem()));

  // listen for unit manager changes
  um.listen(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange, false, this);
};
goog.inherits(os.control.ScaleLine, ol.control.ScaleLine);


/**
 * @inheritDoc
 */
os.control.ScaleLine.prototype.disposeInternal = function() {
  os.unit.UnitManager.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange, false, this);
  os.control.ScaleLine.base(this, 'disposeInternal');
};


/**
 * @param {os.events.PropertyChangeEvent} event
 * @protected
 */
os.control.ScaleLine.prototype.onUnitsChange = function(event) {
  var newVal = event.getNewValue();
  if (typeof newVal === 'string' && newVal != this.getUnits()) {
    this.setUnits(/** @type {ol.control.ScaleLineUnits<string>} */ (newVal));
  }
};


/**
 * Hide the control.
 * @protected
 * @suppress {accessControls}
 */
os.control.ScaleLine.prototype.hide = function() {
  if (this.renderedVisible_) {
    this.element_.style.display = 'none';
    this.renderedVisible_ = false;
  }
};


/**
 * This is a copy of the original OpenLayers code, with additional bits for showing a single unit
 * @inheritDoc
 * @suppress {accessControls}
 */
os.control.ScaleLine.prototype.updateElement_ = function() {
  var viewState = this.viewState_;

  if (!viewState) {
    this.hide();
    return;
  }

  // The goal of the original Openlayers logic here is to get meters/pixel.
  // However, it is wrong (see issue #7086 for Openlayers) for some projections.
  var map = os.MapContainer.getInstance().getMap();

  var p2 = map.getPixelFromCoordinate(viewState.center);
  if (!p2) {
    this.hide();
    return;
  }

  p2[0] += 1;

  var c2 = map.getCoordinateFromPixel(p2);
  if (!c2) {
    this.hide();
    return;
  }

  var c1 = ol.proj.toLonLat(viewState.center, os.map.PROJECTION);
  c2 = ol.proj.toLonLat(c2, os.map.PROJECTION);

  var pointResolution = window.osasm ? osasm.geodesicInverse(c1, c2).distance : NaN;
  var nominalCount = this.minWidth_ * pointResolution;
  var suffix = '';
  var units = this.getUnits();
  if (units == ol.control.ScaleLineUnits.DEGREES) {
    var metersPerDegree = ol.proj.METERS_PER_UNIT[ol.proj.Units.DEGREES];
    pointResolution /= metersPerDegree;
    if (nominalCount < metersPerDegree / 60) {
      suffix = '\u2033'; // seconds
      pointResolution *= 3600;
    } else if (nominalCount < metersPerDegree) {
      suffix = '\u2032'; // minutes
      pointResolution *= 60;
    } else {
      suffix = '\u00b0'; // degrees
    }
  } else if (units == ol.control.ScaleLineUnits.IMPERIAL) {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution /= 0.0254;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.3048;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.344;
    }
  } else if (units == ol.control.ScaleLineUnits.NAUTICAL || units == os.unit.unitSystem.NAUTICALMILE) {
    pointResolution /= 1852;
    suffix = 'nmi';
  } else if (units == ol.control.ScaleLineUnits.METRIC) {
    if (nominalCount < 1) {
      suffix = 'mm';
      pointResolution *= 1000;
    } else if (nominalCount < 1000) {
      suffix = 'm';
    } else {
      suffix = 'km';
      pointResolution /= 1000;
    }
  } else if (units == ol.control.ScaleLineUnits.US) {
    if (nominalCount < 0.9144) {
      suffix = 'in';
      pointResolution *= 39.37;
    } else if (nominalCount < 1609.344) {
      suffix = 'ft';
      pointResolution /= 0.30480061;
    } else {
      suffix = 'mi';
      pointResolution /= 1609.3472;
    }
  } else if (units == os.unit.unitSystem.MILE) { // allow for other unit systems
    suffix = 'mi';
    pointResolution /= 1609.3472;
  } else if (units == os.unit.unitSystem.YARD) {
    suffix = 'yd';
    pointResolution *= 1.09361;
  } else if (units == os.unit.unitSystem.FEET) {
    suffix = 'ft';
    pointResolution /= 0.30480061;
  } else {
    ol.asserts.assert(false, 33); // Invalid units
  }

  var i = 3 * Math.floor(Math.log(this.minWidth_ * pointResolution) / Math.log(10));
  var count;
  var width;
  while (true) {
    count = ol.control.ScaleLine.LEADING_DIGITS[((i % 3) + 3) % 3] * Math.pow(10, Math.floor(i / 3));
    width = Math.round(count / pointResolution);
    if (isNaN(width)) {
      this.element_.style.display = 'none';
      this.renderedVisible_ = false;
      return;
    } else if (width >= this.minWidth_) {
      break;
    }
    ++i;
  }

  var displayNum = count;
  if (count < 1E-2 || count > 1E4) { // fixes overlapping labels at zoom level 20+ and 3-
    displayNum = count.toExponential();
  }
  var html = displayNum + ' ' + suffix;
  if (this.renderedHTML_ != html && this.innerElement_) {
    goog.dom.safe.setInnerHtml(this.innerElement_, goog.html.SafeHtml.htmlEscape(html));
    this.renderedHTML_ = html;
  }

  if (this.renderedWidth_ != width) {
    this.innerElement_.style.width = width + 'px';
    this.renderedWidth_ = width;
  }

  if (!this.renderedVisible_) {
    this.element_.style.display = '';
    this.renderedVisible_ = true;
  }
};

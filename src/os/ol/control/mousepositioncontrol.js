goog.provide('os.ol.control.MousePosition');

goog.require('goog.events.EventType');
goog.require('ol.ViewHint');
goog.require('ol.control.MousePosition');
goog.require('ol.coordinate');
goog.require('os.bearing');
goog.require('os.config.Settings');
goog.require('os.geo');
goog.require('os.ui.user.settings.LocationSetting');



/**
 * Extends the OpenLayers 3 MousePosition control to allow switching between different coordinate formats.
 * @param {olx.control.MousePositionOptions=} opt_options Mouse position options.
 * @extends {ol.control.MousePosition}
 * @constructor
 */
os.ol.control.MousePosition = function(opt_options) {
  opt_options = opt_options || {};
  opt_options.undefinedHTML = 'No coordinate';

  os.ol.control.MousePosition.base(this, 'constructor', opt_options);

  /**
   * @type {string}
   * @private
   */
  this.format_ = 'deg';

  /**
   * @type {Object<string, ol.CoordinateFormatType>}
   * @private
   */
  this.formatMap_ = os.ol.control.MousePosition.FormatMap;

  /**
   * @type {?Event}
   * @private
   */
  this.lastBrowserEvent_ = null;

  if (opt_options && opt_options.useSettings) {
    os.settings.listen(os.ui.location.LocationSetting.POSITION, this.onFormatChange_, false, this);
    this.format_ = /** @type {string} */ (os.settings.get(
        os.ui.location.LocationSetting.POSITION, os.ui.location.Format.DEG));
  }

  this.setFormat_(this.format_);

  /**
   * @type {goog.events.Key}
   * @private
   */
  this.clickListenKey_ = null;
  if (this.element) {
    this.clickListenKey_ = goog.events.listen(this.element, goog.events.EventType.CLICK, this.onMouseClick_,
        false, this);
  }

  os.unit.UnitManager.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.onUnitChange_, false, this);
  os.settings.listen(os.bearing.BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);
};
goog.inherits(os.ol.control.MousePosition, ol.control.MousePosition);


/**
 * @param {ol.Coordinate|undefined} coordinate
 * @return {string}
 * @const
 */
os.ol.control.MousePosition.LON_LAT_FORMAT = function(coordinate) {
  if (!coordinate) {
    return 'No coordinate';
  }

  // fix the number of decimal places
  var lon = os.geo.padCoordinate(os.geo.normalizeLongitude(coordinate[0]), true, 5);
  var lat = os.geo.padCoordinate(coordinate[1], false, 5);

  if (lon.length < 10) {
    lon = '+' + lon;
  }

  if (lat.length < 9) {
    lat = '+' + lat;
  }

  return lat + ', ' + lon;
};


/**
 * @param {ol.Coordinate} coordinate
 * @return {string}
 * @const
 */
os.ol.control.MousePosition.MGRS_FORMAT = function(coordinate) {
  return osasm.toMGRS(coordinate);
};


/**
 * @param {ol.Coordinate} coordinate
 * @return {string}
 * @const
 */
os.ol.control.MousePosition.SEXAGESIMAL_FORMAT = function(coordinate) {
  return (os.geo.toSexagesimal(coordinate[1], false, false) + ' ' +
      os.geo.toSexagesimal(os.geo.normalizeLongitude(coordinate[0]), true, false)).replace(/°/g, '&deg;');
};


/**
 * @type {!Object<string, ol.CoordinateFormatType>}
 */
os.ol.control.MousePosition.FormatMap = {
  'deg': os.ol.control.MousePosition.LON_LAT_FORMAT,
  'dms': os.ol.control.MousePosition.SEXAGESIMAL_FORMAT,
  'mgrs': os.ol.control.MousePosition.MGRS_FORMAT
};


/**
 * @inheritDoc
 */
os.ol.control.MousePosition.prototype.disposeInternal = function() {
  os.settings.unlisten(os.ui.location.LocationSetting.POSITION, this.onFormatChange_, false, this);

  if (this.clickListenKey_) {
    goog.events.unlistenByKey(this.clickListenKey_);
    this.clickListenKey_ = null;
  }

  os.unit.UnitManager.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onUnitChange_, false, this);
  os.settings.unlisten(os.bearing.BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);

  os.ol.control.MousePosition.base(this, 'disposeInternal');
};


/**
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.ol.control.MousePosition.prototype.onFormatChange_ = function(event) {
  if (event && typeof event.newVal == 'string') {
    this.setFormat_(event.newVal);
  }
};


/**
 * Updates the UI to reflect the new unit system.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.ol.control.MousePosition.prototype.onUnitChange_ = function(event) {
  this.setFormat_(this.format_);
};


/**
 * Set the format for the control.
 * @param {string} format
 * @private
 */
os.ol.control.MousePosition.prototype.setFormat_ = function(format) {
  if (!(format in this.formatMap_)) {
    format = 'deg';
  }

  var formatter = this.formatMap_[format];
  this.setCoordinateFormat(formatter);

  if (format !== this.format_) {
    this.format_ = format;

    var settingsFormats = goog.object.getValues(os.ui.location.Format);
    if (settingsFormats.indexOf(this.format_) > -1) {
      // only put this in settings if it is one of the supported settings formats
      os.settings.set(os.ui.location.LocationSetting.POSITION, this.format_);
    }
  }

  if (this.lastBrowserEvent_) {
    os.ol.control.MousePosition.superClass_.handleMouseMove.call(this, this.lastBrowserEvent_);
  }
};


/**
 * @inheritDoc
 */
os.ol.control.MousePosition.prototype.handleMouseMove = function(event) {
  os.ol.control.MousePosition.base(this, 'handleMouseMove', event);
  this.lastBrowserEvent_ = event;
};


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.ol.control.MousePosition.prototype.updateHTML_ = function(pixel) {
  var map = this.getMap();
  if (map && map.getView().getHints()[ol.ViewHint.INTERACTING] <= 0) {
    os.ol.control.MousePosition.superClass_.updateHTML_.call(this, pixel);
  }
};


/**
 * @inheritDoc
 */
os.ol.control.MousePosition.prototype.handleMouseOut = function(event) {
  // do nothing. this causes the last mouse position to always be displayed instead of clearing the position.
};


/**
 * @param {goog.events.Event} event
 * @private
 */
os.ol.control.MousePosition.prototype.onMouseClick_ = function(event) {
  var keys = goog.object.getKeys(this.formatMap_);
  var index = keys.indexOf(this.format_);

  if (index > keys.length) {
    index = 0;
  }

  var newFormat = keys[index + 1];
  this.setFormat_(newFormat);

  if (this.lastBrowserEvent_) {
    os.ol.control.MousePosition.superClass_.handleMouseMove.call(this, this.lastBrowserEvent_);
  }
};


/**
 * Return the position of the mouse pointer
 * @param {ol.Coordinate=} opt_coord The coordinate
 * @return {string}
 * @suppress {accessControls} to allow access to the map and last pixel
 */
os.ol.control.MousePosition.prototype.getPositionString = function(opt_coord) {
  var coord = opt_coord || this.map_.getCoordinateFromPixel(this.lastMouseMovePixel_);
  if (coord) {
    var s = '';
    coord = ol.proj.toLonLat(coord, this.map_.getView().getProjection());
    for (var key in this.formatMap_) {
      var formatter = this.formatMap_[key];
      s += formatter(coord) + '\n';
    }

    // chop off the last newline
    s = s.substring(0, s.length - 1);
    return s.replace(/&deg;/g, '°');
  } else {
    return '';
  }
};


/**
 * Forces an update of the displayed text to show the new bearing.
 * @private
 */
os.ol.control.MousePosition.prototype.onBearingChange_ = function() {
  if (this.lastBrowserEvent_) {
    this.handleMouseMove(this.lastBrowserEvent_);
  }
};

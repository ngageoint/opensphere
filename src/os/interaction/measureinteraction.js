goog.provide('os.interaction.Measure');

goog.require('ol');
goog.require('ol.MapBrowserPointerEvent');
goog.require('ol.events.condition');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.layer.Vector');
goog.require('ol.source.Vector');
goog.require('ol.style.Circle');
goog.require('ol.style.Fill');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('ol.style.Text');
goog.require('os.bearing');
goog.require('os.config.Settings');
goog.require('os.feature.measure');
goog.require('os.fn');
goog.require('os.geo2');
goog.require('os.interaction.DrawPolygon');
goog.require('os.math');



/**
 * Interaction to measure the distance between drawn points on the map.
 *
 * @param {olx.interaction.PointerOptions=} opt_options
 * @extends {os.interaction.DrawPolygon}
 * @constructor
 */
os.interaction.Measure = function(opt_options) {
  os.interaction.Measure.base(this, 'constructor');
  this.color = [255, 0, 0, 1];
  this.type = 'measure';

  /**
   * @type {number}
   * @private
   */
  this.lastlen_ = 0;

  /**
   * @type {Array<number>}
   * @private
   */
  this.bearings_ = [];

  /**
   * @type {Array<number>}
   * @private
   */
  this.distances_ = [];

  this.setStyle(new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: this.color,
      lineCap: 'square',
      width: 2
    })
  }));

  /**
   * @type {!Array<!ol.style.Style>}
   * @private
   */
  this.waypoints_ = [];

  os.unit.UnitManager.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
  os.settings.listen(os.bearing.BearingSettingsKeys.BEARING_TYPE, this.onChange_, false, this);
};
goog.inherits(os.interaction.Measure, os.interaction.DrawPolygon);


/**
 * @type {number}
 */
os.interaction.Measure.nextId = 0;


/**
 * @type {number}
 * @const
 * @private
 */
os.interaction.Measure.LABEL_FONT_SIZE_ = 14;


/**
 * @type {os.interpolate.Method}
 */
os.interaction.Measure.method = os.interpolate.getMethod();


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.disposeInternal = function() {
  os.unit.UnitManager.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onUnitsChange_, false, this);
  os.settings.unlisten(os.bearing.BearingSettingsKeys.BEARING_TYPE, this.onChange_, false, this);
  os.interaction.Measure.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.getGeometry = function() {
  this.coords.length = this.coords.length - 1;
  var geom = new ol.geom.LineString(this.coords);
  os.geo2.normalizeGeometryCoordinates(geom);
  return geom;
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.getProperties = function() {
  var props = {};
  props[os.interpolate.METHOD_FIELD] = os.interaction.Measure.method;
  return props;
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.shouldFinish = function(mapBrowserEvent) {
  return this.distances_.length > 0 && !mapBrowserEvent.originalEvent.shiftKey;
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.begin = function(mapBrowserEvent) {
  if (this.line2D) {
    this.line2D = null;
  }

  os.interaction.Measure.base(this, 'begin', mapBrowserEvent);

  this.distances_.length = 0;
  this.bearings_.length = 0;
  this.waypoints_.length = 0;
  this.lastlen_ = 0;
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.beforeUpdate = function(opt_mapBrowserEvent) {
  var result;
  var len = this.coords.length;
  if (len > 1) {
    var j = this.coords.length - 1;
    var i = j - 1;

    var start = ol.proj.toLonLat(this.coords[i], os.map.PROJECTION);
    var end = ol.proj.toLonLat(this.coords[j], os.map.PROJECTION);

    if (os.interaction.Measure.method === os.interpolate.Method.GEODESIC) {
      result = osasm.geodesicInverse(start, end);
    } else {
      result = osasm.rhumbInverse(start, end);
    }
  }

  if (this.lastlen_ != len) {
    if (result) {
      this.distances_.push(result.distance);
      this.bearings_.push(result.initialBearing || result.bearing);
    }
  } else if (result && this.distances_.length > 0) {
    this.distances_[this.distances_.length - 1] = result.distance;
    this.bearings_[this.bearings_.length - 1] = result.initialBearing || result.bearing;
  }

  this.lastlen_ = len;
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.getStyle = function() {
  var style = os.interaction.Measure.base(this, 'getStyle');
  return [style].concat(this.waypoints_);
};


/**
 * @param {string=} opt_text Optional text to apply to the style
 * @return {!ol.style.Text} The text style
 * @private
 */
os.interaction.Measure.getTextStyle_ = function(opt_text) {
  return new ol.style.Text({
    font: os.style.label.getFont(os.interaction.Measure.LABEL_FONT_SIZE_),
    offsetX: 5,
    text: opt_text,
    textAlign: 'left',
    fill: new ol.style.Fill({
      color: [0xff, 0xff, 0xff, 1]
    }),
    stroke: new ol.style.Stroke({
      color: [0, 0, 0, 1],
      width: 2
    })
  });
};


/**
 * Creates waypoints to act as anchors for labels in OL3.
 *
 * @inheritDoc
 */
os.interaction.Measure.prototype.update2D = function() {
  this.createOverlay();

  // add/update waypoints while drawing the line
  var waypoint = null;
  if (this.waypoints_.length === this.distances_.length) {
    // modify the last one
    waypoint = this.waypoints_[this.waypoints_.length - 1];
  } else {
    // create a new one and style it
    waypoint = new ol.style.Style({
      text: os.interaction.Measure.getTextStyle_()
    });

    this.waypoints_.push(waypoint);
  }

  var i = this.distances_.length - 1;

  waypoint.setGeometry(new ol.geom.Point(this.coords[i]));
  waypoint.getText().setText(this.getDistanceText_(i));

  if (this.line2D) {
    this.line2D.setStyle(this.getStyle());
  }

  os.interaction.Measure.base(this, 'update2D');
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.end = function(mapBrowserEvent) {
  if (this.drawing) {
    // add a total distance waypoint if there are multiple points
    if (this.waypoints_.length > 1) {
      var um = os.unit.UnitManager.getInstance();
      var text = um.formatToBestFit('distance', this.getTotalDistance_(), 'm', um.getBaseSystem(),
          os.feature.measure.numDecimalPlaces);

      this.waypoints_.push(new ol.style.Style({
        geometry: new ol.geom.Point(this.coords[this.coords.length - 1]),
        text: os.interaction.Measure.getTextStyle_(text)
      }));

      this.line2D.setStyle(this.getStyle());
    }

    var type = os.interaction.Measure.method;
    type = type.substring(0, 1).toUpperCase() + type.substring(1);

    os.interaction.Measure.nextId++;
    this.line2D.set('title', type + ' Measure ' + os.interaction.Measure.nextId);
    this.line2D.set('icons', ' <i class="fa fa-arrows-h" title="Measure feature"></i> ');
    os.MapContainer.getInstance().addFeature(this.line2D);

    os.interaction.Measure.base(this, 'end', mapBrowserEvent);
  }
};


/**
 * @inheritDoc
 */
os.interaction.Measure.prototype.saveLast = os.fn.noop;


/**
 * Gets the text for the ith distance label.
 *
 * @param {number} i The index of the distance to use.
 * @param {boolean=} opt_noBearing Whether to exclude the bearing (for the last point)
 * @return {string}
 * @private
 */
os.interaction.Measure.prototype.getDistanceText_ = function(i, opt_noBearing) {
  var d = this.distances_[i];
  var coord = /** @type {ol.geom.Point} */ (this.waypoints_[i].getGeometry()).getCoordinates();
  var u = os.unit.UnitManager.getInstance();
  var text = u.formatToBestFit('distance', d, 'm', u.getBaseSystem(), os.feature.measure.numDecimalPlaces);

  var bearing = this.bearings_[i];
  var date = new Date(os.time.TimelineController.getInstance().getCurrent());

  if (bearing !== undefined && !opt_noBearing && coord) {
    bearing = os.bearing.modifyBearing(bearing, coord, date);
    var formattedBearing = os.bearing.getFormattedBearing(bearing, os.feature.measure.numDecimalPlaces);
    text += ' Bearing: ' + formattedBearing;
  }

  return text;
};


/**
 * Gets the total distance for the measurement
 *
 * @return {number}
 * @private
 */
os.interaction.Measure.prototype.getTotalDistance_ = function() {
  var totalDist = 0;
  for (var i = 0; i < this.distances_.length; i++) {
    totalDist += this.distances_[i];
  }
  return totalDist;
};


/**
 * Listener for map unit changes. Updates the features on the map (if present) to reflect the new units.
 *
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
os.interaction.Measure.prototype.onUnitsChange_ = function(event) {
  if (event.getProperty() == os.unit.UnitChange) {
    this.onChange_();
    os.feature.measure.updateAll();
  }
};


/**
 * Updates the displayed measure text.
 *
 * @private
 */
os.interaction.Measure.prototype.onChange_ = function() {
  if (this.waypoints_.length > 0) {
    var n = this.waypoints_.length - 1;
    for (var i = 1; i < n; i++) {
      var dist = this.getDistanceText_(i);
      this.waypoints_[i].getText().setText(dist);
    }
    var um = os.unit.UnitManager.getInstance();
    var totalDist = um.formatToBestFit('distance', this.getTotalDistance_(), 'm', um.getBaseSystem(),
        os.feature.measure.numDecimalPlaces);
    this.waypoints_[n].getText().setText(totalDist);

    if (this.line2D) {
      this.line2D.setStyle(this.getStyle());
    }
  }
};

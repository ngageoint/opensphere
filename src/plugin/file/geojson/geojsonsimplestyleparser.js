goog.provide('plugin.file.geojson.GeoJSONSimpleStyleParser');
goog.require('goog.Uri');
goog.require('ol.Feature');
goog.require('ol.style.Icon');
goog.require('os.color');
goog.require('os.im.mapping.time.DateMapping');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.net');
goog.require('os.style');
goog.require('os.ui.file.maki');
goog.require('plugin.file.geojson.GeoJSONParser');



/**
 * A GeoJSON parser that supports the custom extensions to the GeoJSON format described in
 * https://github.com/mapbox/simplestyle-spec
 *
 * @extends {plugin.file.geojson.GeoJSONParser<ol.Feature>}
 * @constructor
 */
plugin.file.geojson.GeoJSONSimpleStyleParser = function() {
  plugin.file.geojson.GeoJSONSimpleStyleParser.base(this, 'constructor');

  /**
   * The binding.
   * @private
   */
  this.binding_ = this.process_.bind(this);
};
goog.inherits(plugin.file.geojson.GeoJSONSimpleStyleParser, plugin.file.geojson.GeoJSONParser);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.geojson.GeoJSONSimpleStyleParser.LOGGER_ =
    goog.log.getLogger('plugin.file.geojson.GeoJSONSimpleStyleParser');


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONSimpleStyleParser.prototype.parseNext = function() {
  var features = plugin.file.geojson.GeoJSONSimpleStyleParser.base(this, 'parseNext');
  features.forEach(this.binding_);
  return features;
};


/**
 * @param {!ol.Feature} feature
 * @private
 */
plugin.file.geojson.GeoJSONSimpleStyleParser.prototype.process_ = function(feature) {
  // apparently these people missed out on GeoJSON spec section 2.2 where
  // the id goes directly on the feature object.
  var id = /** @type {string|undefined} */ (feature.get('id'));
  if (id) {
    feature.setId(id);
    feature.set('id', undefined);
  }

  this.processStyle_(feature);
};


/**
 * @param {!ol.Feature} feature
 * @private
 */
plugin.file.geojson.GeoJSONSimpleStyleParser.prototype.processStyle_ = function(feature) {
  try {
    // Extract all simplestyle-spec values.
    // These are not used to style.
    // var title = feature.get('title') || '';
    // var description = feature.get('description') || '';
    var markersize = feature.get('marker-size');
    // An icon id from the Maki project http://mapbox.com/maki/
    var markersymbol = feature.get('marker-symbol');
    // colors can be short #ace or long #aaccee
    var markercolor =  /** @type {string} */ (feature.get('marker-color'));
    var stroke = /** @type {string} */ (feature.get('stroke'));
    var strokeopacity = /** @type {number} */ (feature.get('stroke-opacity'));
    var strokewidth = /** @type {number} */ (feature.get('stroke-width'));
    var fill = /** @type {string} */ (feature.get('fill'));
    var fillopacity = /** @type {number} */ (feature.get('fill-opacity'));

    // If there are no simplestyle settings, then this must not be a simple style! Return.
    if (!(markersize || markersymbol || markercolor || stroke || strokeopacity || strokewidth || fill || fillopacity)) {
      return;
    }

    // Set the default values.
    markersize = (markersize || 'medium');
    markersymbol = (markersymbol || '');
    markercolor = (markercolor || '7e7e7e');
    stroke = (stroke || '555555');
    strokeopacity = (strokeopacity || 1.0);
    strokewidth = (strokewidth || 2);
    fill = (fill || '555555');
    fillopacity = (fillopacity || 0.6);

    var config = {};

    // Convert to RGBA
    var strokeRGBA = os.color.toRgbArray(stroke);
    var fillRGBA = os.color.toRgbArray(fill);
    var markerRGBA = os.color.toRgbArray(markercolor);

    var fillColor = 'rgba(' + fillRGBA[0] + ',' + fillRGBA[1] + ',' + fillRGBA[2] + ',' + fillopacity + ')';
    var strokeColor = 'rgba(' + strokeRGBA[0] + ',' + strokeRGBA[1] + ',' + strokeRGBA[2] + ',' + strokeopacity + ')';

    // The current polygons do not support using both fill and stroke attributes for color.
    var foundFill = false;

    // Prefer to use the fill color before the stroke color.
    if (85 != fillRGBA[0] || 85 != fillRGBA[1] || 85 != fillRGBA[2]) {
      config['fill'] = {
        'color': fillColor
      };
      foundFill = true;
    }

    // Always safe to set the stroke width.
    config['stroke'] = {
      'width': strokewidth
    };

    // Set the stroke color if you have not set a fill color.
    if (!foundFill) {
      config['stroke'] = {
        'color': strokeColor
      };
    }

    // A marker was defined, so set an icon.
    if (markersymbol) {
      var png = markersymbol + '-24.png';

      // Marker symbols can be the integers 1 - 9
      // The character a - z
      // Or an icon id from the maki set.
      if (goog.isNumber(markersymbol) || markersymbol.match(/^[a-z0-9]$/)) {
        png = 'marker-24.png';
      }

      var scale = .8;
      if ('medium' === markersize) {
        scale = .8;
      } else if ('small' === markersize) {
        scale = .6;
      } else if ('large' === markersize) {
        scale = 1;
      }

      config['image'] = {
        'color': 'rgba(' + markerRGBA[0] + ',' + markerRGBA[1] + ',' + markerRGBA[2] + ',1)',
        'type': 'icon',
        'anchor': [0.5, 0.5],
        'scale': scale,
        'src': os.ui.file.maki.ICON_PATH + png
      };
      config['zIndex'] = 151;
    } else {
      config['image'] = {
        'color': strokeColor,
        'stroke': {
          'color': strokeColor,
          'width': strokewidth
        },
        'fill': {
          'color': fillColor
        }
      };
    }

    feature.set(os.style.StyleType.FEATURE, config);
    os.style.setFeatureStyle(feature);
  } catch (e) {
    goog.log.error(plugin.file.geojson.GeoJSONSimpleStyleParser.LOGGER_, 'Failed to style the feature!', e);
  }
};

goog.module('plugin.osm.nom');

const style = goog.require('os.style');
const kml = goog.require('os.ui.file.kml');


/**
 * Plugin identifier.
 * @type {string}
 */
const ID = 'nominatim';

/**
 * User-facing name for the search provider.
 * @type {string}
 */
const SEARCH_NAME = 'Places (OpenStreetMap)';

/**
 * Fields on OSM Nominatim response data.
 * @enum {string}
 */
const ResultField = {
  BBOX: 'boundingbox',
  CATEGORY: 'category',
  DISPLAY_NAME: 'display_name',
  EXTRA_TAGS: 'extratags',
  GEOJSON: 'geojson',
  IMPORTANCE: 'importance',
  LAT: 'lat',
  LON: 'lon',
  OSM_TYPE: 'osm_type',
  TYPE: 'type'
};

/**
 * Fields on OSM Nominatim `extradata` objects.
 * @enum {string}
 */
const ExtraDataField = {
  PLACE: 'place',
  POPULATION: 'population'
};

/**
 * Field used to label search results.
 * @type {string}
 */
const LABEL_FIELD = ResultField.DISPLAY_NAME;

/**
 * Base search result score.
 * @type {number}
 */
const BASE_SCORE = 100;

/**
 * Multiplier to apply to search result importance based on OSM type.
 * @enum {number}
 */
const OSMTypeMultiplier = {
  'relation': 1.2,
  'way': 1.1
};

/**
 * The base settings key for the plugin.
 * @type {string}
 */
const BASE_SETTING_KEY = 'plugin.osm.nom';

/**
 * Settings keys for the plugin.
 * @enum {string}
 */
const SettingKey = {
  URL: BASE_SETTING_KEY + '.url'
};

/**
 * Style config for search results.
 * @type {!Object}
 */
const VECTOR_CONFIG = {
  // show a white label with the place name
  'labelColor': 'rgba(255,255,255,1)',
  'labels': [{
    'column': LABEL_FIELD,
    'showColumn': false
  }],

  // this will only be applied to point types
  'image': {
    'type': 'icon',
    'scale': 0.75,
    'src': kml.GOOGLE_EARTH_URL + kml.GoogleEarthIcons.WHT_BLANK,
    'color': 'rgba(0,255,255,1)'
  },

  // this will only be applied to line and polygon types
  'stroke': {
    'width': style.DEFAULT_STROKE_WIDTH,
    'color': 'rgba(0,0,255,1)'
  },
  'fill': {
    'color': 'rgba(0,0,255,0.1)'
  }
};

/**
 * Get the search score for an OSM Nominatim result.
 *
 * @param {ol.Feature} feature The feature result.
 * @return {number} The search score.
 */
const getSearchScore = function(feature) {
  var score = BASE_SCORE;

  if (feature) {
    var importance = /** @type {number|undefined} */ (feature.get(ResultField.IMPORTANCE));
    if (importance) {
      var osmType = /** @type {string|undefined} */ (feature.get(ResultField.OSM_TYPE));
      if (osmType && osmType in OSMTypeMultiplier) {
        importance = importance * OSMTypeMultiplier[osmType];
      }

      score = score + importance;
    }
  } else {
    score = 0;
  }

  return score;
};

exports = {
  BASE_SCORE,
  BASE_SETTING_KEY,
  ID,
  LABEL_FIELD,
  SEARCH_NAME,
  VECTOR_CONFIG,
  ExtraDataField,
  OSMTypeMultiplier,
  ResultField,
  SettingKey,
  getSearchScore
};

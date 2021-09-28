goog.declareModuleId('plugin.osm.nom');

import * as style from '../../../os/style/style.js';

const kml = goog.require('os.ui.file.kml');


/**
 * Plugin identifier.
 * @type {string}
 */
export const ID = 'nominatim';

/**
 * User-facing name for the search provider.
 * @type {string}
 */
export const SEARCH_NAME = 'Places (OpenStreetMap)';

/**
 * Fields on OSM Nominatim response data.
 * @enum {string}
 */
export const ResultField = {
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
export const ExtraDataField = {
  PLACE: 'place',
  POPULATION: 'population'
};

/**
 * Field used to label search results.
 * @type {string}
 */
export const LABEL_FIELD = ResultField.DISPLAY_NAME;

/**
 * Base search result score.
 * @type {number}
 */
export const BASE_SCORE = 100;

/**
 * Multiplier to apply to search result importance based on OSM type.
 * @enum {number}
 */
export const OSMTypeMultiplier = {
  'relation': 1.2,
  'way': 1.1
};

/**
 * The base settings key for the plugin.
 * @type {string}
 */
export const BASE_SETTING_KEY = 'plugin.osm.nom';

/**
 * Settings keys for the plugin.
 * @enum {string}
 */
export const SettingKey = {
  URL: BASE_SETTING_KEY + '.url'
};

/**
 * Style config for search results.
 * @type {!Object}
 */
export const VECTOR_CONFIG = {
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
export const getSearchScore = function(feature) {
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

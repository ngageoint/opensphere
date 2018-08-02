goog.provide('plugin.osm.nom');
goog.provide('plugin.osm.nom.SettingKey');


/**
 * Plugin identifier.
 * @type {string}
 * @const
 */
plugin.osm.nom.ID = 'nominatim';


/**
 * User-facing name for the search provider.
 * @type {string}
 * @const
 */
plugin.osm.nom.SEARCH_NAME = 'Places (OpenStreetMap)';


/**
 * Fields on OSM Nominatim response data.
 * @enum {string}
 */
plugin.osm.nom.ResultField = {
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
plugin.osm.nom.ExtraDataField = {
  PLACE: 'place',
  POPULATION: 'population'
};


/**
 * Field used to label search results.
 * @type {string}
 * @const
 */
plugin.osm.nom.LABEL_FIELD = plugin.osm.nom.ResultField.DISPLAY_NAME;


/**
 * Base search result score.
 * @type {number}
 * @const
 */
plugin.osm.nom.BASE_SCORE = 100;


/**
 * Multiplier to apply to search result importance based on OSM type.
 * @enum {number}
 */
plugin.osm.nom.OSMTypeMultiplier = {
  'relation': 1.2,
  'way': 1.1
};


/**
 * The base settings key for the plugin.
 * @type {string}
 * @const
 */
plugin.osm.nom.BASE_SETTING_KEY = 'plugin.osm.nom';

/**
 * Settings keys for the plugin.
 * @enum {string}
 */
plugin.osm.nom.SettingKey = {
  URL: plugin.osm.nom.BASE_SETTING_KEY + '.url'
};


/**
 * Style config for search results.
 * @type {!Object}
 * @const
 */
plugin.osm.nom.VECTOR_CONFIG = {
  // show a white label with the place name
  'labelColor': 'rgba(255,255,255,1)',
  'labels': [{
    'column': plugin.osm.nom.LABEL_FIELD,
    'showColumn': false
  }],

  // this will only be applied to point types
  'image': {
    'type': 'icon',
    'scale': 0.75,
    'src': os.ui.file.kml.GOOGLE_EARTH_URL + os.ui.file.kml.GoogleEarthIcons.WHT_BLANK,
    'color': 'rgba(0,255,255,1)'
  },

  // this will only be applied to line and polygon types
  'stroke': {
    'width': os.style.DEFAULT_STROKE_WIDTH,
    'color': 'rgba(0,0,255,1)'
  },
  'fill': {
    'color': 'rgba(0,0,255,0.1)'
  }
};


/**
 * Get the search score for an OSM Nominatim result.
 * @param {ol.Feature} feature The feature result.
 * @return {number} The search score.
 */
plugin.osm.nom.getSearchScore = function(feature) {
  var score = plugin.osm.nom.BASE_SCORE;

  if (feature) {
    var importance = /** @type {number|undefined} */ (feature.get(plugin.osm.nom.ResultField.IMPORTANCE));
    if (importance) {
      var osmType = /** @type {string|undefined} */ (feature.get(plugin.osm.nom.ResultField.OSM_TYPE));
      if (osmType && osmType in plugin.osm.nom.OSMTypeMultiplier) {
        importance = importance * plugin.osm.nom.OSMTypeMultiplier[osmType];
      }

      score = score + importance;
    }
  } else {
    score = 0;
  }

  return score;
};

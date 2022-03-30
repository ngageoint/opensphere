goog.declareModuleId('plugin.weather.WeatherPlugin');

import {toLonLat} from 'ol/src/proj.js';
import settings from '../../os/config/settings.js';
import * as osMap from '../../os/map/map.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import * as mapMenu from '../../os/ui/menu/mapmenu.js';


/**
 * Provides a Weather menu option when right-clicking the map. The resulting location is then
 * opened in a new tab with the configured weather URL.
 */
export default class WeatherPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = id;
  }

  /**
   * @inheritDoc
   */
  init() {
    var url = getWeatherUrl();
    var menu = mapMenu.getMenu();

    if (url && menu) {
      var group = menu.getRoot().find(mapMenu.GroupLabel.COORDINATE);

      if (group) {
        group.addChild({
          label: 'Weather Forecast',
          eventType: id,
          tooltip: 'Open the weather forecast for this location',
          icons: ['<i class="fa fa-fw fa-umbrella"></i>']
        });

        menu.listen(id, onLookup);
      }
    }
  }
}


/**
 * @type {string}
 */
const id = 'weather';


/**
 * @return {?string} the weather URL
 */
const getWeatherUrl = function() {
  var url = /** @type {string} */ (settings.getInstance().get(['weather', 'url']));

  if (url && url.indexOf('{lat}') > -1 && url.indexOf('{lon}') > -1) {
    return url;
  }

  return null;
};


/**
 * Forecast menu option listener
 *
 * @param {MenuEvent<ol.Coordinate>} evt The menu event
 */
const onLookup = function(evt) {
  launchForecast(evt.getContext());
};


/**
 * Opens a weather forecast for the given location
 *
 * @param {ol.Coordinate} coord
 */
const launchForecast = function(coord) {
  var url = getWeatherUrl();
  coord = toLonLat(coord, osMap.PROJECTION);

  if (url) {
    url = url.replace('{lon}', coord[0].toString());
    url = url.replace('{lat}', coord[1].toString());

    window.open(url, '_blank');
  }
};

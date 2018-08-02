goog.provide('plugin.weather.WeatherPlugin');

goog.require('os.map');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.menu.map');



/**
 * Provides a Weather menu option when right-clicking the map. The resulting location is then
 * opened in a new tab with the configured weather URL.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.weather.WeatherPlugin = function() {
  plugin.weather.WeatherPlugin.base(this, 'constructor');
  this.id = plugin.weather.WeatherPlugin.ID;
};
goog.inherits(plugin.weather.WeatherPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.weather.WeatherPlugin.ID = 'weather';


/**
 * @inheritDoc
 */
plugin.weather.WeatherPlugin.prototype.init = function() {
  var url = plugin.weather.getUrl_();
  var menu = os.ui.menu.MAP;

  if (url && menu) {
    var group = menu.getRoot().find('Coordinate');

    if (group) {
      group.addChild({
        label: 'Weather Forecast',
        eventType: plugin.weather.WeatherPlugin.ID,
        tooltip: 'Open the weather forecast for this location',
        icons: ['<i class="fa fa-fw fa-umbrella"></i>']
      });

      menu.listen(plugin.weather.WeatherPlugin.ID, plugin.weather.onLookup_);
    }
  }
};


/**
 * @return {?string} the weather URL
 * @private
 */
plugin.weather.getUrl_ = function() {
  var url = /** @type {string} */ (os.settings.get(['weather', 'url']));

  if (url && url.indexOf('{lat}') > -1 && url.indexOf('{lon}') > -1) {
    return url;
  }

  return null;
};


/**
 * Forecast menu option listener
 * @param {os.ui.menu.MenuEvent<ol.Coordinate>} evt The menu event
 * @private
 */
plugin.weather.onLookup_ = function(evt) {
  plugin.weather.launchForecast(evt.getContext());
};


/**
 * Opens a weather forecast for the given location
 * @param {ol.Coordinate} coord
 */
plugin.weather.launchForecast = function(coord) {
  var url = plugin.weather.getUrl_();
  coord = ol.proj.toLonLat(coord, os.map.PROJECTION);

  if (url) {
    url = url.replace('{lon}', coord[0].toString());
    url = url.replace('{lat}', coord[1].toString());

    window.open(url, '_blank');
  }
};

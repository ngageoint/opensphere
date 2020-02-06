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
    var group = menu.getRoot().find(os.ui.menu.map.GroupLabel.COORDINATE);

    if (group) {
      group.addChild({
        label: 'Weather Forecast',
        link: url,
        eventType: plugin.weather.WeatherPlugin.ID,
        tooltip: 'Open the weather forecast for this location',
        icons: ['<i class="fa fa-fw fa-umbrella"></i>'],
        beforeRender:
          /**
           * @param {ol.Coordinate} coord
           * @this {os.ui.menu.MenuItem<ol.Coordinate>}
           */
          function(coord) {
            var url = plugin.weather.getUrl_();

            if (url) {
              url = url.replace('{lon}', coord[0].toString());
              url = url.replace('{lat}', coord[1].toString());
            }

            this.link = url;
          }
      });
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

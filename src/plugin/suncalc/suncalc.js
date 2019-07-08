goog.provide('plugin.suncalc.SunCalcCtrl');
goog.provide('plugin.suncalc.sunCalcDirective');

goog.require('goog.array');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.window');


/**
 * The SunCalc directive
 *
 * @return {angular.Directive}
 */
plugin.suncalc.sunCalcDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/suncalc/suncalc.html',
    controller: plugin.suncalc.SunCalcCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('suncalc', [plugin.suncalc.sunCalcDirective]);


/**
 * Controller function for the SunCalc directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
plugin.suncalc.SunCalcCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?ol.Coordinate}
   * @private
   */
  this.coord_ = $scope['coord'] || null;

  /**
   * @type {os.time.TimelineController}
   * @private
   */
  this.tlc_ = os.time.TimelineController.getInstance();
  $scope.$on('$destroy', this.destroy_.bind(this));

  this.tlc_.listen(os.time.TimelineEventType.SHOW, this.update_, false, this);
  this.update_();
};


/**
 * Clean up
 *
 * @private
 */
plugin.suncalc.SunCalcCtrl.prototype.destroy_ = function() {
  this.tlc_.unlisten(os.time.TimelineEventType.SHOW, this.update_, false, this);
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Close
 *
 * @export
 */
plugin.suncalc.SunCalcCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};


/**
 * Updates the scope with the new values
 *
 * @private
 */
plugin.suncalc.SunCalcCtrl.prototype.update_ = function() {
  var current = this.tlc_.getCurrent();
  this.scope_['time'] = current;
  var t = new Date(current);

  var coord = this.coord_ || os.MapContainer.getInstance().getMap().getView().getCenter();

  if (coord) {
    coord = ol.proj.toLonLat(coord, os.map.PROJECTION);

    this.scope_['coord'] = coord;
    var sets = [];

    // sun times
    var suntimes = SunCalc.getTimes(t, coord[1], coord[0]);
    var sunpos = SunCalc.getPosition(t, coord[1], coord[0]);

    // Determine dawn/dusk based on user preference
    var calcTitle;
    var dawnTime;
    var duskTime;

    switch (os.settings.get(plugin.suncalc.SettingKey.DUSK_MODE)) {
      case 'nautical':
        calcTitle = 'Nautical calculation';
        dawnTime = suntimes.nauticalDawn.getTime();
        duskTime = suntimes.nauticalDusk.getTime();
        break;
      case 'civilian':
        calcTitle = 'Civilian calculation';
        dawnTime = suntimes.dawn.getTime();
        duskTime = suntimes.dusk.getTime();
        break;
      case 'astronomical':
      default:
        calcTitle = 'Astronomical calculation';
        dawnTime = suntimes.nightEnd.getTime();
        duskTime = suntimes.night.getTime();
        break;
    }

    var times = [{
      'label': 'Dawn',
      'time': dawnTime,
      'title': calcTitle,
      'color': '#87CEFA'
    }, {
      'label': 'Sunrise',
      'time': suntimes.sunrise.getTime(),
      'color': '#FFA500'
    }, {
      'label': 'Solar Noon',
      'time': suntimes.solarNoon.getTime(),
      'color': '#FFD700'
    }, {
      'label': 'Sunset',
      'time': suntimes.sunset.getTime(),
      'color': '#FFA500'
    }, {
      'label': 'Dusk',
      'time': duskTime,
      'title': calcTitle,
      'color': '#87CEFA'
    }, {
      'label': 'Night',
      'time': suntimes.night.getTime(),
      'color': '#000080'
    }];

    this.scope_['sun'] = {
      'altitude': sunpos.altitude * os.geo.R2D,
      'azimuth': (os.geo.R2D * (sunpos.azimuth + Math.PI)) % 360
    };

    // moon times
    var moontimes = SunCalc.getMoonTimes(t, coord[1], coord[0]);
    var moonpos = SunCalc.getMoonPosition(t, coord[1], coord[0]);
    var moonlight = SunCalc.getMoonIllumination(t);

    this.scope_['moonAlwaysDown'] = moontimes.alwaysDown;
    this.scope_['moonAlwaysUp'] = moontimes.alwaysUp;

    if (moontimes.rise) {
      times.push({
        'label': 'Moonrise',
        'time': moontimes.rise.getTime(),
        'color': '#ddd'
      });
    }

    if (moontimes.set) {
      times.push({
        'label': 'Moonset',
        'time': moontimes.set.getTime(),
        'color': '#2F4F4F'
      });
    }

    var phase = '';
    var phases = plugin.suncalc.SunCalcCtrl.PHASES;
    for (var i = 0, n = phases.length; i < n; i++) {
      if (moonlight.phase >= phases[i].min && moonlight.phase < phases[i].max) {
        phase = phases[i].label;
        break;
      }
    }

    this.scope_['moon'] = {
      'alwaysUp': moontimes.alwaysUp,
      'alwaysDown': moontimes.alwaysDown,
      'azimuth': (os.geo.R2D * (moonpos.azimuth + Math.PI)) % 360,
      'altitude': moonpos.altitude * os.geo.R2D,
      'brightness': Math.ceil(moonlight.fraction * 100) + '%',
      'phase': phase
    };

    times = times.filter(plugin.suncalc.SunCalcCtrl.filter_);
    times.forEach(plugin.suncalc.SunCalcCtrl.addTextColor_);
    goog.array.sortObjectsByKey(times, 'time');
    sets.push(times);

    this.scope_['times'] = times;
    os.ui.apply(this.scope_);
  }
};


/**
 * @type {Array<{label: string, min: number, max: number}>}
 * @const
 */
plugin.suncalc.SunCalcCtrl.PHASES = [
  {label: 'New Moon', min: 0, max: 0.03},
  {label: 'Waxing Crescent', min: 0.03, max: 0.22},
  {label: 'First Quarter', min: 0.22, max: 0.28},
  {label: 'Waxing Gibbous', min: 0.28, max: 0.47},
  {label: 'Full Moon', min: 0.47, max: 0.53},
  {label: 'Waning Gibbous', min: 0.53, max: 0.72},
  {label: 'Last Quarter', min: 0.72, max: 0.78},
  {label: 'Waning Crescent', min: 0.78, max: 0.97},
  {label: 'New Moon', min: 0.97, max: 1}
];

/**
 * The base settings key for the plugin.
 * @type {string}
 * @const
 */
plugin.suncalc.BASE_SETTING_KEY = 'plugin.suncalc';


/**
 * Settings keys for the plugin.
 * @enum {string}
 */
plugin.suncalc.SettingKey = {
  DUSK_MODE: plugin.suncalc.BASE_SETTING_KEY + '.duskMode'
};

/**
 * Modes for displaying dusk duration in the timeline.
 * @enum {string}
 */
plugin.suncalc.duskMode = {
  CIVILIAN: 'civilian',
  NAUTICAL: 'nautical',
  ASTRONOMICAL: 'astronomical'
};


/**
 * @param {Object} item
 * @return {boolean}
 * @private
 */
plugin.suncalc.SunCalcCtrl.filter_ = function(item) {
  return typeof item.time === 'string' || !isNaN(item.time);
};


/**
 * @param {Object} item
 * @private
 */
plugin.suncalc.SunCalcCtrl.addTextColor_ = function(item) {
  var rgb = goog.color.hexToRgb(item.color);
  item['textColor'] = goog.color.rgbArrayToHex(goog.color.highContrast(rgb, [[0, 0, 0], [255, 255, 255]]));
};


/**
 * @param {number|string} t The time
 * @return {string} The formatted time
 * @export
 */
plugin.suncalc.SunCalcCtrl.prototype.formatTime = function(t) {
  if (typeof t === 'number') {
    return moment(t + os.time.timeOffset).utc().format(os.time.TIME_FORMATS[7]);
  }

  return t;
};


/**
 * @param {number} t The time
 * @return {string} The formatted date
 * @export
 */
plugin.suncalc.SunCalcCtrl.prototype.formatDate = function(t) {
  if (t !== undefined) {
    return moment(t + os.time.timeOffset).utc().format(os.time.DATETIME_FORMATS[20]) +
        (os.time.timeOffset !== 0 ? ' UTC' : '') + os.time.timeOffsetLabel;
  }

  return '';
};

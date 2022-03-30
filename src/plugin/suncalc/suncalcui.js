goog.declareModuleId('plugin.suncalc.SunCalcUI');

import {toLonLat} from 'ol/src/proj.js';
import settings from '../../os/config/settings.js';
import * as geo from '../../os/geo/geo.js';
import * as osMap from '../../os/map/map.js';
import MapContainer from '../../os/mapcontainer.js';
import {ROOT} from '../../os/os.js';
import * as time from '../../os/time/time.js';
import TimelineController from '../../os/time/timelinecontroller.js';
import TimelineEventType from '../../os/time/timelineeventtype.js';
import Module from '../../os/ui/module.js';
import * as ui from '../../os/ui/ui.js';
import * as osWindow from '../../os/ui/window.js';
import {SettingKey} from './suncalc.js';

const googArray = goog.require('goog.array');
const color = goog.require('goog.color');


/**
 * The SunCalc directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/plugin/suncalc/suncalc.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'suncalc';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller function for the SunCalc directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
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
     * @type {TimelineController}
     * @private
     */
    this.tlc_ = TimelineController.getInstance();
    this.tlc_.listen(TimelineEventType.SHOW, this.update_, false, this);

    this.update_();
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.tlc_.unlisten(TimelineEventType.SHOW, this.update_, false, this);
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Close
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }

  /**
   * Updates the scope with the new values
   *
   * @private
   */
  update_() {
    var current = this.tlc_.getCurrent();
    this.scope_['time'] = current;
    var t = new Date(current);

    var coord = this.coord_ || MapContainer.getInstance().getMap().getView().getCenter();

    if (coord) {
      coord = toLonLat(coord, osMap.PROJECTION);

      this.scope_['coord'] = coord;
      var sets = [];

      // sun times
      var suntimes = SunCalc.getTimes(t, coord[1], coord[0]);
      var sunpos = SunCalc.getPosition(t, coord[1], coord[0]);

      // Determine dawn/dusk based on user preference
      var calcTitle;
      var dawnTime;
      var duskTime;

      switch (settings.getInstance().get(SettingKey.DUSK_MODE)) {
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
        'altitude': sunpos.altitude * geo.R2D,
        'azimuth': (geo.R2D * (sunpos.azimuth + Math.PI)) % 360
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
      for (var i = 0, n = PHASES.length; i < n; i++) {
        if (moonlight.phase >= PHASES[i].min && moonlight.phase < PHASES[i].max) {
          phase = PHASES[i].label;
          break;
        }
      }

      this.scope_['moon'] = {
        'alwaysUp': moontimes.alwaysUp,
        'alwaysDown': moontimes.alwaysDown,
        'azimuth': (geo.R2D * (moonpos.azimuth + Math.PI)) % 360,
        'altitude': moonpos.altitude * geo.R2D,
        'brightness': Math.ceil(moonlight.fraction * 100) + '%',
        'phase': phase
      };

      times = times.filter(filter);
      times.forEach(addTextColor);
      googArray.sortObjectsByKey(times, 'time');
      sets.push(times);

      this.scope_['times'] = times;
      ui.apply(this.scope_);
    }
  }

  /**
   * @param {number|string} t The time
   * @return {string} The formatted time
   * @export
   */
  formatTime(t) {
    if (typeof t === 'number') {
      return moment(t + time.getTimeOffset()).utc().format(time.TIME_FORMATS[7]);
    }

    return t;
  }

  /**
   * @param {number} t The time
   * @return {string} The formatted date
   * @export
   */
  formatDate(t) {
    if (t !== undefined) {
      return moment(t + time.getTimeOffset()).utc().format(time.DATETIME_FORMATS[20]) +
          (time.getTimeOffset() !== 0 ? ' UTC' : '') + time.getTimeOffsetLabel();
    }

    return '';
  }
}

/**
 * @param {Object} item
 * @return {boolean}
 */
const filter = (item) => {
  return typeof item.time === 'string' || !isNaN(item.time);
};


/**
 * @param {Object} item
 */
const addTextColor = (item) => {
  var rgb = color.hexToRgb(item.color);
  item['textColor'] = color.rgbArrayToHex(color.highContrast(rgb, [[0, 0, 0], [255, 255, 255]]));
};


/**
 * @type {Array<{label: string, min: number, max: number}>}
 */
const PHASES = [
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

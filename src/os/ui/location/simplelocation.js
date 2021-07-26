goog.module('os.ui.location.SimpleLocationUI');
goog.module.declareLegacyNamespace();

const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const Settings = goog.require('os.config.Settings');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const {LocationSetting, getCurrentFormat} = goog.require('os.ui.location');

const SettingChangeEvent = goog.requireType('os.events.SettingChangeEvent');
const Format = goog.requireType('os.ui.location.Format');


/**
 * SimpleLocation Directive.
 * Provide a read-only view of a location that can configurably display
 * location in three base forms and should be extendable to any number
 *
 * 1. Decimal Degrees (DD)
 * 2. Degrees Minutes Seconds (DMS)
 * 3. Degrees Decimal Minutes (DDM)
 * 4. MGRS
 *
 * It should provide an output view and a button group to switch between the
 * types.
 *
 * The canonical location format for this directive is Decimal Degrees.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'EA',
  replace: true,
  template,
  controller: Controller,
  controllerAs: 'simpleLocationCtrl',
  scope: {
    'latdeg': '=',
    'londeg': '=',
    'onchange': '&'
  }
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'simple-location';

// Register the directive
Module.directive('simpleLocation', [directive]);

/**
 * The template for this directive
 * @type {string}
 */
const template =
    '<div class="d-flex">' +
    '<span ng-bind-html="simpleLocationCtrl.location"></span>' +
    '<simple-location-controls format-default="simpleLocationCtrl.currentFormat" ' +
    'on-change="simpleLocationCtrl.format(opt_format)"></simple-location-controls>' +
    '</div>';

/**
 * The directive controller
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$filter} $filter
   * @ngInject
   */
  constructor($scope, $filter) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.$filter}
     * @private
     */
    this.filter_ = $filter;

    /**
     * Provide a model for the view.
     * @type {string}
     */
    this['location'] = '';

    /**
     * @type {Format}
     * @private
     */
    this['currentFormat'] = getCurrentFormat();

    /**
     * Delay to debounce updates.
     * @type {Delay}
     * @private
     */
    this.updateDelay_ = new Delay(this.format, 25, this);

    this.scope_.$on('$destroy', this.destroy_.bind(this));
    this.scope_.$watch('latdeg', this.onLatLonChange_.bind(this));
    this.scope_.$watch('londeg', this.onLatLonChange_.bind(this));

    Settings.getInstance().listen(LocationSetting.POSITION, this.locationChanged, false, this);
  }

  /**
   * Clean up
   *
   * @private
   */
  destroy_() {
    dispose(this.updateDelay_);
    this.updateDelay_ = null;

    this.scope_ = null;
    this.filter_ = null;
  }

  /**
   * Callback when lat or lon changes
   *
   * @private
   */
  onLatLonChange_() {
    // lat/lon will typically both change, but not always. this ensures the coordinate is only formatted once in either
    // case.
    if (this.updateDelay_) {
      this.updateDelay_.start();
    }
  }

  /**
   * Change the display model
   *
   * @param {Format=} opt_format
   * @export
   */
  format(opt_format) {
    if (this.scope_ && this.scope_['latdeg'] != undefined && this.scope_['londeg'] != undefined) {
      this['currentFormat'] = opt_format || getCurrentFormat();
      var formatter = this.filter_(this['currentFormat']);
      var lat = this.scope_['latdeg'];
      var lon = this.scope_['londeg'];

      if ((typeof lat === 'number' || typeof lat === 'string') &&
          (typeof lon === 'number' || typeof lon === 'string')) {
        this['location'] = formatter(this.scope_['latdeg'], this.scope_['londeg']).replace(/°/g, '&deg;');
      } else {
        this['location'] = '';
      }

      if (this.scope_['onchange']) {
        this.scope_['onchange']();
      }
      apply(this.scope_);
    }
  }

  /**
   * Change the display model
   *
   * @param {SettingChangeEvent} event
   * @export
   */
  locationChanged(event) {
    if (event.newVal) {
      this.format(/** @type {Format} */ (event.newVal));
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

/**
 * @fileoverview Directives to display locatoin controls using Angular.js
 */
goog.provide('os.ui.location.SimpleLocationControlsCtrl');
goog.provide('os.ui.location.SimpleLocationControlsDirective');
goog.provide('os.ui.location.SimpleLocationCtrl');
goog.provide('os.ui.location.SimpleLocationDirective');

goog.require('goog.async.Delay');
goog.require('os.config.Settings');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.location');
goog.require('os.ui.location.ddmFilter');
goog.require('os.ui.location.degFilter');
goog.require('os.ui.location.dmsFilter');
goog.require('os.ui.location.mgrsFilter');



/**
 * The directive controller
 * @constructor
 * @param {!angular.Scope} $scope
 * @param {!angular.$filter} $filter
 * @ngInject
 */
os.ui.location.SimpleLocationCtrl = function($scope, $filter) {
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
   * @type {os.ui.location.Format}
   * @private
   */
  this['currentFormat'] = os.ui.location.getCurrentFormat();

  /**
   * Delay to debounce updates.
   * @type {goog.async.Delay}
   * @private
   */
  this.updateDelay_ = new goog.async.Delay(this.format, 25, this);

  this.scope_.$on('$destroy', this.destroy_.bind(this));
  this.scope_.$watch('latdeg', this.onLatLonChange_.bind(this));
  this.scope_.$watch('londeg', this.onLatLonChange_.bind(this));

  os.settings.listen(os.ui.location.LocationSetting.POSITION, this.locationChanged, false, this);
};


/**
 * Clean up
 * @private
 */
os.ui.location.SimpleLocationCtrl.prototype.destroy_ = function() {
  goog.dispose(this.updateDelay_);
  this.updateDelay_ = null;

  this.scope_ = null;
  this.filter_ = null;
};


/**
 * Callback when lat or lon changes
 * @private
 */
os.ui.location.SimpleLocationCtrl.prototype.onLatLonChange_ = function() {
  // lat/lon will typically both change, but not always. this ensures the coordinate is only formatted once in either
  // case.
  if (this.updateDelay_) {
    this.updateDelay_.start();
  }
};


/**
 * Change the display model
 * @param {os.ui.location.Format=} opt_format
 */
os.ui.location.SimpleLocationCtrl.prototype.format = function(opt_format) {
  if (this.scope_ && this.scope_['latdeg'] != undefined && this.scope_['londeg'] != undefined) {
    this['currentFormat'] = opt_format || os.ui.location.getCurrentFormat();
    var formatter = this.filter_(this['currentFormat']);
    var lat = this.scope_['latdeg'];
    var lon = this.scope_['londeg'];

    if ((goog.isNumber(lat) || goog.isString(lat)) && (goog.isNumber(lon) || goog.isString(lon))) {
      this['location'] = formatter(this.scope_['latdeg'], this.scope_['londeg']).replace(/°/g, '&deg;');
    } else {
      this['location'] = '';
    }

    if (this.scope_['onchange']) {
      this.scope_['onchange']();
    }
    os.ui.apply(this.scope_);
  }
};
goog.exportProperty(os.ui.location.SimpleLocationCtrl.prototype, 'format',
    os.ui.location.SimpleLocationCtrl.prototype.format);


/**
 * Change the display model
 * @param {os.events.SettingChangeEvent} event
 */
os.ui.location.SimpleLocationCtrl.prototype.locationChanged = function(event) {
  if (event.newVal) {
    this.format(/** @type {os.ui.location.Format} */ (event.newVal));
  }
};
goog.exportProperty(os.ui.location.SimpleLocationCtrl.prototype, 'locationChanged',
    os.ui.location.SimpleLocationCtrl.prototype.locationChanged);


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
os.ui.location.SimpleLocationDirective = function() {
  return {
    restrict: 'EA',
    replace: true,
    template: os.ui.location.SimpleLocationDirective.template_,
    controller: os.ui.location.SimpleLocationCtrl,
    controllerAs: 'simpleLocationCtrl',
    scope: {
      'latdeg': '=',
      'londeg': '=',
      'onchange': '&'
    }
  };
};


/**
 * Service name to be referenced when looking up via the injector.
 * @type {string}
 * @const
 */
os.ui.location.SimpleLocationDirective.ID = 'simpleLocation';

// Register the directive
os.ui.Module.directive(os.ui.location.SimpleLocationDirective.ID, [os.ui.location.SimpleLocationDirective]);


/**
 * The template for this directive
 * @type {string}
 * @private
 * @const
 */
os.ui.location.SimpleLocationDirective.template_ =
    '<div class="simple-loc">' +
    '<simple-location-controls format-default="simpleLocationCtrl.currentFormat" ' +
    'on-change="simpleLocationCtrl.format(opt_format)"></simple-location-controls>' +
    '<span class="simple-loc-location selectable" ng-bind-html="simpleLocationCtrl.location"></span>' +
    '</div>';



/**
 * @constructor
 * @param {!angular.Scope} $scope
 * @ngInject
 */
os.ui.location.SimpleLocationControlsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {function(Object<os.ui.location.Format>)}
   * @private
   */
  this.change_ = this.scope_['change'];

  /**
   * @type {os.ui.location.Format}
   * @private
   */
  this['format'] = os.ui.location.getCurrentFormat();

  this.change_({'opt_format': this['format']});

  this.scope_.$on('$destroy', this.destroy_.bind(this));
  this.scope_.$watch('formatDefault', goog.bind(function(format) {
    this['format'] = format;
  }, this));

  os.settings.listen(os.ui.location.LocationSetting.POSITION, this.locationControlChanged, false, this);
};


/**
 * Change the display model
 * @param {os.ui.location.Format} formatType
 * @param {angular.Scope.Event=} opt_event
 * @export
 */
os.ui.location.SimpleLocationControlsCtrl.prototype.formatChanged = function(formatType, opt_event) {
  this.change_({'opt_format': formatType});
  if (opt_event && opt_event.target) {
    opt_event.target.blur();
  }
  os.settings.set(os.ui.location.LocationSetting.POSITION, formatType);
  os.ui.apply(this.scope_);
};


/**
 * Change the display model
 * @param {os.events.SettingChangeEvent} event
 */
os.ui.location.SimpleLocationControlsCtrl.prototype.locationControlChanged = function(event) {
  if (event.newVal) {
    this.formatChanged(/** @type {os.ui.location.Format} */ (event.newVal));
  }
};
goog.exportProperty(os.ui.location.SimpleLocationControlsCtrl.prototype, 'locationControlChanged',
    os.ui.location.SimpleLocationControlsCtrl.prototype.locationControlChanged);


/**
 * Clean up
 * @private
 */
os.ui.location.SimpleLocationControlsCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * SimpleLocationControls Directive.
 * Provide
 *
 * @return {angular.Directive}
 */
os.ui.location.SimpleLocationControlsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/location/simplelocation.html',
    controller: os.ui.location.SimpleLocationControlsCtrl,
    controllerAs: 'simpleLocationControlsCtrl',
    scope: {
      'formatDefault': '=',
      'change': '&onChange',
      'formatGroup': '&'
    }
  };
};


/**
 * Service name to be referenced when looking up via the injector.
 * @type {string}
 * @const
 */
os.ui.location.SimpleLocationControlsDirective.ID = 'simpleLocationControls';

// Register the directive
os.ui.Module.directive(os.ui.location.SimpleLocationControlsDirective.ID,
    os.ui.location.SimpleLocationControlsDirective);



goog.provide('os.ui.geo.RingOptionsCtrl');
goog.provide('os.ui.geo.ringOptionsDirective');

goog.require('os.math.Units');
goog.require('os.ui.Module');


/**
 * The title for the rings UIs.
 * @type {string}
 */
os.ui.geo.RingTitle = 'Ring';


/**
 * The ringoptions directive
 * @return {angular.Directive}
 */
os.ui.geo.RingOptionsCtrl = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'options': '='
    },
    templateUrl: os.ROOT + 'views/geo/ringoptions.html',
    controller: os.ui.geo.ringOptionsDirective,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('ringoptions', [os.ui.geo.RingOptionsCtrl]);



/**
 * Controller function for the ringoptions directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.geo.ringOptionsDirective = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * The ring options object.
   * @type {Object<string, *>}
   */
  this['options'] = $scope['options'] ? os.object.unsafeClone($scope['options']) : this.getDefaultOptions();

  /**
   * The number of rings.
   * @type {number}
   */
  this['count'] = this['options']['rings'].length;

  /**
   * Unit options.
   * @type {string}
   */
  this['unitOptions'] = goog.object.getValues(os.math.Units);

  /**
   * Global UID for this controller, used to create unique IDs for form elements.
   * @type {number}
   */
  this['uid'] = goog.getUid(this);

  /**
   * @type {string}
   */
  this['title'] = os.ui.geo.RingTitle;
};


/**
 * Clean up.
 */
os.ui.geo.ringOptionsDirective.prototype.$onDestroy = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Get the default ring options.
 * @return {!Object<string, *>} The default options.
 * @protected
 */
os.ui.geo.ringOptionsDirective.prototype.getDefaultOptions = function() {
  return {
    'enabled': false,
    'type': 'auto',
    'interval': 40,
    'units': os.math.Units.NAUTICAL_MILES,
    'crosshair': true,
    'arcs': false,
    'startAngle': 0,
    'widthAngle': 0,
    'rings': [
      {'radius': 40, 'units': os.math.Units.NAUTICAL_MILES},
      {'radius': 80, 'units': os.math.Units.NAUTICAL_MILES},
      {'radius': 120, 'units': os.math.Units.NAUTICAL_MILES},
      {'radius': 160, 'units': os.math.Units.NAUTICAL_MILES},
      {'radius': 200, 'units': os.math.Units.NAUTICAL_MILES}
    ]
  };
};


/**
 * Fires an update event with the new ring options.
 * @export
 */
os.ui.geo.ringOptionsDirective.prototype.update = function() {
  this.scope_.$emit('ring.update', this['options']);
};


/**
 * Handles changes to the count.
 * @param {boolean=} opt_update Whether to force an update.
 * @export
 */
os.ui.geo.ringOptionsDirective.prototype.updateCount = function(opt_update) {
  var rings = this['options']['rings'];
  while (rings.length < this['count']) {
    this.add();
  }

  while (rings.length > this['count'] && rings.length > 0) {
    this.remove(rings.length - 1);
  }

  if (opt_update) {
    this.update();
  }
};


/**
 * Handles changes to the count.
 * @param {boolean=} opt_update Whether to force an update.
 * @export
 */
os.ui.geo.ringOptionsDirective.prototype.updateInterval = function(opt_update) {
  var rings = this['options']['rings'];
  rings.forEach(function(ring, i) {
    ring['radius'] = (i + 1) * this['options']['interval'];
  }, this);

  if (opt_update) {
    this.update();
  }
};


/**
 * Handles changes to the units.
 * @param {boolean=} opt_update Whether to force an update.
 * @export
 */
os.ui.geo.ringOptionsDirective.prototype.updateUnits = function(opt_update) {
  var units = this['options']['units'];
  var rings = this['options']['rings'];
  rings.forEach(function(ring, i) {
    ring['units'] = units;
  }, this);

  if (opt_update) {
    this.update();
  }
};


/**
 * Add a new ring.
 * @param {boolean=} opt_update Whether to force an update.
 * @export
 */
os.ui.geo.ringOptionsDirective.prototype.add = function(opt_update) {
  var last = goog.array.peek(this['options']['rings']);
  var radius = (last['radius'] || 0) + this['options']['interval'];
  this['options']['rings'].push({'radius': radius, 'units': this['options']['units']});

  if (opt_update) {
    this.update();
  }
};


/**
 * Fires an update event with the new ring options.
 * @param {number} i The index to remove.
 * @param {boolean=} opt_update Whether to force an update.
 * @export
 */
os.ui.geo.ringOptionsDirective.prototype.remove = function(i, opt_update) {
  if (this['options']['rings'].length > 0) {
    this['options']['rings'].splice(i, 1);
  }

  if (opt_update) {
    this.update();
  }
};

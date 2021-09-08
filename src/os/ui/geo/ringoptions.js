goog.module('os.ui.geo.RingOptionsUI');

const {peek} = goog.require('goog.array');
const {ROOT} = goog.require('os');
const BearingType = goog.require('os.bearing.BearingType');
const {precision, roundWithPrecision} = goog.require('os.math');
const Units = goog.require('os.math.Units');
const {unsafeClone} = goog.require('os.object');
const Module = goog.require('os.ui.Module');
const {getRingTitle} = goog.require('os.ui.geo');


/**
 * The ringoptions directive
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'options': '='
  },
  templateUrl: ROOT + 'views/geo/ringoptions.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'ringoptions';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the ringoptions directive
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
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
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * The ring options object.
     * @type {osx.feature.RingOptions}
     */
    this['options'] = $scope['options'] ? unsafeClone($scope['options']) : this.getDefaultOptions();

    /**
     * The number of rings.
     * @type {number}
     */
    this['count'] = this['options'].rings.length;

    /**
     * Unit options.
     * @type {string}
     */
    this['unitOptions'] = Object.values(Units);

    /**
     * Global UID for this controller, used to create unique IDs for form elements.
     * @type {number}
     */
    this['uid'] = goog.getUid(this);

    /**
     * @type {string}
     */
    this['title'] = getRingTitle();
  }

  /**
   * Clean up.
   */
  $onDestroy() {
    this.scope_ = null;
    this.element_ = null;
    this.timeout_ = null;
  }

  /**
   * Get the default ring options.
   * @return {!osx.feature.RingOptions} The default options.
   * @protected
   */
  getDefaultOptions() {
    return {
      enabled: false,
      type: 'auto',
      bearingType: BearingType.MAGNETIC,
      interval: 40,
      units: Units.NAUTICAL_MILES,
      crosshair: true,
      arcs: false,
      labels: true,
      startAngle: 0,
      widthAngle: 45,
      rings: [
        {radius: 40, units: Units.NAUTICAL_MILES},
        {radius: 80, units: Units.NAUTICAL_MILES},
        {radius: 120, units: Units.NAUTICAL_MILES},
        {radius: 160, units: Units.NAUTICAL_MILES},
        {radius: 200, units: Units.NAUTICAL_MILES}
      ]
    };
  }

  /**
   * Fires an update event with the new ring options.
   * @export
   */
  update() {
    const rings = this['options'].rings;
    if (rings.length == 0) {
      this['count'] = null;
    } else {
      this['count'] = rings.length;
    }

    // don't do an update to the ring options if there are invalid values in the form
    this.timeout_(() => {
      if (!this.scope_['ringOptionsForm'].$invalid) {
        this.scope_.$emit('ring.update', this['options']);
      }
    });
  }

  /**
   * Handles changes to the count.
   * @param {boolean=} opt_update Whether to force an update.
   * @export
   */
  updateCount(opt_update) {
    const rings = this['options'].rings;
    // if count is null, default to 0 for while loops
    const count = this['count'] || 0;
    while (rings.length < count) {
      this.add();
    }

    while (rings.length > count && rings.length > 0) {
      this.remove(rings.length - 1);
    }

    if (opt_update) {
      this.update();
    }
  }

  /**
   * Handles changes to the count.
   * @param {boolean=} opt_update Whether to force an update.
   * @export
   */
  updateInterval(opt_update) {
    var rings = this['options'].rings;
    rings.forEach(function(ring, i) {
      ring['radius'] = (i + 1) * this['options'].interval;
      ring['radius'] = roundWithPrecision(ring['radius'], precision(this['options'].interval));
    }, this);

    if (opt_update) {
      this.update();
    }
  }

  /**
   * Handles changes to the units.
   * @param {boolean=} opt_update Whether to force an update.
   * @export
   */
  updateUnits(opt_update) {
    var units = this['options'].units;
    var rings = this['options'].rings;
    rings.forEach(function(ring, i) {
      ring.units = units;
    }, this);

    if (opt_update) {
      this.update();
    }
  }

  /**
   * Add a new ring.
   * @param {boolean=} opt_update Whether to force an update.
   * @export
   */
  add(opt_update) {
    var last = peek(this['options'].rings);
    var radius = (last && last.radius || 0) + this['options'].interval;
    radius = roundWithPrecision(radius, precision(this['options'].interval));
    this['options'].rings.push({'radius': radius, 'units': this['options'].units});

    this.timeout_(function() {
      // wait until after the new UI element is added before scrolling down to the bottom
      var scrollEle = this.element_.find('.js-ring-scroll-section');
      scrollEle.scrollTop(scrollEle[0].scrollHeight);
    }.bind(this));

    if (opt_update) {
      this.update();
    }
  }

  /**
   * Fires an update event with the new ring options.
   * @param {number} i The index to remove.
   * @param {boolean=} opt_update Whether to force an update.
   * @export
   */
  remove(i, opt_update) {
    if (this['options'].rings.length > 0) {
      this['options'].rings.splice(i, 1);
    }

    if (opt_update) {
      this.update();
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

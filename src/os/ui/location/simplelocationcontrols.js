goog.module('os.ui.location.SimpleLocationControlsUI');

const {ROOT} = goog.require('os');
const Settings = goog.require('os.config.Settings');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const {LocationSetting, getCurrentFormat} = goog.require('os.ui.location');

const SettingChangeEvent = goog.requireType('os.events.SettingChangeEvent');
const Format = goog.requireType('os.ui.location.Format');


/**
 * SimpleLocationControls Directive.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/location/simplelocation.html',
  controller: Controller,
  controllerAs: 'simpleLocationControlsCtrl',
  scope: {
    'formatDefault': '=',
    'change': '&onChange',
    'formatGroup': '&'
  }
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'simple-location-controls';

// Register the directive
Module.directive('simpleLocationControls', directive);

/**
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {function(Object<Format>)}
     * @private
     */
    this.change_ = this.scope_['change'];

    /**
     * @type {Format}
     * @private
     */
    this['format'] = getCurrentFormat();

    this.change_({'opt_format': this['format']});

    this.scope_.$on('$destroy', this.destroy_.bind(this));
    this.scope_.$watch('formatDefault', function(format) {
      this['format'] = format;
    }.bind(this));

    Settings.getInstance().listen(LocationSetting.POSITION, this.locationControlChanged, false, this);
  }

  /**
   * Change the display model
   *
   * @param {Format} formatType
   * @param {angular.Scope.Event=} opt_event
   * @export
   */
  formatChanged(formatType, opt_event) {
    this.change_({'opt_format': formatType});
    if (opt_event && opt_event.target) {
      opt_event.target.blur();
    }
    Settings.getInstance().set(LocationSetting.POSITION, formatType);
    apply(this.scope_);
  }

  /**
   * Change the display model
   *
   * @param {SettingChangeEvent} event
   * @export
   */
  locationControlChanged(event) {
    if (event.newVal) {
      this.formatChanged(/** @type {Format} */ (event.newVal));
    }
  }

  /**
   * Clean up
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

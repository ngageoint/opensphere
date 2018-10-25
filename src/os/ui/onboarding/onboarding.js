goog.provide('os.ui.onboarding.OnboardingCtrl');
goog.provide('os.ui.onboarding.onboardingDirective');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.ui.EventType');
goog.require('os.ui.Module');
goog.require('os.ui.onboarding.OnboardingEvent');
goog.require('os.ui.onboarding.OnboardingManager');
goog.require('os.ui.onboarding.ngOnboardingDirective');


/**
 * The onboarding directive
 * @return {angular.Directive}
 */
os.ui.onboarding.onboardingDirective = function() {
  return {
    restrict: 'E',
    scope: true,
    template: '<div></div>',
    controller: os.ui.onboarding.OnboardingCtrl,
    controllerAs: 'onboardCtrl'
  };
};


/**
 * Register onboarding directive.
 */
os.ui.Module.directive('onboarding', [os.ui.onboarding.onboardingDirective]);



/**
 * Controller function for the onboarding directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @constructor
 * @ngInject
 */
os.ui.onboarding.OnboardingCtrl = function($scope, $element, $compile) {
  /**
   * @type {boolean}
   */
  this['enabled'] = false;

  /**
   * @type {?Array<Object>}
   */
  this['steps'] = null;

  /**
   * @type {number}
   */
  this['index'] = 0;

  /**
   * @dict
   */
  this['config'] = null;

  /**
   * @type {Function}
   */
  this['onFinishCallback'] = this.onFinishCallback_.bind(this);

  /**
   * @type {string}
   * @private
   */
  this.onboardingTemplate_ =
      '<ng-onboarding enabled="onboardCtrl.enabled" steps="onboardCtrl.steps" config="onboardCtrl.config"' +
      'on-finish-callback="onboardCtrl.onFinishCallback" step-index="onboardCtrl.index"></ng-onboarding>';

  /**
   * @type {?angular.$compile}
   * @private
   */
  this.compile_ = $compile;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {os.ui.onboarding.OnboardingManager}
   * @private
   */
  this.manager_ = os.ui.onboarding.OnboardingManager.getInstance();
  this.manager_.listen(os.ui.EventType.DISPLAY_ONBOARDING, this.onDisplayOnboarding_, false, this);

  /**
   * @type {Array<os.ui.onboarding.OnboardingEvent>}
   * @private
   */
  this.queue_ = [];

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.onboarding.OnboardingCtrl.LOGGER_ = goog.log.getLogger('os.ui.onboarding.OnboardingCtrl');


/**
 * @private
 */
os.ui.onboarding.OnboardingCtrl.prototype.destroy_ = function() {
  this.manager_.unlisten(os.ui.EventType.DISPLAY_ONBOARDING, this.onDisplayOnboarding_, false, this);

  this.element_ = null;
  this.compile_ = null;
  this.scope_ = null;
};


/**
 * Handler for onboarding events. Will display the onboarding if there isn't one active, or queue it otherwise.
 * @param {os.ui.onboarding.OnboardingEvent} event
 * @private
 */
os.ui.onboarding.OnboardingCtrl.prototype.onDisplayOnboarding_ = function(event) {
  goog.log.fine(os.ui.onboarding.OnboardingCtrl.LOGGER_, 'Received onboarding: ' + event.title);
  if (!this['enabled']) {
    this.displayOnboarding_(event);
  } else {
    this.queue_.push(event);
  }
};


/**
 * Displays an onboarding set.
 * @param {os.ui.onboarding.OnboardingEvent} event
 * @private
 */
os.ui.onboarding.OnboardingCtrl.prototype.displayOnboarding_ = function(event) {
  goog.log.fine(os.ui.onboarding.OnboardingCtrl.LOGGER_, 'Displaying onboarding: ' + event.title);

  if (event.config) {
    this['config'] = event.config;
  }

  this['steps'] = event.steps;
  this['enabled'] = true;
  this['index'] = 0;

  this.obScope_ = this.scope_.$new();
  var obElement = /** @type {Element} */ (this.compile_(this.onboardingTemplate_)(this.obScope_));
  this.element_.append(obElement);
};


/**
 * @private
 */
os.ui.onboarding.OnboardingCtrl.prototype.onFinishCallback_ = function() {
  this.element_.children().remove();
  this.obScope_.$destroy();
  this.obScope_ = null;

  this['config'] = null;
  this['steps'] = null;
  this['enabled'] = false;
  this['index'] = 0;

  // if onboarding has been disabled, dump the remaining queue
  if (!this.manager_ || !this.manager_.isEnabled()) {
    this.queue_.length = 0;
  }

  // display the next queued onboarding
  if (this.queue_.length > 0) {
    this.displayOnboarding_(this.queue_.shift());
  }
};

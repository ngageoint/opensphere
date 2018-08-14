goog.provide('os.ui.onboarding.OnboardingEvent');

goog.require('goog.events.Event');
goog.require('os.ui.EventType');



/**
 * Configuration for user onboarding.
 * @param {string} title Onboarding set title.
 * @param {Array.<Object>} steps The onboarding steps.
 * @param {Object=} opt_config ngOnboarding configuration.
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.onboarding.OnboardingEvent = function(title, steps, opt_config) {
  os.ui.onboarding.OnboardingEvent.base(this, 'constructor', os.ui.EventType.DISPLAY_ONBOARDING);

  /**
   * Title for the onboarding set.
   * @type {string}
   */
  this.title = title;

  /**
   * The ngOnboarding steps.
   * @type {Array.<Object>}
   */
  this.steps = steps;

  /**
   * @dict
   */
  this.config = opt_config || null;
};
goog.inherits(os.ui.onboarding.OnboardingEvent, goog.events.Event);

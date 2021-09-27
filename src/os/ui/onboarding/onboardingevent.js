goog.declareModuleId('os.ui.onboarding.OnboardingEvent');

import EventType from '../eventtype.js';

const GoogEvent = goog.require('goog.events.Event');


/**
 * Configuration for user onboarding.
 */
export default class OnboardingEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} title Onboarding set title.
   * @param {Array<Object>} steps The onboarding steps.
   * @param {Object=} opt_config ngOnboarding configuration.
   */
  constructor(title, steps, opt_config) {
    super(EventType.DISPLAY_ONBOARDING);

    /**
     * Title for the onboarding set.
     * @type {string}
     */
    this.title = title;

    /**
     * The ngOnboarding steps.
     * @type {Array<Object>}
     */
    this.steps = steps;

    /**
     * @dict
     */
    this.config = opt_config || null;
  }
}

goog.module('os.ui.onboarding.OnboardingUrlHandler');

const Settings = goog.require('os.config.Settings');
const AbstractUrlHandler = goog.require('os.url.AbstractUrlHandler');


/**
 * Handles URL parameters for onboarding.
 */
class OnboardingUrlHandler extends AbstractUrlHandler {
  /**
   * Constructor.
   * @param {string=} opt_omarId The ID of the OMAR server this handler handles.
   */
  constructor(opt_omarId) {
    super();
    this.keys = [OnboardingUrlHandler.KEY];
  }

  /**
   * Handles the 'tips' key to either force onboarding on or off.
   *
   * @inheritDoc
   */
  handleInternal(key, value) {
    if (key === OnboardingUrlHandler.KEY) {
      Settings.getInstance().set('onboarding.showOnboarding', value === 'true');
    }
  }
}

/**
 * @type {string}
 * @const
 */
OnboardingUrlHandler.KEY = 'tips';

exports = OnboardingUrlHandler;

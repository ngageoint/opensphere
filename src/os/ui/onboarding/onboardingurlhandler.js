goog.declareModuleId('os.ui.onboarding.OnboardingUrlHandler');

import Settings from '../../config/settings.js';
import AbstractUrlHandler from '../../url/abstracturlhandler.js';


/**
 * Handles URL parameters for onboarding.
 */
export default class OnboardingUrlHandler extends AbstractUrlHandler {
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

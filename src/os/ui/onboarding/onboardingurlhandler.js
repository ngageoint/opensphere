goog.provide('os.ui.onboarding.OnboardingUrlHandler');
goog.require('os.config.Settings');
goog.require('os.ui.im.ImportEvent');
goog.require('os.url.AbstractUrlHandler');



/**
 * Handles URL parameters for onboarding.
 * @param {string=} opt_omarId The ID of the OMAR server this handler handles.
 * @extends {os.url.AbstractUrlHandler}
 * @constructor
 */
os.ui.onboarding.OnboardingUrlHandler = function(opt_omarId) {
  os.ui.onboarding.OnboardingUrlHandler.base(this, 'constructor');
  this.keys = [os.ui.onboarding.OnboardingUrlHandler.KEY];
};
goog.inherits(os.ui.onboarding.OnboardingUrlHandler, os.url.AbstractUrlHandler);


/**
 * @type {string}
 * @const
 */
os.ui.onboarding.OnboardingUrlHandler.KEY = 'tips';


/**
 * Handles the 'tips' key to either force onboarding on or off.
 * @inheritDoc
 */
os.ui.onboarding.OnboardingUrlHandler.prototype.handleInternal = function(key, value) {
  if (key === os.ui.onboarding.OnboardingUrlHandler.KEY) {
    os.settings.set('onboarding.showOnboarding', value === 'true');
  }
};

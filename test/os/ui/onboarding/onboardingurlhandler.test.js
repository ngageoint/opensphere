goog.require('os.config.Settings');
goog.require('os.mock');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.onboarding.OnboardingUrlHandler');


describe('os.ui.onboarding.OnboardingUrlHandler', function() {
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {default: OnboardingUrlHandler} = goog.module.get('os.ui.onboarding.OnboardingUrlHandler');

  var handler;

  beforeEach(function() {
    handler = new OnboardingUrlHandler();
  });

  it('should handle only tips keys', function() {
    expect(handler.handles('tips')).toBe(true);
    expect(handler.handles('tisp')).toBe(false);
  });

  it('should handle keys setting a settings key', function() {
    // these values are read in as stringified booleans
    handler.handle('tips', 'true');
    expect(Settings.getInstance().get('onboarding.showOnboarding')).toBe(true);

    handler.handle('tips', 'false');
    expect(Settings.getInstance().get('onboarding.showOnboarding')).toBe(false);
  });
});

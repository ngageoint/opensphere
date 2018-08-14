goog.require('os.mock');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.onboarding.OnboardingUrlHandler');


describe('os.ui.onboarding.OnboardingUrlHandler', function() {
  var handler;

  beforeEach(function() {
    handler = new os.ui.onboarding.OnboardingUrlHandler();
  });

  it('should handle only tips keys', function() {
    expect(handler.handles('tips')).toBe(true);
    expect(handler.handles('tisp')).toBe(false);
  });

  it('should handle keys setting a settings key', function() {
    // these values are read in as stringified booleans
    handler.handle('tips', 'true');
    expect(os.settings.get('onboarding.showOnboarding')).toBe(true);

    handler.handle('tips', 'false');
    expect(os.settings.get('onboarding.showOnboarding')).toBe(false);
  });
});

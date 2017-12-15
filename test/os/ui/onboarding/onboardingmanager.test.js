goog.require('os.config.Settings');
goog.require('os.mock');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('os.ui.EventType');
goog.require('os.ui.onboarding.OnboardingManager');


describe('os.ui.onboarding.OnboardingManager', function() {
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);
  var manager;

  beforeEach(function() {
    manager = os.ui.onboarding.OnboardingManager.getInstance();
  });

  it('should load an onboarding config and fire an event', function() {
    os.settings.init('nuhuh', 'who.cares.yo');
    var obConfig = null;
    var listener = function(e) {
      obConfig = e;
    };
    manager.listen(os.ui.EventType.DISPLAY_ONBOARDING, listener);

    runs(function() {
      manager.displayOnboarding('/base/test/os/ui/onboarding/valid.json');
    });

    waitsFor(function() {
      return obConfig != null;
    }, 'onboarding to load');

    runs(function() {
      expect(obConfig.title).toBe('Onboarding Test');

      expect(obConfig.config).not.toBe(null);
      expect(obConfig.config.width).toBe(1234);

      expect(obConfig.steps).not.toBe(null);
      expect(obConfig.steps.length).toBe(2);


      manager.unlisten(os.ui.EventType.DISPLAY_ONBOARDING, listener);
    });
  });

  it('should not open the same onboarding twice', function() {
    spyOn(manager, 'launchOnboarding_');
    manager.displayOnboarding('/base/test/os/ui/onboarding/valid.json');
    expect(manager.launchOnboarding_.calls.length).toEqual(0);
  });

  it('should still display onboarding when forced', function() {
    spyOn(manager, 'launchOnboarding_');
    manager.displayOnboarding('/base/test/os/ui/onboarding/valid.json', true);
    expect(manager.launchOnboarding_.calls.length).toEqual(1);
  });

  it('should build maps when asked to display onboarding', function() {
    manager.displayOnboarding('/base/test/os/ui/onboarding/valid.json', true);

    var context = manager.contextMap_['somethingSweet'];
    expect(context).toBeDefined();
    expect(context.length).toBe(1);
  });

  it('should still display contextual onboarding based on the selector', function() {
    var contextOb = null;
    var listener = function(e) {
      contextOb = e;
    };
    manager.listen(os.ui.EventType.DISPLAY_ONBOARDING, listener);

    runs(function() {
      manager.showContextOnboarding('somethingSweet');
    });

    waitsFor(function() {
      return contextOb != null;
    }, 'onboarding to load');

    runs(function() {
      expect(contextOb.title).toBe('Oh Boy!');

      expect(contextOb.config).not.toBe(null);
      expect(contextOb.config.width).toBe(350);

      expect(contextOb.steps).not.toBe(null);
      expect(contextOb.steps.length).toBe(1);

      manager.unlisten(os.ui.EventType.DISPLAY_ONBOARDING, listener);
    });
  });
});

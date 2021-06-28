goog.provide('os.mock');

goog.require('goog.events.EventTarget');
goog.require('os');
goog.require('os.MapContainer');
goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.config.storage.SettingsObjectStorage');
goog.require('os.data.DataManager');
goog.require('os.im.mapping.AltMapping');
goog.require('os.im.mapping.BearingMapping');
goog.require('os.im.mapping.LatMapping');
goog.require('os.im.mapping.LonMapping');
goog.require('os.im.mapping.OrientationMapping');
goog.require('os.im.mapping.PositionMapping');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.im.mapping.SemiMajorMapping');
goog.require('os.im.mapping.SemiMinorMapping');
goog.require('os.im.mapping.WKTMapping');
goog.require('os.im.mapping.time.DateMapping');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.im.mapping.time.TimeMapping');
goog.require('os.map.instance');
goog.require('os.mixin');
goog.require('os.mixin.closure');
goog.require('os.net');
goog.require('os.net.ExtDomainHandler');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.query.instance');
goog.require('os.style.StyleManager');
goog.require('os.time.replacers');
goog.require('os.ui.config.SettingsManager');
goog.require('os.ui.ogc.OGCDescriptor');
goog.require('test.os.config.SettingsUtil');


angular.element(document.body).append('<div id="map-container"></div');

beforeEach(function() {
  const Settings = goog.module.get('os.config.Settings');
  const {resetCrossOriginCache, resetDefaultValidators} = goog.module.get('os.net');

  const settings = Settings.getInstance();

  // the bracket notation gets the compiler to quit complaining about this
  os['config']['appNs'] = 'unittest';

  // register request handlers
  os.net.RequestHandlerFactory.addHandler(os.net.ExtDomainHandler);
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);

  // reset net module
  resetCrossOriginCache();
  resetDefaultValidators();

  angular.mock.module('ngSanitize');

  if (!os.dispatcher) {
    os.dispatcher = new goog.events.EventTarget();
  }

  if (!os.ui.injector) {
    inject(function($injector) {
      os.ui.injector = $injector;
    });
  }

  if (!settings.isLoaded() || !settings.isInitialized()) {
    settings.getStorageRegistry().addStorage(new os.config.storage.SettingsObjectStorage(['unit']));
    test.os.config.SettingsUtil.initAndLoad(settings);

    waitsFor(function() {
      return settings.isLoaded() && settings.isInitialized();
    });
  }

  // interpolation can break some tests, it should really only be on for the interpolation tests
  os.interpolate.enabled_ = false;

  runs(function() {
    // vector source will need this
    if (!settings.get('maxFeatures.2d')) {
      settings.set('maxFeatures.2d', 50000);
    }

    if (!settings.get('maxFeatures.3d')) {
      settings.set('maxFeatures.3d', 150000);
    }

    if (!os.dataManager || !os.osDataManager) {
      os.dataManager = os.osDataManager = os.data.DataManager.getInstance();
      os.dataManager.registerDescriptorType(os.ogc.ID, os.ui.ogc.OGCDescriptor);
    }

    if (!os.areaManager) {
      var areaManager = os.query.AreaManager.getInstance();
      os.query.instance.setAreaManager(areaManager);
      os.areaManager = os.ui.areaManager = areaManager;
    }

    if (!os.filterManager) {
      var filterManager = os.query.FilterManager.getInstance();
      os.query.instance.setFilterManager(filterManager);
      os.filterManager = os.ui.filterManager = filterManager;
    }

    if (!os.queryManager) {
      var queryManager = os.query.QueryManager.getInstance();
      os.query.instance.setQueryManager(queryManager);
      os.queryManager = os.ui.queryManager = queryManager;
    }

    if (!os.styleManager) {
      os.styleManager = os.style.StyleManager.getInstance();
    }

    var map = os.MapContainer.getInstance();
    os.map.instance.setMapContainer(map);

    if (!map.getMap()) {
      map.init();
    }

    if (!os.settingsManager) {
      os.settingsManager = os.ui.config.SettingsManager.getInstance();
    }

    os.time.replacers.init();
  });
});


//
// Verify test initialization is complete.
//
// If UI tests are using ddescribe or iit, this must also be included to ensure angular.mock.module calls succeed.
//
describe('OpenSphere Test Initialization', () => {
  const Settings = goog.module.get('os.config.Settings');

  const settings = Settings.getInstance();

  it('initializes globals for tests', () => {
    expect(settings.isLoaded()).toBe(true);
    expect(settings.isInitialized()).toBe(true);

    expect(os.ui.injector).toBeDefined();
  });
});


/**
 * Creates and returns a new mapping manager configured the same as within the app
 * @return {os.im.mapping.MappingManager}
 */
os.mock.getMockMappingManager = function() {
  var mm = new os.im.mapping.MappingManager();

  // register a date/time, date, and time mapping for each type
  mm.registerMapping(new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.INSTANT));
  mm.registerMapping(new os.im.mapping.time.DateMapping(os.im.mapping.TimeType.INSTANT));
  mm.registerMapping(new os.im.mapping.time.TimeMapping(os.im.mapping.TimeType.INSTANT));
  mm.registerMapping(new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.START));
  mm.registerMapping(new os.im.mapping.time.DateMapping(os.im.mapping.TimeType.START));
  mm.registerMapping(new os.im.mapping.time.TimeMapping(os.im.mapping.TimeType.START));
  mm.registerMapping(new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.END));
  mm.registerMapping(new os.im.mapping.time.DateMapping(os.im.mapping.TimeType.END));
  mm.registerMapping(new os.im.mapping.time.TimeMapping(os.im.mapping.TimeType.END));

  // register geo mappings
  mm.registerMapping(new os.im.mapping.WKTMapping());
  mm.registerMapping(new os.im.mapping.LatMapping());
  mm.registerMapping(new os.im.mapping.LonMapping());
  mm.registerMapping(new os.im.mapping.PositionMapping());
  mm.registerMapping(new os.im.mapping.AltMapping());
  mm.registerMapping(new os.im.mapping.BearingMapping());

  // register ellipse mappings
  mm.registerMapping(new os.im.mapping.RadiusMapping());
  mm.registerMapping(new os.im.mapping.OrientationMapping());
  mm.registerMapping(new os.im.mapping.SemiMajorMapping());
  mm.registerMapping(new os.im.mapping.SemiMinorMapping());

  return mm;
};

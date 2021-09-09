goog.provide('os.mock');

goog.require('goog.events.EventTarget');
goog.require('os');
goog.require('os.Dispatcher');
goog.require('os.MapContainer');
goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.config.storage.SettingsObjectStorage');
goog.require('os.data.DataManager');
goog.require('os.im.mapping.AltMapping');
goog.require('os.im.mapping.BearingMapping');
goog.require('os.im.mapping.LatMapping');
goog.require('os.im.mapping.LonMapping');
goog.require('os.im.mapping.MappingManager');
goog.require('os.im.mapping.OrientationMapping');
goog.require('os.im.mapping.PositionMapping');
goog.require('os.im.mapping.RadiusMapping');
goog.require('os.im.mapping.SemiMajorMapping');
goog.require('os.im.mapping.SemiMinorMapping');
goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.WKTMapping');
goog.require('os.im.mapping.time.DateMapping');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.im.mapping.time.TimeMapping');
goog.require('os.interpolate');
goog.require('os.map.instance');
goog.require('os.mixin');
goog.require('os.mixin.closure');
goog.require('os.net');
goog.require('os.net.ExtDomainHandler');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('os.ogc');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.query.instance');
goog.require('os.style.StyleManager');
goog.require('os.style.instance');
goog.require('os.time.replacers');
goog.require('os.ui.config.SettingsManager');
goog.require('os.ui.ogc.OGCDescriptor');
goog.require('test.os.config.SettingsUtil');


angular.element(document.body).append('<div id="map-container"></div');

beforeEach(function() {
  const EventTarget = goog.module.get('goog.events.EventTarget');
  const os = goog.module.get('os');
  const osMock = goog.module.get('os.mock');
  const osConfig = goog.module.get('os.config');
  const Dispatcher = goog.module.get('os.Dispatcher');
  const MapContainer = goog.module.get('os.MapContainer');
  const SettingsObjectStorage = goog.module.get('os.config.storage.SettingsObjectStorage');
  const DataManager = goog.module.get('os.data.DataManager');
  const interpolate = goog.module.get('os.interpolate');
  const osMapInstance = goog.module.get('os.map.instance');
  const ExtDomainHandler = goog.module.get('os.net.ExtDomainHandler');
  const RequestHandlerFactory = goog.module.get('os.net.RequestHandlerFactory');
  const SameDomainHandler = goog.module.get('os.net.SameDomainHandler');
  const ogc = goog.module.get('os.ogc');
  const AreaManager = goog.module.get('os.query.AreaManager');
  const FilterManager = goog.module.get('os.query.FilterManager');
  const QueryManager = goog.module.get('os.query.QueryManager');
  const osQueryInstance = goog.module.get('os.query.instance');
  const instance = goog.module.get('os.style.instance');
  const replacers = goog.module.get('os.time.replacers');
  const SettingsManager = goog.module.get('os.ui.config.SettingsManager');
  const Settings = goog.module.get('os.config.Settings');
  const {resetCrossOriginCache, resetDefaultValidators} = goog.module.get('os.net');
  const StyleManager = goog.module.get('os.style.StyleManager');
  const osUi = goog.module.get('os.ui');
  const OGCDescriptor = goog.module.get('os.ui.ogc.OGCDescriptor');
  const SettingsUtil = goog.module.get('test.os.config.SettingsUtil');

  const settings = Settings.getInstance();

  // the bracket notation gets the compiler to quit complaining about this
  osConfig.appNs = 'unittest';

  // register request handlers
  RequestHandlerFactory.addHandler(ExtDomainHandler);
  RequestHandlerFactory.addHandler(SameDomainHandler);

  // reset net module
  resetCrossOriginCache();
  resetDefaultValidators();

  angular.mock.module('ngSanitize');

  if (!Dispatcher.getInstance()) {
    Dispatcher.setInstance(new EventTarget());
  }

  if (!osUi.injector) {
    inject(function($injector) {
      osUi.setInjector($injector);
    });
  }

  if (!settings.isLoaded() || !settings.isInitialized()) {
    settings.getStorageRegistry().addStorage(new SettingsObjectStorage(['unit']));
    SettingsUtil.initAndLoad(settings);

    waitsFor(function() {
      return settings.isLoaded() && settings.isInitialized();
    });
  }

  // interpolation can break some tests, it should really only be on for the interpolation tests
  interpolate.setEnabled(false);

  runs(function() {
    // vector source will need this
    if (!settings.get('maxFeatures.2d')) {
      settings.set('maxFeatures.2d', 50000);
    }

    if (!settings.get('maxFeatures.3d')) {
      settings.set('maxFeatures.3d', 150000);
    }

    // This needs to be initialized before the data manager.
    var map = MapContainer.getInstance();
    osMapInstance.setIMapContainer(map);
    osMapInstance.setMapContainer(map);

    if (!os.dataManager) {
      const dataManager = DataManager.getInstance();
      os.setDataManager(dataManager);
      dataManager.setMapContainer(map);
      dataManager.registerDescriptorType(ogc.ID, OGCDescriptor);
    }

    if (!osMock.areaManager) {
      osMock.areaManager = AreaManager.getInstance();
      osQueryInstance.setAreaManager(osMock.areaManager);
    }

    if (!osMock.filterManager) {
      osMock.filterManager = FilterManager.getInstance();
      osQueryInstance.setFilterManager(osMock.filterManager);
    }

    if (!osMock.queryManager) {
      osMock.queryManager = QueryManager.getInstance();
      osQueryInstance.setQueryManager(osMock.queryManager);
    }

    if (!os.styleManager) {
      var styleManager = StyleManager.getInstance();
      os.styleManager = styleManager;
      instance.setStyleManager(styleManager);
    }

    if (!map.getMap()) {
      map.init();
    }

    if (!os.settingsManager) {
      os.settingsManager = SettingsManager.getInstance();
    }

    replacers.init();
  });
});


//
// Verify test initialization is complete.
//
// If UI tests are using ddescribe or iit, this must also be included to ensure angular.mock.module calls succeed.
//
describe('OpenSphere Test Initialization', () => {
  const Settings = goog.module.get('os.config.Settings');
  const osUi = goog.module.get('os.ui');

  const settings = Settings.getInstance();

  it('initializes globals for tests', () => {
    expect(settings.isLoaded()).toBe(true);
    expect(settings.isInitialized()).toBe(true);

    expect(osUi.injector).toBeDefined();
  });
});


/**
 * Creates and returns a new mapping manager configured the same as within the app
 * @return {os.im.mapping.MappingManager}
 */
os.mock.getMockMappingManager = function() {
  const AltMapping = goog.module.get('os.im.mapping.AltMapping');
  const BearingMapping = goog.module.get('os.im.mapping.BearingMapping');
  const LatMapping = goog.module.get('os.im.mapping.LatMapping');
  const LonMapping = goog.module.get('os.im.mapping.LonMapping');
  const MappingManager = goog.module.get('os.im.mapping.MappingManager');
  const OrientationMapping = goog.module.get('os.im.mapping.OrientationMapping');
  const PositionMapping = goog.module.get('os.im.mapping.PositionMapping');
  const RadiusMapping = goog.module.get('os.im.mapping.RadiusMapping');
  const SemiMajorMapping = goog.module.get('os.im.mapping.SemiMajorMapping');
  const SemiMinorMapping = goog.module.get('os.im.mapping.SemiMinorMapping');
  const TimeType = goog.module.get('os.im.mapping.TimeType');
  const WKTMapping = goog.module.get('os.im.mapping.WKTMapping');
  const DateMapping = goog.module.get('os.im.mapping.time.DateMapping');
  const DateTimeMapping = goog.module.get('os.im.mapping.time.DateTimeMapping');
  const TimeMapping = goog.module.get('os.im.mapping.time.TimeMapping');

  var mm = new MappingManager();

  // register a date/time, date, and time mapping for each type
  mm.registerMapping(new DateTimeMapping(TimeType.INSTANT));
  mm.registerMapping(new DateMapping(TimeType.INSTANT));
  mm.registerMapping(new TimeMapping(TimeType.INSTANT));
  mm.registerMapping(new DateTimeMapping(TimeType.START));
  mm.registerMapping(new DateMapping(TimeType.START));
  mm.registerMapping(new TimeMapping(TimeType.START));
  mm.registerMapping(new DateTimeMapping(TimeType.END));
  mm.registerMapping(new DateMapping(TimeType.END));
  mm.registerMapping(new TimeMapping(TimeType.END));

  // register geo mappings
  mm.registerMapping(new WKTMapping());
  mm.registerMapping(new LatMapping());
  mm.registerMapping(new LonMapping());
  mm.registerMapping(new PositionMapping());
  mm.registerMapping(new AltMapping());
  mm.registerMapping(new BearingMapping());

  // register ellipse mappings
  mm.registerMapping(new RadiusMapping());
  mm.registerMapping(new OrientationMapping());
  mm.registerMapping(new SemiMajorMapping());
  mm.registerMapping(new SemiMinorMapping());

  return mm;
};

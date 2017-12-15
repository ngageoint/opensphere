goog.provide('os.mock');

goog.require('goog.events.EventTarget');
goog.require('os');
goog.require('os.MapContainer');
goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.config.storage.SettingsObjectStorage');
goog.require('os.data.OSDataManager');
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
goog.require('os.mixin');
goog.require('os.mixin.closure');
goog.require('os.net.ExtDomainHandler');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.SameDomainHandler');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.style.StyleManager');
goog.require('os.ui.config.SettingsManager');
goog.require('os.ui.ogc.OGCDescriptor');
goog.require('test.os.config.SettingsUtil');


angular.element(document.body).append('<div id="map-container"></div');

beforeEach(function() {
  // the bracket notation gets the compiler to quit complaining about this
  os['config']['appNs'] = 'unittest';

  os.net.RequestHandlerFactory.addHandler(os.net.ExtDomainHandler);
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);

  angular.mock.module('ngSanitize');

  if (!os.dispatcher) {
    os.dispatcher = new goog.events.EventTarget();
  }

  if (!os.ui.injector) {
    inject(function($injector) {
      os.ui.injector = $injector;
    });
  }

  if (!os.settings.isLoaded() || !os.settings.isInitialized()) {
    os.settings.getStorageRegistry().addStorage(new os.config.storage.SettingsObjectStorage(['unit']));
    test.os.config.SettingsUtil.initAndLoad(os.settings);
  }

  // interpolation can break some tests, it should really only be on for the interpolation tests
  os.interpolate.enabled_ = false;

  runs(function() {
    // vector source will need this
    if (!os.settings.get('maxFeatures.2d')) {
      os.settings.set('maxFeatures.2d', 50000);
    }

    if (!os.settings.get('maxFeatures.3d')) {
      os.settings.set('maxFeatures.3d', 150000);
    }

    if (!os.dataManager || !os.osDataManager) {
      os.dataManager = os.osDataManager = os.data.OSDataManager.getInstance();
      os.dataManager.registerDescriptorType(os.ogc.ID, os.ui.ogc.OGCDescriptor);
    }

    if (!os.areaManager) {
      os.areaManager = os.ui.areaManager = os.query.AreaManager.getInstance();
    }

    if (!os.filterManager) {
      os.filterManager = os.ui.filterManager = os.query.FilterManager.getInstance();
    }

    if (!os.queryManager) {
      os.queryManager = os.ui.queryManager = os.query.QueryManager.getInstance();
    }

    if (!os.styleManager) {
      os.styleManager = os.style.StyleManager.getInstance();
    }

    var map = os.MapContainer.getInstance();
    if (!map.getMap()) {
      map.init();
    }

    if (!os.settingsManager) {
      os.settingsManager = os.ui.config.SettingsManager.getInstance();
    }
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

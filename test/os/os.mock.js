goog.declareModuleId('os.mock');

goog.require('goog.events.EventTarget');
goog.require('test.os.config.SettingsUtil');

import '../../src/os/config/config.js';
import '../../src/os/config/settings.js';
import '../../src/os/config/storage/settingsobjectstorage.js';
import '../../src/os/data/datamanager.js';
import '../../src/os/im/mapping/altmapping.js';
import '../../src/os/im/mapping/bearingmapping.js';
import '../../src/os/im/mapping/latmapping.js';
import '../../src/os/im/mapping/lonmapping.js';
import '../../src/os/im/mapping/mappingmanager.js';
import '../../src/os/im/mapping/orientationmapping.js';
import '../../src/os/im/mapping/positionmapping.js';
import '../../src/os/im/mapping/radiusmapping.js';
import '../../src/os/im/mapping/semimajormapping.js';
import '../../src/os/im/mapping/semiminormapping.js';
import '../../src/os/im/mapping/time/datemapping.js';
import '../../src/os/im/mapping/time/datetimemapping.js';
import '../../src/os/im/mapping/time/timemapping.js';
import '../../src/os/im/mapping/timetype.js';
import '../../src/os/im/mapping/wktmapping.js';
import '../../src/os/interpolate.js';
import '../../src/os/map/mapinstance.js';
import '../../src/os/mapcontainer.js';
import '../../src/os/mixin/closuremixin.js';
import '../../src/os/mixin/mixin.js';
import '../../src/os/net/extdomainhandler.js';
import '../../src/os/net/net.js';
import '../../src/os/net/requesthandlerfactory.js';
import '../../src/os/net/samedomainhandler.js';
import '../../src/os/ogc/ogc.js';
import '../../src/os/query/areamanager.js';
import '../../src/os/query/filtermanager.js';
import '../../src/os/query/queryinstance.js';
import '../../src/os/query/querymanager.js';
import '../../src/os/style/styleinstance.js';
import '../../src/os/style/stylemanager_shim.js';
import '../../src/os/time/timereplacers.js';

import '../../src/os/ui/config/settingsmanager.js';
import '../../src/os/ui/ogc/ogcdescriptor.js';
import '../../src/os/ui/windowui.js';

import * as Dispatcher from '../../src/os/dispatcher.js';
import * as os from '../../src/os/os.js';
import windowSelector from '../../src/os/ui/windowselector.js';

const windowContainerId = windowSelector.CONTAINER.replace(/^#/, '');

angular.element(document.body).append('<div id="map-container"></div>');
angular.element(document.body).append(`<div id="${windowContainerId}"></div>`);

beforeEach(function() {
  const EventTarget = goog.module.get('goog.events.EventTarget');
  const osMock = goog.module.get('os.mock');
  const osConfig = goog.module.get('os.config');
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: SettingsObjectStorage} = goog.module.get('os.config.storage.SettingsObjectStorage');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const interpolate = goog.module.get('os.interpolate');
  const osMapInstance = goog.module.get('os.map.instance');
  const {default: ExtDomainHandler} = goog.module.get('os.net.ExtDomainHandler');
  const RequestHandlerFactory = goog.module.get('os.net.RequestHandlerFactory');
  const {default: SameDomainHandler} = goog.module.get('os.net.SameDomainHandler');
  const ogc = goog.module.get('os.ogc');
  const {default: AreaManager} = goog.module.get('os.query.AreaManager');
  const {default: FilterManager} = goog.module.get('os.query.FilterManager');
  const {default: QueryManager} = goog.module.get('os.query.QueryManager');
  const osQueryInstance = goog.module.get('os.query.instance');
  const osStyleInstance = goog.module.get('os.style.instance');
  const replacers = goog.module.get('os.time.replacers');
  const {default: SettingsManager} = goog.module.get('os.ui.config.SettingsManager');
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {resetCrossOriginCache, resetDefaultValidators} = goog.module.get('os.net');
  const {default: StyleManager} = goog.module.get('os.style.StyleManager');
  const osUi = goog.module.get('os.ui');
  const {default: OGCDescriptor} = goog.module.get('os.ui.ogc.OGCDescriptor');
  const SettingsUtil = goog.module.get('test.os.config.SettingsUtil');

  const settings = Settings.getInstance();

  // the bracket notation gets the compiler to quit complaining about this
  osConfig.setAppNs('unittest');

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
      // Bootstrap the app using the window container and set the injector reference.
      angular.bootstrap(document.querySelector(windowSelector.CONTAINER), ['app']);
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

    if (!osMock.dataManager) {
      const dataManager = osMock.dataManager = DataManager.getInstance();
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

    if (!osMock.styleManager) {
      osMock.styleManager = StyleManager.getInstance();
      osStyleInstance.setStyleManager(osMock.styleManager);
    }

    if (!map.getMap()) {
      map.init();
    }

    if (!osMock.settingsManager) {
      osMock.settingsManager = SettingsManager.getInstance();
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
  const {default: Settings} = goog.module.get('os.config.Settings');
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
 * @return {MappingManager}
 */
export const getMockMappingManager = function() {
  const {default: AltMapping} = goog.module.get('os.im.mapping.AltMapping');
  const {default: BearingMapping} = goog.module.get('os.im.mapping.BearingMapping');
  const {default: LatMapping} = goog.module.get('os.im.mapping.LatMapping');
  const {default: LonMapping} = goog.module.get('os.im.mapping.LonMapping');
  const {default: MappingManager} = goog.module.get('os.im.mapping.MappingManager');
  const {default: OrientationMapping} = goog.module.get('os.im.mapping.OrientationMapping');
  const {default: PositionMapping} = goog.module.get('os.im.mapping.PositionMapping');
  const {default: RadiusMapping} = goog.module.get('os.im.mapping.RadiusMapping');
  const {default: SemiMajorMapping} = goog.module.get('os.im.mapping.SemiMajorMapping');
  const {default: SemiMinorMapping} = goog.module.get('os.im.mapping.SemiMinorMapping');
  const {default: TimeType} = goog.module.get('os.im.mapping.TimeType');
  const {default: WKTMapping} = goog.module.get('os.im.mapping.WKTMapping');
  const {default: DateMapping} = goog.module.get('os.im.mapping.time.DateMapping');
  const {default: DateTimeMapping} = goog.module.get('os.im.mapping.time.DateTimeMapping');
  const {default: TimeMapping} = goog.module.get('os.im.mapping.time.TimeMapping');

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

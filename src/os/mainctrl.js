goog.declareModuleId('os.MainCtrl');

goog.require('os.file.mime.any');
import './ui/alerts.js';
import './ui/dragdrop/urldragdropui.js';
import './ui/ex/addexportoptionsui.js';
import './ui/file/anytypeimportui.js';
import './ui/ngrightclick.js';
import './ui/search/searchresults.js';
import './ui/timelinepanel.js';
import ArcPlugin from '../plugin/arc/arcplugin.js';
import AreaPlugin from '../plugin/area/areaplugin.js';
import AreaDataPlugin from '../plugin/areadata/areadataplugin.js';
import AudioPlugin from '../plugin/audio/audioplugin.js';
import BaseMapPlugin from '../plugin/basemap/basemapplugin.js';
import CapturePlugin from '../plugin/capture/captureplugin.js';
import CesiumPlugin from '../plugin/cesium/cesiumplugin.js';
import ConfigPlugin from '../plugin/config/configplugin.js';
import SearchPlugin from '../plugin/descriptor/searchplugin.js';
import FeatureActionPlugin from '../plugin/featureaction/featureactionplugin.js';
import CSVPlugin from '../plugin/file/csv/csvplugin.js';
import GeoJSONPlugin from '../plugin/file/geojson/geojsonplugin.js';
import GMLPlugin from '../plugin/file/gml/gmlplugin.js';
import GPXPlugin from '../plugin/file/gpx/gpxplugin.js';
import KMLPlugin from '../plugin/file/kml/kmlplugin.js';
import SHPPlugin from '../plugin/file/shp/shpplugin.js';
import ZIPPlugin from '../plugin/file/zip/zipplugin.js';
import GooglePlacesPlugin from '../plugin/google/places/plugin.js';
import HeatmapPlugin from '../plugin/heatmap/heatmapplugin.js';
import OGCPlugin from '../plugin/ogc/ogcplugin.js';
import OpenpagePlugin from '../plugin/openpage/openpageplugin.js';
import NominatimPlugin from '../plugin/osm/nom/nominatimplugin.js';
import OverviewPlugin from '../plugin/overview/overviewplugin.js';
import ParamsPlugin from '../plugin/params/paramsplugin.js';
import PeliasGeocoderPlugin from '../plugin/pelias/geocoder/plugin.js';
import PlacesPlugin from '../plugin/places/placesplugin.js';
import PositionPlugin from '../plugin/position/positionplugin.js';
import PersistPlugin from '../plugin/storage/persistplugin.js';
import SunCalcPlugin from '../plugin/suncalc/suncalcplugin.js';
import TrackPlugin from '../plugin/track/trackplugin.js';
import VectorTilePlugin from '../plugin/vectortile/vectortileplugin.js';
import VectorToolsPlugin from '../plugin/vectortools/vectortoolsplugin.js';
import WeatherPlugin from '../plugin/weather/weatherplugin.js';
import XYZPlugin from '../plugin/xyz/xyzplugin.js';
import * as dispatcher from './dispatcher.js';
import * as os from './os.js';
import AbstractMainContent from './ui/abstractmaincontent.js';
import AbstractMainCtrl from './ui/abstractmainctrl.js';
import ClearEntry from './ui/clear/clearentry.js';
import ClearManager from './ui/clear/clearmanager.js';
import ColumnMappingSettings from './ui/column/mapping/columnmappingsettings.js';
import SettingsManager from './ui/config/settingsmanager.js';
import * as osUiDraw from './ui/draw/draw.js';
import UIEventType from './ui/events/uieventtype.js';
import FileXTHandler from './ui/file/filexthandler.js';
import ImportMethod from './ui/file/method/importmethod.js';
import exportManager from './ui/file/uiexportmanager.js';
import Controls from './ui/help/controls.js';
import * as metricsOption from './ui/help/metricsoption.js';
import ImportEvent from './ui/im/importevent.js';
import ImportEventType from './ui/im/importeventtype.js';
import ImportManager from './ui/im/importmanager.js';
import * as osUiList from './ui/list.js';
import * as areaImportMenu from './ui/menu/areaimportmenu.js';
import * as bufferMenu from './ui/menu/buffermenu.js';
import * as defaultWindowsMenu from './ui/menu/defaultwindowsmenu.js';
import * as drawMenu from './ui/menu/drawmenu.js';
import * as filterMenu from './ui/menu/filtermenu.js';
import * as importMenu from './ui/menu/importmenu.js';
import * as layerMenu from './ui/menu/layermenu.js';
import * as listMenu from './ui/menu/listmenu.js';
import * as mapMenu from './ui/menu/mapmenu.js';
import * as saveMenu from './ui/menu/savemenu.js';
import * as spatialMenu from './ui/menu/spatial.js';
import * as timelineMenu from './ui/menu/timelinemenu.js';
import * as unitMenu from './ui/menu/unitmenu.js';
import {openWindow} from './ui/menu/windowsmenu.js';
import MetricsManager from './ui/metrics/metricsmanager.js';
import * as navbaroptions from './ui/nav/navbaroptions.js';
import OnboardingManager from './ui/onboarding/onboardingmanager.js';
import QueryEntriesClear from './ui/query/cmd/queryentriesclearcmd.js';
import RouteManager from './ui/route/routemanager.js';
import NoResult from './ui/search/noresult.js';
import CoordinateSearch from './ui/search/place/coordinatesearch.js';
import StateClear from './ui/state/cmd/stateclearcmd.js';
import * as stateMenu from './ui/state/statemenu.js';
import {MODAL_SELECTOR, apply, waitForAngular} from './ui/ui.js';

import LocationSettings from './ui/user/settings/locationsettings.js';
import * as osWindow from './ui/window.js';
import * as ConfirmUI from './ui/window/confirm.js';
import WindowEventType from './ui/windoweventtype.js';

const Deferred = goog.require('goog.async.Deferred');
const {getDocument} = goog.require('goog.dom');
const TagName = goog.require('goog.dom.TagName');
const googEvents = goog.require('goog.events');
const MouseButton = goog.require('goog.events.BrowserEvent.MouseButton');
const GoogEventType = goog.require('goog.events.EventType');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const log = goog.require('goog.log');
const {IE, GECKO, LINUX} = goog.require('goog.userAgent');
const ViewHint = goog.require('ol.ViewHint');
const MapContainer = goog.require('os.MapContainer');
const MapEvent = goog.require('os.MapEvent');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const {initAuth} = goog.require('os.auth');
const BearingSettings = goog.require('os.bearing.BearingSettings');
const ColumnMappingManager = goog.require('os.column.ColumnMappingManager');
const ClearMapPosition = goog.require('os.command.ClearMapPosition');
const CommandProcessor = goog.require('os.command.CommandProcessor');
const ExclusionQueryClear = goog.require('os.command.ExclusionQueryClear');
const LayerAdd = goog.require('os.command.LayerAdd');
const LayerClear = goog.require('os.command.LayerClear');
const NonQueryClear = goog.require('os.command.NonQueryClear');
const QueryClear = goog.require('os.command.QueryClear');
const SequenceCommand = goog.require('os.command.SequenceCommand');
const AreaSettings = goog.require('os.config.AreaSettings');
const DisplaySettings = goog.require('os.config.DisplaySettings');
const InterpolationSettings = goog.require('os.config.InterpolationSettings');
const LegendSettings = goog.require('os.config.LegendSettings');
const ProjectionSettings = goog.require('os.config.ProjectionSettings');
const ServerSettings = goog.require('os.config.ServerSettings');
const Settings = goog.require('os.config.Settings');
const ThemeSettings = goog.require('os.config.ThemeSettings');
const UnitSettings = goog.require('os.config.UnitSettings');
const {getControls} = goog.require('os.control');
const DataManager = goog.require('os.data.DataManager');
const {registerLegendPlugin} = goog.require('os.data.histo.legend');
const events = goog.require('os.events');
const EventFactory = goog.require('os.events.EventFactory');
const EventType = goog.require('os.events.EventType');
const LayerConfigEventType = goog.require('os.events.LayerConfigEventType');
const {createFromFile, getFileUrl, isFileUrlEnabled} = goog.require('os.file');
const FileManager = goog.require('os.file.FileManager');
const FileSettings = goog.require('os.file.FileSettings');
const FileStorage = goog.require('os.file.FileStorage');
const FileUrlHandler = goog.require('os.file.FileUrlHandler');
const osFileMimeFilter = goog.require('os.file.mime.filter');
const FilePersistence = goog.require('os.file.persist.FilePersistence');
const OSFilterImportUI = goog.require('os.filter.im.OSFilterImportUI');
const FeatureImporter = goog.require('os.im.FeatureImporter');
const ImportProcess = goog.require('os.im.ImportProcess');
const AltMapping = goog.require('os.im.mapping.AltMapping');
const BearingMapping = goog.require('os.im.mapping.BearingMapping');
const LatMapping = goog.require('os.im.mapping.LatMapping');
const LonMapping = goog.require('os.im.mapping.LonMapping');
const MappingManager = goog.require('os.im.mapping.MappingManager');
const OrientationMapping = goog.require('os.im.mapping.OrientationMapping');
const PositionMapping = goog.require('os.im.mapping.PositionMapping');
const RadiusMapping = goog.require('os.im.mapping.RadiusMapping');
const SemiMajorMapping = goog.require('os.im.mapping.SemiMajorMapping');
const SemiMinorMapping = goog.require('os.im.mapping.SemiMinorMapping');
const TimeType = goog.require('os.im.mapping.TimeType');
const WKTMapping = goog.require('os.im.mapping.WKTMapping');
const DateMapping = goog.require('os.im.mapping.time.DateMapping');
const DateTimeMapping = goog.require('os.im.mapping.time.DateTimeMapping');
const TimeMapping = goog.require('os.im.mapping.time.TimeMapping');
const {LayerConfigId} = goog.require('os.layer.config');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const StaticLayerConfig = goog.require('os.layer.config.StaticLayerConfig');
const LayerPresetManager = goog.require('os.layer.preset.LayerPresetManager');
const {setIMapContainer, setMapContainer} = goog.require('os.map.instance');
const {getInteractions} = goog.require('os.map.interaction');
const folder = goog.require('os.menu.folder');
const AddDataMetrics = goog.require('os.metrics.AddDataMetrics');
const FiltersMetrics = goog.require('os.metrics.FiltersMetrics');
const LayersMetrics = goog.require('os.metrics.LayersMetrics');
const MapMetrics = goog.require('os.metrics.MapMetrics');
const Metrics = goog.require('os.metrics.Metrics');
const PlacesMetrics = goog.require('os.metrics.PlacesMetrics');
const ServersMetrics = goog.require('os.metrics.ServersMetrics');
const TimelineMetrics = goog.require('os.metrics.TimelineMetrics');
const {Map: MapKeys} = goog.require('os.metrics.keys');
const PluginManager = goog.require('os.plugin.PluginManager');
const {setAreaFileManager, setAreaImportManager} = goog.require('os.query');
const AreaManager = goog.require('os.query.AreaManager');
const FilterManager = goog.require('os.query.FilterManager');
const QueryManager = goog.require('os.query.QueryManager');
const {setAreaManager, setFilterManager, setQueryManager} = goog.require('os.query.instance');
const SearchManager = goog.require('os.search.SearchManager');
const StateManager = goog.require('os.state.StateManager');
const {setStateManager} = goog.require('os.state.instance');
const {decrementResetTasks, incrementResetTasks} = goog.require('os.storage');
const StyleManager = goog.require('os.style.StyleManager');
const {setStyleManager} = goog.require('os.style.instance');
const {initOffset} = goog.require('os.time');
const UrlManager = goog.require('os.url.UrlManager');


const LayerConfigEvent = goog.requireType('os.events.LayerConfigEvent');
const OSFile = goog.requireType('os.file.File');
const {default: SettingPlugin} = goog.requireType('os.ui.config.SettingPlugin');
const {default: UIEvent} = goog.requireType('os.ui.events.UIEvent');


/**
 * Controller function for the Main directive
 * @unrestricted
 */
export default class Controller extends AbstractMainCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @param {!angular.$timeout} $timeout
   * @param {!angular.$injector} $injector
   * @ngInject
   */
  constructor($scope, $element, $compile, $timeout, $injector) {
    super($scope, $injector, os.ROOT, os.DefaultAppName);

    /**
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(getDocument());

    /**
     * @type {boolean}
     */
    this['timeline'] = false;

    /**
     * @type {boolean}
     */
    this['legend'] = false;

    // prevent all browser context menu events before they bubble back out to the browser
    events.preventBrowserContextMenu();

    // in Linux/Firefox, middle mouse click will paste the clipboard contents into the browser. if the clipboard contains
    // a URL, Firefox will load it. Prevent that from happening, because it's incredibly frustrating.
    if (LINUX && GECKO) {
      googEvents.listen(document, GoogEventType.CLICK, this.preventMiddleMouse_);
    }

    if (IE) { // separate from goog.userAgent.EDGE
      this.suggestOtherBrowser();
    }

    // set up file methods
    // drop the File reference after import
    FileManager.getInstance().registerFileMethod(new ImportMethod(false));

    var im = ImportManager.getInstance();
    im.registerImportDetails('Data filters for supported layers.');
    im.registerImportUI(osFileMimeFilter.TYPE, new OSFilterImportUI());

    // register importers
    im.registerImporter('os', FeatureImporter);

    // set up file storage
    FileStorage.getInstance();

    // load settings for anything that may need them.
    SettingsManager.getInstance();
    this.initializeSettings_();

    // start metrics initialization
    var mm = MetricsManager.getInstance();
    mm.setApplicationNode('OpenSphere', 'This window displays many of the features available in OpenSphere, and if ' +
        'you have used them.');

    // create map instance and listen for it to be initialized
    var map = MapContainer.getInstance();
    map.setInteractionFunction(getInteractions);
    map.setControlFunction(getControls);

    map.listenOnce(MapEvent.MAP_READY, this.onMapReady_, false, this);

    // set the global map container reference
    setIMapContainer(map);
    setMapContainer(map);

    // configure default layer configs
    LayerConfigManager.getInstance().registerLayerConfig(LayerConfigId.STATIC, StaticLayerConfig);

    // configure data manager
    const dataManager = DataManager.getInstance();
    dataManager.setMapContainer(map);
    os.setDataManager(dataManager);

    // configure exports
    exportManager.registerPersistenceMethod(new FilePersistence());

    // set state manager global reference
    var stateManager = StateManager.getInstance();
    setStateManager(stateManager);

    setStyleManager(StyleManager.getInstance());

    // set up clear control
    const clearManager = ClearManager.getInstance();
    clearManager.addEntry(new ClearEntry('exclusionAreas', 'Exclusion Areas',
        ExclusionQueryClear, 'Clear all exclusion query areas'));
    clearManager.addEntry(new ClearEntry('queryEntries', 'Layer/Area/Filter query combinations',
        QueryEntriesClear, 'Clears all layer/area/filter query combinations'));
    clearManager.addEntry(new ClearEntry('layers', 'Layers', LayerClear,
        'Clear all layers except the defaults'));
    clearManager.addEntry(new ClearEntry('mapPosition', 'Map Position', ClearMapPosition,
        'Reset map position to the default'));
    clearManager.addEntry(new ClearEntry('nonQueryFeatures', 'Non-query Features',
        NonQueryClear, 'Clears features in the Drawing Layer except for query features'));
    clearManager.addEntry(new ClearEntry('queryAreas', 'Query Areas', QueryClear,
        'Clear all spatial query areas'));
    clearManager.addEntry(new ClearEntry('states', 'States', StateClear,
        'Deactivate all states'));

    // set up search
    var searchManager = SearchManager.getInstance();
    searchManager.setNoResultClass(NoResult);
    searchManager.registerSearch(new CoordinateSearch());

    // set up mappings and validators
    this.registerMappings_();

    // register drag/drop handlers
    this.registerDragDrop_();

    // set up menus
    drawMenu.setup();
    filterMenu.setup();
    importMenu.setup();
    mapMenu.setup();
    layerMenu.setup();
    listMenu.setup();
    saveMenu.setup();
    spatialMenu.setup();
    unitMenu.setup();
    timelineMenu.setup();
    stateMenu.setup();
    bufferMenu.setup();
    defaultWindowsMenu.setup();
    folder.setup();

    // assign the spatial menu
    osUiDraw.setMenu(spatialMenu.getMenu());

    // register base legend plugins
    registerLegendPlugin();

    // init filter manager
    var filterManager = FilterManager.getInstance();
    setFilterManager(filterManager);

    // init area manager
    var areaManager = AreaManager.getInstance();
    setAreaManager(areaManager);

    // init query manager
    var queryManager = QueryManager.getInstance();
    setQueryManager(queryManager);

    areaImportMenu.setup();

    // initialize the area/filter import/file managers
    const areaImportManager = new ImportManager();
    areaImportManager.registerImportDetails('Area filters for supported layers.');
    areaImportManager.registerImportUI(osFileMimeFilter.TYPE, new OSFilterImportUI());
    setAreaImportManager(areaImportManager);
    setAreaFileManager(new FileManager());

    // initialize the CMM
    ColumnMappingManager.getInstance();

    // initialize the layer preset manager
    LayerPresetManager.getInstance();

    $scope.$on(WindowEventType.CLOSE, this.onWindowClose_.bind(this));
    $scope.$on(WindowEventType.DRAGSTART, this.onWindowDrag_.bind(this));
    $scope.$on(WindowEventType.DRAGSTOP, this.onWindowDrag_.bind(this));

    this.initialize();
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this.removeListeners();

    importMenu.dispose();
    bufferMenu.dispose();
    areaImportMenu.dispose();

    drawMenu.dispose();
    filterMenu.dispose();
    mapMenu.dispose();
    layerMenu.dispose();
    saveMenu.dispose();
    spatialMenu.dispose();
    timelineMenu.dispose();
    unitMenu.dispose();
    stateMenu.dispose();

    this.scope_ = null;
    this.timeout_ = null;
  }

  /**
   * Handle removal of iframes in windows
   *
   * @param {*} e
   * @param {angular.JQLite} element
   * @private
   */
  onWindowClose_(e, element) {
    var iframes = element.find('iframe');

    if (iframes) {
      for (var i = 0, n = iframes.length; i < n; i++) {
        // fire a beforeunload event on the iframe source so it disposes properly
        var event = EventFactory.createEvent(GoogEventType.BEFOREUNLOAD);
        iframes[i].contentWindow.dispatchEvent(event);
      }
    }
  }

  /**
   * @inheritDoc
   */
  initialize() {
    super.initialize();

    // set up time offset
    initOffset();

    // initialize the nav bars
    navbaroptions.init();

    // initialize any authentication settings
    initAuth();

    this.addControlsToHelp_();
    metricsOption.addToNav();
  }

  /**
   * @inheritDoc
   */
  onClose() {
    // close the log window
    os.logWindow.closeLogger();
  }

  /**
   * @inheritDoc
   */
  onLogWindow(event) {
    os.logWindow.setEnabled(true);
  }

  /**
   * @inheritDoc
   */
  registerListeners() {
    dispatcher.getInstance().listen(EventType.RESET, this.onSettingsReset_, false, this);
    dispatcher.getInstance().listen(LayerConfigEventType.CONFIGURE_AND_ADD, this.onLayerConfigEvent_, false, this);
    dispatcher.getInstance().listen(UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);
    dispatcher.getInstance().listen(ImportEventType.FILE, this.onImportEvent_, false, this);
    dispatcher.getInstance().listen(ImportEventType.URL, this.onImportEvent_, false, this);
  }

  /**
   * @inheritDoc
   */
  removeListeners() {
    dispatcher.getInstance().unlisten(EventType.RESET, this.onSettingsReset_, false, this);
    dispatcher.getInstance().unlisten(LayerConfigEventType.CONFIGURE_AND_ADD, this.onLayerConfigEvent_, false, this);
    dispatcher.getInstance().unlisten(UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);
    dispatcher.getInstance().unlisten(ImportEventType.FILE, this.onImportEvent_, false, this);
    dispatcher.getInstance().unlisten(ImportEventType.URL, this.onImportEvent_, false, this);
  }

  /**
   * @inheritDoc
   */
  initXt() {
    // configure and initialize the peer
    os.peer.setId(Controller.peerId);
    os.peer.setTitle(Controller.peerTitle);
    os.peer.addHandler(new FileXTHandler());

    if (Settings.getInstance().get('xtEnabled', true)) {
      os.peer.init();
    }

    localStorage.setItem(Controller.peerPrefix + '.url', location.pathname);
    localStorage.setItem(Controller.peerPrefix + '.xt', os.peer.getId());
  }

  /**
   * @inheritDoc
   */
  addPlugins() {
    super.addPlugins();

    // Only "os" application plugins are added here
    const pluginManager = PluginManager.getInstance();
    pluginManager.addPlugin(new CesiumPlugin());
    pluginManager.addPlugin(FeatureActionPlugin.getInstance());
    pluginManager.addPlugin(new SearchPlugin());
    pluginManager.addPlugin(new AreaPlugin());
    pluginManager.addPlugin(new AreaDataPlugin());
    pluginManager.addPlugin(new AudioPlugin());
    pluginManager.addPlugin(CapturePlugin.getInstance());
    pluginManager.addPlugin(ConfigPlugin.getInstance());
    pluginManager.addPlugin(new OGCPlugin());
    pluginManager.addPlugin(new XYZPlugin());
    pluginManager.addPlugin(new BaseMapPlugin());
    pluginManager.addPlugin(new GooglePlacesPlugin());
    pluginManager.addPlugin(new PeliasGeocoderPlugin());
    pluginManager.addPlugin(new NominatimPlugin());
    pluginManager.addPlugin(new CSVPlugin());
    pluginManager.addPlugin(new GMLPlugin());
    pluginManager.addPlugin(new GeoJSONPlugin());
    pluginManager.addPlugin(new GPXPlugin());
    pluginManager.addPlugin(new KMLPlugin());
    pluginManager.addPlugin(new SHPPlugin());
    pluginManager.addPlugin(new ZIPPlugin());
    pluginManager.addPlugin(new WeatherPlugin());
    pluginManager.addPlugin(new OverviewPlugin());
    pluginManager.addPlugin(new ArcPlugin());
    pluginManager.addPlugin(PlacesPlugin.getInstance());
    pluginManager.addPlugin(PositionPlugin.getInstance());
    pluginManager.addPlugin(VectorToolsPlugin.getInstance());
    pluginManager.addPlugin(HeatmapPlugin.getInstance());
    pluginManager.addPlugin(ParamsPlugin.getInstance());
    pluginManager.addPlugin(SunCalcPlugin.getInstance());
    pluginManager.addPlugin(TrackPlugin.getInstance());
    pluginManager.addPlugin(OpenpagePlugin.getInstance());
    pluginManager.addPlugin(new PersistPlugin());
    pluginManager.addPlugin(VectorTilePlugin.getInstance());
  }

  /**
   * @inheritDoc
   */
  addMetricsPlugins() {
    MetricsManager.getInstance().addMetricsPlugin(new AddDataMetrics());
    MetricsManager.getInstance().addMetricsPlugin(new FiltersMetrics());
    MetricsManager.getInstance().addMetricsPlugin(new LayersMetrics());
    MetricsManager.getInstance().addMetricsPlugin(new MapMetrics());
    MetricsManager.getInstance().addMetricsPlugin(new PlacesMetrics());
    MetricsManager.getInstance().addMetricsPlugin(new ServersMetrics());
    MetricsManager.getInstance().addMetricsPlugin(new TimelineMetrics());
  }

  /**
   * @inheritDoc
   */
  onPluginsLoaded(opt_e) {
    super.onPluginsLoaded(opt_e);

    // load data providers from settings
    var dm = DataManager.getInstance();
    try {
      dm.restoreDescriptors();
      dm.updateFromSettings(Settings.getInstance());
    } catch (e) {
      log.error(Controller.LOGGER_, 'failed restoring descriptors from settings', e);
    }

    // configure and initialize the route manager after datamanager
    var rm = RouteManager.getInstance();
    rm.registerUrlHandler(new FileUrlHandler());
    rm.initialize();

    // add the search results panel
    const searchResults = navbaroptions.getSearchResults();
    if (searchResults) {
      osUiList.add(AbstractMainContent, searchResults, 100);
    }

    // display initial onboarding
    OnboardingManager.getInstance().displayOnboarding(os.ROOT + 'onboarding/intro.json');

    // set up key handlers
    this.keyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);
  }

  /**
   * Handle window drag events, setting the map interacting hint appropriately.
   *
   * @param {angular.Scope.Event} event
   * @private
   */
  onWindowDrag_(event) {
    var map = MapContainer.getInstance().getMap();
    if (map) {
      if (event.name == WindowEventType.DRAGSTART) {
        map.getView().setHint(ViewHint.INTERACTING, 1);
      } else {
        map.getView().setHint(ViewHint.INTERACTING, -1);
      }
    }
  }

  /**
   * Prevents default behavior on middle mouse clicks. This is used to prevent browsers on Linux from loading a URL from
   * the clipboard.
   *
   * @param {goog.events.BrowserEvent} event
   * @private
   */
  preventMiddleMouse_(event) {
    if (event.isButton(MouseButton.MIDDLE)) {
      event.preventDefault();
    }
  }

  /**
   * Setup help menu controls
   *
   * @private
   */
  addControlsToHelp_() {
    var controls = Controls.getInstance();
    var gen = 'General Controls';
    var ctrlOr = os.isOSX() ? KeyCodes.META : KeyCodes.CTRL;

    controls.addControl(gen, 0, 'Save State', [ctrlOr, '+', KeyCodes.S]);
    controls.addControl(gen, 0, 'Undo', [ctrlOr, '+', KeyCodes.Z]);

    var redoKeys = os.isOSX() ? [ctrlOr, '+', KeyCodes.SHIFT, '+', KeyCodes.Z] :
      [ctrlOr, '+', KeyCodes.Y];
    controls.addControl(gen, 0, 'Redo', redoKeys);
  }

  /**
   * Simple usage
   *  var settingPlugin = new SettingPlugin();
   *  settingPlugin.setLabel('App');
   *  settingPlugin.setTags(['This', 'fun', 'whatever']);
   *  settingPlugin.setUI('directiveName');
   *  settingPlugin.setDescription('test model');
   *  SettingsManager.addSettingPlugin(settingPlugin);
   *
   * @private
   */
  initializeSettings_() {
    var sm = SettingsManager.getInstance();

    sm.addSettingPlugin(new ServerSettings());
    sm.addSettingPlugin(new AreaSettings());
    sm.addSettingPlugin(new BearingSettings());
    sm.addSettingPlugin(new DisplaySettings());
    sm.addSettingPlugin(new InterpolationSettings());
    sm.addSettingPlugin(new LegendSettings());
    sm.addSettingPlugin(new ProjectionSettings());
    sm.addSettingPlugin(new UnitSettings());
    sm.addSettingPlugin(new LocationSettings());
    sm.addSettingPlugin(new ColumnMappingSettings());
    sm.addSettingPlugin(new ThemeSettings());
    sm.addSettingPlugin(new FileSettings());
  }

  /**
   * Tasks that should run after the map has been initialized.
   *
   * @param {goog.events.Event} event The loaded event
   * @private
   */
  onMapReady_(event) {
    this.scope.$watch('mainCtrl.timeline', this.resizeMap_.bind(this));
    this.initPlugins();
  }

  /**
   * Waits for Angular to finish doing things then resizes the map.
   *
   * @private
   */
  resizeMap_() {
    MapContainer.getInstance().updateSize();
  }

  /**
   * Return a function that will execute in an angular timeout and whose context will be
   * this MainCtrl.
   *
   * @param {Function} update a function that will update the model
   * @return {function()}
   */
  modelUpdate(update) {
    update = update.bind(this);
    return this.timeout_.bind(this, update);
  }

  /**
   * Execute the given model update immediately.
   *
   * @param {Function} update
   */
  updateModelNow(update) {
    this.modelUpdate(update)();
  }

  /**
   * Handle keyboard events.
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    var target = /** @type {Element} */ (event.target);
    var ctrlOr = os.isOSX() ? event.metaKey : event.ctrlKey;

    if (!document.querySelector(MODAL_SELECTOR)) {
      if (target.tagName !== TagName.INPUT.toString() &&
          target.tagName !== TagName.TEXTAREA.toString()) {
        switch (event.keyCode) {
          case KeyCodes.Z:
            if (ctrlOr) {
              event.preventDefault();
              // macs default to cmd+shift+z for undo
              this.updateModelNow(event.shiftKey ? this.redoCommand : this.undoCommand);
            }
            break;
          case KeyCodes.Y:
            if (ctrlOr) {
              event.preventDefault();
              this.updateModelNow(this.redoCommand);
            }
            break;
          default:
            break;
        }
      }

      // we don't care if we are in a text field/area in for these
      switch (event.keyCode) {
        case KeyCodes.K:
          if (ctrlOr) {
            Metrics.getInstance().updateMetric(MapKeys.SEARCH_KB, 1);
            event.preventDefault();
            $('.search-box .search-query').trigger('focus');
          }
          break;
        case KeyCodes.L:
          if (event.altKey) {
            Metrics.getInstance().updateMetric(MapKeys.OPEN_LAYERS_KB, 1);
            openWindow('layers');
          }
          break;
        case KeyCodes.O:
          if (ctrlOr) {
            Metrics.getInstance().updateMetric(MapKeys.GENERAL_IMPORT_KB, 1);
            event.preventDefault();
            dispatcher.getInstance().dispatchEvent(ImportEventType.FILE);
          }
          break;
        case KeyCodes.S:
          if (ctrlOr) {
            Metrics.getInstance().updateMetric(MapKeys.SAVE_STATE_KB, 1);
            event.preventDefault();
            StateManager.getInstance().startExport();
            apply(this.scope);
          }
          break;
        default:
          break;
      }
    }
  }

  /**
   * Registers mappings with the mapping manager.
   *
   * @private
   */
  registerMappings_() {
    var mm = MappingManager.getInstance();

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
    mm.registerMapping(new BearingMapping());
    mm.registerMapping(new AltMapping());

    // register ellipse mappings
    mm.registerMapping(new RadiusMapping());
    mm.registerMapping(new OrientationMapping());
    mm.registerMapping(new SemiMajorMapping());
    mm.registerMapping(new SemiMinorMapping());
  }

  /**
   * Registers drag/drop handlers with the UrlManager
   *
   * @private
   */
  registerDragDrop_() {
    var um = UrlManager.getInstance();
    um.registerFileHandler(this.handleFileDrop_.bind(this));
    um.registerURLHandler(this.handleURLDrop_.bind(this));
  }

  /**
   * Handle settings reset event.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onSettingsReset_(event) {
    // increment the reset task counter to defer page reload
    incrementResetTasks();

    // clear filter manager
    FilterManager.getInstance().clear();

    // clear/save the area manager
    AreaManager.getInstance().clear();
    AreaManager.getInstance().save();

    // create a new deferred execution sequence
    var reloadDeferred = new Deferred();

    // that waits for file storage to clear
    reloadDeferred.awaitDeferred(FileStorage.getInstance().clear());

    // and column mapping manager to clear
    var cmm = ColumnMappingManager.getInstance();
    cmm.clear();
    reloadDeferred.awaitDeferred(cmm.save());

    // then decrements the reset task counter
    reloadDeferred.addCallbacks(decrementResetTasks, decrementResetTasks).callback();
  }

  /**
   * Handle file/url import events.
   *
   * @param {ImportEvent=} opt_event
   * @private
   */
  onImportEvent_(opt_event) {
    var event = opt_event != null ? opt_event : new ImportEvent(ImportEventType.FILE);
    var process = new ImportProcess();
    process.setEvent(event);
    process.begin();
  }

  /**
   * @param {LayerConfigEvent} event
   * @private
   */
  onLayerConfigEvent_(event) {
    var options = event.options;
    if (options) {
      if (Array.isArray(options)) {
        var cmds = [];
        for (var i = 0, n = options.length; i < n; i++) {
          var option = Object.assign({}, options[i]);
          var add = new LayerAdd(option);
          cmds.push(add);
        }

        var seq = new SequenceCommand();
        seq.setCommands(cmds);
        seq.title = 'Add ' + options.length + (options.length == 1 ? ' layer.' : ' layers.');
        CommandProcessor.getInstance().addCommand(seq);
      } else {
        options = options instanceof Object ? options : Object.assign({}, options);

        var add = new LayerAdd(options);
        add.title = 'Add ' + options['type'] + ' Layer "' + options['title'] + '"';

        if (options['loadOnce']) {
          // allow bypassing the stack for certain layers, primarily static data layers.
          add.execute();
        } else {
          // add the command to the stack
          CommandProcessor.getInstance().addCommand(add);
        }
      }
    }
  }

  /**
   * Toggles a UI component
   *
   * @param {UIEvent} event The event
   * @private
   */
  onToggleUI_(event) {
    if (event.id in this) {
      if (event.value && osWindow.exists(event.id)) {
        // value is true and the window already exists - bring it to the front
        osWindow.bringToFront(event.id);
      } else {
        // Use event value if available.  Keep open if event contains parameters. Lastly just toggle the value.
        var open = typeof event.value === 'boolean' ? event.value :
          (event.params != null ? true : !this[event.id]);
        this[event.id] = open;
        apply(this.scope);
      }
    } else {
      openWindow(event.id);
    }

    if (event.metricKey) {
      Metrics.getInstance().updateMetric(event.metricKey, 1);
    }

    if (event.params) {
      // timeout so Angular will start creating the window, then wait for it to finish initializing everything before
      // calling setParams
      this.timeout_(function() {
        waitForAngular(goog.partial(osWindow.setParams, event.id, event.params));
      });
    }
  }

  /**
   * Handles a file drop by
   *
   * @param {Array.<!File>} files
   * @private
   */
  handleFileDrop_(files) {
    var file = files[0];

    if (file) {
      if (file.path && isFileUrlEnabled()) {
        // running in Electron, so request the file with a file:// URL
        this.handleURLDrop_(getFileUrl(file.path));
      } else {
        var reader = createFromFile(file);
        if (reader) {
          reader.addCallbacks(this.handleResult_, this.handleError_, this);
        }
      }
    }
  }

  /**
   * @param {OSFile} file File.
   * @private
   */
  handleResult_(file) {
    var event = new ImportEvent(ImportEventType.FILE, file);
    dispatcher.getInstance().dispatchEvent(event);
  }

  /**
   * @param {string} errorMsg
   * @private
   */
  handleError_(errorMsg) {
    if (errorMsg && typeof errorMsg === 'string') {
      log.error(Controller.LOGGER_, errorMsg);
      AlertManager.getInstance().sendAlert(errorMsg, AlertEventSeverity.ERROR);
    }
  }

  /**
   * @param {string} url
   * @private
   */
  handleURLDrop_(url) {
    var event = new ImportEvent(ImportEventType.URL, url);
    dispatcher.getInstance().dispatchEvent(event);
  }

  /**
   * Undo the last command.
   *
   * @export
   */
  undoCommand() {
    Metrics.getInstance().updateMetric(MapKeys.UNDO, 1);
    CommandProcessor.getInstance().undo();
  }

  /**
   * Redo the last undone command.
   *
   * @export
   */
  redoCommand() {
    Metrics.getInstance().updateMetric(MapKeys.REDO, 1);
    CommandProcessor.getInstance().redo();
  }

  /**
   * Launch a popup that recommends that the user install a modern browser
   *
   * @protected
   */
  suggestOtherBrowser() {
    if (/** @type {boolean} */(Settings.getInstance().get(['showRedirect'], true))) {
      var link = '<div class="mt-2">Detailed browser support can be found <a href="old.html">here</a>.</div>';
      var ignore = '<div class="form-check"><label class="form-check-label"><input type="checkbox" ' +
      'ng-model="mainCtrl.showRedirectChecked" class="form-check-input">Stop showing this message</label></div>';
      var text = Controller.UNSUPPORTED_BROWSER_TEXT + link + ignore;

      ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
        confirm: this.confirm_.bind(this),
        cancel: Controller.unsupportedBrowserCancelCallback,
        prompt: text,
        yesText: 'Continue',
        noText: '',
        noIcon: '',
        windowOptions: {
          'label': 'Browser Not Supported',
          'icon': 'fa fa-frown-o',
          'x': 'center',
          'y': 'center',
          'width': '400',
          'height': 'auto',
          'modal': 'true',
          'headerClass': 'bg-warning u-bg-warning-text'
        }
      }));
    }
  }

  /**
   * @private
   */
  confirm_() {
    Settings.getInstance().set(['showRedirect'], !this['showRedirectChecked']);
  }
}


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
Controller.LOGGER_ = log.getLogger('os.MainCtrl');


/**
 * @type {string}
 */
Controller.peerId = os.NAMESPACE;


/**
 * @type {string}
 */
Controller.peerTitle = '{APP}';


/**
 * @type {string}
 */
Controller.peerPrefix = os.NAMESPACE;


/**
 * @type {undefined|Function}
 */
Controller.unsupportedBrowserCancelCallback = undefined;


/**
 * @type {string}
 */
Controller.UNSUPPORTED_BROWSER_TEXT = 'Internet Explorer does not offer a satisfactory user experience and is ' +
    'unsupported by {APP}. The application may become unresponsive as a result, and we recommend using ' +
    'Google Chrome. <b>Continue at your own risk.</b>';

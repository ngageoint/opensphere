goog.provide('os.MainCtrl');

goog.require('goog.Uri');
goog.require('goog.async.Deferred');
goog.require('goog.dom');
goog.require('goog.dom.TagName');
goog.require('goog.events.KeyHandler');
goog.require('ol.ViewHint');
goog.require('os.MapContainer');
goog.require('os.MapEvent');
goog.require('os.action.EventType');
goog.require('os.bearing.BearingSettings');
goog.require('os.buffer');
goog.require('os.column.ColumnMappingManager');
goog.require('os.command.ClearMapPosition');
goog.require('os.command.ExclusionQueryClear');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerClear');
goog.require('os.command.NonQueryClear');
goog.require('os.command.QueryClear');
goog.require('os.command.SequenceCommand');
goog.require('os.config');
goog.require('os.config.AreaSettings');
goog.require('os.config.DisplaySettings');
goog.require('os.config.InterpolationSettings');
goog.require('os.config.LegendSettings');
goog.require('os.config.ProjectionSettings');
goog.require('os.config.ServerSettings');
goog.require('os.config.ThemeSettings');
goog.require('os.config.UnitSettings');
goog.require('os.control');
goog.require('os.data.OSDataManager');
goog.require('os.data.histo.legend');
goog.require('os.defines');
goog.require('os.events');
goog.require('os.events.EventFactory');
goog.require('os.events.LayerConfigEvent');
goog.require('os.events.LayerConfigEventType');
goog.require('os.file.FileManager');
goog.require('os.file.FileStorage');
goog.require('os.file.FileUrlHandler');
goog.require('os.file.mime.any');
goog.require('os.file.mime.filter');
goog.require('os.file.persist.FilePersistence');
goog.require('os.filter.im.OSFilterImportUI');
goog.require('os.im.FeatureImporter');
goog.require('os.im.ImportProcess');
goog.require('os.im.mapping');
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
goog.require('os.im.mapping.WKTMapping');
goog.require('os.im.mapping.time.DateMapping');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.im.mapping.time.TimeMapping');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.StaticLayerConfig');
goog.require('os.load.LoadingManager');
goog.require('os.map');
goog.require('os.map.interaction');
goog.require('os.metrics.AddDataMetrics');
goog.require('os.metrics.FiltersMetrics');
goog.require('os.metrics.LayersMetrics');
goog.require('os.metrics.MapMetrics');
goog.require('os.metrics.PlacesMetrics');
goog.require('os.metrics.ServersMetrics');
goog.require('os.metrics.TimelineMetrics');
goog.require('os.plugin.PluginManager');
goog.require('os.query.AreaManager');
goog.require('os.query.FilterManager');
goog.require('os.query.QueryManager');
goog.require('os.query.TemporalQueryManager');
goog.require('os.search.SearchManager');
goog.require('os.state.StateManager');
goog.require('os.storage');
goog.require('os.style.StyleManager');
goog.require('os.time');
goog.require('os.time.TimelineController');
goog.require('os.ui.AbstractMainCtrl');
goog.require('os.ui.alertsDirective');
goog.require('os.ui.areasDirective');
goog.require('os.ui.clear.ClearEntry');
goog.require('os.ui.clearManager');
goog.require('os.ui.column.mapping.ColumnMappingSettings');
goog.require('os.ui.columnactions.ColumnActionEvent');
goog.require('os.ui.columnactions.ColumnActionManager');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.config.SettingsManager');
goog.require('os.ui.draw');
goog.require('os.ui.events.UIEventType');
goog.require('os.ui.exportManager');
goog.require('os.ui.file.AnyTypeImportUI');
goog.require('os.ui.file.FileXTHandler');
goog.require('os.ui.file.method.ImportMethod');
goog.require('os.ui.filtersDirective');
goog.require('os.ui.help.Controls');
goog.require('os.ui.help.metricsOption');
goog.require('os.ui.historyDirective');
goog.require('os.ui.icon.IconSelectorManager');
goog.require('os.ui.im.ImportEvent');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.im.ImportManager');
goog.require('os.ui.menu');
goog.require('os.ui.menu.areaImport');
goog.require('os.ui.menu.buffer');
goog.require('os.ui.menu.draw');
goog.require('os.ui.menu.filter');
goog.require('os.ui.menu.import');
goog.require('os.ui.menu.layer');
goog.require('os.ui.menu.list');
goog.require('os.ui.menu.map');
goog.require('os.ui.menu.save');
goog.require('os.ui.menu.spatial');
goog.require('os.ui.menu.timeline');
goog.require('os.ui.menu.unit');
goog.require('os.ui.menu.windows');
goog.require('os.ui.menu.windows.default');
goog.require('os.ui.navbaroptions');
goog.require('os.ui.ngRightClickDirective');
goog.require('os.ui.query.cmd.QueryEntriesClear');
goog.require('os.ui.route.RouteManager');
goog.require('os.ui.search.NoResult');
goog.require('os.ui.search.place.CoordinateSearch');
goog.require('os.ui.search.searchResultsDirective');
goog.require('os.ui.slick.column');
goog.require('os.ui.state.cmd.StateClear');
goog.require('os.ui.state.menu');
goog.require('os.ui.timelinePanelDirective');
goog.require('os.ui.urlDragDropDirective');
goog.require('os.ui.user.settings.LocationSettings');
goog.require('os.ui.window.ConfirmUI');
goog.require('os.url');
goog.require('plugin.arc.ArcPlugin');
goog.require('plugin.area.AreaPlugin');
goog.require('plugin.areadata.AreaDataPlugin');
goog.require('plugin.audio.AudioPlugin');
goog.require('plugin.basemap.BaseMapPlugin');
goog.require('plugin.capture.CapturePlugin');
goog.require('plugin.cesium.Plugin');
goog.require('plugin.config.Plugin');
goog.require('plugin.descriptor.SearchPlugin');
goog.require('plugin.file.csv.CSVPlugin');
goog.require('plugin.file.geojson.GeoJSONPlugin');
goog.require('plugin.file.gml.GMLPlugin');
goog.require('plugin.file.gpx.GPXPlugin');
goog.require('plugin.file.kml.KMLPlugin');
goog.require('plugin.file.shp.SHPPlugin');
goog.require('plugin.file.zip.ZIPPlugin');
goog.require('plugin.google.places.Plugin');
goog.require('plugin.heatmap.HeatmapPlugin');
goog.require('plugin.im.action.feature.Plugin');
goog.require('plugin.ogc.OGCPlugin');
goog.require('plugin.openpage.Plugin');
goog.require('plugin.osm.nom.NominatimPlugin');
goog.require('plugin.overview.OverviewPlugin');
goog.require('plugin.params.ParamsPlugin');
goog.require('plugin.pelias.geocoder.Plugin');
goog.require('plugin.places.PlacesPlugin');
goog.require('plugin.position.PositionPlugin');
goog.require('plugin.storage.PersistPlugin');
goog.require('plugin.suncalc.Plugin');
goog.require('plugin.track.TrackPlugin');
goog.require('plugin.vectortools.VectorToolsPlugin');
goog.require('plugin.weather.WeatherPlugin');
goog.require('plugin.wmts.Plugin');
goog.require('plugin.xyz.XYZPlugin');



/**
 * Controller function for the Main directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @param {!angular.$timeout} $timeout
 * @param {!angular.$injector} $injector
 * @constructor
 * @ngInject
 * @extends {os.ui.AbstractMainCtrl}
 */
os.MainCtrl = function($scope, $element, $compile, $timeout, $injector) {
  os.MainCtrl.base(this, 'constructor', $scope, $injector, os.ROOT, os.DefaultAppName);

  /**
   * @type {?angular.$timeout}
   * @private
   */
  this.timeout_ = $timeout;

  /**
   * @type {!goog.events.KeyHandler}
   * @private
   */
  this.keyHandler_ = new goog.events.KeyHandler(goog.dom.getDocument());

  /**
   * @type {boolean}
   */
  this['timeline'] = false;

  /**
   * @type {boolean}
   */
  this['legend'] = false;

  // prevent all browser context menu events before they bubble back out to the browser
  os.events.preventBrowserContextMenu();

  // in Linux/Firefox, middle mouse click will paste the clipboard contents into the browser. if the clipboard contains
  // a URL, Firefox will load it. Prevent that from happening, because it's incredibly frustrating.
  if (goog.userAgent.LINUX && goog.userAgent.GECKO) {
    goog.events.listen(document, goog.events.EventType.CLICK, this.preventMiddleMouse_);
  }

  if (goog.userAgent.IE) { // separate from goog.userAgent.EDGE
    this.suggestOtherBrowser();
  }

  // set up file methods
  // drop the File reference after import
  os.file.FileManager.getInstance().registerFileMethod(new os.ui.file.method.ImportMethod(false));

  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('Data filters for supported layers.');
  im.registerImportUI(os.file.mime.filter.TYPE, new os.filter.im.OSFilterImportUI());

  // register importers
  im.registerImporter('os', os.im.FeatureImporter);

  // secure importer against injection attacks
  os.im.FeatureImporter.sanitize = /** @type {angular.$sanitize} */ (os.ui.injector.get('$sanitize'));

  // set up file storage
  os.file.FileStorage.getInstance();

  // load settings for anything that may need them.
  os.config.SettingsManager = os.ui.config.SettingsManager.getInstance();
  this.initializeSettings_();

  // start metrics initialization
  var mm = os.ui.metrics.MetricsManager.getInstance();
  mm.setApplicationNode('OpenSphere', 'This window displays many of the features available in OpenSphere, and if ' +
      'you have used them.');

  // configure default layer configs
  os.layer.config.LayerConfigManager.getInstance().registerLayerConfig(os.layer.config.StaticLayerConfig.ID,
      os.layer.config.StaticLayerConfig);

  // configure data manager
  os.dataManager = os.osDataManager = os.data.OSDataManager.getInstance();

  // configure exports
  os.ui.exportManager.registerPersistenceMethod(new os.file.persist.FilePersistence());

  // set state manager global reference
  os.stateManager = os.state.StateManager.getInstance();

  // set up clear control
  os.ui.clearManager.addEntry(new os.ui.clear.ClearEntry('exclusionAreas', 'Exclusion Areas',
      os.command.ExclusionQueryClear, 'Clear all exclusion query areas'));
  os.ui.clearManager.addEntry(new os.ui.clear.ClearEntry('queryEntries', 'Layer/Area/Filter query combinations',
      os.ui.query.cmd.QueryEntriesClear, 'Clears all layer/area/filter query combinations'));
  os.ui.clearManager.addEntry(new os.ui.clear.ClearEntry('layers', 'Layers', os.command.LayerClear,
      'Clear all layers except the defaults'));
  os.ui.clearManager.addEntry(new os.ui.clear.ClearEntry('mapPosition', 'Map Position', os.command.ClearMapPosition,
      'Reset map position to the default'));
  os.ui.clearManager.addEntry(new os.ui.clear.ClearEntry('nonQueryFeatures', 'Non-query Features',
      os.command.NonQueryClear, 'Clears features in the Drawing Layer except for query features'));
  os.ui.clearManager.addEntry(new os.ui.clear.ClearEntry('queryAreas', 'Query Areas', os.command.QueryClear,
      'Clear all spatial query areas'));
  os.ui.clearManager.addEntry(new os.ui.clear.ClearEntry('states', 'States', os.ui.state.cmd.StateClear,
      'Deactivate all states'));

  // set up search
  var searchManager = os.search.SearchManager.getInstance();
  searchManager.setNoResultClass(os.ui.search.NoResult);
  searchManager.registerSearch(new os.ui.search.place.CoordinateSearch());

  // set up mappings and validators
  this.registerMappings_();

  // register drag/drop handlers
  this.registerDragDrop_();

  // set up menus
  os.ui.menu.draw.setup();
  os.ui.menu.filter.setup();
  os.ui.menu.import.setup();
  os.ui.menu.map.setup();
  os.ui.menu.layer.setup();
  os.ui.menu.list.setup();
  os.ui.menu.save.setup();
  os.ui.menu.spatial.setup();
  os.ui.menu.unit.setup();
  os.ui.menu.timeline.setup();
  os.ui.state.menu.setup();
  os.ui.menu.buffer.setup();
  os.ui.menu.windows.default.setup();

  // assign the spatial menu
  os.ui.draw.MENU = os.ui.menu.SPATIAL;

  // register base legend plugins
  os.data.histo.legend.registerLegendPlugin();

  // create map instance and listen for it to be initialized
  var map = os.MapContainer.getInstance();
  map.setInteractionFunction(os.map.interaction.getInteractions);
  map.setControlFunction(os.control.getControls);

  map.listenOnce(os.MapEvent.MAP_READY, this.onMapReady_, false, this);

  // set the global map container reference
  os.map.mapContainer = os.MapContainer.getInstance();

  // init filter manager
  os.filterManager = os.query.FilterManager.getInstance();
  os.ui.filterManager = os.filterManager;

  // init area manager
  os.areaManager = os.query.AreaManager.getInstance();
  os.ui.areaManager = os.areaManager;

  // init query manager
  os.queryManager = os.query.QueryManager.getInstance();
  os.ui.queryManager = os.queryManager;
  os.ui.menu.areaImport.setup();

  // initialize the area/filter import/file managers
  os.areaImportManager = new os.ui.im.ImportManager();
  os.areaImportManager.registerImportDetails('Area filters for supported layers.');
  os.areaImportManager.registerImportUI(os.file.mime.filter.TYPE, new os.filter.im.OSFilterImportUI());
  os.areaFileManager = new os.file.FileManager();

  // initialize the places import/file managers
  os.placesImportManager = new os.ui.im.ImportManager();
  os.placesImportManager.registerImportUI(os.file.mime.filter.TYPE, new os.filter.im.OSFilterImportUI());
  os.placesFileManager = new os.file.FileManager();

  // initialize the CMM
  os.column.ColumnMappingManager.getInstance();

  // initialize the layer preset manager
  os.layer.preset.LayerPresetManager.getInstance();

  $scope.$on(os.ui.WindowEventType.CLOSE, this.onWindowClose_.bind(this));
  $scope.$on(os.ui.WindowEventType.DRAGSTART, this.onWindowDrag_.bind(this));
  $scope.$on(os.ui.WindowEventType.DRAGSTOP, this.onWindowDrag_.bind(this));

  this.initialize();
};
goog.inherits(os.MainCtrl, os.ui.AbstractMainCtrl);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.MainCtrl.LOGGER_ = goog.log.getLogger('os.MainCtrl');


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.destroy = function() {
  this.removeListeners();

  os.ui.menu.import.dispose();
  os.ui.menu.buffer.dispose();
  os.ui.menu.areaImport.dispose();

  os.ui.menu.draw.dispose();
  os.ui.menu.filter.dispose();
  os.ui.menu.map.dispose();
  os.ui.menu.layer.dispose();
  os.ui.menu.save.dispose();
  os.ui.menu.spatial.dispose();
  os.ui.menu.timeline.dispose();
  os.ui.menu.unit.dispose();
  os.ui.state.menu.dispose();

  this.scope_ = null;
  this.timeout_ = null;
};


/**
 * Handle removal of iframes in windows
 *
 * @param {*} e
 * @param {angular.JQLite} element
 * @private
 */
os.MainCtrl.prototype.onWindowClose_ = function(e, element) {
  var iframes = element.find('iframe');

  if (iframes) {
    for (var i = 0, n = iframes.length; i < n; i++) {
      // fire a beforeunload event on the iframe source so it disposes properly
      var event = os.events.EventFactory.createEvent(goog.events.EventType.BEFOREUNLOAD);
      iframes[i].contentWindow.dispatchEvent(event);
    }
  }
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.initialize = function() {
  os.MainCtrl.base(this, 'initialize');

  // set up time offset
  os.time.initOffset();

  // initialize the nav bars
  os.ui.navbaroptions.init();

  this.addControlsToHelp_();
  os.ui.help.metricsOption.addToNav();
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.onClose = function() {
  // close the log window
  os.logWindow.closeLogger();
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.onLogWindow = function(event) {
  os.logWindow.setEnabled(true);
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.registerListeners = function() {
  os.dispatcher.listen(os.events.EventType.RESET, this.onSettingsReset_, false, this);
  os.dispatcher.listen(os.events.LayerConfigEventType.CONFIGURE_AND_ADD, this.onLayerConfigEvent_, false, this);
  os.dispatcher.listen(os.ui.events.UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);
  os.dispatcher.listen(os.ui.im.ImportEventType.FILE, this.onImportEvent_, false, this);
  os.dispatcher.listen(os.ui.im.ImportEventType.URL, this.onImportEvent_, false, this);
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.removeListeners = function() {
  os.dispatcher.unlisten(os.events.EventType.RESET, this.onSettingsReset_, false, this);
  os.dispatcher.unlisten(os.events.LayerConfigEventType.CONFIGURE_AND_ADD, this.onLayerConfigEvent_, false, this);
  os.dispatcher.unlisten(os.ui.events.UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);
  os.dispatcher.unlisten(os.ui.im.ImportEventType.FILE, this.onImportEvent_, false, this);
  os.dispatcher.unlisten(os.ui.im.ImportEventType.URL, this.onImportEvent_, false, this);
};


/**
 * @type {string}
 */
os.MainCtrl.peerId = os.NAMESPACE;


/**
 * @type {string}
 */
os.MainCtrl.peerTitle = '{APP}';


/**
 * @type {string}
 */
os.MainCtrl.peerPrefix = os.NAMESPACE;


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.initXt = function() {
  // configure and initialize the peer
  os.peer.setId(os.MainCtrl.peerId);
  os.peer.setTitle(os.MainCtrl.peerTitle);
  os.peer.addHandler(new os.ui.file.FileXTHandler());

  if (os.settings.get('xtEnabled', true)) {
    os.peer.init();
  }

  localStorage.setItem(os.MainCtrl.peerPrefix + '.url', location.pathname);
  localStorage.setItem(os.MainCtrl.peerPrefix + '.xt', os.peer.getId());
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.addPlugins = function() {
  os.MainCtrl.base(this, 'addPlugins');

  // Only "os" application plugins are added here
  os.ui.pluginManager.addPlugin(new plugin.cesium.Plugin());
  os.ui.pluginManager.addPlugin(plugin.im.action.feature.Plugin.getInstance());
  os.ui.pluginManager.addPlugin(new plugin.descriptor.SearchPlugin());
  os.ui.pluginManager.addPlugin(new plugin.area.AreaPlugin());
  os.ui.pluginManager.addPlugin(new plugin.areadata.AreaDataPlugin());
  os.ui.pluginManager.addPlugin(new plugin.audio.AudioPlugin());
  os.ui.pluginManager.addPlugin(plugin.capture.CapturePlugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.config.Plugin.getInstance());
  os.ui.pluginManager.addPlugin(new plugin.ogc.OGCPlugin());
  os.ui.pluginManager.addPlugin(new plugin.xyz.XYZPlugin());
  os.ui.pluginManager.addPlugin(new plugin.basemap.BaseMapPlugin());
  os.ui.pluginManager.addPlugin(new plugin.google.places.Plugin());
  os.ui.pluginManager.addPlugin(new plugin.pelias.geocoder.Plugin());
  os.ui.pluginManager.addPlugin(new plugin.osm.nom.NominatimPlugin());
  os.ui.pluginManager.addPlugin(new plugin.file.csv.CSVPlugin());
  os.ui.pluginManager.addPlugin(new plugin.file.gml.GMLPlugin());
  os.ui.pluginManager.addPlugin(new plugin.file.geojson.GeoJSONPlugin());
  os.ui.pluginManager.addPlugin(new plugin.file.gpx.GPXPlugin());
  os.ui.pluginManager.addPlugin(new plugin.file.kml.KMLPlugin());
  os.ui.pluginManager.addPlugin(new plugin.file.shp.SHPPlugin());
  os.ui.pluginManager.addPlugin(new plugin.file.zip.ZIPPlugin());
  os.ui.pluginManager.addPlugin(new plugin.weather.WeatherPlugin());
  os.ui.pluginManager.addPlugin(new plugin.overview.OverviewPlugin());
  os.ui.pluginManager.addPlugin(new plugin.arc.ArcPlugin());
  os.ui.pluginManager.addPlugin(new plugin.wmts.Plugin());
  os.ui.pluginManager.addPlugin(plugin.places.PlacesPlugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.position.PositionPlugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.vectortools.VectorToolsPlugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.heatmap.HeatmapPlugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.params.ParamsPlugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.suncalc.Plugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.track.TrackPlugin.getInstance());
  os.ui.pluginManager.addPlugin(plugin.openpage.Plugin.getInstance());
  os.ui.pluginManager.addPlugin(new plugin.storage.PersistPlugin());
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.addMetricsPlugins = function() {
  os.ui.metricsManager.addMetricsPlugin(new os.metrics.AddDataMetrics());
  os.ui.metricsManager.addMetricsPlugin(new os.metrics.FiltersMetrics());
  os.ui.metricsManager.addMetricsPlugin(new os.metrics.LayersMetrics());
  os.ui.metricsManager.addMetricsPlugin(new os.metrics.MapMetrics());
  os.ui.metricsManager.addMetricsPlugin(new os.metrics.PlacesMetrics());
  os.ui.metricsManager.addMetricsPlugin(new os.metrics.ServersMetrics());
  os.ui.metricsManager.addMetricsPlugin(new os.metrics.TimelineMetrics());
};


/**
 * @inheritDoc
 */
os.MainCtrl.prototype.onPluginsLoaded = function(opt_e) {
  os.MainCtrl.base(this, 'onPluginsLoaded', opt_e);

  // load data providers from settings
  var dm = os.dataManager;
  try {
    dm.restoreDescriptors();
    dm.updateFromSettings(os.settings);
  } catch (e) {
    goog.log.error(os.MainCtrl.LOGGER_, 'failed restoring descriptors from settings', e);
  }

  // configure and initialize the route manager after datamanager
  var rm = os.ui.route.RouteManager.getInstance();
  rm.registerUrlHandler(new os.file.FileUrlHandler());
  rm.initialize();

  // add the search results panel
  if (os.ui.navbaroptions.searchresults) {
    os.ui.list.add(os.ui.AbstractMainContent, os.ui.navbaroptions.searchresults, 100);
  }

  // display initial onboarding
  os.ui.onboarding.OnboardingManager.getInstance().displayOnboarding(os.ROOT + 'onboarding/intro.json');

  // set up key handlers
  this.keyHandler_.listen(goog.events.KeyHandler.EventType.KEY, this.handleKeyEvent_, false, this);
};


/**
 * Handle window drag events, setting the map interacting hint appropriately.
 *
 * @param {angular.Scope.Event} event
 * @private
 */
os.MainCtrl.prototype.onWindowDrag_ = function(event) {
  var map = os.MapContainer.getInstance().getMap();
  if (map) {
    if (event.name == os.ui.WindowEventType.DRAGSTART) {
      map.getView().setHint(ol.ViewHint.INTERACTING, 1);
    } else {
      map.getView().setHint(ol.ViewHint.INTERACTING, -1);
    }
  }
};


/**
 * Prevents default behavior on middle mouse clicks. This is used to prevent browsers on Linux from loading a URL from
 * the clipboard.
 *
 * @param {goog.events.BrowserEvent} event
 * @private
 */
os.MainCtrl.prototype.preventMiddleMouse_ = function(event) {
  if (event.isButton(goog.events.BrowserEvent.MouseButton.MIDDLE)) {
    event.preventDefault();
  }
};


/**
 * Setup help menu controls
 *
 * @private
 */
os.MainCtrl.prototype.addControlsToHelp_ = function() {
  var controls = os.ui.help.Controls.getInstance();
  var gen = 'General Controls';
  var ctrlOr = os.isOSX() ? goog.events.KeyCodes.META : goog.events.KeyCodes.CTRL;

  controls.addControl(gen, 0, 'Save State', [ctrlOr, '+', goog.events.KeyCodes.S]);
  controls.addControl(gen, 0, 'Undo', [ctrlOr, '+', goog.events.KeyCodes.Z]);

  var redoKeys = os.isOSX() ? [ctrlOr, '+', goog.events.KeyCodes.SHIFT, '+', goog.events.KeyCodes.Z] :
    [ctrlOr, '+', goog.events.KeyCodes.Y];
  controls.addControl(gen, 0, 'Redo', redoKeys);
};


/**
 * Simple usage
 *  var settingPlugin = new os.ui.config.SettingPlugin();
 *  settingPlugin.setLabel('App');
 *  settingPlugin.setTags(['This', 'fun', 'whatever']);
 *  settingPlugin.setUI('directiveName');
 *  settingPlugin.setDescription('test model');
 *  os.settingsManager.addSettingPlugin(settingPlugin);
 *
 * @private
 */
os.MainCtrl.prototype.initializeSettings_ = function() {
  var sm = os.ui.config.SettingsManager.getInstance();

  sm.addSettingPlugin(new os.config.ServerSettings());
  sm.addSettingPlugin(new os.config.AreaSettings());
  sm.addSettingPlugin(new os.bearing.BearingSettings());
  sm.addSettingPlugin(new os.config.DisplaySettings());
  sm.addSettingPlugin(new os.config.InterpolationSettings());
  sm.addSettingPlugin(new os.config.LegendSettings());
  sm.addSettingPlugin(new os.config.ProjectionSettings());
  sm.addSettingPlugin(new os.config.UnitSettings());
  sm.addSettingPlugin(new os.ui.user.settings.LocationSettings());
  sm.addSettingPlugin(new os.ui.column.mapping.ColumnMappingSettings());
  sm.addSettingPlugin(new os.config.ThemeSettings());
};


/**
 * Tasks that should run after the map has been initialized.
 *
 * @param {goog.events.Event} event The loaded event
 * @private
 */
os.MainCtrl.prototype.onMapReady_ = function(event) {
  this.scope.$watch('mainCtrl.timeline', this.resizeMap_.bind(this));
  this.initPlugins();
};


/**
 * Waits for Angular to finish doing things then resizes the map.
 *
 * @private
 */
os.MainCtrl.prototype.resizeMap_ = function() {
  os.MapContainer.getInstance().updateSize();
};


/**
 * Return a function that will execute in an angular timeout and whose context will be
 * this MainCtrl.
 *
 * @param {Function} update a function that will update the model
 * @return {function()}
 */
os.MainCtrl.prototype.modelUpdate = function(update) {
  update = update.bind(this);
  return this.timeout_.bind(this, update);
};


/**
 * Execute the given model update immediately.
 *
 * @param {Function} update
 */
os.MainCtrl.prototype.updateModelNow = function(update) {
  this.modelUpdate(update)();
};


/**
 * Handle keyboard events.
 *
 * @param {goog.events.KeyEvent} event
 * @private
 */
os.MainCtrl.prototype.handleKeyEvent_ = function(event) {
  var target = /** @type {Element} */ (event.target);
  var ctrlOr = os.isOSX() ? event.metaKey : event.ctrlKey;

  if (!document.querySelector(os.ui.MODAL_SELECTOR)) {
    if (target.tagName !== goog.dom.TagName.INPUT.toString() &&
        target.tagName !== goog.dom.TagName.TEXTAREA.toString()) {
      switch (event.keyCode) {
        case goog.events.KeyCodes.Z:
          if (ctrlOr) {
            event.preventDefault();
            // macs default to cmd+shift+z for undo
            this.updateModelNow(event.shiftKey ? this.redoCommand : this.undoCommand);
          }
          break;
        case goog.events.KeyCodes.Y:
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
      case goog.events.KeyCodes.K:
        if (ctrlOr) {
          os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.SEARCH_KB, 1);
          event.preventDefault();
          $('.search-box .search-query').focus();
        }
        break;
      case goog.events.KeyCodes.L:
        if (event.altKey) {
          os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.OPEN_LAYERS_KB, 1);
          os.ui.menu.windows.openWindow('layers');
        }
        break;
      case goog.events.KeyCodes.O:
        if (ctrlOr) {
          os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.GENERAL_IMPORT_KB, 1);
          event.preventDefault();
          os.dispatcher.dispatchEvent(os.ui.im.ImportEventType.FILE);
        }
        break;
      case goog.events.KeyCodes.S:
        if (ctrlOr) {
          os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.SAVE_STATE_KB, 1);
          event.preventDefault();
          os.stateManager.startExport();
          os.ui.apply(this.scope);
        }
        break;
      default:
        break;
    }
  }
};


/**
 * Registers mappings with the mapping manager.
 *
 * @private
 */
os.MainCtrl.prototype.registerMappings_ = function() {
  var mm = os.im.mapping.MappingManager.getInstance();

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
  mm.registerMapping(new os.im.mapping.BearingMapping());
  mm.registerMapping(new os.im.mapping.AltMapping());

  // register ellipse mappings
  mm.registerMapping(new os.im.mapping.RadiusMapping());
  mm.registerMapping(new os.im.mapping.OrientationMapping());
  mm.registerMapping(new os.im.mapping.SemiMajorMapping());
  mm.registerMapping(new os.im.mapping.SemiMinorMapping());
};


/**
 * Registers drag/drop handlers with the UrlManager
 *
 * @private
 */
os.MainCtrl.prototype.registerDragDrop_ = function() {
  var um = os.url.UrlManager.getInstance();
  um.registerFileHandler(this.handleFileDrop_.bind(this));
  um.registerURLHandler(this.handleURLDrop_.bind(this));
};


/**
 * Handle settings reset event.
 *
 * @param {goog.events.Event} event
 * @private
 */
os.MainCtrl.prototype.onSettingsReset_ = function(event) {
  // increment the reset task counter to defer page reload
  os.storage.incrementResetTasks();

  // clear filter manager
  os.ui.filterManager.clear();

  // clear/save the area manager
  os.ui.areaManager.clear();
  os.ui.areaManager.save();

  // create a new deferred execution sequence
  var reloadDeferred = new goog.async.Deferred();

  // that waits for file storage to clear
  reloadDeferred.awaitDeferred(os.file.FileStorage.getInstance().clear());

  // and column mapping manager to clear
  var cmm = os.column.ColumnMappingManager.getInstance();
  cmm.clear();
  reloadDeferred.awaitDeferred(cmm.save());

  // then decrements the reset task counter
  reloadDeferred.addCallbacks(os.storage.decrementResetTasks, os.storage.decrementResetTasks).callback();
};


/**
 * Handle file/url import events.
 *
 * @param {os.ui.im.ImportEvent=} opt_event
 * @private
 */
os.MainCtrl.prototype.onImportEvent_ = function(opt_event) {
  var event = opt_event != null ? opt_event : new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE);
  var process = new os.im.ImportProcess();
  process.setEvent(event);
  process.begin();
};


/**
 * @param {os.events.LayerConfigEvent} event
 * @private
 */
os.MainCtrl.prototype.onLayerConfigEvent_ = function(event) {
  var options = event.options;
  if (options) {
    if (goog.isArray(options)) {
      var cmds = [];
      for (var i = 0, n = options.length; i < n; i++) {
        var option = goog.object.clone(options[i]);
        var add = new os.command.LayerAdd(option);
        cmds.push(add);
      }

      var seq = new os.command.SequenceCommand();
      seq.setCommands(cmds);
      seq.title = 'Add ' + options.length + (options.length == 1 ? ' layer.' : ' layers.');
      os.command.CommandProcessor.getInstance().addCommand(seq);
    } else {
      options = options instanceof Object ? options : goog.object.clone(options);

      var add = new os.command.LayerAdd(options);
      add.title = 'Add ' + options['type'] + ' Layer "' + options['title'] + '"';

      if (options['loadOnce']) {
        // allow bypassing the stack for certain layers, primarily static data layers.
        add.execute();
      } else {
        // add the command to the stack
        os.command.CommandProcessor.getInstance().addCommand(add);
      }
    }
  }
};


/**
 * Toggles a UI component
 *
 * @param {os.ui.events.UIEvent} event The event
 * @private
 */
os.MainCtrl.prototype.onToggleUI_ = function(event) {
  if (event.id in this) {
    if (event.value && os.ui.window.exists(event.id)) {
      // value is true and the window already exists - bring it to the front
      os.ui.window.bringToFront(event.id);
    } else {
      // Use event value if available.  Keep open if event contains parameters. Lastly just toggle the value.
      var open = typeof event.value === 'boolean' ? event.value :
        (event.params != null ? true : !this[event.id]);
      this[event.id] = open;
      os.ui.apply(this.scope);
    }
  } else {
    os.ui.menu.windows.openWindow(event.id);
  }

  if (event.metricKey) {
    os.metrics.Metrics.getInstance().updateMetric(event.metricKey, 1);
  }

  if (event.params) {
    // timeout so Angular will start creating the window, then wait for it to finish initializing everything before
    // calling setParams
    this.timeout_(function() {
      os.ui.waitForAngular(goog.partial(os.ui.window.setParams, event.id, event.params));
    });
  }
};


/**
 * Handles a file drop by
 *
 * @param {Array.<!File>} files
 * @private
 */
os.MainCtrl.prototype.handleFileDrop_ = function(files) {
  var file = files[0];

  if (file) {
    if (file.path && os.file.FILE_URL_ENABLED) {
      // running in Electron, so request the file with a file:// URL
      this.handleURLDrop_(os.file.getFileUrl(file.path));
    } else {
      var reader = os.file.createFromFile(file);
      if (reader) {
        reader.addCallbacks(this.handleResult_, this.handleError_, this);
      }
    }
  }
};


/**
 * @param {os.file.File} file File.
 * @private
 */
os.MainCtrl.prototype.handleResult_ = function(file) {
  var event = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.FILE, file);
  os.dispatcher.dispatchEvent(event);
};


/**
 * @param {string} errorMsg
 * @private
 */
os.MainCtrl.prototype.handleError_ = function(errorMsg) {
  if (errorMsg && typeof errorMsg === 'string') {
    goog.log.error(os.MainCtrl.LOGGER_, errorMsg);
    os.alert.AlertManager.getInstance().sendAlert(errorMsg, os.alert.AlertEventSeverity.ERROR);
  }
};


/**
 * @param {string} url
 * @private
 */
os.MainCtrl.prototype.handleURLDrop_ = function(url) {
  var event = new os.ui.im.ImportEvent(os.ui.im.ImportEventType.URL, url);
  os.dispatcher.dispatchEvent(event);
};


/**
 * Undo the last command.
 *
 * @export
 */
os.MainCtrl.prototype.undoCommand = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.UNDO, 1);
  os.command.CommandProcessor.getInstance().undo();
};


/**
 * Redo the last undone command.
 *
 * @export
 */
os.MainCtrl.prototype.redoCommand = function() {
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.REDO, 1);
  os.command.CommandProcessor.getInstance().redo();
};


/**
 * Launch a popup that recommends that the user install a modern browser
 *
 * @protected
 */
os.MainCtrl.prototype.suggestOtherBrowser = function() {
  if (/** @type {boolean} */(os.settings.get(['showRedirect'], true))) {
    var link = '<div class="mt-2">Detailed browser support can be found <a href="old.html">here</a>.</div>';
    var ignore = '<div class="form-check"><label class="form-check-label"><input type="checkbox" ' +
    'ng-model="mainCtrl.showRedirectChecked" class="form-check-input">Stop showing this message</label></div>';
    var text = os.MainCtrl.UNSUPPORTED_BROWSER_TEXT + link + ignore;

    os.ui.window.ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: this.confirm_.bind(this),
      cancel: os.MainCtrl.unsupportedBrowserCancelCallback,
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
        'no-scroll': 'true',
        'headerClass': 'bg-warning u-bg-warning-text'
      }
    }));
  }
};


/**
 * @type {undefined|Function}
 */
os.MainCtrl.unsupportedBrowserCancelCallback = undefined;


/**
 * @type {string}
 */
os.MainCtrl.UNSUPPORTED_BROWSER_TEXT = 'Internet Explorer does not offer a satisfactory user experience and is ' +
    'unsupported by {APP}. The application may become unresponsive as a result, and we recommend using ' +
    'Google Chrome. <b>Continue at your own risk.</b>';


/**
 * @private
 */
os.MainCtrl.prototype.confirm_ = function() {
  os.settings.set(['showRedirect'], !this['showRedirectChecked']);
};

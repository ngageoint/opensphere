goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.layer.LayerType');
goog.require('os.ogc.wfs.FeatureType');
goog.require('os.state.StateManager');
goog.require('os.state.Versions');
goog.require('os.state.XMLStateManager');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.instance');
goog.require('os.test.xsd');
goog.require('os.xml');
goog.require('plugin.basemap');
goog.require('plugin.basemap.v4.BaseMapState');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.ogc.OGCLayerDescriptor');
goog.require('plugin.ogc.wfs.WFSLayerConfig');
goog.require('plugin.ogc.wms.WMSLayerConfig');

describe('plugin.basemap.v4.BaseMapState', function() {
  const StateManager = goog.module.get('os.state.StateManager');
  const StateVersions = goog.module.get('os.state.Versions');
  const {setStateManager} = goog.module.get('os.state.instance');
  const xml = goog.module.get('os.xml');
  const basemap = goog.module.get('plugin.basemap');
  const {default: BaseMapState} = goog.module.get('plugin.basemap.v4.BaseMapState');
  const {default: OGCLayerDescriptor} = goog.module.get('plugin.ogc.OGCLayerDescriptor');
  const {default: WMSLayerConfig} = goog.module.get('plugin.ogc.wms.WMSLayerConfig');

  const {loadStateXsdFiles} = goog.module.get('os.test.xsd');

  var stateManager = null;

  var expectPropertiesInAToBeSameInB = function(a, b, exclusions) {
    for (var aProp in a) {
      if (exclusions && exclusions.indexOf(aProp) != -1) {
        continue;
      }
      if (a.hasOwnProperty(aProp)) {
        var aVal = a[aProp];
        var bVal = b[aProp];

        if (Array.isArray(aVal) && Array.isArray(bVal)) {
          for (var i = 0; i < aVal.length; i++) {
            expect(aVal[i]).toBe(bVal[i]);
          }
          continue;
        }

        if (typeof aVal === 'object' && typeof bVal === 'object') {
          expectPropertiesInAToBeSameInB(aVal, bVal, exclusions);
          continue;
        }

        expect(aVal).toBe(bVal);
      }
    }
  };

  beforeEach(function() {
    stateManager = StateManager.getInstance();
    setStateManager(stateManager);
    stateManager.setVersion(StateVersions.V4);
  });

  it('should exist', function() {
    expect(BaseMapState).not.toBe(undefined);
  });


  it('can serialize basemaps', function() {
    // Many of these options are initialized by a previous state file
    // or by a description discovery process, as I did not want to
    // make a network request, the options were captured for a
    // typical wms/wfs layer state save.
    var defaultOptions = {
      'animate': false,
      'baseType': 'XYZ',
      'description': 'This worldwide street map presents highway-level data for...',
      'id': 'basemap#streetmap',
      'layerType': 'Map Layers',
      'noClear': true,
      'opacity': 1,
      'projection': 'EPSG:4326',
      'provider': 'GVS',
      'proxy': false,
      'tags': [
        'GEOINT'
      ],
      'tileSize': 512,
      'title': 'Street Map',
      'type': 'BaseMap',
      'urls': [
        'https://services.arcgisonline.com/ArcGIS/rest/services/ESRI_StreetMap_World_2D/MapServer/tile/{z}/{y}/{x}'
      ],
      'visible': true,
      'zoomOffset': -1
    };
    var resultSchemas = null;

    // Using jasman's async test, as we need to load the xsd files
    // that are used by xmllint.
    runs(function() {
      loadStateXsdFiles().then(function(result) {
        resultSchemas = result;
      }, function(err) {
        throw err;
      });
    });

    // waiting for the xsd files to load
    waitsFor(function() {
      return (resultSchemas !== null);
    }, 'Wait for XSD(s) to load', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    // Runs the tests.
    runs(function() {
      // This is the main descriptor used for OGC layers,
      // creating an empty one in the hope that any new
      // layer options that may get added will get incorporated
      // and validated.
      var descriptor = new OGCLayerDescriptor();
      descriptor.setWmsEnabled(true);
      descriptor.setWfsEnabled(false);

      var createLayerOptions = {
        url: 'https://web-trunk-c2s.stwan.bits.invalid/ogc/wmsServer',
        params: 'LAYERS=test',
        title: 'test'
      };

      var lc = new WMSLayerConfig();
      var layer = lc.createLayer(createLayerOptions);

      var descriptorOptions = descriptor.getLayerOptions();
      var options = {};
      for (var i = 0; i < descriptorOptions.length; i++) {
        $.extend(options, descriptorOptions[i]);
      }
      $.extend(options, defaultOptions);
      // using the default options, as we are not doing a requet to
      // get all the data and options configured, however, if some new
      // default option is added, good to have that present in case
      // it causes an issue.
      layer.setLayerOptions(defaultOptions);
      var state = new BaseMapState();
      var xmlRootDocument = stateManager.createStateObject(function() {}, 'test state', 'desc', defaultOptions.tags);
      var stateOptions = stateManager.createStateOptions(function() {}, 'test state', 'desc', defaultOptions.tags);
      stateOptions.doc = xmlRootDocument;
      var rootObj = state.createRoot(stateOptions);
      xmlRootDocument.firstElementChild.appendChild(rootObj);
      var result = state.layerToXML(layer, stateOptions);
      rootObj.appendChild(result);
      var seralizedDoc = xml.serialize(stateOptions.doc);
      var xmlLintResult = xmllint.validateXML({
        xml: seralizedDoc,
        schema: resultSchemas
      });
      expect(xmlLintResult.errors).toBe(null);

      // validate the seralized options
      var mapLayersNode = xmlRootDocument.firstElementChild.querySelector('mapLayers');
      var restoredOptions = state.xmlToOptions(mapLayersNode.firstElementChild);
      expect(restoredOptions).toBeDefined();
      // method does a basic value comparision with expect(a?).toBe(b?) for mos1t of the
      // values defined in the orginal default optons.
      expectPropertiesInAToBeSameInB(defaultOptions, restoredOptions,
          ['id', 'type', 'layerType']);

      expect(restoredOptions.type).toBe(basemap.TYPE);
      expect(restoredOptions.layerType).toBe(basemap.LAYER_TYPE);
      expect(restoredOptions.id).toBe('basemap-streetmap');
    });
  });
});

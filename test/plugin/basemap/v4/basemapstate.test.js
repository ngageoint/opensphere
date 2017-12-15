goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.layer.LayerType');
goog.require('os.ogc.wfs.FeatureType');
goog.require('os.state.StateManager');
goog.require('os.state.XMLStateOptions');
goog.require('os.test.xsd');
goog.require('os.ui.state.XMLStateManager');
goog.require('os.xml');
goog.require('plugin.basemap');
goog.require('plugin.basemap.v4.BaseMapState');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.ogc.OGCLayerDescriptor');
goog.require('plugin.ogc.wfs.WFSLayerConfig');



describe('plugin.basemap.v4.BaseMapState', function() {
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
    stateManager = os.state.StateManager.getInstance();
    stateManager.setVersion('v4');
  });

  it('should exist', function() {
    expect(plugin.basemap.v4.BaseMapState).not.toBe(undefined);
  });


  it('can seralize basemap', function() {
    // Many of these options are initalized by a previous state file
    // or by a description descovery process, as I did not want to
    // make a network reqeust, the options were captured for a
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
        'https://maps.gvs.nga.ic.gov/arcgis/rest/services/Basemap/World_StreetMap_2D/MapServer/tile/{z}/{y}/{x}'
      ],
      'visible': true,
      'zoomOffset': -1
    };
    var resultSchemas = null;

    // Using jasman's async test, as we need to load the xsd files
    // that are used by xmllint.
    runs(function() {
      os.test.xsd.loadStateXsdFiles().then(function(result) {
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
      var descriptor = new plugin.ogc.OGCLayerDescriptor();
      descriptor.setWmsEnabled(true);
      descriptor.setWfsEnabled(false);

      var createLayerOptions = {
        url: 'https://web-trunk-c2s.stwan.bits.invalid/ogc/wmsServer',
        params: 'LAYERS=test',
        title: 'test'
      };

      var lc = new plugin.ogc.wms.WMSLayerConfig();
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
      var state = new plugin.basemap.v4.BaseMapState();
      var xmlRootDocument = stateManager.createStateObject(function() {}, 'test state', 'desc', defaultOptions.tags);
      var stateOptions = stateManager.createStateOptions(function() {}, 'test state', 'desc', defaultOptions.tags);
      stateOptions.doc = xmlRootDocument;
      var rootObj = state.createRoot(stateOptions);
      xmlRootDocument.firstElementChild.appendChild(rootObj);
      var result = state.layerToXML(layer, stateOptions);
      rootObj.appendChild(result);
      var seralizedDoc = os.xml.serialize(stateOptions.doc);
      var xmlLintResult = xmllint.validateXML({
        xml: seralizedDoc,
        schema: resultSchemas
      });
      expect(xmlLintResult.errors).toBe(null);

      // validate the seralized options
      var mapLayersNode = xmlRootDocument.firstElementChild.querySelector('mapLayers');
      var restoredOptions = state.xmlToOptions(mapLayersNode.firstElementChild);
      expect(restoredOptions).toBeDefined();
      // method does a basic value comparision with expect(a?).toBe(b?) for most of the
      // values defined in the orginal default optons.
      expectPropertiesInAToBeSameInB(defaultOptions, restoredOptions,
          ['id', 'type', 'layerType']);

      expect(restoredOptions.type).toBe(plugin.basemap.TYPE);
      expect(restoredOptions.layerType).toBe(plugin.basemap.LAYER_TYPE);
      expect(restoredOptions.id).toBe('basemap-streetmap');
    });
  });
});

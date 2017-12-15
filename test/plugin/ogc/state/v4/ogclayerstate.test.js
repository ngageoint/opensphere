goog.require('os.layer.Vector');
goog.require('os.ogc.wfs.FeatureType');
goog.require('os.state.StateManager');
goog.require('os.state.XMLStateOptions');
goog.require('os.state.v4.LayerState');
goog.require('os.test.xsd');
goog.require('os.ui.state.XMLStateManager');
goog.require('os.xml');
goog.require('plugin.arc.layer.ArcFeatureLayerConfig');
goog.require('plugin.arc.layer.ArcLayerDescriptor');
goog.require('plugin.file.kml.KMLField');
goog.require('plugin.ogc.OGCLayerDescriptor');
goog.require('plugin.ogc.wfs.WFSLayerConfig');



describe('OGC.v4.ArcLayerState', function() {
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
    expect(os.state.v4.LayerState).not.toBe(undefined);
  });

  it('OGC state validates against the state.xsd', function() {
    // Many of these options are initalized by a previous state file
    // or by a description descovery process, as I did not want to
    // make a network reqeust, the options were captured for a
    // typical wms/wfs layer state save.
    var defaultOptions = {
      'animate': true,
      'baseColor': '0x00FF00',
      'color': '0x00FF00',
      'colorControl': 'colorControl:pickerReset',
      'exclusions': true,
      'featureType': {
        'altitudeColumnName_': 'ALTITUDE',
        'columns_': [
          {
            'name': 'ADVISORY_INDIC',
            'type': 'string'
          },
          {
            'name': 'AEN_1',
            'type': 'string'
          },
          {
            'name': 'AEN_2',
            'type': 'string'
          }
        ],
        'endDateColumnName_': null,
        'geometryColumnName_': 'GEOM',
        'isDynamic_': true,
        'startDateColumnName_': null,
        'typeName_': 'SOME_LAYER_A'
      },
      'filter': true,
      'formats': [
        'text/xml; subtype=gml/3.1.1',
        'application/atom+xml',
        'avro/binary',
        'avro/binary;null',
        'avro/binary;deflate',
        'avro/binary;snappy',
        'text/csv',
        'application/rss+xml',
        'GML2',
        'text/xml; subtype=gml/2.1.2',
        'text/html',
        'application/x-java-serialized-object',
        'application/x-java-serialized-object-2',
        'application/x-custom-json',
        'application/json',
        'application/vnd.google-earth.kml+xml',
        'application/vnd.google-earth.kmz',
        'application/vnd.google-earth.kmz; subtype=sans_images',
        'application/zip; subtype=embedded_internals',
        'application/zip; subtype=shape',
        'application/x-java-serialized-object; subtype=stream'
      ],
      'id': 'default#SOME_LAYER_A#features',
      'layerType': 'Tile and Feature Groups',
      'load': true,
      'params': {
        'count_': 7,
        'encodedQuery_': null,
        'ignoreCase_': true,
        'keyMap_': {
          'count_': 7,
          'keys_': [
            'service',
            'version',
            'request',
            'srsname',
            'outputformat',
            'typename',
            'namespace'
          ],
          'map_': {
            'namespace': [
              'xmlns:fade=\'http://www.bit-sys.com/fade\''
            ],
            'outputformat': [
              'application/json'
            ],
            'request': [
              'GetFeature'
            ],
            'service': [
              'WFS'
            ],
            'srsname': [
              'EPSG:4326'
            ],
            'typename': [
              'fade:SOME_LAYER_A'
            ],
            'version': [
              '1.1.0'
            ]
          },
          'version_': 7
        }
      },
      'provider': 'OGC Server',
      'spatial': true,
      'tags': [
        'someTag',
        'abc',
        'Color:Red',
        'Color:Blue',
        'OGC Server',
        'ABC'
      ],
      'temporal': true,
      'title': 'SOME LAYER A',
      'type': 'WFS',
      'url': 'https://web-trunk-c2s.stwan.bits.invalid/ogc/wfsServer',
      'usePost': true,
      'crossOrigin': 'none',
      'extent': [121.646547, 12.46546547, 136.45654647, 49.6465477]
    };
    var resultSchemas = null;

    // These options are objects at runtime, converting them back.
    defaultOptions.params = goog.Uri.QueryData.createFromMap(defaultOptions.params.keyMap_.map_);
    defaultOptions.featureType = new os.ogc.wfs.FeatureType(defaultOptions.featureType,
        defaultOptions.featureType.columns_, defaultOptions.featureType.isDynamic_);

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
      descriptor.setWfsEnabled(true);

      var createLayerOptions = {
        url: 'https://web-trunk-c2s.stwan.bits.invalid/ogc/wfsServer',
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
      layer.setLayerOptions(options);
      var layerState = new os.state.v4.LayerState();
      var xmlRootDocument = stateManager.createStateObject(function() {}, 'test state', 'desc', defaultOptions.tags);
      var stateOptions = stateManager.createStateOptions(function() {}, 'test state', 'desc', defaultOptions.tags);
      stateOptions.doc = xmlRootDocument;
      var rootObj = layerState.createRoot(stateOptions);
      xmlRootDocument.firstElementChild.appendChild(rootObj);
      var result = layerState.layerToXML(layer, stateOptions);
      rootObj.appendChild(result);
      var seralizedDoc = os.xml.serialize(stateOptions.doc);
      var xmlLintResult = xmllint.validateXML({
        xml: seralizedDoc,
        schema: resultSchemas
      });
      expect(xmlLintResult.errors).toBe(null);

      // validate the seralized options
      var mapLayersNode = xmlRootDocument.firstElementChild.querySelector('dataLayers');
      var restoredOptions = layerState.xmlToOptions(mapLayersNode.firstElementChild);
      expect(restoredOptions).toBeDefined();
      // method does a basic value comparision with expect(a?).toBe(b?) for most of the
      // values defined in the orginal default optons.
      expectPropertiesInAToBeSameInB(defaultOptions, restoredOptions,
          ['id', 'color', 'baseColor', 'params', 'map_', 'featureType']);
    });
  });
});

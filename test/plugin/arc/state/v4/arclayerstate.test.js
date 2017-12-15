goog.require('goog.dom');
goog.require('goog.dom.xml');
goog.require('goog.string');
goog.require('os.layer.LayerType');
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


describe('OMAR.v4.ArcLayerState', function() {
  var discriptorConfig = {
    'advancedQueryCapabilities': {
      'supportsDistinct': true,
      'supportsOrderBy': true,
      'supportsPagination': true,
      'supportsQueryWithDistance': true,
      'supportsReturningQueryExtent': true,
      'supportsStatistics': true,
      'supportsTrueCurve': true,
      'useStandardizedQueries': true
    },
    'canModifyLayer': false,
    'canScaleSymbols': false,
    'capabilities': 'Map,Query,Data',
    'copyrightText': '',
    'currentVersion': 10.31,
    'dateFieldsTimeReference': null,
    'defaultVisibility': true,
    'description': '',
    'displayField': 'SORT_NAME_RO',
    'drawingInfo': {
      'labelingInfo': [
        {
          'labelExpression': '[SORT_NAME_RO]',
          'labelPlacement': 'esriServerPointLabelPlacementBelowLeft',
          'maxScale': 0,
          'minScale': 3000000,
          'symbol': {
            'angle': 0,
            'backgroundColor': null,
            'borderLineColor': null,
            'borderLineSize': null,
            'color': [
              0,
              92,
              230,
              255
            ],
            'font': {
              'decoration': 'none',
              'family': 'Arial',
              'size': 10,
              'style': 'normal',
              'weight': 'normal'
            },
            'haloColor': null,
            'haloSize': null,
            'horizontalAlignment': 'left',
            'kerning': true,
            'rightToLeft': false,
            'type': 'esriTS',
            'verticalAlignment': 'top',
            'xoffset': 0,
            'yoffset': 0
          },
          'useCodedValues': true,
          'where': null
        }
      ],
      'renderer': {
        'description': '',
        'label': '',
        'symbol': {
          'angle': 0,
          'contentType': 'image/png',
          'height': 9,
          'imageData': 'iVBORw0KGgoAAA..==',
          'type': 'esriPMS',
          'url': '6768fb5e86381701af765ebb17b79b4b',
          'width': 9,
          'xoffset': 0,
          'yoffset': 0
        },
        'type': 'simple'
      },
      'transparency': 0
    },
    'extent': {
      'spatialReference': {
        'latestWkid': 4326,
        'wkid': 4326
      },
      'xmax': 180,
      'xmin': -179.9833329999999,
      'ymax': 86.21666700000003,
      'ymin': -54.93333299999995
    },
    'fields': [
      {
        'alias': 'OBJECTID',
        'domain': null,
        'name': 'OBJECTID',
        'type': 'esriFieldTypeOID'
      },
      {
        'alias': 'Shape',
        'domain': null,
        'name': 'Shape',
        'type': 'esriFieldTypeGeometry'
      },
      {
        'alias': 'RC',
        'domain': null,
        'name': 'RC',
        'type': 'esriFieldTypeInteger'
      },
      {
        'alias': 'UFI',
        'domain': null,
        'name': 'UFI',
        'type': 'esriFieldTypeInteger'
      },
      {
        'alias': 'UNI',
        'domain': null,
        'name': 'UNI',
        'type': 'esriFieldTypeInteger'
      },
      {
        'alias': 'LAT',
        'domain': null,
        'name': 'LAT',
        'type': 'esriFieldTypeDouble'
      },
      {
        'alias': 'LONG_',
        'domain': null,
        'name': 'LONG_',
        'type': 'esriFieldTypeDouble'
      },
      {
        'alias': 'DMS_LAT',
        'domain': null,
        'name': 'DMS_LAT',
        'type': 'esriFieldTypeInteger'
      },
      {
        'alias': 'DMS_LONG',
        'domain': null,
        'name': 'DMS_LONG',
        'type': 'esriFieldTypeInteger'
      },
      {
        'alias': 'MGRS',
        'domain': null,
        'length': 255,
        'name': 'MGRS',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'JOG',
        'domain': null,
        'length': 255,
        'name': 'JOG',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'FC',
        'domain': null,
        'length': 255,
        'name': 'FC',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'DSG',
        'domain': null,
        'length': 255,
        'name': 'DSG',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'PC',
        'domain': null,
        'length': 255,
        'name': 'PC',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'CC1',
        'domain': null,
        'length': 255,
        'name': 'CC1',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'ADM1',
        'domain': null,
        'name': 'ADM1',
        'type': 'esriFieldTypeInteger'
      },
      {
        'alias': 'POP',
        'domain': null,
        'length': 255,
        'name': 'POP',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'ELEV',
        'domain': null,
        'length': 255,
        'name': 'ELEV',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'CC2',
        'domain': null,
        'length': 255,
        'name': 'CC2',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'NT',
        'domain': null,
        'length': 255,
        'name': 'NT',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'LC',
        'domain': null,
        'length': 255,
        'name': 'LC',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'SHORT_FORM',
        'domain': null,
        'length': 255,
        'name': 'SHORT_FORM',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'GENERIC',
        'domain': null,
        'length': 255,
        'name': 'GENERIC',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'SORT_NAME_RO',
        'domain': null,
        'length': 255,
        'name': 'SORT_NAME_RO',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'FULL_NAME_RO',
        'domain': null,
        'length': 255,
        'name': 'FULL_NAME_RO',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'FULL_NAME_ND_RO',
        'domain': null,
        'length': 255,
        'name': 'FULL_NAME_ND_RO',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'SORT_NAME_RG',
        'domain': null,
        'length': 255,
        'name': 'SORT_NAME_RG',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'FULL_NAME_RG',
        'domain': null,
        'length': 255,
        'name': 'FULL_NAME_RG',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'FULL_NAME_ND_RG',
        'domain': null,
        'length': 255,
        'name': 'FULL_NAME_ND_RG',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'NOTE',
        'domain': null,
        'length': 255,
        'name': 'NOTE',
        'type': 'esriFieldTypeString'
      },
      {
        'alias': 'MODIFY_DATE',
        'domain': null,
        'length': 8,
        'name': 'MODIFY_DATE',
        'type': 'esriFieldTypeDate'
      }
    ],
    'geometryType': 'esriGeometryPoint',
    'hasAttachments': false,
    'hasLabels': true,
    'htmlPopupType': 'esriServerHTMLPopupTypeAsHTMLText',
    'id': 0,
    'maxRecordCount': 1000,
    'maxScale': 0,
    'minScale': 3000000,
    'name': 'cities',
    'ownershipBasedAccessControlForFeatures': {
      'allowOthersToQuery': true
    },
    'parentLayer': null,
    'relationships': [],
    'subLayers': [],
    'supportedQueryFormats': 'JSON, AMF',
    'supportsAdvancedQueries': true,
    'supportsStatistics': true,
    'type': 'Feature Layer',
    'typeIdField': null,
    'useStandardizedQueries': true
  };


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


  it('Arc state validates against the state.xsd', function() {
    var defaultOptions = {
      'color': 'rgba(255,255,255,1)',
      'baseColor': '0xFFFFFF',
      'provider': 'ArcGIS Server'
    };
    var resultSchemas = null;

    // defaultOptions.params = goog.Uri.QueryData.createFromMap(defaultOptions.params.keyMap_.map_);

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
      var descriptor = new plugin.arc.layer.ArcLayerDescriptor();
      descriptor.configureDescriptor(discriptorConfig,
          '1678611117#https://services.gvs.nga.ic.gov/arcgis/rest/services/GEONAMES|0',
          'https://services.gvs.nga.ic.gov/arcgis/rest/services/GEONAMES/MapServer');
      var descriptorOptions = descriptor.getLayerOptions();
      var options = {};
      for (var i = 0; i < descriptorOptions.length; i++) {
        $.extend(options, descriptorOptions[i]);
      }
      $.extend(options, defaultOptions);
      var config = new plugin.arc.layer.ArcFeatureLayerConfig();
      var layer = config.createLayer(options);
      // var layer = new os.layer.Vector();
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
      expectPropertiesInAToBeSameInB(options, restoredOptions,
          ['extent', 'providedBy', 'tags', 'params', 'featureType', 'type']);

      expect(restoredOptions.type).toBe(options.type.toUpperCase());
    });
  });
});

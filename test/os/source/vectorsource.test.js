goog.require('goog.array');
goog.require('goog.events.EventType');
goog.require('goog.functions');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('os.Fields');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.DataManager');
goog.require('os.data.RecordField');
goog.require('os.data.filter.OddFilter');
goog.require('os.events.EventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.events.SelectionType');
goog.require('os.feature.DynamicFeature');
goog.require('os.feature.DynamicPropertyChange');
goog.require('os.im.Importer');
goog.require('os.layer.MockLayer');
goog.require('os.map.instance');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('os.style.StyleField');
goog.require('os.style.StyleManager');
goog.require('os.time.TimeRange');
goog.require('os.ui.formatter.DescriptionFormatter');
goog.require('os.ui.formatter.PropertiesFormatter');
goog.require('plugin.file.geojson.GeoJSONParser');

import {listen, unlistenByKey} from 'ol/src/events.js';
import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

describe('os.source.Vector', function() {
  const googArray = goog.module.get('goog.array');
  const GoogEventType = goog.module.get('goog.events.EventType');
  const functions = goog.module.get('goog.functions');
  const googNetEventType = goog.module.get('goog.net.EventType');
  const XhrIo = goog.module.get('goog.net.XhrIo');
  const googObject = goog.module.get('goog.object');
  const {default: Fields} = goog.module.get('os.Fields');
  const {default: ColumnDefinition} = goog.module.get('os.data.ColumnDefinition');
  const {default: DataManager} = goog.module.get('os.data.DataManager');
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const {default: EventType} = goog.module.get('os.events.EventType');
  const {default: PropertyChangeEvent} = goog.module.get('os.events.PropertyChangeEvent');
  const {default: SelectionType} = goog.module.get('os.events.SelectionType');
  const {default: DynamicFeature} = goog.module.get('os.feature.DynamicFeature');
  const {default: DynamicPropertyChange} = goog.module.get('os.feature.DynamicPropertyChange');
  const {default: Importer} = goog.module.get('os.im.Importer');
  const MockLayer = goog.module.get('os.layer.MockLayer');
  const {getMapContainer, setMapContainer} = goog.module.get('os.map.instance');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {default: StyleField} = goog.module.get('os.style.StyleField');
  const {default: StyleManager} = goog.module.get('os.style.StyleManager');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');
  const {default: DescriptionFormatter} = goog.module.get('os.ui.formatter.DescriptionFormatter');
  const {default: PropertiesFormatter} = goog.module.get('os.ui.formatter.PropertiesFormatter');
  const {default: GeoJSONParser} = goog.module.get('plugin.file.geojson.GeoJSONParser');

  var dynamicFeatures = null;
  var features = null;
  var source;

  var displayStart = Date.now();
  var displayEnd = displayStart + 5000;
  var displayRange = new TimeRange(displayStart, displayEnd);

  var waitForTestObject = function() {
    if (!source) {
      source = new VectorSource(undefined);
      source.setDisplayRange(displayRange, false);
    }

    // make sure the timeline controller doesn't change our expected range
    spyOn(source.tlc, 'getLastEvent').andReturn({
      getRange: functions.constant(displayRange)
    });

    if (features) {
      return;
    }

    var i = new Importer(new GeoJSONParser());
    i.listenOnce(EventType.COMPLETE, function() {
      features = i.getData();
    });

    var xhr = new XhrIo();
    var response = null;

    xhr.listen(googNetEventType.SUCCESS, function() {
      response = xhr.getResponseJson();
    }, false);

    runs(function() {
      xhr.send('/base/test/plugin/file/geojson/10k.json');
    });

    waitsFor(function() {
      return response != null;
    }, 'test data to load', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);

    runs(function() {
      i.startImport(response);
    });

    waitsFor(function() {
      return features != null;
    }, 'importer to finish', 2 * jasmine.DEFAULT_TIMEOUT_INTERVAL);
  };

  var initDynamicFeatures = function() {
    if (!dynamicFeatures) {
      dynamicFeatures = [];

      for (var i = 0; i < 5; i++) {
        var df = new DynamicFeature(new Point([0, 0]));
        df.setId('df' + i);
        dynamicFeatures.push(df);
      }
    }
  };

  var addDynamicSpies = function() {
    dynamicFeatures.forEach(function(df) {
      spyOn(df, 'initDynamic').andCallThrough();
      spyOn(df, 'disposeDynamic').andCallThrough();
      spyOn(df, 'updateDynamic').andCallThrough();
    });
  };

  var originalMapContainer;

  var fakeMapContainer = function() {
    // Save a reference to the current map container instance.
    originalMapContainer = getMapContainer();

    // Create a fake layer object to mock functions used by vector source.
    var layer = new MockLayer();

    // Create a fake map container to return our fake layer.
    var mapContainer = {
      getLayer: functions.constant(layer),
      getMap: functions.NULL,
      is3DEnabled: functions.FALSE,
      is3DSupported: functions.FALSE
    };

    // Replace the map container instance with the fake.
    setMapContainer(mapContainer);
  };

  // After each test, restore the global map container instance.
  var restoreMapContainer = function() {
    if (originalMapContainer) {
      setMapContainer(originalMapContainer);
      originalMapContainer = undefined;
    }
  };
  afterEach(restoreMapContainer);

  beforeEach(waitForTestObject);

  it('should add features to the source', function() {
    expect(features).not.toBeNull();
    expect(features.length).toBe(10000);
    expect(source.columns.length).toBe(0);

    source.addFeatures(features);

    waitsFor(function() {
      return source.columns.length > 0;
    }, 'process timer to fire');

    runs(function() {
      expect(source.getFeatures().length).toBe(10000);
      expect(source.getFeatureCount()).toBe(10000);

      // ID, LAT, LON, LAT_DMS, LON_DMS, LAT_DDM, LON_DDM, MGRS, UP_DATE_TIME, DOWN_DATE_TIME
      expect(source.columns.length).toBe(10);
    });
  });

  it('should ensure added features have a feature id', function() {
    var feature = new Feature(new Point([0, 0]));
    expect(feature.getId()).toBeUndefined();

    source.addFeature(feature);
    expect(feature.getId()).toBeDefined();
    expect(feature === source.getFeaturesById(feature.getId())[0]).toBe(true);

    source.removeFeature(feature);
    source.unprocessNow();
  });

  it('should remove features from the source', () => {
    const feature = new Feature(new Point([0, 0]));
    const sources = [
      new VectorSource(undefined),
      new VectorSource({
        useSpatialIndex: false
      })];

    sources.forEach((source) => {
      source.addFeature(feature);
      source.processNow();
      source.removeFeature(feature);
      source.unprocessNow();
      expect(source.getFeatures().length).toBe(0);
      expect(source.getFeatureById(feature.getId())).toBe(null);
    });
  });

  it('should not error on attempting multiple removes of a feature', () => {
    const feature = new Feature(new Point([0, 0]));
    const source = new VectorSource(undefined);
    source.addFeature(feature);
    source.processNow();

    const remove1 = () => {
      source.removeFeature(feature);
      source.unprocessNow();
      source.removeFeature(feature);
      source.unprocessNow();
    };

    const remove2 = () => {
      source.removeFeature(feature);
      source.removeFeature(feature);
      source.unprocessNow();
    };

    expect(remove1).not.toThrow();
    expect(remove2).not.toThrow();
  });

  it('should select a single feature in the source', function() {
    var feature = features[0];
    expect(source.select(feature)).toBe(true);
    expect(source.select(feature)).toBe(false);
    expect(source.selected_.length).toBe(1);
    expect(source.selected_[0]).toBe(feature);
    expect(source.selectedById_[feature['id']]).toBe(true);
  });

  it('should deselect a single feature in the source', function() {
    var feature = features[0];
    expect(source.deselect(feature)).toBe(true);
    expect(source.deselect(feature)).toBe(false);
    expect(source.selectedById_[feature['id']]).toBeUndefined();
  });

  it('should not select/deselect features that are not in the source', function() {
    var newFeature = new Feature();
    newFeature.setId('im-not-in-the-source');

    expect(source.select(newFeature)).toBe(false);
    expect(source.selected_.length).toBe(0);
    expect(googObject.getKeys(source.selectedById_).length).toBe(0);

    expect(source.deselect(newFeature)).toBe(false);
  });

  it('should add features to the selection', function() {
    var count = 0;
    var addedItems = null;
    var onPropertyChange = function(event) {
      if (event.getProperty() == SelectionType.ADDED) {
        addedItems = event.getNewValue();
        count++;
      }
    };
    const listenKey = listen(source, GoogEventType.PROPERTYCHANGE, onPropertyChange, this);

    var singleFeature = features[0];
    var multiFeature = features.slice(0, 10);
    var featById = features.slice(0, 12).map(function(feat) {
      return feat.getId();
    });

    source.addToSelected(singleFeature);

    waitsFor(function() {
      return count == 1 && addedItems != null;
    }, 'feature to be selected');

    runs(function() {
      expect(source.selected_.length).toBe(1);
      expect(source.selected_[0]).toBe(singleFeature);
      expect(googObject.getKeys(source.selectedById_).length).toBe(1);
      expect(source.selectedById_[singleFeature['id']]).toBe(true);
      expect(addedItems).not.toBeNull();
      expect(addedItems.length).toBe(1);
      expect(addedItems[0]).toBe(singleFeature);

      addedItems = null;
      source.addToSelected(multiFeature);
    });

    waitsFor(function() {
      return count == 2 && addedItems != null;
    }, 'features to be selected');

    runs(function() {
      expect(source.selected_.length).toBe(10);
      expect(googObject.getKeys(source.selectedById_).length).toBe(10);
      expect(addedItems).not.toBeNull();
      expect(addedItems.length).toBe(9);
      expect(addedItems).not.toContain(singleFeature);

      addedItems = null;
      source.selectById(featById);
    });

    waitsFor(function() {
      return count == 3 && addedItems != null;
    }, 'features to be selected');

    runs(function() {
      expect(source.selected_.length).toBe(12);
      expect(googObject.getKeys(source.selectedById_).length).toBe(12);
      expect(addedItems).not.toBeNull();
      expect(addedItems.length).toBe(2);
      expect(addedItems).not.toContain(singleFeature);
      expect(addedItems).not.toContain(multiFeature[0]);

      addedItems = null;
      unlistenByKey(listenKey);
    });
  });

  it('should remove features from the selection', function() {
    var count = 0;
    var removedItems = null;
    var onPropertyChange = function(event) {
      if (event.getProperty() == SelectionType.REMOVED) {
        removedItems = event.getNewValue();
        count++;
      }
    };
    const listenKey = listen(source, GoogEventType.PROPERTYCHANGE, onPropertyChange, this);

    var singleFeature = features[0];
    var multiFeature = features.slice(0, 10);
    var featById = features.slice(0, 12).map(function(feat) {
      return feat.getId();
    });

    source.removeFromSelected(singleFeature);

    waitsFor(function() {
      return count == 1 && removedItems != null;
    }, 'feature to be deselected');

    runs(function() {
      expect(source.selected_.length).toBe(11);
      expect(source.selected_).not.toContain(singleFeature);
      expect(googObject.getKeys(source.selectedById_).length).toBe(11);
      expect(source.selectedById_[singleFeature.getId()]).toBeUndefined();
      expect(removedItems).not.toBeNull();
      expect(removedItems.length).toBe(1);
      expect(removedItems[0]).toBe(singleFeature);

      removedItems = null;
      source.removeFromSelected(multiFeature);
    });

    waitsFor(function() {
      return count == 2 && removedItems != null;
    }, 'features to be deselected');

    runs(function() {
      expect(source.selected_.length).toBe(2);
      expect(googObject.getKeys(source.selectedById_).length).toBe(2);
      expect(removedItems).not.toBeNull();
      expect(removedItems.length).toBe(9);
      expect(removedItems).not.toContain(singleFeature);

      removedItems = null;
      source.selectById(featById, true);
    });

    waitsFor(function() {
      return count == 3 && removedItems != null;
    }, 'features to be deselected');

    runs(function() {
      expect(source.selected_.length).toBe(0);
      expect(googObject.getKeys(source.selectedById_).length).toBe(0);
      expect(removedItems).not.toBeNull();
      expect(removedItems.length).toBe(2);
      expect(removedItems).not.toContain(singleFeature);
      expect(removedItems).not.toContain(multiFeature[0]);

      unlistenByKey(listenKey);
    });
  });

  it('should select all features in the source', function() {
    var addedCount = 0;
    var onPropertyChange = function(event) {
      if (event.getProperty() == SelectionType.ADDED) {
        addedCount++;
      }
    };
    const listenKey = listen(source, GoogEventType.PROPERTYCHANGE, onPropertyChange, this);

    runs(function() {
      // should select all and fire a change event
      source.selectAll();
    });

    waitsFor(function() {
      return addedCount == 1;
    }, 'all features to be selected');

    runs(function() {
      expect(source.selected_.length).toBe(10000);
      expect(googObject.getKeys(source.selectedById_).length).toBe(10000);

      // shouldn't fire the change event if everything is already selected
      source.selectAll();
    });

    setTimeout(function() {/* wait to make sure event isn't fired */}, 100);

    runs(function() {
      expect(addedCount).toBe(1);
      expect(source.selected_.length).toBe(10000);
      expect(googObject.getKeys(source.selectedById_).length).toBe(10000);

      // should fire a change event if at least one feature is selected
      source.deselect(features[0]);
      expect(source.selected_.length).toBe(9999);
      expect(googObject.getKeys(source.selectedById_).length).toBe(9999);
      source.selectAll();
    });

    waitsFor(function() {
      return addedCount == 2;
    }, 'feature to be selected with selectAll');

    runs(function() {
      expect(source.selected_.length).toBe(10000);
      expect(googObject.getKeys(source.selectedById_).length).toBe(10000);

      unlistenByKey(listenKey);
    });
  });

  it('should deselect all features in the source', function() {
    var removedCount = 0;
    var onPropertyChange = function(event) {
      if (event.getProperty() == SelectionType.REMOVED) {
        removedCount++;
      }
    };
    const listenKey = listen(source, GoogEventType.PROPERTYCHANGE, onPropertyChange, this);

    runs(function() {
      expect(source.selected_.length).toBe(10000);
      expect(googObject.getKeys(source.selectedById_).length).toBe(10000);

      // should remove selection and fire a change event
      source.selectNone();
    });

    waitsFor(function() {
      return removedCount == 1;
    }, 'all features to be deselected', 100);

    runs(function() {
      expect(source.selected_.length).toBe(0);
      expect(googObject.getKeys(source.selectedById_).length).toBe(0);

      // shouldn't fire the change event if nothing is selected
      source.selectNone();
    });

    setTimeout(function() {/* wait to make sure event isn't fired */}, 100);

    runs(function() {
      expect(removedCount).toBe(1);
      expect(source.selected_.length).toBe(0);
      expect(googObject.getKeys(source.selectedById_).length).toBe(0);

      // should fire a change event if at least one feature is deselected
      source.select(features[0]);
      expect(source.selected_.length).toBe(1);
      expect(googObject.getKeys(source.selectedById_).length).toBe(1);
      source.selectNone();
    });

    waitsFor(function() {
      return removedCount == 2;
    }, 'feature to be deselected with selectNone');

    runs(function() {
      expect(source.selected_.length).toBe(0);
      expect(googObject.getKeys(source.selectedById_).length).toBe(0);

      unlistenByKey(listenKey);
    });
  });

  it('should hide features in the source', function() {
    expect(source.getFilteredFeatures().length).toBe(features.length);

    source.hideFeatures(features[0]);
    expect(source.getFilteredFeatures().length).toBe(features.length - 1);
    source.hideFeatures(features.slice(0, 10));
    expect(source.getFilteredFeatures().length).toBe(features.length - 10);
    source.hideById(features.slice(0, 12).map(function(feat) {
      return feat.getId();
    }));
    expect(source.getFilteredFeatures().length).toBe(features.length - 12);
  });

  it('should be able to get the hidden items', function() {
    var hidden = source.getHiddenItems();
    expect(hidden.length).toBe(12);
  });

  it('should show features in the source', function() {
    source.showFeatures(features[0]);
    expect(source.getFilteredFeatures().length).toBe(features.length - 11);
    source.showFeatures(features.slice(0, 10));
    expect(source.getFilteredFeatures().length).toBe(features.length - 2);
    source.hideById(features.slice(0, 12).map(function(feat) {
      return feat.getId();
    }), true);
    expect(source.getFilteredFeatures().length).toBe(features.length);

    source.hideFeatures(features);
    expect(source.getFilteredFeatures().length).toBe(0);
    source.displayAll();
    expect(source.getFilteredFeatures().length).toBe(features.length);
  });

  it('should hide selected features in the source', function() {
    expect(source.getFilteredFeatures().length).toBe(features.length);
    source.hideSelected();
    expect(source.getFilteredFeatures().length).toBe(features.length);

    // should hide selected features and deselect them
    source.addToSelected(features.slice(0, 10));
    expect(source.selected_.length).toBe(10);
    expect(googObject.getKeys(source.selectedById_).length).toBe(10);
    source.hideSelected();
    expect(source.getFilteredFeatures().length).toBe(features.length - 10);
  });

  it('should hide unselected features in the source', function() {
    source.displayAll();
    expect(source.getFilteredFeatures().length).toBe(features.length);
    source.addToSelected(features.slice(0, 10));
    expect(source.selected_.length).toBe(10);
    expect(googObject.getKeys(source.selectedById_).length).toBe(10);

    source.hideUnselected();
    expect(source.getFilteredFeatures().length).toBe(10);
    expect(source.selected_.length).toBe(10);
    expect(googObject.getKeys(source.selectedById_).length).toBe(10);
  });

  it('create its refresh delay', function() {
    source.setRefreshInterval(15);

    expect(source.refreshTimer).not.toBeNull();
    expect(source.refreshTimer.getInterval()).toBe(15000);

    // it should null it out when set to 0
    source.setRefreshInterval(0);
    expect(source.refreshTimer).toBeNull();
  });

  it('shares its refresh timer with all other sources', function() {
    var newSource = new VectorSource(undefined);
    newSource.setRefreshInterval(15);
    source.setRefreshInterval(15);

    // they should be literally the exact same reference
    expect(newSource.refreshTimer === source.refreshTimer).toBe(true);

    // it should create a new one if set to a different value
    newSource.setRefreshInterval(30);
    expect(newSource.refreshTimer.getInterval()).toBe(30000);
    expect(source.refreshTimer.getInterval()).toBe(15000);
    expect(newSource.refreshTimer !== source.refreshTimer).toBe(true);
  });

  it('should clear the source when disabled', function() {
    source.setEnabled(false);
    expect(source.getFeatures().length).toBe(0);
    expect(source.getFilteredFeatures().length).toBe(0);
  });

  it('should refresh the source when enabled', function() {
    spyOn(source, 'refresh');

    source.setEnabled(true);
    expect(source.refresh).toHaveBeenCalled();
  });

  describe('columns', function() {
    var columns;

    var createColumn = function(name, field) {
      var columnDefinition = new ColumnDefinition();
      columnDefinition['id'] = name;
      columnDefinition['name'] = name;
      columnDefinition['field'] = field || name;
      columnDefinition['sortable'] = true;

      return columnDefinition;
    };

    var createColumns = function() {
      return [
        createColumn('ID'),
        createColumn('LAT'),
        createColumn('LON'),
        createColumn('TEST1'),
        createColumn('TEST2'),
        createColumn('TEST3')
      ];
    };

    it('should support getting the original columns or a copy', function() {
      var columns = createColumns();
      source.setColumns(columns);
      expect(source.getColumnsArray()).toBe(source.columns);

      var copy = source.getColumns();
      expect(copy).not.toBe(source.columns);
      expect(googArray.equals(copy, source.columns)).toBe(true);
    });

    it('should always add an ID column to the source', function() {
      source.setColumns([]);
      expect(source.columns.length).toBe(1);
      expect(source.hasColumn(Fields.ID)).toBe(true);
    });

    it('should set columns on the source from an array of strings', function() {
      // adds supplemental spatial columns based on existing columns
      columns = ['ID', 'LAT', 'LON', 'TIME', 'TEST1', 'TEST2', 'TEST3'];
      source.setColumns(columns);
      expect(source.columns.length).toBe(columns.length + 5); // +5 for mgrs, latdms, londms, latddm, londdm

      for (var i = 0, n = columns.length; i < n; i++) {
        expect(source.hasColumn(columns[i])).toBe(true);
      }

      expect(source.hasColumn(Fields.MGRS)).toBe(true);
      expect(source.hasColumn(Fields.LAT_DMS)).toBe(true);
      expect(source.hasColumn(Fields.LON_DMS)).toBe(true);
      expect(source.hasColumn(Fields.LAT_DDM)).toBe(true);
      expect(source.hasColumn(Fields.LON_DDM)).toBe(true);
    });

    it('should set columns on the source from an array of columns', function() {
      columns = createColumns();

      source.setColumns(columns);
      expect(source.columns.length).toBe(columns.length + 5); // +5 for mgrs, latdms, londms, latddm, londdm

      for (var i = 0, n = columns.length; i < n; i++) {
        expect(source.hasColumn(columns[i]['field'])).toBe(true);
      }

      expect(source.hasColumn(Fields.MGRS)).toBe(true);
      expect(source.hasColumn(Fields.LAT_DMS)).toBe(true);
      expect(source.hasColumn(Fields.LON_DMS)).toBe(true);
      expect(source.hasColumn(Fields.LAT_DDM)).toBe(true);
      expect(source.hasColumn(Fields.LON_DDM)).toBe(true);
    });

    it('should add a TIME column if time enabled', function() {
      columns = ['ID', 'LAT', 'LON', 'TEST1', 'TEST2', 'TEST3', 'id', 'Id', 'iD'];
      source.setTimeEnabled(true);
      source.setColumns(columns);
      expect(source.columns.length).toBe(columns.length + 6); // +6 for mgrs, latdms, londms, latddm, londdm, time
      expect(source.hasColumn(RecordField.TIME)).toBe(true);

      // disable it for subsequent tests
      source.setTimeEnabled(false);
    });

    it('should remove duplicate columns', function() {
      columns = [
        new ColumnDefinition('ID'),
        new ColumnDefinition('ID')
      ];

      var source = new VectorSource(undefined);
      source.setColumns(columns);
      expect(source.columns.length).toBe(1);
      expect(source.columns[0]['id']).toBe('ID');
    });

    it('should restore columns from a descriptor', function() {
      // create a fake descriptor that returns columns:
      //  - out of the normal auto sort order
      //  - non-default width and userModified values
      var dColumn1 = new ColumnDefinition('TIME');
      dColumn1['width'] = 123;
      dColumn1['userModified'] = true;

      var dColumn2 = new ColumnDefinition('ID');
      dColumn2['width'] = 456;
      dColumn2['userModified'] = true;

      var descriptor = {
        getColumns: function() {
          return [dColumn1, dColumn2];
        },
        setColumns: function() {}
      };

      // return the descriptor when setColumns looks for one
      spyOn(DataManager.getInstance(), 'getDescriptor').andReturn(descriptor);

      // columns on the descriptor start in opposite order, with new columns mixed in
      columns = [
        new ColumnDefinition('ID'),
        new ColumnDefinition('NEW_COLUMN_1'),
        new ColumnDefinition('TIME'),
        new ColumnDefinition('NEW_COLUMN_2')
      ];

      columns[0]['width'] = 100;
      columns[1]['width'] = 200;
      columns[2]['width'] = 300;
      columns[3]['width'] = 400;

      var source = new VectorSource(undefined);
      source.setColumns(columns);

      // still have 4 columns
      expect(source.columns.length).toBe(4);

      // columns in the descriptor are sorted first in descriptor order
      expect(source.columns[0]['id']).toBe('TIME');
      expect(source.columns[1]['id']).toBe('ID');

      // columns not in the descriptor are sorted last in the current order
      expect(source.columns[2]['id']).toBe('NEW_COLUMN_1');
      expect(source.columns[3]['id']).toBe('NEW_COLUMN_2');

      // width restored from descriptor column
      expect(source.columns[0]['width']).toBe(123);
      expect(source.columns[1]['width']).toBe(456);

      // width maintained if not on the descriptor
      expect(source.columns[2]['width']).toBe(200);
      expect(source.columns[3]['width']).toBe(400);

      // userModified restored from descriptor column
      expect(source.columns[0]['userModified']).toBe(true);
      expect(source.columns[1]['userModified']).toBe(true);

      // userModified maintained if not on the descriptor
      expect(source.columns[2]['userModified']).toBe(false);
      expect(source.columns[3]['userModified']).toBe(false);
    });

    it('should sort columns if they are not marked as user-modified', function() {
      columns = [
        new ColumnDefinition('TIME'),
        new ColumnDefinition('ID')
      ];

      var source = new VectorSource(undefined);
      source.setColumns(columns);
      expect(source.columns.length).toBe(2);
      expect(source.columns[0]['id']).toBe('TIME');
      expect(source.columns[1]['id']).toBe('ID');
    });

    it('should not sort columns if they are marked as user-modified', function() {
      columns = [
        new ColumnDefinition('TIME'),
        new ColumnDefinition('ID')
      ];

      columns[0]['userModified'] = true;

      var source = new VectorSource(undefined);
      source.setColumns(columns);
      expect(source.columns.length).toBe(2);
      expect(source.columns[0]['id']).toBe('TIME');
      expect(source.columns[1]['id']).toBe('ID');
    });

    it('should add a formatter to a "DESCRIPTION" column', function() {
      columns = ['ID', 'DESCRIPTION'];
      source = new VectorSource();
      source.setColumns(columns);
      expect(source.columns.length).toBe(2);
      expect(source.hasColumn('DESCRIPTION')).toBe(true);

      // expect the formatter on that column to be the DescriptionFormatter
      expect(source.columns[1]['formatter']).toBe(DescriptionFormatter);
    });

    it('should add a formatter to a "PROPERTIES" column', function() {
      columns = ['ID', 'PROPERTIES'];
      source = new VectorSource();
      source.setColumns(columns);
      expect(source.columns.length).toBe(2);
      expect(source.hasColumn('PROPERTIES')).toBe(true);

      // expect the formatter on that column to be the PropertiesFormatter
      expect(source.columns[1]['formatter']).toBe(PropertiesFormatter);
    });

    it('should detect an icon rotation column', function() {
      var styleConfig = {};
      columns = ['ID', 'TYPE', 'BEARING'];
      source = new VectorSource();

      var sm = StyleManager.getInstance();
      spyOn(sm, 'getLayerConfig').andCallFake(function() {
        return styleConfig;
      });

      source.setColumns(columns);

      expect(styleConfig[StyleField.ROTATION_COLUMN]).toBe(Fields.BEARING);
    });
  });

  describe('dynamic features', function() {
    it('should add dynamic features to the source', function() {
      initDynamicFeatures();
      addDynamicSpies();

      source.addFeatures(dynamicFeatures);

      dynamicFeatures.forEach(function(df) {
        var id = df.getId();
        expect(source.dynamicFeatures_[id]).toBe(df);
        expect(source.dynamicListeners_[id]).toBeUndefined();

        expect(df.initDynamic).not.toHaveBeenCalled();
        expect(df.disposeDynamic).not.toHaveBeenCalled();
        expect(df.updateDynamic).not.toHaveBeenCalled();
      });
    });

    it('should init dynamic features when animation enabled', function() {
      addDynamicSpies();
      fakeMapContainer();

      // enable animation on the source
      source.setTimeEnabled(true);
      source.setAnimationEnabled(true);

      dynamicFeatures.forEach(function(df) {
        var id = df.getId();
        expect(source.dynamicFeatures_[id]).toBe(df);
        expect(source.dynamicListeners_[id]).toBeDefined();

        expect(df.initDynamic).toHaveBeenCalled();
        expect(df.disposeDynamic).not.toHaveBeenCalled();
        expect(df.updateDynamic).not.toHaveBeenCalled();
      });
    });

    it('should update dynamic features during animation', function() {
      addDynamicSpies();

      // update the animation overlay on the source
      source.updateAnimationOverlay();

      dynamicFeatures.forEach(function(df) {
        var id = df.getId();
        expect(source.dynamicFeatures_[id]).toBe(df);
        expect(source.dynamicListeners_[id]).toBeDefined();

        // updates to the animation overlay should update the dynamic feature
        expect(df.initDynamic).not.toHaveBeenCalled();
        expect(df.disposeDynamic).not.toHaveBeenCalled();
        expect(df.updateDynamic).toHaveBeenCalledWith(displayStart, displayEnd);
      });
    });

    it('should respond to changes in dynamic feature geometry', function() {
      addDynamicSpies();

      spyOn(source, 'onDynamicFeatureChange').andCallThrough();

      var df = dynamicFeatures[0];
      df.dispatchEvent(new PropertyChangeEvent(DynamicPropertyChange.GEOMETRY));

      // feature is already initialized so this shouldn't be called
      expect(df.initDynamic).not.toHaveBeenCalled();

      // dynamic content from the old geometry should have been disposed
      expect(df.disposeDynamic).toHaveBeenCalledWith(true);

      // and the dynamic content updated for the new geometry
      expect(df.updateDynamic).toHaveBeenCalledWith(displayStart, displayEnd);

      // dynamic features that did not change should not be updated
      for (var i = 1; i < dynamicFeatures.length; i++) {
        expect(dynamicFeatures[i].initDynamic).not.toHaveBeenCalled();
        expect(dynamicFeatures[i].disposeDynamic).not.toHaveBeenCalled();
        expect(dynamicFeatures[i].updateDynamic).not.toHaveBeenCalled();
      }
    });

    it('should clean up dynamic features when animation disabled', function() {
      addDynamicSpies();

      // disable animation/time model for further tests
      source.setAnimationEnabled(false);
      source.setTimeEnabled(false);

      dynamicFeatures.forEach(function(df) {
        var id = df.getId();
        expect(source.dynamicFeatures_[id]).toBe(df);
        expect(source.dynamicListeners_[id]).toBeUndefined();

        expect(df.initDynamic).not.toHaveBeenCalled();
        expect(df.disposeDynamic).toHaveBeenCalled();
        expect(df.updateDynamic).not.toHaveBeenCalled();
      });
    });

    it('should remove dynamic features from the source', function() {
      addDynamicSpies();

      source.removeFeatures(dynamicFeatures);

      dynamicFeatures.forEach(function(df) {
        var id = df.getId();
        expect(source.dynamicFeatures_[id]).toBeUndefined();
        expect(source.dynamicListeners_[id]).toBeUndefined();

        expect(df.disposeDynamic).toHaveBeenCalledWith(true);
      });

      dynamicFeatures = null;
    });

    it('should init dynamic features if added while animation is enabled', function() {
      initDynamicFeatures();
      addDynamicSpies();
      fakeMapContainer();

      source.setTimeEnabled(true);
      source.setAnimationEnabled(true);
      source.addFeatures(dynamicFeatures);

      dynamicFeatures.forEach(function(df) {
        var id = df.getId();
        expect(source.dynamicFeatures_[id]).toBe(df);
        expect(source.dynamicListeners_[id]).toBeDefined();

        // each feature should have been initialized, but not updated yet
        expect(df.initDynamic).toHaveBeenCalled();
        expect(df.updateDynamic).not.toHaveBeenCalled();
        expect(df.disposeDynamic).not.toHaveBeenCalled();
      });

      waitsFor(function() {
        return dynamicFeatures[0].updateDynamic.calls.length;
      });

      runs(function() {
        dynamicFeatures.forEach(function(df) {
          // deferred processing should have updated the animation overlay, along with dynamic features
          expect(df.updateDynamic).toHaveBeenCalledWith(displayStart, displayEnd);
        });
      });
    });

    it('should dispose dynamic features if removed while animation is enabled', function() {
      addDynamicSpies();

      source.removeFeatures(dynamicFeatures);

      dynamicFeatures.forEach(function(df) {
        var id = df.getId();
        expect(source.dynamicFeatures_[id]).toBeUndefined();
        expect(source.dynamicListeners_[id]).toBeUndefined();

        expect(df.disposeDynamic).toHaveBeenCalledWith(true);
      });

      dynamicFeatures = null;

      // disable animation/time model for further tests
      source.setAnimationEnabled(false);
      source.setTimeEnabled(false);
    });

    it('should set the colors of features and know when it has done so', function() {
      initDynamicFeatures();
      var color = 'rgba(255,255,255,1.0)';

      source.addFeatures(dynamicFeatures);
      expect(source.hasColors()).toBe(false);

      source.setColor([dynamicFeatures[0]], color);
      expect(source.hasColors()).toBe(true);
      expect(dynamicFeatures[0].values_[StyleField.COLOR]).toBe(color);

      source.setColorModel(null);
      expect(source.hasColors()).toBe(false);

      dynamicFeatures = null;
    });
  });
});

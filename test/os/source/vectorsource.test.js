goog.require('goog.events.EventType');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.object');
goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.data.ColumnDefinition');
goog.require('os.data.filter.OddFilter');
goog.require('os.events.EventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.events.SelectionType');
goog.require('os.feature.DynamicFeature');
goog.require('os.im.Importer');
goog.require('os.layer.MockLayer');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('os.style');
goog.require('os.time.TimeRange');
goog.require('os.ui.formatter.PropertiesFormatter');
goog.require('plugin.file.geojson.GeoJSONParser');


describe('os.source.Vector', function() {
  var dynamicFeatures = null;
  var features = null;
  var source;

  var displayStart = Date.now();
  var displayEnd = displayStart + 5000;
  var displayRange = new os.time.TimeRange(displayStart, displayEnd);

  var waitForTestObject = function() {
    if (!source) {
      source = new os.source.Vector(undefined);
      source.setDisplayRange(displayRange, false);
    }

    // make sure the timeline controller doesn't change our expected range
    spyOn(source.tlc, 'getLastEvent').andReturn({
      getRange: goog.functions.constant(displayRange)
    });

    if (features) {
      return;
    }

    var i = new os.im.Importer(new plugin.file.geojson.GeoJSONParser());
    i.listenOnce(os.events.EventType.COMPLETE, function() {
      features = i.getData();
    });

    var xhr = new goog.net.XhrIo();
    var response = null;

    xhr.listen(goog.net.EventType.SUCCESS, function() {
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
        var df = new os.feature.DynamicFeature(new ol.geom.Point([0, 0]));
        df.setId('df' + i);
        dynamicFeatures.push(df);
      }
    }
  };

  var addDynamicSpies = function() {
    dynamicFeatures.forEach(function(df) {
      spyOn(df, 'initDynamic');
      spyOn(df, 'disposeDynamic');
      spyOn(df, 'updateDynamic');
    });
  };

  var fakeMapContainer = function() {
    // Create a fake layer object to mock functions used by vector source.
    var layer = new os.layer.MockLayer();

    // Create a fake map container to return our fake layer.
    var mapContainer = {
      getLayer: goog.functions.constant(layer),
      getMap: goog.functions.NULL,
      is3DEnabled: goog.functions.FALSE
    };

    spyOn(os.MapContainer, 'getInstance').andReturn(mapContainer);
  };

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

      // ID, LAT, LON, LAT_DMS, LON_DMS, MGRS, UP_DATE_TIME, DOWN_DATE_TIME
      expect(source.columns.length).toBe(8);
    });
  });

  it('should always add an ID column to the source', function() {
    source.setColumns([]);
    expect(source.columns.length).toBe(1);
    expect(source.hasColumn(os.Fields.ID)).toBe(true);
  });

  it('should set columns on the source from an array of strings', function() {
    // adds supplemental spatial columns based on existing columns
    var columns = ['ID', 'LAT', 'LON', 'TIME', 'TEST1', 'TEST2', 'TEST3'];
    source.setColumns(columns);
    expect(source.columns.length).toBe(columns.length + 3); // +3 for mgrs, latdms, londms

    for (var i = 0, n = columns.length; i < n; i++) {
      expect(source.hasColumn(columns[i])).toBe(true);
    }

    expect(source.hasColumn(os.Fields.MGRS)).toBe(true);
    expect(source.hasColumn(os.Fields.LAT_DMS)).toBe(true);
    expect(source.hasColumn(os.Fields.LAT_DMS)).toBe(true);
  });

  it('should set columns on the source from an array of columns', function() {
    var createColumn = function(name, field) {
      var columnDefinition = new os.data.ColumnDefinition();
      columnDefinition['id'] = name;
      columnDefinition['name'] = name;
      columnDefinition['field'] = field || name;
      columnDefinition['sortable'] = true;

      return columnDefinition;
    };

    var columns = [];
    columns.push(createColumn('ID'));
    columns.push(createColumn('LAT'));
    columns.push(createColumn('LON'));
    columns.push(createColumn('TEST1'));
    columns.push(createColumn('TEST2'));
    columns.push(createColumn('TEST3'));

    source.setColumns(columns);
    expect(source.columns.length).toBe(columns.length + 3); // +3 for mgrs, latdms, londms

    for (var i = 0, n = columns.length; i < n; i++) {
      expect(source.hasColumn(columns[i]['field'])).toBe(true);
    }

    expect(source.hasColumn(os.Fields.MGRS)).toBe(true);
    expect(source.hasColumn(os.Fields.LAT_DMS)).toBe(true);
    expect(source.hasColumn(os.Fields.LAT_DMS)).toBe(true);
  });

  it('should add a TIME column if time enabled', function() {
    var columns = ['ID', 'LAT', 'LON', 'TEST1', 'TEST2', 'TEST3'];
    source.setTimeEnabled(true);
    source.setColumns(columns);
    expect(source.columns.length).toBe(columns.length + 4); // +4 for mgrs, latdms, londms, time
    expect(source.hasColumn(os.data.RecordField.TIME)).toBe(true);

    // disable it for subsequent tests
    source.setTimeEnabled(false);
  });

  it('should remove duplicate columns', function() {
    var columns = [
      new os.data.ColumnDefinition('ID'),
      new os.data.ColumnDefinition('ID')
    ];

    var source = new os.source.Vector(undefined);
    source.setColumns(columns);
    expect(source.columns.length).toBe(1);
    expect(source.columns[0]['id']).toBe('ID');
  });

  it('should restore columns from a descriptor', function() {
    // create a fake descriptor that returns columns:
    //  - out of the normal auto sort order
    //  - non-default width and userModified values
    var dColumn1 = new os.data.ColumnDefinition('TIME');
    dColumn1['width'] = 123;
    dColumn1['userModified'] = true;

    var dColumn2 = new os.data.ColumnDefinition('ID');
    dColumn2['width'] = 456;
    dColumn2['userModified'] = true;

    var descriptor = {
      getColumns: function() {
        return [dColumn1, dColumn2];
      },
      setColumns: function() {}
    };

    // return the descriptor when setColumns looks for one
    spyOn(os.dataManager, 'getDescriptor').andReturn(descriptor);

    // columns on the descriptor start in opposite order, with new columns mixed in
    var columns = [
      new os.data.ColumnDefinition('ID'),
      new os.data.ColumnDefinition('NEW_COLUMN_1'),
      new os.data.ColumnDefinition('TIME'),
      new os.data.ColumnDefinition('NEW_COLUMN_2')
    ];

    columns[0]['width'] = 100;
    columns[1]['width'] = 200;
    columns[2]['width'] = 300;
    columns[3]['width'] = 400;

    var source = new os.source.Vector(undefined);
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
    var columns = [
      new os.data.ColumnDefinition('TIME'),
      new os.data.ColumnDefinition('ID')
    ];

    var source = new os.source.Vector(undefined);
    source.setColumns(columns);
    expect(source.columns.length).toBe(2);
    expect(source.columns[0]['id']).toBe('TIME');
    expect(source.columns[1]['id']).toBe('ID');
  });

  it('should not sort columns if they are marked as user-modified', function() {
    var columns = [
      new os.data.ColumnDefinition('TIME'),
      new os.data.ColumnDefinition('ID')
    ];

    columns[0]['userModified'] = true;

    var source = new os.source.Vector(undefined);
    source.setColumns(columns);
    expect(source.columns.length).toBe(2);
    expect(source.columns[0]['id']).toBe('TIME');
    expect(source.columns[1]['id']).toBe('ID');
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
    var newFeature = new ol.Feature();
    newFeature.setId('im-not-in-the-source');

    expect(source.select(newFeature)).toBe(false);
    expect(source.selected_.length).toBe(0);
    expect(goog.object.getKeys(source.selectedById_).length).toBe(0);

    expect(source.deselect(newFeature)).toBe(false);
  });

  it('should add features to the selection', function() {
    var count = 0;
    var addedItems = null;
    var onPropertyChange = function(event) {
      if (event.getProperty() == os.events.SelectionType.ADDED) {
        addedItems = event.getNewValue();
        count++;
      }
    };
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);

    var singleFeature = features[0];
    var multiFeature = features.slice(0, 10);
    source.addToSelected(singleFeature);

    waitsFor(function() {
      return count == 1 && addedItems != null;
    }, 'feature to be selected');

    runs(function() {
      expect(source.selected_.length).toBe(1);
      expect(source.selected_[0]).toBe(singleFeature);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(1);
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
      expect(goog.object.getKeys(source.selectedById_).length).toBe(10);
      expect(addedItems).not.toBeNull();
      expect(addedItems.length).toBe(9);
      expect(addedItems).not.toContain(singleFeature);
      ol.events.unlisten(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);
    });
  });

  it('should remove features from the selection', function() {
    var count = 0;
    var removedItems = null;
    var onPropertyChange = function(event) {
      if (event.getProperty() == os.events.SelectionType.REMOVED) {
        removedItems = event.getNewValue();
        count++;
      }
    };
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);

    var singleFeature = features[0];
    var multiFeature = features.slice(0, 10);
    source.removeFromSelected(singleFeature);

    waitsFor(function() {
      return count == 1 && removedItems != null;
    }, 'feature to be deselected');

    runs(function() {
      expect(source.selected_.length).toBe(9);
      expect(source.selected_).not.toContain(singleFeature);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(9);
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
      expect(source.selected_.length).toBe(0);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(0);
      expect(removedItems).not.toBeNull();
      expect(removedItems.length).toBe(9);
      expect(removedItems).not.toContain(singleFeature);
      ol.events.unlisten(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);
    });
  });

  it('should select all features in the source', function() {
    var addedCount = 0;
    var onPropertyChange = function(event) {
      if (event.getProperty() == os.events.SelectionType.ADDED) {
        addedCount++;
      }
    };
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);

    runs(function() {
      // should select all and fire a change event
      source.selectAll();
    });

    waitsFor(function() {
      return addedCount == 1;
    }, 'all features to be selected');

    runs(function() {
      expect(source.selected_.length).toBe(10000);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(10000);

      // shouldn't fire the change event if everything is already selected
      source.selectAll();
    });

    setTimeout(function() { /* wait to make sure event isn't fired */ }, 100);

    runs(function() {
      expect(addedCount).toBe(1);
      expect(source.selected_.length).toBe(10000);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(10000);

      // should fire a change event if at least one feature is selected
      source.deselect(features[0]);
      expect(source.selected_.length).toBe(9999);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(9999);
      source.selectAll();
    });

    waitsFor(function() {
      return addedCount == 2;
    }, 'feature to be selected with selectAll');

    runs(function() {
      expect(source.selected_.length).toBe(10000);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(10000);

      ol.events.unlisten(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);
    });
  });

  it('should deselect all features in the source', function() {
    var removedCount = 0;
    var onPropertyChange = function(event) {
      if (event.getProperty() == os.events.SelectionType.REMOVED) {
        removedCount++;
      }
    };
    ol.events.listen(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);

    runs(function() {
      expect(source.selected_.length).toBe(10000);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(10000);

      // should remove selection and fire a change event
      source.selectNone();
    });

    waitsFor(function() {
      return removedCount == 1;
    }, 'all features to be deselected', 100);

    runs(function() {
      expect(source.selected_.length).toBe(0);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(0);

      // shouldn't fire the change event if nothing is selected
      source.selectNone();
    });

    setTimeout(function() { /* wait to make sure event isn't fired */ }, 100);

    runs(function() {
      expect(removedCount).toBe(1);
      expect(source.selected_.length).toBe(0);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(0);

      // should fire a change event if at least one feature is deselected
      source.select(features[0]);
      expect(source.selected_.length).toBe(1);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(1);
      source.selectNone();
    });

    waitsFor(function() {
      return removedCount == 2;
    }, 'feature to be deselected with selectNone');

    runs(function() {
      expect(source.selected_.length).toBe(0);
      expect(goog.object.getKeys(source.selectedById_).length).toBe(0);

      ol.events.unlisten(source, goog.events.EventType.PROPERTYCHANGE, onPropertyChange, this);
    });
  });

  it('should hide features in the source', function() {
    expect(source.getFilteredFeatures().length).toBe(features.length);

    source.hideFeatures(features[0]);
    expect(source.getFilteredFeatures().length).toBe(features.length - 1);
    source.hideFeatures(features.slice(0, 10));
    expect(source.getFilteredFeatures().length).toBe(features.length - 10);
  });

  it('should be able to get the hidden items', function() {
    var hidden = source.getHiddenItems();
    expect(hidden.length).toBe(10);
  });

  it('should show features in the source', function() {
    source.showFeatures(features[0]);
    expect(source.getFilteredFeatures().length).toBe(features.length - 9);
    source.showFeatures(features.slice(0, 10));
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
    expect(goog.object.getKeys(source.selectedById_).length).toBe(10);
    source.hideSelected();
    expect(source.getFilteredFeatures().length).toBe(features.length - 10);
  });

  it('should hide unselected features in the source', function() {
    source.displayAll();
    expect(source.getFilteredFeatures().length).toBe(features.length);
    source.addToSelected(features.slice(0, 10));
    expect(source.selected_.length).toBe(10);
    expect(goog.object.getKeys(source.selectedById_).length).toBe(10);

    source.hideUnselected();
    expect(source.getFilteredFeatures().length).toBe(10);
    expect(source.selected_.length).toBe(10);
    expect(goog.object.getKeys(source.selectedById_).length).toBe(10);
  });

  it('should add a formatter to a "DESCRIPTION" column', function() {
    var columns = ['ID', 'DESCRIPTION'];
    source.setColumns(columns);
    expect(source.columns.length).toBe(2);
    expect(source.hasColumn('DESCRIPTION')).toBe(true);

    // expect the formatter on that column to be the DescriptionFormatter
    expect(source.getColumns()[1]['formatter']).toBe(os.ui.formatter.DescriptionFormatter);
  });

  it('should add a formatter to a "PROPERTIES" column', function() {
    var columns = ['ID', 'PROPERTIES'];
    source.setColumns(columns);
    expect(source.columns.length).toBe(2);
    expect(source.hasColumn('PROPERTIES')).toBe(true);

    // expect the formatter on that column to be the PropertiesFormatter
    expect(source.getColumns()[1]['formatter']).toBe(os.ui.formatter.PropertiesFormatter);
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
    var newSource = new os.source.Vector(undefined);
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

  it('should not allow invalid geometries', function() {
    var f = new ol.Feature(new ol.geom.Point([]));
    var newSource = new os.source.Vector(undefined);
    newSource.addFeature(f);
    expect(f.getGeometry()).toBe(null);
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
        expect(df.updateDynamic).toHaveBeenCalledWith(displayEnd);
      });
    });

    it('should respond to changes in dynamic feature geometry', function() {
      addDynamicSpies();

      spyOn(source, 'onDynamicFeatureChange').andCallThrough();

      var df = dynamicFeatures[0];
      df.dispatchEvent(new os.events.PropertyChangeEvent(os.feature.DynamicPropertyChange.GEOMETRY));

      // feature is already initialized so this shouldn't be called
      expect(df.initDynamic).not.toHaveBeenCalled();

      // dynamic content from the old geometry should have been disposed
      expect(df.disposeDynamic).toHaveBeenCalledWith(true);

      // and the dynamic content updated for the new geometry
      expect(df.updateDynamic).toHaveBeenCalledWith(displayEnd);

      // remaining dynamic features should be updated with the animation overlay update
      for (var i = 1; i < dynamicFeatures.length; i++) {
        expect(dynamicFeatures[i].initDynamic).not.toHaveBeenCalled();
        expect(dynamicFeatures[i].disposeDynamic).not.toHaveBeenCalled();
        expect(dynamicFeatures[i].updateDynamic).toHaveBeenCalledWith(displayEnd);
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
          expect(df.updateDynamic).toHaveBeenCalledWith(displayEnd);
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
  });
});

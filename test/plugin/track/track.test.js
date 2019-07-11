goog.require('ol.Feature');
goog.require('os.data.RecordField');
goog.require('os.feature.DynamicFeature');
goog.require('os.style');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('plugin.track');

describe('plugin.track', function() {
  /**
   * Generate test track coordinates.
   * @param {number} count The number of coordinates.
   * @param {string} sortField The sort field.
   * @param {number} sortStart The start sort value.
   * @return {!Array<!Array<number>>}
   */
  var generateCoordinates = function(count, sortField, sortStart) {
    var coordinates = [];

    var i = count;
    while (i--) {
      var coordinate = [i * 0.1, i * 0.1, 0];
      if (sortField === os.data.RecordField.TIME) {
        coordinate.push(sortStart + i * 1000);
      } else {
        coordinate.push(sortStart + i);
      }

      coordinates.push(coordinate);
    }

    return coordinates;
  };

  /**
   * Generate test track features.
   * @param {number} count The number of features.
   * @param {string} sortField The sort field.
   * @param {number} sortStart The start sort value.
   * @return {!Array<!ol.Feature>}
   */
  var generateFeatures = function(count, sortField, sortStart) {
    var coordinates = generateCoordinates(count, sortField, sortStart);
    return coordinates.map(function(coordinate) {
      var sortValue = coordinate.pop();

      var feature = new ol.Feature(new ol.geom.Point(coordinate));
      if (sortField === os.data.RecordField.TIME) {
        feature.set(sortField, new os.time.TimeInstant(sortValue));
      } else {
        feature.set(sortField, sortValue);
      }
      return feature;
    });
  };

  /**
   * Verifies coordinates are sorted by increasing M value.
   * @param {!Array<!Array<number>>} coordinates The array of coordinates.
   */
  var verifyCoordinateSort = function(coordinates) {
    for (var i = 1; i < coordinates.length; i++) {
      var a = coordinates[i - 1];
      var b = coordinates[i];
      expect(a[a.length - 1] < b[b.length - 1]).toBe(true);
    }
  };

  it('gets a value from a feature by field', function() {
    var feature = new ol.Feature({
      field1: 'value1',
      field2: 'value2'
    });

    expect(plugin.track.getFeatureValue('field1', feature)).toBe('value1');
    expect(plugin.track.getFeatureValue('field2', feature)).toBe('value2');
    expect(plugin.track.getFeatureValue('field3', feature)).toBeUndefined();

    expect(plugin.track.getFeatureValue('field1', undefined)).toBeUndefined();
    expect(plugin.track.getFeatureValue('field1', null)).toBeUndefined();
  });

  it('gets the start time from a feature', function() {
    var feature = new ol.Feature();
    expect(plugin.track.getStartTime(feature)).toBeUndefined();

    var now = Date.now();
    feature.set(os.data.RecordField.TIME, new os.time.TimeInstant(now));
    expect(plugin.track.getStartTime(feature)).toBe(now);

    feature.set(os.data.RecordField.TIME, new os.time.TimeRange(now, now + 1000));
    expect(plugin.track.getStartTime(feature)).toBe(now);
  });

  it('sorts coordinates by increasing M value', function() {
    var coordinates = [
      [0, 0, 0, 5],
      [0, 0, 0, 1],
      [0, 0, 0, 4],
      [0, 0, 0, 2],
      [0, 0, 0, 3],
      [0, 0, 0, 0]
    ];

    coordinates.sort(plugin.track.sortCoordinatesByValue);
    verifyCoordinateSort(coordinates);
  });

  it('gets sorted coordinates from a set of features', function() {
    var testGetTrackCoordinates = function(sortField, sortStart) {
      var features = generateFeatures(20, sortField, sortStart);
      var coordinates = plugin.track.getTrackCoordinates(features, sortField);
      expect(coordinates.length).toBe(features.length);
      verifyCoordinateSort(coordinates);
    };

    // sorts by time
    testGetTrackCoordinates(os.data.RecordField.TIME, Date.now());

    // sorts by arbitrary sortable values
    testGetTrackCoordinates('testSortField', 0);
  });

  it('does not create a track without features or coordinates', function() {
    var track = plugin.track.createTrack({});
    expect(track).toBeUndefined();

    track = plugin.track.createTrack({
      features: []
    });
    expect(track).toBeUndefined();

    track = plugin.track.createTrack({
      coordinates: []
    });
    expect(track).toBeUndefined();
  });

  it('creates a track from a set of features', function() {
    var sortField = os.data.RecordField.TIME;
    var features = generateFeatures(20, sortField, Date.now());
    var color = 'rgba(0, 255, 0, 1)';
    var id = 'testId';
    var name = 'Test Track';
    var label = 'labelField';

    var track = plugin.track.createTrack({
      color: color,
      features: features,
      id: id,
      label: label,
      name: name
    });

    expect(track instanceof os.feature.DynamicFeature).toBe(true);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var coordinates = geometry.getCoordinates();
    expect(coordinates.length).toBe(features.length);
    verifyCoordinateSort(coordinates);

    expect(track.getId()).toBe(id);
    expect(track.get(os.Fields.ID)).toBe(id);
    expect(track.get(plugin.file.kml.KMLField.NAME)).toBe(name);
    expect(track.get(plugin.track.TrackField.SORT_FIELD)).toBe(sortField);

    var featureStyle = track.get(os.style.StyleType.FEATURE);
    expect(featureStyle).toBeDefined();
    expect(Array.isArray(featureStyle)).toBe(true);
    expect(featureStyle.length).toBe(2);
    expect(os.style.getConfigColor(featureStyle[0])).toBe(color);
    expect(os.style.getConfigColor(featureStyle[1])).toBe(color);

    var labelStyle = featureStyle[1][os.style.StyleField.LABELS];
    expect(labelStyle).toBeDefined();
    expect(Array.isArray(labelStyle)).toBe(true);
    expect(labelStyle.length).toBe(1);
    expect(labelStyle[0]['column']).toBe(label);
  });

  it('creates a track with default values', function() {
    var features = generateFeatures(20, os.data.RecordField.TIME, Date.now());
    var track = plugin.track.createTrack({
      features: features
    });

    var actualId = track.getId();
    expect(actualId).toBeDefined();
    expect(track.get(os.Fields.ID)).toBe(actualId);
    expect(track.get(plugin.file.kml.KMLField.NAME)).toBe(actualId);
    expect(track.get(plugin.track.TrackField.SORT_FIELD)).toBe(os.data.RecordField.TIME);

    var featureStyle = track.get(os.style.StyleType.FEATURE);
    expect(featureStyle).toBeDefined();
    expect(Array.isArray(featureStyle)).toBe(true);
    expect(featureStyle.length).toBe(2);
    expect(os.style.getConfigColor(featureStyle[0])).toBe(os.style.DEFAULT_LAYER_COLOR);
    expect(os.style.getConfigColor(featureStyle[1])).toBe(os.style.DEFAULT_LAYER_COLOR);

    var labelStyle = featureStyle[1][os.style.StyleField.LABELS];
    expect(labelStyle).toBeDefined();
    expect(Array.isArray(labelStyle)).toBe(true);
    expect(labelStyle.length).toBe(1);
    expect(labelStyle[0]['column']).toBe(plugin.file.kml.KMLField.NAME);
  });

  it('creates a track from a set of coordinates', function() {
    var coordinates = generateCoordinates(20, os.data.RecordField.TIME, Date.now());
    var track = plugin.track.createTrack({
      coordinates: coordinates
    });

    expect(track instanceof os.feature.DynamicFeature).toBe(true);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var trackCoordinates = geometry.getCoordinates();
    expect(trackCoordinates.length).toBe(coordinates.length);
    verifyCoordinateSort(trackCoordinates);
  });

  it('creates a track without a time-based sort', function() {
    var sortField = 'testSortField';
    var features = generateFeatures(20, sortField, 0);
    var track = plugin.track.createTrack({
      features: features,
      sortField: sortField
    });

    expect(track instanceof os.feature.DynamicFeature).toBe(false);
    expect(track.get(plugin.track.TrackField.SORT_FIELD)).toBe(sortField);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var trackCoordinates = geometry.getCoordinates();
    expect(trackCoordinates.length).toBe(features.length);
    verifyCoordinateSort(trackCoordinates);
  });

  it('adds features to an existing track', function() {
    var startTime = Date.now();
    var features = generateFeatures(20, os.data.RecordField.TIME, startTime);
    var track = plugin.track.createTrack({
      features: features
    });

    // overlap by 2 features to verify those are skipped
    startTime += 18 * 1000;

    var moreFeatures = generateFeatures(20, os.data.RecordField.TIME, startTime);
    var added = plugin.track.addToTrack({
      features: moreFeatures,
      track: track
    });

    expect(added.length).toBe(18);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var trackCoordinates = geometry.getCoordinates();
    expect(trackCoordinates.length).toBe(features.length + moreFeatures.length - 2);
    verifyCoordinateSort(trackCoordinates);
  });

  it('adds coordinates to an existing track', function() {
    var startTime = Date.now();
    var coordinates = generateCoordinates(20, os.data.RecordField.TIME, startTime);
    var track = plugin.track.createTrack({
      coordinates: coordinates
    });

    // overlap by 2 coordinates to verify those are skipped
    startTime += 18 * 1000;

    var moreCoordinates = generateCoordinates(20, os.data.RecordField.TIME, startTime);
    var added = plugin.track.addToTrack({
      coordinates: moreCoordinates,
      track: track
    });

    expect(added.length).toBe(18);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var trackCoordinates = geometry.getCoordinates();
    expect(trackCoordinates.length).toBe(coordinates.length + moreCoordinates.length - 2);
    verifyCoordinateSort(trackCoordinates);
  });
});

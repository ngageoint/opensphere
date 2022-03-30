goog.require('goog.object');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.feature.DynamicFeature');
goog.require('os.style');
goog.require('os.style.StyleField');
goog.require('os.style.StyleType');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.track');
goog.require('os.track.TrackField');

import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';

describe('os.track', function() {
  const object = goog.module.get('goog.object');
  const {default: Fields} = goog.module.get('os.Fields');
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const {default: DynamicFeature} = goog.module.get('os.feature.DynamicFeature');
  const style = goog.module.get('os.style');
  const {default: StyleField} = goog.module.get('os.style.StyleField');
  const {default: StyleType} = goog.module.get('os.style.StyleType');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');
  const osTrack = goog.module.get('os.track');
  const {default: TrackField} = goog.module.get('os.track.TrackField');

  var metadataField = 'testField';
  var sortIncrement = 1000;

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
      if (sortField === RecordField.TIME) {
        coordinate.push(sortStart + i * sortIncrement);
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
   * @return {!Array<!Feature>}
   */
  var generateFeatures = function(count, sortField, sortStart) {
    var coordinates = generateCoordinates(count, sortField, sortStart);
    return coordinates.map(function(coordinate, idx, arr) {
      var sortValue = coordinate.pop();
      var feature = new Feature(new Point(coordinate));
      if (sortField === RecordField.TIME) {
        feature.set(sortField, new TimeInstant(sortValue));
      } else {
        feature.set(sortField, sortValue);
      }
      feature.set(metadataField, idx);
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

  /**
   * Verifies all coordinate sort values are in a metadata map.
   * @param {!Array<number>} coordinates The flat array of coordinates.
   * @param {number} stride The coordinate stride.
   * @param {!Object} metadataMap The metadata map to verify against coordinates.
   */
  var verifyMetadata = function(coordinates, stride, metadataMap) {
    for (var i = 0; i < coordinates.length; i += stride) {
      expect(metadataMap[coordinates[i + stride - 1]]).toBeDefined();
    }
  };

  it('gets a value from a feature by field', function() {
    var feature = new Feature({
      field1: 'value1',
      field2: 'value2'
    });

    expect(osTrack.getFeatureValue('field1', feature)).toBe('value1');
    expect(osTrack.getFeatureValue('field2', feature)).toBe('value2');
    expect(osTrack.getFeatureValue('field3', feature)).toBeUndefined();

    expect(osTrack.getFeatureValue('field1', undefined)).toBeUndefined();
    expect(osTrack.getFeatureValue('field1', null)).toBeUndefined();
  });

  it('gets the start time from a feature', function() {
    var feature = new Feature();
    expect(osTrack.getStartTime(feature)).toBeUndefined();

    var now = Date.now();
    feature.set(RecordField.TIME, new TimeInstant(now));
    expect(osTrack.getStartTime(feature)).toBe(now);

    feature.set(RecordField.TIME, new TimeRange(now, now + 1000));
    expect(osTrack.getStartTime(feature)).toBe(now);
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

    coordinates.sort(osTrack.sortCoordinatesByValue);
    verifyCoordinateSort(coordinates);
  });

  it('gets sorted coordinates from a set of features', function() {
    var testGetTrackCoordinates = function(sortField, sortStart) {
      var features = generateFeatures(20, sortField, sortStart);
      var coordinates = osTrack.getTrackCoordinates(features, sortField);
      expect(coordinates.length).toBe(features.length);
      verifyCoordinateSort(coordinates);
    };

    // sorts by time
    testGetTrackCoordinates(RecordField.TIME, Date.now());

    // sorts by arbitrary sortable values
    testGetTrackCoordinates('testSortField', 0);
  });

  it('does not create a track without features or coordinates', function() {
    var track = osTrack.createTrack({});
    expect(track).toBeUndefined();

    track = osTrack.createTrack({
      features: []
    });
    expect(track).toBeUndefined();

    track = osTrack.createTrack({
      coordinates: []
    });
    expect(track).toBeUndefined();
  });

  it('creates a track from a set of features', function() {
    var sortField = RecordField.TIME;
    var features = generateFeatures(20, sortField, Date.now());
    var color = 'rgba(0, 255, 0, 1)';
    var id = 'testId';
    var name = 'Test Track';
    var label = 'labelField';

    var track = osTrack.createTrack({
      color: color,
      features: features,
      id: id,
      label: label,
      name: name
    });

    expect(track instanceof DynamicFeature).toBe(true);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var coordinates = geometry.getCoordinates();
    expect(coordinates.length).toBe(features.length);
    verifyCoordinateSort(coordinates);

    expect(track.getId()).toBe(id);
    expect(track.get(Fields.ID)).toBe(id);
    expect(track.get(Fields.LOWERCASE_NAME)).toBe(name);
    expect(track.get(TrackField.SORT_FIELD)).toBe(sortField);
    expect(track.get(TrackField.METADATA_MAP)).toBeUndefined();

    var featureStyle = track.get(StyleType.FEATURE);
    expect(featureStyle).toBeDefined();
    expect(Array.isArray(featureStyle)).toBe(true);
    expect(featureStyle.length).toBe(2);
    expect(style.getConfigColor(featureStyle[0])).toBe(color);
    expect(style.getConfigColor(featureStyle[1])).toBe(color);

    var labelStyle = featureStyle[1][StyleField.LABELS];
    expect(labelStyle).toBeDefined();
    expect(Array.isArray(labelStyle)).toBe(true);
    expect(labelStyle.length).toBe(1);
    expect(labelStyle[0]['column']).toBe(label);
  });

  it('creates a track with default values', function() {
    var features = generateFeatures(20, RecordField.TIME, Date.now());
    var track = osTrack.createTrack({
      features: features
    });

    var actualId = track.getId();
    expect(actualId).toBeDefined();
    expect(track.get(Fields.ID)).toBe(actualId);
    expect(track.get(Fields.LOWERCASE_NAME)).toBe(actualId);
    expect(track.get(TrackField.SORT_FIELD)).toBe(RecordField.TIME);

    var featureStyle = track.get(StyleType.FEATURE);
    expect(featureStyle).toBeDefined();
    expect(Array.isArray(featureStyle)).toBe(true);
    expect(featureStyle.length).toBe(2);
    expect(style.getConfigColor(featureStyle[0])).toBe(style.DEFAULT_LAYER_COLOR);
    expect(style.getConfigColor(featureStyle[1])).toBe(style.DEFAULT_LAYER_COLOR);

    var labelStyle = featureStyle[1][StyleField.LABELS];
    expect(labelStyle).toBeDefined();
    expect(Array.isArray(labelStyle)).toBe(true);
    expect(labelStyle.length).toBe(1);
    expect(labelStyle[0]['column']).toBe(Fields.LOWERCASE_NAME);
  });

  it('creates a track with metadata from the feature', function() {
    var features = generateFeatures(20, RecordField.TIME, Date.now());
    var track = osTrack.createTrack({
      features: features,
      includeMetadata: true
    });

    var metadataMap = track.get(TrackField.METADATA_MAP);
    expect(metadataMap).toBeDefined();

    var keys = Object.keys(metadataMap);
    expect(keys.length).toBe(features.length);

    for (var i = 0; i < keys; i++) {
      expect(metadataMap[keys[i]][metadataField]).toBe(i);
    }

    // current position starts at the beginning, so metadata field should be set from the first feature
    expect(track.get(metadataField)).toBe(0);
  });

  it('creates a track from a set of coordinates', function() {
    var coordinates = generateCoordinates(20, RecordField.TIME, Date.now());
    var track = osTrack.createTrack({
      coordinates: coordinates
    });

    expect(track instanceof DynamicFeature).toBe(true);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var trackCoordinates = geometry.getCoordinates();
    expect(trackCoordinates.length).toBe(coordinates.length);
    verifyCoordinateSort(trackCoordinates);
  });

  it('creates a track without a time-based sort', function() {
    var sortField = 'testSortField';
    var features = generateFeatures(20, sortField, 0);
    var track = osTrack.createTrack({
      features: features,
      sortField: sortField
    });

    expect(track instanceof DynamicFeature).toBe(false);
    expect(track.get(TrackField.SORT_FIELD)).toBe(sortField);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var trackCoordinates = geometry.getCoordinates();
    expect(trackCoordinates.length).toBe(features.length);
    verifyCoordinateSort(trackCoordinates);
  });

  it('adds features to an existing track', function() {
    var startTime = Date.now();
    var features = generateFeatures(20, RecordField.TIME, startTime);
    var track = osTrack.createTrack({
      features: features
    });

    // overlap by 2 features to verify those are skipped
    startTime += 18 * 1000;

    var moreFeatures = generateFeatures(20, RecordField.TIME, startTime);
    var added = osTrack.addToTrack({
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

  it('adds features to an existing track with metadata', function() {
    var startTime = Date.now();
    var features = generateFeatures(20, RecordField.TIME, startTime);
    var track = osTrack.createTrack({
      features: features
    });

    var metadataMap = track.get(TrackField.METADATA_MAP);
    expect(metadataMap).toBeUndefined();

    // overlap by 2 features to verify those are skipped
    startTime += 18 * 1000;

    var moreFeatures = generateFeatures(20, RecordField.TIME, startTime);
    osTrack.addToTrack({
      features: moreFeatures,
      track: track,
      includeMetadata: true
    });

    metadataMap = track.get(TrackField.METADATA_MAP);
    expect(metadataMap).toBeDefined();

    var keys = Object.keys(metadataMap);
    expect(keys.length).toBe(moreFeatures.length);

    for (var i = 0; i < keys; i++) {
      expect(metadataMap[keys[i]][metadataField]).toBe(i);
    }
  });

  it('adds coordinates to an existing track', function() {
    var startTime = Date.now();
    var coordinates = generateCoordinates(20, RecordField.TIME, startTime);
    var track = osTrack.createTrack({
      coordinates: coordinates
    });

    // overlap by 2 coordinates to verify those are skipped
    startTime += 18 * 1000;

    var moreCoordinates = generateCoordinates(20, RecordField.TIME, startTime);
    var added = osTrack.addToTrack({
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

  it('splits features into tracks', function() {
    var startTime = Date.now();
    var trackField = 'trackField';
    expect(osTrack.splitIntoTracks({}).length).toBe(0);

    var featuresA = generateFeatures(20, RecordField.TIME, startTime);
    var featuresB = generateFeatures(20, RecordField.TIME, startTime);
    var featuresC = generateFeatures(20, RecordField.TIME, startTime);
    featuresA.forEach(function(feature) {
      feature.set(trackField, 'A');
    });
    featuresB.forEach(function(feature) {
      feature.set(trackField, 'B');
    });

    var features = featuresA.concat(featuresB, featuresC);

    // both features and field must be provided
    expect(osTrack.splitIntoTracks({
      features: features
    }).length).toBe(0);
    expect(osTrack.splitIntoTracks({
      field: trackField
    }).length).toBe(0);

    var tracks = osTrack.splitIntoTracks({
      features: features,
      field: trackField
    });

    // featuresA and featuresB merged into tracks, featuresC added directly because they don't contain the track field
    expect(tracks.length).toBe(2 + featuresC.length);
    expect(tracks[0].get(RecordField.FEATURE_TYPE)).toBe(osTrack.ID);
    expect(tracks[1].get(RecordField.FEATURE_TYPE)).toBe(osTrack.ID);

    for (var i = 2; i < tracks.length; i++) {
      expect(tracks[i]).toBe(featuresC[i - 2]);
    }
  });

  it('truncates a track to a fixed size', function() {
    var features = generateFeatures(20, RecordField.TIME, Date.now());
    var track = osTrack.createTrack({
      features: features,
      includeMetadata: true
    });

    var geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);

    var metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(20);

    var lastTimeValue = geometry.flatCoordinates[geometry.flatCoordinates.length - 1];

    // does nothing if the size is greater than the number of coordinates
    osTrack.truncate(track, 50);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1]).toBe(lastTimeValue);

    metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(20);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // truncates to the number of coordinates specified
    osTrack.truncate(track, 10);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(10 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1]).toBe(lastTimeValue);

    metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(10);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // truncates to zero if a negative value is provided
    osTrack.truncate(track, 0);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(0);

    metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(0);
  });

  it('clamps a track within a sort range', function() {
    var start = Date.now();
    var features = generateFeatures(20, RecordField.TIME, start);
    var track = osTrack.createTrack({
      features: features,
      includeMetadata: true
    });

    var geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);

    var metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(20);

    var originalCoordinates = geometry.flatCoordinates.slice();

    // does nothing if the clamp range includes the entire track
    osTrack.clamp(track, start, start * sortIncrement * 20);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1])
        .toBe(originalCoordinates[originalCoordinates.length - 1]);

    metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(20);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // clamps the track within the provided sort range
    osTrack.clamp(track, start + sortIncrement * 5, start + sortIncrement * 14);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(10 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.stride - 1])
        .toBe(originalCoordinates[6 * geometry.stride - 1]);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1])
        .toBe(originalCoordinates[15 * geometry.stride - 1]);

    metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(10);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // result is empty if the clamp range does not contain any points
    osTrack.clamp(track, start + sortIncrement * 5 + 1, start + sortIncrement * 5 + 2);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(0);

    metadataMap = track.get(TrackField.METADATA_MAP);
    expect(object.getCount(metadataMap)).toBe(0);
  });
});

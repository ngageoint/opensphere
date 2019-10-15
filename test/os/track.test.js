goog.require('ol.Feature');
goog.require('os.data.RecordField');
goog.require('os.feature.DynamicFeature');
goog.require('os.style');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.track');

describe('os.track', function() {
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
      if (sortField === os.data.RecordField.TIME) {
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
   * @return {!Array<!ol.Feature>}
   */
  var generateFeatures = function(count, sortField, sortStart) {
    var coordinates = generateCoordinates(count, sortField, sortStart);
    return coordinates.map(function(coordinate, idx, arr) {
      var sortValue = coordinate.pop();
      var feature = new ol.Feature(new ol.geom.Point(coordinate));
      if (sortField === os.data.RecordField.TIME) {
        feature.set(sortField, new os.time.TimeInstant(sortValue));
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
    var feature = new ol.Feature({
      field1: 'value1',
      field2: 'value2'
    });

    expect(os.track.getFeatureValue('field1', feature)).toBe('value1');
    expect(os.track.getFeatureValue('field2', feature)).toBe('value2');
    expect(os.track.getFeatureValue('field3', feature)).toBeUndefined();

    expect(os.track.getFeatureValue('field1', undefined)).toBeUndefined();
    expect(os.track.getFeatureValue('field1', null)).toBeUndefined();
  });

  it('gets the start time from a feature', function() {
    var feature = new ol.Feature();
    expect(os.track.getStartTime(feature)).toBeUndefined();

    var now = Date.now();
    feature.set(os.data.RecordField.TIME, new os.time.TimeInstant(now));
    expect(os.track.getStartTime(feature)).toBe(now);

    feature.set(os.data.RecordField.TIME, new os.time.TimeRange(now, now + 1000));
    expect(os.track.getStartTime(feature)).toBe(now);
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

    coordinates.sort(os.track.sortCoordinatesByValue);
    verifyCoordinateSort(coordinates);
  });

  it('gets sorted coordinates from a set of features', function() {
    var testGetTrackCoordinates = function(sortField, sortStart) {
      var features = generateFeatures(20, sortField, sortStart);
      var coordinates = os.track.getTrackCoordinates(features, sortField);
      expect(coordinates.length).toBe(features.length);
      verifyCoordinateSort(coordinates);
    };

    // sorts by time
    testGetTrackCoordinates(os.data.RecordField.TIME, Date.now());

    // sorts by arbitrary sortable values
    testGetTrackCoordinates('testSortField', 0);
  });

  it('does not create a track without features or coordinates', function() {
    var track = os.track.createTrack({});
    expect(track).toBeUndefined();

    track = os.track.createTrack({
      features: []
    });
    expect(track).toBeUndefined();

    track = os.track.createTrack({
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

    var track = os.track.createTrack({
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
    expect(track.get(os.Fields.LOWERCASE_NAME)).toBe(name);
    expect(track.get(os.track.TrackField.SORT_FIELD)).toBe(sortField);
    expect(track.get(os.track.TrackField.METADATA_MAP)).toBeUndefined();

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
    var track = os.track.createTrack({
      features: features
    });

    var actualId = track.getId();
    expect(actualId).toBeDefined();
    expect(track.get(os.Fields.ID)).toBe(actualId);
    expect(track.get(os.Fields.LOWERCASE_NAME)).toBe(actualId);
    expect(track.get(os.track.TrackField.SORT_FIELD)).toBe(os.data.RecordField.TIME);

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
    expect(labelStyle[0]['column']).toBe(os.Fields.LOWERCASE_NAME);
  });

  it('creates a track with metadata from the feature', function() {
    var features = generateFeatures(20, os.data.RecordField.TIME, Date.now());
    var track = os.track.createTrack({
      features: features,
      includeMetadata: true
    });

    var metadataMap = track.get(os.track.TrackField.METADATA_MAP);
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
    var coordinates = generateCoordinates(20, os.data.RecordField.TIME, Date.now());
    var track = os.track.createTrack({
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
    var track = os.track.createTrack({
      features: features,
      sortField: sortField
    });

    expect(track instanceof os.feature.DynamicFeature).toBe(false);
    expect(track.get(os.track.TrackField.SORT_FIELD)).toBe(sortField);

    var geometry = track.getGeometry();
    expect(geometry).toBeDefined();

    var trackCoordinates = geometry.getCoordinates();
    expect(trackCoordinates.length).toBe(features.length);
    verifyCoordinateSort(trackCoordinates);
  });

  it('adds features to an existing track', function() {
    var startTime = Date.now();
    var features = generateFeatures(20, os.data.RecordField.TIME, startTime);
    var track = os.track.createTrack({
      features: features
    });

    // overlap by 2 features to verify those are skipped
    startTime += 18 * 1000;

    var moreFeatures = generateFeatures(20, os.data.RecordField.TIME, startTime);
    var added = os.track.addToTrack({
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
    var features = generateFeatures(20, os.data.RecordField.TIME, startTime);
    var track = os.track.createTrack({
      features: features
    });

    var metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(metadataMap).toBeUndefined();

    // overlap by 2 features to verify those are skipped
    startTime += 18 * 1000;

    var moreFeatures = generateFeatures(20, os.data.RecordField.TIME, startTime);
    os.track.addToTrack({
      features: moreFeatures,
      track: track,
      includeMetadata: true
    });

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(metadataMap).toBeDefined();

    var keys = Object.keys(metadataMap);
    expect(keys.length).toBe(moreFeatures.length);

    for (var i = 0; i < keys; i++) {
      expect(metadataMap[keys[i]][metadataField]).toBe(i);
    }
  });

  it('adds coordinates to an existing track', function() {
    var startTime = Date.now();
    var coordinates = generateCoordinates(20, os.data.RecordField.TIME, startTime);
    var track = os.track.createTrack({
      coordinates: coordinates
    });

    // overlap by 2 coordinates to verify those are skipped
    startTime += 18 * 1000;

    var moreCoordinates = generateCoordinates(20, os.data.RecordField.TIME, startTime);
    var added = os.track.addToTrack({
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
    expect(os.track.splitIntoTracks({}).length).toBe(0);

    var featuresA = generateFeatures(20, os.data.RecordField.TIME, startTime);
    var featuresB = generateFeatures(20, os.data.RecordField.TIME, startTime);
    var featuresC = generateFeatures(20, os.data.RecordField.TIME, startTime);
    featuresA.forEach(function(feature) {
      feature.set(trackField, 'A');
    });
    featuresB.forEach(function(feature) {
      feature.set(trackField, 'B');
    });

    var features = featuresA.concat(featuresB, featuresC);

    // both features and field must be provided
    expect(os.track.splitIntoTracks({
      features: features
    }).length).toBe(0);
    expect(os.track.splitIntoTracks({
      field: trackField
    }).length).toBe(0);

    var tracks = os.track.splitIntoTracks({
      features: features,
      field: trackField
    });

    // featuresA and featuresB merged into tracks, featuresC added directly because they don't contain the track field
    expect(tracks.length).toBe(2 + featuresC.length);
    expect(tracks[0].get(os.data.RecordField.FEATURE_TYPE)).toBe(os.track.ID);
    expect(tracks[1].get(os.data.RecordField.FEATURE_TYPE)).toBe(os.track.ID);

    for (var i = 2; i < tracks.length; i++) {
      expect(tracks[i]).toBe(featuresC[i - 2]);
    }
  });
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 266f3457... feat(track): add/expand track API's

  it('truncates a track to a fixed size', function() {
    var features = generateFeatures(20, os.data.RecordField.TIME, Date.now());
    var track = os.track.createTrack({
<<<<<<< HEAD
<<<<<<< HEAD
      features: features,
      includeMetadata: true
=======
      features: features
>>>>>>> 266f3457... feat(track): add/expand track API's
=======
      features: features,
      includeMetadata: true
>>>>>>> 51985312... fix(track): clean up metadata when truncating tracks
    });

    var geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);

<<<<<<< HEAD
<<<<<<< HEAD
    var metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

=======
>>>>>>> 266f3457... feat(track): add/expand track API's
=======
    var metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

>>>>>>> 51985312... fix(track): clean up metadata when truncating tracks
    var lastTimeValue = geometry.flatCoordinates[geometry.flatCoordinates.length - 1];

    // does nothing if the size is greater than the number of coordinates
    os.track.truncate(track, 50);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1]).toBe(lastTimeValue);

<<<<<<< HEAD
<<<<<<< HEAD
    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

=======
>>>>>>> 266f3457... feat(track): add/expand track API's
=======
    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

<<<<<<< HEAD
>>>>>>> 51985312... fix(track): clean up metadata when truncating tracks
=======
    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

>>>>>>> eeabfa7f... fix(track): clean up metadata when clamping tracks
    // truncates to the number of coordinates specified
    os.track.truncate(track, 10);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(10 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1]).toBe(lastTimeValue);

<<<<<<< HEAD
<<<<<<< HEAD
    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(10);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

<<<<<<< HEAD
=======
>>>>>>> 266f3457... feat(track): add/expand track API's
=======
    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(10);

>>>>>>> 51985312... fix(track): clean up metadata when truncating tracks
=======
>>>>>>> eeabfa7f... fix(track): clean up metadata when clamping tracks
    // truncates to zero if a negative value is provided
    os.track.truncate(track, 0);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(0);
<<<<<<< HEAD
<<<<<<< HEAD

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(0);
  });

  it('clamps a track within a sort range', function() {
    var start = Date.now();
    var features = generateFeatures(20, os.data.RecordField.TIME, start);
    var track = os.track.createTrack({
      features: features,
      includeMetadata: true
    });

    var geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);

    var metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

    var originalCoordinates = geometry.flatCoordinates.slice();

    // does nothing if the clamp range includes the entire track
    os.track.clamp(track, start, start * sortIncrement * 20);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1])
        .toBe(originalCoordinates[originalCoordinates.length - 1]);

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // clamps the track within the provided sort range
    os.track.clamp(track, start + sortIncrement * 5, start + sortIncrement * 14);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(10 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.stride - 1])
        .toBe(originalCoordinates[6 * geometry.stride - 1]);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1])
        .toBe(originalCoordinates[15 * geometry.stride - 1]);

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(10);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // result is empty if the clamp range does not contain any points
    os.track.clamp(track, start + sortIncrement * 5 + 1, start + sortIncrement * 5 + 2);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(0);

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(0);
  });
=======
>>>>>>> b2822792... feat(track): add function to split features into tracks
=======
=======

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(0);
>>>>>>> 51985312... fix(track): clean up metadata when truncating tracks
  });
<<<<<<< HEAD
>>>>>>> 266f3457... feat(track): add/expand track API's
=======

  it('clamps a track within a sort range', function() {
    var start = Date.now();
    var features = generateFeatures(20, os.data.RecordField.TIME, start);
    var track = os.track.createTrack({
      features: features,
      includeMetadata: true
    });

    var geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);

    var metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

    var originalCoordinates = geometry.flatCoordinates.slice();

    // does nothing if the clamp range includes the entire track
    os.track.clamp(track, start, start * sortIncrement * 20);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(20 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1])
        .toBe(originalCoordinates[originalCoordinates.length - 1]);

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(20);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // clamps the track within the provided sort range
    os.track.clamp(track, start + sortIncrement * 5, start + sortIncrement * 14);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(10 * geometry.stride);
    expect(geometry.flatCoordinates[geometry.stride - 1])
        .toBe(originalCoordinates[6 * geometry.stride - 1]);
    expect(geometry.flatCoordinates[geometry.flatCoordinates.length - 1])
        .toBe(originalCoordinates[15 * geometry.stride - 1]);

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(10);

    verifyMetadata(geometry.flatCoordinates, geometry.stride, metadataMap);

    // result is empty if the clamp range does not contain any points
    os.track.clamp(track, start + sortIncrement * 5 + 1, start + sortIncrement * 5 + 2);
    geometry = track.getGeometry();
    expect(geometry.flatCoordinates.length).toBe(0);

    metadataMap = track.get(os.track.TrackField.METADATA_MAP);
    expect(goog.object.getCount(metadataMap)).toBe(0);
  });
>>>>>>> eeabfa7f... fix(track): clean up metadata when clamping tracks
});

goog.require('goog.string');
goog.require('os.data.histo.ColorBin');
goog.require('os.data.xf.DataModel');
goog.require('os.feature');
goog.require('os.histo.DateBinMethod');
goog.require('os.histo.DateBinType');
goog.require('os.histo.NumericBinMethod');
goog.require('os.histo.UniqueBinMethod');
goog.require('os.time.TimeRange');
goog.require('os.time.xf.TimeModel');

import Feature from 'ol/src/Feature.js';

/**
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
var getRandomInRange = function(min, max) {
  return Math.floor(min + (Math.random() * (max - min)));
};


/**
 * @param {number} num
 * @return {Array<string>}
 */
var initRandomStrings = function(num) {
  var arr = [];
  for (var i = 0; i < num; i++) {
    arr.push(goog.string.getRandomString());
  }
  return arr;
};


/**
 * @param {Array} arr
 * @return {string|number}
 */
var chooseRandom = function(arr) {
  return arr[getRandomInRange(0, arr.length - 1)];
};


/**
 * @param {string} field
 * @param {string} type
 * @param {boolean} opt_sec if this is the secondary method
 * @return {os.histo.IBinMethod}
 */
var setupBinMethod = function(field, type, opt_sec) {
  var method;
  switch (type) {
    case 'Date':
      method = new os.histo.DateBinMethod();
      var subType = opt_sec ? os.histo.DateBinType.HOUR : os.histo.DateBinType.MINUTE;
      method.setDateBinType(/** @type {DateBinType} */ (subType));
      method.setField(field);
      break;
    case 'Numeric':
      method = new os.histo.NumericBinMethod();
      method.setWidth(1);
      method.setField(field);
      break;
    default: // string/unique
      method = new os.histo.UniqueBinMethod();
      method.setField(field);
      break;
  }
  return method;
};



/**
 * This runs when an item is added to a group
 * @param {!ColorBin} bin
 * @param {!olFeature} item
 * @return {!os.data.histo.ColorBin}
 * @protected
 *
 * @suppress {checkTypes} To allow [] access on features.
 */
var reduceAdd = function(bin, item) {
  // add bin mapping for color sync
  bin.addItem(item);
  return bin;
};


/**
 * This runs when an item is removed from a group
 * @param {!ColorBin} bin
 * @param {!olFeature} item
 * @return {!os.data.histo.ColorBin}
 * @protected
 *
 * @suppress {checkTypes} To allow [] access on features.
 */
var reduceRemove = function(bin, item) {
  // remove bin mapping used for color sync
  bin.removeItem(item);
  return bin;
};


/**
 * Creates a new bin for a group
 * @return {!ColorBin}
 * @protected
 */
var reduceInit = function() {
  return new os.data.histo.ColorBin('#aaa');
};


/**
 * Creates a new bin for a group
 * @param {!os.histo.Result<!olFeature>} item
 * @return {!ColorBin}
 * @protected
 */
var binMap = function(item) {
  var bin = /** @type {!ColorBin} */ (item.value);
  var items = bin.getItems();

  if (!items || !items.length) {
    return null;
  }

  bin.setKey(item.key);
  return bin;
};


/**
 * @param {Array} features
 * @param {string} field1
 * @param {string} type1
 * @param {string} field2
 * @param {string} type2
 * @return {Object<string, number>}
 */
var runMultiDimKeyConcat = function(features, field1, type1, field2, type2) {
  this.pri = setupBinMethod(field1, type1);
  this.pri.setValueFunction(os.feature.getField);
  this.sec = setupBinMethod(field2, type2, true);
  this.sec.setValueFunction(os.feature.getField);

  var obj = {
    'totalTime': 0,
    'binCount': 0
  };
  var id = field1 + os.data.xf.DataModel.SEPARATOR + field2;
  var combinedAccessor = function(item) {
    return this.pri.getBinKey(this.pri.getValue(item)).toString() + os.data.xf.DataModel.SEPARATOR +
      this.sec.getBinKey(this.sec.getValue(item)).toString();
  };
  var combinedKeyMethod = function(key) {
    return key;
  };

  var model = new os.data.xf.DataModel();
  model.add(features);

  var s = window.performance.now();
  model.addDimension(id, combinedAccessor.bind(this));
  var results = model.groupData(id, combinedKeyMethod, reduceAdd, reduceRemove, reduceInit);
  results = /** @type {!Array<!ColorBin>} */ (results.map(binMap).filter(function(item) {
    return item != undefined;
  }));
  var e = window.performance.now();
  obj['totalTime'] = e - s;
  obj['binCount'] = results.length;
  return obj;
};


/**
 * @param {Array} features
 * @param {string} field1
 * @param {string} type1
 * @param {string} field2
 * @param {string} type2
 * @return {Object<string, number>}
 */
var runMultiDimFilter = function(features, field1, type1, field2, type2) {
  this.pri = setupBinMethod(field1, type1);
  this.pri.setValueFunction(os.feature.getField);
  this.sec = setupBinMethod(field2, type2, true);
  this.sec.setValueFunction(os.feature.getField);

  var obj = {
    'totalTime': 0,
    'binCount': 0
  };

  var model = new os.data.xf.DataModel();
  model.add(features);

  var s = window.performance.now();
  model.addDimension(field1, this.pri.getValue.bind(this.pri));
  model.addDimension(field2, this.sec.getValue.bind(this.sec));

  var results = model.groupData(field1, this.pri.getBinKey.bind(this.pri), reduceAdd, reduceRemove, reduceInit);
  var final = [];
  for (var i = 0; i < results.length; i++) {
    if (results[i] && results[i].value && results[i].value.items[0]) {
      model.clearAllFilters();
      this.pri.filterDimension(model.dimensions[field1], results[i].value.items[0]);
      final = final.concat(model.groupData(field2, this.sec.getBinKey.bind(this.sec),
          reduceAdd, reduceRemove, reduceInit));
    }
  }
  results = /** @type {!Array<!ColorBin>} */ (final.map(binMap).filter(function(item) {
    return item != undefined;
  }));
  var e = window.performance.now();
  obj['totalTime'] = e - s;
  obj['binCount'] = results.length;
  return obj;
};


xdescribe('os.data.xf.binningperf', function() {
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');

  it('should test the performance for multidimensional binning', function() {
    var stringBank = initRandomStrings(50);
    var featureNum = 150000;
    var smallFeatureNum = 100;
    var features = new Array(featureNum);
    var latField = 'LAT';
    var lonField = 'LON';
    var maxAlt = 10000;
    var altField = 'TITLE';
    var stringField1 = 'TITLE';
    var stringField2 = 'DESC';
    var now = new Date().valueOf();
    var yest = now - (1000 * 60 * 60 * 24);
    var timeField = 'TIME';
    var uniqueType = 'Unique';
    var dateType = 'Date';
    var numericType = 'Numeric';

    // init features
    for (var i = 0; i < featureNum; i++) {
      features[i] = new Feature();
      var start = getRandomInRange(yest, now);
      var end = getRandomInRange(start, now);
      var time = new TimeRange(start, end);
      features[i].set(latField, -90 + Math.random() * 180);
      features[i].set(lonField, -180 + Math.random() * 360);
      features[i].set(altField, maxAlt * Math.random());
      features[i].set(stringField1, chooseRandom(stringBank));
      features[i].set(stringField2, chooseRandom(stringBank));
      features[i].set(timeField, time);
    }

    var smallFeat = features.slice(0, smallFeatureNum);

    // Unique Bins
    var obj = runMultiDimKeyConcat(features, stringField1, uniqueType, stringField2, uniqueType);
    var perFeat = obj['totalTime'] / featureNum;
    var perBin = obj['totalTime'] / obj['binCount'];
    console.log('MultiDimKey Unique: ' + obj['binCount'] + '\nTime Per Bin: ' + perBin +
        '\nTime Per Feature: ' + perFeat);
    expect(perFeat < .05).toBe(true);
    obj = runMultiDimFilter(smallFeat, stringField1, uniqueType, stringField2, uniqueType);
    perFeat = obj['totalTime'] / smallFeatureNum;
    perBin = obj['totalTime'] / obj['binCount'];
    console.log('MultiDimFilter Unique: ' + obj['binCount'] + '\nTime Per Bin: ' + perBin +
        '\nTime Per Feature: ' + perFeat);

    // Numeric Bins
    obj = runMultiDimKeyConcat(features, lonField, numericType, latField, numericType);
    perFeat = obj['totalTime'] / featureNum;
    perBin = obj['totalTime'] / obj['binCount'];
    console.log('MultiDimKey Numeric: ' + obj['binCount'] + '\nTime Per Bin: ' + perBin +
        '\nTime Per Feature: ' + perFeat);
    expect(perFeat < .05).toBe(true);
    obj = runMultiDimFilter(smallFeat, lonField, numericType, latField, numericType);
    perFeat = obj['totalTime'] / smallFeatureNum;
    perBin = obj['totalTime'] / obj['binCount'];
    console.log('MultiDimFilter Numeric: ' + obj['binCount'] + '\nTime Per Bin: ' + perBin +
        '\nTime Per Feature: ' + perFeat);

    // Date Bins
    obj = runMultiDimKeyConcat(features, timeField, dateType, timeField, dateType);
    perFeat = obj['totalTime'] / featureNum;
    perBin = obj['totalTime'] / obj['binCount'];
    console.log('MultiDimKey Date: ' + obj['binCount'] + '\nTime Per Bin: ' + perBin +
        '\nTime Per Feature: ' + perFeat);
    expect(perFeat < .05).toBe(true);
    obj = runMultiDimFilter(smallFeat, timeField, dateType, timeField, dateType);
    perFeat = obj['totalTime'] / smallFeatureNum;
    perBin = obj['totalTime'] / obj['binCount'];
    console.log('MultiDimFilter Date: ' + obj['binCount'] + '\nTime Per Bin: ' + perBin +
        '\nTime Per Feature: ' + perFeat);
  });
});

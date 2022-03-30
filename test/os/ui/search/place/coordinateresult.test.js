goog.require('os.implements');
goog.require('os.search.ISortableResult');
goog.require('os.search.SortType');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.search.place.CoordinateResult');

import Feature from 'ol/src/Feature.js';

describe('os.ui.search.place.CoordinateResult', function() {
  const {default: osImplements} = goog.module.get('os.implements');
  const {default: ISortableResult} = goog.module.get('os.search.ISortableResult');
  const {default: SortType} = goog.module.get('os.search.SortType');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');
  const {default: CoordinateResult} = goog.module.get('os.ui.search.place.CoordinateResult');

  var createResult = function(opt_options) {
    var options = opt_options || {};
    var featureOptions = options.featureOptions || {};
    var feature = new Feature(featureOptions);

    var label = options.label != null ? options.label : undefined;
    var score = options.score != null ? options.score : 0;
    return new CoordinateResult(feature, label, score);
  };

  describe('os.search.ISortableResult', function() {
    it('implements the sortable result interface', function() {
      var result = createResult();
      expect(osImplements(result, ISortableResult.ID)).toBe(true);
    });

    it('gets sort values for the title', function() {
      expect(createResult().getSortValue(SortType.TITLE)).toBeNull();
      expect(createResult({
        featureOptions: {
          name: 'testTitle'
        }
      }).getSortValue(SortType.TITLE)).toBe('testTitle');
      expect(createResult({
        featureOptions: {
          title: 'testTitle'
        }
      }).getSortValue(SortType.TITLE)).toBe('testTitle');
    });

    it('gets sort values for the date', function() {
      expect(createResult().getSortValue(SortType.DATE)).toBeNull();
      expect(createResult({
        featureOptions: {
          recordTime: Date.now()
        }
      }).getSortValue(SortType.DATE)).toBeNull();

      var start = Date.now();
      var end = start + 1000;

      expect(createResult({
        featureOptions: {
          recordTime: new TimeInstant(start)
        }
      }).getSortValue(SortType.DATE)).toBe(String(start));

      expect(createResult({
        featureOptions: {
          recordTime: new TimeRange(start, end)
        }
      }).getSortValue(SortType.DATE)).toBe(String(start));
    });
  });
});

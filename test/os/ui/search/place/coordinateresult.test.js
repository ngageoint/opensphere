goog.require('ol.Feature');
goog.require('os.search.ISortableResult');
goog.require('os.search.SortType');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.search.place.CoordinateResult');

describe('os.ui.search.place.CoordinateResult', function() {
  var createResult = function(opt_options) {
    var options = opt_options || {};
    var featureOptions = options.featureOptions || {};
    var feature = new ol.Feature(featureOptions);

    var label = options.label != null ? options.label : undefined;
    var score = options.score != null ? options.score : 0;
    return new os.ui.search.place.CoordinateResult(feature, label, score);
  };

  describe('os.search.ISortableResult', function() {
    it('implements the sortable result interface', function() {
      var result = createResult();
      expect(os.implements(result, os.search.ISortableResult.ID)).toBe(true);
    });

    it('gets sort values for the title', function() {
      expect(createResult().getSortValue(os.search.SortType.TITLE)).toBeNull();
      expect(createResult({
        featureOptions: {
          name: 'testTitle'
        }
      }).getSortValue(os.search.SortType.TITLE)).toBe('testTitle');
      expect(createResult({
        featureOptions: {
          title: 'testTitle'
        }
      }).getSortValue(os.search.SortType.TITLE)).toBe('testTitle');
    });

    it('gets sort values for the date', function() {
      expect(createResult().getSortValue(os.search.SortType.DATE)).toBeNull();
      expect(createResult({
        featureOptions: {
          recordTime: Date.now()
        }
      }).getSortValue(os.search.SortType.DATE)).toBeNull();

      var start = Date.now();
      var end = start + 1000;

      expect(createResult({
        featureOptions: {
          recordTime: new os.time.TimeInstant(start)
        }
      }).getSortValue(os.search.SortType.DATE)).toBe(String(start));

      expect(createResult({
        featureOptions: {
          recordTime: new os.time.TimeRange(start, end)
        }
      }).getSortValue(os.search.SortType.DATE)).toBe(String(start));
    });
  });
});

goog.require('os.ui.filter.parse.FilterParser');
goog.require('goog.dom.xml');
goog.require('goog.net.XhrIo');


describe('os.ui.filter.parse.FilterParser', function() {
  var filtersUrl = '/base/test/os/ui/filter/parse/filters.xml';
  var stateUrl = '/base/test/os/ui/filter/parse/state.xml';
  var parser = new os.ui.filter.parse.FilterParser();

  var requestFilters = function(url, waitsFn) {
    var xhr = new goog.net.XhrIo();
    var response = null;

    xhr.listen(goog.net.EventType.SUCCESS, function() {
      response = xhr.getResponse();
    }, false);

    runs(function() {
      xhr.send(url);
    });

    waitsFor(function() {
      return response != null;
    }, 'test query to load');

    runs(function() {
      waitsFn(response);
    });
  };

  it('should extract filters from a filter file', function() {
    var filterFn = function(filterString) {
      var ele = goog.dom.xml.loadXml(filterString);
      var filters = parser.extractFromFilters(ele.firstChild);
      expect(filters.length).toBe(3);

      expect(filters[0].getTitle()).toBe('TOI Filter');
      expect(filters[0].type).toBe('LAYER_1');

      expect(filters[1].getTitle()).toBe('NUM Filter');
      expect(filters[1].type).toBe('LAYER_2');

      expect(filters[2].getTitle()).toBe('ALT Filter');
      expect(filters[2].type).toBe('LAYER_3');
    };

    requestFilters(filtersUrl, filterFn);
  });

  it('should extract filters from a state file', function() {
    var stateFn = function(filterString) {
      var ele = goog.dom.xml.loadXml(filterString);
      var filters = parser.extractFromFilters(ele.firstChild);
      expect(filters.length).toBe(2);

      expect(filters[0].getTitle()).toBe('State Filter 1');
      expect(filters[0].type).toBe('LAYER_4');

      expect(filters[1].getTitle()).toBe('State Filter 2');
      expect(filters[1].type).toBe('LAYER_5');
    };

    requestFilters(stateUrl, stateFn);
  });
});

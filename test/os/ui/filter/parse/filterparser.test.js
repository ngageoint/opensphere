goog.require('goog.dom.xml');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('os.ui.filter.parse.FilterParser');


describe('os.ui.filter.parse.FilterParser', function() {
  const xml = goog.module.get('goog.dom.xml');
  const EventType = goog.module.get('goog.net.EventType');
  const XhrIo = goog.module.get('goog.net.XhrIo');
  const {default: FilterParser} = goog.module.get('os.ui.filter.parse.FilterParser');

  var filtersUrl = '/base/test/os/ui/filter/parse/filters.xml';
  var stateUrl = '/base/test/os/ui/filter/parse/state.xml';
  var parser = new FilterParser();

  var requestFilters = function(url, waitsFn) {
    var xhr = new XhrIo();
    var response = null;

    xhr.listen(EventType.SUCCESS, function() {
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
      var ele = xml.loadXml(filterString);
      var filters = parser.extractFromFilters(ele.firstChild);
      expect(filters.length).toBe(3);

      expect(filters[0].getTitle()).toBe('TOI Filter');
      expect(filters[0].type).toBe('https://fake.url.com/ogc!!LAYER_1');

      expect(filters[1].getTitle()).toBe('NUM Filter');
      expect(filters[1].type).toBe('https://fake.url.com/ogc!!LAYER_2');

      expect(filters[2].getTitle()).toBe('ALT Filter');
      expect(filters[2].type).toBe('https://fake.url.com/ogc!!LAYER_3');
    };

    requestFilters(filtersUrl, filterFn);
  });

  it('should extract filters from a state file', function() {
    var stateFn = function(filterString) {
      var ele = xml.loadXml(filterString);
      var filters = parser.extractFromFilters(ele.firstChild);
      expect(filters.length).toBe(2);

      expect(filters[0].getTitle()).toBe('State Filter 1');
      expect(filters[0].type).toBe('default#LAYER_4#features');

      expect(filters[1].getTitle()).toBe('State Filter 2');
      expect(filters[1].type).toBe('default#LAYER_5#features');
    };

    requestFilters(stateUrl, stateFn);
  });
});

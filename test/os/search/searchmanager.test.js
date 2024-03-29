goog.require('os.alert.AlertManager');
goog.require('os.search.MockSearch');
goog.require('os.search.SearchEventType');
goog.require('os.search.SearchManager');
goog.require('os.structs.EventType');

describe('os.search.SearchManager', function() {
  const {default: AlertManager} = goog.module.get('os.alert.AlertManager');
  const MockSearch = goog.module.get('os.search.MockSearch');
  const {default: SearchEventType} = goog.module.get('os.search.SearchEventType');
  const {default: SearchManager} = goog.module.get('os.search.SearchManager');
  const {default: EventType} = goog.module.get('os.structs.EventType');

  var alertManager = AlertManager.getInstance();

  var mockSearch1;
  var mockSearch2;

  beforeEach(function() {
    mockSearch1 = new MockSearch('test1', 'Search Web', 'val1', 50);
    mockSearch2 = new MockSearch('test2', 'Search Images', 'val2', 100);
  });

  it('should have a singleton instance', function() {
    expect(SearchManager.getInstance).toBeDefined();
    expect(SearchManager.getInstance()).not.toBeNull();
  });

  it('should fire off an alert when no manager is registered', function() {
    alertManager.clearAlerts();
    expect(alertManager.savedAlerts_.getCount()).toBe(0);
    alertManager.listenOnce(EventType.ALERT, function(e) {
      expect(alertManager.savedAlerts_.getCount()).toBe(1);
    }, false, this);
    SearchManager.getInstance().search('test', 0, 10);
  });

  it('should register searches', function() {
    var searchManager = new SearchManager();
    expect(searchManager.getRegisteredSearches().length).toBe(0);
    searchManager.registerSearch(mockSearch1);
    expect(searchManager.getRegisteredSearches().length).toBe(1);
    expect(searchManager.getRegisteredSearches()[0].getName()).toBe('Search Web');

    searchManager.registerSearch(mockSearch2);
    expect(searchManager.getRegisteredSearches().length).toBe(2);
  });

  xit('should set selected search', function() {
    var searchManager = new SearchManager();
    expect(searchManager.selectedSearch_).toBeFalsy();
    searchManager.registerSearch(mockSearch1);
    expect(searchManager.selectedSearch_).toBe('Search Web');
    searchManager.registerSearch(mockSearch2);
    expect(searchManager.selectedSearch_).toBe('Search Web');

    // not registered
    searchManager.setSelectedSearch('Search Reports');
    expect(searchManager.selectedSearch_).toBe('Search Web');

    // registered
    searchManager.setSelectedSearch('Search Images');
    expect(searchManager.selectedSearch_).toBe('Search Images');
  });

  it('should capture search results', function() {
    var searchManager = new SearchManager();
    searchManager.registerSearch(new MockSearch());
    searchManager.search('test', 0, 10);
    expect(searchManager.getResults().length).toBe(10);
  });

  it('should capture autocomplete results', function() {
    var searchManager = new SearchManager();
    searchManager.registerSearch(new MockSearch());

    var results = [];
    searchManager.listenOnce(SearchEventType.AUTOCOMPLETED, function(event) {
      results = event.getResults();
    });

    searchManager.autocomplete('test', 10);
    waitsFor(function() {
      return results.length > 0;
    }, 'autocomplete results');

    expect(results.length).toBe(10);
  });

  it('should capture results from selected search', function() {
    var searchManager = new SearchManager();
    searchManager.registerSearch(mockSearch1);
    searchManager.registerSearch(mockSearch2);

    searchManager.search('test', 0, 10);

    var results = searchManager.getResults();
    expect(results.length).toBe(20);

    // both returned results, second search has a higher score
    for (var i = 0; i < 10; i++) {
      expect(results[i].value).toBe('val2');
      expect(results[i + 10].value).toBe('val1');
    }

    mockSearch1.setEnabled(false);

    searchManager.search('test', 0, 10);

    var results = searchManager.getResults();
    expect(results.length).toBe(10);

    // only the second search was executed
    for (var i = 0; i < results.length; i++) {
      expect(results[i].value).toBe('val2');
    }

    mockSearch1.setEnabled(true);
    mockSearch2.setEnabled(false);

    searchManager.search('test', 0, 10);

    // only the first search was executed
    var results = searchManager.getResults();
    expect(results.length).toBe(10);

    for (var i = 0; i < results.length; i++) {
      expect(results[i].value).toBe('val1');
    }
  });

  it('should properly mix results as reported by search providers', function() {
    var providerA = new MockSearch('a', 'A', 'valueA', 95);
    var providerB = new MockSearch('b', 'B', 'valueB', 90);
    var searchManager = new SearchManager();
    searchManager.registerSearch(providerA);
    searchManager.registerSearch(providerB);
    searchManager.search('test', 1, 10);

    var results = searchManager.getResults();
    expect(results.length).toBe(20);

    for (var i = 0; i < 10; i++) {
      expect(results[i].value).toBe('valueA');
      expect(results[i + 10].value).toBe('valueB');
    }
  });
});

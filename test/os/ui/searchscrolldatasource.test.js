goog.require('os.search.MockSearch');
goog.require('os.search.SearchManager');
goog.require('os.ui.search.SearchScrollDataSource');


describe('os.ui.search.SearchScrollDataSource', function() {
  const SearchManager = goog.module.get('os.search.SearchManager');
  const {default: SearchScrollDataSource} = goog.module.get('os.ui.search.SearchScrollDataSource');
  const MockSearch = goog.module.get('os.search.MockSearch');

  var searchScrollDataSource = new SearchScrollDataSource();
  var searchManager = new SearchManager();


  var results = undefined;
  var onSearchSuccess = function(data) {
    results = data;
  };

  beforeEach(function() {
    results = undefined;

    searchScrollDataSource.setDataSource(searchManager);
    searchScrollDataSource.setTerm('unit test search term');
  });

  it('sets up the search manager', function() {
    searchManager.registerSearch(new MockSearch('Mock Search', 'Mock Search Result '));
  });

  it('should return an empty array when no results found', function() {
    runs(function() {
      searchScrollDataSource.getData(5, 0, onSearchSuccess);
    });

    waitsFor(function() {
      return results != undefined;
    }, 'search success event to be dispatched');

    runs(function() {
      expect(results).not.toBeUndefined();
      expect(results instanceof Array).toBeTruthy();
      expect(results.length).toBe(0);
    });
  });


  it('should properly handle negative indices', function() {
    runs(function() {
      searchScrollDataSource.getData(0, 10, onSearchSuccess);
    });

    waitsFor(function() {
      return results != undefined;
    }, 'search success event to be dispatched');

    runs(function() {
      expect(results).not.toBeUndefined();
      expect(results instanceof Array).toBeTruthy();
      expect(results.length).toBe(9);
    });
  });


  it('should return an empty array when no term provided', function() {
    searchScrollDataSource.setTerm('');
    runs(function() {
      searchScrollDataSource.getData(5, 10, onSearchSuccess);
    });

    waitsFor(function() {
      return results != undefined;
    }, 'search success event to be dispatched');

    runs(function() {
      expect(results).not.toBeUndefined();
      expect(results instanceof Array).toBeTruthy();
      expect(results.length).toBe(0);
    });
  });

  it('should return an empty array when no data source provided', function() {
    searchScrollDataSource.setDataSource(undefined);
    runs(function() {
      searchScrollDataSource.getData(5, 10, onSearchSuccess);
    });

    waitsFor(function() {
      return results != undefined;
    }, 'search success event to be dispatched');

    runs(function() {
      expect(results).not.toBeUndefined();
      expect(results instanceof Array).toBeTruthy();
      expect(results.length).toBe(0);
    });
  });

  it('should produce search results', function() {
    runs(function() {
      searchScrollDataSource.getData(1, 10, onSearchSuccess);
    });

    waitsFor(function() {
      return results != undefined;
    }, 'search success event to be dispatched');

    runs(function() {
      expect(results).not.toBeUndefined();
      expect(results instanceof Array).toBeTruthy();
      expect(results.length).toBe(10);
    });
  });
});

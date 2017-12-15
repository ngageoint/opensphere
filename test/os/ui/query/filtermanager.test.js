goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.query.AreaManager');
goog.require('os.ui.query.QueryManager');

describe('os.ui.filter.FilterManager', function() {
  var fm = null;
  beforeEach(function() {
    fm = os.ui.filter.FilterManager.getInstance();
  });

  it('should work correctly when empty', function() {
    expect(fm.getFilters()).toBe(null);
    expect(fm.hasFilters()).toBe(false);
    expect(fm.hasEnabledFilters()).toBe(false);
    expect(fm.getGrouping('whatevs')).toBe(true);
  });

  it('should add a filter', function() {
    var filter = new os.filter.FilterEntry();
    filter.type = 'TypeA';
    filter.title = 'Filter A';
    filter.setFilter('La la la');

    fm.addFilter(filter);

    filter = new os.filter.FilterEntry();
    filter.type = 'TypeB';
    filter.title = 'Filter B';
    filter.setFilter('da da da');

    fm.addFilter(filter);

    expect(fm.getFilters().length).toBe(2);
    expect(fm.getFilters('TypeA').length).toBe(1);
    expect(fm.getFilters('TypeB').length).toBe(1);
  });

  it('should report booleans correctly', function() {
    expect(fm.hasFilters()).toBe(true);
    expect(fm.hasFilters('TypeA')).toBe(true);
    expect(fm.hasFilters('TypeB')).toBe(true);
    expect(fm.hasFilters('bogus')).toBe(false);

    // this is now tied to the query manager, which we won't test here
    expect(fm.hasEnabledFilters()).toBe(false);
    expect(fm.hasEnabledFilters('TypeA')).toBe(false);
    expect(fm.hasEnabledFilters('TypeB')).toBe(false);
  });

  it('should set groupings on types', function() {
    fm.setGrouping('TypeA', false);
    expect(fm.getGrouping('TypeA')).toBe(false);
  });

  it('should clear', function() {
    fm.clear();
    expect(fm.getFilters()).toBe(null);
  });
});

goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter.FilterType');


describe('os.ui.filter.FilterType', function() {
  it('should persist and restore properly', function() {
    var a = new os.ui.filter.FilterType();
    var filter = new os.filter.FilterEntry();
    filter.title = 'Test';
    filter.description = 'A test';
    filter.type = 'TypeA';
    filter.setFilter('La la la');

    a.filters.push(filter);
    a.and = false;

    var p = a.persist();

    expect(p.and).toBe(a.and);
    expect(p.filters.length).toBe(1);
    expect(p.filters[0].id).toBe(filter.getId());

    var b = new os.ui.filter.FilterType();
    b.restore(p);

    expect(b.and).toBe(a.and);
    expect(b.filters.length).toBe(1);
    expect(b.filters[0].getId()).toBe(filter.getId());
  });
});

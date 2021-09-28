goog.require('os.filter.FilterEntry');
goog.require('os.filter.FilterType');


describe('os.filter.FilterType', function() {
  const {default: FilterEntry} = goog.module.get('os.filter.FilterEntry');
  const {default: FilterType} = goog.module.get('os.filter.FilterType');

  it('should persist and restore properly', function() {
    var a = new FilterType();
    var filter = new FilterEntry();
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

    var b = new FilterType();
    b.restore(p);

    expect(b.and).toBe(a.and);
    expect(b.filters.length).toBe(1);
    expect(b.filters[0].getId()).toBe(filter.getId());
  });
});

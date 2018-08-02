goog.require('os.data.BaseDescriptor');
goog.require('os.data.groupby.DateGroupBy');
goog.require('os.ui.data.DescriptorNode');


describe('os.data.groupby.DateGroupBy', function() {
  var by = new os.data.groupby.DateGroupBy();

  it('should retrieve ids by date', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    // if you set it *right at* 5 minutes then you run the risk of occasionally
    // failing the test if the init runs in the next ms
    d.setMaxDate(goog.now() - 5 * 59 * 1000);
    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('01Last 5 Minutes');
    expect(ids.length).toBe(1);
  });

  it('should handle nodes without a date', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('zzCould not determine activity');
    expect(ids.length).toBe(1);
  });

  it('should handle nodes with a date in the future', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    d.setMaxDate(goog.now() + 5 * 60 * 1000);
    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('xxReports future activity');
    expect(ids.length).toBe(1);
  });

  it('should handle nodes with a date too old to be recent', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    d.setMaxDate(goog.now() - 61 * 24 * 60 * 60 * 1000);
    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('yyNo recent activity');
    expect(ids.length).toBe(1);
  });

  it('should create groups properly', function() {
    [{id: '99Last 5 Minutes', label: 'Last 5 Minutes'},
      {id: 'xxReports future activity', label: 'Reports future activity'},
      {id: 'yyNo recent activity', label: 'No recent activity'},
      {id: 'zzCould not determine activity', label: 'Could not determine activity'}
    ].forEach(function(item) {
      var group = by.createGroup(null, item.id);
      expect(group.getId()).toBe(item.id);
      expect(group.getLabel()).toBe(item.label);
    });
  });
});

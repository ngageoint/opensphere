goog.require('os.data.BaseDescriptor');
goog.require('os.data.groupby.TypeGroupBy');
goog.require('os.ui.data.DescriptorNode');


describe('os.data.groupby.TypeGroupBy', function() {
  it('should retrieve ids by type', function() {
    var d = new os.data.BaseDescriptor();
    d.setType('Test Type');

    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    var by = new os.data.groupby.TypeGroupBy();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('Test Type');
    expect(ids.length).toBe(1);
  });

  it('should handle nodes without a type', function() {
    var d = new os.data.BaseDescriptor();

    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    var by = new os.data.groupby.TypeGroupBy();
    var ids = by.getGroupIds(node);

    expect(ids).toContain('No Type');
  });

  it('should handle things that are not nodes', function() {
    var by = new os.data.groupby.TypeGroupBy();
    var node = {};
    var ids = by.getGroupIds(node);

    expect(ids).toContain('No Type');

    node = {
      getType: function() {
        return 'Test Type';
      }
    };

    ids = by.getGroupIds(node);
    expect(ids).toContain('Test Type');
    expect(ids.length).toBe(1);

    node = {
      type: 'Test Type'
    };

    ids = by.getGroupIds(node);
    expect(ids).toContain('Test Type');
    expect(ids.length).toBe(1);
  });

  it('should create groups properly', function() {
    var by = new os.data.groupby.TypeGroupBy();
    var group = by.createGroup(null, 'Test Type');

    expect(group.getId()).toBe('Test Type');
    expect(group.getLabel()).toBe('Test Type');
  });
});

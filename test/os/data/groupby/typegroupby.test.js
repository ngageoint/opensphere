goog.require('os.data.BaseDescriptor');
goog.require('os.data.groupby.TypeGroupBy');
goog.require('os.ui.data.DescriptorNode');


describe('os.data.groupby.TypeGroupBy', function() {
  const BaseDescriptor = goog.module.get('os.data.BaseDescriptor');
  const TypeGroupBy = goog.module.get('os.data.groupby.TypeGroupBy');
  const {default: DescriptorNode} = goog.module.get('os.ui.data.DescriptorNode');

  it('should retrieve ids by type', function() {
    var d = new BaseDescriptor();
    d.setType('Test Type');

    var node = new DescriptorNode();
    node.setDescriptor(d);

    var by = new TypeGroupBy();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('Test Type');
    expect(ids.length).toBe(1);
  });

  it('should handle nodes without a type', function() {
    var d = new BaseDescriptor();

    var node = new DescriptorNode();
    node.setDescriptor(d);

    var by = new TypeGroupBy();
    var ids = by.getGroupIds(node);

    expect(ids).toContain('No Type');
  });

  it('should handle things that are not nodes', function() {
    var by = new TypeGroupBy();
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
    var by = new TypeGroupBy();
    var group = by.createGroup(null, 'Test Type');

    expect(group.getId()).toBe('Test Type');
    expect(group.getLabel()).toBe('Test Type');
  });
});

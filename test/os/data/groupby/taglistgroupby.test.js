goog.require('os.data.BaseDescriptor');
goog.require('os.data.groupby.TagListGroupBy');
goog.require('os.structs.TriStateTreeNode');
goog.require('os.ui.data.DescriptorNode');


describe('os.data.groupby.TagListGroupBy', function() {
  var by = new os.data.groupby.TagListGroupBy();

  it('should not retrieve ids if the list is empty', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    d.setTags(['test', 'one', 'two']);
    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('zNot Specified');
    expect(ids.length).toBe(1);
  });

  it('should setup', function() {
    os.settings.set('tagList', ['one', 'two', 'three']);
  });

  it('should retrieve ids if the descriptor contains a tag', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    d.setTags(['test', 'one', 'two']);
    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('aONE');
    expect(ids).toContain('aTWO');
    expect(ids.length).toBe(2);
  });

  it('it should retrieve ids from the parent if the node has no tags', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    var parent = new os.structs.TriStateTreeNode();
    parent.getTags = function() {
      return ['test', 'one', 'two'];
    };

    parent.addChild(node);

    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('aONE');
    expect(ids).toContain('aTWO');
    expect(ids.length).toBe(2);
  });

  it('should not retrieve ids if the list tags are not present', function() {
    var d = new os.data.BaseDescriptor();
    var node = new os.ui.data.DescriptorNode();
    node.setDescriptor(d);

    d.setTags(['test', 'other']);
    by.init();
    var ids = by.getGroupIds(node);

    expect(ids).not.toBe(null);
    expect(ids).toContain('zNot Specified');
    expect(ids.length).toBe(1);
  });
});

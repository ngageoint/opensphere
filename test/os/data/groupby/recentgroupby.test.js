goog.require('os.data.BaseDescriptor');
goog.require('os.data.groupby.RecentGroupBy');
goog.require('os.ui.data.DescriptorNode');


describe('os.data.groupby.RecentGroupBy', function() {
  var d = new os.data.BaseDescriptor();

  var node = new os.ui.data.DescriptorNode();
  node.setDescriptor(d);

  var by = new os.data.groupby.RecentGroupBy();
  by.testDate_ = new Date(2014, 6, 2);
  var t = by.testDate_.getTime();
  by.init();

  it('should properly bin nodes that were active today', function() {
    d.lastActive_ = t;

    var ids = by.getGroupIds(node);

    expect(ids.length).toBe(1);
    expect(ids).toContain('0Today');
  });

  it('should properly bin nodes that were active yesterday', function() {
    d.lastActive_ = t - 24 * 60 * 60 * 1000;

    var ids = by.getGroupIds(node);

    expect(ids.length).toBe(1);
    expect(ids).toContain('1Yesterday');
  });

  it('should properly bin nodes that were active this week', function() {
    d.lastActive_ = t - 2 * 24 * 60 * 60 * 1000;

    var ids = by.getGroupIds(node);

    expect(ids.length).toBe(1);
    expect(ids).toContain('2This Week');
  });

  it('should properly bin nodes that were active last week', function() {
    d.lastActive_ = t - 7 * 24 * 60 * 60 * 1000;

    var ids = by.getGroupIds(node);

    expect(ids.length).toBe(1);
    expect(ids).toContain('3Last Week');
  });

  it('should properly bin nodes that were active 2weeks ago', function() {
    d.lastActive_ = t - 14 * 24 * 60 * 60 * 1000;

    var ids = by.getGroupIds(node);

    expect(ids.length).toBe(1);
    expect(ids).toContain('42 Weeks Ago');
  });

  it('should ignore anything that is not a descriptor node', function() {
    var ids = by.getGroupIds('test');
    expect(ids).not.toBe(null);
    expect(ids.length).toBe(0);
  });

  it('should correctly label groups', function() {
    var group = by.createGroup(null, '3Last Week');
    expect(group.getId()).toBe('3Last Week');
    expect(group.getLabel()).toBe('Last Week');
  });

  it('should typically use the current date at time of init', function() {
    var now = goog.now();
    by.testDate_ = null;
    by.init();

    expect(by.times_.length).not.toBe(0);
    expect(by.times_[0].time - now).toBeLessThan(500);
  });

  it('should dispose its times', function() {
    by.dispose();
    expect(by.times_.length).toBe(0);
  });
});

goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.slick.SlickTreeNode');

describe('os.ui.data.groupby.TagGroupBy', function() {
  it('should group nodes by tag', function() {
    var withTags = new os.ui.slick.SlickTreeNode();
    withTags.getTags = function() {
      return ['tag'];
    };

    var withoutTags = new os.ui.slick.SlickTreeNode();
    withoutTags.getTags = function() {
      return null;
    };

    var by = new os.ui.data.groupby.TagGroupBy();
    by.init();

    expect(by.getGroupIds(withTags)).toContain('aTAG');
    expect(by.getGroupIds(withoutTags)).toContain('zNo Tags');
  });
});

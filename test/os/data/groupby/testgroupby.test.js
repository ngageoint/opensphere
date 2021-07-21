goog.require('os.ui.data.groupby.TagGroupBy');
goog.require('os.ui.slick.SlickTreeNode');

describe('os.ui.data.groupby.TagGroupBy', function() {
  const TagGroupBy = goog.module.get('os.ui.data.groupby.TagGroupBy');
  const SlickTreeNode = goog.module.get('os.ui.slick.SlickTreeNode');

  it('should group nodes by tag', function() {
    var withTags = new SlickTreeNode();
    withTags.getTags = function() {
      return ['tag'];
    };

    var withoutTags = new SlickTreeNode();
    withoutTags.getTags = function() {
      return null;
    };

    var by = new TagGroupBy();
    by.init();

    expect(by.getGroupIds(withTags)).toContain('aTAG');
    expect(by.getGroupIds(withoutTags)).toContain('zNo Tags');
  });
});

goog.require('os.search.AbstractSearchResult');

describe('os.search.AbstractSearchResult', function() {
  it('auto increments ids when not specified', function() {
    os.search.AbstractSearchResult.nextId_ = 0;

    // no id provided
    expect(new os.search.AbstractSearchResult().getId()).toBe(0);
    expect(new os.search.AbstractSearchResult().getId()).toBe(1);
    expect(new os.search.AbstractSearchResult().getId()).toBe(2);

    // empty string provided
    expect(new os.search.AbstractSearchResult(null, 0, '').getId()).toBe(3);
    expect(new os.search.AbstractSearchResult(null, 0, '').getId()).toBe(4);

    // null provided
    expect(new os.search.AbstractSearchResult(null, 0, null).getId()).toBe(5);
    expect(new os.search.AbstractSearchResult(null, 0, null).getId()).toBe(6);
  });

  it('sets the id from parameters', function() {
    os.search.AbstractSearchResult.nextId_ = 10;

    expect(new os.search.AbstractSearchResult(null, 0, 0).getId()).toBe(0);
    expect(new os.search.AbstractSearchResult(null, 0, 100).getId()).toBe(100);
    expect(new os.search.AbstractSearchResult(null, 0, 'testId').getId()).toBe('testId');

    // no id provided uses the next id
    expect(new os.search.AbstractSearchResult().getId()).toBe(10);
  });

  it('sets the score from parameters', function() {
    expect(new os.search.AbstractSearchResult().getScore()).toBe(0);
    expect(new os.search.AbstractSearchResult(null, null).getScore()).toBe(0);
    expect(new os.search.AbstractSearchResult(null, 100).getScore()).toBe(100);
  });

  it('sets the score', function() {
    var result = new os.search.AbstractSearchResult();
    expect(result.getScore()).toBe(0);

    result.setScore(100);
    expect(result.getScore()).toBe(100);
  });

  it('sets the result from parameters', function() {
    var data = {};
    expect(new os.search.AbstractSearchResult().getResult()).toBeUndefined();
    expect(new os.search.AbstractSearchResult(null).getResult()).toBeNull();
    expect(new os.search.AbstractSearchResult(data).getResult()).toBe(data);
  });

  it('sets the result', function() {
    var data = {};
    var result = new os.search.AbstractSearchResult();
    expect(result.getResult()).toBeUndefined();

    result.setResult(data);
    expect(result.getResult()).toBe(data);
  });
});

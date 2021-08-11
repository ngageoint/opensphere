goog.require('os.search.AbstractSearchResult');

describe('os.search.AbstractSearchResult', function() {
  const AbstractSearchResult = goog.module.get('os.search.AbstractSearchResult');

  it('auto increments ids when not specified', function() {
    AbstractSearchResult.nextId_ = 0;

    // no id provided
    expect(new AbstractSearchResult().getId()).toBe(0);
    expect(new AbstractSearchResult().getId()).toBe(1);
    expect(new AbstractSearchResult().getId()).toBe(2);

    // empty string provided
    expect(new AbstractSearchResult(null, 0, '').getId()).toBe(3);
    expect(new AbstractSearchResult(null, 0, '').getId()).toBe(4);

    // null provided
    expect(new AbstractSearchResult(null, 0, null).getId()).toBe(5);
    expect(new AbstractSearchResult(null, 0, null).getId()).toBe(6);
  });

  it('sets the id from parameters', function() {
    AbstractSearchResult.nextId_ = 10;

    expect(new AbstractSearchResult(null, 0, 0).getId()).toBe(0);
    expect(new AbstractSearchResult(null, 0, 100).getId()).toBe(100);
    expect(new AbstractSearchResult(null, 0, 'testId').getId()).toBe('testId');

    // no id provided uses the next id
    expect(new AbstractSearchResult().getId()).toBe(10);
  });

  it('sets the score from parameters', function() {
    expect(new AbstractSearchResult().getScore()).toBe(0);
    expect(new AbstractSearchResult(null, null).getScore()).toBe(0);
    expect(new AbstractSearchResult(null, 100).getScore()).toBe(100);
  });

  it('sets the score', function() {
    var result = new AbstractSearchResult();
    expect(result.getScore()).toBe(0);

    result.setScore(100);
    expect(result.getScore()).toBe(100);
  });

  it('sets the result from parameters', function() {
    var data = {};
    expect(new AbstractSearchResult().getResult()).toBeUndefined();
    expect(new AbstractSearchResult(null).getResult()).toBeNull();
    expect(new AbstractSearchResult(data).getResult()).toBe(data);
  });

  it('sets the result', function() {
    var data = {};
    var result = new AbstractSearchResult();
    expect(result.getResult()).toBeUndefined();

    result.setResult(data);
    expect(result.getResult()).toBe(data);
  });
});

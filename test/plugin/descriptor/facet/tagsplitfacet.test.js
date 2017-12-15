goog.require('plugin.descriptor.facet.TagSplit');


describe('plugin.descriptor.facet.TagSplit', function() {
  var mockDescriptor = function() {
    this.tags = null;
  };

  mockDescriptor.prototype.getTags = function() {
    return this.tags;
  };

  it('should handle empty tags on load', function() {
    var d = new mockDescriptor();
    var f = new plugin.descriptor.facet.TagSplit();

    var loaded = {};
    f.load(d, loaded);

    var count = 0;
    for (var c in loaded) {
      count++;
    }

    expect(count).toBe(0);
  });

  it('should handle empty tags on test', function() {
    var d = new mockDescriptor();
    var f = new plugin.descriptor.facet.TagSplit();
    var results = {};
    f.test(d, {}, results);
    var count = 0;
    for (var result in results) {
      count++;
    }
    expect(count).toBe(0);
  });

  it('should split tags on colons and load them', function() {
    var d2 = new mockDescriptor();
    d2.tags = ['foo:bar', 'yer:mom'];

    var d1 = new mockDescriptor();
    d1.tags = ['foo:bar'];

    var d = new mockDescriptor();
    d.tags = ['something'];
    var list = [d, d1, d2];

    var loaded = {};
    var f = new plugin.descriptor.facet.TagSplit();

    for (var i = 0; i < list.length; i++) {
      f.load(list[i], loaded);
    }

    expect(loaded['foo']['bar']).toBe(2);
    expect(loaded['yer']['mom']).toBe(1);
    expect(loaded['something']).toBe(undefined);
  });

  it('should test split tags', function() {
    var d2 = new mockDescriptor();
    d2.tags = ['foo:bar', 'yer:mom'];

    var d1 = new mockDescriptor();
    d1.tags = ['foo:bar', 'yer:dad'];

    var d = new mockDescriptor();
    d.tags = ['something'];

    var applied = {
      yer: ['mom']
    };

    var f = new plugin.descriptor.facet.TagSplit();
    var results = {};
    f.test(d2, applied, results);
    expect(results['yer']).toBe(1);

    results = {};
    f.test(d1, applied, results);
    expect(results['yer']).toBe(0);

    results = {};
    f.test(d, applied, results);
    expect(results['yer']).toBe(0);
  });
});



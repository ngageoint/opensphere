goog.require('os.config.Settings');
goog.require('plugin.descriptor.DescriptorSearch');
goog.require('test.os.config.SettingsUtil');


describe('plugin.descriptor.DescriptorSearch', function() {
  var mockDescriptor = function() {
    this.id = 'A';
    this.type = 'Type A';
    this.provider = 'Provider A';
  };
  mockDescriptor.prototype.getId = function() {
    return this.id;
  };
  mockDescriptor.prototype.getType = function() {
    return this.type;
  };
  mockDescriptor.prototype.getProvider = function() {
    return this.provider;
  };
  mockDescriptor.prototype.getTags = function() {
    return null;
  };

  var ds = null;

  var d1 = new mockDescriptor();
  var d2 = new mockDescriptor();
  d2.provider = 'Provider B';
  var d3 = new mockDescriptor();
  d3.type = 'Type B';
  var d4 = new mockDescriptor();
  d4.type = 'Type B';
  d4.provider = 'Provider B';

  var list = [d1, d2, d3, d4];

  it('should init properly', function() {
    var settings = new os.config.Settings();
    test.os.config.SettingsUtil.initAndLoad(settings);

    runs(function() {
      ds = new plugin.descriptor.DescriptorSearch('Layers');
    });
  });

  it('should properly load facets', function() {
    spyOn(ds, 'getDescriptors').andReturn(list);
    ds.loadFacets();
    var facets = ds.getFacets();

    expect(facets['Type']['Type A']).toBe(2);
    expect(facets['Type']['Type B']).toBe(2);
    expect(facets['Source']['Provider A']).toBe(2);
    expect(facets['Source']['Provider B']).toBe(2);
  });

  it('should properly count facets if facets are applied', function() {
    spyOn(ds, 'getDescriptors').andReturn(list);

    ds.applyFacets({'Type': ['Type A']});
    ds.loadFacets();
    var facets = ds.getFacets();

    expect(facets['Type']['Type A']).toBe(2);
    expect(facets['Type']['Type B']).toBe(2);
    expect(facets['Source']['Provider A']).toBe(1);
    expect(facets['Source']['Provider B']).toBe(1);

    ds.applyFacets({'Type': ['Type A'], 'Source': ['Provider A']});
    ds.loadFacets();
    facets = ds.getFacets();

    expect(facets['Type']['Type A']).toBe(1);
    expect(facets['Type']['Type B']).toBe(1);
    expect(facets['Source']['Provider A']).toBe(1);
    expect(facets['Source']['Provider B']).toBe(1);

    ds.applyFacets({'Type': ['Type A', 'Type B']});
    ds.loadFacets();
    facets = ds.getFacets();

    expect(facets['Type']['Type A']).toBe(2);
    expect(facets['Type']['Type B']).toBe(2);
    expect(facets['Source']['Provider A']).toBe(2);
    expect(facets['Source']['Provider B']).toBe(2);

    ds.applyFacets(null);
    ds.loadFacets();
    facets = ds.getFacets();

    expect(facets['Type']['Type A']).toBe(2);
    expect(facets['Type']['Type B']).toBe(2);
    expect(facets['Source']['Provider A']).toBe(2);
    expect(facets['Source']['Provider B']).toBe(2);
  });
});

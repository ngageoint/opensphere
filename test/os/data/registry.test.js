goog.require('os.data.Registry');


describe('os.data.Registry', function() {
  const Registry = goog.module.get('os.data.Registry');

  var item1 = {
    id: '1',
    data: 'One'
  };
  var item2 = {
    id: '2',
    data: 'Two'
  };
  var config1 = {
    opt1: true,
    opt2: true
  };
  var config2 = {
    opt1: false,
    opt2: false
  };
  var init = function(registry) {
    registry.register(item1.id, item1, config1, 'Final Parameter');
    registry.register(item2.id, item2, config2, 'Penultimate Parameter');
  };

  it('should register items', function() {
    const registry = new Registry();
    init(registry);

    expect(registry.has('1')).toBe(true);
    expect(registry.has('2')).toBe(true);
    expect(registry.has('3')).toBe(false);
    expect(registry.keys().length).toBe(2);
  });

  it('should un-register items', function() {
    const registry = new Registry();
    init(registry);

    registry.remove('1');

    expect(registry.has('1')).toBe(false);
    expect(registry.has('2')).toBe(true);
    expect(registry.has('3')).toBe(false);
    expect(registry.keys().length).toBe(1);
  });

  it('should retrieve items', function() {
    const registry = new Registry();
    init(registry);

    const item = registry.get('1');

    expect(item).toBe(item1);
  });

  it('should flatten and iterate over items', function() {
    const registry = new Registry();

    init(registry);

    const entries = registry.entries();
    for (const [id, item, config, last] of entries) {
      const i = (id == item1.id) ? item1 : item2;
      const c = (id == item1.id) ? config1 : config2;
      const l = (id == item1.id) ? 'Final Parameter' : 'Penultimate Parameter';

      expect(id).toBe(i.id);
      expect(item).toBe(i);
      expect(config).toBe(c);
      expect(last).toBe(l);
    }
  });
});

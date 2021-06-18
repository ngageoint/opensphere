goog.require('os.data.Registry');

goog.require('os.data.RegistryPropertyChange');

describe('os.data.Registry', function() {
  const Registry = goog.module.get('os.data.Registry');
  const RegistryPropertyChange = goog.module.get('os.data.RegistryPropertyChange');
  const {PROPERTYCHANGE} = goog.module.get('goog.events.EventType');

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

  it('should notify listeners of changes', function() {
    const this_ = this;
    let count = 0;
    let countAdd = 0;
    let countRemove = 0;
    let countUpdate = 0;
    let countClear = 0;

    const onAdd = function(entry) {
      if (entry[0] == item1.id || entry[0] == item2.id) {
        countAdd++;
      }
    };
    const onUpdate = function(entry) {
      if (entry[0] == item1.id) {
        countUpdate++;
      }
    };
    const onRemove = function(entry) {
      if (entry[0] == item2.id) {
        countRemove++;
      }
    };
    const onClear = function(entries) {
      if (entries.length == 2) {
        countClear++;
      }
    };
    const onPropertyChange = function(event) {
      count++;
      switch (event.getProperty()) {
        case RegistryPropertyChange.ADD:
          onAdd.call(this_, event.newVal_);
          break;
        case RegistryPropertyChange.UPDATE:
          onUpdate.call(this_, event.newVal_);
          break;
        case RegistryPropertyChange.REMOVE:
          onRemove.call(this_, event.newVal_);
          break;
        case RegistryPropertyChange.CLEAR:
          onClear.call(this_, event.newVal_);
          break;
        default:
          break;
      }
    };

    const registry = new Registry();

    // set up the listeners
    registry.listen(PROPERTYCHANGE, onPropertyChange);

    // add 2
    init(registry);

    // update 1
    registry.register(item1.id, item1, config1, 'Updated Parameter');
    expect(registry.entry(item1.id)[3]).toBe('Updated Parameter');

    // remove 1...
    expect(registry.entry(item2.id)[3]).toBe('Penultimate Parameter');
    registry.remove(item2.id);

    // ... and add 1 back
    registry.register(item2.id, item2, config2, 'Re-registered');
    expect(registry.entry(item2.id)[3]).toBe('Re-registered');

    // clear
    registry.clear();

    expect(count).toBe(6);
    expect(countAdd).toBe(3);
    expect(countUpdate).toBe(1);
    expect(countRemove).toBe(1);
    expect(countClear).toBe(1);
  });
});

goog.require('goog.events.EventType');
goog.require('os.data.CollectionManager');

describe('os.data.CollectionManager', function() {
  const GoogEventType = goog.module.get('goog.events.EventType');
  const CollectionManager = goog.module.get('os.data.CollectionManager');

  var cm = new CollectionManager();

  it('should add items', function() {
    var item = {id: 'A'};
    var count = 0;
    var onAdd = function() {
      count++;
    };

    cm.listen(GoogEventType.PROPERTYCHANGE, onAdd);
    var result = cm.add(item);
    expect(result).toBe(true);
    expect(count).toBe(1);
    expect(cm.get('A')).toBe(item);

    cm.unlisten(GoogEventType.PROPERTYCHANGE, onAdd);
  });

  it('should get items', function() {
    var item = cm.get('A');
    expect(item).not.toBe(null);
    expect(cm.get(item)).toBe(item);
    expect(cm.get('bogus')).toBe(null);
  });

  it('should report contained items', function() {
    var item = cm.get('A');
    expect(cm.contains('A')).toBe(true);
    expect(cm.contains(item)).toBe(true);
  });

  it('should return the entire collection as a slice', function() {
    var all = cm.getAll();
    expect(all).not.toBe(cm.items_);
  });

  it('should remove items', function() {
    var item = cm.get('A');
    var count = 0;
    var onRemove = function() {
      count++;
    };

    cm.listen(GoogEventType.PROPERTYCHANGE, onRemove);
    var result = cm.remove('A');

    expect(result).toBe(item);
    expect(cm.contains(item)).toBe(false);
    expect(count).toBe(1);

    cm.unlisten(GoogEventType.PROPERTYCHANGE, onRemove);
  });
});

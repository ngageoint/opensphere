goog.require('goog.iter');
goog.require('os.storage.ObjectMechanism');

describe('os.storage.ObjectMechanism', () => {
  const {toArray} = goog.module.get('goog.iter');
  const {default: ObjectMechanism} = goog.module.get('os.storage.ObjectMechanism');

  const mechanism = new ObjectMechanism();

  it('gets/sets values', () => {
    expect(mechanism.get('key1')).toBeUndefined();
    mechanism.set('key1', 'value1');
    expect(mechanism.get('key1')).toBe('value1');

    expect(mechanism.get('key2')).toBeUndefined();
    mechanism.set('key2', 'value2');
    expect(mechanism.get('key2')).toBe('value2');
  });

  it('gets all values', () => {
    const values = mechanism.getAll();
    expect(values.length).toBe(2);
    expect(values.includes('value1')).toBe(true);
    expect(values.includes('value2')).toBe(true);
  });

  it('gets the count', () => {
    expect(mechanism.getCount()).toBe(2);
  });

  it('removes values', () => {
    mechanism.remove('key1');
    expect(mechanism.getCount()).toBe(1);
    expect(mechanism.get('key2')).toBe('value2');

    mechanism.remove('not-a-key');
    expect(mechanism.getCount()).toBe(1);
    expect(mechanism.get('key2')).toBe('value2');
  });

  it('clears the storage', () => {
    mechanism.clear();
    expect(mechanism.getCount()).toBe(0);
  });

  it('is iterable', () => {
    mechanism.set('key1', 'value1');
    mechanism.set('key2', 'value2');

    // Iterates over keys.
    const keys = toArray(mechanism.__iterator__(true));
    expect(keys.length).toBe(2);
    expect(keys.includes('key1')).toBe(true);
    expect(keys.includes('key2')).toBe(true);

    // Iterates over values.
    let values = toArray(mechanism.__iterator__(false));
    expect(values.length).toBe(2);
    expect(values.includes('value1')).toBe(true);
    expect(values.includes('value2')).toBe(true);

    // Defaults to iterating over values.
    values = toArray(mechanism.__iterator__());
    expect(values.length).toBe(2);
    expect(values.includes('value1')).toBe(true);
    expect(values.includes('value2')).toBe(true);
  });
});

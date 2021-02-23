goog.require('os.ogc.wmts');

describe('os.ogc.wmts', () => {
  const {
    detectDateTimeFormats,
    getTimeKey,
    hasTimeExtent,
    optionsToProjection,
    sortFormats
  } = goog.module.get('os.ogc.wmts');

  it('detects date/time formats', () => {
    let formats = detectDateTimeFormats();
    expect(formats.dateFormat).toBe('');
    expect(formats.timeFormat).toBe('');

    formats = detectDateTimeFormats([]);
    expect(formats.dateFormat).toBe('');
    expect(formats.timeFormat).toBe('');

    formats = detectDateTimeFormats([{
      'Identifier': 'Test'
    }]);
    expect(formats.dateFormat).toBe('');
    expect(formats.timeFormat).toBe('');

    formats = detectDateTimeFormats([{
      'Identifier': 'Time'
    }]);
    expect(formats.dateFormat).toBe('');
    expect(formats.timeFormat).toBe('');

    formats = detectDateTimeFormats([{
      'Identifier': 'Time',
      'Default': '2021-02-18'
    }]);
    expect(formats.dateFormat).toBe('YYYY-MM-DD');
    expect(formats.timeFormat).toBe('{start}');

    formats = detectDateTimeFormats([{
      'Identifier': 'Time',
      'Default': '2021-02-17/2021-02-18'
    }]);
    expect(formats.dateFormat).toBe('YYYY-MM-DD');
    expect(formats.timeFormat).toBe('{start}/{end}');

    formats = detectDateTimeFormats([{
      'Identifier': 'Time',
      'Default': '2021-02-17T00:00:00/2021-02-18T00:00:00'
    }]);
    expect(formats.dateFormat).toBe('YYYY-MM-DDTHH:mm:ss');
    expect(formats.timeFormat).toBe('{start}/{end}');
  });

  it('get the time key from a dimension', () => {
    expect(getTimeKey()).toBeNull();
    expect(getTimeKey({})).toBeNull();
    expect(getTimeKey({test: true})).toBeNull();

    expect(getTimeKey({time: true})).toBe('time');
    expect(getTimeKey({Time: true})).toBe('Time');
    expect(getTimeKey({TimeTest: true})).toBe('TimeTest');
  });

  it('tests if a dimension is a time extent', () => {
    expect(hasTimeExtent()).toBe(false);
    expect(hasTimeExtent({})).toBe(false);
    expect(hasTimeExtent({Identifier: 'Test'})).toBe(false);

    expect(hasTimeExtent({Identifier: 'Time'})).toBe(true);
    expect(hasTimeExtent({Identifier: 'TimeTest'})).toBe(true);
  });

  it('gets the projection from a WMTS options object', () => {
    expect(optionsToProjection()).toBeNull();
    expect(optionsToProjection({})).toBeNull();

    expect(optionsToProjection({
      projection: {
        getCode: () => 'EPSG:1234'
      }
    })).toBe('EPSG:1234');
  });

  it('sorts image formats in the preferred order', () => {
    const formats = [
      'text/plain',
      'image/png',
      'image/gif',
      'image/jpeg',
      'image/vnd.jpeg-png'
    ];

    formats.sort(sortFormats);

    expect(formats[0]).toBe('image/vnd.jpeg-png');
    expect(formats[1]).toBe('image/png');
    expect(formats[2]).toBe('image/jpeg');
    expect(formats[3]).toBe('text/plain');
    expect(formats[4]).toBe('image/gif');
  });
});

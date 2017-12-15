goog.require('os.im.mapping.TimeFormat');
goog.require('os.im.mapping.TimeType');
goog.require('os.im.mapping.time.DateTimeMapping');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');

describe('os.im.mapping.time.DateTimeMapping', function() {
  var dtm = null;
  var dtItem = null;
  var noDtItem = {};
  var start = '2014-02-13T15:42:59.123Z';
  var end = '2014-02-15T15:42:59.123Z';

  beforeEach(function() {
    dtm = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.INSTANT);
    dtItem = {'DateTime': start, 'DownDateTime': end};
    noDtItem = {'noRegexMatch': '2014-02-13T15:42:59.123Z'};
  });

  it('should auto detect date/time columns', function() {
    var m = dtm.autoDetect([dtItem]);
    expect(m).not.toBeNull();
    expect(m instanceof os.im.mapping.time.DateTimeMapping).toBe(true);
    expect(m.field).toBe('DateTime');
    expect(m.getFormat()).toBe('YYYY-MM-DDTHH:mm:ss.SSSZ');

    m = dtm.autoDetect([noDtItem]);
    expect(m).toBeNull();

    dtm = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.START);
    m = dtm.autoDetect([dtItem]);
    expect(m).not.toBeNull();
    expect(m instanceof os.im.mapping.time.DateTimeMapping).toBe(true);
    expect(m.field).toBe('DateTime');
    expect(m.getFormat()).toBe('YYYY-MM-DDTHH:mm:ss.SSSZ');

    m = dtm.autoDetect([noDtItem]);
    expect(m).toBeNull();

    dtm = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.END);
    m = dtm.autoDetect([dtItem]);
    expect(m).not.toBeNull();
    expect(m instanceof os.im.mapping.time.DateTimeMapping).toBe(true);
    expect(m.field).toBe('DownDateTime');
    expect(m.getFormat()).toBe('YYYY-MM-DDTHH:mm:ss.SSSZ');

    m = dtm.autoDetect([noDtItem]);
    expect(m).toBeNull();
  });

  it('should get a os.time.ITime instance based on the time type', function() {
    var t = goog.now();
    var time = dtm.getNewTime(t);
    expect(time).not.toBeNull();
    expect(time instanceof os.time.TimeInstant).toBe(true);
    expect(time.getStart()).toBe(t);

    dtm.setType(os.im.mapping.TimeType.START);
    time = dtm.getNewTime(t);
    expect(time).not.toBeNull();
    expect(time instanceof os.time.TimeRange).toBe(true);
    // the end and the start should both be t
    expect(time.getStart()).toBe(t);
    expect(time.getEnd()).toBe(t);

    dtm.setType(os.im.mapping.TimeType.END);
    time = dtm.getNewTime(t);
    expect(time).not.toBeNull();
    expect(time instanceof os.time.TimeRange).toBe(true);
    expect(time.getStart()).toBe(0);
    expect(time.getEnd()).toBe(t);
  });

  it('should execute properly', function() {
    // instant mapping applied
    var im = dtm.autoDetect([dtItem]);
    im.execute(dtItem);
    expect(dtItem.recordTime).not.toBeNull();
    expect(dtItem.recordTime instanceof os.time.TimeInstant).toBe(true);
    expect(dtItem.recordTime.getStart()).toBe(new Date(start).getTime());

    // start mapping only
    dtm.setType(os.im.mapping.TimeType.START);
    dtItem = {'DateTime': start, 'DownDateTime': end};
    var sm = dtm.autoDetect([dtItem]);
    sm.execute(dtItem);
    expect(dtItem.recordTime).not.toBeNull();
    expect(dtItem.recordTime instanceof os.time.TimeRange).toBe(true);
    expect(dtItem.recordTime.getStart()).toBe(new Date(start).getTime());
    expect(dtItem.recordTime.getEnd()).toBe(new Date(start).getTime());

    // end mapping only
    dtm.setType(os.im.mapping.TimeType.END);
    dtItem = {'DateTime': start, 'DownDateTime': end};
    var em = dtm.autoDetect([dtItem]);
    em.execute(dtItem);
    expect(dtItem.recordTime).not.toBeNull();
    expect(dtItem.recordTime instanceof os.time.TimeRange).toBe(true);
    expect(dtItem.recordTime.getStart()).toBe(0);
    expect(dtItem.recordTime.getEnd()).toBe(new Date(end).getTime());

    // start + end mapping applied
    sm.execute(dtItem);
    expect(dtItem.recordTime).not.toBeNull();
    expect(dtItem.recordTime instanceof os.time.TimeRange).toBe(true);
    expect(dtItem.recordTime.getStart()).toBe(new Date(start).getTime());
    expect(dtItem.recordTime.getEnd()).toBe(new Date(end).getTime());

    // instant + end mapping applied results in a range
    dtItem = {'DateTime': start, 'DownDateTime': end};
    im.execute(dtItem);
    em.execute(dtItem);
    expect(dtItem.recordTime).not.toBeNull();
    expect(dtItem.recordTime instanceof os.time.TimeRange).toBe(true);
    expect(dtItem.recordTime.getStart()).toBe(new Date(start).getTime());
    expect(dtItem.recordTime.getEnd()).toBe(new Date(end).getTime());
  });

  it('should be able to handle whatever params are given to getTime', function() {
    // instant mapping applied
    var startTime = 1482904308000;
    var endTime = 1482904308001;
    var time = new os.time.TimeRange(startTime);
    var time2 = new os.time.TimeRange(undefined, endTime);
    var time3 = new os.time.TimeRange(startTime, startTime);
    var im = dtm.autoDetect([dtItem]);
    expect(im.getTime(null, null)).toBeNull();
    expect(im.getTime(null, '2016-12-28 07:41:18Z')).toBeNull();
    expect(im.getTime(null, startTime)).toBeNull();
    expect(im.getTime(startTime, '2016-12-28 07:41:18Z').getStart()).toEqual(startTime);
    expect(im.getTime(startTime, startTime).getStart()).toEqual(startTime);
    expect(im.getTime(startTime, null).getStart()).toEqual(startTime);
    expect(im.getTime(startTime, time)).toEqual(time);
    expect(im.getTime(startTime, time2)).toEqual(time2);
    im.type = os.im.mapping.TimeType.END;
    expect(im.getTime(endTime, null).getEnd()).toEqual(endTime);
    expect(im.getTime(startTime, time)).toEqual(time3);
    expect(im.getTime(startTime, time2)).toEqual(time3);
  });

  it('should parse ISO strings properly', function() {
    var im = dtm.autoDetect([dtItem]);
    im.format = os.im.mapping.TimeFormat.ISO;
    im.execute(dtItem);
    expect(dtItem.recordTime).not.toBeNull();
    expect(dtItem.recordTime instanceof os.time.TimeInstant).toBe(true);
    expect(dtItem.recordTime.getStart()).toBe(moment(start).valueOf());
  });

  it('should replace an existing recordTime field', function() {
    var now = new Date();
    var nowStr = now.toISOString();
    var obj = {
      recordTime: nowStr
    };

    var m = dtm.autoDetect([obj]);
    expect(m).not.toBeNull();
    expect(m instanceof os.im.mapping.time.DateTimeMapping).toBe(true);
    expect(m.field).toBe('recordTime');
    expect(m.getFormat()).toBe('YYYY-MM-DDTHH:mm:ss.SSSZ');

    m.execute(obj);
    expect(obj.recordTime).not.toBeNull();
    expect(obj.recordTime instanceof os.time.TimeInstant).toBe(true);
    expect(obj.recordTime.getStart()).toBe(now.getTime());
  });

  it('should clone properly', function() {
    var m = dtm.autoDetect([dtItem]);
    m.setApplyTime(false);

    var clone = m.clone();
    expect(clone).not.toBeNull();
    expect(clone instanceof os.im.mapping.time.DateTimeMapping).toBe(true);
    expect(clone.field).toBe(m.field);
    expect(clone.getApplyTime()).toBe(m.getApplyTime());
    expect(clone.getFormat()).toBe(m.getFormat());
    expect(clone.getType()).toBe(m.getType());
  });

  it('should persist/restore properly', function() {
    var m = dtm.autoDetect([dtItem]);
    m.setApplyTime(false);

    // just set this to not the default (first one)
    m.setFormat(os.time.DATETIME_FORMATS[4]);

    var persist = m.persist();
    expect(persist.id).toBe(m.getId());
    expect(persist.field).toBe(m.field);
    expect(persist.applyTime).toBe(m.getApplyTime());
    expect(persist.format).toBe(m.getFormat());
    expect(persist.type).toBe(m.getType());

    var restored = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.END);
    expect(restored.field).not.toBe(m.field);
    expect(restored.getFormat()).not.toBe(m.getFormat());
    expect(restored.getApplyTime()).not.toBe(m.getApplyTime());
    expect(restored.getType()).not.toBe(m.getType());

    restored.restore(persist);
    expect(restored.field).toBe(m.field);
    expect(restored.getFormat()).toBe(m.getFormat());
    expect(restored.getApplyTime()).toBe(m.getApplyTime());
    expect(restored.getType()).toBe(m.getType());
  });

  it('should persist/restore properly to XML', function() {
    var m = dtm.autoDetect([dtItem]);
    m.setApplyTime(false);

    // just set this to not the default (first one)
    m.setFormat(os.time.DATETIME_FORMATS[7]);

    var xml = m.toXml();
    expect(xml).toBeDefined();
    expect(xml.localName).toBe('mapping');
    expect(xml.getAttribute('type')).toBe(m.xmlType);

    var applyTimeEl = xml.querySelector('applyTime');
    expect(applyTimeEl).toBeDefined();
    expect(applyTimeEl.textContent).toBe(String(m.getApplyTime()));

    var formatEl = xml.querySelector('format');
    expect(formatEl).toBeDefined();
    expect(formatEl.textContent).toBe('yyyy-MM-dd\'T\'HH:mm:ssZ'); // java format

    var typeEl = xml.querySelector('subType');
    expect(typeEl).toBeDefined();
    expect(typeEl.textContent).toBe(m.getType());

    var restored = new os.im.mapping.time.DateTimeMapping(os.im.mapping.TimeType.END);
    expect(restored.field).not.toBe(m.field);
    expect(restored.getFormat()).not.toBe(m.getFormat());
    expect(restored.getApplyTime()).not.toBe(m.getApplyTime());
    expect(restored.getType()).not.toBe(m.getType());

    restored.fromXml(xml);
    expect(restored.field).toBe(m.field);
    // translation to/from java format drops the superfluous Z
    expect(restored.getFormat()).toBe('YYYY-MM-DDTHH:mm:ssZ');
    expect(restored.getApplyTime()).toBe(m.getApplyTime());
    expect(restored.getType()).toBe(m.getType());
  });
});

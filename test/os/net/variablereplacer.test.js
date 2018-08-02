goog.require('goog.Uri');
goog.require('os.net.VariableReplacer');
goog.require('os.ogc.wps');
goog.require('os.time');

describe('os.net.VariableReplacer', function() {
  var vr = new os.net.VariableReplacer();

  it('should register replacement functions', function() {
    var uri = new goog.Uri('/path/{echo:foo}/?name={echo:bar}');
    // force a QD decode
    uri.getQueryData().get('name');

    // get the unchanged URI
    var beforeStr = uri.toString();

    // expect no change
    vr.modify(uri);
    expect(uri.toString()).toBe(beforeStr);

    // add something to handle 'echo' variables
    var fn = function(match, p1, offset, str) {
      return p1;
    };

    os.net.VariableReplacer.add('echo', fn);

    vr.modify(uri);
    expect(uri.toString()).toBe('/path/foo/?name=bar');
  });

  it('should replace time variables', function() {
    // the time replacement is provided by os.ogc.wps
    var uri = new goog.Uri();
    var qd = uri.getQueryData();

    qd.set('start', '{time:start, Today}');
    qd.set('end', '{time:end, Today}');

    var start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    var startValue = start.toISOString().substring(0, 19) + 'Z';

    start.setUTCDate(start.getUTCDate() + 1);
    var endValue = start.toISOString().substring(0, 19) + 'Z';

    vr.modify(uri);

    expect(qd.get('start')).toBe(startValue);
    expect(qd.get('end')).toBe(endValue);
  });

  it('should replace now variables', function() {
    // the now replacement is provided by os.time
    var uri = new goog.Uri();
    var qd = uri.getQueryData();

    qd.set('now', '{now}');
    qd.set('past', '{now:-30000}');
    qd.set('future', '{now:30000}');
    qd.set('isoPast', '{now:-PT30S}');
    qd.set('isoFuture', '{now:PT30S}');

    // We want Date.now() to return the same value over the duration of the test
    spyOn(Date, 'now').andReturn(0);
    vr.modify(uri);

    var now = Date.now();

    expect(new Date(qd.get('now')).getTime()).toBe(now);
    expect(new Date(qd.get('past')).getTime()).toBe(now - 30000);
    expect(new Date(qd.get('future')).getTime()).toBe(now + 30000);
    expect(new Date(qd.get('isoPast')).getTime()).toBe(now - 30000);
    expect(new Date(qd.get('isoFuture')).getTime()).toBe(now + 30000);
  });
});

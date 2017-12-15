goog.require('os.mock');
goog.require('os.url.AbstractUrlHandler');


describe('os.url.AbstractUrlHandler', function() {
  var handler;

  beforeEach(function() {
    handler = new os.url.AbstractUrlHandler();
  });

  it('should return whether it handles a key', function() {
    handler.keys = ['foo', 'bar'];
    expect(handler.handles('foo')).toBe(true);
    expect(handler.handles('bar')).toBe(true);
    expect(handler.handles('wut')).toBe(false);
  });

  it('should handle and unhandle keys', function() {
    handler.keys = ['foo', 'bar'];
    handler.handleInternal = function() {};

    // handle one key and one value
    handler.handle('foo', 'val1');
    expect(handler.handlesCache['foo']).toEqual(['val1']);

    // handle one key and two values
    handler.handle('bar', 'val2,val3');
    expect(handler.handlesCache['bar']).toEqual(['val2', 'val3']);

    // handle one key with an empty value (this should be an unhandle)
    handler.handle('foo', '');
    expect(handler.handlesCache['foo']).toEqual(undefined);

    // handle one key with one value that used to have two values (this should be a partial unhandle)
    handler.handle('bar', 'val2');
    expect(handler.handlesCache['bar']).toEqual(['val2']);
  });

  it('should unhandle all values for a key', function() {
    handler.keys = ['foo', 'bar'];
    handler.handleInternal = function() {};

    handler.handle('bar', 'val2,val3');
    expect(handler.handlesCache['bar']).toEqual(['val2', 'val3']);

    handler.unhandleAll('bar');
    expect(handler.handlesCache['bar']).toEqual(undefined);
  });
});

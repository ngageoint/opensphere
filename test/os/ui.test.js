goog.require('goog.asserts');
goog.require('os.ui');

describe('os.ui', function() {
  const asserts = goog.module.get('goog.asserts');
  const ui = goog.module.get('os.ui');

  var callback;
  var el;

  beforeEach(function() {
    /**
     * Empty callback.
     */
    callback = function() {};
    el = $('<div></div>');
  });

  it('should log an assertion when the resize library isnt loaded', function() {
    var oldResizeSensor = window.ResizeSensor;
    window.ResizeSensor = undefined;

    spyOn(asserts, 'fail');
    expect(ui.resize.bind(undefined, el, callback)).not.toThrow();
    expect(asserts.fail).toHaveBeenCalled();
    window.ResizeSensor = oldResizeSensor;
  });

  it('should add resize listeners to elements', function() {
    // doesn't fail when one or both params is null
    expect(ui.resize.bind(undefined, null, null)).not.toThrow();
    expect(ui.resize.bind(undefined, el, null)).not.toThrow();
    expect(ui.resize.bind(undefined, null, callback)).not.toThrow();

    ui.resize(el, callback);
    expect(el[0].resizedAttached).toBeDefined();
  });

  it('should remove resize listeners from elements', function() {
    // doesn't fail when one or both params is null
    expect(ui.removeResize.bind(undefined, null, null)).not.toThrow();
    expect(ui.removeResize.bind(undefined, el, null)).not.toThrow();
    expect(ui.removeResize.bind(undefined, null, callback)).not.toThrow();

    // or when both are defined but a listener hasn't been attached
    expect(ui.removeResize.bind(undefined, el, callback)).not.toThrow();

    spyOn(ResizeSensor, 'detach');
    ui.removeResize(el, callback);
    expect(ResizeSensor.detach).toHaveBeenCalledWith(el, callback);
  });
});

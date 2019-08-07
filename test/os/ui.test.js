goog.require('os.ui');

describe('os.ui', function() {
  it('should remove resize listeners from elements', function() {
    var callback = function() {};
    var el = $('<div></div>');

    // doesn't fail when one or both params is null
    expect(os.ui.removeResize.bind(undefined, null, null)).not.toThrow();
    expect(os.ui.removeResize.bind(undefined, el, null)).not.toThrow();
    expect(os.ui.removeResize.bind(undefined, null, callback)).not.toThrow();

    // or when a listener isn't attached
    expect(os.ui.removeResize.bind(undefined, el, callback)).not.toThrow();

    // doesn't fail when jquery.resize.js isn't loaded, and calls the jQuery remove function
    spyOn(el, 'off');
    el.removeResize = undefined;
    expect(os.ui.removeResize.bind(undefined, el, callback)).not.toThrow();
    expect(el.off).toHaveBeenCalledWith('resize', callback);

    /**
     * Don't care what the function is, just that it's called.
     * @param {Function} fn The callback.
     */
    el.removeResize = function(fn) {};
    spyOn(el, 'removeResize');
    expect(os.ui.removeResize.bind(undefined, el, callback)).not.toThrow();
    expect(el.removeResize).toHaveBeenCalledWith(callback);
  });
});

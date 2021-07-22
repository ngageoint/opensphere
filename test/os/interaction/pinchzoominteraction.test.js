goog.require('os.interaction.PinchZoom');

describe('os.interaction.PinchZoom', function() {
  const PinchZoom = goog.module.get('os.interaction.PinchZoom');

  it('should initialise without error', function() {
    var fn = () => new PinchZoom();
    expect(fn).not.toThrow();
  });

  it('should not be enabled in 3D mode', function() {
    var pz = new PinchZoom();
    expect(pz.is3DSupported()).toBe(false);
  });
});

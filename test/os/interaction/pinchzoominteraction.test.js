goog.require('os.interaction.PinchZoom');

describe('os.interaction.PinchZoom', function() {
  it('should initialise without error', function() {
    
    var fn = function() {
      var pz = new os.interaction.PinchZoom();
    };

    expect(fn).not.toThrow();
  });
  
  it ('should not be enabled in 3D mode', function() {
    var pz = new os.interaction.PinchZoom(); 
    expect(pz.is3DSupported()).toBe(false);
  });
});

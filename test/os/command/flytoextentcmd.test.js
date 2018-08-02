goog.require('ol.extent');
goog.require('os.command.FlyToExtent');


describe('os.command.FlyToExtent', function() {
  it('initializes parameters correctly', function() {
    var testParams = function(cmd, extent, buffer, maxZoom) {
      expect(cmd.extent_).toBe(extent);
      expect(cmd.buffer_).toBe(buffer);
      expect(cmd.maxZoom_).toBe(maxZoom);
    };

    // no optional parameters
    var extent = ol.extent.createEmpty();
    var cmd = new os.command.FlyToExtent(extent);
    testParams(cmd, extent, os.command.FlyToExtent.DEFAULT_BUFFER, os.map.MAX_AUTO_ZOOM);

    // standard optional params within accepted ranges
    cmd = new os.command.FlyToExtent(extent, 5, 10);
    testParams(cmd, extent, 5, 10);

    // negative buffer is allowed
    cmd = new os.command.FlyToExtent(extent, -5, 10);
    testParams(cmd, extent, -5, 10);

    // zero buffer uses the default
    cmd = new os.command.FlyToExtent(extent, 0, 10);
    testParams(cmd, extent, os.command.FlyToExtent.DEFAULT_BUFFER, 10);

    // negative zoom is unconstrained up to the application max
    cmd = new os.command.FlyToExtent(extent, 5, -10);
    testParams(cmd, extent, 5, os.map.MAX_ZOOM);

    // positive zoom is constrained between the application min/max
    cmd = new os.command.FlyToExtent(extent, 5, os.map.MIN_ZOOM - 1);
    testParams(cmd, extent, 5, os.map.MIN_ZOOM);

    cmd = new os.command.FlyToExtent(extent, 5, os.map.MAX_ZOOM + 1);
    testParams(cmd, extent, 5, os.map.MAX_ZOOM);
  });
});

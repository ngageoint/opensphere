goog.require('os.command.FlyToExtent');
goog.require('os.map');

import {createEmpty} from 'ol/src/extent.js';

describe('os.command.FlyToExtent', function() {
  const {default: FlyToExtent} = goog.module.get('os.command.FlyToExtent');
  const osMap = goog.module.get('os.map');

  it('initializes parameters correctly', function() {
    var testParams = function(cmd, extent, buffer, maxZoom) {
      expect(cmd.extent_).toBe(extent);
      expect(cmd.buffer_).toBe(buffer);
      expect(cmd.maxZoom_).toBe(maxZoom);
    };

    // no optional parameters
    var extent = createEmpty();
    var cmd = new FlyToExtent(extent);
    testParams(cmd, extent, FlyToExtent.DEFAULT_BUFFER, osMap.MAX_AUTO_ZOOM);

    // standard optional params within accepted ranges
    cmd = new FlyToExtent(extent, 5, 10);
    testParams(cmd, extent, 5, 10);

    // negative buffer is allowed
    cmd = new FlyToExtent(extent, -5, 10);
    testParams(cmd, extent, -5, 10);

    // zero buffer uses the default
    cmd = new FlyToExtent(extent, 0, 10);
    testParams(cmd, extent, FlyToExtent.DEFAULT_BUFFER, 10);

    // negative zoom is unconstrained up to the application max
    cmd = new FlyToExtent(extent, 5, -10);
    testParams(cmd, extent, 5, osMap.MAX_ZOOM);

    // positive zoom is constrained between the application min/max
    cmd = new FlyToExtent(extent, 5, osMap.MIN_ZOOM - 1);
    testParams(cmd, extent, 5, osMap.MIN_ZOOM);

    cmd = new FlyToExtent(extent, 5, osMap.MAX_ZOOM + 1);
    testParams(cmd, extent, 5, osMap.MAX_ZOOM);
  });
});

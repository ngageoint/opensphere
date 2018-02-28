goog.provide('os.map.interaction');

goog.require('goog.asserts');
goog.require('ol.Collection');
goog.require('ol.interaction');
goog.require('ol.interaction.DragPan');
goog.require('ol.interaction.Interaction');
goog.require('os.interaction.ContextMenu');
goog.require('os.interaction.DoubleClick');
goog.require('os.interaction.DoubleClickZoom');
goog.require('os.interaction.DragBox');
goog.require('os.interaction.DragCircle');
goog.require('os.interaction.DragZoom');
goog.require('os.interaction.DrawLine');
goog.require('os.interaction.DrawPolygon');
goog.require('os.interaction.Hover');
goog.require('os.interaction.KeyboardPan');
goog.require('os.interaction.KeyboardTiltRotate');
goog.require('os.interaction.KeyboardZoom');
goog.require('os.interaction.Measure');
goog.require('os.interaction.MouseZoom');
goog.require('os.interaction.Reset');
goog.require('os.interaction.Select');
goog.require('os.ui.menu.map');
goog.require('os.ui.menu.spatial');
goog.require('os.ui.ol.interaction.MouseWheelZoom');


/**
 * Get interactions that should be registered with the map.
 * @return {ol.Collection}
 */
os.map.interaction.getInteractions = function() {
  // interaction to use ctrl+drag for zooming
  var ctrlZoom = new os.interaction.DragZoom();

  // interaction to disable alt+shift+drag to rotate the map and shift+drag to zoom from the defaults
  var options = {
    delta: 0.2
  };

  // Mouse Wheel zoom AND left+right click and drag zoom
  var mwZoom = new os.ui.ol.interaction.MouseWheelZoom(options);
  var mZoom = new os.interaction.MouseZoom(options);
  var dcZoom = new os.interaction.DoubleClickZoom();

  var keyTiltRotate = new os.interaction.KeyboardTiltRotate(options);

  // interaction to handle selecting vector features
  var select = new os.interaction.Select(options);

  var dragPan = new ol.interaction.DragPan({
    kinetic: undefined,
    delta: 0.2
  });

  // interaction to handle highlighting vector features
  var hover = new os.interaction.Hover(options);

  // interaction for drawing rectangular areas
  var drawBox = new os.interaction.DragBox();

  // interaction for drawing circular areas
  var drawCircle = new os.interaction.DragCircle();

  // interaction for drawing polygon areas
  var drawPolygon = new os.interaction.DrawPolygon();

  // interaction for drawing lines
  var drawLine = new os.interaction.DrawLine();

  // interaction for double clicking features
  var doubleClick = new os.interaction.DoubleClick();

  // interaction for measure tool
  var measure = new os.interaction.Measure();

  var kbPan = new os.interaction.KeyboardPan();

  var kbZoom = new os.interaction.KeyboardZoom(options);

  var reset = new os.interaction.Reset();

  goog.asserts.assert(os.ui.menu.MAP != null, 'map manager has not been initialized');
  goog.asserts.assert(os.ui.menu.SPATIAL != null, 'spatial manager has not been initialized');

  var contextOptions = /** @type {os.ui.ol.interaction.ContextMenuOptions} */ ({
    featureMenu: os.ui.menu.SPATIAL,
    mapMenu: os.ui.menu.MAP
  });
  var contextMenu = new os.interaction.ContextMenu(contextOptions);

  // Run order is backwards, so 0 index is run last
  var interactions = new ol.Collection([
    hover,
    keyTiltRotate,
    kbPan,
    kbZoom,
    ctrlZoom,
    dragPan,
    mwZoom,
    mZoom,
    dcZoom,
    contextMenu,
    select,
    drawBox,
    drawCircle,
    drawPolygon,
    drawLine,
    measure,

    // double click should be after drawing controls so they can prevent it from firing
    doubleClick,
    reset
  ]);

  return interactions;
};

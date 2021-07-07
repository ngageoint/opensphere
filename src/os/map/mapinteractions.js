goog.module('os.map.interaction');
goog.module.declareLegacyNamespace();

const asserts = goog.require('goog.asserts');
const Collection = goog.require('ol.Collection');
const DragPan = goog.require('ol.interaction.DragPan');
const ContextMenu = goog.require('os.interaction.ContextMenu');
const DoubleClick = goog.require('os.interaction.DoubleClick');
const DoubleClickZoom = goog.require('os.interaction.DoubleClickZoom');
const DragBox = goog.require('os.interaction.DragBox');
const DragCircle = goog.require('os.interaction.DragCircle');
const DragZoom = goog.require('os.interaction.DragZoom');
const DrawLine = goog.require('os.interaction.DrawLine');
const DrawPolygon = goog.require('os.interaction.DrawPolygon');
const Hover = goog.require('os.interaction.Hover');
const KeyboardPan = goog.require('os.interaction.KeyboardPan');
const KeyboardTiltRotate = goog.require('os.interaction.KeyboardTiltRotate');
const KeyboardZoom = goog.require('os.interaction.KeyboardZoom');
const Measure = goog.require('os.interaction.Measure');
const MouseRotate = goog.require('os.interaction.MouseRotate');
const MouseZoom = goog.require('os.interaction.MouseZoom');
const PinchZoom = goog.require('os.interaction.PinchZoom');
const Reset = goog.require('os.interaction.Reset');
const Select = goog.require('os.interaction.Select');
const mapMenu = goog.require('os.ui.menu.map');
const spatial = goog.require('os.ui.menu.spatial');
const MouseWheelZoom = goog.require('os.ui.ol.interaction.MouseWheelZoom');

const interaction = goog.requireType('ol.interaction');
const ContextMenuOptions = goog.requireType('os.ui.ol.interaction.ContextMenuOptions');


/**
 * Get interactions that should be registered with the map.
 *
 * @return {Collection}
 */
const getInteractions = function() {
  // interaction to use ctrl+drag for zooming
  var ctrlZoom = new DragZoom();

  // interaction to disable alt+shift+drag to rotate the map and shift+drag to zoom from the defaults
  var options = {
    delta: 0.2
  };

  // Mouse Wheel zoom AND left+right click and drag zoom
  var mwZoom = new MouseWheelZoom(options);
  var mZoom = new MouseZoom(options);
  var dcZoom = new DoubleClickZoom();

  // Mouse rotate
  var mRotate = new MouseRotate(options);

  // Screen pinch-zoom
  var pinchZoom = new PinchZoom();

  var keyTiltRotate = new KeyboardTiltRotate(options);

  // interaction to handle selecting vector features
  var select = new Select(options);

  var dragPan = new DragPan({
    kinetic: undefined,
    delta: 0.2
  });

  // interaction to handle highlighting vector features
  var hover = new Hover(options);

  // interaction for drawing rectangular areas
  var drawBox = new DragBox();

  // interaction for drawing circular areas
  var drawCircle = new DragCircle();

  // interaction for drawing polygon areas
  var drawPolygon = new DrawPolygon();

  // interaction for drawing lines
  var drawLine = new DrawLine();

  // interaction for double clicking features
  var doubleClick = new DoubleClick();

  // interaction for measure tool
  var measure = new Measure();

  var kbPan = new KeyboardPan();

  var kbZoom = new KeyboardZoom(options);

  var reset = new Reset();

  asserts.assert(mapMenu.MENU != null, 'map manager has not been initialized');
  asserts.assert(spatial.MENU != null, 'spatial manager has not been initialized');

  var contextOptions = /** @type {ContextMenuOptions} */ ({
    featureMenu: spatial.MENU,
    mapMenu: mapMenu.MENU
  });
  var contextMenu = new ContextMenu(contextOptions);

  // Run order is backwards, so 0 index is run last
  var interactions = new Collection([
    hover,
    keyTiltRotate,
    kbPan,
    kbZoom,
    ctrlZoom,
    pinchZoom,
    dragPan,
    mwZoom,
    mZoom,
    dcZoom,
    mRotate,
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

exports = {
  getInteractions
};

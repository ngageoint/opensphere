goog.declareModuleId('os.map.interaction');

import Collection from 'ol/src/Collection.js';
import DragPan from 'ol/src/interaction/DragPan.js';

import ContextMenu from '../interaction/contextmenuinteraction.js';
import DoubleClick from '../interaction/doubleclickinteraction.js';
import DoubleClickZoom from '../interaction/doubleclickzoominteraction.js';
import DragBox from '../interaction/dragboxinteraction.js';
import DragCircle from '../interaction/dragcircleinteraction.js';
import DragZoom from '../interaction/dragzoominteraction.js';
import DrawLine from '../interaction/drawlineinteraction.js';
import DrawPolygon from '../interaction/drawpolygoninteraction.js';
import Hover from '../interaction/hoverinteraction.js';
import KeyboardPan from '../interaction/keyboardpaninteraction.js';
import KeyboardTiltRotate from '../interaction/keyboardtiltrotateinteraction.js';
import KeyboardZoom from '../interaction/keyboardzoominteraction.js';
import Measure from '../interaction/measureinteraction.js';
import MouseRotate from '../interaction/mouserotateinteraction.js';
import MouseZoom from '../interaction/mousezoominteraction.js';
import PinchZoom from '../interaction/pinchzoominteraction.js';
import Reset from '../interaction/resetinteraction.js';
import Select from '../interaction/selectinteraction.js';
import * as mapMenu from '../ui/menu/mapmenu.js';
import * as spatial from '../ui/menu/spatial.js';
import MouseWheelZoom from '../ui/ol/interaction/mousewheelzoominteraction.js';

const asserts = goog.require('goog.asserts');

const {default: ContextMenuOptions} = goog.requireType('os.ui.ol.interaction.ContextMenuOptions');


/**
 * Get interactions that should be registered with the map.
 *
 * @return {Collection}
 */
export const getInteractions = function() {
  // interaction to use ctrl+drag for zooming
  var ctrlZoom = new DragZoom();

  // interaction to disable alt+shift+drag to rotate the map and shift+drag to zoom from the defaults
  var options = {
    maxDelta: 0.2,
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

  asserts.assert(mapMenu.getMenu() != null, 'map manager has not been initialized');
  asserts.assert(spatial.getMenu() != null, 'spatial manager has not been initialized');

  var contextOptions = /** @type {ContextMenuOptions} */ ({
    featureMenu: spatial.getMenu(),
    mapMenu: mapMenu.getMenu()
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

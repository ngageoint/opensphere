goog.declareModuleId('os.control');

import Collection from 'ol/src/Collection.js';

import MousePosition from '../ol/control/mousepositioncontrol.js';
import * as osProj from '../proj/proj.js';
import AlertPopup from './alertpopup.js';
import Attribution from './attribution.js';
import MapMode from './mapmodecontrol.js';
import Rotate from './rotatecontrol.js';
import ScaleLine from './scaleline.js';
import Zoom from './zoomcontrol.js';
import ZoomLevel from './zoomlevel.js';



/**
 * @return {Collection}
 */
export const getControls = function() {
  var controls = [];

  var scaleLine = new ScaleLine({
    className: 'ol-scale-line',
    target: document.getElementById('scale-line')
  });
  var el = scaleLine.element;
  el.className += ' position-relative';
  controls.push(scaleLine);

  var mousePositionEle = document.getElementById('mouse-position');
  if (mousePositionEle) {
    var mousePositionControl = new MousePosition({
      projection: osProj.EPSG4326,
      className: 'ol-mouse-position',
      target: mousePositionEle,
      placeholder: '&nbsp;',
      useSettings: true
    });
    el = mousePositionControl.getElement();
    el.className += ' position-relative';
    controls.push(mousePositionControl);
  }

  var zoomLevel = new ZoomLevel({
    target: document.getElementById('zoom-level')
  });
  el = zoomLevel.getElement();
  el.className += ' position-relative';
  controls.push(zoomLevel);

  var zoomCtrl = new Zoom();
  controls.push(zoomCtrl);

  var rotate = new Rotate();
  controls.push(rotate);

  var mapMode = new MapMode();
  controls.push(mapMode);

  var alerts = new AlertPopup();
  controls.push(alerts);

  var attributions = new Attribution(/** @type {olx.control.AttributionOptions} */ ({
    collapsible: false
  }));

  controls.push(attributions);

  return new Collection(controls);
};

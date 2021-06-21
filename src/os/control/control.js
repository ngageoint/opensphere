goog.module('os.control');
goog.module.declareLegacyNamespace();

const Collection = goog.require('ol.Collection');
const AlertPopup = goog.require('os.control.AlertPopup');
const Attribution = goog.require('os.control.Attribution');
const MapMode = goog.require('os.control.MapMode');
const Rotate = goog.require('os.control.Rotate');
const ScaleLine = goog.require('os.control.ScaleLine');
const Zoom = goog.require('os.control.Zoom');
const ZoomLevel = goog.require('os.control.ZoomLevel');
const MousePosition = goog.require('os.ol.control.MousePosition');


/**
 * @return {Collection}
 */
const getControls = function() {
  var controls = [];

  var scaleLine = new ScaleLine({
    className: 'ol-scale-line',
    target: document.getElementById('scale-line')
  });
  var el = scaleLine.getElement();
  el.className += ' position-relative';
  controls.push(scaleLine);

  var mousePositionEle = document.getElementById('mouse-position');
  if (mousePositionEle) {
    var mousePositionControl = new MousePosition({
      projection: os.proj.EPSG4326,
      className: 'ol-mouse-position',
      target: mousePositionEle,
      undefinedHTML: '&nbsp;',
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

exports = {
  getControls
};

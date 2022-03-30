goog.declareModuleId('plugin.heatmap');

import {createCanvasContext2D} from 'ol/src/dom.js';
import {getCenter, scaleFromCenter} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import AlertEventSeverity from '../../os/alert/alerteventseverity.js';
import AlertManager from '../../os/alert/alertmanager.js';
import DataManager from '../../os/data/datamanager.js';
import RecordField from '../../os/data/recordfield.js';
import * as dispatcher from '../../os/dispatcher.js';
import LayerConfigEvent from '../../os/events/layerconfigevent.js';
import LayerConfigEventType from '../../os/events/layerconfigeventtype.js';
import ZipExporter from '../../os/ex/zipexporter.js';
import * as osFeature from '../../os/feature/feature.js';
import OSFile from '../../os/file/file.js';
import FilePersistence from '../../os/file/persist/filepersistence.js';
import * as fn from '../../os/fn/fn.js';
import Job from '../../os/job/job.js';
import JobEventType from '../../os/job/jobeventtype.js';
import LayerType from '../../os/layer/layertype.js';
import MapContainer from '../../os/mapcontainer.js';
import * as osOlFeature from '../../os/ol/feature.js';
import {ROOT} from '../../os/os.js';
import * as style from '../../os/style/style.js';
import exportManager from '../../os/ui/file/uiexportmanager.js';
import * as worker from '../../os/worker.js';
import HeatmapField from './heatmapfield.js';

const dispose = goog.require('goog.dispose');
const googString = goog.require('goog.string');


/**
 * Identifier for heatmap plugin components.
 * @type {string}
 */
export const ID = 'heatmap';

/**
 * Factor to use for scaling Openlayers extents to render the heatmap properly.
 * @type {number}
 */
export const EXTENT_SCALE_FACTOR = 1.5;

/**
 * Clones a feature. This avoids copying style information since we handle styles very differently than base OL3.
 *
 * @param {!Feature} feature The feature to clone
 * @return {?Feature} The cloned feature
 */
export const cloneFeature = function(feature) {
  var clone = null;
  var geometry = feature.getGeometry();

  if (geometry && geometry.getExtent().indexOf(Infinity) === -1) {
    clone = new Feature();

    // get the real geometry name and put it on the feature
    var geometryType = geometry.getType();
    clone.set(HeatmapField.GEOMETRY_TYPE, geometryType);

    // put a clone of the geometry on the feature
    clone.set(HeatmapField.HEATMAP_GEOMETRY, osOlFeature.cloneGeometry(geometry));

    // get the ellipse and put it on the feature (if applicable)
    var ellipse = feature.get(RecordField.ELLIPSE);
    var shapeName = osFeature.getShapeName(feature);
    if (ellipse && (shapeName == style.ShapeType.ELLIPSE || shapeName == style.ShapeType.ELLIPSE_CENTER)) {
      clone.set(HeatmapField.GEOMETRY_TYPE, ellipse.getType());
      clone.set(HeatmapField.HEATMAP_GEOMETRY, osOlFeature.cloneGeometry(ellipse));
    }

    // generate the centerpoint and center the feature there for rendering
    var extent = geometry.getExtent();
    var center = getCenter(extent);
    var pointGeometry = new Point(center);
    clone.setGeometry(pointGeometry);
  }

  return clone;
};

/**
 * Get features to use for a heatmap from a source.
 *
 * @param {string|undefined} sourceId The source id.
 * @return {Array<!Feature>|undefined} The features.
 */
export const getSourceFeatures = function(sourceId) {
  var source = sourceId ? DataManager.getInstance().getSource(sourceId) : undefined;
  return source ? source.getFeatures().map(function(feature, idx, arr) {
    if (feature) {
      var clone = cloneFeature(feature);
      if (clone) {
        clone.setId(idx);
        return clone;
      }
    }

    return undefined;
  }).filter(fn.filterFalsey) : undefined;
};

/**
 * Takes a list of color strings and constructs a gradient image data array.
 *
 * @param {Array<string>} colors
 * @return {Uint8ClampedArray} An array.
 */
export const createGradient = function(colors) {
  var width = 1;
  var height = 256;
  var context = createCanvasContext2D(width, height);

  var gradient = context.createLinearGradient(0, 0, width, height);
  var step = 1 / (colors.length - 1);
  for (var i = 0, ii = colors.length; i < ii; ++i) {
    gradient.addColorStop(i * step, colors[i]);
  }

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  return context.getImageData(0, 0, width, height).data;
};

/**
 * Create a heatmap based on the passed layer.
 *
 * @param {ILayer} layer
 */
export const createHeatmap = function(layer) {
  var options = {
    'id': googString.getRandomString(),
    'sourceId': /** @type {ISource} */ (/** @type {OLLayer} */ (layer).getSource()).getId(),
    'title': layer.getTitle(),
    'animate': false,
    'layerType': LayerType.FEATURES,
    'explicitType': '',
    'type': ID,
    'loadOnce': true
  };

  var configEvent = new LayerConfigEvent(LayerConfigEventType.CONFIGURE_AND_ADD, options);
  dispatcher.getInstance().dispatchEvent(configEvent);
};

/**
 * Exports a heatmap to a KMZ as a GroundOverlay.
 *
 * @param {HeatmapLayer} layer
 */
export const exportHeatmap = function(layer) {
  var lastImage = layer.getLastImage();
  var canvas = lastImage.getImage();
  var dataUrl = canvas.toDataURL();

  var jobUrl = ROOT + worker.DIR + 'dataurltoarray.js';
  var job = new Job(jobUrl, 'Canvas to Blob', 'Converting canvas data URL to a Blob.');
  job.listenOnce(JobEventType.COMPLETE, goog.partial(onImageComplete, layer));
  job.listenOnce(JobEventType.ERROR, onImageError);
  job.startExecution({
    'dataUrl': dataUrl
  });
};

/**
 * Handle image job completion
 *
 * @param {HeatmapLayer} layer
 * @param {JobEvent} event
 */
export const onImageComplete = function(layer, event) {
  dispose(event.target);

  if (event.data instanceof Uint8Array) {
    var blob = new Blob([event.data], {type: 'image/png'});
    var imageFile = new OSFile();
    imageFile.setFileName('heatmap.png');
    imageFile.setContent(blob);
    imageFile.setContentType('image/png');

    var layerTitle = layer.getTitle();
    var extent = layer.getExtent().slice();
    scaleFromCenter(extent, 1 / EXTENT_SCALE_FACTOR);
    var mm = MapContainer.getInstance();
    var view = mm.getMap().getView();
    var centerLat = view.getCenter()[1];
    var centerLon = view.getCenter()[0];
    var altitude = mm.getAltitude();
    var kml = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2">' +
        '<Document><name>Heatmap</name>' +
        '<Camera><latitude>' + centerLat + '</latitude>' +
        '<longitude>' + centerLon + '</longitude>' +
        '<altitude>' + altitude + '</altitude>' +
        '<tilt>0</tilt><heading>0</heading><roll>0</roll></Camera>' +
        '<GroundOverlay><name>' + layerTitle + '</name>' +
        '<Icon><href>heatmap.png</href></Icon>' +
        '<LatLonBox><north>' + extent[3] + '</north><south>' + extent[1] + '</south><east>' +
        extent[2] + '</east><west>' + extent[0] + '</west></LatLonBox></GroundOverlay>' +
        '</Document></kml>';

    var kmlFile = new OSFile();
    kmlFile.setFileName('index.kml');
    kmlFile.setContent(kml);
    kmlFile.setContentType('application/vnd.google-earth.kml+xml');

    var exporter = new ZipExporter();
    exporter.addFile(kmlFile);
    exporter.addFile(imageFile);
    exporter.setCompress(true);

    var persister = new FilePersistence();

    var options = /** @type {ExportOptions} */ ({
      items: [kmlFile],
      fields: [''],
      title: layerTitle + '.kmz',
      exporter,
      persister
    });

    exportManager.exportItems(options);
  } else {
    AlertManager.getInstance().sendAlert('Failed saving canvas to PNG');
  }
};

/**
 * Handle job failure
 *
 * @param {JobEvent} event
 */
export const onImageError = function(event) {
  dispose(event.target);

  var msg = typeof event.data === 'string' ? event.data : 'Screen capture failed due to an unspecified error';
  AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
};

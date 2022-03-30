goog.declareModuleId('os.proj.switch.SwitchProjection');

import Tile from 'ol/src/layer/Tile.js';
import VectorTile from 'ol/src/layer/VectorTile.js';
import {equivalent, get} from 'ol/src/proj.js';

import CommandProcessor from '../command/commandprocessor.js';
import LayerAdd from '../command/layeraddcmd.js';
import LayerRemove from '../command/layerremovecmd.js';
import SequenceCommand from '../command/sequencecommand.js';
import SwitchView from '../command/switchviewcmd.js';
import ToggleWebGL from '../command/togglewebglcmd.js';
import TransformVectors from '../command/transformvectorscmd.js';
import DataManager from '../data/datamanager.js';
import osImplements from '../implements.js';
import ILayer from '../layer/ilayer.js';
import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import {initWorldArea} from '../query/queryutils.js';
import * as ConfirmUI from '../ui/window/confirm.js';
import BinnedLayersEvent from './binnedlayersevent.js';
import CommandListEvent from './commandlistevent.js';
import * as osProj from './proj.js';
import {isRasterReprojectionEnabled} from './reprojection.js';

const Delay = goog.require('goog.async.Delay');
const EventTarget = goog.require('goog.events.EventTarget');

const {default: ICommand} = goog.requireType('os.command.ICommand');
const {default: BinnedLayersType} = goog.requireType('os.proj.switch.BinnedLayersType');


/**
 */
export default class SwitchProjection extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {Delay}
     * @private
     */
    this.delay_ = new Delay(this.prompt_, 200, this);

    /**
     * @type {!Array<ol.layer.Layer>}
     * @private
     */
    this.layers_ = [];

    /**
     * @type {!Array<Object<string, *>>}
     * @private
     */
    this.configs_ = [];

    /**
     * @type {?ol.proj.Projection}
     * @private
     */
    this.oldProjection_ = null;

    /**
     * @type {?ol.proj.Projection}
     * @private
     */
    this.newProjection_ = null;
  }

  /**
   * @return {?ol.proj.Projection}
   */
  getOldProjection() {
    return this.oldProjection_;
  }

  /**
   * @return {?ol.proj.Projection}
   */
  getNewProjection() {
    return this.newProjection_;
  }

  /**
   * @param {ol.layer.Layer} layer
   */
  addLayer(layer) {
    if (!this.oldProjection_) {
      this.oldProjection_ = osMap.PROJECTION;
    }

    if (!this.newProjection_) {
      this.newProjection_ = osProj.getBestEquivalent(layer.getSource().getProjection());
    }

    if (this.layers_.indexOf(layer) === -1) {
      this.layers_.push(layer);
    }

    this.delay_.start();
  }

  /**
   * @param {Object<string, *>} config The config
   */
  addConfig(config) {
    this.configs_.push(config);
  }

  /**
   * Starts a projection change
   *
   * @param {ol.ProjectionLike} projection
   */
  start(projection) {
    if (!this.oldProjection_) {
      this.oldProjection_ = osMap.PROJECTION;
    }

    if (!this.newProjection_) {
      var p = osProj.getBestEquivalent(projection);

      if (p) {
        this.newProjection_ = p;
      }
    }

    if (this.oldProjection_ && this.newProjection_) {
      this.delay_.start();
    }
  }

  /**
   * Prompt the user with the items that will change
   *
   * @private
   */
  prompt_() {
    var layers = this.binLayers();

    var oldCode = this.oldProjection_.getCode();
    var newCode = this.newProjection_.getCode();

    var text = '<p>You have attempted to ' +
        (this.layers_.length ? 'enable layers that are in a different projection' : 'change projections') + '</p>' +
        '<ul><li>Current Projection: ' + oldCode + '</li>' +
        '<li>New Projection: ' + newCode + '</li></ul>';

    text += '<p>Switching to the new projection will cause the following actions:</p>';

    var toAdd = layers.add.slice();

    var list = [{
      title: 'removed',
      layers: layers.remove
    }, {
      title: 'added',
      layers: toAdd
    }, {
      title: 'reconfigured',
      layers: layers.reconfig
    }];

    for (var i = 0, n = list.length; i < n; i++) {
      var title = list[i].title;
      var layerList = list[i].layers;

      if (layerList.length) {
        var titles = layerList.map(mapLayerTitle);
        text += '<p>These layers will be <strong>' + title + '</strong></p>' + '<ul><li>' +
            titles.join('</li><li>') + '</li></ul>';
      }
    }

    if (newCode != osProj.EPSG4326 && newCode != osProj.EPSG3857 && getMapContainer().is3DEnabled()) {
      text += '<p>The 3D view does not support the new projection. The view will be switched to 2D.</p>';
    }

    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: this.performSwitch.bind(this, layers),
      cancel: this.cancelSwitch.bind(this),
      prompt: text,
      yesText: 'Switch',
      yesIcon: 'fa fa-exchange',
      windowOptions: {
        'label': this.layers_.length ? 'Differing Projections' : 'Projection Change',
        'icon': 'fa fa-warning',
        'x': 'center',
        'y': 'center',
        'width': '500',
        'min-width': '300',
        'max-width': '600',
        'height': 'auto',
        'modal': 'true',
        'headerClass': 'bg-warning u-bg-warning-text'
      }
    }));
  }

  /**
   * Cancels the projection switch
   *
   * @protected
   */
  cancelSwitch() {
    var dm = DataManager.getInstance();

    for (var i = 0, n = this.layers_.length; i < n; i++) {
      var layer = /** @type {ILayer} */ (this.layers_[i]);
      var d = dm.getDescriptor(layer.getId());

      if (d) {
        d.setActive(false);
      }

      this.layers_[i].dispose();
    }

    this.clear();
  }

  /**
   * Performs the projection switch
   *
   * @param {BinnedLayersType} layers
   * @protected
   */
  performSwitch(layers) {
    var cmds = [];

    if (this.oldProjection_ && this.newProjection_) {
      var useWebGL = getMapContainer().is3DEnabled();

      // Step 1: stop updates to Openlayers and the WebGL renderer
      if (useWebGL) {
        cmds.push(new ToggleWebGL(false, true));
      }

      // Step 2: remove layers to be removed in the proper order
      this.addLayerSequence(layers.remove, true, cmds);

      // Step 3: remove layers to be configured in the proper order
      this.addLayerSequence(layers.reconfig, true, cmds);

      // Step 4: switch main Openlayers view (update osMap.PROJECTION)
      cmds.push(new SwitchView(this.newProjection_));

      // Step 5: Transform all vectors
      cmds.push(new TransformVectors(this.oldProjection_, this.newProjection_));

      // Step 6: Add layers to be configured in the correct order
      this.addLayerSequence(layers.reconfig, false, cmds);

      // Step 7: Add new layers
      this.addLayerSequence(layers.add, false, cmds);

      // Step 8: enable updates to Openlayers and the WebGL renderer
      if (useWebGL) {
        cmds.push(new ToggleWebGL(useWebGL, true));
      }

      initWorldArea(true);

      // Step 9: Let plugins do stuff
      this.dispatchEvent(new CommandListEvent(cmds));

      // add and execute the overall command
      var cp = CommandProcessor.getInstance();
      var cmd = new SequenceCommand();
      cmd.title = 'Switch projection from ' + this.oldProjection_.getCode() + ' to ' + this.newProjection_.getCode();
      cmd.setCommands(cmds);
      cp.addCommand(cmd);
    }

    // clean up
    this.clear();
  }

  /**
   * @param {Array<Object<string, *>>} layers
   * @param {boolean} remove
   * @param {Array<ICommand>} cmdList
   * @protected
   */
  addLayerSequence(layers, remove, cmdList) {
    var cmds = [];

    if (!remove) {
      layers.reverse();
    }

    for (var i = 0, n = layers.length; i < n; i++) {
      var cmd = remove ? new LayerRemove(layers[i]) : new LayerAdd(layers[i]);
      cmds.push(cmd);
    }

    if (cmds.length) {
      cmd = new SequenceCommand();
      cmd.setCommands(cmds);
      cmdList.push(cmd);
    }
  }

  /**
   * Clears the cache of stuff
   *
   * @protected
   */
  clear() {
    this.layers_.length = 0;
    this.configs_.length = 0;
    this.oldProjection_ = null;
    this.newProjection_ = null;
  }

  /**
   * @return {BinnedLayersType}
   * @protected
   */
  binLayers() {
    // loop over all the layers in the application and determine which ones are
    //    supported: layers which can be locally re-projected with 100% accuracy (vector layers)
    //    unsupported: tile layers that do not support the new projection and will be removed
    //    unknown: layers which might support the new projection, but we don't know for sure
    //    refresh: layers which support the new projection but will have to be refreshed
    //    reconfig: layers which support the new projection but need to be removed, reconfigured, and re-added
    var layers = getMapContainer().getLayers();

    var bins = {
      remove: [],
      unknown: [],
      reconfig: [],
      add: this.layers_.map(
          /**
           * @param {ol.layer.Layer} layer
           * @param {number} i
           * @param {Array<ol.layer.Layer>} arr
           * @return {Object<string, *>}
           */
          function(layer, i, arr) {
            return /** @type {ILayer} */ (layer).getLayerOptions();
          }).concat(this.configs_)
    };

    var i = layers.length;
    while (i--) {
      var layer = /** @type {ILayer} */ (layers[i]);
      var options = layer.getLayerOptions();

      if (layer instanceof Tile || layer instanceof VectorTile) {
        if (osImplements(layer, ILayer.ID)) {
          var projections = /** @type {!Array<!string>} */ (options['projections'] || []);

          if (!projections.length && options['projection']) {
            projections.push(/** @type {!string} */ (options['projection']));
          }

          if (projections.length) {
            var found = false;
            for (var j = 0, m = projections.length; j < m; j++) {
              var p = get(projections[j]);

              if (p && (isRasterReprojectionEnabled() || equivalent(p, this.newProjection_))) {
                bins.reconfig.push(options);
                found = true;
                break;
              }
            }

            if (!found) {
              bins.remove.push(options);
            }
          } else {
            // for now, just reconfig anything unknown rather than binning it as unknown
            bins.reconfig.push(options);
          }
        }
      }
    }

    this.dispatchEvent(new BinnedLayersEvent(bins));
    return bins;
  }

  /**
   * Get the global instance.
   * @return {!SwitchProjection}
   */
  static getInstance() {
    if (!instance) {
      instance = new SwitchProjection();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {SwitchProjection} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {SwitchProjection|undefined}
 */
let instance;

/**
 * @param {Object<string, *>} item
 * @param {number} i
 * @param {Array<Object<string, *>>} arr
 * @return {string}
 */
const mapLayerTitle = function(item, i, arr) {
  return /** @type {string} */ (item['title']);
};

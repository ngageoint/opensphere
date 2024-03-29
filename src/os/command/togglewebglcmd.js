goog.declareModuleId('os.command.ToggleWebGL');

import DataManager from '../data/datamanager.js';
import {getMapContainer} from '../map/mapinstance.js';
import MapMode from '../map/mapmode.js';
import * as ogc from '../ogc/ogc.js';
import launch2DPerformanceDialog from '../webgl/launch2dperfdialog.js';
import AbstractAsyncCommand from './abstractasynccommand.js';
import EventType from './eventtype.js';
import State from './state.js';


/**
 * Command to switch between 2D/3D map modes.
 */
export default class ToggleWebGL extends AbstractAsyncCommand {
  /**
   * Constructor.
   * @param {boolean} toggle If WebGL should be enabled.
   * @param {boolean=} opt_silent If errors should be ignored.
   */
  constructor(toggle, opt_silent) {
    super();
    this.details = null;
    this.isAsync = true;
    this.state = State.READY;
    this.title = 'Switch to ' + (toggle ? '3D' : '2D') + ' Mode';

    /**
     * If WebGL should be enabled.
     * @type {boolean}
     * @protected
     */
    this.webGLEnabled = toggle;

    /**
     * If errors should be ignored.
     * @type {boolean}
     * @protected
     */
    this.silent = opt_silent != null ? opt_silent : false;
  }

  /**
   * If the application allows switching the map mode.
   *
   * @param {boolean} webGLEnabled If WebGL is being used
   * @return {boolean}
   * @protected
   */
  canSwitch(webGLEnabled) {
    if (!webGLEnabled && !this.silent) {
      // make sure switching to 2D won't destroy the browser
      var totalCount = DataManager.getInstance().getTotalFeatureCount();
      var maxCount = ogc.getMaxFeatures(MapMode.VIEW_2D);

      if (totalCount > maxCount) {
        return false;
      }
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  execute() {
    const map = getMapContainer();
    if (!map) {
      this.state = State.ERROR;
      this.details = 'Map container not available.';
      return false;
    }

    this.state = State.EXECUTING;

    var webGLEnabled = this.webGLEnabled;

    if (this.canSwitch(webGLEnabled)) {
      map.setWebGLEnabled(webGLEnabled, this.silent);
      return this.finish();
    } else {
      launch2DPerformanceDialog().then(() => {
        map.setWebGLEnabled(webGLEnabled, this.silent);
        this.finish();
      }, () => {
        this.handleError(this.title + ' cancelled by user.');
      });
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    const map = getMapContainer();
    if (!map) {
      this.state = State.ERROR;
      this.details = 'Map container not available.';
      return false;
    }

    this.state = State.REVERTING;

    var webGLEnabled = !this.webGLEnabled;

    if (this.canSwitch(webGLEnabled)) {
      map.setWebGLEnabled(webGLEnabled, this.silent);
      return super.revert();
    } else {
      launch2DPerformanceDialog().then(() => {
        map.setWebGLEnabled(webGLEnabled, this.silent);

        this.state = State.READY;
        this.details = null;
        this.dispatchEvent(EventType.REVERTED);
      }, () => {
        this.handleError(this.title + ' cancelled by user.');
      });
    }

    return true;
  }
}

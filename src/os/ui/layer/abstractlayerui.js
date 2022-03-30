goog.declareModuleId('os.ui.layer.AbstractLayerUICtrl');

import {listen, unlistenByKey} from 'ol/src/events.js';
import {ObjectEvent} from 'ol/src/Object.js';

import CommandProcessor from '../../command/commandprocessor.js';
import ParallelCommand from '../../command/parallelcommand.js';
import {isLayerNode} from '../../data/data.js';
import PropertyChangeEvent from '../../events/propertychangeevent.js';
import LayerGroup from '../../layer/layergroup.js';
import PropertyChange from '../../layer/propertychange.js';
import MapChange from '../../map/mapchange.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {apply} from '../ui.js';

const Disposable = goog.require('goog.Disposable');
const Delay = goog.require('goog.async.Delay');
const nextTick = goog.require('goog.async.nextTick');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');

const {default: ICommand} = goog.requireType('os.command.ICommand');
const {default: LayerNode} = goog.requireType('os.data.LayerNode');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * Base controller for a layer node UI.
 * @unrestricted
 */
export default class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Delay to debounce UI initialization calls.
     * @type {Delay}
     * @private
     */
    this.initDelay_ = new Delay(this.onInitDelay_, 25, this);

    /**
     * Event types that should trigger a UI update.
     * @type {!Array<string>}
     * @protected
     */
    this.initEvents = [PropertyChange.STYLE];

    /**
     * Layer change event listener keys.
     * @type {!Array<ol.EventsKey>}
     * @private
     */
    this.layerListenKeys_ = [];

    /**
     * If 3D mode is enabled.
     * @type {boolean}
     */
    this['is3DEnabled'] = getMapContainer().is3DEnabled();
    getMapContainer().listen(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);

    $scope.$watch('items', this.onItemsChange.bind(this));
    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.removeLayerListeners_();

    getMapContainer().unlisten(GoogEventType.PROPERTYCHANGE, this.onMapChange_, false, this);

    dispose(this.initDelay_);
    this.initDelay_ = null;

    this.scope = null;
    this.element = null;
  }

  /**
   * Gets a value
   *
   * @param {function(ILayer):?} callback
   * @param {?=} opt_default
   * @return {?}
   * @protected
   */
  getValue(callback, opt_default) {
    var defaultVal = opt_default !== undefined ? opt_default : 1;

    var nodes = this.getLayerNodes();
    for (var i = 0, n = nodes.length; i < n; i++) {
      var layer = nodes[i].getLayer();
      if (layer) {
        var val = callback(layer);
        return val !== undefined ? val : defaultVal;
      }
    }

    return defaultVal;
  }

  /**
   * Creates a command to run on each layer node
   *
   * @param {function(ILayer):ICommand} commandFunction
   */
  createCommand(commandFunction) {
    var cmds = [];

    var nodes = this.getLayerNodes();
    for (var i = 0, n = nodes.length; i < n; i++) {
      var layer = nodes[i].getLayer();
      if (layer) {
        var cmd = commandFunction(layer);
        if (cmd) {
          // if we have a layer and get a command, add it
          cmds.push(cmd);
        }
      }
    }

    var cmd = null;
    if (cmds.length > 1) {
      cmd = new ParallelCommand();
      cmd.setCommands(cmds);
      cmd.title = cmds[0].title + ' (' + cmds.length + ' layers)';
    } else if (cmds.length > 0) {
      cmd = cmds[0];
    }

    if (cmd) {
      CommandProcessor.getInstance().addCommand(cmd);
    }
  }

  /**
   * Get the layer nodes from the list of UI items.
   *
   * @return {!Array<!LayerNode>}
   * @protected
   */
  getLayerNodes() {
    var nodes = [];

    var items = this.scope['items'] || [];
    items = /** @type {!Array<!LayerNode>} */ (items.filter(isLayerNode));

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var layer = item.getLayer();
      if (layer instanceof LayerGroup) {
        // add the layer nodes under the group
        var children = item.getChildren();
        if (children) {
          nodes = nodes.concat(children);
        }
      } else {
        // not a group, add the node
        nodes.push(item);
      }
    }

    return nodes;
  }

  /**
   * Initializes UI values from the layer.
   *
   * @protected
   */
  initUI() {
    // allow init calls to finish, then apply the scope
    nextTick(() => {
      apply(this.scope);
    });
  }

  /**
   * Request UI initialization after a brief delay.
   *
   * @protected
   */
  refreshUI() {
    if (!this.isDisposed() && this.initDelay_) {
      this.initDelay_.start();
    }
  }

  /**
   * Initializes UI values from the layer.
   *
   * @private
   */
  onInitDelay_() {
    if (!this.isDisposed()) {
      this.initUI();
    }
  }

  /**
   * Handles updates to the items array.
   *
   * @param {Array<!LayerNode>} newVal The new items value.
   * @param {Array<!LayerNode>} oldVal The old items value.
   * @protected
   */
  onItemsChange(newVal, oldVal) {
    if (!this.isDisposed()) {
      // remove any existing listeners
      this.removeLayerListeners_();

      // start the UI refresh delay
      this.initUI();

      // register listeners to handle updating the UI on style change
      if (newVal) {
        var nodes = newVal.filter(isLayerNode);
        for (var i = 0, n = nodes.length; i < n; i++) {
          var layer = /** @type {ol.layer.Layer} */ (nodes[i].getLayer());
          if (layer) {
            this.layerListenKeys_.push(listen(layer, GoogEventType.PROPERTYCHANGE, this.onLayerPropertyChange, this));
          }
        }
      }
    }
  }

  /**
   * Handles layer property change events.
   *
   * @param {PropertyChangeEvent|ObjectEvent} event
   * @protected
   */
  onLayerPropertyChange(event) {
    if (!this.isDisposed()) {
      // initialize the control if it's an OL event for a property we're controlling, or for our own style events
      if (event instanceof ObjectEvent && this.scope[event.key] != null) {
        this.refreshUI();
      } else if (event instanceof PropertyChangeEvent) {
        var p = event.getProperty();
        if (p && this.initEvents.indexOf(p) != -1) {
          this.refreshUI();
        }
      }
    }
  }

  /**
   * Clear any layer change listeners.
   *
   * @private
   */
  removeLayerListeners_() {
    this.layerListenKeys_.forEach(unlistenByKey);
    this.layerListenKeys_.length = 0;
  }

  /**
   * Handle map property changes.
   *
   * @param {PropertyChangeEvent} event The change event.
   * @private
   */
  onMapChange_(event) {
    if (event.getProperty() == MapChange.VIEW3D) {
      this['is3DEnabled'] = getMapContainer().is3DEnabled();
      apply(this.scope);
    }
  }
}

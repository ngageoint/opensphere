goog.provide('os.ui.layer.AbstractLayerUICtrl');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('goog.async.nextTick');
goog.require('goog.events.EventType');
goog.require('ol.Object');
goog.require('ol.events');
goog.require('os.MapChange');
goog.require('os.command.ParallelCommand');
goog.require('os.layer.LayerGroup');



/**
 * Base controller for a layer node UI.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.layer.AbstractLayerUICtrl = function($scope, $element) {
  os.ui.layer.AbstractLayerUICtrl.base(this, 'constructor');

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
   * @type {goog.async.Delay}
   * @private
   */
  this.initDelay_ = new goog.async.Delay(this.onInitDelay_, 25, this);

  /**
   * Event types that should trigger a UI update.
   * @type {!Array<string>}
   * @protected
   */
  this.initEvents = [os.layer.PropertyChange.STYLE];

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
  this['is3DEnabled'] = os.MapContainer.getInstance().is3DEnabled();
  os.MapContainer.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.onMapChange_, false, this);

  $scope.$watch('items', this.onItemsChange.bind(this));
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.layer.AbstractLayerUICtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.layer.AbstractLayerUICtrl.prototype.disposeInternal = function() {
  os.ui.layer.AbstractLayerUICtrl.base(this, 'disposeInternal');

  this.removeLayerListeners_();

  os.MapContainer.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onMapChange_, false, this);

  goog.dispose(this.initDelay_);
  this.initDelay_ = null;

  this.scope = null;
  this.element = null;
};


/**
 * Gets a value
 * @param {function(os.layer.ILayer):?} callback
 * @param {?=} opt_default
 * @return {?}
 * @protected
 */
os.ui.layer.AbstractLayerUICtrl.prototype.getValue = function(callback, opt_default) {
  var defaultVal = goog.isDef(opt_default) ? opt_default : 1;

  var nodes = this.getLayerNodes();
  for (var i = 0, n = nodes.length; i < n; i++) {
    try {
      var layer = nodes[i].getLayer();
      if (layer) {
        var val = callback(layer);
        return goog.isDef(val) ? val : defaultVal;
      }
    } catch (e) {
    }
  }

  return 1;
};


/**
 * Creates a command to run on each layer node
 * @param {function(os.layer.ILayer):os.command.ICommand} commandFunction
 * @protected
 */
os.ui.layer.AbstractLayerUICtrl.prototype.createCommand = function(commandFunction) {
  var cmds = [];

  var nodes = this.getLayerNodes();
  for (var i = 0, n = nodes.length; i < n; i++) {
    try {
      var layer = nodes[i].getLayer();
      if (layer) {
        var cmd = commandFunction(layer);
        if (cmd) {
          // if we have a layer and get a command, add it
          cmds.push(cmd);
        }
      }
    } catch (e) {
    }
  }

  var cmd = null;
  if (cmds.length > 1) {
    cmd = new os.command.ParallelCommand();
    cmd.setCommands(cmds);
    cmd.title = cmds[0].title + ' (' + cmds.length + ' layers)';
  } else if (cmds.length > 0) {
    cmd = cmds[0];
  }

  if (cmd) {
    os.command.CommandProcessor.getInstance().addCommand(cmd);
  }
};


/**
 * Get the layer nodes from the list of UI items.
 * @return {!Array<!os.data.LayerNode>}
 * @protected
 */
os.ui.layer.AbstractLayerUICtrl.prototype.getLayerNodes = function() {
  var nodes = [];

  var items = this.scope['items'] || [];
  items = /** @type {!Array<!os.data.LayerNode>} */ (items.filter(os.ui.layer.isLayerNode));

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var layer = item.getLayer();
    if (layer instanceof os.layer.LayerGroup) {
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
};


/**
 * Initializes UI values from the layer.
 * @protected
 */
os.ui.layer.AbstractLayerUICtrl.prototype.initUI = function() {
  // allow init calls to finish, then apply the scope
  goog.async.nextTick(goog.partial(os.ui.apply, this.scope));
};


/**
 * Request UI initialization after a brief delay.
 * @protected
 */
os.ui.layer.AbstractLayerUICtrl.prototype.refreshUI = function() {
  if (!this.isDisposed() && this.initDelay_) {
    this.initDelay_.start();
  }
};


/**
 * Initializes UI values from the layer.
 * @private
 */
os.ui.layer.AbstractLayerUICtrl.prototype.onInitDelay_ = function() {
  if (!this.isDisposed()) {
    this.initUI();
  }
};


/**
 * Handles updates to the items array.
 * @param {Array<!os.data.LayerNode>} newVal The new items value.
 * @param {Array<!os.data.LayerNode>} oldVal The old items value.
 * @protected
 */
os.ui.layer.AbstractLayerUICtrl.prototype.onItemsChange = function(newVal, oldVal) {
  if (!this.isDisposed()) {
    // remove any existing listeners
    this.removeLayerListeners_();

    // start the UI refresh delay
    this.initUI();

    // register listeners to handle updating the UI on style change
    if (newVal) {
      var nodes = newVal.filter(os.ui.layer.isLayerNode);
      for (var i = 0, n = nodes.length; i < n; i++) {
        var layer = /** @type {ol.layer.Layer} */ (nodes[i].getLayer());
        if (layer) {
          this.layerListenKeys_.push(ol.events.listen(layer, goog.events.EventType.PROPERTYCHANGE,
              this.onLayerPropertyChange, this));
        }
      }
    }
  }
};


/**
 * Handles layer property change events.
 * @param {os.events.PropertyChangeEvent|ol.Object.Event} event
 * @protected
 */
os.ui.layer.AbstractLayerUICtrl.prototype.onLayerPropertyChange = function(event) {
  if (!this.isDisposed()) {
    // initialize the control if it's an OL event for a property we're controlling, or for our own style events
    if (event instanceof ol.Object.Event && this.scope[event.key] != null) {
      this.refreshUI();
    } else if (event instanceof os.events.PropertyChangeEvent) {
      var p = event.getProperty();
      if (p && this.initEvents.indexOf(p) != -1) {
        this.refreshUI();
      }
    }
  }
};


/**
 * Clear any layer change listeners.
 * @private
 */
os.ui.layer.AbstractLayerUICtrl.prototype.removeLayerListeners_ = function() {
  this.layerListenKeys_.forEach(ol.events.unlistenByKey);
  this.layerListenKeys_.length = 0;
};


/**
 * Handle map property changes.
 * @param {os.events.PropertyChangeEvent} event The change event.
 * @private
 */
os.ui.layer.AbstractLayerUICtrl.prototype.onMapChange_ = function(event) {
  if (event.getProperty() == os.MapChange.VIEW3D) {
    this['is3DEnabled'] = os.MapContainer.getInstance().is3DEnabled();
    os.ui.apply(this.scope);
  }
};


/**
 * Check if an item is a layer node.
 * @param {*} item The item
 * @return {boolean}
 */
os.ui.layer.isLayerNode = function(item) {
  return item instanceof os.data.LayerNode;
};

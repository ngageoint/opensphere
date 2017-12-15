goog.provide('os.proj.switch');
goog.provide('os.proj.switch.BinnedLayersEvent');
goog.provide('os.proj.switch.CommandListEvent');
goog.provide('os.proj.switch.ReprojectionWarning');
goog.provide('os.proj.switch.SwitchProjection');

goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('ol.layer.Tile');
goog.require('ol.proj.Projection');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerRemove');
goog.require('os.command.SequenceCommand');
goog.require('os.command.SwitchView');
goog.require('os.command.ToggleCesium');
goog.require('os.command.TransformVectors');
goog.require('os.data.LayerSyncDescriptor');
goog.require('os.map');


/**
 * Whether or not raster reprojection is supported.
 * @type {boolean}
 */
os.proj.switch.ENABLE_RASTER_REPROJECTION = true;


/**
 * @param {!ol.layer.Layer} layer
 * @return {boolean}
 */
os.proj.switch.checkLayer = function(layer) {
  var source = layer.getSource();

  if (source) {
    var p1 = source.getProjection();
    var p2 = os.map.PROJECTION;

    if (layer instanceof ol.layer.Tile && p1 && p2 && !ol.proj.equivalent(p1, p2)) {
      if (os.proj.switch.ENABLE_RASTER_REPROJECTION) {
        os.proj.switch.ReprojectionWarning.getInstance().addTitle(/** @type {os.layer.ILayer} */ (layer).getTitle());
      } else {
        os.proj.switch.SwitchProjection.getInstance().addLayer(layer);
        return false;
      }
    }
  }

  return true;
};


/**
 * @type {?os.command.ICommand}
 * @private
 */
os.proj.switch.rootCommand_ = null;


/**
 * @param {os.command.ICommand} command
 * @return {boolean}
 */
os.proj.switch.checkCommand = function(command) {
  var sp = os.proj.switch.SwitchProjection.getInstance();

  if (!command.title || command.title.indexOf('Switch projection') === 0) {
    return true;
  } else if (command instanceof os.command.AbstractCommandSet) {
    var cmds = /** @type {os.command.AbstractCommandSet} */ (command).getCommands();
    var setRoot = !os.proj.switch.rootCommand_;

    if (setRoot) {
      os.proj.switch.rootCommand_ = command;
    }

    var val = true;
    for (var i = 0, n = cmds.length; i < n && val; i++) {
      val = os.proj.switch.checkCommand(cmds[i]);
    }

    if (setRoot) {
      os.proj.switch.rootCommand_ = null;
    }

    return val;
  }

  var options = null;
  if (command instanceof os.command.LayerAdd) {
    options = /** @type {os.command.LayerAdd} */ (command).layerOptions;
  } else if (command instanceof os.data.ActivateDescriptor) {
    var d = /** @type {os.data.ActivateDescriptor} */ (command).getDescriptor();

    if (d instanceof os.data.LayerSyncDescriptor) {
      options = /** @type {os.data.LayerSyncDescriptor} */ (d).getOptions();
    }
  }

  var retVal = true;
  if (options) {
    options = goog.isArray(options) ? options : [options];
    options.forEach(function(opts) {
      var projections = /** @type {!Array<!string>} */ (opts['projections'] || []);

      if (!projections.length && opts['projection']) {
        projections.push(/** @type {!string} */ (opts['projection']));
      }

      if (projections.length) {
        var p1 = os.map.PROJECTION;

        for (i = 0, n = projections.length; i < n; i++) {
          var p2 = ol.proj.get(projections[i]);

          if (p2 && (os.proj.switch.ENABLE_RASTER_REPROJECTION || ol.proj.equivalent(p1, p2))) {
            retVal = true;
            return;
          }
        }

        sp.start(projections[0]);
        sp.addConfig(opts);

        retVal = false;
      }
    });
  }

  return retVal;
};



/**
 * @constructor
 */
os.proj.switch.ReprojectionWarning = function() {
  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.delay_ = new goog.async.Delay(this.onWarn_, 500, this);

  /**
   * @type {!Array<string>}
   * @private
   */
  this.titles_ = [];
};
goog.addSingletonGetter(os.proj.switch.ReprojectionWarning);


/**
 * @param {string} title
 */
os.proj.switch.ReprojectionWarning.prototype.addTitle = function(title) {
  this.titles_.push(title);
  this.delay_.start();
};


/**
 * Handles warning
 * @private
 */
os.proj.switch.ReprojectionWarning.prototype.onWarn_ = function() {
  var plural = this.titles_.length > 1;
  var msg = 'The tile layer' + (plural ? 's ' : ' ') + this.titles_.join(', ') +
      (plural ? ' are' : ' is') + ' being locally re-projected because the remote services do not support ' +
      'the current projection.';
  os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
  this.titles_.length = 0;
};



/**
 * @constructor
 * @extends {goog.events.EventTarget}
 */
os.proj.switch.SwitchProjection = function() {
  os.proj.switch.SwitchProjection.base(this, 'constructor');

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.delay_ = new goog.async.Delay(this.prompt_, 200, this);

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
};
goog.inherits(os.proj.switch.SwitchProjection, goog.events.EventTarget);
goog.addSingletonGetter(os.proj.switch.SwitchProjection);


/**
 * @return {?ol.proj.Projection}
 */
os.proj.switch.SwitchProjection.prototype.getOldProjection = function() {
  return this.oldProjection_;
};


/**
 * @return {?ol.proj.Projection}
 */
os.proj.switch.SwitchProjection.prototype.getNewProjection = function() {
  return this.newProjection_;
};


/**
 * @param {ol.layer.Layer} layer
 */
os.proj.switch.SwitchProjection.prototype.addLayer = function(layer) {
  if (!this.oldProjection_) {
    this.oldProjection_ = os.map.PROJECTION;
  }

  if (!this.newProjection_) {
    this.newProjection_ = layer.getSource().getProjection();
  }

  if (this.layers_.indexOf(layer) === -1) {
    this.layers_.push(layer);
  }

  this.delay_.start();
};


/**
 * @param {Object<string, *>} config The config
 */
os.proj.switch.SwitchProjection.prototype.addConfig = function(config) {
  this.configs_.push(config);
};


/**
 * Starts a projection change
 * @param {ol.ProjectionLike} projection
 */
os.proj.switch.SwitchProjection.prototype.start = function(projection) {
  if (!this.oldProjection_) {
    this.oldProjection_ = os.map.PROJECTION;
  }

  if (!this.newProjection_) {
    var p = ol.proj.get(projection);

    if (p) {
      this.newProjection_ = p;
    }
  }

  if (this.oldProjection_ && this.newProjection_) {
    this.delay_.start();
  }
};


/**
 * Prompt the user with the items that will change
 * @private
 */
os.proj.switch.SwitchProjection.prototype.prompt_ = function() {
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
      var titles = layerList.map(os.proj.mapTitle_);
      text += '<p>These layers will be <strong>' + title + '</strong></p>' + '<ul><li>' +
          titles.join('</li><li>') + '</li></ul>';
    }
  }

  if (newCode != os.proj.EPSG4326 && newCode != os.proj.EPSG3857 && os.MapContainer.getInstance().is3DEnabled()) {
    text += '<p>The 3D view does not support the new projection. The view will be switched to 2D.</p>';
  }

  var scopeOptions = {
    'confirmCallback': this.performSwitch.bind(this, layers),
    'cancelCallback': this.cancelSwitch.bind(this),
    'yesText': 'Switch',
    'yesIcon': 'fa fa-exchange green-icon',
    'noText': 'Cancel',
    'noIcon': 'fa fa-ban red-icon'
  };

  var windowOptions = {
    'label': this.layers_.length ? 'Differing Projections' : 'Projection Change',
    'icon': 'fa fa-warning orange-icon',
    'x': 'center',
    'y': 'center',
    'width': '500',
    'min-width': '300',
    'max-width': '600',
    'height': '400',
    'min-height': '215',
    'max-height': '500',
    'modal': 'true'
  };

  var template = '<confirm>' + text + '</confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * Cancels the projection switch
 * @protected
 */
os.proj.switch.SwitchProjection.prototype.cancelSwitch = function() {
  var dm = os.dataManager;

  for (var i = 0, n = this.layers_.length; i < n; i++) {
    var layer = /** @type {os.layer.ILayer} */ (this.layers_[i]);
    var d = dm.getDescriptor(layer.getId());

    if (d) {
      d.setActive(false);
    }

    this.layers_[i].dispose();
  }

  this.clear();
};


/**
 * Performs the projection switch
 * @param {os.proj.switch.BinnedLayersType} layers
 * @protected
 */
os.proj.switch.SwitchProjection.prototype.performSwitch = function(layers) {
  var cmds = [];

  if (this.oldProjection_ && this.newProjection_) {
    var useCesium = os.MapContainer.getInstance().is3DEnabled();

    // Step 1: stop updates to OL3 and Cesium
    if (useCesium) {
      cmds.push(new os.command.ToggleCesium(false, true));
    }

    // Step 2: remove layers to be removed in the proper order
    this.addLayerSequence(layers.remove, true, cmds);

    // Step 3: remove layers to be configured in the proper order
    this.addLayerSequence(layers.reconfig, true, cmds);

    // Step 4: switch main OL3 view (update os.map.PROJECTION)
    cmds.push(new os.command.SwitchView(this.newProjection_));

    // Step 5: Transform all vectors
    cmds.push(new os.command.TransformVectors(this.oldProjection_, this.newProjection_));

    // Step 6: Add layers to be configured in the correct order
    this.addLayerSequence(layers.reconfig, false, cmds);

    // Step 7: Add new layers
    this.addLayerSequence(layers.add, false, cmds);

    // Step 8: enable updates to OL3 and Cesium
    if (useCesium) {
      cmds.push(new os.command.ToggleCesium(useCesium, true));
    }

    // Step 9: Let plugins do stuff
    this.dispatchEvent(new os.proj.switch.CommandListEvent(cmds));

    // add and execute the overall command
    var cp = os.command.CommandProcessor.getInstance();
    var cmd = new os.command.SequenceCommand();
    cmd.title = 'Switch projection from ' + this.oldProjection_.getCode() + ' to ' + this.newProjection_.getCode();
    cmd.setCommands(cmds);
    cp.addCommand(cmd);
  }

  // clean up
  this.clear();
};


/**
 * @param {Array<Object<string, *>>} layers
 * @param {boolean} remove
 * @param {Array<os.command.ICommand>} cmdList
 * @protected
 */
os.proj.switch.SwitchProjection.prototype.addLayerSequence = function(layers, remove, cmdList) {
  var cmds = [];

  if (!remove) {
    layers.reverse();
  }

  for (var i = 0, n = layers.length; i < n; i++) {
    var cmd = remove ? new os.command.LayerRemove(layers[i]) : new os.command.LayerAdd(layers[i]);
    cmds.push(cmd);
  }

  if (cmds.length) {
    cmd = new os.command.SequenceCommand();
    cmd.setCommands(cmds);
    cmdList.push(cmd);
  }
};


/**
 * Clears the cache of stuff
 * @protected
 */
os.proj.switch.SwitchProjection.prototype.clear = function() {
  this.layers_.length = 0;
  this.configs_.length = 0;
  this.oldProjection_ = null;
  this.newProjection_ = null;
};


/**
 * @param {Object<string, *>} item
 * @param {number} i
 * @param {Array<Object<string, *>>} arr
 * @return {string}
 * @private
 */
os.proj.mapTitle_ = function(item, i, arr) {
  return /** @type {string} */ (item['title']);
};


/**
 * @typedef {{
 *  remove: Array<Object<string, *>>,
 *  unknown: Array<Object<string, *>>,
 *  add: Array<Object<string, *>>,
 *  reconfig: Array<Object<string, *>>
 * }}
 */
os.proj.switch.BinnedLayersType;


/**
 * @return {os.proj.switch.BinnedLayersType}
 * @protected
 */
os.proj.switch.SwitchProjection.prototype.binLayers = function() {
  // loop over all the layers in the application and determine which ones are
  //    supported: layers which can be locally re-projected with 100% accuracy (vector layers)
  //    unsupported: tile layers that do not support the new projection and will be removed
  //    unknown: layers which might support the new projection, but we don't know for sure
  //    refresh: layers which support the new projection but will have to be refreshed
  //    reconfig: layers which support the new projection but need to be removed, reconfigured, and re-added
  var layers = os.MapContainer.getInstance().getLayers();

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
          return /** @type {os.layer.ILayer} */ (layer).getLayerOptions();
        }).concat(this.configs_)
  };

  var i = layers.length;
  while (i--) {
    var layer = /** @type {os.layer.ILayer} */ (layers[i]);
    var options = layer.getLayerOptions();

    if (layer instanceof ol.layer.Tile) {
      if (os.implements(layer, os.layer.ILayer.ID)) {
        var projections = /** @type {!Array<!string>} */ (options['projections'] || []);

        if (!projections.length && options['projection']) {
          projections.push(/** @type {!string} */ (options['projection']));
        }

        if (projections.length) {
          var found = false;
          for (var j = 0, m = projections.length; j < m; j++) {
            var p = ol.proj.get(projections[j]);

            if (p && (os.proj.switch.ENABLE_RASTER_REPROJECTION || ol.proj.equivalent(p, this.newProjection_))) {
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

  this.dispatchEvent(new os.proj.switch.BinnedLayersEvent(bins));
  return bins;
};



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {os.proj.switch.BinnedLayersType} layers
 */
os.proj.switch.BinnedLayersEvent = function(layers) {
  os.proj.switch.BinnedLayersEvent.base(this, 'constructor', os.proj.switch.BinnedLayersEvent.TYPE);

  /**
   * @type {os.proj.switch.BinnedLayersType}
   */
  this.layers = layers;
};
goog.inherits(os.proj.switch.BinnedLayersEvent, goog.events.Event);


/**
 * @type {string}
 * @const
 */
os.proj.switch.BinnedLayersEvent.TYPE = goog.events.EventType.LOAD;



/**
 * @constructor
 * @extends {goog.events.Event}
 * @param {Array<os.command.ICommand>} commands
 */
os.proj.switch.CommandListEvent = function(commands) {
  os.proj.switch.CommandListEvent.base(this, 'constructor', os.proj.switch.CommandListEvent.TYPE);

  /**
   * @type {Array<os.command.ICommand>} commands
   */
  this.commands = commands;
};
goog.inherits(os.proj.switch.CommandListEvent, goog.events.Event);


/**
 * @type {string}
 * @const
 */
os.proj.switch.CommandListEvent.TYPE = goog.events.EventType.SUBMIT;

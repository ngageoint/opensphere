goog.provide('os.ui.layer.DefaultLayerUICtrl');
goog.provide('os.ui.layer.defaultLayerUIDirective');

goog.require('goog.array');
goog.require('ol.array');
goog.require('os.command.LayerAutoRefresh');
goog.require('os.command.LayerStyle');
goog.require('os.command.ParallelCommand');
goog.require('os.config.Settings');
goog.require('os.defines');
goog.require('os.layer');
goog.require('os.ui.ControlType');
goog.require('os.ui.Module');
goog.require('os.ui.layer.AbstractLayerUICtrl');


/**
 * Default layer controls.
 *
 * @return {angular.Directive}
 */
os.ui.layer.defaultLayerUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/layer/default.html',
    controller: os.ui.layer.DefaultLayerUICtrl,
    controllerAs: 'defaultCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('defaultlayerui', [os.ui.layer.defaultLayerUIDirective]);



/**
 * Controller for the default layer UI.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @extends {os.ui.layer.AbstractLayerUICtrl}
 * @constructor
 * @ngInject
 */
os.ui.layer.DefaultLayerUICtrl = function($scope, $element, $timeout) {
  os.ui.layer.DefaultLayerUICtrl.base(this, 'constructor', $scope, $element);
  this.initEvents.push(os.layer.PropertyChange.REFRESH_INTERVAL);

  /**
   * The selected Auto Refresh option.
   * @type {?osx.layer.RefreshOption}
   */
  this['refresh'] = null;

  /**
   * The available Auto Refresh options.
   * @type {!Array<!osx.layer.RefreshOption>}
   */
  this['refreshOptions'] = os.ui.layer.REFRESH_DURATIONS;

  /**
   * If the Auto Refresh option should be displayed.
   * @type {boolean}
   */
  this['showRefresh'] = false;

  /**
   * If the color picker should be included in the UI.
   * @type {boolean}
   */
  this['showColorPicker'] = false;

  /**
   * If the reset button should be displayed in the color picker.
   * @type {boolean}
   */
  this['showColorReset'] = false;

  /**
   * If the hue slider should be displayed.
   * @type {boolean}
   */
  this['showHue'] = false;

  /**
   * If brightness/saturation should be displayed.
   * @type {boolean}
   */
  this['showBasicColor'] = false;

  /**
   * @type {Object<string, number>}
   * @protected
   */
  this.defaults = {
    'brightness': 0,
    'contrast': 1,
    'hue': 0,
    'opacity': 1,
    'saturation': 1
  };

  /**
   * The default color control to display when undefined or varied between layers.
   * @type {!os.ui.ColorControlType}
   * @protected
   */
  this.defaultColorControl = os.ui.ColorControlType.NONE;

  /**
   * @type {Object}
   * @protected
   */
  this.initialValues = {};

  var properties = this.getProperties();

  // Listen for slider start, change and stop events for each of the slider properties. These will handle live updates
  // of the layer in the view as well as placing commands on the stack on stop for each change.
  for (var key in properties) {
    var fn = properties[key];
    $scope.$on(key + '.slide', this.onValueChange.bind(this, fn));
    $scope.$on(key + '.slidestart', this.onSliderStart.bind(this));
    $scope.$on(key + '.slidestop', this.onSliderStop.bind(this, fn, key));
  }

  this.initUI();
  this.setInitialValues_();

  $timeout(goog.bind(function() {
    if (this.element) {
      var selector = /** @type {string} */ (os.settings.get('layercontrols', ''));
      if (selector) {
        var section = this.element.find(selector);
        if (section) {
          $(section).collapse('show');
        }
      }
    }
  }, this));
};
goog.inherits(os.ui.layer.DefaultLayerUICtrl, os.ui.layer.AbstractLayerUICtrl);


/**
 * The basic layer properties controlled by this UI.
 *
 * @return {Object}
 */
os.ui.layer.DefaultLayerUICtrl.prototype.getProperties = function() {
  return {
    'opacity': os.layer.setOpacity,
    'brightness': os.layer.setBrightness,
    'contrast': os.layer.setContrast,
    'hue': os.layer.setHue,
    'saturation': os.layer.setSaturation
  };
};


/**
 * @inheritDoc
 */
os.ui.layer.DefaultLayerUICtrl.prototype.initUI = function() {
  os.ui.layer.DefaultLayerUICtrl.base(this, 'initUI');

  if (!this.isDisposed()) {
    this.scope['brightness'] = this.getValue(os.layer.getBrightness, 0);
    this.scope['contrast'] = this.getValue(os.layer.getContrast);
    this.scope['hue'] = this.getValue(os.layer.getHue, 0);
    this.scope['opacity'] = this.getOpacity();
    this.scope['saturation'] = this.getValue(os.layer.getSaturation);

    this.updateRefresh();
    this.initColorControls_();
  }
};


/**
 * Updates the auto refresh state on the UI.
 */
os.ui.layer.DefaultLayerUICtrl.prototype.updateRefresh = function() {
  this['showRefresh'] = false;
  this['refresh'] = null;

  var nodes = this.getLayerNodes();
  if (nodes && nodes.length > 0) {
    var refreshInterval;

    // only show refresh options if all sources support it
    this['showRefresh'] = goog.array.every(nodes, function(node) {
      var layer = node.getLayer();
      if (layer instanceof ol.layer.Layer) {
        var source = layer.getSource();
        if (source instanceof os.source.Vector || source instanceof ol.source.UrlTile &&
            source.isRefreshEnabled()) {
          if (refreshInterval == null) {
            // init the control to the refresh interval of the first item
            refreshInterval = source.getRefreshInterval();
          }

          return true;
        }
      }

      return false;
    });

    if (refreshInterval != null) {
      // find the refresh interval by interval
      this['refresh'] = ol.array.find(this['refreshOptions'], function(option) {
        return option.interval == refreshInterval;
      });
    }
  }
};


/**
 * Initialize which color controls should be displayed.
 *
 * @private
 */
os.ui.layer.DefaultLayerUICtrl.prototype.initColorControls_ = function() {
  // default to showing nothing
  this['showColorPicker'] = false;
  this['showColorReset'] = false;
  this['showBasicColor'] = false;
  this['showHue'] = false;

  var nodes = this.getLayerNodes();
  if (nodes && nodes.length > 0) {
    // make sure all selected layers have the same color control type
    var baseType;
    for (var i = 0, n = nodes.length; i < n; i++) {
      var layer = nodes[i].getLayer();
      if (baseType == null) {
        baseType = this.getColorControlType(layer);

        // first one doesn't have a color control, so don't show one
        if (baseType == os.ui.ColorControlType.NONE) {
          break;
        }
      } else if (this.getColorControlType(layer) !== baseType) {
        // at least one layer has a different type, so don't show the control
        baseType = os.ui.ColorControlType.NONE;
        break;
      }
    }

    switch (baseType) {
      case os.ui.ColorControlType.PICKER_RESET:
        // show the color picker with a reset button
        this['showColorPicker'] = true;
        this['showColorReset'] = true;
        this['showBasicColor'] = true;

        break;
      case os.ui.ColorControlType.PICKER:
        // show the color picker without a reset button
        this['showColorPicker'] = true;

        this['showBasicColor'] = false;
        this['showColorReset'] = false;
        break;
      case os.ui.ColorControlType.BASIC:
        // show brightness, saturation
        this['showBasicColor'] = true;

        this['showColorPicker'] = false;
        this['showColorReset'] = false;

        break;
      case os.ui.ColorControlType.NONE:
      default:
        // don't show any color controls
        this['showBasicColor'] = false;
        this['showColorPicker'] = false;
        this['showColorReset'] = false;
        break;
    }
  }
};


/**
 * Get the color control type for the provided layer.
 *
 * @param {os.layer.ILayer} layer
 * @return {!os.ui.ColorControlType}
 * @protected
 */
os.ui.layer.DefaultLayerUICtrl.prototype.getColorControlType = function(layer) {
  if (layer) {
    var options = layer.getLayerOptions();
    if (options && options[os.ui.ControlType.COLOR]) {
      return /** @type {!os.ui.ColorControlType} */ (options[os.ui.ControlType.COLOR]);
    }
  }

  return this.defaultColorControl;
};


/**
 * Gets the opacity from the item(s)
 *
 * @return {number} The opacity
 */
os.ui.layer.DefaultLayerUICtrl.prototype.getOpacity = function() {
  return this.getValue(os.layer.getOpacity);
};


/**
 * Builds the current set of initial values and places them in the map.
 *
 * @private
 */
os.ui.layer.DefaultLayerUICtrl.prototype.setInitialValues_ = function() {
  var nodes = this.getLayerNodes();
  for (var i = 0, n = nodes.length; i < n; i++) {
    var layer = nodes[i].getLayer();
    if (layer) {
      var layerId = layer.getId();
      var values = {};

      var opacity = this.getOpacity();
      values['opacity'] = opacity != null ? opacity : 0;

      var brightness = os.layer.getBrightness(layer);
      values['brightness'] = brightness != null ? brightness : 0;

      var contrast = os.layer.getContrast(layer);
      values['contrast'] = contrast != null ? contrast : 0;

      var saturation = os.layer.getSaturation(layer);
      values['saturation'] = saturation != null ? saturation : 0;

      this.initialValues[layerId] = values;
    }
  }
};


/**
 * Handle changes to form controls
 *
 * @param {function(os.layer.ILayer, ?)} callback
 * @param {?angular.Scope.Event} event
 * @param {?} value
 * @protected
 */
os.ui.layer.DefaultLayerUICtrl.prototype.onValueChange = function(callback, event, value) {
  var nodes = this.getLayerNodes();
  for (var i = 0, n = nodes.length; i < n; i++) {
    callback(nodes[i].getLayer(), value);
  }
};


/**
 * Handles color change slides.
 *
 * @param {angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.DefaultLayerUICtrl.prototype.onSliderStart = function(event, value) {
  this.setInitialValues_();
};


/**
 * Handles color change slides.
 *
 * @param {function(os.layer.ILayer, ?)} callback The callback for setting the value
 * @param {string} key The key representing the value
 * @param {?angular.Scope.Event} event
 * @param {number} value
 * @protected
 */
os.ui.layer.DefaultLayerUICtrl.prototype.onSliderStop = function(callback, key, event, value) {
  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @this os.ui.layer.DefaultLayerUICtrl
       * @return {?os.command.ICommand}
       */
      function(layer) {
        var initialValues = this.initialValues[layer.getId()];
        var old = 1;
        if (initialValues && initialValues[key] !== undefined) {
          old = initialValues[key];
        }

        var cmd = old !== value ? new os.command.LayerStyle(layer.getId(), callback, value, old) : null;
        if (cmd) {
          cmd.title = 'Change ' + key;
        }

        return cmd;
      };

  this.createCommand(fn.bind(this));
  this.setInitialValues_();
};


/**
 * Set the refresh state of the source.
 *
 * @export
 */
os.ui.layer.DefaultLayerUICtrl.prototype.onRefreshChange = function() {
  var nodes = this.getLayerNodes();
  if (nodes && nodes.length > 0) {
    var refresh = /** @type {osx.layer.RefreshOption|undefined} */ (this['refresh']);
    var interval = refresh ? refresh.interval : 0;
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new os.command.LayerAutoRefresh(layer.getId(), interval);
        };

    this.createCommand(fn);
  }
};


/**
 * Resets the value of the chosen key to the default.
 *
 * @param {string} key
 * @export
 */
os.ui.layer.DefaultLayerUICtrl.prototype.reset = function(key) {
  var defaultValue = this.defaults[key];
  var nodes = this.getLayerNodes();
  if (nodes && nodes[0].getLayer() != null && nodes[0].getLayer().getLayerOptions() &&
    nodes[0].getLayer().getLayerOptions()['defaults']) {
    var value = nodes[0].getLayer().getLayerOptions()['defaults'][key];
    if (value != null) {
      defaultValue = /** @type {number} */ (value);
    }
  }

  if (defaultValue != null) {
    var callback = this.getProperties()[key];
    this.onSliderStop(callback, key, null, defaultValue);
  }
};


/**
 * Handle accordion toggle.
 *
 * @param {string} selector The toggled selector.
 * @export
 */
os.ui.layer.DefaultLayerUICtrl.prototype.setOpenSection = function(selector) {
  // save the open section to settings
  var current = os.settings.get('layercontrols');
  os.settings.set('layercontrols', current != selector ? selector : '');
};

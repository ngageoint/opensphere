goog.provide('os.ui.draw.BaseDrawControlsCtrl');
goog.provide('os.ui.draw.baseDrawControlsDirective');

goog.require('goog.Disposable');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.Feature');
goog.require('os.config.Settings');
goog.require('os.data.RecordField');
goog.require('os.interaction.DragZoom');
goog.require('os.metrics.Metrics');
goog.require('os.ogc.registry');
goog.require('os.ui.GlobalMenuEventType');
goog.require('os.ui.Module');
goog.require('os.ui.draw.DrawEventType');
goog.require('os.ui.menu.draw');
goog.require('os.ui.ol.interaction.AbstractDraw');
goog.require('os.ui.ol.interaction.DragBox');


/**
 * The draw-controls directive
 *
 * @return {angular.Directive}
 */
os.ui.draw.baseDrawControlsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'menu': '=',
      'olMap': '=',
      'embeddedControls': '=?'
    },
    templateUrl: os.ROOT + 'views/draw/basedrawcontrols.html',
    controller: os.ui.draw.BaseDrawControlsCtrl,
    controllerAs: 'drawControls'
  };
};


/**
 * Add the directive to the os.ui module.
 */
os.ui.Module.directive('drawControls', [os.ui.draw.baseDrawControlsDirective]);



/**
 * Controller for the draw-controls directive. This version of the draw controls is designed to work with
 * the os.ui version of the OL map.
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.draw.BaseDrawControlsCtrl = function($scope, $element) {
  os.ui.draw.BaseDrawControlsCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;

  /**
   * @type {os.ui.ol.interaction.AbstractDraw}
   * @protected
   */
  this.interaction = null;

  /**
   * The active drawing feature.
   * @type {ol.Feature|undefined}
   * @protected
   */
  this.feature = undefined;

  /**
   * @type {os.ui.menu.Menu|undefined}
   * @protected
   */
  this.menu = $scope['menu'];

  /**
   * The logger
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.draw.BaseDrawControlsCtrl.LOGGER_;

  /**
   * @type {?os.ui.ol.OLMap}
   * @private
   */
  this.olMap_ = $scope['olMap'];

  /**
   * @type {string}
   */
  this['selectedType'] = '';

  /**
   * If the line control is supported.
   * @type {boolean}
   */
  this['supportsLines'] = this['supportsLines'] || false;

  /**
   * @type {os.ui.menu.Menu|undefined}
   */
  this['controlMenu'] = os.ui.menu.draw.MENU;
  this.initControlMenu();

  os.dispatcher.listen(os.ui.draw.DrawEventType.DRAWSTART, this.apply, false, this);
  os.dispatcher.listen(os.ui.draw.DrawEventType.DRAWEND, this.onDrawEnd, false, this);
  os.dispatcher.listen(os.ui.draw.DrawEventType.DRAWCANCEL, this.apply, false, this);

  os.dispatcher.listen(os.ui.draw.DrawEventType.DRAWBOX, this.onDrawType, false, this);
  os.dispatcher.listen(os.ui.draw.DrawEventType.DRAWCIRCLE, this.onDrawType, false, this);
  os.dispatcher.listen(os.ui.draw.DrawEventType.DRAWPOLYGON, this.onDrawType, false, this);
  os.dispatcher.listen(os.ui.draw.DrawEventType.DRAWLINE, this.onDrawType, false, this);

  var selected = /** @type {string} */ (os.settings.get('drawType', os.ui.ol.interaction.DragBox.TYPE));
  this.setSelectedControl(selected);

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.draw.BaseDrawControlsCtrl, goog.Disposable);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
os.ui.draw.BaseDrawControlsCtrl.LOGGER_ = goog.log.getLogger('os.ui.draw.BaseDrawControlsCtrl');


/**
 * @inheritDoc
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.disposeInternal = function() {
  os.ui.draw.BaseDrawControlsCtrl.base(this, 'disposeInternal');

  os.dispatcher.unlisten(os.ui.draw.DrawEventType.DRAWSTART, this.apply, false, this);
  os.dispatcher.unlisten(os.ui.draw.DrawEventType.DRAWEND, this.onDrawEnd, false, this);
  os.dispatcher.unlisten(os.ui.draw.DrawEventType.DRAWCANCEL, this.apply, false, this);

  os.dispatcher.unlisten(os.ui.draw.DrawEventType.DRAWBOX, this.onDrawType, false, this);
  os.dispatcher.unlisten(os.ui.draw.DrawEventType.DRAWCIRCLE, this.onDrawType, false, this);
  os.dispatcher.unlisten(os.ui.draw.DrawEventType.DRAWPOLYGON, this.onDrawType, false, this);
  os.dispatcher.unlisten(os.ui.draw.DrawEventType.DRAWLINE, this.onDrawType, false, this);

  this.scope_ = null;
  this.element_ = null;
};


/**
 * @return {ol.PluggableMap}
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.getMap = function() {
  return this.olMap_ ? this.olMap_.getMap() : null;
};


/**
 * Get the menu to display when drawing completes.
 *
 * @return {os.ui.menu.Menu|undefined}
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.getMenu = function() {
  return this.menu;
};


/**
 * Set the active drawing feature.
 *
 * @param {ol.Feature|undefined} f The feature.
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.setFeature = function(f) {
  if (this.feature && this.olMap_) {
    this.olMap_.removeFeature(this.feature, true);
  }

  this.feature = f;

  if (this.feature && this.olMap_) {
    this.olMap_.addFeature(this.feature);
  }
};


/**
 * @param {string} type
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.setSelectedControl = function(type) {
  if (this.interaction) {
    this.interaction.setActive(false);
    this.interaction = null;
  }

  var map = this.getMap();
  if (map) {
    var interactions = map.getInteractions().getArray();
    for (var i = 0, n = interactions.length; i < n; i++) {
      var interaction = /** @type {os.ui.ol.interaction.AbstractDraw} */ (interactions[i]);
      if (interaction instanceof os.ui.ol.interaction.AbstractDraw &&
         !(interaction instanceof os.interaction.DragZoom)) {
        var active = interaction.isType(type);
        interaction.setActive(active);

        if (active) {
          this.interaction = interaction;
          break;
        }
      }
    }
  } else {
    this.listenForMapReady();
  }

  os.settings.set('drawType', type);
  this['selectedType'] = type;
};


/**
 * Register a listener that will be called when the map is ready.
 *
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.listenForMapReady = function() {
  // implement in extending classes
};


/**
 * Handle map ready event.
 *
 * @param {goog.events.Event} event The ready event.
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.onMapReady = function(event) {
  this.setSelectedControl(this['selectedType']);
};


/**
 * @param {*=} opt_event
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.apply = function(opt_event) {
  os.ui.apply(this.scope_);
};


/**
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.initControlMenu = function() {
  var mi = this['controlMenu'].getRoot();
  if (this['supportsLines']) {
    mi.addChild({
      label: 'Line',
      eventType: os.ui.menu.draw.EventType.LINE,
      tooltip: 'Draw a line on the map',
      icons: ['<i class="fa fa-fw fa-long-arrow-right"></i> '],
      handler: os.ui.menu.draw.handleDrawEvent,
      sort: 40
    });
  }

  if (this['hideExtraControls']) {
    mi.removeChild('Choose Area');
    mi.removeChild('Enter Coordinates');
    mi.removeChild('Whole World');
    mi.removeChild('drawMenuSeparator');
  } else {
    os.ogc.registry.addOGCMenuItems(this['controlMenu'], 130);
  }
};


/**
 * @param {os.ui.draw.DrawEvent} event
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.onDrawEnd = function(event) {
  if (event.target === this.interaction) {
    var style = this.interaction.getStyle();
    var menu = this.getMenu();
    var map = this.getMap();
    if (menu && map) {
      // stop doing stuff while the menu is up
      $(map.getViewport()).addClass('u-pointer-events-none');

      var f = new ol.Feature(event.properties);
      f.setGeometry(event.geometry.clone());
      f.setId(goog.string.getRandomString());
      f.setStyle(style);
      f.set(os.data.RecordField.DRAWING_LAYER_NODE, false);

      this.setFeature(f);

      var context = {
        feature: f,
        geometry: event.geometry,
        style: style
      };

      menu.open(context, {
        my: 'left top',
        at: 'left+' + event.pixel[0] + ' top+' + event.pixel[1],
        of: '#map-container'
      });

      os.dispatcher.listenOnce(os.ui.GlobalMenuEventType.MENU_CLOSE, this.onMenuEnd, false, this);
      this.apply();
    }
  }
};


/**
 * Handles menu finish
 *
 * @param {goog.events.Event=} opt_e
 * @protected
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.onMenuEnd = function(opt_e) {
  $(this.getMap().getViewport()).removeClass('u-pointer-events-none');
  this.setFeature(undefined);
  if (this.interaction) {
    this.interaction.setEnabled(false);
  }
  this.apply();
};


/**
 * @param {goog.events.Event} e
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.onDrawType = function(e) {
  if (e && e.type) {
    this.activateControl(e.type);
  }
};


/**
 * @param {string} type
 * @export
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.activateControl = function(type) {
  goog.log.fine(this.log, 'Activating ' + type + ' control.');
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.DRAW, 1);
  os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Map.DRAW + '_' + type, 1);

  if (this.interaction && this.interaction.getType() != type) {
    // disable the old control so that it isn't secretly enabled the next time it comes on
    this.interaction.setEnabled(false);
    this.setSelectedControl(type);
  }

  if (this.interaction) {
    this.interaction.setEnabled(!this.interaction.getEnabled());
  }
};


/**
 * @param {boolean=} opt_value
 * @export
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.toggleMenu = function(opt_value) {
  var menu = this['controlMenu'];

  var target = this.element_.find('.draw-controls-group');
  menu.open(undefined, {
    my: 'left top+4',
    at: 'left bottom',
    of: target
  });
};


/**
 * @return {boolean} whether the current interaction is enabled/active
 * @export
 */
os.ui.draw.BaseDrawControlsCtrl.prototype.isActive = function() {
  return this.interaction ? this.interaction.getEnabled() : false;
};

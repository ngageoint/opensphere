goog.provide('plugin.places.ui.QuickAddPlacesCtrl');
goog.provide('plugin.places.ui.quickAddPlacesDirective');

goog.require('goog.Disposable');
goog.require('goog.events.KeyHandler');
goog.require('ol.geom.Point');
goog.require('os.command.CommandProcessor');
goog.require('os.command.ParallelCommand');
goog.require('os.defines');
goog.require('os.interaction.DragBox');
goog.require('os.interaction.DragCircle');
goog.require('os.interaction.DrawLine');
goog.require('os.interaction.DrawPolygon');
goog.require('os.ui.Module');
goog.require('os.ui.menu.layer');
goog.require('plugin.file.kml.cmd.KMLNodeRemove');


/**
 * The quickaddplaces directive
 *
 * @return {angular.Directive}
 */
plugin.places.ui.quickAddPlacesDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'root': '=?', // optional root node to add places to
      'initial': '=?' // optional initial geometry to add
    },
    templateUrl: os.ROOT + 'views/plugin/places/quickaddplaces.html',
    controller: plugin.places.ui.QuickAddPlacesCtrl,
    controllerAs: 'quickAdd'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('quickaddplaces', [plugin.places.ui.quickAddPlacesDirective]);



/**
 * Controller function for the quickaddplaces directive
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
plugin.places.ui.QuickAddPlacesCtrl = function($scope, $element) {
  plugin.places.ui.QuickAddPlacesCtrl.base(this, 'constructor');

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
   * The root node to add places to.
   * @type {plugin.file.kml.ui.KMLNode}
   */
  this.root = $scope['root'];

  /**
   * The number of points added.
   * @type {number}
   * @protected
   */
  this.numAdded = 0;

  /**
   * The array of added nodes. This reference is kept around for the cancel case.
   * @type {Array<!plugin.file.kml.ui.KMLNode>}
   * @protected
   */
  this.added = [];

  /**
   * The map.
   * @type {os.Map}
   * @protected
   */
  this.map = /** @type {os.Map} */ (os.map.mapContainer.getMap());

  /**
   * Listener key for clicks on the map.
   * @type {?ol.EventsKey}
   * @protected
   */
  this.mapListenKey = null;

  /**
   * DragBox interaction
   * @type {os.interaction.DragBox}
   * @private
   */
  this.dragBox_ = new os.interaction.DragBox();
  ol.events.listen(this.dragBox_, os.ui.ol.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.dragBox_, os.ui.ol.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * DragCircle interaction
   * @type {os.interaction.DragCircle}
   * @private
   */
  this.dragCircle_ = new os.interaction.DragCircle();
  ol.events.listen(this.dragCircle_, os.ui.ol.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.dragCircle_, os.ui.ol.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * DragBox interaction
   * @type {os.interaction.DrawPolygon}
   * @private
   */
  this.drawPolygon_ = new os.interaction.DrawPolygon();
  ol.events.listen(this.drawPolygon_, os.ui.ol.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.drawPolygon_, os.ui.ol.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * DragBox interaction
   * @type {os.interaction.DrawPolygon}
   * @private
   */
  this.drawLine_ = new os.interaction.DrawLine();
  ol.events.listen(this.drawLine_, os.ui.ol.draw.DrawEventType.DRAWEND, this.onDrawEnd_, this);
  ol.events.listen(this.drawLine_, os.ui.ol.draw.DrawEventType.DRAWCANCEL, this.onDrawCancel_, this);

  /**
   * Handler for escape key events.
   * @type {!goog.events.KeyHandler}
   * @protected
   */
  this.keyHandler = new goog.events.KeyHandler(goog.dom.getDocument());
  this.keyHandler.listen(goog.events.KeyHandler.EventType.KEY, this.onKey, false, this);

  /**
   * @type {?string}
   */
  this['selectedType'] = null;

  /**
   * @type {string}
   */
  this['name'] = this.root && this.root.getLabel() || 'New Place';

  this.map.addInteraction(this.dragBox_);
  this.map.addInteraction(this.dragCircle_);
  this.map.addInteraction(this.drawPolygon_);
  this.map.addInteraction(this.drawLine_);

  // initialize to drawing points
  this.draw('point');
  this.addGeometry($scope['initial']);

  $scope.$emit(os.ui.WindowEventType.READY);
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(plugin.places.ui.QuickAddPlacesCtrl, goog.Disposable);


/**
 * @type {string}
 * @const
 */
plugin.places.ui.QuickAddPlacesCtrl.WINDOW_ID = 'quickAddPlaces';


/**
 * @inheritDoc
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.disposeInternal = function() {
  plugin.places.ui.QuickAddPlacesCtrl.base(this, 'disposeInternal');
  this.disablePoint();

  // remove interactions
  this.map.removeInteraction(this.dragBox_);
  this.map.removeInteraction(this.dragCircle_);
  this.map.removeInteraction(this.drawPolygon_);
  this.map.removeInteraction(this.drawLine_);
  this.dragBox_.dispose();
  this.dragCircle_.dispose();
  this.drawPolygon_.dispose();
  this.drawLine_.dispose();
  this.dragBox_ = null;
  this.dragCircle_ = null;
  this.drawPolygon_ = null;
  this.drawLine_ = null;

  goog.dispose(this.keyHandler);

  this.scope = null;
  this.element = null;
  this.map = null;
};


/**
 * Initializes drawing places of a particular type.
 *
 * @param {string} type The drawing type to initialize.
 * @export
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.draw = function(type) {
  var lastType = this['selectedType'];
  this.onDrawCancel_();

  if (lastType && lastType === type) {
    // user clicked the currently active button, so treat it as toggling the controls off
    return;
  }

  this['selectedType'] = type;
  var interaction;

  if (type == 'point') {
    // don't need an interaction for handling points
    this.enablePoint();
    return;
  } else if (type == os.ui.ol.interaction.DragBox.TYPE) {
    interaction = this.dragBox_;
  } else if (type == os.ui.ol.interaction.DragCircle.TYPE) {
    interaction = this.dragCircle_;
  } else if (type == os.ui.ol.interaction.DrawPolygon.TYPE) {
    interaction = this.drawPolygon_;
  } else if (type == os.interaction.DrawLine.TYPE) {
    interaction = this.drawLine_;
  }

  if (interaction) {
    interaction.setActive(true);
    interaction.setEnabled(true);
  }
};


/**
 * Enables a listener for clicks on the map
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.enablePoint = function() {
  if (!this.mapListenKey) {
    this.mapListenKey = ol.events.listen(this.map, ol.MapBrowserEventType.SINGLECLICK, this.onMapClick, this);
  }
};


/**
 * Enables a listener for clicks on the map
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.disablePoint = function() {
  if (this.mapListenKey) {
    ol.events.unlistenByKey(this.mapListenKey);
    this.mapListenKey = null;
  }
};


/**
 * Handles draw end events.
 *
 * @param {os.ui.ol.draw.DrawEvent} event
 * @private
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.onDrawEnd_ = function(event) {
  if (event && event.geometry instanceof ol.geom.SimpleGeometry) {
    var geometry = /** @type {ol.geom.SimpleGeometry} */ (event.geometry);
    this.addGeometry(geometry);
  }
};


/**
 * Handles draw cancel events.
 *
 * @param {os.ui.ol.draw.DrawEvent=} opt_event
 * @private
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.onDrawCancel_ = function(opt_event) {
  if (opt_event) {
    opt_event.preventDefault();
    opt_event.stopPropagation();
  }

  // disable all interactions
  this.disablePoint();
  this.dragBox_.setActive(false);
  this.dragBox_.setEnabled(false);
  this.dragCircle_.setActive(false);
  this.dragCircle_.setEnabled(false);
  this.drawPolygon_.setActive(false);
  this.drawPolygon_.setEnabled(false);
  this.drawLine_.setActive(false);
  this.drawLine_.setEnabled(false);

  this['selectedType'] = null;

  os.ui.apply(this.scope);
};


/**
 * Handle map browser events.
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} 'false' to stop event propagation
 * @protected
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.onMapClick = function(mapBrowserEvent) {
  if (mapBrowserEvent.type == ol.MapBrowserEventType.SINGLECLICK &&
      mapBrowserEvent.coordinate && mapBrowserEvent.coordinate.length > 1) {
    // This UI will do everything in lon/lat
    var point = new ol.geom.Point(mapBrowserEvent.coordinate);
    this.addGeometry(point);
  }

  return false;
};


/**
 * Add a geometry as a place. Also handles creating a root if one doesn't exist yet.
 *
 * @param {ol.geom.SimpleGeometry} geometry The geometry to add.
 * @protected
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.addGeometry = function(geometry) {
  if (geometry) {
    if (!this.root || !this.root.getParent()) {
      this.root = plugin.places.addFolder(/** @type {!plugin.places.FolderOptions} */ ({
        name: this['name'] || 'New Place'
      }));

      if (this.root) {
        this.added.push(this.root);
      }
    }

    var place = plugin.places.addPlace(/** @type {plugin.places.PlaceOptions} */ ({
      geometry: geometry,
      name: this.getUniqueName(),
      parent: this.root,
      styleConfig: {
        'labelSize': 14,
        'labelColor': 'rgba(255,255,255,1)',
        'labels': [os.ui.FeatureEditCtrl.DEFAULT_LABEL]
      },
      startTime: goog.now()
    }));

    if (place) {
      this.added.push(place);
    }
  }
};


/**
 * Resets the added place counter when the name changes.
 *
 * @export
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.onNameChange = function() {
  this.numAdded = 0;
};


/**
 * Gets a unique name for the target folder.
 * @return {string} The unique name.
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.getUniqueName = function() {
  var children = this.root && this.root.getChildren() || [];
  var names = children.map(function(node) {
    return node.getLabel();
  });
  var base = this['name'] || 'New Place';
  var name = base + ' ' + ++this.numAdded;

  while (names.indexOf(name) > -1) {
    name = base + ' ' + ++this.numAdded;
  }

  return name;
};


/**
 * Handler for escape key presses.
 * @param {goog.events.KeyEvent} event
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.onKey = function(event) {
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.onDrawCancel_();
  }
};


/**
 * Confirm adding the places.
 *
 * @export
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.confirm = function() {
  os.ui.window.close(this.element);
};


/**
 * Clear all added places.
 *
 * @export
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.clearAll = function() {
  if (this.added.length > 0) {
    var cp = os.command.CommandProcessor.getInstance();
    if (this.added[0].isFolder()) {
      // remove the folder, the children will go with it
      var folderCmd = new plugin.file.kml.cmd.KMLNodeRemove(this.added[0]);
      folderCmd.title = 'Remove Quick Places';
      cp.addCommand(folderCmd);
    } else {
      var cmds = this.added.map(function(node) {
        return new plugin.file.kml.cmd.KMLNodeRemove(node);
      });

      var pCmd = new os.command.ParallelCommand();
      pCmd.setCommands(cmds);
      pCmd.title = 'Remove Quick Place' + (cmds.length > 1 ? 's' : '');
      cp.addCommand(pCmd);
    }
  }

  os.ui.window.close(this.element);
};


/**
 * Launches the quick add places dialog (or brings it to the front if it already exists).
 * @param {plugin.file.kml.ui.KMLNode=} opt_root Optional root KML node.
 * @param {ol.geom.SimpleGeometry=} opt_initial Optional initial geometry to add to the set of places.
 */
plugin.places.ui.QuickAddPlacesCtrl.launch = function(opt_root, opt_initial) {
  if (os.ui.window.exists(plugin.places.ui.QuickAddPlacesCtrl.WINDOW_ID)) {
    os.ui.window.bringToFront(plugin.places.ui.QuickAddPlacesCtrl.WINDOW_ID);
    return;
  }

  var scopeOptions = {
    'root': opt_root,
    'initial': opt_initial
  };

  var container = angular.element(os.ui.windowSelector.CONTAINER);
  var x = container.width() - 350;

  var windowOptions = {
    'label': 'Quick Add Places',
    'id': plugin.places.ui.QuickAddPlacesCtrl.WINDOW_ID,
    'key': plugin.places.ui.QuickAddPlacesCtrl.WINDOW_ID, // makes this a saved window, will remember position
    'icon': 'fa fa-fw ' + plugin.places.Icon.QUICK_ADD,
    'x': x,
    'y': 'center',
    'width': 300,
    'height': 'auto',
    'show-close': true,
    'no-scroll': true
  };

  var template = '<quickaddplaces root="root" initial="initial"></quickaddplaces>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

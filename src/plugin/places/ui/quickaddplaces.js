goog.provide('plugin.places.ui.QuickAddPlacesCtrl');
goog.provide('plugin.places.ui.quickAddPlacesDirective');

goog.require('goog.Disposable');
goog.require('goog.events.KeyHandler');
goog.require('ol.geom.Point');
goog.require('os.command.CommandProcessor');
goog.require('os.command.ParallelCommand');
goog.require('os.data.RecordField');
goog.require('os.defines');
goog.require('os.interaction.DragBox');
goog.require('os.interaction.DragCircle');
goog.require('os.interaction.DrawLine');
goog.require('os.interaction.DrawPolygon');
goog.require('os.ui.Module');
goog.require('os.ui.draw.drawPickerDirective');
goog.require('os.ui.menu.layer');
goog.require('os.webgl.AltitudeMode');
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
   * @type {string}
   */
  this['name'] = this.root && this.root.getLabel() || 'New Place';

  /**
   * Bound callback function for draw controls.
   * @type {function(ol.geom.SimpleGeometry)}
   */
  this['drawCallback'] = this.addGeometry.bind(this);

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

  this.scope = null;
  this.element = null;
};


/**
 * Add a geometry as a place. Also handles creating a root if one doesn't exist yet.
 *
 * @param {ol.geom.SimpleGeometry} geometry The geometry to add.
 * @export
 */
plugin.places.ui.QuickAddPlacesCtrl.prototype.addGeometry = function(geometry) {
  if (geometry) {
    geometry.set(os.data.RecordField.ALTITUDE_MODE, os.webgl.AltitudeMode.CLAMP_TO_GROUND);

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

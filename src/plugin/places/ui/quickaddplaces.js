goog.declareModuleId('plugin.places.ui.QuickAddPlacesUI');

import '../../../os/ui/draw/drawpicker.js';
import CommandProcessor from '../../../os/command/commandprocessor.js';
import ParallelCommand from '../../../os/command/parallelcommand.js';
import RecordField from '../../../os/data/recordfield.js';
import * as interpolate from '../../../os/interpolate.js';
import {ROOT} from '../../../os/os.js';
import {Controller as FeatureEditCtrl} from '../../../os/ui/featureedit.js';
import Module from '../../../os/ui/module.js';
import * as osWindow from '../../../os/ui/window.js';
import WindowEventType from '../../../os/ui/windoweventtype.js';
import windowSelector from '../../../os/ui/windowselector.js';
import AltitudeMode from '../../../os/webgl/altitudemode.js';
import KMLNodeRemove from '../../file/kml/cmd/kmlnoderemovecmd.js';
import * as places from '../places.js';

const Disposable = goog.require('goog.Disposable');


/**
 * The quickaddplaces directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'root': '=?', // optional root node to add places to
    'initial': '=?' // optional initial geometry to add
  },
  templateUrl: ROOT + 'views/plugin/places/quickaddplaces.html',
  controller: Controller,
  controllerAs: 'quickAdd'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'quickaddplaces';


/**
 * Add the directive to the module.
 */
Module.directive('quickaddplaces', [directive]);



/**
 * Controller function for the quickaddplaces directive
 * @unrestricted
 */
export class Controller extends Disposable {
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
     * The root node to add places to.
     * @type {KMLNode}
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
     * @type {Array<!KMLNode>}
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

    $scope.$emit(WindowEventType.READY);
    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope = null;
    this.element = null;
  }

  /**
   * Add a geometry as a place. Also handles creating a root if one doesn't exist yet.
   *
   * @param {ol.geom.SimpleGeometry} geometry The geometry to add.
   * @export
   */
  addGeometry(geometry) {
    if (geometry) {
      geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);

      if (!this.root || !this.root.getParent()) {
        this.root = places.addFolder(/** @type {!places.FolderOptions} */ ({
          name: this['name'] || 'New Place'
        }));

        if (this.root) {
          this.added.push(this.root);
        }
      }

      var place = places.addPlace(/** @type {places.PlaceOptions} */ ({
        geometry: geometry,
        name: this.getUniqueName(),
        parent: this.root,
        styleConfig: {
          'labelSize': 14,
          'labelColor': 'rgba(255,255,255,1)',
          'labels': [FeatureEditCtrl.DEFAULT_LABEL]
        },
        startTime: Date.now()
      }));

      // re-interpolate the feature now to ensure that it has the original geometry and correct interpolation method
      const method = /** @type {Method} */ (geometry.get(interpolate.METHOD_FIELD));
      interpolate.beginTempInterpolation(undefined, method);
      interpolate.interpolateFeature(place.getFeature());
      interpolate.endTempInterpolation();

      if (place) {
        this.added.push(place);
      }
    }
  }

  /**
   * Resets the added place counter when the name changes.
   *
   * @export
   */
  onNameChange() {
    this.numAdded = 0;
  }

  /**
   * Gets a unique name for the target folder.
   * @return {string} The unique name.
   */
  getUniqueName() {
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
  }

  /**
   * Confirm adding the places.
   *
   * @export
   */
  confirm() {
    osWindow.close(this.element);
  }

  /**
   * Clear all added places.
   *
   * @export
   */
  clearAll() {
    if (this.added.length > 0) {
      var cp = CommandProcessor.getInstance();
      if (this.added[0].isFolder()) {
        // remove the folder, the children will go with it
        var folderCmd = new KMLNodeRemove(this.added[0]);
        folderCmd.title = 'Remove Quick Places';
        cp.addCommand(folderCmd);
      } else {
        var cmds = this.added.map(function(node) {
          return new KMLNodeRemove(node);
        });

        var pCmd = new ParallelCommand();
        pCmd.setCommands(cmds);
        pCmd.title = 'Remove Quick Place' + (cmds.length > 1 ? 's' : '');
        cp.addCommand(pCmd);
      }
    }

    osWindow.close(this.element);
  }
}

/**
 * Launches the quick add places dialog (or brings it to the front if it already exists).
 * @param {KMLNode=} opt_root Optional root KML node.
 * @param {ol.geom.SimpleGeometry=} opt_initial Optional initial geometry to add to the set of places.
 */
export const launch = (opt_root, opt_initial) => {
  if (osWindow.exists(WINDOW_ID)) {
    osWindow.bringToFront(WINDOW_ID);
    return;
  }

  var scopeOptions = {
    'root': opt_root,
    'initial': opt_initial
  };

  var container = angular.element(windowSelector.CONTAINER);
  var x = container.width() - 350;

  var windowOptions = {
    'label': 'Quick Add Places',
    'id': WINDOW_ID,
    'key': WINDOW_ID, // makes this a saved window, will remember position
    'icon': 'fa fa-fw ' + places.Icon.QUICK_ADD,
    'x': x,
    'y': 'center',
    'width': 300,
    'height': 'auto',
    'show-close': true
  };

  var template = '<quickaddplaces root="root" initial="initial"></quickaddplaces>';
  osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};


/**
 * @type {string}
 */
const WINDOW_ID = 'quickAddPlaces';

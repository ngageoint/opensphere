goog.provide('os.ui.query.ui.ModifyAreaCtrl');
goog.provide('os.ui.query.ui.modifyAreaDirective');

goog.require('goog.Disposable');
goog.require('goog.log');
goog.require('os.command.SequenceCommand');
goog.require('os.geo.jsts');
goog.require('os.ui.Module');
goog.require('os.ui.query.cmd.AreaAdd');
goog.require('os.ui.query.cmd.AreaModify');


/**
 * The modifyarea directive
 * @return {angular.Directive}
 */
os.ui.query.ui.modifyAreaDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'area': '=',
      'targetArea': '=?',
      'op': '=?'
    },
    templateUrl: os.ROOT + 'views/query/modifyarea.html',
    controller: os.ui.query.ui.ModifyAreaCtrl,
    controllerAs: 'modarea'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('modifyarea', [os.ui.query.ui.modifyAreaDirective]);



/**
 * Controller function for the modifyarea directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.query.ui.ModifyAreaCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.query.ui.ModifyAreaCtrl.LOGGER_;

  /**
   * @type {ol.Feature|undefined}
   * @protected
   */
  this.preview = undefined;

  /**
   * @type {Error}
   * @private
   */
  this.error_ = null;

  /**
   * @type {!Object<string, string>}
   */
  this['help'] = {
    'area1': 'The base area to be modified. A preview of the result will be shown on the map in blue, and this area ' +
        'can either be replaced or you can create a new area.',
    'area2': 'The area that will be used to modify the base area.',
    'mapArea': 'The area to add to/remove from the base area. This area was drawn/selected using the map. If you ' +
        'would like to choose a saved area, click Clear and select one from the dropdown.',
    'operation': 'How the area should be modified.',
    'addOp': 'The selected area will be combined with the Area to Modify.',
    'removeOp': 'The selected area will be cut out of the Area to Modify.',
    'intersectOp': 'The new area will only include intersecting portions of the selected areas.',
    'replace': 'If checked, the Area to Modify will be replaced with the area indicated by the preview. Otherwise ' +
        'a new area will be created with the provided title.',
    'title': 'The title to give to the new area'
  };

  /**
   * @type {boolean}
   */
  this['loading'] = false;

  /**
   * @type {boolean}
   */
  this['replace'] = true;

  /**
   * @type {?string}
   */
  this['title'] = 'New Area';

  // defaults
  $scope['op'] = $scope['op'] || os.ui.query.ui.ModifyOp.ADD;

  $scope.$watch('area', this.onAreaChange.bind(this));
  $scope.$watch('op', this.updatePreview.bind(this));
  $scope.$watch('targetArea', this.onTargetAreaChange.bind(this));
  $scope.$on('$destroy', this.dispose.bind(this));
  $scope.$emit('window.ready');
};
goog.inherits(os.ui.query.ui.ModifyAreaCtrl, goog.Disposable);


/**
 * Logger for os.ui.query.ui.ModifyAreaCtrl
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.query.ui.ModifyAreaCtrl.LOGGER_ = goog.log.getLogger('os.ui.query.ui.ModifyAreaCtrl');


/**
 * @inheritDoc
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.disposeInternal = function() {
  os.ui.query.ui.ModifyAreaCtrl.base(this, 'disposeInternal');
  this.setPreviewFeature(undefined);

  this.scope = null;
  this.element = null;
};


/**
 * Make sure everything is kosher.
 * @protected
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.validate = function() {
  this['error'] = null;

  if (this.scope) {
    if (!this.scope['area']) {
      // source isn't selected
      this['error'] = 'Please choose an area to modify.';
    } else if (!this.scope['targetArea']) {
      // source is selected, target is not
      this['error'] = 'Please choose an area to ' + this.scope['op'] + '.';
    } else if (this.scope['area'] == this.scope['targetArea']) {
      // areas cannot be the same
      this['error'] = 'Please select two different areas.';
    } else if (this.error_) {
      switch (this.error_.message) {
        case os.geo.jsts.ErrorMessage.EMPTY:
          if (this.scope['op'] == os.ui.query.ui.ModifyOp.REMOVE) {
            this['error'] = 'Area to Remove cannot fully contain the Area to Modify, or the result will be empty.';
          } else if (this.scope['op'] == os.ui.query.ui.ModifyOp.INTERSECT) {
            this['error'] = 'Areas do not have an intersection.';
          } else {
            // really hope we don't get here... add shouldn't result in an empty geometry
            this['error'] = this.scope['op'] + ' failed. Please check the log for details.';
          }
          break;
        case os.geo.jsts.ErrorMessage.NO_OP:
          if (this.scope['op'] == os.ui.query.ui.ModifyOp.REMOVE) {
            this['error'] = 'Area to Remove will not remove anything from the Area to Modify.';
          } else {
            this['error'] = 'Area to Add will not add anything to the Area to Modify.';
          }
          break;
        default:
          this['error'] = this.scope['op'] + ' failed. Please check the log for details.';
          break;
      }
    } else if (!this.preview) {
      this['error'] = this.scope['op'] + ' failed. Please check the log for details.';
    }
  }
};


/**
 * Handle change to the source area.
 * @param {ol.Feature=} opt_new
 * @param {ol.Feature=} opt_old
 * @protected
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.onAreaChange = function(opt_new, opt_old) {
  // area was provided, but it isn't in the area manager. assume it's a user-drawn area, or from a source.
  this.scope['fixArea'] = this.scope['area'] && !os.ui.areaManager.contains(this.scope['area']);

  this.updatePreview();
};


/**
 * Handle change to the target area.
 * @param {ol.Feature=} opt_new
 * @param {ol.Feature=} opt_old
 * @protected
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.onTargetAreaChange = function(opt_new, opt_old) {
  // target area was provided, but it isn't in the area manager. assume it's a user-drawn area, or from a source.
  this.scope['fixTargetArea'] = this.scope['targetArea'] && !os.ui.areaManager.contains(this.scope['targetArea']);

  this.updatePreview();
};


/**
 * Update the preview feature.
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.updatePreview = function() {
  this.setPreviewFeature(this.getMergedArea_());
  this.validate();
};


/**
 * @param {ol.Feature|undefined} feature
 * @protected
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.setPreviewFeature = function(feature) {
  this.preview = feature;
};


/**
 * Merge the two selected areas, returning the result.
 * @return {ol.Feature|undefined}
 * @private
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.getMergedArea_ = function() {
  this.error_ = null;

  var feature;
  if (this.scope['area'] && this.scope['targetArea']) {
    try {
      switch (this.scope['op']) {
        case os.ui.query.ui.ModifyOp.ADD:
          feature = os.geo.jsts.addTo(this.scope['area'], this.scope['targetArea']);
          break;
        case os.ui.query.ui.ModifyOp.REMOVE:
          feature = os.geo.jsts.removeFrom(this.scope['area'], this.scope['targetArea']);
          break;
        case os.ui.query.ui.ModifyOp.INTERSECT:
          feature = os.geo.jsts.intersect(this.scope['area'], this.scope['targetArea']);
          break;
        default:
          goog.log.error(this.log, 'Unsupported operation: ' + this.scope['op']);
          break;
      }
    } catch (e) {
      this.error_ = e;
    }
  }

  if (feature) {
    feature.set(os.data.RecordField.DRAWING_LAYER_NODE, false);
  }

  return feature;
};


/**
 * Fire the cancel callback and close the window.
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.cancel = function() {
  this.close_();
};
goog.exportProperty(
    os.ui.query.ui.ModifyAreaCtrl.prototype,
    'cancel',
    os.ui.query.ui.ModifyAreaCtrl.prototype.cancel);


/**
 * Performs the area modification.
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.confirm = function() {
  var feature = this.getMergedArea_();
  var geometry = feature ? feature.getGeometry() : null;
  if (feature && geometry) {
    var cmd;
    if (this['replace']) {
      // modify the geometry in the existing area
      cmd = new os.ui.query.cmd.AreaModify(this.scope['area'], geometry);
    } else {
      // add a new area
      feature.set('title', this['title']);
      cmd = new os.ui.query.cmd.AreaAdd(feature);
    }

    if (cmd) {
      os.command.CommandProcessor.getInstance().addCommand(cmd);
    }
  } else {
    os.alertManager.sendAlert('Failed modifying area! Please see the log for more details.',
        os.alert.AlertEventSeverity.ERROR, this.log);
  }

  this.close_();
};
goog.exportProperty(
    os.ui.query.ui.ModifyAreaCtrl.prototype,
    'confirm',
    os.ui.query.ui.ModifyAreaCtrl.prototype.confirm);


/**
 * Get the help popover title for an operation.
 * @param {string} op The operation
 * @return {string}
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.getPopoverTitle = function(op) {
  switch (op) {
    case os.ui.query.ui.ModifyOp.ADD:
      return 'Add Area';
    case os.ui.query.ui.ModifyOp.REMOVE:
      return 'Remove Area';
    case os.ui.query.ui.ModifyOp.INTERSECT:
      return 'Area Intersection';
    default:
      break;
  }

  return 'Area Help';
};
goog.exportProperty(
    os.ui.query.ui.ModifyAreaCtrl.prototype,
    'getPopoverTitle',
    os.ui.query.ui.ModifyAreaCtrl.prototype.getPopoverTitle);


/**
 * Get the help popover content for an operation.
 * @param {string} op The operation
 * @return {string}
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.getPopoverContent = function(op) {
  switch (op) {
    case os.ui.query.ui.ModifyOp.ADD:
      return this['help']['addOp'];
    case os.ui.query.ui.ModifyOp.REMOVE:
      return this['help']['removeOp'];
    case os.ui.query.ui.ModifyOp.INTERSECT:
      return this['help']['intersectOp'];
    default:
      break;
  }

  return 'Area Help';
};
goog.exportProperty(
    os.ui.query.ui.ModifyAreaCtrl.prototype,
    'getPopoverContent',
    os.ui.query.ui.ModifyAreaCtrl.prototype.getPopoverContent);


/**
 * Close the window.
 * @private
 */
os.ui.query.ui.ModifyAreaCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element);
};


/**
 * @typedef {{
 *    area: (ol.Feature|undefined),
 *    op: (string|undefined),
 *    targetArea: (ol.Feature|undefined),
 *    ui: (string|undefined)
 * }}
 */
os.ui.query.ui.ModifyAreaConfig;


/**
 * @enum {string}
 */
os.ui.query.ui.ModifyOp = {
  ADD: 'Add',
  REMOVE: 'Remove',
  INTERSECT: 'Intersect'
};


/**
 * Launch a dialog to modify an area.
 * @param {!os.ui.query.ui.ModifyAreaConfig} config
 */
os.ui.query.ui.launchModifyArea = function(config) {
  var windowId = 'modifyArea';
  if (os.ui.window.exists(windowId)) {
    // update the existing window
    var win = document.querySelector('.window#' + windowId);
    var scope = angular.element(win).find('.modify-area-window').scope();
    if (scope) {
      goog.object.extend(scope, config);
      os.ui.apply(scope);
    }

    os.ui.window.bringToFront(windowId);
  } else {
    var windowOptions = {
      'id': windowId,
      'label': 'Modify Area...',
      'icon': 'fa fa-edit',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'height': 'auto',
      'show-close': true,
      'no-scroll': true
    };

    // the null defaults prevent the choosearea directive from picking a default value
    var scopeOptions = {
      'area': config['area'] || null,
      'op': config['op'],
      'targetArea': config['targetArea'] || null
    };

    var ui = config['ui'] || 'modifyarea';
    var template = '<' + ui + ' area="area" target-area="targetArea" op="op"></' + ui + '>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};

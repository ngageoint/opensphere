goog.provide('os.ui.query.ModifyAreaCtrl');
goog.provide('os.ui.query.modifyAreaDirective');

goog.require('goog.events.KeyCodes');
goog.require('goog.log');
goog.require('ol.Feature');
goog.require('os.command.CommandProcessor');
goog.require('os.command.SequenceCommand');
goog.require('os.geo.jsts');
goog.require('os.interaction.Modify');
goog.require('os.query.AreaManager');
goog.require('os.ui.Module');
goog.require('os.ui.help.Controls');
goog.require('os.ui.query.cmd.AreaAdd');
goog.require('os.ui.query.cmd.AreaModify');


/**
 * The modifyarea directive
 *
 * @return {angular.Directive}
 */
os.ui.query.modifyAreaDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'feature': '=',
      'targetArea': '=?',
      'op': '=?'
    },
    templateUrl: os.ROOT + 'views/query/modifyarea.html',
    controller: os.ui.query.ModifyAreaCtrl,
    controllerAs: 'modarea'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('modifyarea', [os.ui.query.modifyAreaDirective]);



/**
 * Controller function for the modifyarea directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.query.ModifyAreaCtrl = function($scope, $element) {
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
  this.log = os.ui.query.ModifyAreaCtrl.LOGGER_;

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
   * Interaction for freeform modification.
   * @type {os.interaction.Modify}
   */
  this.interaction = null;

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

  /**
   * The currently selected tab.
   * @type {?string}
   */
  this['tab'] = null;

  /**
   * Flag for whether we are operating on an area.
   * @type {boolean}
   */
  this['showTabs'] = true;

  /**
   * Controls for freeform modification.
   * @type {Array<Object<string, *>>}
   */
  this['controls'] = [
    {
      'text': 'Remove Vertex',
      'keys': [goog.events.KeyCodes.ALT, '+'],
      'other': [os.ui.help.Controls.MOUSE.LEFT_MOUSE]
    },
    {
      'text': 'Save Changes',
      'keys': [goog.events.KeyCodes.ENTER]
    },
    {
      'text': 'Cancel',
      'keys': [goog.events.KeyCodes.ESC]
    }
  ];

  // default the op and the tab to freeform
  $scope['op'] = $scope['op'] || os.ui.query.ModifyOp.ADD;

  const am = os.query.AreaManager.getInstance();
  let showTabs = true;
  let feature;
  let initialTab = os.ui.query.ModifyType.FREEFORM;

  // configure the form
  if ($scope['feature']) {
    feature = /** @type {!ol.Feature} */ ($scope['feature']);
    showTabs = am.contains(feature) && am.getAll().length >= 2;
    this.interaction = new os.interaction.Modify(feature);
    initialTab = os.ui.query.ModifyType.FREEFORM;
  } else if ($scope['targetArea']) {
    feature = /** @type {!ol.Feature} */ ($scope['targetArea']);
    showTabs = false;
    this.interaction = null;
    initialTab = os.ui.query.ModifyType.ADD_REMOVE;
  }

  this['showTabs'] = showTabs;
  this.setTab(initialTab);

  $scope.$watch('feature', this.onAreaChange.bind(this));
  $scope.$watch('op', this.updatePreview.bind(this));
  $scope.$watch('targetArea', this.onTargetAreaChange.bind(this));

  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Modify type enum.
 * @enum {string}
 */
os.ui.query.ModifyType = {
  ADD_REMOVE: 'addRemoveIntersect',
  FREEFORM: 'freeform'
};


/**
 * Logger for os.ui.query.ModifyAreaCtrl
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.query.ModifyAreaCtrl.LOGGER_ = goog.log.getLogger('os.ui.query.ModifyAreaCtrl');


/**
 * Angular destroy hook.
 */
os.ui.query.ModifyAreaCtrl.prototype.$onDestroy = function() {
  this.setPreviewFeature(undefined);

  if (this.interaction) {
    os.MapContainer.getInstance().getMap().removeInteraction(this.interaction);
    this.interaction.setActive(false);
    goog.dispose(this.interaction);
  }

  this.scope = null;
  this.element = null;
};


/**
 * Sets the tab.
 * @param {string} tab The tab to set.
 * @export
 */
os.ui.query.ModifyAreaCtrl.prototype.setTab = function(tab) {
  if (tab != this['tab']) {
    this['tab'] = tab;

    const mc = os.MapContainer.getInstance();

    if (tab == os.ui.query.ModifyType.FREEFORM) {
      this.interaction.setOverlay(/** @type {ol.layer.Vector} */ (mc.getDrawingLayer()));

      mc.getMap().addInteraction(this.interaction);
      this.interaction.setActive(true);

      ol.events.listen(this.interaction, os.interaction.ModifyEventType.COMPLETE, this.onInteractionComplete, this);
      ol.events.listen(this.interaction, os.interaction.ModifyEventType.CANCEL, this.onInteractionCancel, this);
    } else if (tab == os.ui.query.ModifyType.ADD_REMOVE && this.interaction) {
      mc.getMap().removeInteraction(this.interaction);
      this.interaction.setActive(false);
      // goog.dispose(this.interaction);
    }
  }

  this.validate();
};


/**
 * Callback handler for successfully completing a modify of a geometry.
 * @param {os.events.PayloadEvent} event
 */
os.ui.query.ModifyAreaCtrl.prototype.onInteractionComplete = function(event) {
  const feature = /** @type {!ol.Feature} */ (this.scope['feature']);
  const clone = /** @type {!ol.Feature} */ (event.getPayload());
  const source = os.feature.getSource(feature);
  let modifyFunction;

  if (os.implements(source, os.source.IModifiableSource.ID)) {
    modifyFunction = /** @type {os.source.IModifiableSource} */ (source).getModifyFunction();
  }

  if (modifyFunction) {
    // call the modify function to finalize the update
    modifyFunction(feature, clone);
  } else {
    const geometry = clone.getGeometry();
    if (feature && geometry) {
      // default behavior is to assume that we're modifying an area, so update it in AreaManager
      const modifyCmd = new os.ui.query.cmd.AreaModify(feature, geometry);
      os.command.CommandProcessor.getInstance().addCommand(modifyCmd);
    }
  }

  // remove the clone and the interaction from the map
  os.MapContainer.getInstance().getMap().removeInteraction(this.interaction);
  this.close_();
};


/**
 * Callback handler for canceling a modify.
 */
os.ui.query.ModifyAreaCtrl.prototype.onInteractionCancel = function() {
  this.close_();
};


/**
 * Make sure everything is kosher.
 *
 * @protected
 */
os.ui.query.ModifyAreaCtrl.prototype.validate = function() {
  this['error'] = null;

  if (this.scope && this['tab'] == os.ui.query.ModifyType.ADD_REMOVE) {
    if (!this.scope['feature']) {
      // source isn't selected
      this['error'] = 'Please choose an area to modify.';
    } else if (!this.scope['targetArea']) {
      // source is selected, target is not
      this['error'] = 'Please choose an area to ' + this.scope['op'] + '.';
    } else if (this.scope['feature'] == this.scope['targetArea']) {
      // areas cannot be the same
      this['error'] = 'Please select two different areas.';
    } else if (this.error_) {
      switch (this.error_.message) {
        case os.geo.jsts.ErrorMessage.EMPTY:
          if (this.scope['op'] == os.ui.query.ModifyOp.REMOVE) {
            this['error'] = 'Area to Remove cannot fully contain the Area to Modify, or the result will be empty.';
          } else if (this.scope['op'] == os.ui.query.ModifyOp.INTERSECT) {
            this['error'] = 'Areas do not have an intersection.';
          } else {
            // really hope we don't get here... add shouldn't result in an empty geometry
            this['error'] = this.scope['op'] + ' failed. Please check the log for details.';
          }
          break;
        case os.geo.jsts.ErrorMessage.NO_OP:
          if (this.scope['op'] == os.ui.query.ModifyOp.REMOVE) {
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
 *
 * @param {ol.Feature=} opt_new
 * @param {ol.Feature=} opt_old
 * @protected
 */
os.ui.query.ModifyAreaCtrl.prototype.onAreaChange = function(opt_new, opt_old) {
  // area was provided, but it isn't in the area manager. assume it's a user-drawn area, or from a source.
  this.scope['fixArea'] = this.scope['feature'] && !os.ui.areaManager.contains(this.scope['feature']);

  this.updatePreview();
};


/**
 * Handle change to the target area.
 *
 * @param {ol.Feature=} opt_new
 * @param {ol.Feature=} opt_old
 * @protected
 */
os.ui.query.ModifyAreaCtrl.prototype.onTargetAreaChange = function(opt_new, opt_old) {
  // target area was provided, but it isn't in the area manager. assume it's a user-drawn area, or from a source.
  this.scope['fixTargetArea'] = this.scope['targetArea'] && !os.ui.areaManager.contains(this.scope['targetArea']);

  this.updatePreview();
};


/**
 * Update the preview feature.
 */
os.ui.query.ModifyAreaCtrl.prototype.updatePreview = function() {
  this.setPreviewFeature(this.getMergedArea_());
  this.validate();
};


/**
 * @param {ol.Feature|undefined} feature
 * @protected
 */
os.ui.query.ModifyAreaCtrl.prototype.setPreviewFeature = function(feature) {
  this.preview = feature;
};


/**
 * Merge the two selected areas, returning the result.
 *
 * @return {ol.Feature|undefined}
 * @private
 */
os.ui.query.ModifyAreaCtrl.prototype.getMergedArea_ = function() {
  this.error_ = null;

  var feature;
  if (this.scope['feature'] && this.scope['targetArea']) {
    try {
      switch (this.scope['op']) {
        case os.ui.query.ModifyOp.ADD:
          feature = os.geo.jsts.addTo(this.scope['feature'], this.scope['targetArea']);
          break;
        case os.ui.query.ModifyOp.REMOVE:
          feature = os.geo.jsts.removeFrom(this.scope['feature'], this.scope['targetArea']);
          break;
        case os.ui.query.ModifyOp.INTERSECT:
          feature = os.geo.jsts.intersect(this.scope['feature'], this.scope['targetArea']);
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
 *
 * @export
 */
os.ui.query.ModifyAreaCtrl.prototype.cancel = function() {
  this.close_();
};


/**
 * Performs the area modification.
 *
 * @export
 */
os.ui.query.ModifyAreaCtrl.prototype.confirm = function() {
  if (this['tab'] == os.ui.query.ModifyType.FREEFORM) {
    this.interaction.complete();
  } else if (this['tab'] == os.ui.query.ModifyType.ADD_REMOVE) {
    var feature = this.getMergedArea_();
    var geometry = feature ? feature.getGeometry() : null;

    if (feature && geometry) {
      var cmd;
      if (this['replace']) {
        // modify the geometry in the existing area
        cmd = new os.ui.query.cmd.AreaModify(this.scope['feature'], geometry);
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
  }

  this.close_();
};


/**
 * Get the help popover title for an operation.
 *
 * @param {string} op The operation
 * @return {string}
 * @export
 */
os.ui.query.ModifyAreaCtrl.prototype.getPopoverTitle = function(op) {
  switch (op) {
    case os.ui.query.ModifyOp.ADD:
      return 'Add Area';
    case os.ui.query.ModifyOp.REMOVE:
      return 'Remove Area';
    case os.ui.query.ModifyOp.INTERSECT:
      return 'Area Intersection';
    default:
      break;
  }

  return 'Area Help';
};


/**
 * Get the help popover content for an operation.
 *
 * @param {string} op The operation
 * @return {string}
 * @export
 */
os.ui.query.ModifyAreaCtrl.prototype.getPopoverContent = function(op) {
  switch (op) {
    case os.ui.query.ModifyOp.ADD:
      return this['help']['addOp'];
    case os.ui.query.ModifyOp.REMOVE:
      return this['help']['removeOp'];
    case os.ui.query.ModifyOp.INTERSECT:
      return this['help']['intersectOp'];
    default:
      break;
  }

  return 'Area Help';
};


/**
 * Close the window.
 *
 * @private
 */
os.ui.query.ModifyAreaCtrl.prototype.close_ = function() {
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
os.ui.query.ModifyAreaConfig;


/**
 * @enum {string}
 */
os.ui.query.ModifyOp = {
  ADD: 'Add',
  REMOVE: 'Remove',
  INTERSECT: 'Intersect'
};


/**
 * Launch a dialog to modify an area.
 *
 * @param {!os.ui.query.ModifyAreaConfig} config
 */
os.ui.query.launchModifyArea = function(config) {
  var windowId = 'modifyArea';
  var container = angular.element(os.ui.windowSelector.CONTAINER);
  var width = 400;
  var x = container.width() - width - 50;

  if (os.ui.window.exists(windowId)) {
    // update the existing window
    var scope = $('.js-window#' + windowId + ' .modal-body').scope();
    if (scope) {
      Object.assign(scope, config);
      os.ui.apply(scope);
    }

    os.ui.window.bringToFront(windowId);
  } else {
    var windowOptions = {
      'id': windowId,
      'label': 'Modify Geometry...',
      'icon': 'fa fa-edit',
      'x': x,
      'y': 'center',
      'width': width,
      'height': 'auto',
      'show-close': true
    };

    // the null defaults prevent the choosearea directive from picking a default value
    var scopeOptions = {
      'feature': config['feature'] || null,
      'op': config['op'],
      'targetArea': config['targetArea'] || null
    };

    var ui = config['ui'] || 'modifyarea';
    var template = '<' + ui + ' feature="feature" target-area="targetArea" op="op"></' + ui + '>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};

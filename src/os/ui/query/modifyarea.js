goog.declareModuleId('os.ui.query.ModifyAreaUI');

import {listen} from 'ol/src/events.js';
import Feature from 'ol/src/Feature.js';

import '../util/validationmessage.js';
import AlertEventSeverity from '../../alert/alerteventseverity.js';
import AlertManager from '../../alert/alertmanager.js';
import CommandProcessor from '../../command/commandprocessor.js';
import RecordField from '../../data/recordfield.js';
import {getSource} from '../../feature/feature.js';
import * as osJsts from '../../geo/jsts.js';
import osImplements from '../../implements.js';
import {ModifyEventType} from '../../interaction/interaction.js';
import Modify from '../../interaction/modifyinteraction.js';
import {getMapContainer} from '../../map/mapinstance.js';
import * as osOlFeature from '../../ol/feature.js';
import {ROOT} from '../../os.js';
import {getAreaManager} from '../../query/queryinstance.js';
import IModifiableSource from '../../source/imodifiablesource.js';
import {PREVIEW_CONFIG} from '../../style/style.js';
import Controls from '../help/controls.js';
import Module from '../module.js';
import {apply} from '../ui.js';
import {bringToFront, close, create, exists} from '../window.js';
import WindowEventType from '../windoweventtype.js';
import windowSelector from '../windowselector.js';
import AreaAdd from './cmd/areaaddcmd.js';
import AreaModify from './cmd/areamodifycmd.js';

const dispose = goog.require('goog.dispose');
const KeyCodes = goog.require('goog.events.KeyCodes');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: PayloadEvent} = goog.requireType('os.events.PayloadEvent');


/**
 * The modifyarea directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'feature': '=',
    'targetArea': '=?',
    'op': '=?'
  },
  templateUrl: ROOT + 'views/query/modifyarea.html',
  controller: Controller,
  controllerAs: 'modarea'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'modifyarea';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the modifyarea directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
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
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {Feature|undefined}
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
     * @type {Modify}
     */
    this.interaction = null;

    /**
     * @type {Feature|undefined}
     * @protected
     */
    this.areaPreview = null;

    /**
     * @type {Feature|undefined}
     * @protected
     */
    this.targetPreview = null;

    /**
     * @type {!Object<string, string>}
     */
    this['help'] = {
      'area1': 'The base area to be modified. A preview of the result will be shown on the map in blue, and this ' +
          'area can either be replaced or you can create a new area.',
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
        'keys': [KeyCodes.ALT, '+'],
        'other': [Controls.MOUSE.LEFT_MOUSE]
      },
      {
        'text': 'Save Changes',
        'keys': [KeyCodes.ENTER]
      },
      {
        'text': 'Cancel',
        'keys': [KeyCodes.ESC]
      }
    ];

    // default the op and the tab to freeform
    $scope['op'] = $scope['op'] || ModifyOp.ADD;

    const am = getAreaManager();
    let showTabs = true;
    let feature;
    let initialTab = ModifyType.FREEFORM;

    // configure the form
    if ($scope['feature']) {
      feature = /** @type {!Feature} */ ($scope['feature']);
      showTabs = am.contains(feature) && am.getAll().length >= 2;
      this.interaction = new Modify(feature);
      initialTab = ModifyType.FREEFORM;
    } else if ($scope['targetArea']) {
      feature = /** @type {!Feature} */ ($scope['targetArea']);
      showTabs = false;
      this.interaction = null;
      initialTab = ModifyType.ADD_REMOVE;
    }

    this['showTabs'] = showTabs;
    this.setTab(initialTab);

    $scope.$watch('feature', this.onAreaChange.bind(this));
    $scope.$watch('op', this.updatePreview.bind(this));
    $scope.$watch('targetArea', this.onTargetAreaChange.bind(this));

    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Angular destroy hook.
   */
  $onDestroy() {
    this.setPreviewFeature(undefined);

    dispose(this.interaction);

    if (this.areaPreview) {
      getMapContainer().removeFeature(this.areaPreview);
      this.areaPreview = null;
    }

    if (this.targetPreview) {
      getMapContainer().removeFeature(this.targetPreview);
      this.targetPreview = null;
    }

    this.scope = null;
    this.element = null;
  }

  /**
   * Sets the tab.
   * @param {string} tab The tab to set.
   * @export
   */
  setTab(tab) {
    if (tab != this['tab']) {
      this['tab'] = tab;

      const mc = getMapContainer();

      if (tab == ModifyType.FREEFORM) {
        this.interaction.setOverlay(/** @type {Vector} */ (mc.getDrawingLayer()));

        mc.getMap().addInteraction(this.interaction);
        this.interaction.setActive(true);

        listen(this.interaction, ModifyEventType.COMPLETE, this.onInteractionComplete, this);
        listen(this.interaction, ModifyEventType.CANCEL, this.onInteractionCancel, this);
      } else if (tab == ModifyType.ADD_REMOVE && this.interaction) {
        mc.getMap().removeInteraction(this.interaction);
        this.interaction.setActive(false);
      }
    }

    this.validate();
  }

  /**
   * Callback handler for successfully completing a modify of a geometry.
   * @param {PayloadEvent} event
   */
  onInteractionComplete(event) {
    const feature = /** @type {!Feature} */ (this.scope['feature']);
    const clone = /** @type {!Feature} */ (event.getPayload());
    const source = getSource(feature);
    let modifyFunction;

    if (osImplements(source, IModifiableSource.ID)) {
      modifyFunction = /** @type {IModifiableSource} */ (source).getModifyFunction();
    }

    if (modifyFunction) {
      // call the modify function to finalize the update
      modifyFunction(feature, clone);
    } else {
      const geometry = clone.getGeometry();
      if (feature && geometry) {
        // default behavior is to assume that we're modifying an area, so update it in AreaManager
        const modifyCmd = new AreaModify(feature, geometry);
        CommandProcessor.getInstance().addCommand(modifyCmd);
      }
    }

    // remove the clone and the interaction from the map
    getMapContainer().getMap().removeInteraction(this.interaction);
    this.close_();
  }

  /**
   * Callback handler for canceling a modify.
   */
  onInteractionCancel() {
    this.close_();
  }

  /**
   * Make sure everything is kosher.
   *
   * @protected
   */
  validate() {
    this['error'] = null;

    if (this.scope && this['tab'] == ModifyType.ADD_REMOVE) {
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
          case osJsts.ErrorMessage.EMPTY:
            if (this.scope['op'] == ModifyOp.REMOVE) {
              this['error'] = 'Area to Remove cannot fully contain the Area to Modify, or the result will be empty.';
            } else if (this.scope['op'] == ModifyOp.INTERSECT) {
              this['error'] = 'Areas do not have an intersection.';
            } else {
              // really hope we don't get here... add shouldn't result in an empty geometry
              this['error'] = this.scope['op'] + ' failed. Please check the log for details.';
            }
            break;
          case osJsts.ErrorMessage.NO_OP:
            if (this.scope['op'] == ModifyOp.REMOVE) {
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
  }

  /**
   * Handle change to the source area.
   *
   * @param {Feature=} opt_new
   * @param {Feature=} opt_old
   * @protected
   */
  onAreaChange(opt_new, opt_old) {
    if (this.areaPreview) {
      getMapContainer().removeFeature(this.areaPreview);
    }

    this.areaPreview = null;

    if (opt_new instanceof Feature && opt_new.getGeometry()) {
      // clone the feature because we don't want the style, nor do we want to remove the original from the map
      this.areaPreview = osOlFeature.clone(opt_new);
      this.areaPreview.set(RecordField.DRAWING_LAYER_NODE, false);
      getMapContainer().addFeature(this.areaPreview);
    }

    // area was provided, but it isn't in the area manager. assume it's a user-drawn area, or from a source.
    this.scope['fixArea'] = this.scope['feature'] && !getAreaManager().contains(this.scope['feature']);

    this.updatePreview();
  }

  /**
   * Handle change to the target area.
   *
   * @param {Feature=} opt_new
   * @param {Feature=} opt_old
   * @protected
   */
  onTargetAreaChange(opt_new, opt_old) {
    if (this.targetPreview) {
      getMapContainer().removeFeature(this.targetPreview);
    }

    this.targetPreview = null;

    if (opt_new instanceof Feature && opt_new.getGeometry()) {
      // clone the feature because we don't want the style, nor do we want to remove the original from the map
      this.targetPreview = osOlFeature.clone(opt_new);
      this.targetPreview.set(RecordField.DRAWING_LAYER_NODE, false);
      getMapContainer().addFeature(this.targetPreview);
    }

    // target area was provided, but it isn't in the area manager. assume it's a user-drawn area, or from a source.
    this.scope['fixTargetArea'] = this.scope['targetArea'] && !getAreaManager().contains(this.scope['targetArea']);

    this.updatePreview();
  }

  /**
   * Update the preview feature.
   */
  updatePreview() {
    this.setPreviewFeature(this.getMergedArea_());
    this.validate();
  }

  /**
   * @param {Feature|undefined} feature
   * @protected
   */
  setPreviewFeature(feature) {
    if (this.preview) {
      getMapContainer().removeFeature(this.preview);
    }

    this.preview = feature;

    if (this.preview && this.preview.getGeometry()) {
      getMapContainer().addFeature(this.preview, PREVIEW_CONFIG);
    }
  }

  /**
   * Merge the two selected areas, returning the result.
   *
   * @return {Feature|undefined}
   * @private
   */
  getMergedArea_() {
    this.error_ = null;

    var feature;
    if (this.scope['feature'] && this.scope['targetArea']) {
      try {
        switch (this.scope['op']) {
          case ModifyOp.ADD:
            feature = osJsts.addTo(this.scope['feature'], this.scope['targetArea']);
            break;
          case ModifyOp.REMOVE:
            feature = osJsts.removeFrom(this.scope['feature'], this.scope['targetArea']);
            break;
          case ModifyOp.INTERSECT:
            feature = osJsts.intersect(this.scope['feature'], this.scope['targetArea']);
            break;
          default:
            log.error(this.log, 'Unsupported operation: ' + this.scope['op']);
            break;
        }
      } catch (e) {
        this.error_ = e;
      }
    }

    if (feature) {
      feature.set(RecordField.DRAWING_LAYER_NODE, false);
    }

    return feature;
  }

  /**
   * Fire the cancel callback and close the window.
   *
   * @export
   */
  cancel() {
    this.close_();
  }

  /**
   * Performs the area modification.
   *
   * @export
   */
  confirm() {
    if (this['tab'] == ModifyType.FREEFORM) {
      this.interaction.complete();
    } else if (this['tab'] == ModifyType.ADD_REMOVE) {
      var feature = this.getMergedArea_();
      var geometry = feature ? feature.getGeometry() : null;

      if (feature && geometry) {
        var cmd;
        if (this['replace']) {
          // modify the geometry in the existing area
          cmd = new AreaModify(this.scope['feature'], geometry);
        } else {
          // add a new area
          feature.set('title', this['title']);
          cmd = new AreaAdd(feature);
        }

        if (cmd) {
          CommandProcessor.getInstance().addCommand(cmd);
        }
      } else {
        AlertManager.getInstance().sendAlert('Failed modifying area! Please see the log for more details.',
            AlertEventSeverity.ERROR, this.log);
      }
    }

    this.close_();
  }

  /**
   * Get the help popover title for an operation.
   *
   * @param {string} op The operation
   * @return {string}
   * @export
   */
  getPopoverTitle(op) {
    switch (op) {
      case ModifyOp.ADD:
        return 'Add Area';
      case ModifyOp.REMOVE:
        return 'Remove Area';
      case ModifyOp.INTERSECT:
        return 'Area Intersection';
      default:
        break;
    }

    return 'Area Help';
  }

  /**
   * Get the help popover content for an operation.
   *
   * @param {string} op The operation
   * @return {string}
   * @export
   */
  getPopoverContent(op) {
    switch (op) {
      case ModifyOp.ADD:
        return this['help']['addOp'];
      case ModifyOp.REMOVE:
        return this['help']['removeOp'];
      case ModifyOp.INTERSECT:
        return this['help']['intersectOp'];
      default:
        break;
    }

    return 'Area Help';
  }

  /**
   * Close the window.
   *
   * @private
   */
  close_() {
    close(this.element);
  }
}

/**
 * Logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.query.ModifyAreaUI');

/**
 * @typedef {{
 *    area: (Feature|undefined),
 *    op: (string|undefined),
 *    targetArea: (Feature|undefined)
 * }}
 */
export let ModifyAreaConfig;

/**
 * @enum {string}
 */
export const ModifyOp = {
  ADD: 'Add',
  REMOVE: 'Remove',
  INTERSECT: 'Intersect'
};

/**
 * Modify type enum.
 * @enum {string}
 */
export const ModifyType = {
  ADD_REMOVE: 'addRemoveIntersect',
  FREEFORM: 'freeform'
};

/**
 * Launch a dialog to modify an area.
 *
 * @param {!ModifyAreaConfig} config
 */
export const launchModifyArea = function(config) {
  var windowId = 'modifyArea';
  var container = angular.element(windowSelector.CONTAINER);
  var width = 400;
  var x = container.width() - width - 50;

  if (exists(windowId)) {
    // update the existing window
    var scope = $('.js-window#' + windowId + ' .modal-body').scope();
    if (scope) {
      Object.assign(scope, config);
      apply(scope);
    }

    bringToFront(windowId);
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

    var template = '<modifyarea feature="feature" target-area="targetArea" op="op"></modifyarea>';
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
};

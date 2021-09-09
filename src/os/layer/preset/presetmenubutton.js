goog.module('os.layer.preset.PresetMenuButton');

const LayerPresetManager = goog.require('os.layer.preset.LayerPresetManager');
const {getImportActionManager} = goog.require('os.im.action');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const Menu = goog.require('os.ui.menu.Menu');
const MenuItem = goog.require('os.ui.menu.MenuItem');
const MenuItemType = goog.require('os.ui.menu.MenuItemType');
const Module = goog.require('os.ui.Module');
const OsLayerPreset = goog.require('os.layer.preset');
const OsXml = goog.require('os.xml');
const OsFilter = goog.require('os.im.action.filter');
const {Presets: OsMetrics} = goog.require('os.metrics.keys');
const AlertManager = goog.require('os.alert.AlertManager');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');
const OsUi = goog.require('os.ui');
const {DEFAULT_PRESET_ID} = goog.require('os.layer.preset');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');
const ILayer = goog.requireType('os.layer.ILayer');
const IPresetService = goog.requireType('os.layer.preset.IPresetService');

const GoogLog = goog.require('goog.log');


/**
 * @type {string}
 * @const
 */
const MENU_FLAG = 'presets';

/**
 * Preset events
 * @enum {string}
 */
const EventType = {
  APPLY_PRESET: 'apply-preset',
  REMOVE: 'remove',
  SAVE: 'save',
  TOGGLE_PRESET: 'toggle-preset',
  TOGGLE_DEFAULT_TRUE: 'toggle-default-true',
  TOGGLE_DEFAULT_FALSE: 'toggle-default-false',
  TOGGLE_PUBLISHED_TRUE: 'toggle-published-true',
  TOGGLE_PUBLISHED_FALSE: 'toggle-published-false'
};

/**
 * @type {GoogLog.Logger}
 * @const
 */
const LOGGER = GoogLog.getLogger('os.layer.preset.PresetMenuButton');

/**
 * The controller for the preset directive; make use of the MenuButtonController
 * @unrestricted
 */
class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * @type {boolean}
     */
    this['isAdmin'] = false;

    /**
     * @type {boolean}
     */
    this['thinking'] = false;

    this.init_();
  }

  /**
   * @private
   */
  init_() {
    this['isAdmin'] = LayerPresetManager.getInstance().isAdmin(); // requires ng-if

    // build the menu
    this.menu = new Menu(new MenuItem({
      type: MenuItemType.ROOT,
      children: [{
        label: '',
        type: MenuItemType.GROUP,
        sort: 0,
        beforeRender: this.visibility.bind(this),
        children: [{
          label: 'Save as...',
          eventType: EventType.SAVE,
          tooltip: 'Save Preset',
          icons: ['<i class="fa fa-fw fa-floppy-o"></i>'],
          handler: this.save.bind(this),
          metricKey: OsMetrics.SAVE,
          sort: 0
        }, {
          label: 'Make public',
          eventType: EventType.TOGGLE_PUBLISHED_TRUE,
          tooltip: 'Make Preset visible to everyone',
          icons: ['<i class="fa fa-fw fa-eye"></i>'],
          handler: this.togglePublished.bind(this),
          metricKey: OsMetrics.TOGGLE_PUBLISHED,
          sort: 10
        }, {
          label: 'Make admin only',
          eventType: EventType.TOGGLE_PUBLISHED_FALSE,
          tooltip: 'Return Preset to hidden (admin only) mode',
          icons: ['<i class="fa fa-fw fa-eye-slash"></i>'],
          handler: this.togglePublished.bind(this),
          metricKey: OsMetrics.TOGGLE_PUBLISHED,
          sort: 11
        }, {
          label: 'Set as Default',
          eventType: EventType.TOGGLE_DEFAULT_TRUE,
          tooltip: 'Make Preset the default style when layer added',
          icons: ['<i class="fa fa-fw fa-star"></i>'],
          handler: this.toggleDefault.bind(this),
          metricKey: OsMetrics.TOGGLE_DEFAULT,
          sort: 20
        }, {
          label: 'Revoke Default',
          eventType: EventType.TOGGLE_DEFAULT_FALSE,
          tooltip: 'Undo making Preset the default style when layer added',
          icons: ['<i class="fa fa-fw fa-star-o"></i>'],
          handler: this.toggleDefault.bind(this),
          metricKey: OsMetrics.TOGGLE_DEFAULT,
          sort: 21
        }, {
          label: 'Delete',
          eventType: EventType.REMOVE,
          tooltip: 'Permanently delete Preset',
          icons: ['<i class="fa fa-fw fa-trash-o"></i>'],
          handler: this.remove.bind(this),
          metricKey: OsMetrics.REMOVE,
          sort: 30
        }]
      }]
    }));
    this.flag = MENU_FLAG;
    this.metricKey = OsMetrics.OPEN;
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.scope = null;
  }

  /**
   * Clone source, then update the configs and feature actions to currently selected values
   *
   * @param {!osx.layer.Preset} source
   * @return {!osx.layer.Preset}
   */
  clone(source) {
    const clone = /** @type {osx.layer.Preset} */ (Object.assign({}, source));

    // get the current layerConfig
    if (clone.layerId) {
      const layer = os.MapContainer.getInstance().getLayer(clone.layerId); // TODO fix global reference
      if (layer) {
        const config = /** @type {ILayer} */ (layer).persist();
        clone.layerConfig = config;
      }
    }

    const iam = getImportActionManager();

    // get the currently active FeatureAction ID's as a list
    const ids = iam.getActiveActionEntryIds(clone.layerId);

    // only return top-level feature actions, not specific sub-entries
    const entries = iam.getRootActiveActionEntries(clone.layerId);

    if (entries && entries.length > 0 && ids && ids.length > 0) {
      clone.featureActions = ids;

      // export the currently active FeatureActions into an XML string
      const rootNode = OsXml.createElementNS(iam.xmlGroup, 'http://www.bit-sys.com/state/v4');
      const entryXmls = OsFilter.exportEntries(entries, false);

      (entryXmls || []).forEach((entryXml) => {
        rootNode.appendChild(entryXml);
      });
      const xml = OsXml.serialize(rootNode);

      clone.featureActionsXML = xml;
    } else {
      clone.featureActions = [];
    }

    return clone;
  }

  /**
   * Get a service that will be able to do the requested action
   *
   * @param {!OsLayerPreset.PresetServiceAction} action
   * @param {osx.layer.Preset=} opt_preset
   * @return {Promise<IPresetService>}
   */
  getService(action, opt_preset) {
    // TODO if the user passes in a Preset, get the service from which the preset came

    // get PresetService(s) that support save()
    const services = LayerPresetManager.getInstance().supporting(action);

    // TODO if more than one, open a dropdown modal to select one
    const service = (services && services.length > 0) ? services[0] : null;

    return new Promise((resolve, reject) => {
      if (service) {
        resolve(service);
      } else {
        reject(`No services found that support the ${action.toLowerCase()} action`);
      }
    });
  }

  /**
   * Bubble up to parent(s), asking to applyPreset()
   * @export
   */
  notifyApplyPreset() {
    this.scope.$emit(EventType.APPLY_PRESET);
  }

  /**
   * Delete the Preset from its source service
   */
  remove() {
    // clone existing preset then update clone with latest settings
    const preset = this.scope['preset'];
    const prompt = `<span>Permanently delete Preset "${preset.label}"? This cannot be undone.</span>`;

    // As a future improvement, overwrite the result in the promise.all and flag the affeted FA's in
    // the ImportActionManager as 'Presets'

    // Refresh the application
    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      yesText: 'Delete',
      yesIcon: 'fa fa-trash-o',
      yesButtonClass: 'btn-danger',
      confirm: (() => {
        // get PresetService(s) that support remove()
        this.getService(OsLayerPreset.PresetServiceAction.REMOVE).then(
            (service) => {
              this['thinking'] = true;
              OsUi.apply(this.scope); // outside the angular digest cycle; need to reapply scope

              service.remove(preset).then(
                  this.removeSuccess.bind(this),
                  this.onServiceFailure.bind(this, 'Could not delete preset'));
            },
            (msg) => {
              GoogLog.error(LOGGER, '' + msg);
            }
        );
      }),
      prompt,
      windowOptions: {
        'label': 'Delete...',
        'icon': 'fa fa-floppy-o',
        'x': 'center',
        'y': 100,
        'width': 400,
        'height': 'auto',
        'modal': 'true',
        'show-close': 'true'
      }
    }));
  }

  /**
   * Handle when the Preset is properly saved to the desired service
   * @param {?boolean} b
   */
  removeSuccess(b) {
    this['thinking'] = false;
    OsUi.apply(this.scope); // outside the angular digest cycle; need to reapply scope

    if (b === true) {
      this.saveSuccessConfirm();
    }
  }

  /**
   * Save the Preset to the chosen service
   */
  save() {
    // clone existing preset then update clone with latest settings
    const source = this.scope['preset'];
    const preset = this.clone(source);

    // get PresetService(s) that support uodate()
    this.getService(OsLayerPreset.PresetServiceAction.UPDATE).then(
        (service) => {
          service.update(preset).then(
              this.saveSuccess.bind(this),
              this.onServiceFailure.bind(this, 'Could not save Preset'));
        },
        (msg) => {
          GoogLog.error(LOGGER, '' + msg);
        }
    );
  }

  /**
   * Handle when the Preset is properly saved to the desired service
   * @param {osx.layer.Preset} preset
   */
  saveSuccess(preset) {
    if (!preset) {
      return; // canceled by user
    }
    this.saveSuccessConfirm();
  }

  /**
   * Reusable confirm
   */
  saveSuccessConfirm() {
    const prompt = '<p><strong>Success!</strong>&nbsp;&nbsp;Next, reload the application to reinitialize ' +
        ' Preset Feature Actions and Style settings.</p>';

    // As a future improvement, overwrite the result in the promise.all and flag the affeted FA's in
    // the ImportActionManager as 'Presets'

    // Refresh the application
    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      yesText: 'Reload',
      noText: 'Keep Working',
      confirm: (() => {
        location.reload();
      }),
      cancel: (() => {
        const cancelMessage = 'Remember - changes to the Preset are saved. You will see them when the ' +
            ' application is reloaded.';
        AlertManager.getInstance().sendAlert(cancelMessage, AlertEventSeverity.INFO);
      }),
      prompt,
      windowOptions: {
        'label': 'Saved',
        'icon': 'fa fa-floppy-o',
        'x': 'center',
        'y': 100,
        'width': 400,
        'height': 'auto',
        'modal': 'true',
        'show-close': 'true'
      }
    }));
  }

  /**
   * Handle when the presetservice or one of its dependencies fail
   *
   * @param {!string} message
   * @param {*} error
   */
  onServiceFailure(message, error) {
    this['thinking'] = false;
    OsUi.apply(this.scope); // outside the angular digest cycle; need to reapply scope

    const msg = [message];
    if (error) {
      msg.push(error['msg'] || error['message'] || error);
    }
    AlertManager.getInstance().sendAlert(msg.join(' : '));
  }

  /**
   *
   */
  toggleDefault() {
    const source = this.scope['preset'];
    const preset = Object.assign({}, source); // make a quick copy

    // get PresetService(s) that support setDefault()
    this.getService(OsLayerPreset.PresetServiceAction.SET_DEFAULT).then(
        (service) => {
          this['thinking'] = true;
          OsUi.apply(this.scope); // outside the angular digest cycle; need to reapply scope

          service
              .setDefault(preset, !preset.default)
              .then(this.toggleSuccess.bind(this), this.onServiceFailure.bind(this, 'Could not update Preset'));
        },
        (msg) => {
          GoogLog.error(LOGGER, '' + msg);
        }
    );
  }

  /**
   *
   */
  togglePublished() {
    const source = this.scope['preset'];
    const preset = Object.assign({}, source); // make a quick copy

    // get PresetService(s) that support setPublished()
    this.getService(OsLayerPreset.PresetServiceAction.SET_PUBLISHED).then(
        (service) => {
          this['thinking'] = true;
          OsUi.apply(this.scope); // outside the angular digest cycle; need to reapply scope

          service
              .setPublished(preset, !preset.published)
              .then(this.toggleSuccess.bind(this), this.onServiceFailure.bind(this, 'Could not update Preset'));
        },
        (msg) => {
          GoogLog.error(LOGGER, '' + msg);
        }
    );
  }

  /**
   * Handle when the Preset is properly saved to the desired service
   * @param {osx.layer.Preset} preset
   */
  toggleSuccess(preset) {
    this['thinking'] = false;
    OsUi.apply(this.scope); // callback from outside the angular digest cycle; need to reapply scope

    if (!preset) {
      return; // canceled by user
    }

    // update local copy of 'preset' to match the value returned by the service
    this.scope['preset'].published = preset.published;
    this.scope['preset'].default = preset.default;

    this.scope.$emit(EventType.TOGGLE_PRESET, preset);
  }

  /**
   *
   */
  visibility() {
    const preset = this.scope['preset'];

    if (preset) {
      const isBasic = (preset.id == DEFAULT_PRESET_ID);
      const publishTrue = this.menu.getRoot().find(EventType.TOGGLE_PUBLISHED_TRUE);
      const publishFalse = this.menu.getRoot().find(EventType.TOGGLE_PUBLISHED_FALSE);
      const defaultTrue = this.menu.getRoot().find(EventType.TOGGLE_DEFAULT_TRUE);
      const defaultFalse = this.menu.getRoot().find(EventType.TOGGLE_DEFAULT_FALSE);
      const remove = this.menu.getRoot().find(EventType.REMOVE);

      if (publishTrue) {
        publishTrue.visible = !preset.published;
        publishTrue.enabled = !isBasic;
      }
      if (publishFalse) {
        publishFalse.visible = preset.published;
        publishFalse.enabled = !isBasic;
      }
      if (defaultTrue) {
        defaultTrue.visible = !preset.default;
        defaultTrue.enabled = !isBasic && preset.published;
      }
      if (defaultFalse) {
        defaultFalse.visible = preset.default;
        defaultFalse.enabled = !isBasic;
      }
      if (remove) {
        remove.enabled = !isBasic;
      }
    }
  }
}

/**
 * The preset directive.
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'preset': '='
  },
  controller: Controller,
  controllerAs: 'ctrl',
  template: `
<div class="btn-group o-add-data-button" ng-right-click="ctrl.openMenu()">
  <button type="button" class="btn btn-primary col-auto"
      ng-click="ctrl.notifyApplyPreset()"
      title="Apply the layer style preset">
    <i class="fa fa-check"></i>
    Apply
  </button>
  <button class="btn btn-primary dropdown-toggle dropdown-toggle-split"
      ng-if="ctrl.isAdmin"
      ng-click="ctrl.openMenu()"
      ng-class="{active: menu}"
      ng-disabled="ctrl.thinking">
    <i class="fa fa-spin fa-spinner" ng-if="ctrl.thinking"></i>
  </button>
</div>
`
});


/**
 * Add the directive to the module.
 */
Module.directive('presetmenubutton', [directive]);


exports = {directive, Controller, EventType};

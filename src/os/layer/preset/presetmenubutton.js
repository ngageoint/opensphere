goog.module('os.layer.preset.PresetMenuButton');
goog.module.declareLegacyNamespace();

const LayerPresetManager = goog.require('os.layer.preset.LayerPresetManager');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
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

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');
const ILayer = goog.requireType('os.layer.ILayer');

const GoogLog = goog.require('goog.log');


/**
 * @const {string}
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

    const iam = ImportActionManager.getInstance();

    /**
     * Depth-first traversal of tree; returns ID's of active FeatureActions
     * @param {string|undefined} type
     * @param {Array<FilterActionEntry>=} entries
     * @return {!Array<string>}
     */
    const traverse = function(type, entries) {
      let ids = [];
      (entries || []).forEach((entry) => {
        if (entry.enabled && entry.type == type) {
          ids.push(entry.getId());
        }
        ids = ids.concat(traverse(type, entry.getChildren()));
      });
      return ids;
    };

    // get the currently active FeatureAction ID's as a list
    const ids = traverse(clone.layerId, iam.getActionEntries());

    /**
     * Get simplified list of active FeatureActions (no repeats via children)
     * @param {string|undefined} type
     * @param {FilterActionEntry=} entry
     * @return {!boolean}
     */
    const active = function(type, entry) {
      let isActive = false;

      if (entry && entry.enabled && entry.type == type) {
        isActive = true;
      } else if (entry) {
        const entries = entry.getChildren();
        const len = entries ? entries.length : 0;

        // use a for loop so it can be broken out of
        for (let i = 0; i < len; i++) {
          const e = entries[i];
          if (active(type, e)) {
            isActive = true;
            break;
          }
        }
      }
      return isActive;
    };

    // only return top-level feature actions, not specific sub-entries
    const entries = iam.getActionEntries().filter((entry) => {
      return active(clone.layerId, entry);
    });

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
   * @param {!OsLayerPreset.PresetServiceAction} action
   * @return {Promise<IPresetService>}
   */
  getService(action) {
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
    const preset = this.scope['preset'];

    console.log(`preset.remove(${preset.label})`);
  }

  /**
   * Save the Preset to the chosen service
   */
  save() {
    // clone existing preset then update clone with latest settings
    const source = this.scope['preset'];
    const preset = this.clone(source);

    // get PresetService(s) that support save()
    this.getService(OsLayerPreset.PresetServiceAction.UPDATE).then(
        (service) => {
          service.update(preset).then(this.saveSuccess.bind(this), this.saveFailure.bind(this));
        },
        (msg) => {
          GoogLog.error(LOGGER, 'No services found that support SAVE action');
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
        'show-close': 'true',
        'no-scroll': 'true'
      }
    }));
  }

  /**
   * Handle when the preset is NOT saved
   * @param {*} error
   */
  saveFailure(error) {
    const msg = ['Could not save preset.'];
    if (error) {
      msg.push('\n');
      msg.push(error['msg'] || error['message'] || error);
    }
    AlertManager.getInstance().sendAlert(msg.join(''));
  }

  /**
   *
   */
  toggleDefault() {
    const preset = this.scope['preset'];

    // get PresetService(s) that support setDefault()
    this.getService(OsLayerPreset.PresetServiceAction.SET_DEFAULT).then(
        (service) => {
          service
              .setDefault(preset, !preset.default)
              .then(this.saveSuccess.bind(this), this.saveFailure.bind(this));
        },
        (msg) => {
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
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
          service
              .setPublished(preset, !preset.published)
              .then(this.toggleSuccess.bind(this), this.toggleFailure.bind(this));
        },
        (msg) => {
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR);
        }
    );
  }

  /**
   * Handle when the Preset is properly saved to the desired service
   * @param {osx.layer.Preset} preset
   */
  toggleSuccess(preset) {
    if (!preset) {
      return; // canceled by user
    }

    this.scope['preset'].published = preset.published;
    this.scope['preset'].default = preset.default;

    this.scope.$emit(EventType.TOGGLE_PRESET);
  }

  /**
   * Handle when the preset is NOT saved
   * @param {*} error
   */
  toggleFailure(error) {
    const msg = ['Could not update preset.'];
    if (error) {
      msg.push('\n');
      msg.push(error['msg'] || error['message'] || error);
    }
    AlertManager.getInstance().sendAlert(msg.join(''));
  }

  /**
   *
   */
  visibility() {
    const preset = this.scope['preset'];

    if (preset) {
      const publishTrue = this.menu.getRoot().find(EventType.TOGGLE_PUBLISHED_TRUE);
      const publishFalse = this.menu.getRoot().find(EventType.TOGGLE_PUBLISHED_FALSE);
      const defaultTrue = this.menu.getRoot().find(EventType.TOGGLE_DEFAULT_TRUE);
      const defaultFalse = this.menu.getRoot().find(EventType.TOGGLE_DEFAULT_FALSE);

      if (publishTrue) publishTrue.visible = !preset.published;
      if (publishFalse) publishFalse.visible = preset.published;
      if (defaultTrue) defaultTrue.visible = !preset.default;
      if (defaultFalse) defaultFalse.visible = preset.default;

      // TODO remove these "disables" as the feature(s) are implemented
      const remove = this.menu.getRoot().find(EventType.REMOVE);
      if (remove) remove.enabled = false;
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
  <button type="button" class="btn btn-primary col-auto" ng-click="ctrl.notifyApplyPreset()"
    title="Apply the layer style preset">
    <i class="fa fa-check"></i>
    Apply
  </button>
  <button class="btn btn-primary dropdown-toggle dropdown-toggle-split" 
    ng-if="ctrl.isAdmin" 
    ng-click="ctrl.openMenu()"
    ng-class="{active: menu}">
  </button>
</div>
`
});


/**
 * Add the directive to the module.
 */
Module.directive('presetmenubutton', [directive]);


exports = {directive, Controller, EventType};

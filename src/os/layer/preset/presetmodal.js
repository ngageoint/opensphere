goog.module('os.layer.preset.PresetModalUI');

const LayerPresetManager = goog.require('os.layer.preset.LayerPresetManager');
const Module = goog.require('os.ui.Module');
const ImportActionManager = goog.require('os.im.action.ImportActionManager');
const AlertManager = goog.require('os.alert.AlertManager');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');

const FilterActionEntry = goog.requireType('os.im.action.FilterActionEntry');


/**
 * The controller for the preset directive; make use of the MenuButtonController
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {!osx.layer.Preset}
     */
    this['clean'] = $scope['params']['preset']; // requires, at a minimum, the "Basic" preset;

    /**
     * @type {!osx.layer.Preset}
     */
    this['dirty'] = Object.assign({}, this['clean']); // copy the clean preset so we can edit it locally

    /**
     * @type {!boolean}
     */
    this['thinking'] = false;

    this.init_();
  }

  /**
   * @private
   */
  init_() {
    // lock to "new" if copying the "Basic" preset
    if (this['clean'].id == '__default__') {
      this['dirty'].id = null;
    }

    // get the current layerConfig as a JSON string
    const json = JSON.stringify(this['clean'].layerConfig); // TODO get from layer

    this['dirty'].layerConfigJSON = json;
    delete this['dirty'].layerConfig;

    const iam = ImportActionManager.getInstance();

    // get the currently active FeatureAction ID's as a list
    const entries = /** @type {Array<FilterActionEntry>} */((iam.getActionEntries() || []).filter((entry) => {
      return (entry.enabled && entry.type == this['dirty'].layerId);
    }));

    if (entries && entries.length > 0) {
      const ids = entries.map((entry) => {
        return entry.getId();
      });
      this['dirty'].featureActions = ids;

      // export the currently active FeatureActions into an XML string
      const rootNode = os.xml.createElementNS(iam.xmlGroup, 'http://www.bit-sys.com/state/v4');
      const entryXmls = os.im.action.filter.exportEntries(entries, false);

      (entryXmls || []).forEach((entryXml) => {
        rootNode.appendChild(entryXml);
      });
      const xml = os.xml.serialize(rootNode);

      this['dirty'].featureActionsXML = xml;
    } else {
      delete this['dirty'].featureActions;
    }
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.params = null;
    this['dirty'] = null;
    this['clean'] = null;
  }

  /**
   *
   */
  cancelClick() {
    // TODO get the modal and close it
  }


  /**
   *
   */
  saveClick() {
    // TODO if "new", check that there's not already a Preset with this name
    this.save();
  }

  /**
   * Run the save through the implementing ipresetservice
   */
  save() {
    const lpm = LayerPresetManager.getInstance();
    const service = lpm.service();

    if (service != null) {
      this['thinking'] = true;

      if (this['dirty'].id) {
        service.update(this['dirty']).then(
            (result) => {
              this.saveResolve(result);
            });
      } else {
        service.insert(this['dirty']).then(
            (result) => {
              this.saveResolve(result);
            });
      }
    } else {
      // TODO alert
    }
  }

  /**
   * Handle return from service update/insert
   * @param {osx.layer.Preset} result
   */
  saveResolve(result) {
    this['thinking'] = false;

    if (!result) {
      AlertManager.getInstance().sendAlert(`Could not save Preset "${this['dirty'].label}"`, AlertEventSeverity.ERROR);
    } else {
      // TODO update the list
      // const lpm = LayerPresetManager.getInstance();
      // lpm.updatePreset(result);
    }
  }

  /**
   * Create a new Preset if there's no ID
   */
  toggleSaveNew() {
    if (!this['dirty'].id) {
      this['dirty'].id = this['clean'].id;
    } else {
      this['dirty'].id = null;
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
    'params': '='
  },
  controller: Controller,
  controllerAs: 'ctrl',
  templateUrl: os.ROOT + 'views/layer/preset/presetmodal.html'
});


/**
 * Add the directive to the module.
 */
Module.directive('presetmodal', [directive]);


exports = {directive, Controller};

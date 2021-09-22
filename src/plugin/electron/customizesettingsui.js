goog.declareModuleId('plugin.electron.CustomizeSettingsUI');

goog.require('os.ui.slick.SlickTreeUI');

import * as Dispatcher from '../../os/dispatcher.js';
import {ROOT} from '../../os/os.js';
import {apply} from '../../os/ui/ui.js';
import SettingsFileNode from './settingsfilenode.js';
import settingsImportManager from './settingsimportmanager.js';
import SettingsImportUI from './settingsimportui.js';


const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');

const AlertManager = goog.require('os.alert.AlertManager');
const {createFromFile} = goog.require('os.file');
const Module = goog.require('os.ui.Module');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const ImportProcess = goog.require('os.ui.im.ImportProcess');

const {EventType, isElectron} = goog.require('plugin.electron');


/**
 * The customizesettings directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'changed': '='
  },
  bindToController: true,
  templateUrl: ROOT + 'views/plugin/electron/customizesettings.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'customizesettings';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * The original settings file list when this module was loaded.
 * @type {!Array<!ElectronOS.SettingsFile>}
 */
const origFiles = isElectron() ? ElectronOS.getSettingsFiles() : [];


/**
 * Test if files have changed since the application was loaded.
 * @param {!Array<!ElectronOS.SettingsFile>} current The current files.
 * @return {boolean}
 */
const filesChanged = (current) => {
  return origFiles.length !== current.length ||
      origFiles.some((f, idx) => f.path !== current[idx].path || f.enabled !== current[idx].enabled);
};


/**
 * Controller for the customizesettings directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
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
     * Delay to debounce save attempts.
     * @type {!Delay}
     * @protected
     */
    this.saveDelay = new Delay(this.save, 100, this);

    /**
     * Tree nodes for the settings files.
     * @type {!Array<!SettingsFileNode>}
     */
    this['fileNodes'] = [];

    /**
     * Selected nodes in the tree.
     * @type {!Array<!SettingsFileNode>}
     */
    this['selected'] = [];

    this.scope.$on('slicktree.update', this.startSaveDelay.bind(this));

    Dispatcher.getInstance().listen(EventType.UPDATE_SETTINGS, this.updateNodes, false, this);
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    Dispatcher.getInstance().unlisten(EventType.UPDATE_SETTINGS, this.updateNodes, false, this);

    dispose(this.saveDelay);

    this.scope = null;
    this.element = null;
  }

  /**
   * Angular $onInit lifecycle hook.
   */
  $onInit() {
    this.updateNodes();
  }

  /**
   * Import a new settings file.
   * @export
   */
  import() {
    const importProcess = new ImportProcess(settingsImportManager);
    importProcess.setEvent(new ImportEvent(ImportEventType.FILE));
    importProcess.begin();
  }

  /**
   * Handle file drop event.
   * @param {DragEvent} event The event.
   * @export
   */
  onDrop(event) {
    if (event.dataTransfer && event.dataTransfer.files) {
      createFromFile(/** @type {!File} */ (event.dataTransfer.files[0])).addCallbacks((file) => {
        file.loadContent().addCallbacks(() => {
          const ui = new SettingsImportUI();
          ui.launchUI(file);
        }, this.onDropFailed, this);
      }, this.onDropFailed, this);
    }
  }

  /**
   * Handle file drop failed.
   * @protected
   */
  onDropFailed() {
    AlertManager.getInstance().sendAlert('Dropped file is not a valid settings file.');
  }

  /**
   * Save changes.
   * @return {!Promise} A promise that resolves when save is complete.
   * @protected
   */
  save() {
    const files = this['fileNodes'].map((node) => node.getFile());

    this['changed'] = filesChanged(files);
    apply(this.scope);

    return ElectronOS.setSettingsFiles(files);
  }

  /**
   * Save changes.
   * @export
   */
  restart() {
    ElectronOS.restart();
  }

  /**
   * Start the save delay.
   * @protected
   */
  startSaveDelay() {
    this.saveDelay.start();
  }

  /**
   * Update the tree nodes.
   * @protected
   */
  updateNodes() {
    this['fileNodes'].forEach((node) => {
      dispose(node);
    });

    const files = ElectronOS.getSettingsFiles();
    this['fileNodes'] = files.map((file) => new SettingsFileNode(file));

    this['fileNodes'].forEach((node) => {
      node.listen(GoogEventType.PROPERTYCHANGE, (event) => {
        if (event.getProperty() === 'state') {
          this.startSaveDelay();
        }
      });
    });

    this['changed'] = filesChanged(files);
    apply(this.scope);
  }
}

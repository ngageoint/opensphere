goog.declareModuleId('plugin.electron.CustomizeSettingsUI');

goog.require('os.ui.slick.slickTreeDirective');

import SettingsFileNode from './settingsfilenode';
import settingsImportManager from './settingsimportmanager';

const {equals: arrayEquals} = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');

const {ROOT} = goog.require('os');
const Dispatcher = goog.require('os.Dispatcher');
const osUi = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const ImportProcess = goog.require('os.ui.im.ImportProcess');

const {EventType} = goog.require('plugin.electron');


/**
 * The customizesettings directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
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
Module.directive('customizesettings', [directive]);


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
     * The original settings file list.
     * @type {!Array<string>}
     * @protected
     */
    this.origFiles = ElectronOS.getSettingsFiles();

    /**
     * Delay to debounce save attempts.
     * @type {!Delay}
     * @protected
     */
    this.saveDelay = new Delay(this.save, 100, this);

    /**
     * If changes have been made.
     * @type {boolean}
     */
    this['changed'] = false;

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
   * Save changes.
   * @return {!Promise} A promise that resolves when save is complete.
   * @protected
   */
  save() {
    const files = this['fileNodes'].map((node) => node.getFilePath());

    this['changed'] = !arrayEquals(this.origFiles, files);
    osUi.apply(this.scope);

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

    this['fileNodes'] = ElectronOS.getSettingsFiles().map((file) => new SettingsFileNode(file));

    this['fileNodes'].forEach((node) => {
      node.listen(GoogEventType.PROPERTYCHANGE, (event) => {
        if (event.getProperty() === 'state') {
          this.startSaveDelay();
        }
      });
    });

    this.saveDelay.start();
  }
}

goog.declareModuleId('plugin.vectortools.MergeUI');

import '../../os/ui/util/validationmessage.js';
import './mappingcounter.js';
import {remove} from 'ol/src/array.js';
import CommandProcessor from '../../os/command/commandprocessor.js';
import DataManager from '../../os/data/datamanager.js';
import SourceManager from '../../os/data/sourcemanager.js';
import * as ogc from '../../os/ogc/ogc.js';

import * as os from '../../os/os.js';
import PropertyChange from '../../os/source/propertychange.js';
import Module from '../../os/ui/module.js';
import * as ui from '../../os/ui/ui.js';
import * as osWindow from '../../os/ui/window.js';
import WindowEventType from '../../os/ui/windoweventtype.js';
import MergeLayer from './mergelayercmd.js';



/**
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: os.ROOT + 'views/plugin/vectortools/merge.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'merge';


// add the directive to the module
Module.directive(directiveTag, [directive]);



/**
 * @unrestricted
 */
export class Controller extends SourceManager {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    /**
     * @type {!Array<string>}
     * @private
     */
    this.sourceIds_ = $scope['sourceIds'];

    /**
     * @type {string}
     */
    this['name'] = 'New Layer';

    /**
     * @type {string}
     */
    this['featureCountText'] = '';

    this.init();

    $scope.$on('$destroy', this.disposeInternal.bind(this));
    $scope.$emit(WindowEventType.READY);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();
    /** @type {angular.$timeout} */ (ui.injector.get('$timeout'))(this.onUpdateDelay.bind(this));
  }

  /**
   * @inheritDoc
   */
  removeSource(source) {
    super.removeSource(source);

    remove(this.sourceIds_, source.getId());
    this.onUpdateDelay();
  }

  /**
   * @inheritDoc
   */
  onSourcePropertyChange(event) {
    var p;
    try {
      p = event.getProperty();
    } catch (e) {
      return;
    }

    if (p === PropertyChange.FEATURES) {
      this.onUpdateDelay();
    }
  }

  /**
   * @inheritDoc
   */
  onUpdateDelay() {
    this.scope_['mergeForm'].$setValidity('featureCount', true);
    this['count'] = 0;

    for (var i = 0, ii = this.sourceIds_.length; i < ii; i++) {
      var source = DataManager.getInstance().getSource(this.sourceIds_[i]);
      if (source) {
        this['count'] += source.getFeatures().length;
      }
    }

    if (this['count'] === 0) {
      this.scope_['mergeForm'].$setValidity('featureCount', false);
      this['popoverText'] = 'Nothing to merge.';
      this['popoverTitle'] = 'No Features';
      this['featureCountText'] = 'Nothing to merge.';
    } else if (2 * this['count'] > ogc.getMaxFeatures()) {
      this.scope_['mergeForm'].$setValidity('featureCount', false);
      this['popoverText'] = 'Too many features!';
      this['popoverTitle'] = 'Too Many Features';
      this['featureCountText'] = 'This merge would result in too many features for {APP} to handle. Reduce the ' +
          'number of features you are merging and try again.';
    }

    ui.apply(this.scope_);
  }

  /**
   * Close dialog
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }

  /**
   * Adds the command to perform the merge.
   *
   * @export
   */
  accept() {
    var merge = new MergeLayer(this.sourceIds_, this['name']);
    CommandProcessor.getInstance().addCommand(merge);
    this.close();
  }
}

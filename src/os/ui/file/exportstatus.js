goog.declareModuleId('os.ui.file.ExportStatusUI');

import OSEventType from '../../events/eventtype.js';
import ThreadEventType from '../../thread/eventtype.js';
import Module from '../module.js';
import {apply} from '../ui.js';

import {close, create} from '../window.js';
import WindowEventType from '../windoweventtype.js';
const GoogEvent = goog.requireType('goog.events.Event');
const {default: IExportMethod} = goog.requireType('os.ex.IExportMethod');


const {default: ThreadProgressEvent} = goog.requireType('os.thread.ThreadProgressEvent');


/**
 * The exportstatus directive.
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'exporter': '='
  },
  template: `<div class="modal-body d-flex flex-column flex-fill">
  Exporting {{ctrl.total}} Feature{{ctrl.total == 1 ? '' : 's'}}...
  <div class="progress">
    <div class="progress-bar progress-bar-striped progress-bar-animated text-dark" role="progressbar"
    aria-valuenow="{{ctrl.completed}}" aria-valuemin="0" aria-valuemax="100"
    ng-style="{'width': ctrl.completed + '%'}">{{ctrl.completed.toFixed(0)}}%</div>
  </div></div>`,
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'exportstatus';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for the exportstatus directive.
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
     * The Angular Scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The Angular element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * The exporter.
     * @type {IExportMethod}
     * @protected
     */
    this.exporter = /** @type {IExportMethod} */ ($scope['exporter']);

    const items = this.exporter.getItems();
    /**
     * The total feature count.
     * @type {number}
     * @protected
     */
    this['total'] = items ? items.length : 0;

    /**
     * The completed feature count.
     * @type {number}
     * @protected
     */
    this['completed'] = 0;

    // Listen for events in the capture phase. The exporter is disposed in the complete/error event handler in
    // ExportManager, which is registered before these and will remove all listeners.
    this.exporter.listen(ThreadEventType.PROGRESS, this.onProgress, true, this);
    this.exporter.listen(OSEventType.COMPLETE, this.onComplete, true, this);
    this.exporter.listen(OSEventType.ERROR, this.onError, true, this);

    $scope.$emit(WindowEventType.READY);
  }

  /**
   * Angular $onDestroy lifecycle call.
   */
  $onDestroy() {
    this.exporter.unlisten(ThreadEventType.PROGRESS, this.onProgress, true, this);
    this.exporter.unlisten(OSEventType.COMPLETE, this.onComplete, true, this);
    this.exporter.unlisten(OSEventType.ERROR, this.onError, true, this);
  }

  /**
   * Handler for progress events. Updates the progress bar.
   * @param {ThreadProgressEvent} event
   * @export
   */
  onProgress(event) {
    const loaded = event.getLoaded();
    const total = event.getTotal();
    this['completed'] = 100 * loaded / total;
    apply(this.scope);
  }

  /**
   * Handler for complete events. Closes the window.
   * @param {GoogEvent} event
   * @export
   */
  onComplete(event) {
    close(this.element);
  }

  /**
   * Handler for error events. Closes the window.
   * @param {GoogEvent} event
   * @export
   */
  onError(event) {
    close(this.element);
  }
}


/**
 * Window ID.
 * @type {string}
 */
const WINDOW_ID = 'exportProgress';


/**
 * Launches the export progress window for a given exporter.
 * @param {IExportMethod} exporter
 */
export const launch = (exporter) => {
  const scopeOptions = {
    'exporter': exporter
  };

  const windowOptions = {
    'label': `${exporter.getLabel()} Export Progress`,
    'id': WINDOW_ID,
    'key': WINDOW_ID, // makes this a saved window, will remember position
    'icon': 'fas fa-download',
    'x': -50,
    'y': 'center',
    'width': 300,
    'height': 'auto',
    'show-close': true
  };

  const template = `<${directiveTag} exporter="exporter"></${directiveTag}>`;
  create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

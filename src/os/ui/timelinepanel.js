goog.declareModuleId('os.ui.TimelinePanelUI');

import TimelineHistManager from '../data/histo/timelinehistmanager.js';
import * as dispatcher from '../dispatcher.js';
import LayerEventType from '../events/layereventtype.js';
import IAnimationSupport from '../ianimationsupport.js';
import osImplements from '../implements.js';
import MapEvent from '../map/mapevent.js';
import MapContainer from '../mapcontainer.js';
import Metrics from '../metrics/metrics.js';
import * as keys from '../metrics/metricskeys.js';
import {ROOT} from '../os.js';
import TimelineController from '../time/timelinecontroller.js';
import TimelineEventType from '../time/timelineeventtype.js';
import {directiveTag as animationSettingsUi} from './animationsettings.js';
import HistogramEventType from './hist/histogrameventtype.js';
import * as timelineMenu from './menu/timelinemenu.js';
import Module from './module.js';
import AbstractTimelineCtrl from './timeline/abstracttimelinectrl.js';
import {directiveTag as timeSettingsUi} from './timelinesettings.js';
import * as ui from './ui.js';
import * as osWindow from './window.js';

const {default: LayerEvent} = goog.requireType('os.events.LayerEvent');


/**
 * The timeline-panel directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/timelinepanel.html',
  controller: Controller,
  controllerAs: 'timelineCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'timeline-panel';


/**
 * Register the timeline-panel directive.
 */
Module.directive('timelinePanel', [directive]);


/**
 * Controller function for the timeline-panel directive.
 * @unrestricted
 */
export class Controller extends AbstractTimelineCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    try {
      var $animate = /** @type {angular.$animate} */ (ui.injector.get('$animate'));
      $animate.enabled($element, false);
    } catch (e) {
      // animate service not available, we don't really care
    }

    /**
     * @type {boolean}
     */
    this['locked'] = TimelineController.getInstance().getLock();

    this.tlc.listen(TimelineEventType.LOCK_TOGGLE, this.setLock, false, this);

    /**
     * @type {?TimelineHistManager}
     */
    this.histManager = TimelineHistManager.getInstance();
    this.histManager.listen(HistogramEventType.CHANGE, this.onHistogramChange, false, this);


    if (timelineMenu.MENU) {
      this.selectBrush.setMenu(timelineMenu.MENU);
    }
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this.histManager.unlisten(HistogramEventType.CHANGE, this.onHistogramChange, false, this);
    this.tlc.unlisten(TimelineEventType.LOCK_TOGGLE, this.setLock, false, this);
    this.histManager = null;
    super.destroy();
  }

  /**
   * Toggle new layers into the animation state.
   *
   * @param {LayerEvent} event
   * @private
   */
  onLayerAdded_(event) {
    // The layer should only be a string ID on the remove event.
    if (typeof event.layer !== 'string') {
      this.setLayerAnimationState_(event.layer, true);
    }
  }

  /**
   * @inheritDoc
   */
  assumeControl() {
    try {
      // remove control from the date control
      angular.element('.js-date-control').scope()['dateControl'].releaseControl();
    } catch (e) {
    }

    // flip all layers to use the animation overlay
    this.setAllLayerAnimationState_(true);
    MapContainer.getInstance().listen(LayerEventType.ADD, this.onLayerAdded_, false, this);

    super.assumeControl();

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * @inheritDoc
   */
  releaseControl() {
    super.releaseControl();

    // flip all layers back to normal feature rendering
    MapContainer.getInstance().unlisten(LayerEventType.ADD, this.onLayerAdded_, false, this);
    this.setAllLayerAnimationState_(false);

    // return control back to the date control
    angular.element('.js-date-control').scope()['dateControl'].assumeControl();
    angular.element('.js-date-panel').scope()['ctrl'].applySliceIfActive();

    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * Toggles all layers/sources implementing the `IAnimationSupport` interface into the specified animation state.
   * @param {boolean} value The animation state.
   * @private
   */
  setAllLayerAnimationState_(value) {
    var layers = MapContainer.getInstance().getLayers();
    for (var i = 0, n = layers.length; i < n; i++) {
      this.setLayerAnimationState_(layers[i], value);
    }
  }

  /**
   * Toggle the animation state on a layer or its source if either supports the `IAnimationSupport` interface.
   * @param {OLLayer} layer The layer.
   * @param {boolean} value The animation state.
   * @private
   */
  setLayerAnimationState_(layer, value) {
    if (layer) {
      if (osImplements(layer, IAnimationSupport.ID)) {
        /** @type {IAnimationSupport} */ (layer).setAnimationEnabled(value);
      } else {
        const source = layer.getSource();
        if (osImplements(source, IAnimationSupport.ID)) {
          /** @type {IAnimationSupport} */ (source).setAnimationEnabled(value);
        }
      }
    }
  }

  /**
   * @return {string}
   * @protected
   */
  getSettingsTemplate() {
    return `<${timeSettingsUi}></${timeSettingsUi}>`;
  }

  /**
   * Launches the timeline settings dialog
   *
   * @export
   */
  settings() {
    var scopeOptions = {
      'timeline': angular.element('.c-svg-timeline').scope()['timeline']
    };
    var windowOptions = {
      'label': 'Timeline Settings',
      'icon': 'fa fa-clock-o',
      'x': 'center',
      'y': 'center',
      'width': '525',
      'height': 'auto',
      'modal': 'true',
      'show-close': 'true'
    };

    osWindow.create(windowOptions, this.getSettingsTemplate(), undefined, undefined, undefined, scopeOptions);
  }

  /**
   * @return {string}
   * @protected
   */
  getAnimationSettingsTemplate() {
    return `<${animationSettingsUi}></${animationSettingsUi}>`;
  }

  /**
   * Launches the animation settings dialog
   *
   * @export
   */
  animationSettings() {
    var scopeOptions = {
      'timeline': angular.element('.c-svg-timeline').scope()['timeline']
    };
    var windowOptions = {
      'label': 'Animation Settings',
      'icon': 'fa fa-sliders',
      'x': 'center',
      'y': 'center',
      'width': '450',
      'max-width': '600',
      'min-width': '450',
      'height': 'auto',
      'modal': 'true'
    };

    osWindow.create(windowOptions, this.getAnimationSettingsTemplate(), undefined, undefined, undefined, scopeOptions);
  }

  /**
   * @inheritDoc
   */
  adjust() {
    super.adjust();

    MapContainer.getInstance().updateSize();
    dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
  }

  /**
   * Panel lock button click.
   *
   * @export
   */
  lock() {
    var isLocked = this.tlc.getLock();
    this.tlc.toggleLock();
    this['locked'] = this.tlc.getLock();
    if (isLocked) {
      angular.element('.js-svg-timeline_unlock').addClass('d-none');
      angular.element('.js-svg-timeline_lock').removeClass('d-none');
    } else {
      angular.element('.js-svg-timeline_lock').addClass('d-none');
      angular.element('.js-svg-timeline_unlock').removeClass('d-none');
    }
    Metrics.getInstance().updateMetric(keys.Timeline.LOCK, 1);
  }

  /**
   * Set lock
   */
  setLock() {
    this['locked'] = this.tlc.getLock();
    ui.apply(this.scope);
  }
}

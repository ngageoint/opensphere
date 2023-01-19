goog.declareModuleId('os.ui.feature.FeatureInfoUI');

import EventType from 'ol/src/events/EventType.js';
import {listen, unlistenByKey} from 'ol/src/events.js';
import Feature from 'ol/src/Feature.js';
import Point from 'ol/src/geom/Point.js';
import {toLonLat} from 'ol/src/proj.js';

import '../location/simplelocation.js';
import '../uiswitch.js';
import './simplepropertiesui.js';
import FeatureEventType from '../../data/featureeventtype.js';
import * as dispatcher from '../../dispatcher.js';
import * as osFeature from '../../feature/feature.js';
import {filterFalsey} from '../../fn/fn.js';
import * as layer from '../../layer/layer.js';
import * as osMap from '../../map/map.js';
import Units from '../../math/units.js';
import {ROOT} from '../../os.js';
import UnitManager from '../../unit/unitmanager.js';
import Module from '../module.js';
import {apply} from '../ui.js';
import FeatureInfoEvent from './featureinfoevent.js';
import FeatureInfoTabManager from './featureinfotabmanager.js';

const Disposable = goog.require('goog.Disposable');
const GoogEventType = goog.require('goog.events.EventType');

const {default: FeatureEvent} = goog.requireType('os.data.FeatureEvent');
const {default: FeatureTab} = goog.requireType('os.ui.tab.FeatureTab');


/**
 * The featureinfo directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/feature/featureinfo.html',
  controller: Controller,
  controllerAs: 'info'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featureinfo';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the featureinfo directive
 * @unrestricted
 */
export class Controller extends Disposable {
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
     */
    this.scope = $scope;

    /**
     * Array of tabs to show.
     * @type {Array<FeatureTab>}
     */
    this['tabs'] = FeatureInfoTabManager.getInstance().getTabs();

    /**
     * Number of tabs that are currently shown
     * @type {number}
     */
    this['numTabsShown'] = 1;

    /**
     * @type {function(FeatureTab):string}
     */
    this['getUi'] = this.getUi_.bind(this);

    /**
     * The displayed title for the active feature.
     * @type {string}
     */
    this['title'] = '';

    /**
     * @type {?angular.JQLite}
     */
    this.element = $element;

    /**
     * Feature change key.
     * @type {?ol.EventsKey}
     * @private
     */
    this.changeKey_ = null;

    this.setInitialActiveTab_();

    UnitManager.getInstance().listen(GoogEventType.PROPERTYCHANGE, this.updateGeometry, false, this);
    dispatcher.getInstance().listen(FeatureEventType.VALUECHANGE, this.onValueChange, false, this);
    $scope.$watch('items', this.onFeatureChange.bind(this));
    $scope.$on(FeatureInfoEvent.SHOW_DESCRIPTION, this.showDescription.bind(this));
    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.changeKey_) {
      unlistenByKey(this.changeKey_);
      this.changeKey_ = null;
    }

    UnitManager.getInstance().unlisten(GoogEventType.PROPERTYCHANGE, this.updateGeometry, false, this);
    dispatcher.getInstance().unlisten(FeatureEventType.VALUECHANGE, this.onValueChange, false, this);
    this.element = null;
    this.scope = null;
  }

  /**
   * Handle value change events by updating the table.
   *
   * @param {FeatureEvent} event
   * @suppress {checkTypes} To allow access to feature['id'].
   */
  onValueChange(event) {
    if (event && this.scope) {
      var feature = /** @type {Feature|undefined} */ (this.scope['items'][0]);
      if (feature && feature['id'] === event['id']) {
        this.updateGeometry();
        this.updateTabs_();

        apply(this.scope);
      }
    }
  }

  /**
   * Handle change events fired by the feature.
   *
   * @param {events.Event} event
   */
  onFeatureChangeEvent(event) {
    this.updateGeometry();
    this.updateTabs_();

    apply(this.scope);
  }

  /**
   * Handle feature changes on the scope.
   *
   * @param {Array<Feature>} newVal The new value
   *
   * @todo Should polygons display the center point? See {@link ol.geom.Polygon#getInteriorPoint}. What about line
   *       strings? We can get the center of the extent, but that's not very helpful. For now, only display the location
   *       for point geometries.
   */
  onFeatureChange(newVal) {
    if (this.isDisposed()) {
      return;
    }

    if (this.changeKey_) {
      unlistenByKey(this.changeKey_);
      this.changeKey_ = null;
    }

    this.updateGeometry();
    this.updateTabs_();
    this.updateTitle_();

    if (newVal) {
      var feature = newVal[0];
      if (feature && feature instanceof Feature) {
        // listen for change events fired by the feature so the window can be updated
        this.changeKey_ = listen(feature, EventType.CHANGE, this.onFeatureChangeEvent, this);
      }
    }

    apply(this.scope);
  }

  /**
   * Update the geometry information displayed for the feature.
   *
   * @protected
   */
  updateGeometry() {
    if (this.scope) {
      this.scope['lon'] = undefined;
      this.scope['lat'] = undefined;
      this.scope['alt'] = undefined;

      var feature = /** @type {Feature|undefined} */ (this.scope['items'][0]);
      if (feature) {
        var geom = feature.getGeometry();
        if (geom instanceof Point) {
          var coord = geom.getFirstCoordinate();
          coord = toLonLat(coord, osMap.PROJECTION);

          if (coord && coord.length > 1) {
            this.scope['lon'] = coord[0];
            this.scope['lat'] = coord[1];

            if (coord.length > 2) {
              var um = UnitManager.getInstance();
              this.scope['alt'] = um.formatToBestFit('distance', coord[2], Units.METERS, um.getBaseSystem(), 2);
            }
          }
        }
      }
    }
  }

  /**
   * Update the title for the active feature.
   *
   * @private
   */
  updateTitle_() {
    var parts = [];

    var feature = /** @type {Feature} */ (this.scope['items'][0]);
    if (feature) {
      var sourceId = /** @type {string|undefined} */ (feature.get('sourceId'));
      if (sourceId) {
        parts.push(layer.getTitle(sourceId, false) || undefined);
      }

      parts.push(osFeature.getTitle(feature) || undefined);
    }

    this['title'] = parts.filter(filterFalsey).join(': ');
  }

  /**
   * Save active tab
   *
   * @param {FeatureTab} tab
   * @export
   */
  setActiveTab(tab) {
    this.scope['activeTab'] = tab;
  }

  /**
   * Sets the intial active tab.  Defaults to properties tab.
   *
   * @private
   */
  setInitialActiveTab_() {
    if (this['tabs'].length > 0) {
      this.setActiveTab(this['tabs'][0]);
    }
  }

  /**
   * Gets the UI for the currently active tab.
   *
   * @param {FeatureTab} item
   * @return {string}
   * @private
   */
  getUi_(item) {
    item['data'] = /** @type {Feature|RenderFeature|undefined} */ (this.scope['items'][0]);
    return item['template'];
  }

  /**
   * Update the visibility of the tabs and broadcast update event
   *
   * @private
   */
  updateTabs_() {
    var numShown = 0;
    var loadedFeature = this.scope['items'][0];

    for (var i = 0; i < this['tabs'].length; i++) {
      if (this['tabs'][i].checkIfEnabled(loadedFeature)) {
        numShown++;
      }
    }
    this['numTabsShown'] = numShown;

    // If an event happened that hides the active tag reset the active tab
    if (this.scope['activeTab']['isShown'] === false) {
      this.setInitialActiveTab_();
    }

    this.scope.$broadcast(FeatureInfoEvent.UPDATE_TABS, loadedFeature);
  }

  /**
   * Switches to the description tab.
   *
   * @param {angular.Scope.Event} event
   */
  showDescription(event) {
    var descTabIndex = this['tabs'].findIndex(function(t) {
      return t.id == 'desc';
    });

    if (descTabIndex > -1) {
      this.setActiveTab(this['tabs'][descTabIndex]);
    }
  }
}

goog.declareModuleId('plugin.vectortools.JoinUI');

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
import JoinLayer from './joinlayercmd.js';

const googString = goog.require('goog.string');


/**
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: os.ROOT + 'views/plugin/vectortools/join.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'join';


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
    this['name'] = 'Joined Layer';

    /**
     * @type {string}
     */
    this['joinMethod'] = 'unique';

    /**
     * @type {string}
     */
    this['chooseLayerHelp'] = 'Joining layers compares values in the chosen columns for each layer against the ' +
        'Primary Layer and combines features whose values match. If the values match, the feature from the other ' +
        'layer will be merged into the matching features in the Primary Layer.';

    /**
     * @type {string}
     */
    this['joinMethodHelp'] = 'The Join Method determines how we compare values between columns.' +
        '<ul><li> Exact Match: Joins two features when the value is exactly the same on both.</li>' +
        '<li> Contains: Joins two features when one value contains the other.</li>' +
        '<li> Match (Case-Insensitive): Same as "Exact Match" but case-insensitive</li>' +
        '<li> Contains (Case-Insensitive): Same as "Contains" but case-insensitive</li>';

    /**
     * @type {Array<Object>}
     */
    this['joinSources'] = this.sourceIds_
        .map(Controller.mapSources)
        .sort(Controller.sortSources_);

    /**
     * @type {?string}
     */
    this['primarySource'] = this['joinSources'][0]['id'];

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
    if (!this.scope_) {
      return;
    }

    this.scope_['joinForm'].$setValidity('featureCount', true);
    this['count'] = 0;

    for (var i = 0, ii = this.sourceIds_.length; i < ii; i++) {
      var source = DataManager.getInstance().getSource(this.sourceIds_[i]);
      if (source) {
        this['count'] += source.getFeatures().length;
      }
    }

    if (this['count'] === 0) {
      this.scope_['joinForm'].$setValidity('featureCount', false);
      this['popoverText'] = 'Nothing to join.';
      this['popoverTitle'] = 'No Features';
      this['featureCountText'] = 'Nothing to join.';
    } else if (2 * this['count'] > ogc.getMaxFeatures()) {
      this.scope_['joinForm'].$setValidity('featureCount', false);
      this['popoverText'] = 'Too many features!';
      this['popoverTitle'] = 'Too Many Features';
      this['featureCountText'] = 'This join would result in too many features for {APP} to handle. Reduce the number ' +
          'of features you are joining and try again.';
    }

    ui.apply(this.scope_);
  }

  /**
   * Close the window.
   *
   * @export
   */
  close() {
    osWindow.close(this.element_);
  }

  /**
   * Builds and executes the command to perform the join then closes the window.
   *
   * @export
   */
  accept() {
    var sources = this['joinSources'].map(function(item) {
      return item['id'];
    });

    var columns = this['joinSources'].map(function(item) {
      return item['joinColumn']['field'];
    });

    // put the primary source at index 0
    var primary = /** @type {string} */ (this['primarySource']);
    var i = sources.indexOf(primary);

    var tmp = sources.splice(i, 1);
    sources = tmp.concat(sources);

    tmp = columns.splice(i, 1);
    columns = tmp.concat(columns);

    var cmd = new JoinLayer(
        /** @type {!Array<string>} */ (sources),
        /** @type {!Array<string>} */ (columns),
        this['joinMethod'],
        this['name']);

    CommandProcessor.getInstance().addCommand(cmd);
    this.close();
  }

  /**
   * @param {string} id
   * @return {Object}
   * @protected
   */
  static mapSources(id) {
    var source = DataManager.getInstance().getSource(id);

    return {
      'id': source.getId(),
      'title': source.getTitle(),
      'cols': source.getColumns().sort(Controller.sortByName_)
    };
  }

  /**
   * @param {ColumnDefinition} a
   * @param {ColumnDefinition} b
   * @return {number}
   * @private
   */
  static sortByName_(a, b) {
    return googString.numerateCompare(a['name'], b['name']);
  }

  /**
   * @param {Object} a
   * @param {Object} b
   * @return {number}
   * @private
   */
  static sortSources_(a, b) {
    return googString.numerateCompare(a['title'], b['title']);
  }
}

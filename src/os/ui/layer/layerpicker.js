goog.declareModuleId('os.ui.layer.LayerPickerUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import {escapeHtml} from '../ui.js';

const {caseInsensitiveContains} = goog.require('goog.string');
const {toHexString} = goog.require('os.color');
const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const DataManager = goog.require('os.data.DataManager');
const IFilterable = goog.require('os.filter.IFilterable');
const osImplements = goog.require('os.implements');
const VectorLayer = goog.require('os.layer.Vector');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');


/**
 * Select2 to pick from all avaliable layers.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'layer': '=?',
    'layers': '=?',
    'isRequired': '=?',
    'layersFilter': '&?',
    'maxNumLayers': '@?',
    'formatter': '=?',
    'matcher': '=?',
    'groupFn': '=?',
    'placeholderText': '@?',
    'emitName': '@?'
  },
  templateUrl: ROOT + 'views/layer/layerpicker.html',
  controller: Controller,
  controllerAs: 'pickerCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'layerpicker';

/**
 * Ass the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the layer picker
 * The selected layer will be saved in 'layer'. If multiple is allowed it will be stored in 'layers' as an array.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?angular.$timeout}
     * @private
     */
    this.timeout_ = $timeout;

    /**
     * Maximum selection size allowed.
     * @type {number}
     * @private
     */
    this.maxNumLayers_ = this.scope_['maxNumLayers'] ? this.scope_['maxNumLayers'] : 1;

    /**
     * Function that gets the desired descriptors in an array format for the select2.
     * If not in the scope it defaults to returning all descriptors.
     * @type {function(): !Array<(!IDataDescriptor|!IFilterable)>}
     */
    this.getLayersFunction = this.scope_['layersFilter'] ? this.scope_['layersFilter'] : this.getLayersList;

    /**
     * @type {string}
     * @private
     */
    this.placeholderText_ = this.scope_['placeholderText'] || ('Select Layer' + (this.multiple() ? 's' : '') + '...');

    /**
     * @type {string}
     * @private
     */
    this.emitName_ = this.scope_['emitName'] != null ? this.scope_['emitName'] : 'layerpicker';

    /**
     * @type {!Object<string, (IDataDescriptor|IFilterable)>}
     * @private
     */
    this.layerIndex_ = {};

    /**
     * Optional override grouping function for the select.
     * @type {function((IDataDescriptor|IFilterable)):?string}
     * @private
     */
    this.groupFn_ = $scope['groupFn'];

    /**
     * Array of available layers
     * @type {!Array<!IDataDescriptor>}
     */
    this['layersList'] = [];
    this.updateLayers();

    var formatter = /** @type {Function} */ ($scope['formatter'] || this.select2Formatter_).bind(this);
    var matcher = /** @type {Function} */ ($scope['matcher'] || this.matcher_).bind(this);

    if ($scope['isRequired'] == null) {
      // default the picker to required
      $scope['isRequired'] = true;
    }

    $timeout(function() {
      this.select2_ = $element.find('.js-layer-picker');
      this.select2_.select2({
        'placeholder': this.placeholderText_,
        'maximumSelectionSize': this.maxNumLayers_,
        'matcher': matcher,
        'formatSelection': formatter,
        'formatResult': formatter
      });

      this.multiple() ? this.initLayers_() : this.initLayer_();
    }.bind(this));

    this.scope_.$watch('layer', this.initLayer_.bind(this));
    this.scope_.$watch('layers', this.initLayers_.bind(this));

    this.scope_.$on('updateLayers', this.updateLayers.bind(this));
    this.scope_.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.select2_ = null;
  }

  /**
   * Updates the layers list.
   */
  updateLayers() {
    this['layersList'] = this.getLayersFunction();
    this.layerIndex_ = {};

    this['layersList'].forEach(function(l) {
      this.layerIndex_[l.getId()] = l;
    }, this);
  }

  /**
   * Select the layers based off the model
   *
   * @private
   */
  initLayers_() {
    if (this.select2_) {
      var vals = [];
      if (this.scope_['layers']) {
        this.scope_['layers'].forEach(function(layer) {
          var found = this['layersList'].find(function(l) {
            return l.getId() == layer.getId();
          });

          if (found) {
            vals.push(found['$$hashKey']);
          }
        }, this);
      }

      this.select2_.select2('val', vals);
    }
  }

  /**
   * Select the layers based off the model
   *
   * @private
   */
  initLayer_() {
    if (this.select2_) {
      var val = null;
      if (this.scope_['layer']) {
        var found = this['layersList'].find(function(l) {
          return l.getId() == this.scope_['layer'].getId();
        }.bind(this));

        if (found) {
          val = found['$$hashKey'];
        }
      }

      this.select2_.select2('val', val);
    }
  }

  /**
   * @param {IDataDescriptor} layer
   * @export
   */
  layerPicked(layer) {
    this.scope_['layer'] = layer;
    this.scope_.$emit(this.emitName_ + '.layerselected', layer);
  }

  /**
   * @param {!Array<!IDataDescriptor>} layers
   * @export
   */
  layersChanged(layers) {
    this.scope_['layers'] = layers;
    this.timeout_(function() { // give the scope a chance to update
      this.scope_.$emit(this.emitName_ + '.layerschanged', layers);
    }.bind(this));
  }

  /**
   * Returns if this allows multiple selection.
   *
   * @return {boolean}
   * @export
   */
  multiple() {
    return this.maxNumLayers_ != 1;
  }

  /**
   * Get all the layers
   *
   * @return {!Array<!IDataDescriptor>}
   */
  getLayersList() {
    return DataManager.getInstance().getDescriptors();
  }

  /**
   * Returns the group name for the layer.
   *
   * @param {IDataDescriptor|IFilterable} layer The layer to group.
   * @return {?string}
   * @export
   */
  getGroup(layer) {
    if (this.groupFn_) {
      // if we have a group fn passed in, use it
      return this.groupFn_(layer);
    }

    return Controller.layerGroupFn(layer);
  }

  /**
   * Returns the ID for the layer.
   *
   * @param {IDataDescriptor|IFilterable} layer The layer.
   * @return {?string}
   * @export
   */
  getLayerId(layer) {
    return layer ? layer.getId() : null;
  }

  /**
   * Search result formatter. The select is actually storing the ID of each
   * descriptor. This function allows us to display the actual layer title.
   *
   * @param {Object} item
   * @param {angular.JQLite} ele
   * @return {string|angular.JQLite}
   * @private
   */
  select2Formatter_(item, ele) {
    if (item['children']) {
      // it's an optgroup, so just return the label
      var text = item['text'];
      if (text === '') {
        // an empty optgroup should be hidden, or they look ugly
        ele.hide();
      }

      return text;
    }

    var val = '';

    if (ele) {
      var id = /** @type {string} */ (item['text']);
      var layer = this.layerIndex_[id];
      var title;
      var color;
      var description;
      var provider;
      var explicitType;

      if (layer instanceof BaseDescriptor) {
        var des = /** @type {BaseDescriptor} */ (layer);
        title = layer.getTitle();
        color = des.getColor() ? toHexString(des.getColor()) : 'white';
        description = escapeHtml(des.getDescription() || 'No Description');
        provider = des.getProvider() ? ' (' + des.getProvider() + ')' : '';

        explicitType = des.getExplicitTitle() ? ' ' + des.getExplicitTitle() : '';
        if (explicitType == ' Tiles and Features') {
          // the fact that a descriptor is for both tiles and features is irrelevant here, simplify if down
          explicitType = ' Features';
        }
      } else if (layer instanceof VectorLayer) {
        title = layer.getTitle();
        color = /** @type {string} */ (layer.getLayerOptions()['color']);
        color = color ? toHexString(color) : 'white';
        description = 'No Description';
        provider = layer.getProvider() ? ' (' + layer.getProvider() + ')' : '';
        explicitType = layer.getExplicitType() ? ' ' + layer.getExplicitType() : '';
      }

      val = '<span title="' + description + '"><i class="fa fa-bars mr-1" style="color:' + color +
            ';"></i>' + title + explicitType + provider + '</span>';
    }

    return val || '';
  }

  /**
   * Search term matcher for the select2. This is necessary because the select stores the id of each descriptor.
   * The ID is used in select2Formatter_ above to determine the correct name to display.
   *
   * @param {string} term
   * @param {string} text
   * @param {angular.JQLite} option
   * @return {boolean}
   * @private
   */
  matcher_(term, text, option) {
    var id = option.text();

    if (!id) {
      // ng-options introduces an empty option element for some reason, get rid of it
      return false;
    }

    var layer = this.layerIndex_[id];
    var title;

    if (layer instanceof BaseDescriptor) {
      title = layer.getTitle() + ' ' + (layer.getExplicitTitle() || '');
    } else if (osImplements(layer, IFilterable.ID)) {
      var filterable = /** @type {IFilterable} */ (layer);
      title = filterable.getTitle();
    }

    return title ? caseInsensitiveContains(title, term) : true;
  }

  /**
   * Returns the group name for the layer.
   *
   * @param {IDataDescriptor|IFilterable} layer The layer to group.
   * @return {?string}
   */
  static layerGroupFn(layer) {
    return layer instanceof BaseDescriptor ? 'Inactive' : 'Active';
  }
}

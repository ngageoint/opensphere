goog.provide('os.ui.feature.FeatureInfoCtrl');
goog.provide('os.ui.feature.featureInfoDirective');

goog.require('goog.Disposable');
goog.require('goog.object');
goog.require('goog.string');
goog.require('ol.events');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.data.RecordField');
goog.require('os.defines');
goog.require('os.map');
goog.require('os.style');
goog.require('os.ui.Module');
goog.require('os.ui.feature.featureInfoCellDirective');
goog.require('os.ui.location.SimpleLocationDirective');
goog.require('os.ui.propertyInfoDirective');
goog.require('os.ui.util.autoHeightDirective');
goog.require('os.ui.window');


/**
 * The featureinfo directive
 * @return {angular.Directive}
 */
os.ui.feature.featureInfoDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/feature/featureinfo.html',
    controller: os.ui.feature.FeatureInfoCtrl,
    controllerAs: 'info'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('featureinfo', [os.ui.feature.featureInfoDirective]);



/**
 * Controller function for the featureinfo directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.feature.FeatureInfoCtrl = function($scope, $element) {
  os.ui.feature.FeatureInfoCtrl.base(this, 'constructor');

  /**
   * @type {?angular.Scope}
   */
  this.scope = $scope;
  this.scope['tab'] = 'properties';
  this.scope['columnToOrder'] = 'field';
  this.scope['reverse'] = false;
  this.scope['selected'] = null;

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

  os.unit.UnitManager.getInstance().listen(goog.events.EventType.PROPERTYCHANGE, this.updateGeometry, false, this);
  os.dispatcher.listen(os.data.FeatureEventType.VALUECHANGE, this.onValueChange, false, this);
  $scope.$watch('items', this.onFeatureChange.bind(this));
  $scope.$on(os.ui.feature.FeatureInfoCtrl.SHOW_DESCRIPTION, this.showDescription.bind(this));
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.feature.FeatureInfoCtrl, goog.Disposable);


/**
 * Angular event type for switching this view to the description tab.
 * @type {string}
 * @const
 */
os.ui.feature.FeatureInfoCtrl.SHOW_DESCRIPTION = 'os.ui.feature.FeatureInfoCtrl.showDescription';


/**
 * @inheritDoc
 */
os.ui.feature.FeatureInfoCtrl.prototype.disposeInternal = function() {
  os.ui.feature.FeatureInfoCtrl.base(this, 'disposeInternal');

  if (this.changeKey_) {
    ol.events.unlistenByKey(this.changeKey_);
    this.changeKey_ = null;
  }

  os.unit.UnitManager.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.updateGeometry, false, this);
  os.dispatcher.unlisten(os.data.FeatureEventType.VALUECHANGE, this.onValueChange, false, this);
  this.element = null;
  this.scope = null;
};


/**
 * Handle value change events by updating the table.
 * @param {os.data.FeatureEvent} event
 * @suppress {checkTypes} To allow access to feature['id'].
 */
os.ui.feature.FeatureInfoCtrl.prototype.onValueChange = function(event) {
  if (event && this.scope) {
    var feature = /** @type {ol.Feature|undefined} */ (this.scope['items'][0]);
    if (feature && feature['id'] === event['id']) {
      this.updateGeometry();
      this.updateProperties();

      os.ui.apply(this.scope);
    }
  }
};


/**
 * Handle change events fired by the feature.
 * @param {ol.events.Event} event
 */
os.ui.feature.FeatureInfoCtrl.prototype.onFeatureChangeEvent = function(event) {
  this.updateGeometry();
  this.updateProperties();

  os.ui.apply(this.scope);
};


/**
 * Handle feature changes on the scope.
 * @param {Array<ol.Feature>} newVal The new value
 *
 * @todo Should polygons display the center point? See {@link ol.geom.Polygon#getInteriorPoint}. What about line
 *       strings? We can get the center of the extent, but that's not very helpful. For now, only display the location
 *       for point geometries.
 */
os.ui.feature.FeatureInfoCtrl.prototype.onFeatureChange = function(newVal) {
  if (this.isDisposed()) {
    return;
  }

  if (this.changeKey_) {
    ol.events.unlistenByKey(this.changeKey_);
    this.changeKey_ = null;
  }

  this.updateGeometry();
  this.updateProperties();

  if (newVal) {
    var feature = newVal[0];
    if (feature) {
      // listen for change events fired by the feature so the window can be updated
      this.changeKey_ = ol.events.listen(feature, ol.events.EventType.CHANGE, this.onFeatureChangeEvent, this);
    }
  }
};


/**
 * Update the geometry information displayed for the feature.
 * @protected
 */
os.ui.feature.FeatureInfoCtrl.prototype.updateGeometry = function() {
  if (this.scope) {
    this.scope['lon'] = undefined;
    this.scope['lat'] = undefined;
    this.scope['alt'] = undefined;

    var feature = /** @type {ol.Feature|undefined} */ (this.scope['items'][0]);
    if (feature) {
      var geom = feature.getGeometry();
      if (geom instanceof ol.geom.Point) {
        var coord = geom.getFirstCoordinate();
        coord = ol.proj.toLonLat(coord, os.map.PROJECTION);

        if (coord && coord.length > 1) {
          this.scope['lon'] = coord[0];
          this.scope['lat'] = coord[1];

          if (coord.length > 2) {
            var um = os.unit.UnitManager.getInstance();
            this.scope['alt'] = um.formatToBestFit('distance', coord[2], os.math.Units.METERS, um.getBaseSystem(), 2);
          }
        }
      }
    }
  }
};


/**
 * Update the properties/description information displayed for the feature.
 * @protected
 */
os.ui.feature.FeatureInfoCtrl.prototype.updateProperties = function() {
  if (this.scope) {
    this.scope['description'] = false;
    this.scope['properties'] = [];

    var feature = /** @type {ol.Feature|undefined} */ (this.scope['items'][0]);
    if (feature) {
      var properties = feature.getProperties();
      var description = properties[os.data.RecordField.HTML_DESCRIPTION];
      if (!description) {
        description = /** @type {string|undefined} */ (goog.object.findValue(properties, function(val, key) {
          return os.fields.DESC_REGEXP.test(key) && !goog.string.isEmptyOrWhitespace(goog.string.makeSafe(val));
        })) || '';
      }

      if (!goog.string.isEmptyOrWhitespace(goog.string.makeSafe(description))) {
        // force anchor tags to launch a new tab - we may want to instead just launch a new window for the entire
        // description
        description = description.replace(/<a /g, '<a target="_blank" ');

        // write the description HTML to the IFrame
        this.scope['description'] = true;

        var iframe = this.element.find('iframe')[0];
        if (iframe) {
          var frameDoc = iframe.contentWindow.document;
          frameDoc.open();
          frameDoc.write(description);
          frameDoc.close();
        }
      } else {
        // switch back to the properties tab if we won't have a description tab
        this.scope['tab'] = 'properties';
      }

      // create content for the property grid
      var time = /** @type {os.time.ITime|undefined} */ (feature.get(os.data.RecordField.TIME));
      if (time) {
        // add the record time to the property grid and make sure it isn't duplicated
        this.scope['properties'].push({
          'id': 'TIME',
          'field': 'TIME',
          'value': time
        });

        delete properties['TIME'];
      }

      for (var key in properties) {
        if (key === os.Fields.GEOTAG) {
          // associate the feature with the CX report it came from
          this.scope['properties'].push({
            'id': os.Fields.GEOTAG,
            'field': os.Fields.GEOTAG,
            'value': properties[os.data.RecordField.SOURCE_ID],
            'CX': true
          });
        } else if (key === os.Fields.PROPERTIES) {
          this.scope['properties'].push({
            'id': key,
            'field': key,
            'value': properties[key],
            'feature': feature
          });
        } else if (!os.feature.isInternalField(key) && os.object.isPrimitive(properties[key])) {
          this.scope['properties'].push({
            'id': key,
            'field': key,
            'value': properties[key]
          });
        }
      }
    }
  }

  this.order();
};


/**
 * Allow ordering
 * @param {string=} opt_key
 */
os.ui.feature.FeatureInfoCtrl.prototype.order = function(opt_key) {
  if (opt_key) {
    if (opt_key === this.scope['columnToOrder']) {
      this.scope['reverse'] = !this.scope['reverse'];
    } else {
      this.scope['columnToOrder'] = opt_key;
    }
  }

  var field = this.scope['columnToOrder'];
  var reverse = this.scope['reverse'];

  this.scope['properties'].sort(function(a, b) {
    var v1 = a[field].toString();
    var v2 = b[field].toString();
    return goog.string.numerateCompare(v1, v2) * (reverse ? -1 : 1);
  });
};
goog.exportProperty(
    os.ui.feature.FeatureInfoCtrl.prototype,
    'order',
    os.ui.feature.FeatureInfoCtrl.prototype.order);


/**
 * Select this property
 * @param {Event} event
 * @param {Object} property
 */
os.ui.feature.FeatureInfoCtrl.prototype.select = function(event, property) {
  if (this.scope['selected'] == property && event.ctrlKey) {
    this.scope['selected'] = null;
  } else {
    this.scope['selected'] = property;
  }
};
goog.exportProperty(
    os.ui.feature.FeatureInfoCtrl.prototype,
    'select',
    os.ui.feature.FeatureInfoCtrl.prototype.select);


/**
 * Switches to the properties tab.
 * @param {angular.Scope.Event} event
 */
os.ui.feature.FeatureInfoCtrl.prototype.showProperties = function(event) {
  this.scope['tab'] = 'properties';
};
goog.exportProperty(
    os.ui.feature.FeatureInfoCtrl.prototype,
    'showProperties',
    os.ui.feature.FeatureInfoCtrl.prototype.showProperties);


/**
 * Switches to the description tab.
 * @param {angular.Scope.Event} event
 */
os.ui.feature.FeatureInfoCtrl.prototype.showDescription = function(event) {
  this.scope['tab'] = 'description';
};
goog.exportProperty(
    os.ui.feature.FeatureInfoCtrl.prototype,
    'showDescription',
    os.ui.feature.FeatureInfoCtrl.prototype.showDescription);

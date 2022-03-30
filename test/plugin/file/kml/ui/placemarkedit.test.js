goog.require('os.annotation');
goog.require('os.feature.DynamicFeature');
goog.require('os.map.instance');
goog.require('os.ui.datetime.AnyDateType');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.file.kml.ui.PlacemarkEditUI');
goog.require('plugin.places.PlacesManager');

import Feature from 'ol/src/Feature.js';
import {getUid} from 'ol/src/util.js';

describe('plugin.file.kml.ui.placemarkedit', function() {
  const osAnnotation = goog.module.get('os.annotation');
  const {default: DynamicFeature} = goog.module.get('os.feature.DynamicFeature');
  const {getMapContainer} = goog.module.get('os.map.instance');
  const {default: AnyDateType} = goog.module.get('os.ui.datetime.AnyDateType');
  const {default: KMLNode} = goog.module.get('plugin.file.kml.ui.KMLNode');
  const {default: PlacesManager} = goog.module.get('plugin.places.PlacesManager');
  const {Controller: PlacemarkEditController} = goog.module.get('plugin.file.kml.ui.PlacemarkEditUI');

  var scope;
  var element;
  var rootFolder;
  var folder1;

  // eslint-disable-next-line jsdoc/require-jsdoc
  function timeout(fn, delay, invokeApply) {
    // $window.setTimeout(fn,delay);
  }

  beforeEach(function() {
    inject(function($compile, $rootScope) {
      scope = $rootScope;

      parent = $('<div></div>');
      element = angular.element(
          '<form name="testForm">' +
          '<input ng-model="model.somenum" name="somenum" integer />' |
          '</form>'
      ).appendTo(parent);

      $compile(element)(scope);
    });

    rootFolder = new KMLNode();
    rootFolder.canAddChildren = true;
    rootFolder.setLabel('Root folder');

    folder1 = new KMLNode();
    folder1.canAddChildren = true;
    folder1.setLabel('Folder 1');
    folder1.setParent(rootFolder);

    spyOn(PlacesManager.prototype, 'getPlacesRoot').andCallFake(function() {
      return rootFolder;
    });
    spyOn(PlacesManager.prototype, 'reindexTimeModel_').andCallFake(function() {
      return;
    });
  });

  it('should init correctly', function() {
    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    expect(formCtrl['name']).toBe('New Place');
    expect(formCtrl['labelColumns'].length).toBe(16);
    expect(formCtrl.isFeatureDynamic()).toBe(false);
    expect(formCtrl['defaultExpandedOptionsId']).toBe('featureStyle' + formCtrl['uid']);
    expect(formCtrl['previewAnnotation']).toBeUndefined();
    expect(formCtrl['customFoldersEnabled']).toBeTruthy();
    expect(formCtrl['folderOptions']).toEqual([rootFolder, folder1]);
    expect(formCtrl['folder']).toBe(rootFolder);
  });

  it('should init with some options', function() {
    var options = {
      'annotation': true
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);
    formCtrl['name'] = 'Test Name';

    expect(formCtrl['name']).toBe('Test Name');
    expect(formCtrl['options']).toBe(options);
    expect(formCtrl['defaultExpandedOptionsId']).toBe('featureAnnotation' + formCtrl['uid']);
  });

  it('should init with a dynamic feature', function() {
    var feature = new DynamicFeature();
    feature.setId('dynamicFeatureId');
    var options = {
      'feature': feature
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    expect(formCtrl['name']).toBe('New Place');
    expect(formCtrl['defaultExpandedOptionsId']).toBe('featureStyle' + formCtrl['uid']);
    expect(formCtrl['customFoldersEnabled']).toBeFalsy();
    expect(formCtrl['folderOptions']).toBeUndefined();
    expect(formCtrl['folder']).toBeUndefined();
  });

  it('should init with time options', function() {
    var time = {
      'id': 1
    };
    var startDate = new Date('May 1, 2017 07:30:00');
    time.getStart = function() {
      return startDate;
    };
    var endDate = new Date('May 1, 2017 016:30:00');
    time.getEnd = function() {
      return endDate;
    };

    var options = {
      'time': time
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    expect(formCtrl['name']).toBe('New Place');
    expect(formCtrl['startTime']).toBe(startDate);
    expect(formCtrl['endTime']).toBe(endDate);
    expect(formCtrl['startTimeISO']).toBe(startDate.toISOString());
    expect(formCtrl['endTimeISO']).toBe(endDate.toISOString());
    expect(formCtrl['dateType']).toBe(AnyDateType.RANGE);
  });

  it('should init with time options reversed', function() {
    var time = {
      'id': 1
    };
    var startDate = new Date('May 1, 2017 07:30:00');
    var endDate = new Date('May 1, 2017 016:30:00');
    time.getStart = function() {
      return endDate;
    };

    time.getEnd = function() {
      return startDate;
    };

    var options = {
      'time': time
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    expect(formCtrl['name']).toBe('New Place');
    expect(formCtrl['startTime']).toBe(endDate);
    expect(formCtrl['endTime']).toBe(startDate);
    expect(formCtrl['startTimeISO']).toBe(endDate.toISOString());
    expect(formCtrl['endTimeISO']).toBe(startDate.toISOString());
    expect(formCtrl['dateType']).toBe(AnyDateType.INSTANT);
  });

  it('should update a folder', function() {
    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    formCtrl['folder'] = folder1;
    formCtrl.updateFolder();

    expect(formCtrl.options['parent']).toBe(folder1);
  });

  it('should update a preview annotation', function() {
    var annotation = {
      'show': true
    };
    var options = {
      'annotation': annotation
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    formCtrl.updateAnnotation();

    expect(formCtrl['previewAnnotation']).toBeDefined();
  });

  it('should not update previewAnnotation', function() {
    const map = getMapContainer().getMap();
    spyOn(map, 'getOverlayById').andReturn(true);

    var annotation = {
      'show': true
    };
    var options = {
      'annotation': annotation
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    formCtrl.updateAnnotation();

    expect(formCtrl['previewAnnotation']).toBeUndefined();
  });

  it('should not update previewAnnotation with null previewFeature', function() {
    const map = getMapContainer().getMap();
    spyOn(map, 'getOverlayById').andReturn(true);

    var annotation = {
      'show': true
    };
    var options = {
      'annotation': annotation
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);
    formCtrl['previewFeature'] = null;
    formCtrl.updateAnnotation();

    expect(formCtrl['previewAnnotation']).toBeUndefined();
  });

  it('should load a feature', function() {
    var feature = new Feature();

    var formCtrl = new PlacemarkEditController(scope, element, timeout);

    formCtrl.loadFromFeature(feature);

    expect(formCtrl['annotationOptions'].editable).toBe(false);
  });

  it('should load a feature with annotations already', function() {
    var options = {
      cloneTest: true,
      show: true,
      editable: true
    };

    var feature = new Feature({
      [osAnnotation.OPTIONS_FIELD]: options
    });

    var formCtrl = new PlacemarkEditController(scope, element, timeout);
    formCtrl.loadFromFeature(feature);

    expect(formCtrl['annotationOptions']).toBeDefined();
    expect(formCtrl['annotationOptions'].cloneTest).toBe(true);
    expect(formCtrl['annotationOptions'].show).toBe(true);
    expect(formCtrl['annotationOptions'].editable).toBe(false);
  });

  it('should accept new feature', function() {
    var formCtrl = new PlacemarkEditController(scope, element, timeout);
    formCtrl.options.node = new KMLNode();

    formCtrl.accept();

    expect(formCtrl['annotationOptions'].editable).toBe(true);
    expect(formCtrl.options.node.getFeature()).toBe(formCtrl.options.feature);
  });

  it('should accept new feature with no labels', function() {
    var formCtrl = new PlacemarkEditController(scope, element, timeout);
    formCtrl.options.node = new KMLNode();

    formCtrl['labels'] = null;
    formCtrl.accept();

    expect(formCtrl['annotationOptions'].editable).toBe(true);
    expect(formCtrl['labels']).toBe(null);
    expect(formCtrl.options.node.getFeature()).toBe(formCtrl.options.feature);
  });

  it('should accept new feature with no labels', function() {
    var feature = new Feature();
    feature.setId(getUid(feature));
    var options = {
      'feature': feature
    };

    scope['options'] = options;

    var formCtrl = new PlacemarkEditController(scope, element, timeout);
    formCtrl.options.node = new KMLNode();

    formCtrl.accept();

    expect(formCtrl['annotationOptions'].editable).toBe(true);
    expect(formCtrl.options.node.getFeature()).toBe(feature);
  });
});

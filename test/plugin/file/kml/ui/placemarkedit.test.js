goog.require('os.feature.DynamicFeature');
goog.require('plugin.file.kml.ui');
goog.require('plugin.file.kml.ui.PlacemarkEditCtrl');
goog.require('plugin.file.kml.ui.placemarkEditDirective');
goog.require('plugin.places.PlacesManager');



describe('plugin.file.kml.ui.placemarkedit', function() {
  var scope, element, rootFolder, folder1;

  // eslint-disable-next-line require-jsdoc
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

    rootFolder = new plugin.file.kml.ui.KMLNode();
    rootFolder.canAddChildren = true;
    rootFolder.setLabel('Root folder');

    folder1 = new plugin.file.kml.ui.KMLNode();
    folder1.canAddChildren = true;
    folder1.setLabel('Folder 1');
    folder1.setParent(rootFolder);

    spyOn(plugin.places.PlacesManager.prototype, 'getPlacesRoot').andCallFake(function() {
      return rootFolder;
    });
    spyOn(plugin.places.PlacesManager.prototype, 'reindexTimeModel_').andCallFake(function() {
      return;
    });
  });

  it('should init correctly', function() {
    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

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

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);
    formCtrl['name'] = 'Test Name';

    expect(formCtrl['name']).toBe('Test Name');
    expect(formCtrl['options']).toBe(options);
    expect(formCtrl['defaultExpandedOptionsId']).toBe('featureAnnotation' + formCtrl['uid']);
  });

  it('should init with a dynamic feature', function() {
    var feature = new os.feature.DynamicFeature();
    feature.setId('dynamicFeatureId');
    var options = {
      'feature': feature
    };

    scope['options'] = options;

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

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

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    expect(formCtrl['name']).toBe('New Place');
    expect(formCtrl['startTime']).toBe(startDate);
    expect(formCtrl['endTime']).toBe(endDate);
    expect(formCtrl['startTimeISO']).toBe(startDate.toISOString());
    expect(formCtrl['endTimeISO']).toBe(endDate.toISOString());
    expect(formCtrl['dateType']).toBe(os.ui.datetime.AnyDateType.RANGE);
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

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    expect(formCtrl['name']).toBe('New Place');
    expect(formCtrl['startTime']).toBe(endDate);
    expect(formCtrl['endTime']).toBe(startDate);
    expect(formCtrl['startTimeISO']).toBe(endDate.toISOString());
    expect(formCtrl['endTimeISO']).toBe(startDate.toISOString());
    expect(formCtrl['dateType']).toBe(os.ui.datetime.AnyDateType.INSTANT);
  });

  it('should update a folder', function() {
    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

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

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    formCtrl.updateAnnotation();

    expect(formCtrl['previewAnnotation']).toBeDefined();
  });

  it('should not update previewAnnotation', function() {
    spyOn(os.annotation, 'hasOverlay').andReturn(true);
    var annotation = {
      'show': true
    };
    var options = {
      'annotation': annotation
    };

    scope['options'] = options;

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    formCtrl.updateAnnotation();

    expect(formCtrl['previewAnnotation']).toBeUndefined();
  });

  it('should not update previewAnnotation with null previewFeature', function() {
    spyOn(os.annotation, 'hasOverlay').andReturn(true);
    var annotation = {
      'show': true
    };
    var options = {
      'annotation': annotation
    };

    scope['options'] = options;

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);
    formCtrl['previewFeature'] = null;
    formCtrl.updateAnnotation();

    expect(formCtrl['previewAnnotation']).toBeUndefined();
  });

  it('should load a feature', function() {
    var feature = new ol.Feature();

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    formCtrl.loadFromFeature(feature);

    expect(formCtrl['annotationOptions'].editable).toBe(false);
  });

  it('should load a feature with annotations already', function() {
    var feature = new ol.Feature();

    spyOn(feature, 'get').andCallFake(function(returnVal) {
      if (returnVal == os.annotation.OPTIONS_FIELD) {
        return os.annotation.OPTIONS_FIELD;
      }
    });

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    formCtrl.loadFromFeature(feature);
    expect(formCtrl['annotationOptions']).toBe(os.annotation.OPTIONS_FIELD);
  });

  it('should accept new feature', function() {
    spyOn(plugin.file.kml.ui, 'updatePlacemark');
    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    formCtrl.accept();

    expect(formCtrl['annotationOptions'].editable).toBe(true);
    expect(plugin.file.kml.ui.updatePlacemark).toHaveBeenCalled();
  });

  it('should accept new feature with no labels', function() {
    spyOn(plugin.file.kml.ui, 'updatePlacemark');
    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    formCtrl['labels'] = null;
    formCtrl.accept();

    expect(formCtrl['annotationOptions'].editable).toBe(true);
    expect(plugin.file.kml.ui.updatePlacemark).toHaveBeenCalled();
    expect(formCtrl['labels']).toBe(null);
  });

  it('should accept new feature with no labels', function() {
    spyOn(plugin.file.kml.ui, 'updatePlacemark');
    var feature = new ol.Feature();
    feature.setId(ol.getUid(feature));
    var options = {
      'feature': feature
    };

    scope['options'] = options;

    var formCtrl = new plugin.file.kml.ui.PlacemarkEditCtrl(scope, element, timeout);

    formCtrl.accept();

    expect(formCtrl['annotationOptions'].editable).toBe(true);
    expect(plugin.file.kml.ui.updatePlacemark).toHaveBeenCalled();
  });
});

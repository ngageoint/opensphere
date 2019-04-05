goog.require('os.data.ConfigDescriptor');
goog.require('os.ui.column.mapping.ColumnMappingFormCtrl');
goog.require('os.ui.column.mapping.columnMappingFormDirective');
goog.require('plugin.ogc.OGCLayerDescriptor');
goog.require('plugin.ogc.GeoServer');
goog.require('plugin.wmts.Server');


describe('os.ui.column.mapping.ColumnMappingFormCtrl', function() {
  var $scope, cmForm, element;
  var mapping = new os.column.ColumnMapping();

  var ogclayerMock = new plugin.ogc.OGCLayerDescriptor;
  var providerMock = new plugin.ogc.GeoServer;
  var ogclayerMock2 = new plugin.ogc.OGCLayerDescriptor;
  var providerMock2 = new plugin.ogc.GeoServer;
  // var dataManager = new os.dataManager;
  var descriptorList = [];


  // eslint-disable-next-line require-jsdoc
  function timeout(fn, delay, invokeApply) {
    // $window.setTimeout(fn,delay);
  }

  beforeEach(function() {
    spyOn(providerMock, 'getEnabled').andReturn(true);
    spyOn(ogclayerMock, 'getDataProvider').andReturn(providerMock);
    spyOn(os.dataManager, 'getDescriptors').andReturn(descriptorList);
    spyOn(providerMock2, 'getEnabled').andReturn(false);
    spyOn(ogclayerMock2, 'getDataProvider').andReturn(providerMock2);
    inject(function($compile, $rootScope) {
      $scope = $rootScope;
      // windowScope = $rootScope.$new();
      // ctrlScope = windowScope.$new();
      parent = $('<div></div>');
      element = angular.element(
          '<form name="cmForm">' +
          '<input ng-model="model.somenum" name="somenum" integer />' +
          '</form>'
      ).appendTo(parent);
      $scope.model = { somenum: null };
      $compile(element)($scope);
      $scope['columnMapping'] = mapping;

      cmForm = $scope.cmForm;
    });
  });

  afterEach(function() {
    descriptorList = [];
  });

  it('should initialize correctly', function() {
    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);
    expect(formCtrl['element_']).toBe(element);
    expect(formCtrl['scope_']).toBe($scope);
    expect(formCtrl['timeout_']).toBe(timeout);
    expect(formCtrl['cm_']).toBe(mapping);
    expect(formCtrl['tree'].length).toBe(2);
    expect(formCtrl['duplicateLayerText']).toBe('');
    expect(formCtrl['notEnoughLayerText']).toBe('A column association must include at least 2 different columns.');
    expect(formCtrl['otherCMText']).toBe('');
    expect(formCtrl['cachedDescriptorList_'].length).toBe(0);
  });


  it('should populate cachedDescriptorList correctly when layersExist', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock2);

    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    expect(formCtrl['cachedDescriptorList_'].length).toBe(2);
  });

  it('should increase tree when adding a new column', function() {

    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock2);

    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    expect(formCtrl['tree'].length).toBe(2);
    formCtrl.add();
    expect(formCtrl['tree'].length).toBe(3);
  });

  it('should add 2 of 3 descriptors from the list', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock2);

    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    expect(formCtrl['cachedDescriptorList_'].length).toBe(2);
  });

  it('should validate column mapping', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock2);

    $scope['columnMapping'] = mapping;
    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    formCtrl.validate();

    expect(formCtrl['otherCMText']).toBe('');
    expect(cmForm.$valid).toBe(true);
  });

  it('should validate if more than one colomn exists', function() {

    var column = new os.column.ColumnMapping;

    column.addColumn('bob','test2');
    spyOn(os.column.ColumnMappingManager.getInstance(), 'getOwnerMapping').andReturn(column);
    column.addColumn('bob','test2');

    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    formCtrl.validate();

    expect(formCtrl['otherCMText']).toBe('One of your columns (<b></b>) is currently'
    + ' in use on the <b>null</b> column association.');
    expect(cmForm.$valid).toBe(false);
  });

  it('should return the all descriptros in the descriptor list', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    var actuallist = formCtrl.getLayersFunction();
    expect(actuallist.length).toBe(2);
  });

  it('should not add a decriptor type not feature type', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);

    var invalidDescriptor = new os.data.ConfigDescriptor;
    var wmtsServer = new plugin.wmts.Server;
    spyOn(wmtsServer, 'getEnabled').andReturn(true);
    spyOn(invalidDescriptor, 'getDataProvider').andReturn(wmtsServer);
    descriptorList.push(invalidDescriptor);

    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    var actuallist = formCtrl.getLayersFunction();
    expect(actuallist.length).toBe(2);
  });

  it('should confirm an edit of column mappings', function() {
    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    spyOn(formCtrl, 'cancel');
    formCtrl.confirm();
    expect(formCtrl.cancel).toHaveBeenCalled();
  });

  it('should call window close', function() {
    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    spyOn(os.ui.window, 'close');

    formCtrl.cancel();

    expect(os.ui.window.close).toHaveBeenCalled();
  });

  it('should remove a column from the tree', function() {
    var columnModelNode = new os.ui.column.mapping.ColumnModelNode;
    var column = new os.column.ColumnMapping;
    columnModelNode.setColumnModel(column);
    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    spyOn(formCtrl, 'validateLayers_');
    formCtrl.add();
    formCtrl.removeColumnModel_($scope, columnModelNode);

    expect(formCtrl['tree'].length).toBe(4);
    expect(formCtrl.validateLayers_).toHaveBeenCalled();
  });

  it('should find no duplicates layer', function() {
    var mapping = new os.column.ColumnMapping();
    mapping.addColumn('Bob', 'Dole');
    mapping.addColumn('Dole', 'Bolan');

    $scope['columnMapping'] = mapping;

    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    formCtrl.validateLayers_();

    expect(cmForm.$valid).toBe(true);
  });

  it('should find a duplicated layer', function() {
    var mapping = new os.column.ColumnMapping();
    var columnModelNode = new os.ui.column.mapping.ColumnModelNode;
    var ogclayer = new plugin.ogc.OGCLayerDescriptor;
    mapping.addColumn('Bob', 'Dole');
    mapping.addColumn('Bob', 'Bolan');

    spyOn(ol.array, 'find').andCallFake(function() {
      return columnModelNode;
    });
    spyOn(columnModelNode, 'getInitialLayer').andCallFake(function() {
      return ogclayer;
    });
    spyOn(ogclayer, 'getTitle').andCallFake(function() {
      return 'test';
    });

    $scope['columnMapping'] = mapping;

    var formCtrl = new os.ui.column.mapping.ColumnMappingFormCtrl($scope, element, timeout);

    formCtrl.validateLayers_();

    expect(cmForm.$valid).toBe(false);
    expect(formCtrl['duplicateLayerText']).toBe('Duplicate layers are not supported (<b>test</b>)');
  });
});

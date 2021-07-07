goog.require('os.column.ColumnMapping');
goog.require('os.column.ColumnMappingManager');
goog.require('os.data.ConfigDescriptor');
goog.require('os.data.DataManager');
goog.require('os.ui.column.mapping.ColumnMappingFormUI');
goog.require('os.ui.column.mapping.ColumnModelNode');
goog.require('os.ui.window');
goog.require('plugin.ogc.GeoServer');
goog.require('plugin.ogc.OGCLayerDescriptor');
goog.require('plugin.ogc.wmts.WMTSServer');

describe('os.ui.column.mapping.ColumnMappingFormUI', function() {
  const ColumnMapping = goog.module.get('os.column.ColumnMapping');
  const ColumnMappingManager = goog.module.get('os.column.ColumnMappingManager');
  const ConfigDescriptor = goog.module.get('os.data.ConfigDescriptor');
  const DataManager = goog.module.get('os.data.DataManager');
  const ColumnModelNode = goog.module.get('os.ui.column.mapping.ColumnModelNode');
  const osWindow = goog.module.get('os.ui.window');
  const GeoServer = goog.module.get('plugin.ogc.GeoServer');
  const OGCLayerDescriptor = goog.module.get('plugin.ogc.OGCLayerDescriptor');
  const WMTSServer = goog.module.get('plugin.ogc.wmts.WMTSServer');
  const {Controller} = goog.module.get('os.ui.column.mapping.ColumnMappingFormUI');

  var $scope;
  var cmForm;
  var element;

  var mapping = new ColumnMapping();

  var ogclayerMock = new OGCLayerDescriptor();
  var providerMock = new GeoServer();
  var ogclayerMock2 = new OGCLayerDescriptor();
  var providerMock2 = new GeoServer();
  var descriptorList = [];


  // eslint-disable-next-line
  function timeout(fn, delay, invokeApply) {

  }

  beforeEach(function() {
    spyOn(providerMock, 'getEnabled').andReturn(true);
    spyOn(ogclayerMock, 'getDataProvider').andReturn(providerMock);
    spyOn(DataManager.getInstance(), 'getDescriptors').andReturn(descriptorList);
    spyOn(providerMock2, 'getEnabled').andReturn(false);
    spyOn(ogclayerMock2, 'getDataProvider').andReturn(providerMock2);
    inject(function($compile, $rootScope) {
      $scope = $rootScope;
      parent = $('<div></div>');
      element = angular.element(
          '<form name="cmForm">' +
          '<input ng-model="model.somenum" name="somenum" integer />' +
          '</form>'
      ).appendTo(parent);
      $scope.model = {somenum: null};
      $compile(element)($scope);
      $scope['columnMapping'] = mapping;

      cmForm = $scope.cmForm;
    });
  });

  afterEach(function() {
    descriptorList = [];
  });

  it('should initialize correctly', function() {
    var formCtrl = new Controller($scope, element, timeout);
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

    var formCtrl = new Controller($scope, element, timeout);

    expect(formCtrl['cachedDescriptorList_'].length).toBe(2);
  });

  it('should increase tree when adding a new column', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock2);

    var formCtrl = new Controller($scope, element, timeout);

    expect(formCtrl['tree'].length).toBe(2);
    formCtrl.add();
    expect(formCtrl['tree'].length).toBe(3);
  });

  it('should add 2 of 3 descriptors from the list', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock2);

    var formCtrl = new Controller($scope, element, timeout);

    expect(formCtrl['cachedDescriptorList_'].length).toBe(2);
  });

  it('should validate column mapping', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock2);

    $scope['columnMapping'] = mapping;
    var formCtrl = new Controller($scope, element, timeout);

    formCtrl.validate();

    expect(formCtrl['otherCMText']).toBe('');
    expect(cmForm.$valid).toBe(true);
  });

  it('should validate if more than one colomn exists', function() {
    var column = new ColumnMapping;

    column.addColumn('bob', 'test2');
    spyOn(ColumnMappingManager.getInstance(), 'getOwnerMapping').andReturn(column);
    column.addColumn('bob', 'test2');

    var formCtrl = new Controller($scope, element, timeout);

    formCtrl.validate();

    expect(formCtrl['otherCMText']).toBe('One of your columns (<b></b>) is currently ' +
      'in use on the <b>null</b> column association.');
    expect(cmForm.$valid).toBe(false);
  });

  it('should return the all descriptors in the descriptor list', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);
    var formCtrl = new Controller($scope, element, timeout);

    var actuallist = formCtrl.getLayersFunction();
    expect(actuallist.length).toBe(2);
  });

  it('should not add a descriptor type not feature type', function() {
    descriptorList.push(ogclayerMock);
    descriptorList.push(ogclayerMock);

    var invalidDescriptor = new ConfigDescriptor;
    var wmtsServer = new WMTSServer;
    spyOn(wmtsServer, 'getEnabled').andReturn(true);
    spyOn(invalidDescriptor, 'getDataProvider').andReturn(wmtsServer);
    descriptorList.push(invalidDescriptor);

    var formCtrl = new Controller($scope, element, timeout);

    var actuallist = formCtrl.getLayersFunction();
    expect(actuallist.length).toBe(2);
  });

  it('should confirm an edit of column mappings', function() {
    var formCtrl = new Controller($scope, element, timeout);

    spyOn(formCtrl, 'cancel');
    formCtrl.confirm();
    expect(formCtrl.cancel).toHaveBeenCalled();
  });

  it('should call window close', function() {
    var formCtrl = new Controller($scope, element, timeout);

    spyOn(osWindow, 'close');

    formCtrl.cancel();

    expect(osWindow.close).toHaveBeenCalled();
  });

  it('should remove a column from the tree', function() {
    var columnModelNode = new ColumnModelNode;
    var column = new ColumnMapping;
    columnModelNode.setColumnModel(column);
    var formCtrl = new Controller($scope, element, timeout);

    spyOn(formCtrl, 'validateLayers_');
    formCtrl.add();
    formCtrl.removeColumnModel_($scope, columnModelNode);

    expect(formCtrl['tree'].length).toBe(4);
    expect(formCtrl.validateLayers_).toHaveBeenCalled();
  });

  it('should find no duplicates layer', function() {
    var mapping = new ColumnMapping();
    mapping.addColumn('Bob', 'Dole');
    mapping.addColumn('Dole', 'Bolan');

    $scope['columnMapping'] = mapping;

    var formCtrl = new Controller($scope, element, timeout);

    formCtrl.validateLayers_();

    expect(cmForm.$valid).toBe(true);
  });

  it('should find a duplicated layer', function() {
    var mapping = new ColumnMapping();
    var columnModelNode = new ColumnModelNode;
    var ogclayer = new OGCLayerDescriptor;
    mapping.addColumn('Bob', 'Dole');
    mapping.addColumn('Bob', 'Bolan');

    $scope['columnMapping'] = mapping;

    var formCtrl = new Controller($scope, element, timeout);

    spyOn(formCtrl.tree, 'find').andCallFake(function() {
      return columnModelNode;
    });
    spyOn(columnModelNode, 'getInitialLayer').andCallFake(function() {
      return ogclayer;
    });
    spyOn(ogclayer, 'getTitle').andCallFake(function() {
      return 'test';
    });

    formCtrl.validateLayers_();

    expect(cmForm.$valid).toBe(false);
    expect(formCtrl['duplicateLayerText']).toBe('Duplicate layers are not supported (<b>test</b>)');
  });
});

goog.require('os.MapContainer');
goog.require('os.data.ZOrder');
goog.require('os.layer.FolderManager');
goog.require('os.layer.folder');
goog.require('os.mock');
goog.require('os.ui.window');


describe('os.layer.FolderManager', () => {
  const FolderManager = goog.module.get('os.layer.FolderManager');
  const Settings = goog.module.get('os.config.Settings');
  const {FolderEventType, SettingsKey} = goog.module.get('os.layer.folder');
  const MapContainer = goog.module.get('os.MapContainer');

  let folder;
  let childFolder;
  let layer0;
  let layer1;
  let childLayer0;

  beforeEach(() => {
    // clean up the global instance before each
    FolderManager.getInstance().clear();

    const map = MapContainer.getInstance();
    map.getLayers().forEach((layer) => map.removeLayer(layer));

    // reset the layer objects
    layer0 = {
      id: 'layer0',
      type: 'layer',
      parentId: 'folder0'
    };

    layer1 = {
      id: 'layer1',
      type: 'layer',
      parentId: 'folder0'
    };

    childLayer0 = {
      id: 'childLayer0',
      type: 'layer',
      parentId: 'childFolder'
    };

    // reset the test folder objects
    folder = {
      id: 'folder0',
      type: 'folder',
      name: 'My Folder',
      parentId: 'Feature Layers',
      children: [childFolder, layer0, layer1],
      collapsed: true
    };

    childFolder = {
      id: 'childFolder',
      type: 'folder',
      name: 'My Folder',
      parentId: 'folder0',
      children: [childLayer0],
      collapsed: false
    };
  });

  it('should restore from settings on instantiation', () => {
    const mockFolders = [
      {
        id: 'folder0',
        type: 'folder',
        name: 'My Folder',
        parentId: '',
        children: [layer0, layer1],
        collapsed: true
      },
      {
        id: 'rootLayer0',
        type: 'layer',
        parentId: ''
      },
      {
        id: 'rootLayer1',
        type: 'layer',
        parentId: ''
      }
    ];
    Settings.getInstance().set(SettingsKey.FOLDERS, mockFolders);

    // create a fresh instance and check that it has the right folders
    const instance = new FolderManager();
    const items = instance.getItems();

    expect(items.length).toBe(3);
    expect(items[0].id).toBe('folder0');
    expect(items[0].type).toBe('folder');
    expect(items[0].name).toBe('My Folder');
    expect(items[0].parentId).toBe('');
    expect(items[0].children.length).toBe(2);
    expect(items[0].collapsed).toBe(true);

    const testChild0 = items[0].children[0];
    expect(testChild0.id).toBe('layer0');
    expect(testChild0.type).toBe('layer');
    expect(testChild0.parentId).toBe('folder0');

    const testChild1 = items[0].children[1];
    expect(testChild1.id).toBe('layer1');
    expect(testChild1.type).toBe('layer');
    expect(testChild1.parentId).toBe('folder0');

    expect(items[1].id).toBe('rootLayer0');
    expect(items[1].type).toBe('layer');
    expect(items[1].parentId).toBe('');

    expect(items[2].id).toBe('rootLayer1');
    expect(items[2].type).toBe('layer');
    expect(items[2].parentId).toBe('');

    Settings.getInstance().set(SettingsKey.FOLDERS, undefined);
  });

  it('should create and add folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    const items = fm.getItems();
    expect(items.length).toBe(2);
    expect(items[0]).toEqual(folder);
    expect(items[1].id).toBe('draw');
  });

  it('should create and add child folders to other folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.createFolder(childFolder);

    const items = fm.getItems();
    expect(items.length).toBe(2);
    expect(items[0]).toEqual(folder);

    const managedChildFolder = fm.getItem('childFolder');
    expect(managedChildFolder).toEqual(childFolder);
  });

  it('should not allow creation of folders with duplicate IDs', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    expect(fm.getItems().length).toBe(2);

    fm.createFolder(folder);

    expect(fm.getItems().length).toBe(2);
  });

  it('should remove folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.removeFolder('folder0');

    // folder0 has 3 children: 1 folder, and 2 layers, which should now live at the root (+ the drawing layer)
    expect(fm.getItems().length).toBe(4);
    expect(fm.getItem('folder0')).toBe(undefined);

    fm.removeFolder('childFolder');
    expect(fm.getItems().length).toBe(4);
    expect(fm.getItem('childFolder')).toBe(undefined);
  });

  it('should remove folders that are children of other folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.removeFolder('childFolder');

    const items = fm.getItems();
    expect(items.length).toBe(2);
    expect(items[0]).toEqual(folder);
    expect(items[0].children.includes(childFolder)).toBe(false);
  });

  it('should get folders by ID', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    const result = fm.getItem('folder0');
    expect(result).toEqual(folder);
  });

  it('should get folders that are children to other folders by ID', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.createFolder(childFolder);

    const result = fm.getItem('childFolder');
    expect(result).toEqual(childFolder);
  });

  it('should launch the create window UI', () => {
    let calledOptions;
    const mockLaunch = (options) => {
      calledOptions = options;
    };
    spyOn(os.ui.window, 'launchConfirmText').andCallFake(mockLaunch);

    const fm = FolderManager.getInstance();
    fm.createOrEditFolder(folder);

    expect(calledOptions.defaultValue).toBe('New Folder');
    expect(calledOptions.windowOptions.label).toBe('Add Folder');
  });

  it('should fire change events', () => {
    let received = false;
    const fm = FolderManager.getInstance();
    const listener = (event) => {
      received = true;
    };

    fm.listenOnce(FolderEventType.FOLDER_CREATED, listener);
    fm.createFolder(folder);
    expect(received).toBe(true);
    received = false;

    fm.listenOnce(FolderEventType.FOLDER_REMOVED, listener);
    fm.removeFolder('folder0');
    expect(received).toBe(true);
    received = false;

    fm.listenOnce(FolderEventType.FOLDERS_CLEARED, listener);
    fm.clear();
    expect(received).toBe(true);
  });
});

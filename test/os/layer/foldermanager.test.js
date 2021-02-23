goog.require('os.data.ZOrder');
goog.require('os.layer.FolderManager');
goog.require('os.layer.folder');
goog.require('os.mock');
goog.require('os.ui.window');


describe('os.layer.FolderManager', () => {
  const FolderManager = goog.module.get('os.layer.FolderManager');
  const Settings = goog.module.get('os.config.Settings');
  const {FolderEventType, SettingsKey} = goog.module.get('os.layer.folder');
  const ZOrder = goog.module.get('os.data.ZOrder');
  let folder;
  let childFolder;

  beforeEach(() => {
    // clean up the global instance before each
    FolderManager.getInstance().clear();

    // reset the test folder objects
    folder = {
      id: 'folder0',
      name: 'My Folder',
      parentId: 'Feature Layers',
      children: ['layer0', 'layer1'],
      collapsed: true
    };

    childFolder = {
      id: 'childFolder',
      name: 'My Folder',
      parentId: 'folder0',
      children: ['childLayer0'],
      collapsed: false
    };
  });

  it('should restore from settings on instantiation', () => {
    const mockFolders = [
      {
        id: 'folder0',
        name: 'My Folder',
        parentId: 'Feature Layers',
        children: ['layer0', 'layer1'],
        collapsed: true
      }
    ];
    Settings.getInstance().set(SettingsKey.FOLDERS, mockFolders);

    // create a fresh instance and check that it has the right folders
    const instance = new FolderManager();
    const folders = instance.getFolders();

    expect(folders.length).toBe(1);
    expect(folders[0].id).toBe('folder0');
    expect(folders[0].name).toBe('My Folder');
    expect(folders[0].parentId).toBe('Feature Layers');
    expect(folders[0].children.length).toBe(2);
    expect(folders[0].children[0]).toBe('layer0');
    expect(folders[0].children[1]).toBe('layer1');
    expect(folders[0].collapsed).toBe(true);
  });

  it('should create and add folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    const folders = fm.getFolders();
    expect(folders.length).toBe(1);
    expect(folders[0]).toEqual(folder);
  });

  it('should create and add child folders to other folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.createFolder(childFolder);

    const folders = fm.getFolders();
    expect(folders.length).toBe(1);
    expect(folders[0]).toEqual(folder);

    const managedChildFolder = folders[0].children.find((c) => c.id === 'childFolder');
    expect(managedChildFolder).toEqual(childFolder);
  });

  it('should remove folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.removeFolder('folder0');

    expect(fm.getFolders().length).toBe(0);
  });

  it('should remove folders that are children of other folders', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.createFolder(childFolder);
    fm.removeFolder('childFolder');

    const folders = fm.getFolders();
    expect(folders.length).toBe(1);
    expect(folders[0]).toEqual(folder);
    expect(folders[0].children.includes(childFolder)).toBe(false);
  });

  it('should get folders by ID', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    const result = fm.getFolder('folder0');
    expect(result).toEqual(folder);
  });

  it('should get folders that are children to other folders by ID', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);
    fm.createFolder(childFolder);

    const result = fm.getFolder('childFolder');
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

  it('should sort from z-order', () => {
    const fm = FolderManager.getInstance();
    const zMap = {
      'layer0': 1,
      'layer1': 2,
      'layer2': 3,
      'layer3': 4,
      'layer4': 5,
      'layer5': 6,
      'layer6': 7,
      'layer7': 8
    };
    spyOn(ZOrder.getInstance(), 'getIndex').andCallFake((id) => {
      return zMap[id];
    });

    // setup a folder with a child to apply the z-order sort to
    const zChildFolder = {
      id: 'zChildFolder',
      name: 'Z Child Folder Test',
      parentId: 'zFolder',
      children: ['layer3', 'layer4', 'layer2', 'layer6'],
      collapsed: true
    };
    const zFolder = {
      id: 'zFolder',
      name: 'Z Folder Test',
      parentId: 'Feature Layers',
      children: [zChildFolder, 'layer1', 'layer0', 'layer5', 'layer7'],
      collapsed: true
    };

    // add the root folder and check the sort
    fm.createFolder(zFolder);

    // the ZOrder class sorts descending, so the number order will be reversed
    const sortedFolder = fm.getFolder('zFolder');
    expect(sortedFolder.children[0]).toBe(zChildFolder);
    expect(sortedFolder.children[1]).toBe('layer7');
    expect(sortedFolder.children[2]).toBe('layer5');
    expect(sortedFolder.children[3]).toBe('layer1');
    expect(sortedFolder.children[4]).toBe('layer0');

    const sortedChildFolder = fm.getFolder('zChildFolder');
    expect(sortedChildFolder.children[0]).toBe('layer6');
    expect(sortedChildFolder.children[1]).toBe('layer4');
    expect(sortedChildFolder.children[2]).toBe('layer3');
    expect(sortedChildFolder.children[3]).toBe('layer2');
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

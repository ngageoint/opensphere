goog.require('os.MapContainer');
goog.require('os.data.ZOrder');
goog.require('os.layer.FolderManager');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.layer.config.MockTileLayerConfig');
goog.require('os.layer.config.MockVectorLayerConfig');
goog.require('os.layer.folder');
goog.require('os.mock');

import MockTileLayerConfig from './config/tilelayerconfig.mock.js';
import MockVectorLayerConfig from './config/vectorlayerconfig.mock.js';

describe('os.layer.FolderManager', () => {
  const {default: FolderManager} = goog.module.get('os.layer.FolderManager');
  const {default: Settings} = goog.module.get('os.config.Settings');
  const {FolderEventType, SettingsKey} = goog.module.get('os.layer.folder');
  const {default: MapContainer} = goog.module.get('os.MapContainer');
  const {default: LayerConfigManager} = goog.module.get('os.layer.config.LayerConfigManager');

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
    childFolder = {
      id: 'childFolder',
      type: 'folder',
      name: 'My Folder',
      parentId: 'folder0',
      children: [childLayer0],
      collapsed: false
    };

    folder = {
      id: 'folder0',
      type: 'folder',
      name: 'My Folder',
      parentId: 'Feature Layers',
      children: [childFolder, layer0, layer1],
      collapsed: true
    };
  });

  it('merge layer items from the map', () => {
    const fm = FolderManager.getInstance();
    expect(fm.items.length).toBe(0);

    const map = MapContainer.getInstance();
    const lcm = LayerConfigManager.getInstance();
    LayerConfigManager.getInstance().registerLayerConfig(MockTileLayerConfig.TYPE, MockTileLayerConfig);
    const tlc = lcm.getLayerConfig(MockTileLayerConfig.TYPE);
    map.addLayer(tlc.createLayer({id: 'tileLayer1'}));
    map.addLayer(tlc.createLayer({id: 'tileLayer2'}));
    map.addLayer(tlc.createLayer({id: 'tileLayer3'}));

    LayerConfigManager.getInstance().registerLayerConfig(MockVectorLayerConfig.TYPE, MockVectorLayerConfig);
    const vlc = lcm.getLayerConfig(MockVectorLayerConfig.TYPE);
    map.addLayer(vlc.createLayer({id: 'vectorLayer1'}));
    map.addLayer(vlc.createLayer({id: 'vectorLayer2'}));

    fm.mergeFromMap();

    // we should have a drawing layer and the rest of the layers in the order they are added to the map
    expect(fm.items.length).toBe(6);
    expect(fm.items[0].id).toBe('draw');
    expect(fm.items[1].id).toBe('tileLayer1');
    expect(fm.items[2].id).toBe('tileLayer2');
    expect(fm.items[3].id).toBe('tileLayer3');
    expect(fm.items[4].id).toBe('vectorLayer1');
    expect(fm.items[5].id).toBe('vectorLayer2');
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
    folder.children = [layer0, layer1];
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

    const result = fm.getItem('childFolder');
    expect(result).toEqual(childFolder);
  });

  it('should get parents to items', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    let parent = fm.getParent('layer0');
    expect(parent).toEqual(folder);

    parent = fm.getParent('folder0');
    expect(parent).toBe(fm.getItems());
  });

  it('should move items around at the root level', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    // insert some layers to move around
    for (let i = 0; i < 5; i++) {
      fm.items.push({
        id: 'moveLayer' + i,
        type: 'layer',
        parentId: ''
      });
    }

    expect(fm.items[0].id).toBe('folder0');
    expect(fm.items[1].id).toBe('draw');
    expect(fm.items[2].id).toBe('moveLayer0');
    expect(fm.items[3].id).toBe('moveLayer1');
    expect(fm.items[4].id).toBe('moveLayer2');
    expect(fm.items[5].id).toBe('moveLayer3');
    expect(fm.items[6].id).toBe('moveLayer4');

    // test moving a layer before another layer
    fm.move('moveLayer0', 'moveLayer3');

    expect(fm.items[0].id).toBe('folder0');
    expect(fm.items[1].id).toBe('draw');
    expect(fm.items[2].id).toBe('moveLayer1');
    expect(fm.items[3].id).toBe('moveLayer2');
    expect(fm.items[4].id).toBe('moveLayer0');
    expect(fm.items[5].id).toBe('moveLayer3');
    expect(fm.items[6].id).toBe('moveLayer4');

    // test moving a folder
    fm.move('folder0', 'moveLayer4');

    expect(fm.items[0].id).toBe('draw');
    expect(fm.items[1].id).toBe('moveLayer1');
    expect(fm.items[2].id).toBe('moveLayer2');
    expect(fm.items[3].id).toBe('moveLayer0');
    expect(fm.items[4].id).toBe('moveLayer3');
    expect(fm.items[5].id).toBe('folder0');
    expect(fm.items[6].id).toBe('moveLayer4');

    // move draw after 2
    fm.move('draw', 'moveLayer2', true);

    expect(fm.items[0].id).toBe('moveLayer1');
    expect(fm.items[1].id).toBe('moveLayer2');
    expect(fm.items[2].id).toBe('draw');
    expect(fm.items[3].id).toBe('moveLayer0');
    expect(fm.items[4].id).toBe('moveLayer3');
    expect(fm.items[5].id).toBe('folder0');
    expect(fm.items[6].id).toBe('moveLayer4');

    // move 1 after the folder, this requires the fourth argument to be true to not reparent the layer
    fm.move('moveLayer1', 'folder0', true, true);

    expect(fm.items[0].id).toBe('moveLayer2');
    expect(fm.items[1].id).toBe('draw');
    expect(fm.items[2].id).toBe('moveLayer0');
    expect(fm.items[3].id).toBe('moveLayer3');
    expect(fm.items[4].id).toBe('folder0');
    expect(fm.items[5].id).toBe('moveLayer1');
    expect(fm.items[6].id).toBe('moveLayer4');
  });

  it('should move items around within folders and reparent them', () => {
    const fm = FolderManager.getInstance();
    fm.createFolder(folder);

    // insert some layers to move around
    for (let i = 0; i < 5; i++) {
      fm.items.push({
        id: 'moveLayer' + i,
        type: 'layer',
        parentId: ''
      });
    }

    const folder0 = fm.items[0];
    expect(folder0.id).toBe('folder0');
    expect(folder0.children[0].id).toBe('childFolder');
    expect(folder0.children[1].id).toBe('layer0');
    expect(folder0.children[2].id).toBe('layer1');

    // move layers within a folder
    fm.move('layer1', 'layer0');

    expect(folder0.children[0].id).toBe('childFolder');
    expect(folder0.children[1].id).toBe('layer1');
    expect(folder0.children[2].id).toBe('layer0');

    // move a folder within a folder after a target layer
    fm.move('childFolder', 'layer0', true);

    expect(folder0.children[0].id).toBe('layer1');
    expect(folder0.children[1].id).toBe('layer0');
    expect(folder0.children[2].id).toBe('childFolder');

    // move a layer into a child folder
    fm.move('layer1', 'childFolder');

    expect(folder0.children[0].id).toBe('layer0');
    expect(folder0.children[1].id).toBe('childFolder');
    let childFolder = folder0.children[1];
    expect(childFolder.children[0].id).toBe('layer1');
    expect(childFolder.children[1].id).toBe('childLayer0');

    // move a layer from a child folder back to the root
    fm.move('layer1', 'moveLayer2');

    expect(fm.items[0].id).toBe('folder0');
    expect(fm.items[1].id).toBe('draw');
    expect(fm.items[2].id).toBe('moveLayer0');
    expect(fm.items[3].id).toBe('moveLayer1');
    expect(fm.items[4].id).toBe('layer1');
    expect(fm.items[5].id).toBe('moveLayer2');
    expect(fm.items[6].id).toBe('moveLayer3');
    expect(fm.items[7].id).toBe('moveLayer4');
    childFolder = folder0.children[1];
    expect(childFolder.children[0].id).toBe('childLayer0');

    // reparent a layer to a new folder, targeting a folder, but adding it as a sibling
    fm.move('moveLayer4', 'childFolder', false, true);

    expect(folder0.children[0].id).toBe('layer0');
    expect(folder0.children[1].id).toBe('moveLayer4');
    expect(folder0.children[2].id).toBe('childFolder');
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

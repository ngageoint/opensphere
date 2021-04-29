goog.require('os.MapContainer');
goog.require('os.data.ZOrder');
goog.require('os.layer.FolderManager');
goog.require('os.layer.folder');
goog.require('os.mock');
goog.require('os.ui.window');


describe('os.layer.FolderManager', () => {
  const FolderManager = goog.module.get('os.layer.FolderManager');
  const {createOrEditFolder} = goog.module.get('os.layer.folder');

  let folder;

  beforeEach(() => {
    // clean up the global instance before each
    FolderManager.getInstance().clear();

    folder = {
      id: 'folder0',
      type: 'folder',
      name: 'My Folder',
      parentId: 'Feature Layers',
      children: [],
      collapsed: true
    };
  });

  it('should launch the create window UI', () => {
    let calledOptions;
    const mockLaunch = (options) => {
      calledOptions = options;
    };
    spyOn(os.ui.window, 'launchConfirmText').andCallFake(mockLaunch);

    createOrEditFolder(folder);

    expect(calledOptions.defaultValue).toBe('New Folder');
    expect(calledOptions.windowOptions.label).toBe('Add Folder');
  });
});

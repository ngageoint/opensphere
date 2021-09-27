goog.require('os.data.FolderNode');
goog.require('os.ui.slick.SlickTreeNode');


describe('os.data.FolderNode', () => {
  const FolderNode = goog.module.get('os.data.FolderNode');
  const {default: SlickTreeNode} = goog.module.get('os.ui.slick.SlickTreeNode');

  const folder = {
    id: 'folder0',
    name: 'My Folder',
    parentId: 'Feature Layers',
    children: ['layer0', 'layer1'],
    collapsed: true
  };

  it('should instantiate correctly from folder options', () => {
    const folderNode = new FolderNode(folder);
    expect(folderNode.getOptions()).toBe(folder);
    expect(folderNode.getId()).toBe(folder.id);
    expect(folderNode.getLabel()).toBe(folder.name);
    expect(folderNode.collapsed).toBe(true);
  });

  it('should update from new folder options', () => {
    const folderNode = new FolderNode(folder);
    const newFolder = {
      id: 'newFolderId',
      name: 'Another Folder',
      parentId: 'Feature Layers',
      children: ['otherChild'],
      collapsed: false
    };
    folderNode.setOptions(newFolder);

    expect(folderNode.getOptions()).toBe(newFolder);
    expect(folderNode.getId()).toBe(newFolder.id);
    expect(folderNode.getLabel()).toBe(newFolder.name);
    expect(folderNode.collapsed).toBe(false);
  });

  it('should format icons properly', () => {
    const folderNode = new FolderNode(folder);
    folderNode.collapsed = false;
    let iconStr = folderNode.formatIcons();

    expect(iconStr).toBe(`<i class="fa fa-folder fa-fw"></i>`);

    folderNode.addChild(new SlickTreeNode());
    iconStr = folderNode.formatIcons();

    expect(iconStr).toBe(`<i class="fa fa-folder-open fa-fw"></i>`);
  });
});

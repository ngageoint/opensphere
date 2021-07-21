goog.require('os.mock');
goog.require('os.user.settings.FavoriteManager');

describe('os.user.settings.FavoriteManager', function() {
  const FavoriteManager = goog.module.get('os.user.settings.FavoriteManager');
  var settings;

  beforeEach(function() {
    settings = os.settings;
    settings.setPersistenceEnabled(false);
  });

  afterEach(function() {
    settings.setPersistenceEnabled(true);
  });

  it('should start from scratch', function() {
    expect(FavoriteManager.getInstance().getFavorites().length).toBe(0);
  });

  it('should save favorites', function() {
    FavoriteManager.getInstance().save(os.user.settings.FavoriteType.DESCRIPTOR, '1', 'one');
    FavoriteManager.getInstance().save(os.user.settings.FavoriteType.DESCRIPTOR, '2', 'two');
    FavoriteManager.getInstance().save(os.user.settings.FavoriteType.DESCRIPTOR, '3', 'three');
    expect(FavoriteManager.getInstance().getFavorites().length).toBe(3);
  });

  it('should not add favorites that already exist', function() {
    FavoriteManager.getInstance().save(os.user.settings.FavoriteType.DESCRIPTOR, '3', 'three');
    expect(FavoriteManager.getInstance().getFavorites().length).toBe(3);
  });

  it('should retrieve favorites', function() {
    expect(FavoriteManager.getInstance().getFavorite('1') != null).toBe(true);
    expect(FavoriteManager.getInstance().getFavorite('2') != null).toBe(true);
    expect(FavoriteManager.getInstance().getFavorite('3') != null).toBe(true);
  });

  it('should remove favorites', function() {
    FavoriteManager.getInstance().removeFavorite('3');
    expect(FavoriteManager.getInstance().getFavorites().length).toBe(2);
  });

  // it('should add folder favorites', function() {
  //   var key = FavoriteManager.getInstance().createFolder();
  //   expect(FavoriteManager.getInstance().getFavorite(key) != null).toBe(true);
  //   expect(FavoriteManager.getInstance().getFavorites().length).toBe(3);

  //   var nestedFolder = FavoriteManager.getInstance().createFolder(key);
  //   waitsFor(function() {
  //     return FavoriteManager.getInstance().getFavorite(nestedFolder) != null)
  //   });
  //   expect(FavoriteManager.getInstance().getFavorite(nestedFolder) != null).toBe(true);
  //   expect(FavoriteManager.getInstance().getFavorites().length).toBe(3);
  // });

  // it('should retrieve folder favorites', function() {
  //   var folders = FavoriteManager.getInstance().getFolders();
  //   expect(folders.length).toBe(2);
  // });

  // it('should move favorites to a folder', function() {
  //   var folder = FavoriteManager.getInstance().getFolders()[1];
  //   FavoriteManager.getInstance().save(os.user.settings.FavoriteType.DESCRIPTOR, '1',
  //      'one', undefined, [folder['key']]);

  //   var favFolders = FavoriteManager.getInstance().getFavoriteFolders('1');
  //   expect(favFolders.length).toBe(1);
  // });


  // it('should get types of favorites', function() {
  //   var searchFavorites = FavoriteManager.getInstance().getFavTypes(FavoriteManager.getInstance().getFavorites(),
  //       [os.user.settings.FavoriteType.DESCRIPTOR]);
  //   expect(searchFavorites.length).toBe(2);
  // });
});

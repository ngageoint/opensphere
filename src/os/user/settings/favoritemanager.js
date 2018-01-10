goog.provide('os.user.settings.FavoriteManager');
goog.provide('os.user.settings.FavoriteType');
goog.require('goog.events.EventTarget');
goog.require('os.config.Settings');
goog.require('os.object');
goog.require('os.url');


/**
 * @typedef {{
 *   children: Array<os.user.settings.favorite>,
 *   key: string,
 *   time: number,
 *   type: string,
 *   value: string,
 *   key2: string
 *   }}
 */
os.user.settings.favorite;


/**
 * @enum {string}
 */
os.user.settings.FavoriteType = {
  DESCRIPTOR: 'descriptor',
  FOLDER: 'folder',
  MISSING: 'missing',
  SEARCH: 'search.v1'
};



/**
 * Manage favorite actions and other favorite related stuff!
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.user.settings.FavoriteManager = function() {
  os.user.settings.FavoriteManager.base(this, 'constructor');

  /**
   * The actions for each type of favorite
   * @type {Object}
   * @private
   */
  this.actions_ = {};

  /**
   * Function used to manage favorites
   * @type {?function()}
   */
  this.manager = null;

  /**
   * The key for this page
   * @type {string}
   * @private
   */
  this.pageKey_ = '';

  /**
   * Registry of icons to favorite types.
   * @type {Object<string, string>}
   * @private
   */
  this.icons_ = {};

  this.registerIcon(os.user.settings.FavoriteType.DESCRIPTOR, 'toggle-switch');
  this.registerIcon(os.user.settings.FavoriteType.FOLDER, 'fa fa-fw fa-folder');
  this.registerIcon(os.user.settings.FavoriteType.MISSING, 'fa fa-fw fa-chain-broken');
  this.registerIcon(os.user.settings.FavoriteType.SEARCH, 'fa fa-fw fa-search');
};
goog.inherits(os.user.settings.FavoriteManager, goog.events.EventTarget);
goog.addSingletonGetter(os.user.settings.FavoriteManager);


/**
 * Key to use for settings
 * @type {string}
 */
os.user.settings.FavoriteManager.KEY = 'favorite';


/**
 * Get the icon for this favorite type.
 * @todo Icons should not be managed here, icons should be provided by the favorite at save time.
 * @param {string} type
 * @return {string}
 */
os.user.settings.FavoriteManager.prototype.getIcon = function(type) {
  return this.icons_[type] || 'fa fa-fw fa-external-link';
};


/**
 * Registers an icon for a type.
 * @param {string} type
 * @param {string} icon
 */
os.user.settings.FavoriteManager.prototype.registerIcon = function(type, icon) {
  this.icons_[type] = icon;
};


/**
 * Return all the favorites
 * @return {Array}
 */
os.user.settings.FavoriteManager.prototype.getFavorites = function() {
  var favs = /** @type {Array} */ (os.settings.get([os.user.settings.FavoriteManager.KEY]));
  if (!favs) {
    favs = [];
  }
  return favs;
};


/**
 * Search folders for the favorite
 * @param {Array} favs
 * @param {string} key
 * @return {?os.user.settings.favorite}
 * @private
 */
os.user.settings.FavoriteManager.getFavoriteInternal_ = function(favs, key) {
  for (var i = 0; i < favs.length; i++) {
    var fav = favs[i];
    if (fav['key'] == key) {
      return fav;
    } else if (fav['type'] == os.user.settings.FavoriteType.FOLDER) {
      var found = os.user.settings.FavoriteManager.getFavoriteInternal_(fav['children'], key);
      if (found) {
        return found;
      }
    }
  }

  return null;
};


/**
 * Get the favorite
 * @param {string} key
 * @return {?os.user.settings.favorite}
 */
os.user.settings.FavoriteManager.prototype.getFavorite = function(key) {
  return os.user.settings.FavoriteManager.getFavoriteInternal_(this.getFavorites(), key);
};


/**
 * Search folders for the favorite
 * @param {os.user.settings.favorite} folder
 * @param {string} key
 * @return {Array<string>} - the folder keys the favorite was found in
 * @private
 */
os.user.settings.FavoriteManager.getFavoriteFoldersInternal_ = function(folder, key) {
  var favFolders = [];

  var children = folder['children'];
  if (children) {
    for (var i = 0; i < children.length; i++) {
      var fav = children[i];
      if (fav['key'] == key) {
        favFolders.push(folder['key']);
      } else if (fav['type'] == os.user.settings.FavoriteType.FOLDER) {
        var foundFolders = os.user.settings.FavoriteManager.getFavoriteFoldersInternal_(fav, key);
        if (foundFolders) {
          goog.array.extend(favFolders, foundFolders);
        }
      }
    }
  }

  return favFolders;
};


/**
 * Get the favorite's folders
 * @param {string} key
 * @return {Array<os.user.settings.favorite>}
 */
os.user.settings.FavoriteManager.prototype.getFavoriteFolders = function(key) {
  var favFolders = [];

  // Get the top level folders first and just iterate over those
  var folders = this.getFavTypes(this.getFavorites(), [os.user.settings.FavoriteType.FOLDER]);
  if (folders) {
    for (var i = 0; i < folders.length; i++) {
      var folder = folders[i];
      var foundFolders = os.user.settings.FavoriteManager.getFavoriteFoldersInternal_(folder, key);
      if (foundFolders) {
        goog.array.extend(favFolders, foundFolders);
      }
    }
  }
  goog.array.removeDuplicates(favFolders);
  return favFolders;
};


/**
 * Dig through folders to find the favorite. When found remove it and return the complete list with the removal
 * @param {Array} favs
 * @param {string} key
 * @return {Array} - array with the favorite removed
 * @private
 */
os.user.settings.FavoriteManager.removeFavoriteInternal_ = function(favs, key) {
  for (var i = 0; i < favs.length; i++) {
    var fav = favs[i];
    if (fav['key'] == key) {
      goog.array.removeAt(favs, i);
    } else if (fav['type'] == os.user.settings.FavoriteType.FOLDER) {
      var children = os.user.settings.FavoriteManager.removeFavoriteInternal_(fav['children'], key);
      if (children.length != fav['children'].length) {
        fav['children'] = children;
      }
    }
  }

  return favs;
};


/**
 * Get the types
 * @param {string} key
 */
os.user.settings.FavoriteManager.prototype.removeFavorite = function(key) {
  var favs = os.user.settings.FavoriteManager.removeFavoriteInternal_(this.getFavorites(), key);
  this.saveToSettings(favs);
};


/**
 * Dig through folders to find the favorite. When found remove it and return the complete list with the removal
 * @param {Array} favs
 * @param {string} key
 * @param {string} folder - the key for the folder to remove the favorite from
 * @return {Array} - array with the favorite removed
 * @private
 */
os.user.settings.FavoriteManager.removeFavoriteFromFolderInternal_ = function(favs, key, folder) {
  for (var i = 0; i < favs.length; i++) {
    var fav = favs[i];
    if (fav['key'] == folder) {
      goog.array.removeIf(fav['children'], function(child) {
        return child['key'] == key;
      });
    } else if (fav['type'] == os.user.settings.FavoriteType.FOLDER) {
      var children = os.user.settings.FavoriteManager.removeFavoriteFromFolderInternal_(fav['children'], key, folder);
      if (children.length != fav['children'].length) {
        fav['children'] = children;
      }
    }
  }

  return favs;
};


/**
 * Get the types
 * @param {string} key
 * @param {string} folder the key for the folder
 */
os.user.settings.FavoriteManager.prototype.removeFavoriteFromFolder = function(key, folder) {
  var favFolders = this.getFavoriteFolders(key);
  if (favFolders.length > 1) {
    var favs = this.getFavorites();
    var folders = this.getFavTypes(favs, [os.user.settings.FavoriteType.FOLDER]);
    os.user.settings.FavoriteManager.removeFavoriteFromFolderInternal_(folders, key, folder);
    this.saveToSettings(favs);
  } else {
    this.removeFavorite(key);
  }
};


/**
 * Get favorites filtered by this type
 * @param {Array} favs
 * @param {Array<string>} types
 * @return {Array}
 * @private
 */
os.user.settings.FavoriteManager.getTypeInternal_ = function(favs, types) {
  var result = [];

  var bucketFavs = goog.array.bucket(favs, function(fav) {
    return fav['type'];
  });

  goog.array.forEach(types, function(type) {
    var favType = bucketFavs[type];
    if (favType) {
      goog.array.extend(result, favType);
    }
  });

  // If theres folders in the result. Re-run down the folders level
  var folders = bucketFavs[os.user.settings.FavoriteType.FOLDER];
  if (folders) {
    goog.array.forEach(folders, function(folder) {
      goog.array.extend(result, os.user.settings.FavoriteManager.getTypeInternal_(folder['children'], types));
    });
  }

  return result;
};


/**
 * Get the types
 * @param {Array} favs
 * @param {Array<string>} types
 * @return {Array}
 */
os.user.settings.FavoriteManager.prototype.getFavTypes = function(favs, types) {
  var result = os.user.settings.FavoriteManager.getTypeInternal_(favs, types);
  goog.array.removeDuplicates(result, undefined, function(fav) {
    return fav['key'];
  });
  return result;
};


/**
 * @param {Array} favs
 * @param {Array=} opt_ignore - ignore this folder key and all child folders
 * @return {Array}
 * @private
 */
os.user.settings.FavoriteManager.getFoldersInternal_ = function(favs, opt_ignore) {
  var result = [];
  var bucketFavs = goog.array.bucket(favs, function(fav) {
    return fav['type'];
  });

  var folders = bucketFavs[os.user.settings.FavoriteType.FOLDER];
  if (folders) {
    // Remove the ignored folder if it exists
    if (opt_ignore) {
      goog.array.removeIf(folders, function(folder) {
        return folder['key'] == opt_ignore;
      });
    }

    goog.array.extend(result, folders);
    goog.array.forEach(folders, function(folder) {
      goog.array.extend(result, os.user.settings.FavoriteManager.getFoldersInternal_(folder['children'], opt_ignore));
    });
  }

  return result;
};


/**
 * Get the Folders, Pass in a folder to ignore it and its children
 * @param {Array=} opt_ignore - ignore this folder key and all child folders
 * @return {Array}
 */
os.user.settings.FavoriteManager.prototype.getFolders = function(opt_ignore) {
  var folders = os.user.settings.FavoriteManager.getFoldersInternal_(this.getFavorites(), opt_ignore);
  goog.array.removeDuplicates(folders);
  return folders;
};


/**
 * Save the favorite to a folder
 * @param {Array} favs
 * @param {os.user.settings.favorite} favorite
 * @param {string} folder - the folder key
 * @return {Array} - the modified favorite array
 * @private
 */
os.user.settings.FavoriteManager.saveFolderInternal_ = function(favs, favorite, folder) {
  for (var i = 0; i < favs.length; i++) {
    var fav = favs[i];
    // If we found the folder we want to store the favorite.
    if (fav['key'] == folder) {
      goog.array.insertAt(fav['children'], favorite);
      break;
    } else if (fav['type'] == os.user.settings.FavoriteType.FOLDER) {
      var children = os.user.settings.FavoriteManager.saveFolderInternal_(fav['children'], favorite, folder);
      // Did this add the child? break out we are done!
      if (children.length != fav['children'].length) {
        fav['children'] = children;
        break;
      }
    }
  }

  return favs;
};


/**
 * Saves a favorite.
 * @param {string} type
 * @param {string} key
 * @param {string} value
 * @param {boolean=} opt_alert
 * @param {Array<string>=} opt_folders
 * @param {string=} opt_key2 - this is the secondary key. Usually Url, or other identifier
 */
os.user.settings.FavoriteManager.prototype.save = function(type, key, value, opt_alert, opt_folders, opt_key2) {
  var favs = this.getFavorites();
  var originalLength = favs.length;

  var fav = this.getFavorite(key);
  if (fav) {
    fav = /** @type {os.user.settings.favorite} */ (os.object.unsafeClone(fav));
    favs = os.user.settings.FavoriteManager.removeFavoriteInternal_(favs, key);
  } else {
    fav = {
      'children': [],
      'key': key,
      'time': new Date().getTime(),
      'type': type,
      'value': '',
      'key2': opt_key2 ? opt_key2 : ''
    };
  }

  fav['value'] = value;
  fav['time'] = new Date().getTime();

  // Are we putting this favorite into a folder?
  if (opt_folders && opt_folders.length > 0) {
    goog.array.removeDuplicates(opt_folders);
    for (var i = 0; i < opt_folders.length; i++) {
      favs = os.user.settings.FavoriteManager.saveFolderInternal_(favs, fav, opt_folders[i]);
    }
  } else {
    // store at the root
    goog.array.insertAt(favs, fav);
  }

  this.saveToSettings(favs);

  // Dont send the alert if this is an edit
  if (opt_alert && originalLength != favs.length) {
    var alertText = '<strong>' + goog.string.truncate(value || '.', 50) + '</strong>';
    if (os.url.URL_REGEXP.test(key)) {
      alertText = '<a href="' + key + '" target="_blank">' + alertText + '</a>';
    }

    os.alertManager.sendAlert('Saved Favorite: ' + alertText, os.alert.AlertEventSeverity.SUCCESS);
  }
};


/**
 * Flatten down the list for easy presentation
 * @param {Array} list
 * @param {Array<string>=} opt_types only return this type of favorite
 * @param {number=} opt_max - only keep number of favorites
 * @return {Array}
 */
os.user.settings.FavoriteManager.prototype.filter = function(list, opt_types, opt_max) {
  var fullList = [];

  // If we filter out type, get that list. Else just clone the original
  if (opt_types) {
    fullList = this.getFavTypes(list, opt_types);
  } else if (list) {
    fullList = goog.array.clone(list);
  } else {
    fullList = [];
  }

  // If we care about max, truncate the max
  if (opt_max) {
    if (fullList) {
      fullList.length = Math.min(fullList.length, opt_max);
    }
  }
  return fullList;
};


/**
 * Flatten down the list for easy presentation
 * @param {Array} fulllist
 * @param {Array} filterlist
 * @return {boolean}
 */
os.user.settings.FavoriteManager.prototype.showMore = function(fulllist, filterlist) {
  if (fulllist && filterlist) {
    return fulllist.length > filterlist.length;
  } else {
    return false;
  }
};


/**
 * Support different click actions for favorites
 * @param {string} type
 * @param {function(string)} action
 */
os.user.settings.FavoriteManager.prototype.registerHandle = function(type, action) {
  this.actions_[type] = action;
};


/**
 * @param {function()} managerFn - if passed a function, set the value
 */
os.user.settings.FavoriteManager.prototype.setManagerFn = function(managerFn) {
  if (managerFn) {
    this.manager = managerFn;
  }
};


/**
 * Open the favorites manager
 */
os.user.settings.FavoriteManager.prototype.openManager = function() {
  if (os.favoriteManager.manager) {
    os.favoriteManager.manager();
  }
};


/**
 * Handle the click for the favorite
 * @param {Event} event
 * @param {string} type
 * @param {string} key
 */
os.user.settings.FavoriteManager.prototype.handleEvent = function(event, type, key) {
  var action = this.actions_[type];
  // If there is a special action. do that. If not let the href do its magic
  if (action) {
    action(key);
    event.preventDefault();
  }
};


/**
 * Create a new folder
 * @param {string=} opt_folder - optional parent folder
 * @return {string}
 */
os.user.settings.FavoriteManager.prototype.createFolder = function(opt_folder) {
  var folders = opt_folder ? [opt_folder] : null;
  var key = String(new Date().getTime());
  this.save(os.user.settings.FavoriteType.FOLDER, key, 'New Folder', undefined, folders);
  return key;
};


/**
 * Set the key for this page
 * @param {string} key - set the key for this page
 */
os.user.settings.FavoriteManager.prototype.setPageKey = function(key) {
  this.pageKey_ = key;
};


/**
 * Return the key for this page
 * @return {string}
 */
os.user.settings.FavoriteManager.prototype.getPageKey = function() {
  return this.pageKey_;
};


/**
 * Rebuild the favorites list from the tree nodes
 * @param {Array<!os.structs.ITreeNode>} nodes
 * @return {Array<os.user.settings.favorite>}
 * @private
 */
os.user.settings.FavoriteManager.convertInternal_ = function(nodes) {
  var result = [];
  if (nodes) {
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var fav = os.object.unsafeClone(os.favoriteManager.getFavorite(node.getId()));
      var nodeChildren = node.getChildren();
      if (nodeChildren && nodeChildren.length > 0) {
        var children = os.user.settings.FavoriteManager.convertInternal_(node.getChildren());
        fav['children'] = children;
      } else {
        fav['children'] = [];
      }
      result.push(fav);
    }
  }
  return result;
};


/**
 * Save the list order
 * @param {Array<!os.structs.ITreeNode>} nodes
 */
os.user.settings.FavoriteManager.prototype.convert = function(nodes) {
  var favs = os.user.settings.FavoriteManager.convertInternal_(nodes);
  this.saveToSettings(favs);
};


/**
 * Save favorites to settings
 * @param {Array<os.user.settings.favorite>} favs
 */
os.user.settings.FavoriteManager.prototype.saveToSettings = function(favs) {
  os.settings.set([os.user.settings.FavoriteManager.KEY], favs);
};


/**
 * Clears favorites.
 */
os.user.settings.FavoriteManager.prototype.clear = function() {
  this.saveToSettings([]);
};


/**
 * Global reference to the favorite manager singleton.
 * @type {!os.user.settings.FavoriteManager}
 */
os.favoriteManager = os.user.settings.FavoriteManager.getInstance();

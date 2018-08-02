goog.require('os.ui.ActionMenuCtrl');
goog.require('os.ui.action.MenuOptions');

describe('os.ui.ActionMenuCtrl', function() {
  var actionMenu = new os.ui.ActionMenuCtrl({
    provider:{
      listen:function(){},
      unlisten:function(){},
      getEnabledActions:function(){}
    },
    $on:function() {},
    $watch: function() {}
  }, {
    find:function(){return []}
  });

  it('should place actions into sub-menus based on their menu options', function() {
    var someActions = [];
    someActions.push(new os.ui.action.Action('UndoEventType', 'Undo',
        'Undo the last action', 'fa-fw fa-undo', 'Ctrl+Z',
        new os.ui.action.MenuOptions('Edit.History')));
    someActions.push(new os.ui.action.Action('RedoEventType', 'Redo',
        'Redo the last action', 'fa-fw fa-redo', 'Ctrl+Z',
        new os.ui.action.MenuOptions('Edit.History')));
    someActions.push(new os.ui.action.Action('EditThingsEventType', 'Edit Things',
        'Edit some thing and stuff', 'fa-fw fa-pencil', 'Ctrl+Shft+Del+Space+Z+A+P',
        new os.ui.action.MenuOptions('Edit')));
    someActions.push(new os.ui.action.Action('CreateObjectEventType', 'Create Object',
        'Create a new object', 'fa-fw fa-edit', 'O'));

    var menuItems = actionMenu.constructMenu_(someActions);

    expect(menuItems.length).toEqual(2);

    var editMenu = menuItems[0];
    var editMenuItems = editMenu.getItems();
    expect(editMenu instanceof os.ui.action.MenuItemList).toBeTruthy();
    expect(editMenu.getName()).toBe('Edit');
    expect(editMenuItems.length).toBe(2);

    var editThingsItem = editMenuItems[1];
    expect(editThingsItem instanceof os.ui.action.MenuItemAction).toBeTruthy();
    expect(editThingsItem.getName()).toBe('Edit Things');

    var historyMenu = editMenuItems[0];
    var historyMenuItems = historyMenu.getItems();
    expect(historyMenu instanceof os.ui.action.MenuItemList).toBeTruthy();
    expect(historyMenu.getName()).toBe('History');
    expect(historyMenuItems.length).toBe(2);

    var undoItem = historyMenuItems[0];
    var redoItem = historyMenuItems[1];
    expect(undoItem instanceof os.ui.action.MenuItemAction).toBeTruthy();
    expect(undoItem.getName()).toBe('Undo');
    expect(redoItem instanceof os.ui.action.MenuItemAction).toBeTruthy();
    expect(redoItem.getName()).toBe('Redo');

    var createObjectItem = menuItems[1];
    expect(createObjectItem instanceof os.ui.action.MenuItemAction).toBeTruthy();
    expect(createObjectItem.getName()).toBe('Create Object');
  });

  it('should sort actions based on their division and order menu options', function(){
    var noOrder = new os.ui.action.MenuItemAction(new os.ui.action.Action('NoOrder', 'NoOrder'));
    var noOrder2 = new os.ui.action.MenuItemAction(new os.ui.action.Action('NoOrder', 'NoOrder'));
    var one = new os.ui.action.MenuItemAction(new os.ui.action.Action('One', 'One', 'One', 'One', 'One',
        new os.ui.action.MenuOptions(null, null, 1)));
    var one2 = new os.ui.action.MenuItemAction(new os.ui.action.Action('One', 'One', 'One', 'One', 'One',
        new os.ui.action.MenuOptions(null, null, 1)));
    var oneHundred = new os.ui.action.MenuItemAction(new os.ui.action.Action('Hundred', 'Hundred', 'Hundred',
        'Hundred', 'Hundred', new os.ui.action.MenuOptions(null, null, 100)));
    var oneHundred2 = new os.ui.action.MenuItemAction(new os.ui.action.Action('Hundred', 'Hundred', 'Hundred',
        'Hundred', 'Hundred', new os.ui.action.MenuOptions(null, null, 100)));

    expect(actionMenu.sortByDivisionThenOrder_(noOrder, noOrder2)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(noOrder2, noOrder)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(noOrder, one)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(noOrder, oneHundred)).toBe(1);

    expect(actionMenu.sortByDivisionThenOrder_(one, noOrder)).toBe(-1);
    expect(actionMenu.sortByDivisionThenOrder_(one, one2)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(one2, one)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(one, oneHundred)).toBe(-1);

    expect(actionMenu.sortByDivisionThenOrder_(oneHundred, noOrder)).toBe(-1);
    expect(actionMenu.sortByDivisionThenOrder_(oneHundred, one)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(oneHundred, oneHundred2)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(oneHundred2, oneHundred)).toBe(1);

    var a2 = new os.ui.action.MenuItemAction(new os.ui.action.Action('a2', '', '', '', '',
        new os.ui.action.MenuOptions(null, 'a', 2)));
    var a3 = new os.ui.action.MenuItemAction(new os.ui.action.Action('a3', '', '', '', '',
        new os.ui.action.MenuOptions(null, 'a', 3)));
    var b1 = new os.ui.action.MenuItemAction(new os.ui.action.Action('b1', '', '', '', '',
        new os.ui.action.MenuOptions(null, 'b', 1)));
    var b4 = new os.ui.action.MenuItemAction(new os.ui.action.Action('b4', '', '', '', '',
        new os.ui.action.MenuOptions(null, 'b', 4)));

    expect(actionMenu.sortByDivisionThenOrder_(a2, a2)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(a2, a3)).toBe(-1);
    expect(actionMenu.sortByDivisionThenOrder_(a2, b1)).toBe(-1);
    expect(actionMenu.sortByDivisionThenOrder_(a2, b4)).toBe(-1);

    expect(actionMenu.sortByDivisionThenOrder_(a3, a2)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(a3, a3)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(a3, b1)).toBe(-1);
    expect(actionMenu.sortByDivisionThenOrder_(a3, b4)).toBe(-1);

    expect(actionMenu.sortByDivisionThenOrder_(b1, a2)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(b1, a3)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(b1, b1)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(b1, b4)).toBe(-1);

    expect(actionMenu.sortByDivisionThenOrder_(b4, a2)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(b4, a3)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(b4, b1)).toBe(1);
    expect(actionMenu.sortByDivisionThenOrder_(b4, b4)).toBe(1);
  });
});

SubMenu
=======

Problem
-------

Your plugin needs to show additional menu entries in a context menu (e.g. the Spatial menu that appears when you right click on a feature), but you don't want to modify OpenSphere menu code for your specific case.

.. image:: images/submenuscreenshot.png

Solution
--------

Extend the existing menu with Group, SubMenu and Item elements to provide your plugin specific functionality.

.. literalinclude:: src/cookbook-submenu.js
  :caption: SubMenu Cookbook example - menu creation
  :lines: 32-77
  :linenos:
  :language: javascript

Discussion
----------

The Spatial menu (:code:`os.ui.menu.spatial.MENU`) is extensible from plugins. You can then attach groups, separators, submenus and items (plain items, checkboxes, or radio buttons) to the root, or to sub-items. In the image and code, a group item is added to the root, then submenus are nested below that group, and some items are available for selection.

If your plugin has all items known in advance, its possible to use the :code:`children` property to nest the whole structure, as shown here:

.. code-block:: javascript

  const menu = spatial.getMenu();
  if (menu) {
    const root = menu.getRoot();
    let group = root.find(MYGROUP);
    if (!group) {
      group = root.addChild({
        type: MenuItemType.GROUP,
        label: MYGROUP,
        tooltip: 'Added by cookbook submenu example',
        beforeRender: shouldShowGroup,
        children:[{
          type: MenuItemType.SUBMENU,
          label: 'SubMenu 1',
          children:[{
            type: MenuItemType.SUBMENU,
            label: 'SubSubMenu',
            children: [{
              type: MenuItemType.ITEM,
              label: 'Item 1',
              sort: 10,
              handler: handleItem1
            }, {
              type: MenuItemType.ITEM,
              eventType: EventType.DO_SOMETHING,
              label: 'Item 2',
              sort: 30,
              handler: handleItem,
              beforeRender: visibleIfIsPointInSouthernHemisphere
            }, {
              type: MenuItemType.ITEM,
              eventType: EventType.DO_ANOTHER_THING,
              label: 'Another item',
              sort: 20,
              handler: handleItem
            }]
          }]
        }]
      });
    }

This is equivalent - you can mix and match the :code:`addChild` function calls and nested :code:`children` array as needed.

Note that items will be enabled and visible by default, which might not make sense for your use. Instead, you may want to selectively enable, or not display, some menu items, depending on the menu context. The usual way to do this is to set a :code:`beforeRender`, as in :code:`visibleIfIsPointInSouthernHemisphere` which is implemented as:

.. literalinclude:: src/cookbook-submenu.js
  :caption: SubMenu Cookbook example - selectable visibility
  :lines: 111-139
  :linenos:
  :language: javascript

As the name suggests, one menu entry will only be shown if the feature geometry is a point located in the southern hemisphere (i.e. negative latitude).

Full code
---------

.. literalinclude:: src/cookbook-submenu.js
  :caption: SubMenu Cookbook example - Full code
  :linenos:
  :language: javascript

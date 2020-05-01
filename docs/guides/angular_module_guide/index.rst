Angular Directives in Modules
=============================

A primary use case of having multiple ``goog.provide`` statements per file is with Angular directives and their controller. OpenSphere prefers to pair the directive and controller within the same file given they are coupled to create the UI. This poses a problem for a backward-compatible transition to ``goog.module``, given only one module name is allowed per file.

Our options were to split the original names into separate files, or change our approach to exposing the UI. We decided to use a shim to maintain compatibility with existing code. This seems to result in the best end product, and will be detailed in this guide.

The following example shows how the ``map`` directive was transitioned to a module.

.. note:: For a full example, see the `map directive source`_ here.

.. _map directive source: https://github.com/ngageoint/opensphere/blob/master/src/os/ui/map.js

Creating the UI Module
----------------------

- The ``goog.module`` value can use the original controller name, minus ``Ctrl``. The name can be adjusted if needed, for example if this convention results in a name conflict with another class. If unsure about naming conflicts, we recommend replacing ``Ctrl`` with ``UI`` in the module name.
- Define and export the controller class as ``Controller``, and the directive function as ``directive``. This will ensure consistency across all UI's.

.. literalinclude:: src/map.js
  :language: javascript
  :caption: ``src/os/ui/map.js``

Using the Module
----------------

To reference the UI in ``goog.module`` files:

.. code-block:: javascript

    const MapUI = goog.require('os.ui.MapUI');
    // reference the controller class as MapUI.Controller
    // reference the directive function as MapUI.directive

.. note:: This intentionally uses the name convention ``<class>UI`` both for clarity that it's a UI where referenced, and the avoid shadowing the native ``Map`` object when assigned to a variable of the same name.

To reference the UI in legacy ``goog.provide`` files:

.. code-block:: javascript

    goog.require('os.ui.MapUI');
    // reference the controller class as os.ui.MapUI.Controller
    // reference the directive function as os.ui.MapUI.directive

Backward Compatibility Shim
---------------------------

When converting existing UI's to modules, we would like to avoid breaking changes where possible. To avoid a breaking change with a converted module, we'll create a shim to provide the old namespaces. The shim needs to accomplish a couple things:

- Make the old namespaces available to ``goog.require`` statements.
- Deprecate the old namespaces so developers are aware of the change.

.. literalinclude:: src/map_shim.js
  :language: javascript
  :caption: ``src/os/ui/map_shim.js``

The shim will be maintained until all code referencing the old namespaces has been transitioned to directly reference the new module. After a suitable (TBD) amount of time has passed for developers to update their code, the shim will be deleted.

.. note:: New UI's do not need a shim because all references to them can be guaranteed to use the new format.

.. warning:: The deprecation warning will not appear as a result of ``goog.require``. The Closure compiler will only issue a warning if the old directive/controller references are invoked in code.

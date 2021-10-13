Import UI Launcher
------------------

Import UI Launchers are small classes that configure and launch a UI to let the user set options on the layer. Minimally this should let the user set the layer title and adjust the color.

.. literalinclude:: src/plugin/georss/georssimportui-launcher.js
  :caption: ``src/plugin/georss/georssimportui.js``:
  :linenos:
  :language: javascript

Now we will register our launcher in the plugin.

.. literalinclude:: src/plugin/georss/georssplugin-launcher.js
  :caption: ``src/plugin/georss/georssplugin.js``:
  :linenos:
  :language: javascript
  :emphasize-lines: 6, 9-11, 34-36

Run the build. This gets rid of the error, but our launcher does not launch anything! Let's fix that.

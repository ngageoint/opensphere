Content Type Detection
----------------------

The first thing we need to do for a file type is to detect the file type given a generic file. This is an XML format, so we can extend a generic XML content type detection class from OpenSphere.

.. literalinclude:: src/plugin/georss/georsstypemethod.js
  :caption: ``src/plugin/georss/georsstypemethod.js``:
  :linenos:
  :language: javascript

Now we will have our plugin register our content type class.

.. literalinclude:: src/plugin/georss/georssplugin.js-content_type
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 6,36-38

Save and run the build. You should now be able to import any atom feed (assuming the remote server has CORS configured; download it and import it as a file otherwise) into OpenSphere! Once it loads, it will complain that it does not have an import UI registered for 'georss', which is fine for now.

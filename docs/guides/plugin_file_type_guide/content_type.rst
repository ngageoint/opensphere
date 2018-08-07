Content Type Detection
----------------------

The first thing we need to do for a file type is to detect the file type given a generic file. This is an XML format, so we can extend a generic XML content type detection function from OpenSphere.

.. literalinclude:: src/plugin/georss/mime.js
  :caption: ``src/plugin/georss/mime.js``:
  :linenos:
  :language: javascript

As always, let's test it.

.. literalinclude:: test/plugin/georss/mime.test.js
  :caption: ``test/plugin/georss/mime.test.js``
  :linenos:
  :language: javascript

Run ``yarn test`` to try that out.

Now we will have our plugin require our mime package.

.. literalinclude:: src/plugin/georss/georssplugin.js-content_type
  :caption: ``src/plugin/georss/georssplugin.js``
  :linenos:
  :language: javascript
  :emphasize-lines: 6

Save and run the build. You should now be able to import any atom feed (assuming the remote server has CORS configured; download it and import it as a file otherwise) into OpenSphere! Once it loads, it will complain that it does not have an import UI registered for 'application/rss+xml+geo', which is fine for now.

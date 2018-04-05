(function() {
  var type;
  var status = $('#status');
  var to = 'opensphere';
  var from = to + '-addLayer';
  var str = window.location.hash;

  var isAlive = function() {
    var ping = window.localStorage.getItem(['xt', 'default', to, 'ping']);
    return ping && ping - Date.now() < 10000;
  };

  if (!window.localStorage) {
    status.append('<div class="error">Error: localStorage not present</div>');
    return;
  }

  if (!str) {
    status.html('<div class="error">Error: No URI-encoded file path or ' +
        'JSON string was found in the location fragment</div>');
    return;
  }

  status.append('<div>Adding layer(s) ... </div>');

  str = decodeURIComponent(str.substring(1));
  var data;

  if (str.startsWith('file=')) {
    data = {'url': str.substring(5)};
    type = 'file.load';
  } else {
    try {
      data = JSON.parse(str);
      type = 'addLayer';
    } catch (e) {
      status.append('<div class="error">Error: malformed JSON in fragment.</div>');
    }
  }

  if (!data) {
    status.html('<div class="error">Error: No URI-encoded file path or ' +
        'JSON string was found in the location fragment</div>');
    return;
  }

  if (!type) {
    status.html('<div class="error">Error: No message type was found</div>');
    return;
  }

  window.localStorage.setItem(
      ['xt', 'default', to, from].join('.'),
      JSON.stringify({'type': type, 'data': data, 'time': Date.now()}));

  if (!isAlive()) {
    window.location = window.location.toString().replace(/addlayer.html.*/g, '');
    status.append('<div>Launching {APP} ...</div>');
  } else {
    status.append('<div>Done! You can close this and switch over to {APP} to see your layer(s).</div>');
  }
})();

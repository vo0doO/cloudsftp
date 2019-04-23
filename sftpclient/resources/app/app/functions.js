setTimeout(function() {
  var InputMenu = electron.remote.Menu.buildFromTemplate([{
      label: 'Undo',
      role: 'undo',
    }, {
      label: 'Redo',
      role: 'redo',
    }, {
      type: 'separator',
    }, {
      label: 'Cut',
      role: 'cut',
    }, {
      label: 'Copy',
      role: 'copy',
    }, {
      label: 'Paste',
      role: 'paste',
    }, {
      type: 'separator',
    }, {
      label: 'Select all',
      role: 'selectall',
    },
  ]);

  document.body.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    e.stopPropagation();

    let node = e.target;

    while (node) {
      if (node.nodeName.match(/^(input|textarea)$/i) || node.isContentEditable) {
        InputMenu.popup(electron.remote.getCurrentWindow());
        break;
      }
      node = node.parentNode;
    }
  });
},100);

//prevent drag and drop on window by default
window.addEventListener('dragover', function (e) {
    e.dataTransfer.effectAllowed = 'none';
    e.preventDefault();
    return false;
}, false);
window.addEventListener('drop', function (e) {
    e.preventDefault();
}, false);

ftp.prototype.utf8 = function(cb) {
  if (this._feat.indexOf("UTF8") >= 0) {
    return this._send('OPTS UTF8 ON', cb);
  } else {
    cb("UTF8 Not Supported");
  }
};

ftp.prototype.putStream = function(path, zcomp, cb) {
  var self = this;
  if (typeof zcomp === 'function') {
    cb = zcomp;
    zcomp = false;
  }

  this._pasv(function(err, sock) {
    if (err)
      return cb(err);

    if (self._queue[0] && self._queue[0].cmd === 'ABOR') {
      sock.destroy();
      return cb();
    }

    // modify behavior of socket events so that we can emit 'error' once for
    // either a TCP-level error OR an FTP-level error response that we get when
    // the socket is closed (e.g. the server ran out of space).
    var sockerr, started = false, lastreply = false, done = false, source = sock;

    if (zcomp) {
      source = zlib.createInflate();
      sock.pipe(source);
      sock._emit = sock.emit;
      sock.emit = function(ev, arg1) {
        if (ev === 'error') {
          if (!sockerr)
            sockerr = arg1;
          return;
        }
        sock._emit.apply(sock, Array.prototype.slice.call(arguments));
      };
    }

    source._emit = source.emit;
    source.emit = function(ev, arg1) {
      if (ev === 'error') {
        if (!sockerr)
          sockerr = arg1;
        return;
      } else if (ev === 'end' || ev === 'close') {
        if (!done) {
          done = true;
          ondone();
        }
        return;
      }
      source._emit.apply(source, Array.prototype.slice.call(arguments));
    };

    function ondone() {
      if (done && lastreply) {
        self._send('MODE S', function() {
          source._emit('end');
          source._emit('close');
        }, true);
      }
    }

    sock.pause();

    if (zcomp) {
      self._send('MODE Z', function(err, text, code) {
        if (err) {
          sock.destroy();
          return cb(makeError(code, 'Compression not supported'));
        }
        sendRetr();
      }, true);
    } else {
      sendRetr();
    }

    function sendRetr() {
      // this callback will be executed multiple times, the first is when server
      // replies with 150, then a final reply after the data connection closes
      // to indicate whether the transfer was actually a success or not
      self._send('STOR ' + path, function(err, text, code) {
        if (sockerr || err) {
          sock.destroy();
          if (!started) {
            if (zcomp) {
              self._send('MODE S', function() {
                cb(sockerr || err);
              }, true);
            } else
              cb(sockerr || err);
          } else {
            source._emit('error', sockerr || err);
            source._emit('close', true);
          }
          return;
        }
        // server returns 125 when data connection is already open; we treat it
        // just like a 150
        if (code === 150 || code === 125) {
          started = true;
          cb(undefined, source);
          sock.resume();
        } else {
          lastreply = true;
          ondone();
        }
      }, true);
    }
  });
};

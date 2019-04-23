const path = require('path');
const { app, BrowserWindow, Menu, shell, systemPreferences } = require('electron');
const autoUpdater = require('./auto-updater');
const url = require('url');
const fs = require("fs");
const appData = app.getPath('appData');
const separator = (appData.indexOf('/') === -1 ? '\\' : '/');
const debug = /--debug/.test(process.argv[2]);
const windowConfigPath = path.join(appData, 'sftpclient', 'data', 'window.data');
const appConfigPath = path.join(appData, 'sftpclient', 'data', 'app.data');
const bookmarksPath = path.join(appData, 'sftpclient', 'data', 'bookmark.data');

let windowConfig;
try {
  windowConfig = JSON.parse(fs.readFileSync(windowConfigPath, 'utf8'));
} catch(e) { }
let appConfig = { theme: { shade: null } };
try {
  appConfig = JSON.parse(fs.readFileSync(appConfigPath, 'utf8'));
} catch(e) { }

let bookmarkData;
try {
  bookmarkData = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));
} catch (e) { }

let stopAccessingSecurityScopedResource = [];
if (process.mas || process.platform === 'darwin') {
  app.setName('sFTP Client');

  if (bookmarkData) {
    for (let i = 0, l = bookmarkData.length; i < l; i++) {
    }
  }
}

// Disable Hardware Acceleration - Causing Issue with StripeJS
app.disableHardwareAcceleration();

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'false';

const protocols = [
  'ftp',
  'sftp',
  'ftps',
  'ftpes',
  'ftpis',
  'ssh'
];

if (protocols) {
  for (const idx in protocols) {
    if (protocols[idx]) {
      const isDefaultAppProtocol = app.isDefaultProtocolClient(protocols[idx]);

      if (!isDefaultAppProtocol) {
        app.setAsDefaultProtocolClient(protocols[idx]);
      }
    }
  }
}

let mainWindow = null;

function initialize () {
  const shouldQuit = makeSingleInstance();
  if (shouldQuit) {
    return app.quit();
  }

  function createWindow () {
    let loadingWindow;

    const screen = require('electron').screen;
    const screenWidth = screen.getPrimaryDisplay().size.width;
    const screenHeight = screen.getPrimaryDisplay().size.height;

    const windowOptions = {
      title: app.getName(),
      width: screenWidth < 1200 ? screenWidth : 1200,
      height: screenHeight < 780 ? screenHeight : 800,
      minWidth: 1020,
      minHeight: 680,
      webPreferences: {
        webSecurity: false,
        nativeWindowOpen: true,
        experimentalCanvasFeatures: true,
        partition: 'persist:sftpclient'
      },
      show: false
    }

    if (windowConfig && windowConfig.bounds) {
      for (const bound in windowConfig.bounds) {
        if (windowConfig.bounds[bound]) {
          windowOptions[bound] = windowConfig.bounds[bound];
        }
      }
    }

    if (process.platform === 'linux' || process.platform === 'freebsd') {
      windowOptions.icon = path.join(__dirname, 'assets', 'icons', 'png', '64x64.png');
    } else if (/^win/i.test(process.platform)) {
      windowOptions.icon = path.join(__dirname, 'assets', 'icons', 'win', 'icon.ico');
    } else if (process.platform === 'darwin' || process.mas) {
      windowOptions.icon = path.join(__dirname, 'assets', 'icons', 'mac', 'icon.icns');
    }

    // Set loading window options
    const loadingOptions = JSON.parse(JSON.stringify(windowOptions));
    const loadingWindowOptions = Object.assign(loadingOptions, {
      width: 260,
      height: 240,
      minWidth: 260,
      minHeight: 240,
      x: null,
      y: null,
      show: true,
      frame: false,
      transparent: true,
      toolbar: false
    });

    // and load the loading.html of the app.
    if (process.platform === 'linux' || process.platform === 'freebsd') {
      loadingWindowOptions.backgroundColor = '#1E3642';

      // Show loading window whilst we load main window
      loadingWindow = new BrowserWindow(loadingWindowOptions);

      loadingWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/loading_alt.html'),
        protocol: 'file:',
        slashes: true
      }));
    } else {
      // Show loading window whilst we load main window
      loadingWindow = new BrowserWindow(loadingWindowOptions);

      loadingWindow.loadURL(url.format({
        pathname: path.join(__dirname, '/loading.html'),
        protocol: 'file:',
        slashes: true
      }));
    }

    if (process.platform === 'darwin' && systemPreferences.isDarkMode()) {
      if (appConfig.theme === null || appConfig.theme === 'dark') {
        windowOptions.darkTheme = true;
        windowOptions.backgroundColor = '#313131';
      }
    } else {
      windowOptions.backgroundColor = 'none';
    }

    // Create the browser window.
    mainWindow = new BrowserWindow(windowOptions);

    // and load the index.html of the app.
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, '/index.html'),
      protocol: 'file:',
      slashes: true
    }));

    if (debug) {
      mainWindow.webContents.openDevTools();
    }

    mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
        loadingWindow.close();
        mainWindow.show();
      }, 500);
    });

    mainWindow.on('close', () => {
      const newWindowConfig = {
        bounds: mainWindow.getBounds()
      };

      try {
        fs.writeFileSync(windowConfigPath, JSON.stringify(newWindowConfig));
      } catch (e) { }

      if (process.mas) {
        if (stopAccessingSecurityScopedResource.length > 0) {
          for (let i = 0, l = stopAccessingSecurityScopedResource.length; i < l; i++) {
              stopAccessingSecurityScopedResource[i]();
          }
        }
      }
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  app.on('ready', () => {
    createWindow();
    autoUpdater.initialize();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
}

function makeSingleInstance () {
  if (process.mas) {
    return false;
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.focus();
    }
  });
}

switch (process.argv[1]) {
  case '--squirrel-install':
    autoUpdater.createShortcut(() => {
      app.quit();
    });
    break;
  case '--squirrel-uninstall':
    autoUpdater.removeShortcut(() => {
      app.quit();
    });
    break;
  case '--squirrel-obsolete':
  case '--squirrel-updated':
    app.quit();
    break;
  default:
    initialize();
}

let template = [{
  label: 'Edit',
  submenu: [{
    label: 'Undo',
    accelerator: 'CmdOrCtrl+Z',
    role: 'undo'
  }, {
    label: 'Redo',
    accelerator: 'Shift+CmdOrCtrl+Z',
    role: 'redo'
  }, {
    type: 'separator'
  }, {
    label: 'Cut',
    accelerator: 'CmdOrCtrl+X',
    role: 'cut'
  }, {
    label: 'Copy',
    accelerator: 'CmdOrCtrl+C',
    role: 'copy'
  }, {
    label: 'Paste',
    accelerator: 'CmdOrCtrl+V',
    role: 'paste'
  }, {
    label: 'Select All',
    accelerator: 'CmdOrCtrl+A',
    role: 'selectall'
  }]
}, {
  label: 'View',
  submenu: [{
    label: 'Reload',
    accelerator: 'CmdOrCtrl+R',
    click: (item, focusedWindow) => {
      if (focusedWindow) {
        if (focusedWindow.id === 1) {
          BrowserWindow.getAllWindows().forEach(win => {
            if (win.id > 1) win.close();
          });
        }
        focusedWindow.reload();
      }
    }
  }]
}, {
  label: 'Window',
  role: 'window',
  submenu: [{
    label: 'Minimize',
    accelerator: 'CmdOrCtrl+M',
    role: 'minimize'
  }, {
    label: 'Close',
    accelerator: 'CmdOrCtrl+W',
    role: 'close'
  }, {
    type: 'separator'
  }, {
    label: 'Reopen Window',
    accelerator: 'CmdOrCtrl+Shift+T',
    enabled: false,
    key: 'reopenMenuItem',
    click: () => {
      app.emit('activate');
    }
  }]
}, {
  label: 'Help',
  role: 'help',
  submenu: [{
    label: 'Help Centre',
    click: () => {
      shell.openExternal('https://help.sftpapp.com');
    }
  }]
}]

function addUpdateMenuItems (items, position) {
  if (process.mas) {
    return;
  }

  /*
  const version = app.getVersion()
  let updateItems = [{
    label: `Version ${version}`,
    enabled: false
  }, {
    label: 'Checking for Update',
    enabled: false,
    key: 'checkingForUpdate'
  }, {
    label: 'Check for Update',
    visible: false,
    key: 'checkForUpdate',
    click: () => {
      require('electron').autoUpdater.checkForUpdates()
    }
  }, {
    label: 'Restart and Install Update',
    enabled: true,
    visible: false,
    key: 'restartToUpdate',
    click: () => {
      require('electron').autoUpdater.quitAndInstall()
    }
  }]

  items.splice.apply(items, [position, 0].concat(updateItems))
  */
}

function findReopenMenuItem () {
  const menu = Menu.getApplicationMenu();
  if (!menu) {
    return;
  }

  let reopenMenuItem;

  menu.items.forEach(item => {
    if (item.submenu) {
      item.submenu.items.forEach(item => {
        if (item.key === 'reopenMenuItem') {
          reopenMenuItem = item;
        }
      });
    }
  });

  return reopenMenuItem;
}

if (process.platform === 'darwin') {
  const name = app.getName();

  template.unshift({
    label: name,
    submenu: [{
      label: `About ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      label: 'Services',
      role: 'services',
      submenu: []
    }, {
      type: 'separator'
    }, {
      label: `Hide ${name}`,
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: 'Hide Others',
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: 'Show All',
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: 'Quit',
      accelerator: 'Command+Q',
      click: () => {
        app.quit();
      }
    }]
  });

  // Window menu.
  template[3].submenu.push({
    type: 'separator'
  }, {
    label: 'Bring All to Front',
    role: 'front'
  });

  addUpdateMenuItems(template[0].submenu, 1);
}

if (process.platform === 'win32') {
  const helpMenu = template[template.length - 1].submenu;
  addUpdateMenuItems(helpMenu, 0);
}

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

app.on('browser-window-created', () => {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = false;
});

app.on('window-all-closed', () => {
  let reopenMenuItem = findReopenMenuItem();
  if (reopenMenuItem) reopenMenuItem.enabled = true;
});

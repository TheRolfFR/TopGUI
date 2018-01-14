const electron = require('electron');
const {session} = require('electron');
const {app, BrowserWindow, Tray, Menu, ipcMain} = electron;
let navigator;
let test;


function navigation() {
  navigator = new BrowserWindow({
    transparent: true,
    alwaysOnTop: true,
    frame: false,
    width: 800,
    'minWidth': 300,
    height: 600,
    'minHeight': 160,
    maximized: false,
    movable: true,
    title: 'Topgui',
    icon: 'img/Topgui.ico',
    backgroundColor: '#94c8f7',
    show: false
  });

  navigator.setMenu(null);

  navigator.loadURL(`file://${__dirname}/navigator.html`, {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0'
  });

  // navigator.webContents.openDevTools();

  navigator.on('closed', () => {
    navigator = null;
  });

  navigator.once('ready-to-show', () => {
    navigator.show()
  });
}

ipcMain.on('messageNavigator', (event) => {
  if(navigator != null) {
    if(navigator.isVisible()) {
      navigator.hide();
    } else {
      navigator.show();
    }
  }
});

// send message to nav to say
ipcMain.on('navHoverReq', (event) => {
  var msg = 'f';
	var screenElectron = electron.screen;
  var cursor = screenElectron.getCursorScreenPoint();
  
  if(navigator != null) {
    if(navigator.isVisible()) {
      rect = navigator.getBounds();
      if ( ( rect['x'] < cursor['x'] ) && ( cursor['x'] < (rect['x']+rect['width'])) ) {
        if( ( rect['y'] < cursor['y'] ) && ( cursor['y'] < (rect['y']+rect['height'])) ) {
          msg = 't';
        }
      }
    }
  }

  event.sender.send('navHoverMsg', msg);
});

app.on('ready', () => {
  session.fromPartition('', { cache: false });
  navigation();

  /*test = new BrowserWindow({
    transparent: true,
    alwaysOnTop: true,
    frame: false,
    width: 800,
    'minWidth': 300,
    height: 600,
    'minHeight': 160,
    maximized: false,
    movable: true,
    title: 'Topgui',
    icon: 'img/Topgui.ico'
  });

  test.setMenu(null);

  test.loadURL(`http://pushbullet.com/`);

  test.webContents.openDevTools();

  navigator.on('closed', () => {
    navigator = null;
  });*/
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  navigation();
});

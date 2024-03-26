import webview
from Controller import HomeController



localization = {
    'global.quitConfirmation': u'确定退出程序?',
    'global.ok': u'OK',
    'global.quit': u'Quit',
    'global.cancel': u'Cancel',
    'global.saveFile': u'Save file',
    'cocoa.menu.about': u'About',
    'cocoa.menu.services': u'Services',
    'cocoa.menu.view': u'View',
    'cocoa.menu.hide': u'Hide',
    'cocoa.menu.hideOthers': u'Hide Others',
    'cocoa.menu.showAll': u'Show All',
    'cocoa.menu.quit': u'Quit',
    'cocoa.menu.fullscreen': u'Enter Fullscreen',
    'windows.fileFilter.allFiles': u'All files',
    'windows.fileFilter.otherFiles': u'Other file types',
    'linux.openFile': u'Open file',
    'linux.openFiles': u'Open files',
    'linux.openFolder': u'Open folder',
}

if __name__ == "__main__":
    api = HomeController.JsApi()
    w = webview.create_window('Android Script', 'index.html',width=1368,height=785,frameless=False,js_api=api,confirm_close=False)
    #api.GetWindow(w)
    webview.start(http_server=True,localization=localization,debug=False)
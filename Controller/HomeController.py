import uiautomator2 as u2
from Controller import Util,Automation
from time import sleep
import json,os,re
import webview

class JsApi():
    def __init__(self):
        self.deviceStatus = False
        self.deviceAdd = "127.0.0.1"
        self.devicePort = 5555
        self.deviceInfo = ""
        data = os.path.exists("deviceinfo.json")
        if data:
            with open("deviceinfo.json",'r') as j:
                jsonData = json.load(j)
                self.deviceAdd = jsonData["deviceAdd"]
                self.devicePort = jsonData["devicePort"]
    def GetDeviceInfo(self):
        data = {"deviceStatus":self.deviceStatus,"deviceAdd":self.deviceAdd,"devicePort":self.devicePort,"deviceInfo":self.deviceInfo}
        return data
    def ConnectDevice(self,addr,port):
        try:
            self.d = u2.connect(f"{addr}:{port}")
            self.deviceInfo = self.d.info
            self.deviceStatus = True
            self.deviceAdd = addr
            self.devicePort = port
            jsonData = {"deviceAdd":self.deviceAdd,"devicePort":self.devicePort}
            with open("deviceinfo.json","w") as f:
                json.dump(jsonData,f)
        except Exception as r:
            self.deviceInfo = str(r)
        return {"deviceStatus":self.deviceStatus,"deviceInfo":self.deviceInfo}
    #获取屏幕截图
    def DeviceScreenshot(self):
        image = self.d.screenshot()
        base64Str = Util.image_to_base64(image)
        base64Str = base64Str.decode('gbk')
        return base64Str
    #获取元素结构信息
    def DeviceHierarchy(self):
        page_xml = self.d.dump_hierarchy(pretty=True)
        page_json = Util.android_hierarchy_to_json(
            page_xml.encode('utf-8'))
        return page_json
    #点击屏幕坐标
    def ClickScreenCoordinates(self,x,y):
        self.d.click(x, y)
        return
    #滑动屏幕
    def SwipeScreen(self,sx,sy,ex,ey):
        self.d.swipe(sx, sy, ex, ey)
        return
    #保存文件
    def SaveFileView(self,text):
        result = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG, directory='/', save_filename='flow.py',file_types=('代码文件 (*.py)', 'All files (*.*)'))
        if result == None:
            return ''
        with open(result,'w') as f:
            f.write(text)
        pass
    #导入文件
    def OpenFileView(self):
        result = webview.windows[0].create_file_dialog(webview.OPEN_DIALOG, allow_multiple=False, file_types=('代码文件 (*.py)', 'All files (*.*)'))
        if result == None:
            return ''
        data = ''
        with open(result[0],'r') as f:
            data = f.read()
        return data
    #执行代码
    def ExecFile(self,code):
        namespace = {}
        if(self.deviceStatus):
            code = re.sub(r'.+connect.+',"",code)
            namespace = {'d':self.d}
            exec(code,namespace)
        else:
            exec(code,namespace)
        logData = {}
        for key,value in namespace.items():
            if isinstance(value, str):
                logData[key] = value
            elif isinstance(value, int):
                logData[key] = value
            elif isinstance(value, float):
                logData[key] = value
            elif isinstance(value,list):
                logData[key] = "|".join(str(i) for i in value)
        return logData
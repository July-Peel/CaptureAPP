$(document).ready(function () {
    var editors = Copenhagen.initSelectorAll('.editor')[0];

    $("#captabElement").hide();
    $("#deviceInfo").hide();
    $("#connLoading").hide();

    //添加动作
    $(".ActionBtn").click(function () {
        const btnType = this.innerText;
        let code = editors.getValue();

        let xpath = $("#xpathPath").val();
        let coordinate = $("#coordinate").val();
        var x = 0, y = 0;
        if (coordinate != "") {
            coordinate = coordinate.replace("X:", "").replace("Y:", "")
            var coo = coordinate.split(',');
            x = coo[0];
            y = coo[1]
        }

        switch (btnType) {
            case "点击元素":
                code = MergeText(code, `d.xpath('${xpath}').click()`);
                break
            case "获取元素文本":
                code = MergeText(code, `var1 = d.xpath('${xpath}').get().text`);
                break
            case "设置元素文本":
                code = MergeText(code, `d.xpath('${xpath}').set_text('value')`);
                break
            case "元素是否存在":
                code = MergeText(code, `var1 = d.xpath('${xpath}').exists`);
                break
            case "等待元素出现":
                code = MergeText(code, `d.xpath('${xpath}').wait(timeout=15)`);
                break
            case "等待元素消失":
                code = MergeText(code, `d.xpath('${xpath}').wait_gone(timeout=15)`);
                break
            case "设备按键":
                code = MergeText(code, `d.press('s')`);
                break
            case "点击屏幕":
                code = MergeText(code, `d.click(${x}, ${y})`);
                break
            case "双击屏幕":
                code = MergeText(code, `d.double_click(${x}, ${y})`);
                break
            case "长按屏幕":
                code = MergeText(code, `d.long_click(${x}, ${y}, 1)`);
                break
            case "滑动屏幕":
                code = MergeText(code, `d.swipe(${x}, ${y}, ${x}, ${y}, 1)`);
                break
            case "元素截图":
                code = MergeText(code, `d.xpath('${xpath}').get().screenshot().save('image.png')`);
                break
            case "获取相似元素":
                code = MergeText(code, `var1 = d.xpath('${xpath}').all()`);
                break
            case "获取包名":
                code = MergeText(code, `var1 = d.xpath('${xpath}').get().info['packageName']`);
                break
            case "启动应用":
                code = MergeText(code, `d.app_start('appName')`);
                break
            case "关闭应用":
                code = MergeText(code, `d.app_stop('appName')`);
                break
        }

        editors.setValue(code);
        editors.scrollPage("down");
        $("#captabElement").hide();
        $("#xpathPath").val("");
        $("#coordinate").val("");
    })

    var Timeinterval = null;

    //捕获
    $("#captab").change(function () {
        let ISCaptab = $("#captab").is(':checked')
        let ISrefresh = $("#refresh").is(':checked')
        if (ISCaptab) {
            if (ISrefresh) {
                window.clearInterval(Timeinterval);
                Timeinterval = null;
                StopSimulationOperation();//停止操作屏幕
            }

            StartCaptureControl();//开启捕获元素
            $("#captabElement").show();
            $("#xpathPath").val("");
            $("#coordinate").val("");
        } else {
            if (ISrefresh) {
                Timeinterval = setInterval(GetScreen, 450);
                StartSimulationOperation();//开启自动刷新时可操作屏幕
            }
            var x = $("#xpathPath").val();
            if (x == "") {
                $("#captabElement").hide();
                $("#xpathPath").val("");
                $("#coordinate").val("");
            }
            StopCaptureControl();//停止捕获元素
        }
    })

    //定时刷新
    $("#refresh").change(function () {
        let ISrefresh = $("#refresh").is(':checked')
        if (ISrefresh) {
            Timeinterval = setInterval(GetScreen, 450);
            StartSimulationOperation();//开启自动刷新时可操作屏幕
        } else {
            window.clearInterval(Timeinterval);
            Timeinterval = null;
            StopSimulationOperation();//停止操作屏幕
        }
    })

    //手动刷新
    $("#refreshBtn").click(function () {
        GetScreen();
    })

    //保存
    $("#saveFile").click(async function () {
        let code = editors.getValue();
        await pywebview.api.SaveFileView(code);
    })

    //导入
    $("#importFile").click(async function () {
        let code = await pywebview.api.OpenFileView();
        editors.setValue(code);
    })

    //设备状态
    $("#device").click(function () {
        GetDeviceInfo();
    })

    //设备连接
    $("#connDevice").click(async function () {
        const addr = $("#deviceAddr").val();
        const port = $("#devicePort").val();
        $("#connLoading").show();
        let data = await pywebview.api.ConnectDevice(addr, port);
        if (data.deviceStatus) {
            GetDeviceInfo();
            const width = data.deviceInfo['displayWidth'];
            const height = data.deviceInfo['displayHeight'];

            resizeScreen(width, height)
            GetScreen()

            let code = editors.getValue();
            code = MergeText(code, "d = u2.connect('" + addr + ":" + port + "')");
            editors.setValue(code);
        } else {
            $("#deviceInfo").show();
            $("#deviceInfo").val(data.deviceInfo);
        }
        $("#connLoading").hide();
    })

    //代码运行
    $("#codeExec").click(function () {
        let code = editors.getValue();
        ExecCode(code);
    })


});

//合并代码
function MergeText(sourceText, tergetText) {
    let NewText = sourceText + tergetText;
    return NewText;
}

//执行代码
async function ExecCode(code) {
    let log = await pywebview.api.ExecFile(code);
    let keys = Object.keys(log);
    let values = Object.values(log);
    log = "";
    for (var i = 0; i < keys.length; i++) {
        log = log + `${keys[i]} --> ${values[i]}\r\n`;
    }
    $("#runLog").val(log);
    var textarea = document.getElementById('runLog');
    textarea.scrollTop = textarea.scrollHeight;
}


async function GetDeviceInfo() {
    let data = await pywebview.api.GetDeviceInfo();
    $("#deviceAddr").val(data.deviceAdd)
    $("#devicePort").val(data.devicePort)
    if (data.deviceStatus) {
        $("#deviceStatus").text("设备已连接");
        $("#deviceStatus").css("color", "green");
        $("#deviceInfo").show();
        $("#deviceInfo").val(JSON.stringify(data.deviceInfo));
    } else {
        $("#deviceStatus").text("设备未连接");
        $("#deviceStatus").css("color", "red");
    }
}


var ScreenWidth = 0, ScreenHeight = 0, bl = 0, pyTopY = 56;
var bgcanvas = document.getElementById('bgCanvas');
var fgcanvas = document.getElementById('fgCanvas');
let originNodes = [], nodeMaps = {}, mapAttrCount = {}, nodeHovered = null;;

function resizeScreen(w, h) {
    bl = 348 / w;
    ScreenHeight = h * bl + 45;
    ScreenWidth = 348;

    fgcanvas.width = bgcanvas.width = ScreenWidth;
    fgcanvas.height = bgcanvas.height = ScreenHeight;
}



//更新截图
async function GetScreen() {
    var Base64Txt = await pywebview.api.DeviceScreenshot();
    Base64Txt = 'data:image/jpg;base64,' + Base64Txt;
    var dtd = $.Deferred();
    var ctx = bgcanvas.getContext('2d');
    var img = new Image();
    img.src = Base64Txt;
    img.onload = function () {
        ctx.drawImage(img, 0, 0, ScreenWidth, ScreenHeight);

        img.onload = img.onerror = null
        img.src = Base64Txt
        img = null
        dtd.resolve();
    }
}

//更新层级
async function GetHierarchy() {
    originNodes = [], nodeMaps = {};
    var HierarchyData = await pywebview.api.DeviceHierarchy();
    drawAllNodeFromSource(HierarchyData)
}

//绘制线条
function drawAllNodeFromSource(source) {
    function sourceToNodes(source) {
        let node = Object.assign({}, source); //, { children: undefined });
        nodeMaps[node._id] = node;
        let nodes = [node];
        if (source.children) {
            source.children.forEach(function (s) {
                s._parentId = node._id;
                nodes = nodes.concat(sourceToNodes(s))
            })
        }
        return nodes;
    }

    originNodes = sourceToNodes(source)

    drawAllNode(originNodes);
}

function drawAllNode(nodes) {
    var ctx = fgcanvas.getContext('2d');
    ctx.clearRect(0, 0, ScreenWidth, ScreenHeight);
    nodes.forEach(function (node) {
        if (['Layout'].includes(node.type)) {
            return;
        }
        drawNode(node, 'black', true);
    })
}

function drawNode(node, color, dashed) {
    if (!node || !node.rect) {
        return;
    }
    var x = node.rect.x * bl,
        y = node.rect.y * bl,
        w = node.rect.width * bl,
        h = node.rect.height * bl;
    color = color || 'black';
    var ctx = fgcanvas.getContext('2d');
    var rectangle = new Path2D();
    rectangle.rect(x, y, w, h);
    if (dashed) {
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 10]);
    } else {
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
    }
    ctx.strokeStyle = color;
    ctx.stroke(rectangle);
}

//捕获元素
function StartCaptureControl() {
    GetHierarchy();
    nodeHovered = null;
    fgcanvas.addEventListener('mousemove', mouseHoverListener);
    fgcanvas.addEventListener('mousedown', mouseDownListener);
}

function mouseHoverListener(event) {
    var e = event;
    if (e.originalEvent) {
        e = e.originalEvent
    }
    if (e.which === 3) {
        return
    }
    var ctx = fgcanvas.getContext('2d');
    ctx.clearRect(0, 0, ScreenWidth, ScreenHeight);

    var pos = { x: e.x, y: e.y - pyTopY };//坐标偏移，保证左上角在原点
    var nodeHoveredList = findNodesByPosition(pos);
    nodeHovered = nodeHoveredList[0];
    drawNode(nodeHovered, 'red');
}

function mouseDownListener(event) {
    var data = elemXPathLite(nodeHovered);

    var pos = { x: event.x, y: event.y - pyTopY };//坐标偏移，保证左上角在原点
    var x = pos.x / bl;
    var y = pos.y / bl;

    $("#xpathPath").val(data)
    $("#coordinate").val("X:" + Math.round(x) + ",Y:" + Math.round(y))
    $("#captabElement").show();
    //$("#captab").click(); //取消捕获
}

//停止捕获元素
function StopCaptureControl() {
    var ctx = fgcanvas.getContext('2d');
    ctx.clearRect(0, 0, ScreenWidth, ScreenHeight);
    fgcanvas.removeEventListener('mousemove', mouseHoverListener);
    fgcanvas.removeEventListener('mousedown', mouseDownListener);
    originNodes = [], nodeMaps = {}, mapAttrCount = {};
}


function findNodesByPosition(pos) {
    function isInside(node, x, y) {
        if (!node.rect) {
            return false;
        }
        var lx = node.rect.x * bl,
            ly = node.rect.y * bl,
            rx = node.rect.width * bl + lx,
            ry = node.rect.height * bl + ly;
        return lx < x && x < rx && ly < y && y < ry;
    }

    function nodeArea(node) {
        return node.rect.width * node.rect.height * bl;
    }

    let activeNodes = originNodes.filter(function (node) {
        if (!isInside(node, pos.x, pos.y)) {
            return false;
        }
        // skip some types
        if (['Layout', 'Sprite'].includes(node.type)) {
            return false;
        }
        return true;
    })

    activeNodes.sort((node1, node2) => {
        return nodeArea(node1) - nodeArea(node2)
    })
    return activeNodes;
}

function elemXPathLite(node) {

    mapAttrCount = {}
    originNodes.forEach((n) => {
        incrAttrCount("label", n.label)
        incrAttrCount("resourceId", n.resourceId)
        incrAttrCount("text", n.text)
        incrAttrCount("_type", n._type)
        incrAttrCount("description", n.description)
    })

    const array = [];
    while (node && node._parentId) {
        const parent = nodeMaps[node._parentId]
        if (getAttrCount("label", node.label) === 1) {
            array.push(`*[@label="${node.label}"]`)
            break
        }
        else if (getAttrCount("resourceId", node.resourceId) === 1) {
            array.push(`*[@resource-id="${node.resourceId}"]`)
            break
        }
        // else if (getAttrCount("text", node.text) === 1) {
        //     array.push(`*[@text="${node.text}"]`)
        //     break
        // } 
        // else if (getAttrCount("description", node.description) === 1) {
        //     array.push(`*[@content-desc="${node.description}"]`)
        //     break
        // }
        else if (getAttrCount("_type", node._type) === 1) {
            array.push(`${node._type}`)
            break
        }
        else if (!parent) {
            array.push(`${node._type}`)
        }
        else {
            let index = 0;
            parent.children.some((n) => {
                if (n._type == node._type) {
                    index++
                }
                return n._id == node._id
            })
            array.push(`${node._type}[${index}]`)
        }
        node = parent;
    }
    return `//${array.reverse().join("/")}`
}

function getAttrCount(collectionKey, key) {
    let mapCount = mapAttrCount[collectionKey];
    if (!mapCount) {
        return 0
    }
    return mapCount[key] || 0;
}

function incrAttrCount(collectionKey, key) {
    if (!mapAttrCount.hasOwnProperty(collectionKey)) {
        mapAttrCount[collectionKey] = {}
    }
    let count = mapAttrCount[collectionKey][key] || 0;
    mapAttrCount[collectionKey][key] = count + 1;
}

//开启模拟屏幕操作
var startPot = { x: 0, y: 0 }
function StartSimulationOperation() {
    $("#bgCanvas").attr('style', 'z-index: 2;');
    startPot = { x: 0, y: 0 }
    function mouseHoverListener(event) {
        var e = event;
        if (e.originalEvent) {
            e = e.originalEvent
        }
        if (e.which === 3) {
            return
        }
        var pos = { x: e.x, y: e.y - pyTopY };//坐标偏移，保证左上角在原点
        var x = pos.x / bl;
        var y = pos.y / bl;
    }
    //bgcanvas.addEventListener('mousemove', mouseHoverListener);//鼠标移动

    bgcanvas.addEventListener('mousedown', BgmouseDownListener);//鼠标按下
    bgcanvas.addEventListener('mouseup', BgmouseUpListener);//鼠标抬起
}

function BgmouseDownListener(event) {
    var e = event;
    if (e.originalEvent) {
        e = e.originalEvent
    }
    if (e.which === 3) {
        return
    }
    var pos = { x: e.x, y: e.y - pyTopY };//坐标偏移，保证左上角在原点
    startPot.x = pos.x / bl;
    startPot.y = pos.y / bl;
}

function BgmouseUpListener(event) {
    var e = event;
    if (e.originalEvent) {
        e = e.originalEvent
    }
    if (e.which === 3) {
        return
    }
    var pos = { x: e.x, y: e.y - pyTopY };//坐标偏移，保证左上角在原点
    var x = pos.x / bl;
    var y = pos.y / bl;
    if (startPot.x == x && startPot.y == y) {
        pywebview.api.ClickScreenCoordinates(x, y);
    } else {
        pywebview.api.SwipeScreen(startPot.x, startPot.y, x, y);
    }
}

//停止模拟屏幕操作
function StopSimulationOperation() {
    $("#bgCanvas").attr('style', 'z-index: 0;')
    bgcanvas.removeEventListener('mousedown', BgmouseDownListener);
    bgcanvas.removeEventListener('mouseup', BgmouseUpListener);
}
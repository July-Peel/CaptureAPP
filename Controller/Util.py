import re
import base64
from io import BytesIO
from PIL import Image
import re
import xml.dom.minidom
import uuid


def image_to_base64(img):
    output_buffer = BytesIO()
    img.save(output_buffer, format='JPEG')
    byte_data = output_buffer.getvalue()
    base64_str = base64.b64encode(byte_data)
    return base64_str

def base64_to_image(base64_str, image_path=None):
    base64_data = re.sub('^data:image/.+;base64,', '', base64_str)
    byte_data = base64.b64decode(base64_data)
    image_data = BytesIO(byte_data)
    img = Image.open(image_data)
    if image_path:
        img.save(image_path)
    return img

def parse_bounds(text):
    m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', text)
    if m is None:
        return None
    (lx, ly, rx, ry) = map(int, m.groups())
    return dict(x=lx, y=ly, width=rx - lx, height=ry - ly)


def safe_xmlstr(s):
    return s.replace("$", "-")


def str2bool(v):
    return v.lower() in ("yes", "true", "t", "1")


def str2int(v):
    return int(v)


def convstr(v):
    return v


__alias = {
    'class': '_type',
    'resource-id': 'resourceId',
    'content-desc': 'description',
    'long-clickable': 'longClickable',
    'bounds': 'rect',
}

__parsers = {
    '_type': safe_xmlstr, # node className
    # Android
    'rect': parse_bounds,
    'text': convstr,
    'resourceId': convstr,
    'package': convstr,
    'checkable': str2bool,
    'scrollable': str2bool,
    'focused': str2bool,
    'clickable': str2bool,
    'selected': str2bool,
    'longClickable': str2bool,
    'focusable': str2bool,
    'password': str2bool,
    'index': int,
    'description': convstr,
    # iOS
    'name': convstr,
    'label': convstr,
    'x': str2int,
    'y': str2int,
    'width': str2int,
    'height': str2int,
    # iOS && Android
    'enabled': str2bool,
}


def _parse_uiautomator_node(node):
    ks = {}
    for key, value in node.attributes.items():
        key = __alias.get(key, key)
        f = __parsers.get(key)
        if value is None:
            ks[key] = None
        elif f:
            ks[key] = f(value)
    if 'bounds' in ks:
        lx, ly, rx, ry = map(int, ks.pop('bounds'))
        ks['rect'] = dict(x=lx, y=ly, width=rx - lx, height=ry - ly)
    return ks


def get_android_hierarchy(d):
    page_xml = d.dump_hierarchy(compressed=False, pretty=False).encode('utf-8')
    return android_hierarchy_to_json(page_xml)


def android_hierarchy_to_json(page_xml: bytes):
    """
    Returns:
        JSON object
    """
    dom = xml.dom.minidom.parseString(page_xml)
    root = dom.documentElement

    def travel(node):
        """ return current node info """
        if node.attributes is None:
            return
        json_node = _parse_uiautomator_node(node)
        json_node['_id'] = str(uuid.uuid4())
        if node.childNodes:
            children = []
            for n in node.childNodes:
                child = travel(n)
                if child:
                    # child["_parent"] = json_node["_id"]
                    children.append(child)
            json_node['children'] = children
        return json_node

    return travel(root)


def get_ios_hierarchy(d, scale):
    sourcejson = d.source(format='json')

    def travel(node):
        node['_id'] = str(uuid.uuid4())
        node['_type'] = node.pop('type', "null")
        if node.get('rect'):
            rect = node['rect']
            nrect = {}
            for k, v in rect.items():
                nrect[k] = v * scale
            node['rect'] = nrect

        for child in node.get('children', []):
            travel(child)
        return node

    return travel(sourcejson)


def get_webview_hierarchy(d):
    pass
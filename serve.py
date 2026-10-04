"""带 no-cache 头的 HTTP 服务器（支持局域网访问）"""
import http.server
import socketserver
import socket
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def get_lan_ip():
    """获取本机局域网 IP（尝试连接外网来推断，失败则回退 127.0.0.1）"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return "127.0.0.1"

lan_ip = get_lan_ip()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
    print("=" * 50)
    print(f"  本机访问:   http://localhost:{PORT}")
    print(f"  局域网访问: http://{lan_ip}:{PORT}")
    print("=" * 50)
    print("提示: 若其他电脑无法访问，请以管理员身份运行 PowerShell 执行:")
    print(f'  netsh advfirewall firewall add rule name="医院信息系统" dir=in action=allow protocol=TCP localport={PORT}')
    print("=" * 50)
    httpd.serve_forever()

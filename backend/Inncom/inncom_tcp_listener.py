import socket
from datetime import datetime

HOST = "0.0.0.0"
PORT = 3003

def log_data(data):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open("inncom_tcp.log", "a", encoding="utf-8") as f:
        f.write(f"{now} <- {len(data)} bytes\n")
        f.write("HEX : " + " ".join(f"{b:02X}" for b in data) + "\n")
        try:
            decoded = data.decode("ascii", errors="ignore")
            f.write("TEXT: " + decoded + "\n")
        except Exception:
            f.write("TEXT: [could not decode]\n")
        f.write("-" * 64 + "\n")

def start_server():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))
        s.listen(5)
        print(f"[*] Listening on {HOST}:{PORT}...")

        while True:
            conn, addr = s.accept()
            with conn:
                print(f"[+] Connection from {addr}")
                while True:
                    data = conn.recv(1024)
                    if not data:
                        break
                    log_data(data)

if __name__ == "__main__":
    start_server()

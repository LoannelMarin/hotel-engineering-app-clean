import socket
import threading
from datetime import datetime

HOST = '0.0.0.0'
PORT = 3003  # Debe coincidir con IP_DESTINATION y PORT del WSCon.cfg

# Funciones auxiliares para parsear los datos (puedes expandir esto)
def parse_packet(packet: bytes):
    if len(packet) < 10:
        return None

    # Ejemplo básico de extracción
    header = packet[:2]
    if header != b'\xff\xa2':
        return None

    room_number = int.from_bytes(packet[12:14], 'big')
    temp_raw = int.from_bytes(packet[14:16], 'big')
    temp_f = round(temp_raw / 16.0, 1)  # Conversión aproximada

    return {
        'timestamp': datetime.now().isoformat(timespec='seconds'),
        'room': room_number,
        'temperature': temp_f,
        'raw_hex': packet.hex().upper(),
    }

def client_handler(conn, addr):
    print(f"[+] Connected from {addr}")
    try:
        while True:
            data = conn.recv(1024)
            if not data:
                break

            parsed = parse_packet(data)
            if parsed:
                print(f"[{parsed['timestamp']}] Room {parsed['room']} → {parsed['temperature']} °F")
            else:
                print(f"[?] Raw: {data.hex().upper()}")
    except Exception as e:
        print(f"[!] Error: {e}")
    finally:
        conn.close()
        print(f"[-] Disconnected from {addr}")

def start_listener():
    print(f"[*] Listening on {HOST}:{PORT}...")
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        s.bind((HOST, PORT))
        s.listen()
        while True:
            conn, addr = s.accept()
            thread = threading.Thread(target=client_handler, args=(conn, addr))
            thread.start()

if __name__ == '__main__':
    start_listener()

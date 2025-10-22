#!/usr/bin/env python3
# live_decode_socket_v11_all_rooms_fixed_single_table_log_corrected_with_delta.py
import socket
import os
import csv
from datetime import datetime
import time
import requests


HOST = "127.0.0.1"
PORT = 3005
LOG_FILE = "room_log.csv"

# --- Tabla calibrada (Bytes → Temp°F) completa ---
B21B22_MAP = {
    "A408": 60.0, "A509": 60.1, "A50A": 60.2, "A50B": 60.3, "A50C": 60.4, "A50D": 60.5,
    "A50E": 60.6, "A50F": 60.7, "A600": 60.8, "A601": 60.9, "A602": 61.0, "A603": 61.1,
    "A604": 61.2, "A605": 61.3, "A606": 61.4, "A607": 61.5, "A608": 61.6, "A609": 61.7,
    "A60A": 61.8, "A60B": 61.9, "A60C": 62.0, "A60D": 62.1, "A60E": 62.2, "A60F": 62.3,
    "A700": 62.4, "A701": 62.5, "A702": 62.6, "A703": 62.7, "A704": 62.8, "A705": 62.9,
    "A706": 63.0, "A707": 63.1, "A708": 63.2, "A709": 63.3, "A70A": 63.4, "A70B": 63.5,
    "A70C": 63.6, "A70D": 63.7, "A70E": 63.8, "A70F": 63.9, "A800": 64.0, "A801": 64.1,
    "A802": 64.2, "A803": 64.3, "A804": 64.4, "A805": 64.5, "A806": 64.6, "A807": 64.7,
    "A808": 64.8, "A809": 64.9, "A80A": 65.0, "A80B": 65.1, "A80C": 65.2, "A80D": 65.3,
    "A80E": 65.4, "A80F": 65.5, "A900": 65.6, "A901": 65.7, "A902": 65.8, "A903": 65.9,
    "A904": 66.0, "A905": 66.1, "A906": 66.2, "A907": 66.3, "A908": 66.4, "A909": 66.5,
    "A90A": 66.6, "A90B": 66.7, "A90C": 66.8, "A90D": 66.9, "A90E": 67.0, "A90F": 67.1,
    "AA00": 67.2, "AA01": 67.3, "AA02": 67.4, "AA03": 67.5, "AA04": 67.6, "AA05": 67.7,
    "AA06": 67.8, "AA07": 67.9, "AA08": 68.0, "AA09": 68.1, "AA0A": 68.2, "AA0B": 68.3,
    "AA0C": 68.4, "AA0D": 68.5, "AA0E": 68.6, "AA0F": 68.7, "AB00": 68.8, "AB01": 68.9,
    "AB02": 69.0, "AB03": 69.1, "AB04": 69.2, "AB05": 69.3, "AB06": 69.4, "AB07": 69.5,
    "AB08": 69.6, "AB09": 69.7, "AB0A": 69.8, "AB0B": 69.9, "AB0C": 70.0, "AB0D": 70.1,
    "AB0E": 70.2, "AB0F": 70.3, "AC00": 70.4, "AC01": 70.5, "AC02": 70.6, "AC03": 70.7,
    "AC04": 70.8, "AC05": 70.9, "AC06": 71.0, "AC07": 71.1, "AC08": 71.2, "AC09": 71.3,
    "AC0A": 71.4, "AC0B": 71.5, "AC0C": 71.6, "AC0D": 71.7, "AC0E": 71.8, "AC0F": 71.9,
    "AD00": 72.0, "AD01": 72.1, "AD02": 72.2, "AD03": 72.3, "AD04": 72.4, "AD05": 72.5,
    "AD06": 72.6, "AD07": 72.7, "AD08": 72.8, "AD09": 72.9, "AD0A": 73.0, "AD0B": 73.1,
    "AD0C": 73.2, "AD0D": 73.3, "AD0E": 73.4, "AD0F": 73.5, "AE00": 73.6, "AE01": 73.7,
    "AE02": 73.8, "AE03": 73.9, "AE04": 74.0, "AE05": 74.1, "AE06": 74.2, "AE07": 74.3,
    "AE08": 74.4, "AE09": 74.5, "AE0A": 74.6, "AE0B": 74.7, "AE0C": 74.8, "AE0D": 74.9,
    "AE0E": 75.0, "AE0F": 75.1, "AF00": 75.2, "AF01": 75.3, "AF02": 75.4, "AF03": 75.5,
    "AF04": 75.6, "AF05": 75.7, "AF06": 75.8, "AF07": 75.9, "AF08": 76.0, "AF09": 76.1,
    "AF0A": 76.2, "AF0B": 76.3, "AF0C": 76.4, "AF0D": 76.5, "AF0E": 76.6, "AF0F": 76.7,
    "B000": 76.8, "B001": 76.9, "B002": 77.0, "B003": 77.1, "B004": 77.2, "B005": 77.3,
    "B006": 77.4, "B007": 77.5, "B008": 77.6, "B009": 77.7, "B00A": 77.8, "B00B": 77.9,
    "B00C": 78.0, "B00D": 78.1, "B00E": 78.2, "B00F": 78.3, "B100": 78.4, "B101": 78.5,
    "B102": 78.6, "B103": 78.7, "B104": 78.8, "B105": 78.9, "B106": 79.0, "B107": 79.1,
    "B108": 79.2, "B109": 79.3, "B10A": 79.4, "B10B": 79.5, "B10C": 79.6, "B10D": 79.7,
    "B10E": 79.8, "B10F": 79.9, "B200": 80.0, "B201": 80.1, "B202": 80.2, "B203": 80.3,
    "B204": 80.4, "B205": 80.5, "B206": 80.6, "B207": 80.7, "B208": 80.8, "B209": 80.9,
    "B20A": 81.0, "B20B": 81.1, "B20C": 81.2, "B20D": 81.3, "B20E": 81.4, "B20F": 81.5,
    "B300": 81.6, "B301": 81.7, "B302": 81.8, "B303": 81.9, "B304": 82.0, "B305": 82.1,
    "B306": 82.2, "B307": 82.3, "B308": 82.4, "B309": 82.5, "B30A": 82.6, "B30B": 82.7,
    "B30C": 82.8, "B30D": 82.9, "B30E": 83.0, "B30F": 83.1, "B400": 83.2, "B401": 83.3,
    "B402": 83.4, "B403": 83.5, "B404": 83.6, "B405": 83.7, "B406": 83.8, "B407": 83.9,
    "B408": 84.0, "B409": 84.1, "B40A": 84.2, "B40B": 84.3, "B40C": 84.4, "B40D": 84.5,
    "B40E": 84.6, "B40F": 84.7, "B500": 84.8, "B501": 84.9, "B502": 85.0
}

B18_MAP = {
    "94": 60, "95": 61, "96": 62, "97": 63, "98": 64, "99": 65,
    "9A": 66, "9B": 67, "9C": 68, "9D": 69, "9E": 70, "9F": 71,
    "A0": 72, "A1": 73, "A2": 74, "A3": 75, "A4": 76, "A5": 77,
    "A6": 78, "A7": 79, "A8": 80, "A9": 81, "AA": 82, "AB": 83,
    "AC": 84, "AD": 85
}

# --- Mapeo HVAC corregido por Loannel ---
HVAC_MAP = {
    "1F": "LEM ON + HVAC ON",
    "17": "LEM ON + HVAC ON",
    "0F": "LEM OFF + HVAC ON",
    "0B": "LEM OFF + HVAC ON",
    "07": "LEM OFF + HVAC ON",
    "0E": "LEM OFF + HVAC ON",
    "06": "LEM OFF + HVAC ON",
    "0C": "LEM OFF + HVAC OFF",
    "08": "LEM OFF + HVAC OFF",
    "04": "LEM OFF + HVAC OFF",
    "1C": "LEM ON + HVAC OFF",
    "1E": "LEM ON + HVAC ON",
    "1B": "LEM ON + HVAC ON",
}

# --- Logging inicial ---
if not os.path.exists(LOG_FILE):
    with open(LOG_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Room", "RoomTemp", "SetTemp", "Δ", "HVAC", "Mode", "Time", "Packet"])

def log_data(entry):
    with open(LOG_FILE, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            entry["room"], entry["room_temp"], entry["set_temp"], entry["delta"],
            entry["hvac"], entry["mode"], entry["time"], entry["raw"]
        ])

def decode_packet(pkt):
    try:
        if len(pkt) < 40 or pkt[0] != 0xFF or pkt[1] != 0xA2:
            return None
        room = (pkt[12] << 8 | pkt[13])
        b18 = f"{pkt[17]:02X}"
        b19 = f"{pkt[18]:02X}"
        b21 = pkt[20]
        b22 = pkt[21]
        mode_raw = pkt[33:35].hex().upper()
        key = f"{b21:02X}{b22:02X}"

        room_temp = B21B22_MAP.get(key)
        set_temp = B18_MAP.get(b18)
        delta = round(room_temp - set_temp, 1) if room_temp and set_temp else "--"

        return {
            "room": room,
            "room_temp": room_temp,
            "set_temp": set_temp,
            "delta": delta,
            "hvac": HVAC_MAP.get(b19, f"Unknown({b19})"),
            "mode": "Cool" if "80" in mode_raw else "Off" if "00" in mode_raw else "?",
            "time": datetime.now().strftime("%H:%M:%S"),
            "raw": " ".join(f"{b:02X}" for b in pkt)
        }
    except Exception:
        return None

def print_table(latest):
    os.system("cls" if os.name == "nt" else "clear")
    print(f"📡 Listening on {HOST}:{PORT} — Unified Live Table\n")
    print("Room | RoomTemp | SetTemp | Δ   | HVAC Mode             | Mode | Time     | Packet (HEX)")
    print("-" * 145)
    for room in sorted(latest.keys()):
        d = latest[room]
        print(
            f"{room:>4} | "
            f"{(d['room_temp'] if d['room_temp'] else '--'):>8} | "
            f"{(d['set_temp'] if d['set_temp'] else '--'):>7} | "
            f"{(d['delta'] if d['delta'] else '--'):>4} | "
            f"{d['hvac']:<22} | "
            f"{d['mode']:<5} | "
            f"{d['time']:<8} | "
            f"{d['raw']}"
        )

def main():
    latest = {}
    print(f"📡 Waiting for connection on {HOST}:{PORT} ...")
    last_print = 0
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))
        s.listen(1)
        conn, addr = s.accept()
        print(f"✅ Connected: {addr}")
        with conn:
            while True:
                data = conn.recv(4096)
                if not data:
                    break
                i = 0
                while i < len(data) - 1:
                    if data[i] == 0xFF and data[i + 1] == 0xA2:
                        pkt = data[i:i + 48]
                        decoded = decode_packet(pkt)
                        if decoded:
                            latest[decoded["room"]] = decoded
                            log_data(decoded)

                            # --- Envío a API externa ---
                            try:
                                API_URL = "https://api.getsnova.com/api/inncom"
                                requests.post(API_URL, json=decoded, timeout=2)
                            except Exception as e:
                                print(f"⚠️ Error enviando a API: {e}")

                            if time.time() - last_print > 0.5:
                                print_table(latest)
                                last_print = time.time()
                        i += 2
                    else:
                        i += 1

if __name__ == "__main__":
    main()

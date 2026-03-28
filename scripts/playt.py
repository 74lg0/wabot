#!/usr/bin/env python3
import sys
import os
import json
import yt_dlp #type: ignore

MAX_AUDIO_SECONDS = 15 * 60
MAX_VIDEO_SECONDS = 10 * 60

def obtener_info(query, es_url=False):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        busqueda = query if es_url else f"ytsearch1:{query}"
        data = ydl.extract_info(busqueda, download=False)

        entry = data if es_url else (data.get("entries") or [None])[0]
        if not entry:
            return None

        return {
            "url":       f"https://www.youtube.com/watch?v={entry['id']}",
            "title":     entry.get("title", "Sin título"),
            "uploader":  entry.get("uploader") or entry.get("channel", "Desconocido"),
            "duration":  entry.get("duration", 0),
            "thumbnail": entry.get("thumbnail", ""),
        }

def bajar_audio(url, carpeta):
    opts = {
        "format": "bestaudio",
        "outtmpl": os.path.join(carpeta, "%(id)s.%(ext)s"),  # ← usar ID en vez de título
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        ruta = os.path.join(carpeta, f"{info['id']}.mp3")
        size = os.path.getsize(ruta) if os.path.exists(ruta) else 0
        return ruta, size

def bajar_video(url, carpeta):
    opts = {
        "format": "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "merge_output_format": "mp4",
        "outtmpl": os.path.join(carpeta, "%(id)s.%(ext)s"),  # ← usar ID
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        ruta = os.path.join(carpeta, f"{info['id']}.mp4")
        size = os.path.getsize(ruta) if os.path.exists(ruta) else 0
        return ruta, size

def formato_peso(b):
    if b == 0:
        return "Desconocido"
    if b < 1024 * 1024:
        return f"{b / 1024:.1f} KB"
    return f"{b / 1024 / 1024:.1f} MB"

def emitir_info(meta):
    duracion = meta["duration"]
    print(json.dumps({
        "ok":            True,
        "url":           meta["url"],
        "title":         meta["title"],
        "uploader":      meta["uploader"],
        "duration":      duracion,
        "thumbnail":     meta["thumbnail"],
        "blocked_audio": duracion > MAX_AUDIO_SECONDS,
        "blocked_video": duracion > MAX_VIDEO_SECONDS,
    }))

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"ok": False, "error": "Uso: playt.py <info|info-url|audio|video> <query|url> <carpeta>"}))
        sys.exit(1)

    modo    = sys.argv[1]
    query   = sys.argv[2]
    carpeta = sys.argv[3]

    os.makedirs(carpeta, exist_ok=True)

    try:
        if modo == "info":
            meta = obtener_info(query, es_url=False)
            if not meta:
                print(json.dumps({"ok": False, "error": "No se encontraron resultados en YouTube."}))
                sys.exit(1)
            emitir_info(meta)
            sys.exit(0)

        if modo == "info-url":
            meta = obtener_info(query, es_url=True)
            if not meta:
                print(json.dumps({"ok": False, "error": "No se pudo obtener info del enlace."}))
                sys.exit(1)
            emitir_info(meta)
            sys.exit(0)

        if modo == "audio":
            ruta, size = bajar_audio(query, carpeta)
        elif modo == "video":
            ruta, size = bajar_video(query, carpeta)
        else:
            print(json.dumps({"ok": False, "error": f"Modo inválido: {modo}"}))
            sys.exit(1)

        print(json.dumps({
            "ok":   True,
            "path": ruta,
            "size": formato_peso(size)
        }))

    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}))
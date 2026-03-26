#!/usr/bin/env python3
import sys
import os
import json
import yt_dlp

MAX_AUDIO_SECONDS = 15 * 60      # 15 minutos
MAX_VIDEO_SECONDS = 10 * 60      # 10 minutos

def obtener_info(query):
    opts = {
        "quiet": True,
        "no_warnings": True,
        "default_search": "ytsearch1",
        # ← quita extract_flat, obtiene info completa directo
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        data = ydl.extract_info(f"ytsearch1:{query}", download=False)
        if "entries" in data and data["entries"]:
            entry = data["entries"][0]
            return {
                "url":       f"https://www.youtube.com/watch?v={entry['id']}",
                "title":     entry.get("title", "Sin título"),
                "uploader":  entry.get("uploader") or entry.get("channel", "Desconocido"),
                "duration":  entry.get("duration", 0),
                "thumbnail": entry.get("thumbnail", ""),
                "filesize":  entry.get("filesize") or entry.get("filesize_approx", 0)
            }
    return None

def bajar_audio(url, carpeta):
    opts = {
        "format": "bestaudio",
        "outtmpl": os.path.join(carpeta, "%(id)s.%(ext)s"),
        "postprocessors": [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }],
        "quiet": True,
        "no_warnings": True,
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
        "outtmpl": os.path.join(carpeta, "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        ruta = os.path.join(carpeta, f"{info['id']}.mp4")
        size = os.path.getsize(ruta) if os.path.exists(ruta) else 0
        return ruta, size

def formato_peso(bytes):
    if bytes == 0:
        return "Desconocido"
    if bytes < 1024 * 1024:
        return f"{bytes / 1024:.1f} KB"
    return f"{bytes / 1024 / 1024:.1f} MB"

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({ "ok": False, "error": "Uso: playt.py <audio|video> <query> <carpeta>" }))
        sys.exit(1)

    modo    = sys.argv[1]
    query   = sys.argv[2]
    carpeta = sys.argv[3]

    os.makedirs(carpeta, exist_ok=True)

    try:
        meta = obtener_info(query)
        if not meta:
            print(json.dumps({ "ok": False, "error": "No se encontraron resultados en YouTube." }))
            sys.exit(1)

        duracion = meta["duration"]

        # Validar límite de duración
        limite = MAX_AUDIO_SECONDS if modo == "audio" else MAX_VIDEO_SECONDS
        if duracion > limite:
            print(json.dumps({ "ok": False, "blocked": True, "duration": duracion, "mode": modo }))
            sys.exit(0)

        if modo == "audio":
            ruta, size = bajar_audio(meta["url"], carpeta)
        elif modo == "video":
            ruta, size = bajar_video(meta["url"], carpeta)
        else:
            print(json.dumps({ "ok": False, "error": f"Modo inválido: {modo}" }))
            sys.exit(1)

        print(json.dumps({
            "ok":        True,
            "path":      ruta,
            "title":     meta["title"],
            "uploader":  meta["uploader"],
            "duration":  duracion,
            "thumbnail": meta["thumbnail"],
            "size":      formato_peso(size)
        }))

    except Exception as e:
        print(json.dumps({ "ok": False, "error": str(e) }))

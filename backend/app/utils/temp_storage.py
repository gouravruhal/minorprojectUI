"""
In-Memory Audio Buffer & Zero-Disk Privacy Utilities.
Guarantees 100% in-memory RAM processing without writing sensitive raw audio to disk.
"""
import io
import uuid
from typing import Dict, Optional

# Thread-safe in-memory audio storage in RAM
_RAM_AUDIO_CACHE: Dict[str, bytes] = {}

def save_temp_audio(data: bytes, ext: str = ".wav") -> str:
    """Stores audio bytes strictly in RAM and returns an in-memory memory identifier."""
    mem_id = f"ram://audio_{uuid.uuid4().hex[:12]}{ext}"
    _RAM_AUDIO_CACHE[mem_id] = data
    return mem_id

def get_ram_audio(mem_id: str) -> Optional[bytes]:
    """Retrieves audio bytes from RAM."""
    return _RAM_AUDIO_CACHE.get(mem_id)

def get_ram_audio_stream(data: bytes) -> io.BytesIO:
    """Wraps raw audio bytes into an in-memory BytesIO stream for zero-disk decoding."""
    return io.BytesIO(data)

def remove_temp_file(filepath: str):
    """Releases RAM audio buffer when processing completes (zero disk ops)."""
    if filepath and filepath in _RAM_AUDIO_CACHE:
        _RAM_AUDIO_CACHE.pop(filepath, None)

def cleanup_temp_dir():
    """Flushes all in-memory RAM audio buffers."""
    _RAM_AUDIO_CACHE.clear()

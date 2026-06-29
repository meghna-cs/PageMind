#!/usr/bin/env python3
"""Generate simple PNG icons for the Chrome extension."""
import struct, zlib, os

def create_brain_icon_svg(size):
    """Create a simple brain icon as SVG."""
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6c63ff"/>
      <stop offset="100%" style="stop-color:#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="{size}" height="{size}" rx="{size//4}" fill="url(#bg)"/>
  <text x="50%" y="58%" font-size="{int(size*0.6)}" text-anchor="middle" dominant-baseline="middle" font-family="serif">🧠</text>
</svg>"""

# Write SVG icons (Chrome can use SVG for display, but needs PNG for manifest)
# We'll create simple colored square PNGs using pure Python

def write_png(filename, size, color_top=(108, 99, 255), color_bot=(167, 139, 250)):
    """Write a minimal PNG with a gradient-like appearance."""
    import struct
    import zlib
    
    width = height = size
    
    # Create pixel data
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type: None
        t = y / (height - 1)
        r = int(color_top[0] * (1-t) + color_bot[0] * t)
        g = int(color_top[1] * (1-t) + color_bot[1] * t)
        b = int(color_top[2] * (1-t) + color_bot[2] * t)
        
        for x in range(width):
            # Rounded corners (alpha mask)
            margin = size // 5
            corner = size // 4
            a = 255
            
            # Simple rounded rect alpha
            dx = min(x, width-1-x)
            dy = min(y, height-1-y)
            if dx < corner and dy < corner:
                dist = ((dx - corner)**2 + (dy - corner)**2)**0.5
                if dist > corner:
                    a = 0
            
            raw_data.extend([r, g, b, a])
    
    def make_chunk(chunk_type, data):
        chunk_len = len(data)
        chunk_data = chunk_type + data
        crc = zlib.crc32(chunk_data) & 0xffffffff
        return struct.pack('>I', chunk_len) + chunk_data + struct.pack('>I', crc)
    
    # PNG signature
    png = b'\x89PNG\r\n\x1a\n'
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    png += make_chunk(b'IHDR', ihdr_data)
    
    # IDAT (compressed)
    compressed = zlib.compress(bytes(raw_data), 9)
    png += make_chunk(b'IDAT', compressed)
    
    # IEND
    png += make_chunk(b'IEND', b'')
    
    with open(filename, 'wb') as f:
        f.write(png)
    
    print(f"Created {filename} ({size}x{size}px)")

icons_dir = os.path.join(os.path.dirname(__file__), 'extension', 'icons')
os.makedirs(icons_dir, exist_ok=True)

for size in [16, 48, 128]:
    write_png(
        os.path.join(icons_dir, f'icon{size}.png'),
        size,
        color_top=(108, 99, 255),   # violet
        color_bot=(167, 139, 250),  # lavender
    )

print("Icons generated successfully!")

"""Offline DEM -> XYZ Terrarium. Requires GDAL Python bindings and numpy."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import zlib


def chunk(kind, payload):
    return struct.pack('>I', len(payload)) + kind + payload + struct.pack('>I', zlib.crc32(kind + payload))


def main():
    from osgeo import gdal
    import numpy as np
    gdal.UseExceptions()
    gdal.SetCacheMax(256 * 1024 * 1024)
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path, help='Local georeferenced GeoTIFF, elevation in metres')
    parser.add_argument('--maxzoom', type=int, default=8, choices=range(0, 15))
    parser.add_argument('--provenance', type=Path, required=True, help='JSON with source, license, version, attribution')
    parser.add_argument('--coverage', type=Path, required=True, help='Full-resolution coverage report from terrain-prepare.py')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    source = args.input.resolve(strict=True)
    provenance = json.loads(args.provenance.read_text(encoding='utf-8'))
    coverage = json.loads(args.coverage.read_text(encoding='utf-8'))
    with source.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if (coverage.get('coverage') != 'PASS' or coverage.get('nodataPixels') != 0
            or coverage.get('mosaicSHA256') != digest):
        raise ValueError('Full-resolution coverage report does not match the input DEM')
    if not all(provenance.get(key) for key in ['source', 'license', 'version', 'attribution']):
        raise ValueError('Source/license/version/attribution required')
    out = root / 'public/maps/terrain'
    work = root / '.maps-data/terrain'
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)
    if (out / 'terrain.json').exists() or any(out.glob('*/*/*.png')):
        raise ValueError('Archive existing terrain output before regenerating; no overwrite')
    ds = gdal.OpenEx(str(source), allowed_drivers=["GTiff"])
    if ds.RasterCount != 1 or not ds.GetProjection():
        raise ValueError('Expected single-band georeferenced elevation in metres')
    bounds = [45, 39, 90, 57]
    edge = 20037508.342789244
    def xy(lon, lat, z):
        n = 2 ** z
        return (min(n-1, int((lon+180)/360*n)),
                min(n-1, int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*n)))
    count = 0
    for z in range(args.maxzoom+1):
        west, south = xy(bounds[0], bounds[1], z)
        east, north = xy(bounds[2], bounds[3], z)
        span = 2*edge/(2**z)
        for x in range(west, east+1):
            for y in range(north, south+1):
                tile = gdal.Warp('', ds, format='MEM', dstSRS='EPSG:3857',
                    outputBounds=[-edge+x*span, edge-(y+1)*span, -edge+(x+1)*span, edge-y*span],
                    width=256, height=256, outputType=gdal.GDT_Float32,
                    resampleAlg='bilinear', dstNodata=-999999)
                values = tile.ReadAsArray()
                valid = np.isfinite(values) & (values != -999999)
                # Fail on missing elevation inside Kazakhstan's bounding rectangle.
                cols = (np.arange(256)+0.5)/256
                lon = (-edge+(x+cols)*span)/edge*180
                lat = np.degrees(np.arctan(np.sinh((edge-(y+cols)*span)/edge*math.pi)))
                required = ((lat[:,None] >= 39) & (lat[:,None] <= 57) &
                            (lon[None,:] >= 45) & (lon[None,:] <= 90))
                if np.any(required & ~valid):
                    raise ValueError(f'DEM has nodata within coverage at {z}/{x}/{y}; supply complete mosaic')
                values = np.where(valid, values, 0)
                if np.any((values < -32768) | (values >= 32768)):
                    raise ValueError('Elevation outside Terrarium range; verify metre units')
                encoded = np.floor((values+32768)*256).astype(np.uint32)
                rgb = np.stack([(encoded >> 16)&255, (encoded >> 8)&255, encoded&255], axis=2).astype(np.uint8)
                scanlines = b''.join(b'\x00'+row.tobytes() for row in rgb)
                png = b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',256,256,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(scanlines))+chunk(b'IEND',b'')
                dest = out / str(z) / str(x) / f'{y}.png'
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(png)
                count += 1
        print(f'z{z}: {count} cumulative tiles', flush=True)
    manifest = dict(encoding='terrarium', tileSize=256, minzoom=0, maxzoom=args.maxzoom,
                    bounds=bounds, tiles=['/maps/terrain/{z}/{x}/{y}.png'], tileCount=count,
                    provenance=provenance, gdalVersion=gdal.VersionInfo(),
                    inputSHA256=digest, coverage=coverage, inputBytes=source.stat().st_size)
    text = json.dumps(manifest, indent=2)+'\n'
    (work/'generation.json').write_text(text, encoding='utf-8')
    (out/'terrain.json').write_text(text, encoding='utf-8')
    print('Generated real local DEM; run npm run maps:terrain:validate')


if __name__ == '__main__':
    main()

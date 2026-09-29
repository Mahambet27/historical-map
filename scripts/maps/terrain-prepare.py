"""Verify downloaded NASA SRTMGL1 v3 and make a full-resolution local mosaic."""
import hashlib
import json
from pathlib import Path

import numpy as np
from osgeo import gdal

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / '.maps-data/terrain'
gdal.UseExceptions()
gdal.SetCacheMax(512 * 1024 * 1024)


def main():
    lock = json.loads((WORK / 'sources.lock.json').read_text())
    files = []
    for i, entry in enumerate(lock['entries']):
        file = WORK / 'inputs' / entry['file']
        with file.open('rb') as stream:
            digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        if file.stat().st_size != entry['bytes'] or digest != entry['sha256']:
            raise ValueError(f'Source checksum mismatch: {file.name}')
        ds = gdal.Open(str(file))
        if ds.RasterCount != 1 or ds.RasterXSize != 3601 or ds.RasterYSize != 3601:
            raise ValueError(f'Not a 1 arc-second SRTM cell: {file.name}')
        values = ds.ReadAsArray()
        if np.any(values == ds.GetRasterBand(1).GetNoDataValue()):
            raise ValueError(f'Unexpected source void: {file.name}')
        files.append(str(file))
        if (i + 1) % 100 == 0:
            print(f'Validated {i+1} source cells', flush=True)
    vrt = gdal.BuildVRT(str(WORK / 'sources.vrt'), files)
    vrt.FlushCache()
    transform = vrt.GetGeoTransform()
    water_fills = []
    # OpenTopography omits whole-water Caspian cells. Extend only the constant
    # SRTM water elevation observed on their existing perimeter samples.
    # Never infer land heights or silently replace nodata with zero.
    for cell in lock['provenance']['omittedWaterCells']:
        lat, lon = int(cell[1:3]), int(cell[4:7])
        x = round((lon - transform[0]) / transform[1] - 0.5)
        y = round((lat + 1 - transform[3]) / transform[5] - 0.5)
        edges = [vrt.ReadAsArray(x, y, 3601, 1), vrt.ReadAsArray(x, y+3600, 3601, 1),
                 vrt.ReadAsArray(x, y, 1, 3601), vrt.ReadAsArray(x+3600, y, 1, 3601)]
        samples = np.concatenate([edge.ravel() for edge in edges])
        samples = samples[samples != -32768]
        elevations = np.unique(samples)
        if len(elevations) != 1 or not -35 <= elevations[0] <= -20:
            raise ValueError(f'Cannot verify constant Caspian water perimeter: {cell}: {elevations}')
        elevation = int(elevations[0])
        target = WORK / 'water-fill' / f'{cell}.tif'
        target.parent.mkdir(exist_ok=True)
        water = gdal.GetDriverByName('GTiff').Create(str(target), 3601, 3601, 1, gdal.GDT_Int16,
            options=['TILED=YES', 'COMPRESS=ZSTD'])
        water.SetGeoTransform([lon - 0.5/3600, 1/3600, 0, lat+1+0.5/3600, 0, -1/3600])
        water.SetProjection(vrt.GetProjection())
        water.GetRasterBand(1).SetNoDataValue(-32768)
        water.GetRasterBand(1).Fill(elevation)
        water.SetMetadataItem('DERIVATION', 'Constant Caspian surface from SRTMGL1 perimeter; not measured bathymetry')
        water = None
        water_fills.append({'cell': cell, 'elevationMetres': elevation, 'perimeterSamples': int(samples.size)})
    vrt = None
    filled = [str(WORK / 'water-fill' / f'{entry["cell"]}.tif') for entry in water_fills]
    vrt = gdal.BuildVRT(str(WORK / 'mosaic.vrt'), filled + files)
    target = WORK / 'kazakhstan-srtmgl1-v3.tif'
    if target.exists():
        raise ValueError('Mosaic exists; archive it before regeneration')
    print('Writing full-resolution 1 arc-second GeoTIFF mosaic', flush=True)
    mosaic = gdal.Translate(str(target), vrt, format='GTiff',
        creationOptions=['TILED=YES', 'COMPRESS=ZSTD', 'PREDICTOR=2', 'BIGTIFF=YES', 'NUM_THREADS=4'])
    mosaic.GetRasterBand(1).SetUnitType('m')
    mosaic.SetMetadataItem('SOURCE', 'NASA SRTMGL1 v3 / OpenTopography')
    mosaic.SetMetadataItem('VERTICAL_DATUM', 'EGM96')
    missing = 0
    minimum, maximum = 32767, -32768
    for y in range(0, mosaic.RasterYSize, 128):
        values = mosaic.ReadAsArray(0, y, mosaic.RasterXSize, min(128, mosaic.RasterYSize-y))
        missing += int(np.count_nonzero(values == -32768))
        minimum, maximum = min(minimum, int(values.min())), max(maximum, int(values.max()))
    if missing:
        raise ValueError(f'Mosaic contains {missing} missing pixels')
    print('Coverage scan PASS; building elevation overviews', flush=True)
    gdal.SetConfigOption('COMPRESS_OVERVIEW', 'ZSTD')
    mosaic.BuildOverviews('AVERAGE', [2,4,8,16,32,64,128,256])
    report = dict(source='NASA SRTMGL1 v3', sourceFiles=len(files), bounds=[45,39,90,57],
        resolutionArcSeconds=1, width=mosaic.RasterXSize, height=mosaic.RasterYSize,
        nodataPixels=missing, minimumMetres=minimum, maximumMetres=maximum,
        caspianWaterExtensions=water_fills, coverage='PASS', gdalVersion=gdal.VersionInfo())
    mosaic = None
    report['mosaicBytes'] = target.stat().st_size
    with target.open('rb') as stream:
        report['mosaicSHA256'] = hashlib.file_digest(stream, 'sha256').hexdigest()
    (WORK / 'coverage.json').write_text(json.dumps(report, indent=2)+'\n')
    provenance = lock['provenance'] | {'caspianWaterExtensions': water_fills,
        'processing': '1 arc-second mosaic; omitted whole-water cells extended from verified constant SRTM perimeter heights'}
    (WORK / 'provenance.json').write_text(json.dumps(provenance, indent=2)+'\n')
    print(json.dumps(report, indent=2), flush=True)


if __name__ == '__main__':
    main()

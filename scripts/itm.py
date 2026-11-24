"""Israeli Transverse Mercator (EPSG:2039) -> WGS84 lat/lon, no dependencies.

Inverse transverse Mercator on GRS80 with ITM parameters, then the EPSG:2039
7-parameter Helmert shift (Israel 1993 -> WGS84, position-vector convention)."""
from math import radians, degrees, sin, cos, tan, sqrt, atan2

A, F = 6378137.0, 1 / 298.257222101            # GRS80
E2 = F * (2 - F)
LAT0 = radians(31 + 44 / 60 + 3.817 / 3600)
LON0 = radians(35 + 12 / 60 + 16.261 / 3600)
K0, FE, FN = 1.0000067, 219529.584, 626907.390
TOWGS84 = (-24.0024, -17.1032, -17.8444, -0.33077, -1.85269, 1.66969, 5.4248)


def _arc(phi):
    e4, e6 = E2 * E2, E2 ** 3
    return A * ((1 - E2 / 4 - 3 * e4 / 64 - 5 * e6 / 256) * phi
                - (3 * E2 / 8 + 3 * e4 / 32 + 45 * e6 / 1024) * sin(2 * phi)
                + (15 * e4 / 256 + 45 * e6 / 1024) * sin(4 * phi)
                - (35 * e6 / 3072) * sin(6 * phi))


def _inv_tm(x, y):
    m = _arc(LAT0) + (y - FN) / K0
    mu = m / (A * (1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256))
    e1 = (1 - sqrt(1 - E2)) / (1 + sqrt(1 - E2))
    p1 = (mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * sin(2 * mu)
          + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * sin(4 * mu)
          + (151 * e1 ** 3 / 96) * sin(6 * mu) + (1097 * e1 ** 4 / 512) * sin(8 * mu))
    ep2 = E2 / (1 - E2)
    c1, t1 = ep2 * cos(p1) ** 2, tan(p1) ** 2
    n1 = A / sqrt(1 - E2 * sin(p1) ** 2)
    r1 = A * (1 - E2) / (1 - E2 * sin(p1) ** 2) ** 1.5
    d = (x - FE) / (n1 * K0)
    lat = p1 - (n1 * tan(p1) / r1) * (d ** 2 / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ep2) * d ** 4 / 24
                                      + (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ep2 - 3 * c1 ** 2) * d ** 6 / 720)
    lon = LON0 + (d - (1 + 2 * t1 + c1) * d ** 3 / 6
                  + (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ep2 + 24 * t1 ** 2) * d ** 5 / 120) / cos(p1)
    return lat, lon


def _helmert(lat, lon):
    n = A / sqrt(1 - E2 * sin(lat) ** 2)
    X, Y, Z = n * cos(lat) * cos(lon), n * cos(lat) * sin(lon), n * (1 - E2) * sin(lat)
    tx, ty, tz, rx, ry, rz, s = TOWGS84
    rx, ry, rz = (radians(v / 3600) for v in (rx, ry, rz))
    k = 1 + s * 1e-6
    X2 = tx + k * (X - rz * Y + ry * Z)
    Y2 = ty + k * (rz * X + Y - rx * Z)
    Z2 = tz + k * (-ry * X + rx * Y + Z)
    a, e2 = 6378137.0, 0.00669437999014       # WGS84
    p = sqrt(X2 ** 2 + Y2 ** 2); lat2 = atan2(Z2, p * (1 - e2))
    for _ in range(6):
        n2 = a / sqrt(1 - e2 * sin(lat2) ** 2)
        lat2 = atan2(Z2 + e2 * n2 * sin(lat2), p)
    return lat2, atan2(Y2, X2)


def itm_to_wgs84(x, y):
    lat, lon = _helmert(*_inv_tm(x, y))
    return degrees(lat), degrees(lon)


if __name__ == '__main__':
    # Known ITM points (EPSG:2039 -> 4326 via PROJ): Western Wall area, Tel Aviv Azrieli
    for x, y in ((222286.0, 631556.0), (180640.0, 664240.0)):
        print(x, y, itm_to_wgs84(x, y))

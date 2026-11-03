# Nearby star catalog — real data vs game abstraction

Reference date: 2026-11-03. Real star names and light-year distances are **rounded** and may be updated from authoritative astrometric catalogs with a new versioned review. Current code: `modules/galaxy/real-stars.js`. Gameplay layout coordinates are authored and schematic; **not** physically measured locations, and hyperlanes are fictional.

| Game system | Actual stellar identity | Approx distance from Sol |
| --- | --- | --- |
| Sol | The Sun | 0 ly |
| Alpha Centauri | Alpha Centauri A and B binary (the physical triple includes Proxima) | 4.37 ly |
| Proxima Centauri | Alpha Centauri C, distant companion of A/B | 4.25 ly |
| Barnard's Star | Red dwarf | 5.96 ly |
| Wolf 359 | Red dwarf | 7.78 ly |
| Lalande 21185 | Red dwarf | 8.29 ly |
| Sirius | Sirius A/B binary | 8.6 ly |
| Ross 154 | Red dwarf | 9.69 ly |
| Epsilon Eridani | K-type dwarf | 10.5 ly |
| Ross 128 | Red dwarf | 10.9 ly |
| 61 Cygni | Binary orange dwarf stars | 11.4 ly |
| Tau Ceti | G-type star | 11.9 ly |

**Scientific references:** NASA [Alpha Centauri triple star explanation](https://science.nasa.gov/exoplanets/other-stars-other-worlds/our-nearest-celestial-neighbor-an-exotic-3-star-system/); [Proxima Centauri Hubble page](https://science.nasa.gov/asset/hubble/proxima-centauri/); [NASA Proxima b](https://science.nasa.gov/resource/proxima-b-3d-model/); [Rutgers 44 nearest stars educational chart](https://njsgc.rutgers.edu/sites/default/files/2023-03/44-closest-stars-how-they-compare-sun-6_PDF.pdf); [nearby stars catalog with RA/Dec and distance](https://www.galaxies3d.org/stars-nearest-data.htm). Check discoveries and precision before publishing claims as updated astronomy.

The eight Sol planets are displayed with published names and approximate heliocentric AU values. Their rendered orbital radius and size are intentionally enlarged/redistributed for visibility. Earth is selected as the starting human colony. The renderer depicts sample moons, not every moon in astronomy. Other depicted planets are generated for fictional gameplay unless a future individual-planet catalog explicitly marks a verified discovery. In particular, **Proxima b is a known exoplanet but habitability is uncertain; never claim it is confirmed inhabited**.

To extend: add one entry with stable `id`, name, stellar type, approximate distance, source citation and non-overlapping schematic map position; update tests, this table and release notes. Keep saves and stable star IDs from existing campaigns.

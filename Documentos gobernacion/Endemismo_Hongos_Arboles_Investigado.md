# Endemismo en Hongos y Árboles Nativos — investigado, sin resultado

Registro de que esto ya se investigó (agosto 2026), para no repetir la pregunta más adelante.

## Árboles nativos

**El grupo `arboles_nativos` tiene 0 especies en `species.json`.** Existe en `GROUP_META`/el esquema de la app, pero nunca se pobló con contenido real — no es un problema de endemismo, es un vacío de catálogo pendiente de una migración de datos que no se ha hecho.

## Hongos

37 especies en el catálogo, de las cuales 22 están identificadas solo hasta género/familia ("sp.", "indet.", "cf." — excluidas por diseño del badge de Endémica, ver `isUnidentified()` en `especie.js`). Las 15 identificadas a nivel de especie se investigaron una por una con fuentes reales (Wikipedia, GBIF, Index Fungorum, literatura micológica). **Ninguna es endémica de Antioquia ni de Colombia** — todas tienen distribución confirmada fuera del país:

| Especie | Distribución confirmada | Fuente |
|---|---|---|
| *Coprinus micaceus* | Cosmopolita (todos los continentes excepto Antártida) | [Wikipedia](https://en.wikipedia.org/wiki/Coprinellus_micaceus) |
| *Russula cyanoxantha* | Europa, también Norteamérica | [First Nature](https://www.first-nature.com/fungi/russula-cyanoxantha.php) |
| *Calostoma cinnabarinum* | Este de Norteamérica, Centroamérica, NE de Sudamérica, Asia oriental | [Zombie Myco](https://zombiemyco.com/pages/cinnabar-redball-calostoma-cinnabarinum) |
| *Cortinarius iodes* | Norteamérica, Centroamérica, norte de Sudamérica, norte de Asia | [MushroomExpert](https://www.mushroomexpert.com/cortinarius_iodes.html) |
| *Pycnoporus cinnabarinus* | Holártica (Norteamérica, Europa, Asia), también Australia | [Wikipedia](https://en.wikipedia.org/wiki/Pycnoporus_cinnabarinus) |
| *Cotylidia diaphana* | Solo EE.UU. (Texas, Nebraska) y Canadá (Ontario) — ni siquiera neotropical | [GBIF](https://www.gbif.org/species/2523515) |
| *Xylaria guazumae* | Neotropical amplia (México y otras zonas) | [Scielo México](https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S0187-71512022000100116) |
| *Xylaria titan* | Texas (tipo), Cuba, Uganda, México | [Acta Botánica Mexicana](https://www.scielo.org.mx/scielo.php?script=sci_arttext&pid=S0187-71512022000100116) |
| *Cyathus striatus* | Cosmopolita zonas templadas (Norteamérica, Europa, Asia, Australia) | [iNaturalist](https://www.inaturalist.org/taxa/120242-Cyathus-striatus) |
| *Cookeina tricholoma* | Pantropical (sobre todo Sudeste Asiático y Pacífico, también América) | [ColFungi](https://colfungi.org/taxon/urn:lsid:indexfungorum.org:names:121551/general-information) |
| *Pycnoporus sanguineus* | Pantropical/subtropical (América, Asia, África, Oceanía) | [Wikipedia](https://en.wikipedia.org/wiki/Pycnoporus_sanguineus) |
| *Polyporus arcularius* | Circumglobal hemisferio norte, también Australia y China | [Wikipedia](https://en.wikipedia.org/wiki/Polyporus_arcularius) |
| *Polyporus ciliatus* | Holártica (Eurasia y Norteamérica) | [First Nature](https://www.first-nature.com/fungi/polyporus-ciliatus.php) |
| *Pterula juruensis* | Brasil (Amazonas, Río de Janeiro, Paraná) — no Colombia | [IMA Fungus](https://imafungus.biomedcentral.com/articles/10.1186/s43008-019-0022-6) |
| *Marasmius rotula* | Hemisferio norte (Europa, Norteamérica) | [Wikipedia](https://en.wikipedia.org/wiki/Marasmius_rotula) |

**Conclusión:** ningún hongo del catálogo actual califica para el badge de Endémica. Si en el futuro se agregan hongos nuevos identificados a nivel de especie, vale la pena repetir esta verificación — no asumir que "ser un hongo poco común" implica endemismo.

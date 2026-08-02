# Contenido de Fauna Emblemática — borrador para revisión conjunta

Fuente principal: *"Antioquia Viva 2025"* (Andrea Sanín / Gobernación de Antioquia / SIDAP / Corplanes), capítulo "Fauna emblemática", páginas 97-121 — las 10 especies que el documento destaca. Contenido redactado en texto propio (no es copia literal del PDF).

Para el manatí antillano y el cangrejo azul se agregó además una sección de **investigación complementaria** con fuentes propias, tal como se pidió.

**No se ha tocado `species.json`.** Esto es solo contenido para decidir juntos qué entra, cómo y cuándo — varias de estas especies necesitan fotos reales antes de poder publicarse (ver nota al final de cada ficha).

---

## Ya están en el catálogo (candidatas a enriquecer, no a crear)

### 1. Oso andino / oso de anteojos — *Tremarctos ornatus*
`sp051101` — mamiferos. Ya en la app.

**Apodo del documento:** "El jardinero del bosque"

**Contenido nuevo que aporta el documento:**
- Hábitat: prefiere páramos y bosques altoandinos.
- Peso y longitud: 1,3-2 m, 60-175 kg (machos más grandes que hembras) — fuente Wildlife Conservation Society.
- Único oso de Suramérica; cada individuo tiene un patrón de manchas facial único (de ahí "oso de anteojos").
- Camina muchos kilómetros al día dispersando semillas por sus heces y transportando polen en su pelaje — actúa como polinizador además de dispersor.
- Cría de 2 a 4 oseznos por camada, que permanecen ~2 años con la madre.
- **Categoría de amenaza citada:** VU (Resolución 0126 de 2024).

**Uso sugerido:** ampliar `descriptionEs/En` con el rol ecológico (jardinero/polinizador) y agregar un campo de "dato curioso" si el esquema lo permite — el contenido actual de la app puede ser más escueto.

---

### 2. Jaguar — *Panthera onca*
`sp050701` — mamiferos. Ya en la app.

**Apodo del documento:** "El guardián de la naturaleza"

**Contenido nuevo:**
- Peso/longitud: machos hasta 2,5 m y 70-100 kg; hembras hasta 2,2 m y 50-77 kg (Fundación Omacha).
- Dieta amplísima: roedores, tortugas, babillas, caimanes, serpientes, guaguas, ñeques, armadillos, osos hormigueros, zarigüeyas, venados, monos, capibaras, peces.
- Mordida excepcionalmente fuerte, capaz de romper caparazones de tortuga.
- Los individuos melánicos ("panteras negras") siguen siendo jaguares, no otra especie.
- **Categoría de amenaza citada:** VU (Resolución 0126 de 2024).

**Uso sugerido:** el dato de la mordida y el melanismo son buenos "sabías qué" para enriquecer la ficha existente.

---

### 3. Puma — *Puma concolor*
`sp050702` — mamiferos. Ya en la app.

**Apodo del documento:** "El vigilante sigiloso"

**Contenido nuevo:**
- Segundo felino más grande de América. Hembras 30-45 kg, machos 55-75 kg (Fundación Omacha).
- No puede rugir (a diferencia del jaguar).
- **Categoría de amenaza citada:** LC global, con la advertencia explícita del documento de que "esto puede cambiar a nivel departamental y local" (fuente: IUCN).

**Uso sugerido:** la nota sobre LC global vs. posible presión local es un matiz útil si la app quiere comunicar riesgo regional sin inflar la categoría oficial.

---

## Especies nuevas para el catálogo (no existen hoy en `species.json`)

### 4. Tití gris — *Saguinus leucopus* (el documento usa "*Oedipomidas leucopus*", sinónimo/nombre alterno — verificar cuál usar)
Grupo sugerido: mamiferos. **Sin fotos disponibles todavía.**

**Apodo del documento:** "El sembrador"

- Hábitat: bosques secos y otros bosques tropicales; en Antioquia, subregiones Oriente, Nordeste, Bajo Cauca y Magdalena Medio.
- Tamaño pequeño: ~500 g, cuerpo 18-30 cm, cola no prensil de 25-45 cm.
- Garras en vez de uñas — le facilitan aferrarse a las ramas.
- Dieta variada: frutos, bayas, insectos, pequeños anfibios/reptiles, cortezas, látex.
- Partos gemelares dos veces al año; toda la tropa cuida a las crías.
- **Categoría de amenaza citada:** CR (crítico) — Resolución 0126 de 2024.

**Nota de cruce:** ya aparece con el mismo nombre científico "Saguinus leucopus" en la ficha técnica citada del CAR (2012) usada como fuente. La app de las 150 especies no lo incluye explícitamente, pero es primate endémico de Colombia (no exclusivo de Antioquia) — categoría de amenaza CR lo hace un candidato fuerte si se consiguen fotos.

---

### 5. Zarigüeya — *Didelphis marsupialis*
Grupo sugerido: mamiferos. **Sin fotos disponibles todavía.**

**Apodo del documento:** "La madre valiente"

- Hábitat amplísimo: desde zonas costeras hasta más de 3.000 msnm, incluidas áreas urbanas.
- Peso 0,5-3,5 kg; cola prensil; marsupio en las hembras.
- Omnívora muy flexible: frutas, néctar, lombrices, roedores, huevos, carroña, incluso arácnidos venenosos.
- Gestación cortísima; las crías nacen casi fetales y terminan de desarrollarse en el marsupio.
- Pariente lejana de canguros y koalas, no de roedores. Existen 38-50 especies de zarigüeya en Colombia (Fundación Zarigüeya / FUNDZAR, 2020).
- **Categoría de amenaza citada:** LC global, con el mismo matiz de riesgo local por atropellamientos y persecución por miedo/desinformación (fuente IUCN).

**Nota de cruce:** el documento incluye además dos cuentos infantiles centrados en zarigüeyas ("Zari la zarigüeya"), lo que sugiere que es una especie con buen potencial de conexión emocional/educativa si se agrega al catálogo.

---

### 6. Tortuga caná o laúd — *Dermochelys coriacea*
Grupo sugerido: anfibios_reptiles. **Sin fotos disponibles todavía.**

**Apodo del documento:** "La viajera del océano"

- Migra miles de km entre zonas de alimentación en aguas frías y playas tropicales de anidación.
- En Antioquia anida en playa Bobalito, Necoclí — sitio hoy obstruido por troncos/desechos del río Atrato (ver ficha de ecosistema "Playas y mar").
- Hasta 180 cm de caparazón (casi 2 m) y ~500 kg — es la tortuga marina más grande del mundo.
- No tiene caparazón de escamas sino piel curtida con 7 quillas longitudinales.
- Se alimenta casi exclusivamente de medusas — las bolsas plásticas en el mar son letales porque las confunde con su alimento.
- **Categoría de amenaza citada:** CR (crítico) — Resolución 0126 de 2024.

**Nota de cruce:** el documento también menciona la tortuga carey (*Eretmochelys imbricata*) como una de las 4 especies de tortugas marinas que anidan en Necoclí, pero sin ficha propia — posible quinta especie a investigar si se amplía este grupo.

---

### 7. Murciélago de sacos alares antioqueño — *Saccopteryx antioquensis*
Grupo sugerido: mamiferos. **Sin fotos disponibles todavía — este es el más urgente de fotografiar, dado su perfil de endemismo estricto.**

**Apodo del documento:** "El héroe de la noche"

- Endémico — solo existe en un pequeño territorio del corredor kárstico del Oriente antioqueño, entre 650 y 1.200 msnm.
- Insectívoro: 5 g de peso, 40-44 mm cabeza-cola (Guía Ilustrada de los Mamíferos de Colombia, 2025).
- Descubierto en 1996 en San Luis y Sonsón, descrito formalmente en 2001.
- Una de las 8 especies de murciélago endémicas de Colombia.
- Tiene "sacos" en las alas donde los machos depositan saliva/excremento/orina para atraer hembras y emitir feromonas.
- **Amenaza principal citada:** al menos 95 títulos mineros activos (caliza, mármol) en su hábitat — dato ya incorporado en el reporte de especies endémicas de este proyecto.
- **Categoría de amenaza citada:** EN (Resolución 0126 de 2024).

**Nota de cruce:** ya está en `Especies_Endemicas_Antioquia.xlsx`/`.html` (grupo Mamíferos, fila con topónimo "Antioquia"). Este documento añade el detalle de descubrimiento/descripción y el dato de los 95 títulos mineros, que antes no teníamos.

---

### 8. Águila arpía — *Harpia harpyja*
Grupo sugerido: aves. **Sin fotos disponibles todavía.**

**Apodo del documento:** "La vigilante de los cielos"

- Hábitat: grandes extensiones de bosque tropical húmedo, dosel. En Antioquia, principalmente Urabá.
- 6-9 kg, envergadura ~2,2 m — de las rapaces más grandes del continente.
- Caza mamíferos arborícolas (perezosos, monos, puercoespines, armadillos) y aves grandes (loros, guacamayos), incluso iguanas y serpientes.
- Monógama de por vida; cría un solo polluelo cada 2-4 años — reproducción muy lenta.
- Necesita ~100 km² de bosque por individuo — su ausencia es indicador temprano de pérdida de selva.
- **Categoría de amenaza citada:** VU (fuente IUCN).

---

## Investigación complementaria (a pedido explícito)

### 9. Manatí antillano — *Trichechus manatus*
Grupo sugerido: mamiferos. **Sin fotos disponibles todavía.**

**Apodo del documento:** "La vaca marina, guardián de los humedales"

**Del documento:**
- En Antioquia: cuenca del Atrato (manglares de Turbo) y cuenca del Magdalena, especialmente Magdalena Medio (Yondó).
- 2,5-4,5 m, 200-600 kg (promedio 450 kg).
- Herbívoro: buchón de agua, pastos acuáticos, algas sumergidas.
- Gestación de 13 meses, una cría cada 4-5 años — ciclo reproductivo muy lento.
- Pariente terrestre más cercano: el elefante (no delfines ni focas).
- Sin depredadores naturales — solo la actividad humana (caza, contaminación, sequías, calentamiento del agua) lo amenaza.
- **Categoría de amenaza citada:** EN (Resolución 0126 de 2024).
- Experta citada: Katerin Arévalo González.

**Investigación adicional (fuentes propias, agosto 2026):**
- **IUCN global confirma EN, no solo la resolución colombiana.** El manatí antillano como especie (*Trichechus manatus*) está catalogado Vulnerable a nivel global, pero la subespecie presente en Colombia — *Trichechus manatus manatus*, la del Caribe/Antillas — está evaluada específicamente como **En Peligro (EN)** por IUCN (2024). Es decir, en este caso Resolución 0126/2024 e IUCN **no divergen**: ambas fuentes coinciden en EN para la población que nos concierne. [IUCN Red List — West Indian manatee](https://www.iucnredlist.org/species/pdf/43793924)
- **Existe un Plan de Acción Regional 2021-2026** para la conservación del manatí antillano en el Magdalena Medio, liderado principalmente desde el lado santandereano (CAS, Ecopetrol, Cabildo Verde de Sabana de Torres), con foco en Ciénaga de Paredes. El documento de Antioquia Viva no menciona este plan ni articulación con Yondó — vale la pena preguntar a SIDAP si existe una contraparte antioqueña activa o si es una oportunidad de gestión. [Plan Manatí — Ecopetrol](https://files.ecopetrol.com.co/web/esp/PVS/cartillas-otros/Plan%20Manati.pdf)
- El manatí también habita las cuencas Cauca, San Jorge y Sinú, no solo Atrato/Magdalena — el documento simplifica un poco la distribución real en Colombia.

**Nota de cruce:** no está en `Especies_Endemicas_Antioquia.xlsx` (no es endémica ni tiene nombre toponímico) ni en el documento de las 150 especies revisado en junio. Es, sin embargo, una de las especies con más fuerza narrativa/educativa de todo "Antioquia Viva" (protagoniza uno de los cuentos infantiles, "La historia de un manatí").

---

### 10. Cangrejo azul — *Cardisoma guanhumi*
Grupo sugerido: **no encaja en ningún grupo actual del catálogo** (crustáceo — la app no tiene categoría para invertebrados marinos/costeros). Punto a decidir. **Sin fotos disponibles todavía.**

**Apodo del documento:** "Aireador y limpiador de los ecosistemas"

**Del documento:**
- En Antioquia: Golfo de Urabá — estuarios, lagunas, manglares, playas.
- Hasta 15 cm de ancho de caparazón, 500 g (iNaturalist.org).
- Omnívoro: hojas y frutos de mangle rojo, y carroña.
- Cava madrigueras que airean el suelo de playas y manglares.
- Hembras ovadas muestran coloración blanquecina distintiva; llevan los huevos bajo el abdomen.
- Es fuente de alimento humano — el consumo excesivo de hembras ovadas amenaza la especie.
- **Categoría de amenaza citada:** VU (Resolución 0126 de 2024).

**Investigación adicional (fuentes propias, agosto 2026):**
- **No es endémico ni tiene nombre toponímico** — se distribuye ampliamente por el Caribe, desde las Antillas hasta el sur de Venezuela y Colombia, con registros incluso en Brasil. No calificaría para el reporte de especies endémicas.
- **El "Libro Rojo de Invertebrados Marinos de Colombia" también lo cataloga VU** — coincide con la Resolución 0126/2024, misma conclusión que con el manatí: sin divergencia entre fuentes para esta especie.
- **Hay investigación específica hecha en Antioquia:** un estudio sobre el efecto de borde de la conversión de manglar a potrero sobre la población de cangrejo azul en la bahía El Uno, Golfo de Urabá (Blanco-Libreros et al., Caldasia/ResearchGate), y otro específicamente en Turbo sobre la variación de densidad de madrigueras asociada a temporada de caza. Es decir, ya existe línea de base científica local que podría citarse en una ficha de la app en vez de depender solo de fuentes globales. [Efecto de borde — SciELO](http://www.scielo.org.co/scielo.php?script=sci_arttext&pid=S0304-35842014000100006) · [Variación de densidad de madriguera en Turbo — Caldasia](https://revistas.unal.edu.co/index.php/cal/article/view/100699)
- **Sobreexplotación activa y con métodos ilegales:** las fuentes describen captura y comercialización ilegal en la costa norte colombiana, incluyendo el uso de venenos que también matan otras especies — un ángulo de amenaza más severo que el que describe el documento de Antioquia Viva, que solo menciona el "consumo excesivo".

**Nota de cruce:** esta es la única de las 10 especies de fauna emblemática que no tiene un grupo taxonómico claro en la app hoy (ni mamiferos, ni aves, ni anfibios_reptiles, ni peces le quedan bien). Si se decide incluirlo, hay que resolver primero si vale la pena crear una categoría nueva (ej. "invertebrados") solo para esta especie, o si se deja fuera del catálogo pero se documenta en la ficha del ecosistema "Manglares".

---

## Resumen para la conversación

| # | Especie | Estado en la app | Bloqueo principal |
|---|---|---|---|
| 1 | Oso andino | Ya existe — enriquecer | Ninguno |
| 2 | Jaguar | Ya existe — enriquecer | Ninguno |
| 3 | Puma | Ya existe — enriquecer | Ninguno |
| 4 | Tití gris | Nueva | Falta foto; confirmar género (Saguinus vs. Oedipomidas) |
| 5 | Zarigüeya | Nueva | Falta foto |
| 6 | Tortuga caná o laúd | Nueva | Falta foto |
| 7 | Murciélago de sacos alares antioqueño | Nueva | Falta foto — prioridad alta (endémico estricto) |
| 8 | Águila arpía | Nueva | Falta foto |
| 9 | Manatí antillano | Nueva | Falta foto |
| 10 | Cangrejo azul | Nueva | Falta foto **y** grupo taxonómico donde encaje |

Ninguna tiene foto propia todavía en `biodiversidad/img/species/` — antes de agregar cualquiera de las 7 nuevas al catálogo real habría que conseguir fotografía (con los mismos criterios de curaduría ya usados en el resto del proyecto) o esperar a que la Gobernación/SIDAP autorice el uso de material de "Antioquia Viva" / CORANTIOQUIA / CORPOURABA.

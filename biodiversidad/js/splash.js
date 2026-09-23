/* ============================================================
   Antioquia Natural — splash.js
   Pantalla de animación de bienvenida: se muestra cada vez que se
   pasa de la pantalla de idioma al feed, y bajo demanda desde el
   botón "Ver animación" del feed.
   ============================================================ */

(function () {
  I18n.init();

  const video = document.getElementById('splash-video');
  const skip  = document.getElementById('splash-skip');

  let done = false;

  // Fade-out antes de navegar: @view-transition (splash.css/feed.css) da
  // un cross-fade nativo donde el navegador lo soporta, pero no es
  // confiable con <video> en todos los casos. Este fade manual (video +
  // botón "Saltar" -> fondo verde de marca, y feed.html arranca oculto y
  // hace fade-in — ver su <script> inline) es el respaldo garantizado:
  // funciona igual haya o no soporte nativo.
  function goToFeed() {
    if (done) return;
    done = true;
    clearTimeout(fallback);
    video.classList.add('is-hidden');
    skip.classList.add('is-hidden');
    setTimeout(() => { window.location.href = 'feed.html'; }, 500);
  }

  // Salvaguarda: si el video no puede reproducirse o el evento 'ended'
  // no dispara por algún motivo, no dejar a nadie atascado en la pantalla.
  const fallback = setTimeout(goToFeed, 9000);

  // Arrancar el fade-out 1s antes de que el video termine, para que la
  // transición ya esté en curso al llegar al último frame (en vez de
  // esperar a 'ended' y sumar el fade completo después).
  video.addEventListener('timeupdate', () => {
    if (video.duration && video.currentTime >= video.duration - 1) goToFeed();
  });

  video.addEventListener('ended', goToFeed);
  video.addEventListener('error', goToFeed);
  skip.addEventListener('click', goToFeed);

  // Aprovechar el tiempo de reproducción para precalentar el caché HTTP
  // con los assets de feed.html — solo arranca cuando el video ya tiene
  // suficiente buffer para reproducirse sin cortes, para no competir por
  // ancho de banda con la descarga del propio video.
  let prefetched = false;
  video.addEventListener('canplaythrough', () => {
    if (prefetched) return;
    prefetched = true;
    prefetchFeedAssets();
  });

  function prefetchFeedAssets() {
    const files = [
      'css/main.css?v=6',
      'css/components.css?v=21',
      'css/animations.css?v=4',
      'css/feed.css?v=7',
      'js/nav.js?v=3',
      'js/app.js?v=7',
      'js/feed.js?v=4',
      'data/species.json',
      '../comunidad/jovenes_pa_lante/data/fotos_biodiversidad.json',
      '../comunidad/guarda_cuencas/data/fotos_cuencas.json',
    ];
    files.forEach(url => {
      fetch(url, { cache: 'force-cache' }).catch(() => {});
    });

    const bg = new Image();
    bg.src = 'img/fondos/fondo-biodiversidad.webp';

    // Lo más pesado del feed no es el HTML/CSS/JS sino las fotos en sí —
    // se arma el mismo FeedStore que usará feed.html y se precargan las
    // primeras miniaturas (las que salen con loading="eager" en la
    // cuadrícula, la vista por defecto), para que ya estén en caché del
    // navegador cuando el feed las pida.
    FeedStore.init().then(() => {
      FeedStore.getItems({ source: 'all' }).slice(0, 9).forEach(item => {
        const url = item.imgs && item.imgs[0];
        if (!url) return;
        const img = new Image();
        img.src = url;
      });
    }).catch(() => {});
  }
}());

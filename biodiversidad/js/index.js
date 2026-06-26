function selectLang(lang) {
      localStorage.setItem('ab_lang', lang);

      // Animación de salida
      document.querySelector('.lang-page__content').style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      document.querySelector('.lang-page__content').style.opacity = '0';
      document.querySelector('.lang-page__content').style.transform = 'translateY(-20px) scale(0.97)';

      setTimeout(() => {
        window.location.href = 'home.html';
      }, 300);
    }

    // Si ya eligió idioma antes, mostrar el prompt en ese idioma
    const savedLang = localStorage.getItem('ab_lang');
    if (savedLang === 'en') {
      document.getElementById('lang-prompt').textContent = 'Choose your language';
    }

    // Efecto ripple en botones
    document.querySelectorAll('.ripple-container').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
      });
    });

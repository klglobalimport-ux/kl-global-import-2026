(function () {
  function initMegaMenuLinks() {
    var columns = Array.prototype.slice.call(document.querySelectorAll('.mega-menu__column'));

    columns.forEach(function (column) {
      var heading = column.querySelector('h3');
      var discoverLink = column.querySelector('a[href]');

      if (!heading || !discoverLink) {
        return;
      }

      discoverLink.classList.add('mega-menu__cta');

      if (heading.querySelector('a')) {
        return;
      }

      var titleLink = document.createElement('a');
      titleLink.className = 'mega-menu__title-link';
      titleLink.href = discoverLink.getAttribute('href');
      titleLink.textContent = heading.textContent.trim();

      heading.textContent = '';
      heading.appendChild(titleLink);
    });
  }

  function initCardReveal() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    if (!cards.length) {
      return;
    }

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var delayByContainer = new WeakMap();

    function getContainer(card) {
      return (
        card.closest('.product-grid, .carousel, .habitat-grid, .insolite-grid, [class*="detail-grid"]') ||
        card.parentElement
      );
    }

    function getNextDelay(card) {
      var container = getContainer(card);
      var current = delayByContainer.get(container) || 0;
      delayByContainer.set(container, current + 1);
      return Math.min(current * 90, 540);
    }

    cards.forEach(function (card) {
      card.classList.add('reveal-on-scroll');
      card.style.setProperty('--reveal-delay', getNextDelay(card) + 'ms');
    });

    if (prefersReducedMotion) {
      cards.forEach(function (card) {
        card.classList.add('is-visible');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      cards.forEach(function (card) {
        card.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, observerRef) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          observerRef.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    cards.forEach(function (card) {
      observer.observe(card);
    });
  }

  function initMegaMenuRipple() {
    var columns = Array.prototype.slice.call(document.querySelectorAll('.mega-menu__column'));
    if (!columns.length) {
      return;
    }

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    columns.forEach(function (column) {
      function updateRipplePosition(event) {
        if (prefersReducedMotion) {
          return;
        }

        var rect = column.getBoundingClientRect();
        var x = ((event.clientX - rect.left) / rect.width) * 100;
        var y = ((event.clientY - rect.top) / rect.height) * 100;

        column.style.setProperty('--ripple-x', x + '%');
        column.style.setProperty('--ripple-y', y + '%');
      }

      column.addEventListener('mousemove', updateRipplePosition);
      column.addEventListener('mouseenter', updateRipplePosition);
    });
  }

  function initMouseHalo() {
    var body = document.body;
    if (!body) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    var halo = document.createElement('div');
    halo.className = 'mouse-halo';
    body.appendChild(halo);

    function updatePosition(event) {
      halo.style.transform = 'translate3d(' + (event.clientX - 90) + 'px, ' + (event.clientY - 90) + 'px, 0)';
    }

    document.addEventListener('mousemove', function (event) {
      body.classList.add('mouse-halo-active');
      updatePosition(event);
    });

    document.addEventListener('mouseleave', function () {
      body.classList.remove('mouse-halo-active');
    });

    document.addEventListener('mouseenter', function () {
      body.classList.add('mouse-halo-active');
    });

    window.addEventListener('blur', function () {
      body.classList.remove('mouse-halo-active');
    });

    window.addEventListener('focus', function () {
      body.classList.add('mouse-halo-active');
    });
  }

  function initBackButtonStickyOnScroll() {
    var body = document.body;
    if (!body) {
      return;
    }

    var ticking = false;

    function syncBackButtonState() {
      ticking = false;
      body.classList.toggle('has-scrolled', window.scrollY > 4);
    }

    function onScroll() {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(syncBackButtonState);
    }

    syncBackButtonState();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  function initMaisonLightbox() {
    var page = document.body;
    if (!page || !(page.classList.contains('maison-10ft-page') || page.classList.contains('maison-20ft-page') || page.classList.contains('maison-30ft-page'))) {
      return;
    }

    var images = Array.prototype.slice.call(
      document.querySelectorAll(
        '.hero-visual-image, .capsule-photo-thumb img, .capsule-carousel-item img'
      )
    );

    if (!images.length) {
      return;
    }

    var carouselImages = Array.prototype.slice.call(document.querySelectorAll('.capsule-carousel-item img'));
    var carouselIndexMap = new WeakMap();
    var isOpen = false;
    var currentCarouselIndex = -1;
    var MAX_ZOOM = 3;
    var currentZoom = 1;
    var isZoomed = false;

    carouselImages.forEach(function (image, index) {
      carouselIndexMap.set(image, index);
    });

    var lightbox = document.createElement('div');
    lightbox.className = 'maison-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML =
      '<div class="maison-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Image en grand format">' +
      '<button class="maison-lightbox__close" type="button" aria-label="Fermer l\'image">×</button>' +
      '<button class="maison-lightbox__nav maison-lightbox__nav--prev" type="button" aria-label="Image précédente">❮</button>' +
      '<img class="maison-lightbox__image" alt="" loading="eager">' +
      '<button class="maison-lightbox__nav maison-lightbox__nav--next" type="button" aria-label="Image suivante">❯</button>' +
      '</div>';

    page.appendChild(lightbox);

    var lightboxImage = lightbox.querySelector('.maison-lightbox__image');
    var closeButton = lightbox.querySelector('.maison-lightbox__close');
    var prevButton = lightbox.querySelector('.maison-lightbox__nav--prev');
    var nextButton = lightbox.querySelector('.maison-lightbox__nav--next');

    function resetZoom() {
      currentZoom = 1;
      isZoomed = false;
      lightboxImage.style.transform = '';
      lightboxImage.style.cursor = 'zoom-in';
      lightboxImage.classList.remove('is-zoomed');
    }

    function toggleZoom() {
      if (isZoomed) {
        resetZoom();
      } else {
        currentZoom = MAX_ZOOM;
        isZoomed = true;
        lightboxImage.style.transform = 'scale(' + MAX_ZOOM + ')';
        lightboxImage.style.cursor = 'zoom-out';
        lightboxImage.classList.add('is-zoomed');
      }
    }

    lightboxImage.addEventListener('click', function (event) {
      event.stopPropagation();
      toggleZoom();
    });

    function updateLightboxImage(image) {
      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt || 'Image en grand format';
      resetZoom();
    }

    function syncNavState() {
      lightbox.classList.toggle('has-carousel-nav', currentCarouselIndex >= 0);
    }

    function openLightbox(image) {
      updateLightboxImage(image);
      currentCarouselIndex = carouselIndexMap.has(image) ? carouselIndexMap.get(image) : -1;
      syncNavState();
      isOpen = true;
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      page.classList.add('lightbox-open');
    }

    function closeLightbox() {
      if (!isOpen) {
        return;
      }

      isOpen = false;
      currentCarouselIndex = -1;
      resetZoom();
      syncNavState();
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      page.classList.remove('lightbox-open');
    }

    function showCarouselImage(step) {
      if (currentCarouselIndex < 0 || !carouselImages.length) {
        return;
      }

      currentCarouselIndex = (currentCarouselIndex + step + carouselImages.length) % carouselImages.length;
      updateLightboxImage(carouselImages[currentCarouselIndex]);
      syncNavState();
    }

    images.forEach(function (image) {
      image.classList.add('zoomable-media');

      image.addEventListener('click', function () {
        openLightbox(image);
      });
    });

    closeButton.addEventListener('click', closeLightbox);

    lightbox.addEventListener('click', function (event) {
      if (event.target !== lightbox) {
        return;
      }
      closeLightbox();
    });

    prevButton.addEventListener('click', function (event) {
      event.stopPropagation();
      showCarouselImage(-1);
    });

    nextButton.addEventListener('click', function (event) {
      event.stopPropagation();
      showCarouselImage(1);
    });

    document.addEventListener('keydown', function (event) {
      if (!isOpen) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showCarouselImage(-1);
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showCarouselImage(1);
      }
    });
  }

  function initContactMessagePrefill() {
    var messageField = document.getElementById('message');
    if (!messageField) {
      return;
    }

    var searchParams = new URLSearchParams(window.location.search);
    var prefillKey = searchParams.get('prefill');
    var customMessage = searchParams.get('message');

    var presets = {
      'maison-10ft': [
        'Bonjour KL Global Import,',
        'Je souhaite être accompagné dans mon projet concernant le produit : Maison 10 ft Container Dépliable Modulaire.',
        '',
        'Récapitulatif technique :',
        '- Dimensions dépliées : 3,00 m x 6,36 m x 2,53 m',
        '- Dimensions pliées (Transport) : 3,00 m x 2,25 m x 2,53 m',
        '- Structure : Cadre renforcé 9,0 mm / Toiture 1,3 mm',
        '- Caractéristiques : Isolation haute performance, Panneaux de ciment Classe A, Menuiseries Aluminium Rupture Pont Thermique.',
        '',
        'Merci de me recontacter pour discuter de mes besoins spécifiques.'
      ].join('\n'),
      'maison-20ft': [
        'Demande d\'accompagnement pour Maison Modulaire 20FT (37,3 m²) — Isolation bambou graphité 65mm'
      ].join('\n'),
      'maison-30ft': [
        'Bonjour KL Global Import,',
        'Je souhaite être accompagné dans mon projet concernant le produit : Maison Modulaire 30 FT.',
        '',
        'Récapitulatif technique :',
        '- Surface déployée : 56 m²',
        '- Dimensions dépliées : 9,00 m x 6,22 m x 2,48 m',
        '- Dimensions pliées (Transport) : 9,00 m x 2,20 m x 2,48 m',
        '- Structure : Tubes carrés galvanisés 60×80×2.0mm',
        '- Configurations : 2 ou 3 chambres + salon + SDB',
        '- Caractéristiques : Isolation bambou graphité 75mm, Menuiseries Aluminium RPT double vitrage, Sol SPC 4.0mm.',
        '',
        'Merci de me recontacter pour discuter de mes besoins spécifiques.'
      ].join('\n')
    };

    var message = customMessage || presets[prefillKey];
    if (!message) {
      return;
    }

    messageField.value = message;
    messageField.focus();

    var endPosition = messageField.value.length;
    if (typeof messageField.setSelectionRange === 'function') {
      messageField.setSelectionRange(endPosition, endPosition);
    }
  }

  function normalizeText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function getProductTitle() {
    var selectors = ['main h1', '.hero-content h1', '.section-title h2', 'h1', 'title'];

    for (var i = 0; i < selectors.length; i += 1) {
      var node = document.querySelector(selectors[i]);
      if (!node) {
        continue;
      }

      var text = normalizeText(node.textContent);
      if (text) {
        return text;
      }
    }

    return 'Produit non spécifié';
  }

  function getProductPrice() {
    var metaPrice = document.querySelector('meta[itemprop="price"]');
    if (metaPrice) {
      var contentPrice = normalizeText(metaPrice.getAttribute('content'));
      if (contentPrice) {
        return contentPrice.indexOf('€') >= 0 ? contentPrice : contentPrice + ' €';
      }
    }

    var priceSelectors = [
      '[data-price]',
      '.price',
      '.prix',
      '[class*="price"]',
      '[class*="prix"]',
      '[id*="price"]',
      '[id*="prix"]'
    ];

    for (var i = 0; i < priceSelectors.length; i += 1) {
      var nodes = Array.prototype.slice.call(document.querySelectorAll(priceSelectors[i]));
      for (var j = 0; j < nodes.length; j += 1) {
        var text = normalizeText(nodes[j].getAttribute('data-price') || nodes[j].textContent);
        if (!text) {
          continue;
        }

        if (/[0-9][0-9\s.,]*(?:€|eur|euros?)/i.test(text) || /(?:€|eur|euros?)\s*[0-9]/i.test(text)) {
          return text;
        }
      }
    }

    var pageText = normalizeText(document.body ? document.body.innerText : '');
    var priceMatch = pageText.match(/([0-9][0-9\s.,]{1,20}(?:€|eur|euros?))/i);
    return priceMatch ? normalizeText(priceMatch[1]) : '';
  }

  function getProductFeatures() {
    var scope = document.querySelector('main') || document.body;
    if (!scope) {
      return [];
    }

    var selectors = [
      '.capsule-text-card p',
      '[class*="detail"] p',
      '[class*="spec"] p',
      '[class*="description"] p',
      '.product-description p',
      '.product-specs li',
      '[class*="spec"] li',
      '[class*="detail"] li',
      '[class*="description"] li',
      '.product-description li'
    ];

    var candidates = [];
    selectors.forEach(function (selector) {
      var nodes = Array.prototype.slice.call(scope.querySelectorAll(selector));
      nodes.forEach(function (node) {
        candidates.push(node);
      });
    });

    if (!candidates.length) {
      candidates = Array.prototype.slice.call(scope.querySelectorAll('p, li'));
    }

    var seen = Object.create(null);
    var keywords = /(dimension|dimensions|taille|mesure|materiau|matériau|structure|isolation|toiture|paroi|acier|aluminium|epaisseur|épaisseur|poids|puissance|moteur|capacite|capacité|longueur|largeur|hauteur)/i;

    var features = candidates
      .map(function (node) {
        return normalizeText(node.textContent);
      })
      .filter(function (text) {
        if (!text || text.length < 18 || text.length > 260) {
          return false;
        }

        if (seen[text.toLowerCase()]) {
          return false;
        }
        seen[text.toLowerCase()] = true;

        return keywords.test(text) || /[0-9]+(?:[.,][0-9]+)?\s*(?:m|mm|cm|kg|kw|cv)\b/i.test(text);
      })
      .slice(0, 8);

    return features;
  }

  function buildPrefillMessage(payload) {
    var lines = [
      'Bonjour KL Global Import, je souhaite recevoir un devis detaille pour le produit : ' + payload.title + '.',
      ''
    ];

    if (payload.price) {
      lines.push('Prix affiche : ' + payload.price);
      lines.push('');
    }

    lines.push('Recapitulatif technique extrait :');

    if (payload.features.length) {
      payload.features.forEach(function (feature) {
        lines.push('- ' + feature);
      });
    } else {
      lines.push('- Caracteristiques techniques a confirmer avec votre equipe commerciale.');
    }

    lines.push('');
    lines.push('Merci de me recontacter pour finaliser mon projet.');

    return lines.join('\n');
  }

  function resolveContactUrl(trigger) {
    if (trigger && trigger.tagName === 'A') {
      var href = trigger.getAttribute('href');
      if (href) {
        return new URL(href, window.location.href);
      }
    }

    return new URL('contact.html', window.location.href);
  }

  function initDynamicProductContactLinks() {
    var triggers = Array.prototype.slice.call(
      document.querySelectorAll('a.devis-btn, button.devis-btn, a.accompagnement-btn, button.accompagnement-btn')
    );

    if (!triggers.length) {
      return;
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();

        var staticMessage = trigger.getAttribute('data-prefill-message');
        var message = staticMessage || buildPrefillMessage({
          title: getProductTitle(),
          price: getProductPrice(),
          features: getProductFeatures()
        });

        var contactUrl = resolveContactUrl(trigger);
        contactUrl.searchParams.set('message', message);
        window.location.href = contactUrl.toString();
      });
    });
  }

  function initMaisonCarouselNav() {
    var page = document.body;
    if (!page || !(page.classList.contains('maison-10ft-page') || page.classList.contains('maison-20ft-page') || page.classList.contains('maison-30ft-page'))) {
      return;
    }

    var carousel = document.querySelector('.capsule-carousel');
    if (!carousel) {
      return;
    }

    var track = carousel.querySelector('.capsule-carousel-track');
    var prev = carousel.querySelector('.capsule-carousel-nav--prev');
    var next = carousel.querySelector('.capsule-carousel-nav--next');

    if (!track || !prev || !next) {
      return;
    }

    function getStep() {
      return Math.max(track.clientWidth * 0.85, 220);
    }

    prev.addEventListener('click', function () {
      track.scrollBy({ left: -getStep(), behavior: 'smooth' });
    });

    next.addEventListener('click', function () {
      track.scrollBy({ left: getStep(), behavior: 'smooth' });
    });
  }

  initMegaMenuLinks();
  initMegaMenuRipple();
  initCardReveal();
  initMouseHalo();
  initBackButtonStickyOnScroll();
  initMaisonLightbox();
  initDynamicProductContactLinks();
  initContactMessagePrefill();
  initMaisonCarouselNav();
})();

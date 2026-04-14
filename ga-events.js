(function () {
  'use strict';

  // Utility: safely send GA4 event
  function track(eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params || {});
    }
  }

  // Utility: get product name from URL or text
  function productFromHref(href) {
    var match = href.match(/modele=([^&]+)/);
    if (match) return decodeURIComponent(match[1]);
    match = href.match(/\/(rippa-[^.]+|capsule-[^.]+|maison-[^.]+|kl-[^.]+|apple-[^.]+|derive)/);
    if (match) return match[1];
    return href;
  }

  document.addEventListener('DOMContentLoaded', function () {

    // 1. WhatsApp click
    var whatsapp = document.querySelector('.whatsapp-float');
    if (whatsapp) {
      whatsapp.addEventListener('click', function () {
        track('whatsapp_click', {
          event_category: 'conversion',
          event_label: document.title,
          page: window.location.pathname
        });
      });
    }

    // 2. Contact form submission
    var contactForm = document.querySelector('form[name="contact"]');
    if (contactForm) {
      contactForm.addEventListener('submit', function () {
        var modele = contactForm.querySelector('[name="modele"]');
        track('contact_form_submit', {
          event_category: 'conversion',
          event_label: modele ? modele.value : 'direct',
          page: window.location.pathname
        });
      });
    }

    // 3. "VOIR LA FICHE" clicks (catalogue pages)
    var ficheLinks = document.querySelectorAll('a');
    Array.prototype.forEach.call(ficheLinks, function (link) {
      var text = (link.textContent || '').trim();
      if (text === 'VOIR LA FICHE' || text === 'Voir la fiche \u2192' || text === 'VOIR LA FICHE \u2192') {
        link.addEventListener('click', function () {
          track('view_product', {
            event_category: 'engagement',
            event_label: productFromHref(link.href),
            page: window.location.pathname
          });
        });
      }
    });

    // 4. "DEMANDER UN DEVIS" clicks (product pages)
    var devisLinks = document.querySelectorAll('.devis-btn, a[href*="contact.html?modele="]');
    Array.prototype.forEach.call(devisLinks, function (link) {
      link.addEventListener('click', function () {
        track('request_quote', {
          event_category: 'conversion',
          event_label: productFromHref(link.href),
          page: window.location.pathname
        });
      });
    });

    // 5. Phone number clicks
    var phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    Array.prototype.forEach.call(phoneLinks, function (link) {
      link.addEventListener('click', function () {
        track('phone_click', {
          event_category: 'conversion',
          event_label: link.href.replace('tel:', ''),
          page: window.location.pathname
        });
      });
    });

  });
})();

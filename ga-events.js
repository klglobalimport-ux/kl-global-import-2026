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

    // 1. WhatsApp click (bouton flottant rond vert pr\u00e9sent sur toutes les pages)
    var whatsapp = document.querySelector('.whatsapp-float');
    if (whatsapp) {
      whatsapp.addEventListener('click', function () {
        track('whatsapp_click', {
          page_path: window.location.pathname
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

    // 6. Bandeau Foire Expo GAP \u2014 clic sur le CTA "Nous rencontrer \u2192"
    var gapCta = document.querySelector('.gap-banner__cta');
    if (gapCta) {
      gapCta.addEventListener('click', function () {
        track('gap_banner_cta_click', {});
      });
    }

    // 7. Contact link clicks (listener d\u00e9l\u00e9gu\u00e9 : tout lien vers /contact)
    //    Match /contact (pretty URL Netlify), /contact.html, /contact?xxx, /contact#xxx.
    //    Rejette contacts-us, contact-success, etc. via regex stricte sur le suffixe.
    document.addEventListener('click', function (e) {
      var link = e.target.closest && e.target.closest('a[href*="contact"]');
      if (!link) return;
      var href = link.getAttribute('href') || '';
      if (!/(^|\/)contact(\.html)?(\?|#|$)/.test(href)) return;
      track('contact_link_click', {
        link_text: (link.textContent || '').trim(),
        source_page: window.location.pathname
      });
    });

    // 8. Brochure download clicks (/brochures.html \u2014 22 boutons avec data-pdf)
    //    Track l'intention m\u00eame si le PDF n'existe pas encore (href="#").
    var brochureBtns = document.querySelectorAll('.brochures-tile__btn[data-pdf]');
    Array.prototype.forEach.call(brochureBtns, function (btn) {
      btn.addEventListener('click', function () {
        var pdf = btn.getAttribute('data-pdf') || '';
        var productName = pdf.replace(/\.pdf$/i, '');
        track('brochure_download_click', {
          product_name: productName
        });
      });
    });

    // 9. Tondeuses RC \u2014 clic "Demander un devis" sur les 12 tuiles (tondeuses-rc.html)
    //    Event d\u00e9di\u00e9 (cat\u00e9gorie engagement) distinct du request_quote g\u00e9n\u00e9rique.
    var tondeuseBtns = document.querySelectorAll('a.tile-cta[data-modele]');
    Array.prototype.forEach.call(tondeuseBtns, function (btn) {
      btn.addEventListener('click', function () {
        track('click_devis_tondeuse', {
          event_category: 'engagement',
          event_label: btn.dataset.modele,
          modele: btn.dataset.modele,
          page_location: window.location.href
        });
      });
    });

  });
})();

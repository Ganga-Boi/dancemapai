/**
 * DanceMap Admin UI – Tillæg X-kompatibel
 * Version: 1.0
 *
 * REGLER:
 * - LLM returnerer KUN citater
 * - Ingen automatisk felt-udfyldning
 * - Admin udfylder ALT manuelt
 * - Reference-tekst er KUN visuel hjælp
 */

(function () {
  'use strict';

  /* ============================================================
     STATE
  ============================================================ */

  var state = {
    rawInput: '',
    observations: null,
    references: {
      dato: [],
      navn: [],
      start: [],
      slut: [],
      dansetype: [],
      sted: [],
      adresse: [],
      by: [],
      pris: [],
      arrangoer: [],
      link: [],
      recurring: []
    }
  };

  /* ============================================================
     DOM HELPERS
  ============================================================ */

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function escapeHtml(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ============================================================
     STEP NAVIGATION
  ============================================================ */

  function showStep(id) {
    $$('.step').forEach(function (s) {
      s.classList.remove('active');
    });
    var el = $('#' + id);
    if (el) el.classList.add('active');
    window.scrollTo(0, 0);
  }

  /* ============================================================
     STATUS
  ============================================================ */

  function showStatus(sel, msg, type) {
    var el = $(sel);
    if (!el) return;
    el.textContent = msg || '';
    el.className = 'status-message';
    if (type) el.classList.add(type);
  }

  /* ============================================================
     MOCK LLM – OBSERVERER KUN CITATER
  ============================================================ */

  function mockLLMObserve(text) {
    var obs = {
      dates: [],
      times: [],
      locations: [],
      addresses: [],
      cities: [],
      dance_terms: [],
      prices: [],
      recurrence: [],
      uncertainties: []
    };

    if (!text) return obs;
    var t = text.toLowerCase();

    // Datoer
    var datePatterns = [
      /\d{4}-\d{2}-\d{2}/g,
      /\d{1,2}\.\s*(?:jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)[a-z]*\.?\s*\d{4}?/gi,
      /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g
    ];
    datePatterns.forEach(function (p) {
      (text.match(p) || []).forEach(function (m) {
        if (!obs.dates.includes(m)) obs.dates.push(m);
      });
    });

    // Tider
    (text.match(/\b\d{1,2}[:.]\d{2}\b/g) || []).forEach(function (m) {
      if (!obs.times.includes(m)) obs.times.push(m);
    });

    // Steder
    [
      'Kedelhallen',
      'Kulturhuset Islands Brygge',
      'Next House Copenhagen',
      'Nødebo Kro',
      'Elite Hotel Savoy',
      'Copenhagen Salsa Academy',
      'CSA'
    ].forEach(function (v) {
      if (t.includes(v.toLowerCase())) obs.locations.push(v);
    });

    // Adresse
    (text.match(/[A-ZÆØÅa-zæøå]+(?:vej|gade|allé|plads|dossering)\s+\d+[A-Za-z]?/gi) || [])
      .forEach(function (m) {
        if (!obs.addresses.includes(m)) obs.addresses.push(m);
      });

    // Byer
    ['København', 'Frederiksberg', 'Malmø', 'Roskilde', 'Vanløse', 'Østerbro']
      .forEach(function (c) {
        if (t.includes(c.toLowerCase())) obs.cities.push(c);
      });

    // Danseformer
    ['salsa', 'bachata', 'kizomba', 'latin', 'reggaeton', 'timba']
      .forEach(function (d) {
        var r = new RegExp('\\b' + d + '\\b', 'gi');
        (text.match(r) || []).forEach(function (m) {
          if (!obs.dance_terms.includes(m)) obs.dance_terms.push(m);
        });
      });

    // Pris
    (text.match(/\d+\s*(kr|dkk)/gi) || []).forEach(function (m) {
      if (!obs.prices.includes(m)) obs.prices.push(m);
    });

    // Gentagelse
    ['weekly', 'ugentlig', 'hver fredag', 'each week']
      .forEach(function (r) {
        if (t.includes(r)) obs.recurrence.push(r);
      });

    if (obs.dates.length > 1) obs.uncertainties.push('Flere datoer fundet');
    if (obs.times.length > 2) obs.uncertainties.push('Flere tider fundet');

    return obs;
  }

  /* ============================================================
     RENDER OBSERVATIONER
  ============================================================ */

  function renderGroup(id, items, key) {
    var el = $('#' + id);
    if (!el) return;
    el.innerHTML = '';
    if (!items.length) {
      el.innerHTML = '<em>(ingen fundet)</em>';
      return;
    }
    items.forEach(function (v) {
      var d = document.createElement('div');
      d.className = 'observation-item';
      d.dataset.key = key;
      d.dataset.value = v;
      d.innerHTML =
        '<span>"' + escapeHtml(v) + '"</span>' +
        '<button class="use">Brug</button>' +
        '<button class="ignore">Ignorer</button>';
      el.appendChild(d);
    });
  }

  function renderObservations(o) {
    renderGroup('obs-dates', o.dates, 'dato');
    renderGroup('obs-times', o.times, 'start');
    renderGroup('obs-locations', o.locations, 'sted');
    renderGroup('obs-addresses', o.addresses, 'adresse');
    renderGroup('obs-cities', o.cities, 'by');
    renderGroup('obs-dance', o.dance_terms, 'dansetype');
    renderGroup('obs-prices', o.prices, 'pris');
    renderGroup('obs-recurrence', o.recurrence, 'recurring');
  }

  /* ============================================================
     ANALYSE
  ============================================================ */

  function analyze() {
    var txt = $('#raw-input').value.trim();
    if (!txt) {
      showStatus('#ocr-status', 'Indsæt tekst først', 'error');
      return;
    }
    showStatus('#ocr-status', 'Analyserer…', 'loading');
    setTimeout(function () {
      state.observations = mockLLMObserve(txt);
      renderObservations(state.observations);
      showStatus('#ocr-status', '', '');
      showStep('step-observations');
    }, 300);
  }

  /* ============================================================
     PREVIEW
  ============================================================ */

  function preview() {
    showStep('step-preview');
  }

  /* ============================================================
     SAVE (INGEN SHEET WRITE)
  ============================================================ */

  function save() {
    console.log('DANCEMAP EVENT (ADMIN)');
    console.log('Sheet-write er BEVIDST ikke aktiv');
    showStatus('#save-status', 'Logget til console', 'success');
  }

  /* ============================================================
     INIT
  ============================================================ */

  function init() {
    $('#btn-analyze')?.addEventListener('click', analyze);
    $('#btn-preview')?.addEventListener('click', preview);
    $('#btn-save')?.addEventListener('click', save);

    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('use')) {
        e.target.parentElement.classList.add('used');
      }
      if (e.target.classList.contains('ignore')) {
        e.target.parentElement.remove();
      }
    });

    showStep('step-input');
    console.log('DanceMap Admin UI loaded');
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

})();

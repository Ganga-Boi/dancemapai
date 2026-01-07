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

(function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════

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

  // ═══════════════════════════════════════════════════════════════
  // DOM HELPERS
  // ═══════════════════════════════════════════════════════════════

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  function showStep(stepId) {
    var steps = $$('.step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.remove('active');
    }
    var target = $('#' + stepId);
    if (target) {
      target.classList.add('active');
    }
    window.scrollTo(0, 0);
  }

  // ═══════════════════════════════════════════════════════════════
  // STATUS MESSAGES
  // ═══════════════════════════════════════════════════════════════

  function showStatus(selector, message, type) {
    var el = $(selector);
    if (!el) return;
    el.textContent = message;
    el.className = 'status-message';
    if (type) {
      el.classList.add(type);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // MOCK LLM FUNCTION (Tillæg X-kompatibel)
  // Returnerer KUN ordrette citater fra teksten
  // ═══════════════════════════════════════════════════════════════

  function mockLLMObserve(text) {
    var observations = {
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

    if (!text || typeof text !== 'string') {
      return observations;
    }

    var textLower = text.toLowerCase();

    // DATOER - kun ordrette citater
    var datePatterns = [
      /\d{1,2}\.?\s*(?:januar|februar|marts|april|maj|juni|juli|august|september|oktober|november|december)(?:\s*\d{4})?/gi,
      /\d{1,2}\.?\s*(?:jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)\.?(?:\s*\d{4})?/gi,
      /\d{4}-\d{2}-\d{2}/g,
      /\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g
    ];
    
    for (var i = 0; i < datePatterns.length; i++) {
      var dateMatches = text.match(datePatterns[i]);
      if (dateMatches) {
        for (var j = 0; j < dateMatches.length; j++) {
          if (observations.dates.indexOf(dateMatches[j]) === -1) {
            observations.dates.push(dateMatches[j]);
          }
        }
      }
    }

    // TIDER - kun ordrette citater
    var timePatterns = [
      /\b([01]?\d|2[0-3])[:\.][0-5]\d\b/g,
      /\b([01]?\d|2[0-3])[:\.][0-5]\d\s*[-–]\s*([01]?\d|2[0-3])[:\.][0-5]\d\b/g
    ];
    
    for (var ti = 0; ti < timePatterns.length; ti++) {
      var timeMatches = text.match(timePatterns[ti]);
      if (timeMatches) {
        for (var tj = 0; tj < timeMatches.length; tj++) {
          if (observations.times.indexOf(timeMatches[tj]) === -1) {
            observations.times.push(timeMatches[tj]);
          }
        }
      }
    }

    // KENDTE VENUES - kun hvis de står i teksten
    var knownVenues = [
      'Kaffesalonen', 'Kedelhallen', 'Club Mambo', 'Lunatica',
      'Cubansk Danseskole', 'Copenhagen Salsa Academy', 'CSA',
      'DGI-byen', 'Kulturhuset Islands Brygge', 'Kulturhuset',
      'The Old Irish Pub', 'Rosie McGees', 'ElStudio',
      'Dansehallerne', 'Bachata House', 'KUBE', 'Cafe Globen',
      'Next House Copenhagen', 'Elite Hotel Savoy', 'Nødebo Kro'
    ];
    
    for (var vi = 0; vi < knownVenues.length; vi++) {
      if (textLower.indexOf(knownVenues[vi].toLowerCase()) !== -1) {
        observations.locations.push(knownVenues[vi]);
      }
    }

    // ADRESSER - kun ordrette citater
    var addressPattern = /[A-ZÆØÅa-zæøå]+(?:vej|gade|allé|alle|plads|stræde|torv|dossering)\s+\d+[A-Za-z]?/gi;
    var addressMatches = text.match(addressPattern);
    if (addressMatches) {
      for (var ai = 0; ai < addressMatches.length; ai++) {
        if (observations.addresses.indexOf(addressMatches[ai]) === -1) {
          observations.addresses.push(addressMatches[ai]);
        }
      }
    }

    // BYER - kun hvis de står i teksten
    var knownCities = [
      'København', 'Copenhagen', 'Frederiksberg', 'Nørrebro',
      'Vesterbro', 'Østerbro', 'Amager', 'Vanløse', 'Valby',
      'Malmø', 'Malmö', 'Roskilde', 'Helsingør'
    ];
    
    for (var ci = 0; ci < knownCities.length; ci++) {
      if (textLower.indexOf(knownCities[ci].toLowerCase()) !== -1) {
        if (observations.cities.indexOf(knownCities[ci]) === -1) {
          observations.cities.push(knownCities[ci]);
        }
      }
    }

    // DANSETERMER - kun ordrette citater
    var danceTerms = [
      'salsa', 'bachata', 'kizomba', 'zouk', 'tango',
      'latin', 'reggaeton', 'merengue', 'rueda', 'cuban',
      'cubansk', 'sensual', 'dominicana', 'social dancing',
      'timba', 'son', 'cha cha'
    ];
    
    for (var di = 0; di < danceTerms.length; di++) {
      var termRegex = new RegExp('\\b' + danceTerms[di] + '\\b', 'gi');
      var termMatches = text.match(termRegex);
      if (termMatches) {
        for (var dm = 0; dm < termMatches.length; dm++) {
          if (observations.dance_terms.indexOf(termMatches[dm]) === -1) {
            observations.dance_terms.push(termMatches[dm]);
          }
        }
      }
    }

    // PRISER - kun ordrette citater
    var pricePatterns = [
      /\d+\s*(?:kr|dkk|,-)/gi,
      /(?:pris|entre|entré|entrance|billet)[:\s]*\d+/gi,
      /\bgratis\b/gi,
      /\bfree\b/gi
    ];
    
    for (var pi = 0; pi < pricePatterns.length; pi++) {
      var priceMatches = text.match(pricePatterns[pi]);
      if (priceMatches) {
        for (var pm = 0; pm < priceMatches.length; pm++) {
          if (observations.prices.indexOf(priceMatches[pm]) === -1) {
            observations.prices.push(priceMatches[pm]);
          }
        }
      }
    }

    // GENTAGELSE - kun ordrette citater
    var recurrenceTerms = [
      'every friday', 'every saturday', 'every sunday',
      'hver fredag', 'hver lørdag', 'hver søndag',
      'ugentlig', 'weekly', 'hver uge',
      'each week', 'all fridays', 'alle fredage'
    ];
    
    for (var ri = 0; ri < recurrenceTerms.length; ri++) {
      if (textLower.indexOf(recurrenceTerms[ri]) !== -1) {
        observations.recurrence.push(recurrenceTerms[ri]);
      }
    }

    // UKLARHEDER
    if (observations.times.length > 2) {
      observations.uncertainties.push('Flere tidsintervaller fundet – vælg start og slut manuelt');
    }
    if (observations.dates.length > 1) {
      observations.uncertainties.push('Flere datoer fundet – vælg den korrekte manuelt');
    }
    if (observations.locations.length > 1) {
      observations.uncertainties.push('Flere steder fundet – vælg det korrekte manuelt');
    }

    return observations;
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER OBSERVATIONS
  // ═══════════════════════════════════════════════════════════════

  function renderObservations(obs) {
    renderObservationGroup('obs-dates', obs.dates || [], 'dato');
    renderObservationGroup('obs-times', obs.times || [], 'start');
    renderObservationGroup('obs-locations', obs.locations || [], 'sted');
    renderObservationGroup('obs-addresses', obs.addresses || [], 'adresse');
    renderObservationGroup('obs-cities', obs.cities || [], 'by');
    renderObservationGroup('obs-dance', obs.dance_terms || [], 'dansetype');
    renderObservationGroup('obs-prices', obs.prices || [], 'pris');
    renderObservationGroup('obs-recurrence', obs.recurrence || [], 'recurring');
    renderUncertainties('obs-uncertainties', obs.uncertainties || []);
  }

  function renderObservationGroup(containerId, items, refKey) {
    var container = $('#' + containerId);
    if (!container) return;
    
    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = '<span class="empty-observation">(ingen fundet)</span>';
      return;
    }

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var div = document.createElement('div');
      div.className = 'observation-item';
      div.setAttribute('data-ref-key', refKey);
      div.setAttribute('data-value', item);
      
      div.innerHTML = 
        '<span class="observation-text">"' + escapeHtml(item) + '"</span>' +
        '<div class="observation-actions">' +
          '<button type="button" class="btn-use">Brug</button>' +
          '<button type="button" class="btn-ignore">Ignorer</button>' +
        '</div>';
      
      container.appendChild(div);
    }
  }

  function renderUncertainties(containerId, items) {
    var container = $('#' + containerId);
    if (!container) return;
    
    container.innerHTML = '';

    if (!items || items.length === 0) {
      container.innerHTML = '<span class="empty-observation">(ingen uklarheder)</span>';
      return;
    }

    for (var i = 0; i < items.length; i++) {
      var div = document.createElement('div');
      div.className = 'observation-item uncertainty';
      div.innerHTML = '<span class="observation-text">' + escapeHtml(items[i]) + '</span>';
      container.appendChild(div);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // OBSERVATION ACTIONS
  // ═══════════════════════════════════════════════════════════════

  function handleUseObservation(item) {
    var refKey = item.getAttribute('data-ref-key');
    var value = item.getAttribute('data-value');

    item.classList.remove('ignored');
    item.classList.add('used');

    // Tilføj til references
    if (!state.references[refKey]) {
      state.references[refKey] = [];
    }
    if (state.references[refKey].indexOf(value) === -1) {
      state.references[refKey].push(value);
    }

    updateReferenceDisplay(refKey);
  }

  function handleIgnoreObservation(item) {
    var refKey = item.getAttribute('data-ref-key');
    var value = item.getAttribute('data-value');

    item.classList.remove('used');
    item.classList.add('ignored');

    // Fjern fra references
    if (state.references[refKey]) {
      var idx = state.references[refKey].indexOf(value);
      if (idx !== -1) {
        state.references[refKey].splice(idx, 1);
      }
    }

    updateReferenceDisplay(refKey);
  }

  function updateReferenceDisplay(refKey) {
    var refEl = $('#ref-' + refKey);
    if (refEl && state.references[refKey]) {
      refEl.textContent = state.references[refKey].join(' | ');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ANALYZE TEXT
  // ═══════════════════════════════════════════════════════════════

  function handleAnalyze() {
    var inputEl = $('#raw-input');
    if (!inputEl) return;

    var text = inputEl.value.trim();

    if (!text) {
      showStatus('#ocr-status', 'Indsæt tekst først', 'error');
      return;
    }

    state.rawInput = text;
    showStatus('#ocr-status', 'Analyserer tekst...', 'loading');

    // Simuler kort forsinkelse for UX
    setTimeout(function() {
      var observations = mockLLMObserve(text);
      state.observations = observations;
      
      // Reset references
      state.references = {
        dato: [], navn: [], start: [], slut: [],
        dansetype: [], sted: [], adresse: [], by: [],
        pris: [], arrangoer: [], link: [], recurring: []
      };

      renderObservations(observations);
      showStatus('#ocr-status', '', '');
      showStep('step-observations');
    }, 300);
  }

  // ═══════════════════════════════════════════════════════════════
  // FILE UPLOAD (MOCK OCR)
  // ═══════════════════════════════════════════════════════════════

  function handleFileUpload(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    showStatus('#ocr-status', 'Behandler billede...', 'loading');

    // Mock OCR - i produktion bruges Tesseract.js
    setTimeout(function() {
      var mockOcrText = '[OCR ikke implementeret]\n\nPaste tekst manuelt i feltet ovenfor.';
      var inputEl = $('#raw-input');
      if (inputEl) {
        inputEl.value = mockOcrText;
      }
      showStatus('#ocr-status', 'Upload modtaget – paste tekst manuelt', 'success');
    }, 500);
  }

  // ═══════════════════════════════════════════════════════════════
  // PREVIEW
  // ═══════════════════════════════════════════════════════════════

  function handlePreview() {
    // Læs værdier fra formular
    var dato = $('#field-dato') ? $('#field-dato').value : '';
    var start = $('#field-start') ? $('#field-start').value : '';
    var dansetype = $('#field-dansetype') ? $('#field-dansetype').value : '';
    var sted = $('#field-sted') ? $('#field-sted').value : '';
    var by = $('#field-by') ? $('#field-by').value : '';

    // Valider påkrævede felter
    if (!dato || !start || !dansetype || !sted || !by) {
      alert('Udfyld alle påkrævede felter:\n- Dato\n- Starttid\n- Dansetype\n- Sted\n- By');
      return;
    }

    // Generer forhåndsvisning
    var previewHtml = generatePreviewHtml();
    var previewCard = $('#preview-card');
    if (previewCard) {
      previewCard.innerHTML = previewHtml;
    }

    showStep('step-preview');
  }

  function generatePreviewHtml() {
    var dato = $('#field-dato') ? $('#field-dato').value : '';
    var navn = $('#field-navn') ? $('#field-navn').value : '';
    var start = $('#field-start') ? $('#field-start').value : '';
    var slut = $('#field-slut') ? $('#field-slut').value : '';
    var dansetype = $('#field-dansetype') ? $('#field-dansetype').value : '';
    var sted = $('#field-sted') ? $('#field-sted').value : '';
    var adresse = $('#field-adresse') ? $('#field-adresse').value : '';
    var by = $('#field-by') ? $('#field-by').value : '';
    var pris = $('#field-pris') ? $('#field-pris').value : '';
    var link = $('#field-link') ? $('#field-link').value : '';
    var recurring = $('#field-recurring') ? $('#field-recurring').value : 'none';

    // Formatér dato
    var dage = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
    var mdr = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    var dateObj = new Date(dato);
    var datoStr = dato;
    
    if (!isNaN(dateObj.getTime())) {
      datoStr = dage[dateObj.getDay()] + ' ' + dateObj.getDate() + '. ' + mdr[dateObj.getMonth()];
    }

    var recurringIcon = recurring === 'weekly' ? ' 🔁' : '';
    var tidStr = start;
    if (slut) {
      tidStr += '–' + slut;
    }

    var html = '<div class="event-date">🗓 ' + escapeHtml(datoStr) + recurringIcon + '</div>';
    
    if (navn) {
      html += '<div class="event-name">📌 ' + escapeHtml(navn) + '</div>';
    }
    
    html += '<div>🕗 ' + escapeHtml(tidStr) + '</div>';
    html += '<div>💃 ' + escapeHtml(dansetype) + '</div>';
    
    var lokation = sted;
    if (adresse) lokation += ', ' + adresse;
    if (by && by !== 'København') lokation += ', ' + by;
    html += '<div>📍 ' + escapeHtml(lokation) + '</div>';
    
    if (pris) {
      html += '<div>💰 ' + escapeHtml(pris) + '</div>';
    }
    
    if (link) {
      html += '<div>🔗 ' + escapeHtml(link) + '</div>';
    }

    return html;
  }

  // ═══════════════════════════════════════════════════════════════
  // SAVE (CONSOLE.LOG - INGEN SHEET WRITE)
  // ═══════════════════════════════════════════════════════════════

  function handleSave() {
    showStatus('#save-status', 'Forbereder data...', 'loading');

    var eventData = {
      dato: $('#field-dato') ? $('#field-dato').value : '',
      navn: $('#field-navn') ? $('#field-navn').value : '',
      start: $('#field-start') ? $('#field-start').value : '',
      slut: $('#field-slut') ? $('#field-slut').value : '',
      dansetype: $('#field-dansetype') ? $('#field-dansetype').value : '',
      sted: $('#field-sted') ? $('#field-sted').value : '',
      adresse: $('#field-adresse') ? $('#field-adresse').value : '',
      by: $('#field-by') ? $('#field-by').value : '',
      pris: $('#field-pris') ? $('#field-pris').value : '',
      arrangoer: $('#field-arrangoer') ? $('#field-arrangoer').value : '',
      link: $('#field-link') ? $('#field-link').value : '',
      status: 'active',
      recurring: $('#field-recurring') ? $('#field-recurring').value : 'none',
      sourceURL: 'admin-import'
    };

    // LOG TIL CONSOLE (INGEN SHEET WRITE ENDNU)
    console.log('═══════════════════════════════════════');
    console.log('DANCEMAP EVENT DATA (Tillæg X godkendt)');
    console.log('═══════════════════════════════════════');
    console.log(JSON.stringify(eventData, null, 2));
    console.log('═══════════════════════════════════════');

    showStatus('#save-status', '✅ Event data logget til console (Sheet-write ikke implementeret)', 'success');

    // Reset efter 3 sekunder
    setTimeout(function() {
      if (confirm('Event logget. Vil du oprette et nyt event?')) {
        resetForm();
      }
    }, 1500);
  }

  // ═══════════════════════════════════════════════════════════════
  // RESET FORM
  // ═══════════════════════════════════════════════════════════════

  function resetForm() {
    // Reset state
    state.rawInput = '';
    state.observations = null;
    state.references = {
      dato: [], navn: [], start: [], slut: [],
      dansetype: [], sted: [], adresse: [], by: [],
      pris: [], arrangoer: [], link: [], recurring: []
    };

    // Reset input
    var rawInput = $('#raw-input');
    if (rawInput) rawInput.value = '';

    // Reset form
    var form = $('#event-form');
    if (form) form.reset();

    // Reset references
    var refs = $$('.reference');
    for (var i = 0; i < refs.length; i++) {
      refs[i].textContent = '';
    }

    // Reset status
    showStatus('#ocr-status', '', '');
    showStatus('#save-status', '', '');

    // Gå til start
    showStep('step-input');
  }

  // ═══════════════════════════════════════════════════════════════
  // EVENT DELEGATION FOR OBSERVATION BUTTONS
  // ═══════════════════════════════════════════════════════════════

  function setupObservationListeners() {
    document.addEventListener('click', function(e) {
      var target = e.target;

      // Brug-knap
      if (target.classList.contains('btn-use')) {
        var item = target.closest('.observation-item');
        if (item) {
          handleUseObservation(item);
        }
        return;
      }

      // Ignorer-knap
      if (target.classList.contains('btn-ignore')) {
        var item = target.closest('.observation-item');
        if (item) {
          handleIgnoreObservation(item);
        }
        return;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════════

  function init() {
    // Trin 1: Analysér
    var btnAnalyze = $('#btn-analyze');
    if (btnAnalyze) {
      btnAnalyze.addEventListener('click', handleAnalyze);
    }

    // Trin 1: File upload
    var fileInput = $('#file-input');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileUpload);
    }

    // Trin 2 → 3
    var btnToForm = $('#btn-to-form');
    if (btnToForm) {
      btnToForm.addEventListener('click', function() {
        showStep('step-form');
      });
    }

    // Trin 3 → 4
    var btnPreview = $('#btn-preview');
    if (btnPreview) {
      btnPreview.addEventListener('click', handlePreview);
    }

    // Trin 4: Tilbage
    var btnBack = $('#btn-back');
    if (btnBack) {
      btnBack.addEventListener('click', function() {
        showStep('step-form');
      });
    }

    // Trin 4: Gem
    var btnSave = $('#btn-save');
    if (btnSave) {
      btnSave.addEventListener('click', handleSave);
    }

    // Setup observation button listeners
    setupObservationListeners();

    // Vis første step
    showStep('step-input');

    console.log('DanceMap Admin UI initialized (Tillæg X-kompatibel)');
  }

  // Start når DOM er klar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

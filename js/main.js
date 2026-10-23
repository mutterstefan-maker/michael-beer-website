// =============================================
// Michael Beer – main.js
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  // ---- Burger menu ----
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // ---- Buchungskalender ----
  const trailerSelect = document.getElementById('trailer-select');
  const dateFrom      = document.getElementById('date-from');
  const dateTo        = document.getElementById('date-to');
  const summary       = document.getElementById('bookingSummary');
  const summaryText   = document.getElementById('summaryText');
  const calGrid       = document.getElementById('calGrid');
  const calMonth      = document.getElementById('calMonth');
  const calHint       = document.getElementById('calHint');

  const toIso   = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmt     = s => fromIso(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const now        = new Date();
  const todayIso   = toIso(now);
  const firstMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let view  = firstMonth;
  let start = null;
  let end   = null;

  function bookedDays() {
    const set = new Set();
    (window.BELEGUNG?.[trailerSelect.value] || []).forEach(entry => {
      const [a, b = a] = entry.split('/');
      for (let d = fromIso(a); d <= fromIso(b); d.setDate(d.getDate() + 1)) set.add(toIso(d));
    });
    return set;
  }

  function rangeIsFree(a, b, booked) {
    for (let d = fromIso(a); d <= fromIso(b); d.setDate(d.getDate() + 1)) {
      if (booked.has(toIso(d))) return false;
    }
    return true;
  }

  function setHint(text, isError = false) {
    calHint.textContent = text;
    calHint.classList.toggle('is-error', isError);
  }

  function renderCalendar() {
    if (!calGrid) return;
    const booked = bookedDays();
    calMonth.textContent = view.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    document.querySelector('.calendar__nav[data-dir="-1"]').disabled = view <= firstMonth;

    calGrid.innerHTML = '';
    const offset = (view.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) calGrid.appendChild(document.createElement('span'));

    const last = end || start;
    const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let n = 1; n <= daysInMonth; n++) {
      const iso = toIso(new Date(view.getFullYear(), view.getMonth(), n));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'calendar__day';
      btn.textContent = n;
      btn.dataset.date = iso;
      btn.setAttribute('aria-label', fmt(iso));

      if (iso < todayIso) btn.disabled = true;
      if (booked.has(iso)) {
        btn.disabled = true;
        btn.classList.add('is-booked');
        btn.setAttribute('aria-label', `${fmt(iso)} – belegt`);
      }
      if (iso === todayIso) btn.classList.add('is-today');
      if (iso === start) btn.classList.add('is-start');
      if (iso === last) btn.classList.add('is-end');
      if (start && iso > start && iso < last) btn.classList.add('is-range');
      btn.setAttribute('aria-pressed', String(!!start && iso >= start && iso <= last));
      calGrid.appendChild(btn);
    }
  }

  function updateSummary() {
    const last = end || start;
    dateFrom.value = start || '';
    dateTo.value   = last || '';
    if (!trailerSelect.value || !start) { summary.style.display = 'none'; return; }
    const days  = Math.round((fromIso(last) - fromIso(start)) / 86400000) + 1;
    const name  = trailerSelect.options[trailerSelect.selectedIndex].text;
    const range = start === last ? fmt(start) : `${fmt(start)} – ${fmt(last)}`;
    summaryText.textContent = ` ${name} · ${days} Tag${days > 1 ? 'e' : ''} (${range})`;
    summary.style.display = 'block';
  }

  calGrid?.addEventListener('click', e => {
    const btn = e.target.closest('.calendar__day');
    if (!btn || btn.disabled) return;
    const iso = btn.dataset.date;

    if (!start || end || iso < start) {
      start = iso; end = null;
      setHint('Jetzt den letzten Miettag anklicken – oder denselben Tag für 1 Tag.');
    } else if (!rangeIsFree(start, iso, bookedDays())) {
      setHint('In diesem Zeitraum ist der Anhänger bereits belegt. Bitte anderen Zeitraum wählen.', true);
      return;
    } else {
      end = iso;
      setHint('Zeitraum gewählt. Zum Ändern einfach einen neuen Starttag anklicken.');
    }
    renderCalendar();
    updateSummary();
  });

  document.querySelectorAll('.calendar__nav').forEach(btn => btn.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth() + Number(btn.dataset.dir), 1);
    renderCalendar();
  }));

  trailerSelect?.addEventListener('change', () => {
    if (start && !rangeIsFree(start, end || start, bookedDays())) {
      start = end = null;
      setHint('Der gewählte Zeitraum ist für diesen Anhänger belegt. Bitte neu wählen.', true);
    }
    renderCalendar();
    updateSummary();
  });

  renderCalendar();

  // ---- Anhänger-Galerie ----
  document.querySelectorAll('.trailer-card__thumb').forEach(thumb => thumb.addEventListener('click', () => {
    const card  = thumb.closest('.trailer-card');
    const photo = card.querySelector('.trailer-card__photo');
    photo.src = thumb.dataset.src;
    photo.alt = thumb.dataset.alt;
    card.querySelectorAll('.trailer-card__thumb').forEach(t => t.classList.toggle('is-active', t === thumb));
  }));

  // ---- "Jetzt buchen" wählt den Anhänger vor ----
  document.querySelectorAll('[data-trailer]').forEach(link => link.addEventListener('click', () => {
    trailerSelect.value = link.dataset.trailer;
    trailerSelect.dispatchEvent(new Event('change'));
  }));

  // ---- Brennholz: Längen & Preisberechnung ----
  const WOOD = {
    weich: { lengths: ['1 m', '50 cm', '33 cm', '25 cm'], price: { srm: 65, ster: 85 } },
    hart:  { lengths: ['33 cm', '25 cm'],                 price: { srm: 100, ster: 140 } }
  };
  const MAX_SRM      = 8;
  const woodType     = document.getElementById('wood-type');
  const woodLength   = document.getElementById('wood-length');
  const woodUnit     = document.getElementById('wood-unit');
  const woodAmount   = document.getElementById('wood-amount');
  const woodEstimate = document.getElementById('woodEstimate');

  function updateWoodLengths() {
    const wood = WOOD[woodType.value];
    woodLength.innerHTML = wood
      ? wood.lengths.map(l => `<option value="${l}">${l}</option>`).join('')
      : '<option value="">– erst Holzsorte wählen –</option>';
    woodLength.disabled = !wood;
  }

  function updateWoodEstimate() {
    const isSrm = woodUnit.value === 'srm';
    woodAmount.max = isSrm ? MAX_SRM : '';
    const wood = WOOD[woodType.value];
    const qty  = Number(woodAmount.value);
    if (!wood || !(qty > 0)) {
      woodEstimate.textContent = 'Holzsorte und Menge wählen, um den Preis zu sehen.';
      return;
    }
    const unit = isSrm ? 'SRM' : 'Ster';
    const sum  = (qty * wood.price[woodUnit.value]).toLocaleString('de-DE');
    woodEstimate.innerHTML = `Holzpreis: <strong>${sum} €</strong> (${qty.toLocaleString('de-DE')} ${unit}) zzgl. Lieferkosten`;
  }

  woodType?.addEventListener('change', () => { updateWoodLengths(); updateWoodEstimate(); });
  [woodUnit, woodAmount].forEach(el => el?.addEventListener('input', updateWoodEstimate));

  document.querySelectorAll('[data-wood]').forEach(link => link.addEventListener('click', () => {
    woodType.value = link.dataset.wood;
    woodType.dispatchEvent(new Event('change'));
  }));

  // ---- Form submissions (mailto fallback – später durch Backend ersetzen) ----
  function handleForm(formId, successMsg, validate) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (validate && !validate()) return;
      // TODO: Backend-Anfrage einbauen (z.B. fetch POST an /api/booking)
      const data = Object.fromEntries(new FormData(form));
      console.log(`[${formId}] Formular-Daten:`, data);

      // Einfache Success-Anzeige
      form.style.display = 'none';
      const div = document.createElement('div');
      div.className = 'form-success';
      div.style.display = 'block';
      div.innerHTML = `
        <div class="success-icon"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg></div>
        <h4>${successMsg}</h4>
        <p>Du bekommst so schnell wie möglich eine Rückmeldung.</p>
      `;
      form.parentNode.appendChild(div);
    });
  }

  handleForm('bookingForm', 'Buchungsanfrage gesendet!', () => {
    if (dateFrom.value) return true;
    setHint('Bitte im Kalender einen Zeitraum auswählen.', true);
    calGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  });
  handleForm('woodForm',    'Holzbestellung eingegangen!');
  handleForm('contactForm', 'Nachricht gesendet!');

  // ---- Smooth anchor scrolling with nav offset ----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
    });
  });
});

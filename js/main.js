// =============================================
// Michael Beer – main.js
// =============================================

// AOS Init
document.addEventListener('DOMContentLoaded', () => {
  AOS.init({ duration: 700, once: true, offset: 80 });

  // ---- NAV scroll ----
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });

  // ---- Burger menu ----
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // ---- Booking summary preview ----
  const trailerSelect = document.getElementById('trailer-select');
  const dateFrom      = document.getElementById('date-from');
  const dateTo        = document.getElementById('date-to');
  const summary       = document.getElementById('bookingSummary');
  const summaryText   = document.getElementById('summaryText');

  function updateSummary() {
    const t = trailerSelect.value;
    const f = dateFrom.value;
    const d = dateTo.value;
    if (t && f && d) {
      const days = Math.max(1, Math.round((new Date(d) - new Date(f)) / 86400000));
      summaryText.textContent = ` Anhänger ${t} · ${days} Tag${days > 1 ? 'e' : ''} (${f} – ${d})`;
      summary.style.display = 'block';
    }
  }
  [trailerSelect, dateFrom, dateTo].forEach(el => el?.addEventListener('change', updateSummary));

  // ---- Set min date ----
  const today = new Date().toISOString().split('T')[0];
  [dateFrom, dateTo].forEach(el => { if (el) el.min = today; });
  if (dateFrom) dateFrom.addEventListener('change', () => {
    if (dateTo) dateTo.min = dateFrom.value;
  });

  // ---- Form submissions (mailto fallback – später durch Backend ersetzen) ----
  function handleForm(formId, successMsg) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      // TODO: Backend-Anfrage einbauen (z.B. fetch POST an /api/booking)
      const data = Object.fromEntries(new FormData(form));
      console.log(`[${formId}] Formular-Daten:`, data);

      // Einfache Success-Anzeige
      form.style.display = 'none';
      const div = document.createElement('div');
      div.className = 'form-success';
      div.style.display = 'block';
      div.innerHTML = `
        <div class="success-icon">✅</div>
        <h4>${successMsg}</h4>
        <p style="color:rgba(255,255,255,.6);font-size:.9rem;margin-top:6px;">Du bekommst so schnell wie möglich eine Rückmeldung.</p>
      `;
      form.parentNode.appendChild(div);
    });
  }

  handleForm('bookingForm', 'Buchungsanfrage gesendet!');
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

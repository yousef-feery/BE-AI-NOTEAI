const btn = document.getElementById('toggleRail');
if (btn) {
  btn.addEventListener('click', () => {
    const expanded = document.body.classList.toggle('sidebar-expanded');
    if (expanded) {
      document.body.classList.remove('sidebar-collapsed');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Collapse sidebar');
      btn.textContent = '›';
    } else {
      document.body.classList.add('sidebar-collapsed');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Expand sidebar');
      btn.textContent = '‹';
    }
  });
}

function wireMenus() {
  document.querySelectorAll('.menu-btn').forEach(b => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      const dd = b.nextElementSibling;
      document.querySelectorAll('.menu-dropdown').forEach(x => {
        if (x !== dd) x.style.display = 'none';
      });
      dd.style.display = (dd.style.display === 'block') ? 'none' : 'block';
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.menu-dropdown').forEach(dd => dd.style.display = 'none');
  });
}
wireMenus();

function applyReadMore(limit = 180){
  document.querySelectorAll('.note-sub').forEach(el => {
    if (el.dataset.rmInit === '1') return;
    el.dataset.rmInit = '1';

    const full = (el.dataset.full || el.textContent).trim().replace(/\s+/g,' ');
    el.dataset.full = full;

    const toggle = document.createElement('span');
    toggle.className = 'read-toggle';

    function render(state){
      if (state === 'short' && full.length > limit){
        el.textContent = full.slice(0, limit).trim() + '… ';
        toggle.textContent = 'Read more';
        el.appendChild(toggle);
        el.dataset.state = 'short';
      } else {
        el.textContent = full + ' ';
        toggle.textContent = 'Show less';
        el.appendChild(toggle);
        el.dataset.state = 'full';
      }
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      render(el.dataset.state === 'short' ? 'full' : 'short');
    });

    render('short');
  });
}
applyReadMore(180);

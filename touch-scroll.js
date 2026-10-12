// touch-scroll.js - Simulação de Toque Touch Realista para Mouse e Trackpad (Drag-to-Scroll com Inércia)
(function initTouchScroll() {
  if (window.__airbnbTouchScrollInitialized) return;
  window.__airbnbTouchScrollInitialized = true;

  let isDown = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let lastX = 0;
  let lastY = 0;
  let scrollTarget = null;
  let momentumAnimId = null;
  let positions = [];
  let capturedEl = null;

  // Localiza o elemento rolável sob o cursor ou o container principal da tela ativa
  function findScrollable(target) {
    let el = target;
    while (el && el !== document.body && el !== document.documentElement) {
      try {
        const style = window.getComputedStyle(el);
        const oY = style.overflowY;
        const canScrollY = (oY === 'auto' || oY === 'scroll') && el.scrollHeight > el.clientHeight + 2;
        const oX = style.overflowX;
        const canScrollX = (oX === 'auto' || oX === 'scroll') && el.scrollWidth > el.clientWidth + 2;
        if (canScrollY || canScrollX) {
          return el;
        }
      } catch (e) {}
      el = el.parentElement;
    }

    // Se estiver na tela de portão/login
    const gateScreen = document.getElementById('gate-screen');
    if (gateScreen && gateScreen.style.display !== 'none' && gateScreen.scrollHeight > gateScreen.clientHeight + 2) {
      return gateScreen;
    }

    // Se houver modal/bottom-sheet aberto, restringe o scroll exclusivamente à bottom-sheet
    const openModal = document.querySelector('.modal-overlay.active, .modal-overlay[style*="display: block"], .modal-overlay[style*="display: flex"]');
    if (openModal) {
      const openSheet = openModal.querySelector('.bottom-sheet');
      if (openSheet && (openSheet.contains(target) || openSheet === target)) {
        return openSheet;
      }
      return null; // Bloqueia completamente o scroll do fundo enquanto o modal estiver aberto
    }

    // Container principal do aplicativo
    const mainScroll = document.getElementById('main-scroll');
    if (mainScroll && mainScroll.scrollHeight > mainScroll.clientHeight + 2) {
      return mainScroll;
    }

    return (document.documentElement.scrollHeight > window.innerHeight) ? window : (mainScroll || window);
  }

  function cancelMomentum() {
    if (momentumAnimId) {
      cancelAnimationFrame(momentumAnimId);
      momentumAnimId = null;
    }
  }

  document.addEventListener('pointerdown', (e) => {
    // Se for toque real em tela touch (celular, tablet), não interferir - scroll nativo do navegador é perfeito
    if (e.pointerType === 'touch') return;

    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.button !== undefined && e.button !== 0) return;

    // Permitir foco, digitação e cliques nativos em campos de texto e elementos interativos
    const isInteractive = e.target && e.target.closest && e.target.closest('button, a, input, textarea, select, .keypad-btn, .pin-staff-pill, .stat-chip, .property-tab-btn, .nav-item, .clickable-purchase-card, .purchase-pill, .btn-zoom-receipt, [data-purchase-id], [tabindex="0"], [role="button"], [contenteditable="true"]');
    if (isInteractive) return;

    cancelMomentum();
    isDown = true;
    isDragging = false;
    startX = e.clientX;
    startY = e.clientY;
    lastX = e.clientX;
    lastY = e.clientY;
    positions = [{ x: e.clientX, y: e.clientY, time: Date.now() }];
    scrollTarget = findScrollable(e.target);

    if (e.pointerId !== undefined && e.target && e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
        capturedEl = e.target;
      } catch (err) {}
    }
  }, { capture: true, passive: false });

  document.addEventListener('pointermove', (e) => {
    if (!isDown) return;

    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    const totalDist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!isDragging && totalDist > 10) {
      isDragging = true;
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    }

    if (isDragging) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      if (scrollTarget === window) {
        window.scrollBy(-deltaX, -deltaY);
      } else if (scrollTarget) {
        const prev = scrollTarget.scrollTop;
        scrollTarget.scrollTop -= deltaY;
        scrollTarget.scrollLeft -= deltaX;

        if (scrollTarget.scrollTop === prev && deltaY !== 0) {
          window.scrollBy(0, -deltaY);
        }
      }

      const now = Date.now();
      positions.push({ x: e.clientX, y: e.clientY, time: now });
      if (positions.length > 5) positions.shift();
    }

    lastX = e.clientX;
    lastY = e.clientY;
  }, { capture: true, passive: false });

  const endDrag = (e) => {
    if (!isDown) return;
    isDown = false;

    if (capturedEl && e.pointerId !== undefined && capturedEl.releasePointerCapture) {
      try {
        capturedEl.releasePointerCapture(e.pointerId);
      } catch (err) {}
      capturedEl = null;
    }

    if (isDragging) {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

      // Interceptar clique acidental subsequente
      const blockGhost = (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      window.addEventListener('click', blockGhost, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', blockGhost, { capture: true }), 120);

      // Inércia física / Flick momentum idêntico a iOS/Android
      const now = Date.now();
      const recent = positions.filter(p => now - p.time < 120);
      if (recent.length >= 2) {
        const first = recent[0];
        const last = recent[recent.length - 1];
        const dt = (last.time - first.time) || 1;
        let vy = (last.y - first.y) / dt;
        let vx = (last.x - first.x) / dt;

        if (Math.abs(vy) > 0.15 || Math.abs(vx) > 0.15) {
          let curVY = vy * 16;
          let curVX = vx * 16;
          const friction = 0.94;

          const momentumStep = () => {
            curVY *= friction;
            curVX *= friction;

            if (Math.abs(curVY) > 0.3 || Math.abs(curVX) > 0.3) {
              if (scrollTarget === window) {
                window.scrollBy(-curVX, -curVY);
              } else if (scrollTarget) {
                scrollTarget.scrollTop -= curVY;
                scrollTarget.scrollLeft -= curVX;
              }
              momentumAnimId = requestAnimationFrame(momentumStep);
            } else {
              momentumAnimId = null;
            }
          };

          momentumAnimId = requestAnimationFrame(momentumStep);
        }
      }
    }
  };

  document.addEventListener('pointerup', endDrag, { capture: true });
  document.addEventListener('pointercancel', endDrag, { capture: true });

  // Fallback mouse
  document.addEventListener('mouseup', endDrag, { capture: true });

  document.addEventListener('dragstart', (e) => {
    if (isDown || isDragging) e.preventDefault();
  }, { capture: true });

  console.log('[Airbnb] Touch scroll simulation loaded successfully');
})();

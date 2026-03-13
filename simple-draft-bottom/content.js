(function() {
  // 1. 初始化 DOM
  const fab = document.createElement('div');
  fab.id = 'draft-fab';
  fab.innerText = 'DRAFT';
  document.body.appendChild(fab);

  const root = document.createElement('div');
  root.id = 'my-bottom-draft-root';
  root.style.height = '240px'; 
  root.innerHTML = `
    <div class="resizer-v" id="rsz-h"></div>
    <div class="draft-main-layout">
      <div class="side-slot" id="slot-l" style="width: 260px;">
        <div class="resizer-h" style="right:-5px;" id="rsz-l"></div>
        <span style="font-size:11px; opacity:0.4; font-weight:bold;">TOOLS</span>
        <div class="btn-group">
          <button class="action-btn" id="btn-copy">复制全文</button>
          <button class="action-btn" id="btn-clear">清空</button>
        </div>
      </div>
      <div class="center-editor">
        <textarea class="draft-textarea" id="draft-input" placeholder="写点什么..."></textarea>
      </div>
      <div class="side-slot" id="slot-r" style="width: 260px;">
        <div class="resizer-h" style="left:-5px;" id="rsz-r"></div>
        <button class="action-btn" id="btn-close">收起面板</button>
        <div id="count-ui" style="font-size:11px; margin-top:auto; opacity:0.4; text-align:right;">0 字</div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const textarea = root.querySelector('#draft-input');
  const countUI = root.querySelector('#count-ui');

  // --- 状态控制 ---
  function toggleUI(show) {
    if (show) {
      root.classList.add('active');
      fab.classList.add('fab-hidden');
      setTimeout(() => textarea.focus(), 300);
    } else {
      root.classList.remove('active');
      fab.classList.remove('fab-hidden');
    }
  }

  // --- 按钮拖拽逻辑 ---
  let isDragging = false;
  let startX, startY, startTime;

  fab.onmousedown = (e) => {
    isDragging = false;
    startTime = Date.now();
    let rect = fab.getBoundingClientRect();
    let shiftX = e.clientX - rect.left;
    let shiftY = e.clientY - rect.top;

    function moveAt(px, py) {
      fab.style.transition = 'none';
      fab.style.left = px - shiftX + fab.offsetWidth / 2 + 'px';
      fab.style.top = py - shiftY + fab.offsetHeight / 2 + 'px';
      fab.style.bottom = 'auto';
      fab.style.transform = 'translateX(-50%)';
    }

    function onMouseMove(ev) {
      if (!isDragging && (Math.abs(ev.clientX - e.clientX) > 5)) isDragging = true;
      moveAt(ev.clientX, ev.clientY);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.onmouseup = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.onmouseup = null;
      fab.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      chrome.storage.local.set({ f_l: fab.style.left, f_t: fab.style.top });
    };
  };

  fab.onclick = () => { if (!isDragging && (Date.now() - startTime < 200)) toggleUI(true); };
  root.querySelector('#btn-close').onclick = () => toggleUI(false);

  // --- 尺寸缩放逻辑 ---
  const initResize = (handler, type) => {
    handler.onmousedown = (e) => {
      e.preventDefault();
      const sY = e.clientY, sX = e.clientX;
      const sH = parseInt(root.style.height);
      const sW = parseInt(root.querySelector('#slot-l').style.width);

      const onMove = (m) => {
        if (type === 'V') {
          root.style.height = `${Math.max(100, sH + (sY - m.clientY))}px`;
        } else {
          let diff = type === 'L' ? (m.clientX - sX) : (sX - m.clientX);
          let val = `${Math.max(120, sW + diff)}px`;
          root.querySelector('#slot-l').style.width = val;
          root.querySelector('#slot-r').style.width = val;
        }
      };
      const onUp = () => {
        chrome.storage.local.set({ p_h: root.style.height, p_w: root.querySelector('#slot-l').style.width });
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  };

  initResize(root.querySelector('#rsz-h'), 'V');
  initResize(root.querySelector('#rsz-l'), 'L');
  initResize(root.querySelector('#rsz-r'), 'R');

  // --- 数据持久化 ---
  chrome.storage.local.get(['content', 'p_h', 'p_w', 'f_l', 'f_t'], (res) => {
    if (res.content) { textarea.value = res.content; countUI.textContent = `${res.content.length} 字`; }
    if (res.p_h) root.style.height = res.p_h;
    if (res.p_w) { root.querySelector('#slot-l').style.width = res.p_w; root.querySelector('#slot-r').style.width = res.p_w; }
    if (res.f_l && res.f_t) { fab.style.left = res.f_l; fab.style.top = res.f_t; fab.style.bottom = 'auto'; }
  });

  textarea.oninput = () => {
    chrome.storage.local.set({ 'content': textarea.value });
    countUI.textContent = `${textarea.value.length} 字`;
  };

  root.querySelector('#btn-copy').onclick = () => {
    navigator.clipboard.writeText(textarea.value);
    const b = root.querySelector('#btn-copy');
    b.innerText = '已复制';
    setTimeout(() => b.innerText = '复制全文', 1000);
  };

  root.querySelector('#btn-clear').onclick = () => {
    if(confirm('确定清空？')) { textarea.value = ''; textarea.oninput(); }
  };

  // Esc 键退出
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') toggleUI(false); });
})();
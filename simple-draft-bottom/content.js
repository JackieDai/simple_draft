(function() {
  const root = document.createElement('div');
  root.id = 'my-bottom-draft-root';
  root.style.height = '200px'; // 默认高度

  root.innerHTML = `
    <div class="resizer-v" id="rsz-h"></div>
    <div class="draft-main-layout">
      <div class="side-slot" id="slot-l" style="width: 250px;">
        <div class="resizer-h" style="right:-4px;" id="rsz-l"></div>
        <span style="font-size:12px; opacity:0.5; font-weight:bold;">工具箱</span>
        <div class="btn-group">
          <button class="action-btn" id="btn-copy">复制全文</button>
          <button class="action-btn" id="btn-clear">清空</button>
        </div>
      </div>
      <div class="center-editor">
        <textarea class="draft-textarea" id="draft-input" placeholder="随时记录灵感..."></textarea>
      </div>
      <div class="side-slot" id="slot-r" style="width: 250px;">
        <div class="resizer-h" style="left:-4px;" id="rsz-r"></div>
        <button class="action-btn" id="btn-toggle">收起面板 ↑</button>
        <div id="count-ui" style="font-size:11px; margin-top:auto; opacity:0.4; text-align:right;">0 字</div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const textarea = root.querySelector('#draft-input');
  const countUI = root.querySelector('#count-ui');

  // --- 逻辑：数据存取 ---
  chrome.storage.local.get(['draft_txt', 'pref_h', 'pref_w'], (res) => {
    if (res.draft_txt) {
      textarea.value = res.draft_txt;
      countUI.textContent = `${res.draft_txt.length} 字`;
    }
    if (res.pref_h) root.style.height = res.pref_h;
    if (res.pref_w) {
      root.querySelector('#slot-l').style.width = res.pref_w;
      root.querySelector('#slot-r').style.width = res.pref_w;
    }
  });

  textarea.oninput = () => {
    chrome.storage.local.set({ 'draft_txt': textarea.value });
    countUI.textContent = `${textarea.value.length} 字`;
  };

  // --- 逻辑：自由缩放 ---
  const setupResizer = (handler, mode) => {
    handler.onmousedown = (e) => {
      e.preventDefault();
      const startY = e.clientY, startX = e.clientX;
      const startH = parseInt(root.style.height);
      const startW = parseInt(root.querySelector('#slot-l').style.width);

      const onMove = (me) => {
        if (mode === 'H') {
          root.style.height = `${Math.max(60, startH + (startY - me.clientY))}px`;
        } else {
          const delta = mode === 'WL' ? (me.clientX - startX) : (startX - me.clientX);
          const finalW = `${Math.max(100, startW + delta)}px`;
          root.querySelector('#slot-l').style.width = finalW;
          root.querySelector('#slot-r').style.width = finalW;
        }
      };
      const onUp = () => {
        chrome.storage.local.set({ 'pref_h': root.style.height, 'pref_w': root.querySelector('#slot-l').style.width });
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };
  };

  setupResizer(root.querySelector('#rsz-h'), 'H');
  setupResizer(root.querySelector('#rsz-l'), 'WL');
  setupResizer(root.querySelector('#rsz-r'), 'WR');

  // --- 逻辑：基础功能 ---
  root.querySelector('#btn-copy').onclick = () => {
    navigator.clipboard.writeText(textarea.value);
    root.querySelector('#btn-copy').textContent = '已复制！';
    setTimeout(() => root.querySelector('#btn-copy').textContent = '复制全文', 1000);
  };

  root.querySelector('#btn-clear').onclick = () => {
    if(confirm('清空草稿？')) { textarea.value = ''; textarea.oninput(); }
  };

  let hidden = false;
  root.querySelector('#btn-toggle').onclick = (e) => {
    hidden = !hidden;
    root.style.transform = hidden ? `translateY(${parseInt(root.style.height) - 30}px)` : 'translateY(0)';
    e.target.textContent = hidden ? '展开 ↑' : '收起面板 ↓';
  };
})();
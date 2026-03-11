document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('draft');
  const charCount = document.getElementById('charCount');
  const saveStatus = document.getElementById('saveStatus');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');

  // 初始化读取
  chrome.storage.local.get(['mySideDraft'], (result) => {
    if (result.mySideDraft) {
      textarea.value = result.mySideDraft;
      updateUI(result.mySideDraft.length);
    }
  });

  // 实时保存
  textarea.addEventListener('input', () => {
    const text = textarea.value;
    saveStatus.textContent = '...';
    updateUI(text.length);
    saveStatus.textContent = '已保存';
    // chrome.storage.local.set({ 'mySideDraft': text }, () => {
    //   updateUI(text.length);
    //   saveStatus.textContent = '已保存';
    // });
  });

  // 复制功能
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(textarea.value);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = '✅';
    setTimeout(() => copyBtn.textContent = '📋', 1000);
  });

  // 清空功能
  clearBtn.addEventListener('click', () => {
    if (confirm('确定清空草稿吗？')) {
      textarea.value = '';
      updateUI(0);
      // chrome.storage.local.set({ 'mySideDraft': '' }, () => {
        // updateUI(0);
      // });
    }
  });

  function updateUI(count) {
    charCount.textContent = `${count} 字`;
  }
});
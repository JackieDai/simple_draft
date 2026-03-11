document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('draft');

  // 1. 页面打开时，从存储中读取之前的内容
  chrome.storage.local.get(['myDraft'], (result) => {
    if (result.myDraft) {
      textarea.value = result.myDraft;
    }
  });

  // 2. 监听输入，实时保存
  textarea.addEventListener('input', () => {
    const text = textarea.value;
    chrome.storage.local.set({ 'myDraft': text });
  });
});
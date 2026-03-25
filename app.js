// =============================================
// 담당: 세인 | app.js
// 책임: onPatchClick(), onBackClick(), onForwardClick()
// AI 규약 버전: v1.0
// =============================================

// 전역 상태
let history = [];       // VNode 스냅샷 배열
let historyIdx = -1;    // 현재 위치 인덱스
let currentVNode = null;

function pushHistory(vNode) {
  const snapshot = cloneVNode(vNode);

  if (historyIdx < history.length - 1) {
    history = history.slice(0, historyIdx + 1);
  }

  history.push(snapshot);
  historyIdx = history.length - 1;
}

function cloneVNode(vNode) {
  if (vNode === null || vNode === undefined) {
    return vNode;
  }

  return JSON.parse(JSON.stringify(vNode));
}

function isSameVNode(oldNode, newNode) {
  if (oldNode === newNode) {
    return true;
  }

  if (oldNode === null || oldNode === undefined || newNode === null || newNode === undefined) {
    return false;
  }

  return JSON.stringify(oldNode) === JSON.stringify(newNode);
}

function getHtmlStringFromVNode(vNode) {
  if (vNode === null || vNode === undefined) {
    return '';
  }

  if (typeof vNode === 'string') {
    return escapeHtml(vNode);
  }

  const props = Object.entries(vNode.props || {})
    .map(([key, value]) => {
      if (value === false || value === null || value === undefined) {
        return '';
      }

      if (value === true) {
        return key;
      }

      return key + '="' + escapeAttribute(String(value)) + '"';
    })
    .filter(Boolean)
    .join(' ');

  const children = (vNode.children || [])
    .map((child) => getHtmlStringFromVNode(child))
    .join('');

  const openTag = props ? '<' + vNode.type + ' ' + props + '>' : '<' + vNode.type + '>';

  return openTag + children + '</' + vNode.type + '>';
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(text) {
  return escapeHtml(text).replaceAll('"', '&quot;');
}

function getVNodeFromInput(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString('<body>' + htmlText + '</body>', 'text/html');
  const body = doc.body;
  const elementChildren = Array.from(body.childNodes).filter(isMeaningfulNode);

  if (elementChildren.length === 0) {
    return null;
  }

  if (elementChildren.length === 1) {
    return domToVNode(elementChildren[0]);
  }

  return {
    type: 'div',
    props: { id: 'history-root' },
    children: elementChildren.map((childNode) => domToVNode(childNode))
  };
}

function isMeaningfulNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.trim() !== '';
  }

  return true;
}

function syncTestArea(vNode) {
  const testArea = document.getElementById('test-area');

  if (!testArea) {
    return;
  }

  testArea.value = getHtmlStringFromVNode(vNode);
}

function renderVNodeToRealArea(vNode) {
  const realArea = document.getElementById('real-area');

  if (!realArea) {
    return;
  }

  while (realArea.firstChild) {
    realArea.removeChild(realArea.firstChild);
  }

  if (vNode === null || vNode === undefined) {
    return;
  }

  realArea.appendChild(createNode(vNode));
}

function renderHistory() {
  const historyDots = document.getElementById('history-dots');
  const historyStatus = document.getElementById('history-status');
  const backButton = document.getElementById('btn-back');
  const forwardButton = document.getElementById('btn-forward');

  if (historyDots) {
    while (historyDots.firstChild) {
      historyDots.removeChild(historyDots.firstChild);
    }

    history.forEach(function (_, index) {
      const dotEl = document.createElement('span');
      dotEl.className = 'history-dot';

      if (index === historyIdx) {
        dotEl.classList.add('active');
      }

      historyDots.appendChild(dotEl);
    });
  }

  if (historyStatus) {
    if (history.length === 0 || historyIdx < 0) {
      historyStatus.textContent = '히스토리 비어 있음';
    } else {
      historyStatus.textContent = '히스토리 ' + (historyIdx + 1) + ' / ' + history.length;
    }
  }

  if (backButton) {
    backButton.disabled = historyIdx <= 0;
  }

  if (forwardButton) {
    forwardButton.disabled = historyIdx === -1 || historyIdx >= history.length - 1;
  }
}

function restoreHistory(targetIdx) {
  if (targetIdx < 0 || targetIdx >= history.length) {
    return;
  }

  try {
    const restoredVNode = cloneVNode(history[targetIdx]);

    renderVNodeToRealArea(restoredVNode);
    currentVNode = restoredVNode;
    historyIdx = targetIdx;

    syncTestArea(restoredVNode);
    renderHistory();
  } catch (error) {
    console.error('히스토리 복원 중 오류', error);
  }
}

function initializeApp() {
  const testArea = document.getElementById('test-area');

  if (!testArea) {
    return;
  }

  if (!testArea.value.trim()) {
    testArea.value = '<div class="card">\n  <h2>Virtual DOM</h2>\n  <p>여기를 수정하고 Patch를 눌러보세요.</p>\n</div>';
  }

  try {
    const initialVNode = getVNodeFromInput(testArea.value);

    currentVNode = cloneVNode(initialVNode);
    renderVNodeToRealArea(currentVNode);
    syncTestArea(currentVNode);
    pushHistory(currentVNode);
  } catch (error) {
    console.error('초기 렌더링 중 오류', error);
  }

  renderHistory();
}

/**
 * Patch 버튼 클릭 시
 * 1. domToVNode(테스트영역)으로 newVNode 생성
 * 2. diff(currentVNode, newVNode, 실제영역)로 patches 획득
 * 3. patch(patches)로 실제영역 DOM 업데이트
 * 4. history에 newVNode push, currentVNode 갱신
 * 5. historyIdx 업데이트
 */
function onPatchClick() {
  try {
    const realArea = document.getElementById('real-area');
    const testArea = document.getElementById('test-area');
    const newVNode = getVNodeFromInput(testArea.value);

    if (isSameVNode(currentVNode, newVNode)) {
      console.log('변경된 내용이 없어 히스토리를 추가하지 않습니다.');
      renderHistory();
      return;
    }

    const patches = diff(currentVNode, newVNode, realArea);

    patch(patches);
    currentVNode = cloneVNode(newVNode);
    pushHistory(currentVNode);
    syncTestArea(currentVNode);
    renderHistory();
  } catch (error) {
    console.error('패치 적용 중 오류', error);
  }
}

/**
 * 뒤로가기 버튼
 * history[historyIdx - 1]로 이동
 * 실제영역 + 테스트영역 모두 해당 VNode 상태로 변경
 */
function onBackClick() {
  restoreHistory(historyIdx - 1);
}

/**
 * 앞으로가기 버튼
 * history[historyIdx + 1]로 이동
 */
function onForwardClick() {
  restoreHistory(historyIdx + 1);
}

document.addEventListener('DOMContentLoaded', initializeApp);

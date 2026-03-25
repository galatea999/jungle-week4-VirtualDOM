// =============================================
// 담당: 세인 | app.js
// 책임: onPatchClick(), onBackClick(), onForwardClick()
// AI 규약 버전: v1.0
// =============================================

// 전역 상태
// history는 "이전 상태들"을 순서대로 저장하는 배열이다.
// 각 항목은 단순히 VNode만 저장하지 않고,
// {
//   vNode: 현재 화면 상태를 나타내는 VNode,
//   htmlText: 그 시점에 사용자가 textarea에 입력했던 원본 HTML 문자열
// }
// 형태로 저장한다.
// 이렇게 htmlText까지 같이 저장하는 이유는
// 뒤로가기/앞으로가기 할 때 textarea도 사용자가 보던 모양 그대로 복원하기 위해서다.
let history = [];
const HISTORY_LIMIT = 10;

// historyIdx는 history 배열에서 "지금 보고 있는 상태"의 위치를 가리킨다.
// 예)
// history = [상태0, 상태1, 상태2]
// historyIdx = 1 이면 현재는 상태1을 보고 있다는 뜻이다.
// 아직 아무 상태도 저장되지 않았으면 -1이다.
let historyIdx = -1;

// currentVNode는 현재 real-area에 반영되어 있다고 간주하는 최신 VNode다.
// Patch 버튼을 누를 때 oldNode 역할로 diff()에 전달된다.
let currentVNode = null;

// 닫는 태그가 없는 HTML 태그 목록
// 예) <br>, <img>, <input>
// 이런 태그는 <br></br> 처럼 출력하면 부자연스럽기 때문에 따로 구분한다.
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function pushHistory(vNode, htmlText) {
  // history에 저장할 새 스냅샷을 만든다.
  // vNode는 이후 원본이 바뀌더라도 안전하게 유지되도록 복사본으로 저장한다.
  // htmlText는 textarea에 적혀 있던 원본 문자열 그대로 저장한다.
  const snapshot = {
    vNode: cloneVNode(vNode),
    htmlText: htmlText,
    gameState: getGameState()
  };

  // 사용자가 뒤로가기로 과거 상태로 이동한 뒤 새 Patch를 하면
  // 그 뒤에 있던 "미래 history"는 더 이상 유효하지 않다.
  // 브라우저 history처럼 현재 위치 뒤쪽 기록을 잘라낸다.
  if (historyIdx < history.length - 1) {
    history = history.slice(0, historyIdx + 1);
  }

  // 새 상태를 history 끝에 넣고,
  // 현재 위치도 가장 마지막 상태를 가리키도록 갱신한다.
  history.push(snapshot);

  // history는 최신 10개까지만 유지한다.
  // 제한을 넘기면 가장 오래된 상태를 제거한다.
  if (history.length > HISTORY_LIMIT) {
    history.shift();
  }

  historyIdx = history.length - 1;
}

function cloneVNode(vNode) {
  // null / undefined는 그대로 돌려준다.
  if (vNode === null || vNode === undefined) {
    return vNode;
  }

  // VNode는 객체/배열 중첩 구조를 가지므로,
  // history에 저장할 때 원본 참조를 그대로 쓰면 나중에 상태가 함께 오염될 수 있다.
  // 여기서는 프로젝트 범위 안에서 JSON 기반 깊은 복사로 간단히 처리한다.
  return JSON.parse(JSON.stringify(vNode));
}

function isSameVNode(oldNode, newNode) {
  // 완전히 같은 참조이거나 같은 원시값이면 바로 true다.
  if (oldNode === newNode) {
    return true;
  }

  // 한쪽만 비어 있으면 같은 상태가 아니다.
  if (oldNode === null || oldNode === undefined || newNode === null || newNode === undefined) {
    return false;
  }

  // 현재 프로젝트 범위에서는 "구조가 같은가"를 간단히 판별하기 위해
  // JSON 문자열로 직렬화해서 비교한다.
  // 이 비교는 완벽한 일반해는 아니지만,
  // "변경이 전혀 없는데 Patch를 눌렀을 때 history가 또 쌓이는 것"을 막기에는 충분하다.
  return JSON.stringify(oldNode) === JSON.stringify(newNode);
}

// depth를 넘기면 들여쓰기 적용 (pretty-print), 생략하면 flat 출력
function getHtmlStringFromVNode(vNode, depth) {
  const isPretty = depth !== undefined;
  const indent = isPretty ? '  '.repeat(depth) : '';

  // 비어 있는 상태는 빈 문자열로 본다.
  if (vNode === null || vNode === undefined) {
    return '';
  }

  // 텍스트 노드: 들여쓰기 + 이스케이프
  if (typeof vNode === 'string') {
    const text = escapeHtml(vNode);
    return isPretty ? indent + text : text;
  }

  // props 객체를 실제 HTML 속성 문자열로 바꾼다.
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

  const openTag = props ? '<' + vNode.type + ' ' + props + '>' : '<' + vNode.type + '>';

  // void 태그는 닫는 태그 없이 그대로 출력
  if (VOID_TAGS.has(vNode.type)) {
    return indent + openTag;
  }

  if (!isPretty) {
    // flat 출력 (기존 동작 유지)
    const children = (vNode.children || [])
      .map((child) => getHtmlStringFromVNode(child))
      .join('');
    return openTag + children + '</' + vNode.type + '>';
  }

  // pretty-print: 자식을 depth+1로 재귀하여 줄바꿈 + 들여쓰기
  const childLines = (vNode.children || [])
    .map((child) => getHtmlStringFromVNode(child, depth + 1))
    .filter((s) => s.trim() !== '');

  if (childLines.length === 0) {
    return indent + openTag + '</' + vNode.type + '>';
  }

  return indent + openTag + '\n' + childLines.join('\n') + '\n' + indent + '</' + vNode.type + '>';
}

function escapeHtml(text) {
  // 텍스트 노드를 HTML 문자열로 옮길 때
  // 실제 태그로 해석되지 않도록 특수문자를 이스케이프한다.
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(text) {
  // 속성 값 안에서는 큰따옴표도 이스케이프해줘야 속성 문자열이 깨지지 않는다.
  return escapeHtml(text).replaceAll('"', '&quot;');
}

function getVNodeFromInput(htmlText) {
  // textarea의 HTML 문자열을 브라우저 파서로 한 번 실제 DOM처럼 해석한 뒤,
  // 그 DOM을 다시 VNode로 바꾼다.
  const parser = new DOMParser();
  const doc = parser.parseFromString('<body>' + htmlText + '</body>', 'text/html');
  const body = doc.body;
  const elementChildren = Array.from(body.childNodes).filter(isMeaningfulNode);

  // 의미 있는 노드가 하나도 없으면 빈 상태로 본다.
  if (elementChildren.length === 0) {
    return null;
  }

  // 루트 노드가 하나면 그대로 VNode로 변환한다.
  if (elementChildren.length === 1) {
    return domToVNode(elementChildren[0]);
  }

  // 여러 루트 노드는 diff 입력을 단일 루트로 맞추기 위해 임시 래퍼로 감싼다.
  // 예)
  // <h1>A</h1><p>B</p>
  // 를 하나의 루트 VNode 아래 children으로 묶어서 관리한다.
  return {
    type: 'div',
    props: { id: 'history-root' },
    children: elementChildren.map((childNode) => domToVNode(childNode))
  };
}

function isMeaningfulNode(node) {
  // 공백만 있는 텍스트 노드는 실질적인 UI 변화와 무관한 경우가 많아서 제외한다.
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.trim() !== '';
  }

  // 요소 노드 등 나머지는 의미 있는 노드로 취급한다.
  return true;
}

// VNode를 HTML 문자열로 바꿔서 test-area에 넣습니다
// 지금 실사용에서는 “원래 사용자가 입력한 문자열”을 유지하는 게 더 중요합니다
// history 복원 쪽에서는 바로 이 함수를 쓰지 않고 다른 함수를 거칩니다
function syncTestArea(vNode) {
  const testArea = document.getElementById('test-area');

  if (!testArea) {
    return;
  }

  // VNode를 다시 HTML 문자열로 바꿔 textarea에 표시한다.
  // 주로 history 복원 시 폴백 경로로 사용된다.
  testArea.value = getHtmlStringFromVNode(vNode);
}

function renderVNodeToRealArea(vNode) {
  const realArea = document.getElementById('real-area');

  if (!realArea) {
    return;
  }

  // 이전 결과 화면을 모두 비운 뒤 새 상태를 다시 그린다.
  while (realArea.firstChild) {
    realArea.removeChild(realArea.firstChild);
  }

  // 빈 상태라면 비운 채로 종료한다.
  if (vNode === null || vNode === undefined) {
    return;
  }

  // VNode를 실제 DOM으로 다시 만들어 결과 영역에 표시
  realArea.appendChild(createNode(vNode));
}

function renderHistory() {
  const historyDots = document.getElementById('history-dots');
  const historyStatus = document.getElementById('history-status');
  const backButton = document.getElementById('btn-back');
  const forwardButton = document.getElementById('btn-forward');

  if (historyDots) {
    // 이전 점들을 모두 비우고 현재 history 길이에 맞게 다시 만든다.
    while (historyDots.firstChild) {
      historyDots.removeChild(historyDots.firstChild);
    }

    history.forEach(function (_, index) {
      const dotEl = document.createElement('span');
      dotEl.className = 'history-dot';

      // 현재 위치에 해당하는 점만 active 처리한다.
      if (index === historyIdx) {
        dotEl.classList.add('active');
      }

      historyDots.appendChild(dotEl);
    });
  }

  // 현재 위치를 텍스트로도 보여줘서 점만 볼 때보다 이해하기 쉽게 유지
  if (historyStatus) {
    if (history.length === 0 || historyIdx < 0) {
      historyStatus.textContent = '히스토리 비어 있음';
    } else {
      // 사용자에게 현재 위치 / 전체 개수를 동시에 보여준다.
      historyStatus.textContent = '히스토리 ' + (historyIdx + 1) + ' / ' + history.length;
    }
  }

  if (backButton) {
    // 첫 번째 상태면 더 이상 뒤로 갈 수 없다.
    backButton.disabled = historyIdx <= 0;
  }

  if (forwardButton) {
    // 마지막 상태거나 아직 상태가 없으면 앞으로 갈 수 없다.
    forwardButton.disabled = historyIdx === -1 || historyIdx >= history.length - 1;
  }
}

function restoreHistory(targetIdx) {
  // 범위를 벗어난 이동 요청은 무시한다.
  if (targetIdx < 0 || targetIdx >= history.length) {
    return;
  }

  try {
    const restoredEntry = history[targetIdx];
    const restoredVNode = cloneVNode(restoredEntry.vNode);

    // history 이동 시 결과 화면과 입력창을 같은 시점 상태로 함께 복원
    renderVNodeToRealArea(restoredVNode);
    currentVNode = restoredVNode;
    historyIdx = targetIdx;

    // 게임 상태도 해당 시점으로 복원
    restoreGameState(restoredEntry.gameState);

    // textarea는 VNode 문자열화 결과가 아니라,
    // 가능하면 사용자가 그때 실제로 입력했던 htmlText를 그대로 복원한다.
    syncTestAreaFromHistory(restoredEntry);

    // VDOM 트리 복원 (패치 내역은 비움)
    updateVDomPanel(restoredVNode);
    updatePatchPanel([]);

    renderHistory();
  } catch (error) {
    console.error('히스토리 복원 중 오류', error);
  }
}

function syncTestAreaFromHistory(historyEntry) {
  const testArea = document.getElementById('test-area');

  if (!testArea) {
    return;
  }

  // history 항목에 원본 HTML 문자열이 있으면 그것을 우선 사용한다.
  // 이렇게 해야 여러 루트 입력이나 사용자가 작성한 포맷이 최대한 유지된다.
  if (historyEntry && typeof historyEntry.htmlText === 'string') {
    testArea.value = historyEntry.htmlText;
    return;
  }

  // 오래된 history 형태가 남아 있어도 최소한 VNode 기준으로 복원
  syncTestArea(historyEntry ? historyEntry.vNode : null);
}

// span 헬퍼: parent에 className + text로 span 추가
function appendSpan(parent, className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  parent.appendChild(span);
}

// 들여쓰기 단위 (px)
const VDOM_INDENT = 18;

// 한 줄 DOM 요소 생성
function makeLine(depth) {
  const el = document.createElement('div');
  el.className = 'vdom-line';
  el.style.paddingLeft = (depth * VDOM_INDENT) + 'px';
  return el;
}

// VDOM 트리를 JS 객체 형식으로 DOM 요소 재귀 빌드
// 예시:
//   {
//     type: "div",
//     props: { class: "card" },
//     children: [
//       "텍스트",
//       { type: "p", props: {}, children: [...] }
//     ]
//   }
function buildVDomTree(vNode, depth, oldVNode) {
  const wrapper = document.createElement('div');

  if (vNode === null || vNode === undefined) {
    return wrapper;
  }

  // old에 대응 노드가 없으면 새로 추가된 것
  const isAdded = oldVNode === null || oldVNode === undefined;

  // 텍스트 노드
  if (typeof vNode === 'string') {
    if (vNode.trim() === '') {
      return wrapper;
    }

    const line = makeLine(depth);
    if (isAdded) {
      line.classList.add('vdom-line-added');
    } else if (typeof oldVNode === 'string' && oldVNode !== vNode) {
      line.classList.add('vdom-line-changed');
    }
    appendSpan(line, 'vdom-string', '"' + vNode.trim() + '"');
    appendSpan(line, 'vdom-punct', ',');
    wrapper.appendChild(line);
    return wrapper;
  }

  const oldIsElement = !isAdded && typeof oldVNode === 'object';
  const isTypeChanged = oldIsElement && oldVNode.type !== vNode.type;
  const isPropsChanged = oldIsElement && JSON.stringify(oldVNode.props || {}) !== JSON.stringify(vNode.props || {});

  // 여는 중괄호 {
  const openLine = makeLine(depth);
  appendSpan(openLine, 'vdom-punct', '{');
  wrapper.appendChild(openLine);

  // type: "tagname",
  const typeLine = makeLine(depth + 1);
  if (isAdded) {
    typeLine.classList.add('vdom-line-added');
  } else if (isTypeChanged) {
    typeLine.classList.add('vdom-line-changed');
  }
  appendSpan(typeLine, 'vdom-key', 'type');
  appendSpan(typeLine, 'vdom-punct', ': ');
  appendSpan(typeLine, 'vdom-string', '"' + vNode.type + '"');
  appendSpan(typeLine, 'vdom-punct', ',');
  wrapper.appendChild(typeLine);

  // props: { key: "val" },
  const propsLine = makeLine(depth + 1);
  if (isAdded) {
    propsLine.classList.add('vdom-line-added');
  } else if (isPropsChanged) {
    propsLine.classList.add('vdom-line-changed');
  }
  appendSpan(propsLine, 'vdom-key', 'props');
  appendSpan(propsLine, 'vdom-punct', ': ');

  const propEntries = Object.entries(vNode.props || {});
  if (propEntries.length === 0) {
    appendSpan(propsLine, 'vdom-punct', '{}');
  } else {
    appendSpan(propsLine, 'vdom-punct', '{ ');
    propEntries.forEach(function (entry, i) {
      const key = entry[0];
      const val = entry[1];
      appendSpan(propsLine, 'vdom-prop-key', key);
      appendSpan(propsLine, 'vdom-punct', ': ');
      appendSpan(propsLine, 'vdom-string', val === true ? 'true' : '"' + val + '"');
      if (i < propEntries.length - 1) {
        appendSpan(propsLine, 'vdom-punct', ', ');
      }
    });
    appendSpan(propsLine, 'vdom-punct', ' }');
  }
  appendSpan(propsLine, 'vdom-punct', ',');
  wrapper.appendChild(propsLine);

  // children: [
  const childrenLine = makeLine(depth + 1);
  appendSpan(childrenLine, 'vdom-key', 'children');
  appendSpan(childrenLine, 'vdom-punct', ': [');
  wrapper.appendChild(childrenLine);

  // 자식 재귀 (인덱스 기준으로 old 자식과 매칭)
  const children = (vNode.children || []).filter(function (c) {
    return typeof c !== 'string' || c.trim() !== '';
  });
  const oldChildren = oldIsElement
    ? (oldVNode.children || []).filter(function (c) {
        return typeof c !== 'string' || c.trim() !== '';
      })
    : [];

  children.forEach(function (child, i) {
    const oldChild = i < oldChildren.length ? oldChildren[i] : null;
    wrapper.appendChild(buildVDomTree(child, depth + 2, oldChild));
  });

  // ]
  const closeArrLine = makeLine(depth + 1);
  appendSpan(closeArrLine, 'vdom-punct', ']');
  wrapper.appendChild(closeArrLine);

  // }
  const closeLine = makeLine(depth);
  appendSpan(closeLine, 'vdom-punct', depth > 0 ? '},' : '}');
  wrapper.appendChild(closeLine);

  return wrapper;
}

// VDOM 패널 갱신 (oldVNode 전달 시 변경된 줄 하이라이트)
function updateVDomPanel(vNode, oldVNode) {
  const area = document.getElementById('vdom-area');

  if (!area) {
    return;
  }

  while (area.firstChild) {
    area.removeChild(area.firstChild);
  }

  if (!vNode) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = '(비어 있음)';
    area.appendChild(empty);
    return;
  }

  area.appendChild(buildVDomTree(vNode, 0, oldVNode || null));
}

// Virtual patch 하나를 아이템 DOM으로 변환
function buildPatchItem(p) {
  const item = document.createElement('div');
  item.className = 'patch-item patch-type-' + p.type;

  const badge = document.createElement('span');
  badge.className = 'patch-badge';
  badge.textContent = p.type;
  item.appendChild(badge);

  const detail = document.createElement('span');
  detail.className = 'patch-detail';

  switch (p.type) {
    case 'create':
      detail.textContent = '<' + p.vNode.type + '>';
      break;
    case 'remove':
      detail.textContent = '<' + (p.el ? p.el.nodeName.toLowerCase() : '?') + '>';
      break;
    case 'replace':
      detail.textContent = '<' + (p.el ? p.el.nodeName.toLowerCase() : '?') + '> → <' + p.vNode.type + '>';
      break;
    case 'text':
      detail.textContent = '"' + p.value + '"';
      break;
    case 'props': {
      const allKeys = new Set([
        ...Object.keys(p.oldProps || {}),
        ...Object.keys(p.newProps || {})
      ]);
      const changed = [];
      allKeys.forEach(function (key) {
        if ((p.oldProps || {})[key] !== (p.newProps || {})[key]) {
          changed.push(key);
        }
      });
      detail.textContent = changed.join(', ');
      break;
    }
    default:
      detail.textContent = '';
  }

  item.appendChild(detail);
  return item;
}

// MutationRecord 하나를 아이템 DOM으로 변환
function buildMutationItem(m) {
  const item = document.createElement('div');

  let typeClass = 'props';
  if (m.type === 'childList') {
    typeClass = m.addedNodes.length > 0 ? 'create' : 'remove';
  } else if (m.type === 'characterData') {
    typeClass = 'text';
  }
  item.className = 'patch-item patch-type-' + typeClass;

  const badge = document.createElement('span');
  badge.className = 'patch-badge';
  badge.textContent = m.type;
  item.appendChild(badge);

  const detail = document.createElement('span');
  detail.className = 'patch-detail';

  if (m.type === 'childList') {
    const added = Array.from(m.addedNodes).map(function (n) {
      return n.nodeName.toLowerCase();
    }).join(', ');
    const removed = Array.from(m.removedNodes).map(function (n) {
      return n.nodeName.toLowerCase();
    }).join(', ');
    const parts = [];
    if (added) { parts.push('+' + added); }
    if (removed) { parts.push('-' + removed); }
    detail.textContent = parts.join(' / ');
  } else if (m.type === 'attributes') {
    detail.textContent = m.attributeName + ': "' + m.target.getAttribute(m.attributeName) + '"';
  } else if (m.type === 'characterData') {
    const text = m.target.textContent.trim();
    detail.textContent = '"' + (text.length > 30 ? text.slice(0, 30) + '…' : text) + '"';
  }

  item.appendChild(detail);
  return item;
}

// Patch 내역 패널 갱신 (diff 계획 + MutationObserver 실제 감지 비교)
function updatePatchPanel(patches, domMutations) {
  const area = document.getElementById('patch-area');

  if (!area) {
    return;
  }

  while (area.firstChild) {
    area.removeChild(area.firstChild);
  }

  // 초기 상태 (patches 없음)
  if (!patches || patches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = 'HTML을 수정하고\nPATCH 버튼을 눌러보세요';
    empty.style.whiteSpace = 'pre-line';
    area.appendChild(empty);
    return;
  }

  // 두 컬럼 레이아웃
  const columns = document.createElement('div');
  columns.className = 'patch-columns';

  // ── 왼쪽: diff 계획 ──
  const leftCol = document.createElement('div');
  leftCol.className = 'patch-col';

  const leftHeader = document.createElement('div');
  leftHeader.className = 'patch-col-header patch-col-header-plan';
  leftHeader.textContent = '⚙ DIFF 계획';
  leftCol.appendChild(leftHeader);

  patches.forEach(function (p) {
    leftCol.appendChild(buildPatchItem(p));
  });

  // ── 오른쪽: 실제 DOM 감지 ──
  const rightCol = document.createElement('div');
  rightCol.className = 'patch-col';

  const rightHeader = document.createElement('div');
  rightHeader.className = 'patch-col-header patch-col-header-real';
  rightHeader.textContent = '👁 실제 DOM 감지';
  rightCol.appendChild(rightHeader);

  if (!domMutations || domMutations.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = '감지된 변화 없음';
    rightCol.appendChild(empty);
  } else {
    domMutations.forEach(function (m) {
      rightCol.appendChild(buildMutationItem(m));
    });
  }

  columns.appendChild(leftCol);
  columns.appendChild(rightCol);
  area.appendChild(columns);
}

function updatePatchLogPanel(logs) {
  const area = document.getElementById('patch-area');

  if (!area) {
    return;
  }

  while (area.firstChild) {
    area.removeChild(area.firstChild);
  }

  if (!logs || logs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'panel-empty';
    empty.textContent = '테스트 로그가 없습니다.';
    area.appendChild(empty);
    return;
  }

  logs.forEach(function (log) {
    const item = document.createElement('div');
    item.className = 'patch-item patch-type-' + log.type;

    const badge = document.createElement('span');
    badge.className = 'patch-badge';
    badge.textContent = log.label;
    item.appendChild(badge);

    const detail = document.createElement('span');
    detail.className = 'patch-detail';
    detail.textContent = log.detail;
    item.appendChild(detail);

    area.appendChild(item);
  });
}

function cloneGameStateSnapshot(snapshot) {
  if (!snapshot) {
    return null;
  }

  return {
    levelIdx: snapshot.levelIdx,
    exp: snapshot.exp,
    gold: snapshot.gold
  };
}

function captureAppSnapshot() {
  const testArea = document.getElementById('test-area');

  return {
    history: JSON.parse(JSON.stringify(history)),
    historyIdx: historyIdx,
    currentVNode: cloneVNode(currentVNode),
    gameState: cloneGameStateSnapshot(getGameState()),
    isPendingPatch: isPendingPatch,
    gameStateSnapshot: cloneGameStateSnapshot(gameStateSnapshot),
    htmlText: testArea ? testArea.value : ''
  };
}

function restoreAppSnapshot(snapshot) {
  if (!snapshot) {
    return;
  }

  history = JSON.parse(JSON.stringify(snapshot.history));
  historyIdx = snapshot.historyIdx;
  currentVNode = cloneVNode(snapshot.currentVNode);
  restoreGameState(snapshot.gameState);
  isPendingPatch = snapshot.isPendingPatch;
  gameStateSnapshot = cloneGameStateSnapshot(snapshot.gameStateSnapshot);

  const testArea = document.getElementById('test-area');
  if (testArea) {
    testArea.value = snapshot.htmlText;
  }

  renderVNodeToRealArea(currentVNode);
  updateVDomPanel(currentVNode);
  renderHistory();
}

function getWhiteBoxTestSections() {
  return [
    {
      title: 'vdom.js',
      tests: [
        test_domToVNode_텍스트노드_문자열반환,
        test_domToVNode_공백텍스트노드_null반환,
        test_domToVNode_주석노드_null반환,
        test_domToVNode_엘리먼트_VNode구조반환,
        test_domToVNode_속성있는엘리먼트_props수집,
        test_domToVNode_자식있는엘리먼트_children재귀변환,
        test_createNode_문자열입력_텍스트노드생성,
        test_createNode_VNode_태그생성,
        test_createNode_props있음_속성설정,
        test_createNode_children있음_자식생성,
        test_domToVNode_createNode_왕복변환,
        test_edge_domToVNode_속성없는엘리먼트_빈props,
        test_edge_createNode_빈children_자식없음,
        test_edge_domToVNode_공백섞인텍스트_trim후반환,
        test_edge_createNode_자식여러개_순서보장
      ]
    },
    {
      title: 'diff.js',
      tests: [
        test_createPatch,
        test_removePatch,
        test_replacePatch,
        test_textPatch,
        test_propsPatch,
        test_emptyRootNoopPatch,
        test_sameTextNoPatch,
        test_removeSecondChildOnly,
        test_edge_identicalNode_패치없음,
        test_edge_childAdded_createPatch생성,
        test_edge_deepNested_재귀탐색
      ]
    },
    {
      title: 'app.js',
      tests: [
        test_cloneVNode_null입력_null반환,
        test_cloneVNode_깊은복사_원본불변,
        test_escapeHtml_특수문자이스케이프,
        test_getHtmlStringFromVNode_null입력_빈문자열,
        test_getHtmlStringFromVNode_문자열_이스케이프,
        test_getHtmlStringFromVNode_false속성_제외,
        test_getHtmlStringFromVNode_true속성_속성명만출력,
        test_getHtmlStringFromVNode_일반VNode_HTML문자열생성,
        test_pushHistory_정상추가,
        test_pushHistory_중간위치_이후이력잘림,
        test_restoreHistory_범위밖인덱스_무시,
        test_restoreHistory_음수인덱스_무시,
        test_edge_onBackClick_history비어있음_무반응,
        test_edge_onForwardClick_마지막위치_무반응,
        test_edge_pushHistory_연속다중추가_idx정확,
        test_edge_getVNodeFromInput_빈문자열_null반환,
        test_edge_cloneVNode_undefined입력_undefined반환
      ]
    }
  ];
}

function buildTestSummaryLogs(passCount, totalCount) {
  if (passCount === totalCount) {
    return [{
      type: 'create',
      label: 'SUMMARY',
      detail: '전체 통과 ' + passCount + ' / ' + totalCount
    }];
  }

  return [{
    type: 'remove',
    label: 'SUMMARY',
    detail: '실패 ' + (totalCount - passCount) + '개, 통과 ' + passCount + ' / ' + totalCount
  }];
}

function setRunTestsButtonState(isRunning) {
  const button = document.getElementById('btn-run-tests');

  if (!button) {
    return;
  }

  button.disabled = isRunning;
  button.textContent = isRunning ? '🧪 테스트 중...' : '🧪 테스트하기';
}

function waitForUi(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

async function onRunTestsClick() {
  const snapshot = captureAppSnapshot();
  const sections = getWhiteBoxTestSections();
  const logs = [];
  let passCount = 0;
  let totalCount = 0;

  setRunTestsButtonState(true);

  try {
    for (let sectionIdx = 0; sectionIdx < sections.length; sectionIdx++) {
      const section = sections[sectionIdx];

      logs.push({
        type: 'props',
        label: 'SUITE',
        detail: section.title
      });
      updatePatchLogPanel(logs);
      await waitForUi(20);

      for (let testIdx = 0; testIdx < section.tests.length; testIdx++) {
        const testFn = section.tests[testIdx];
        totalCount++;

        try {
          testFn();
          passCount++;
          logs.push({
            type: 'create',
            label: 'PASS',
            detail: testFn.name
          });
        } catch (error) {
          logs.push({
            type: 'remove',
            label: 'FAIL',
            detail: testFn.name + ' — ' + error.message
          });
          console.error('테스트 실패', error);
        }
        updatePatchLogPanel(logs);
        await waitForUi(20);
      }
    }
  } finally {
    restoreAppSnapshot(snapshot);
    updatePatchLogPanel(logs.concat(buildTestSummaryLogs(passCount, totalCount)));
    setRunTestsButtonState(false);
  }
}

function initializeApp() {
  const testArea = document.getElementById('test-area');
  const realArea = document.getElementById('real-area');

  if (!testArea || !realArea) {
    return;
  }

  try {
    // 1. game.js에서 초기 VNode를 직접 생성
    const initialVNode = initializeGame();

    // 2. VNode → createNode()로 real-area에 렌더링
    realArea.appendChild(createNode(initialVNode));

    // 3. real-area의 DOM을 domToVNode()로 VNode로 변환 (요구사항)
    currentVNode = domToVNode(realArea.firstElementChild);

    // 4. 그 VNode를 들여쓰기 적용한 HTML 문자열로 변환하여 test-area에 표시
    testArea.value = getHtmlStringFromVNode(currentVNode, 0);

    // 최초 상태도 history의 첫 항목으로 저장
    pushHistory(currentVNode, testArea.value);

    // VDOM 트리 초기 렌더링
    updateVDomPanel(currentVNode);
    updatePatchPanel([]);
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

    // 사용자가 textarea에 적은 최신 HTML을 새 상태로 해석한다.
    const newVNode = getVNodeFromInput(testArea.value);

    // 변경이 없으면 중복 history를 쌓지 않음
    if (isSameVNode(currentVNode, newVNode)) {
      console.log('변경된 내용이 없어 히스토리를 추가하지 않습니다.');
      renderHistory();
      return;
    }

    const patches = diff(currentVNode, newVNode, realArea);

    // MutationObserver로 patch() 실행 중 실제 DOM 변화 감지
    const domMutations = [];
    const observer = new MutationObserver(function (mutationList) {
      mutationList.forEach(function (m) { domMutations.push(m); });
    });
    observer.observe(realArea, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    patch(patches);
    // takeRecords()로 콜백 실행 전 대기 중인 뮤테이션을 동기적으로 수집
    observer.takeRecords().forEach(function (m) { domMutations.push(m); });
    observer.disconnect();

    // 하이라이트 비교용으로 old VNode를 먼저 저장
    const prevVNode = currentVNode;

    // 패치가 끝나면 "현재 상태" 기준도 새 VNode로 바꿔야
    // 다음 Patch에서 oldNode와 newNode 비교가 올바르게 이루어진다.
    currentVNode = cloneVNode(newVNode);
    pushHistory(currentVNode, testArea.value);

    // VDOM 트리 + Patch 내역 갱신 (prevVNode 전달 → 변경된 줄 하이라이트)
    updateVDomPanel(currentVNode, prevVNode);
    updatePatchPanel(patches, domMutations);

    // 패치 완료 → 대기 상태 해제
    resetPendingPatch();

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
  // 현재 위치의 바로 이전 history 상태를 복원한다.
  restoreHistory(historyIdx - 1);
}

/**
 * 앞으로가기 버튼
 * history[historyIdx + 1]로 이동
 */
function onForwardClick() {
  // 현재 위치의 바로 다음 history 상태를 복원한다.
  restoreHistory(historyIdx + 1);
}

// DOM이 모두 준비된 뒤 초기 상태를 세팅한다.
document.addEventListener('DOMContentLoaded', initializeApp);

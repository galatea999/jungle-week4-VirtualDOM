// =============================================
// 담당: 정환 | diff.js
// 책임: diff(), patch()
// AI 규약 버전: v1.0
// =============================================


// ─────────────────────────────────────────────
// diff()
// ─────────────────────────────────────────────

/** => 주석을 의미 : JS는 Python처럼 타입을 문법으로 강제할 수 없어서, JSDoc주석으로 이 변수엔 이런 타입이 들어와야해 를 사람과 에디터에게 알려주는 용도로 씀
 * 두 VNode를 비교해 patches 배열 반환
 * @param {VNode | string | null} oldNode - 이전 상태의 가상 노드
 *  * ↑태그   ↑타입                   ↑이름     ↑설명
  parameter :  이 함수의 매개변수다. { 들어올 수 있는 타입들. }
 * @param {VNode | string | null} newNode - 새로운 상태의 가상 노드
 * @param {Node} parentEl - 실제 DOM 부모 노드
 * @param {Node | null} existingEl - oldNode에 대응하는 실제 DOM 노드 (생략 시 parentEl.firstChild 사용)
 * @returns {Array} patches
 *
 * 처리해야 할 5가지 케이스:
 *   1. oldNode 없음  → create
 *   2. newNode 없음  → remove
 *   3. 타입 다름     → replace
 *   4. 텍스트 다름   → text
 *   5. props 다름    → props  (같은 타입이면 자식도 재귀 탐색)
 */
function diff(oldNode, newNode, parentEl, existingEl = parentEl.firstChild) {
  // patches는 "무엇을 바꿔야 하나?"를 기록해두는 메모 목록이야.
  // 나중에 patch() 함수가 이 목록을 보고 실제 화면을 바꿔줘.
  const patches = [];

  // ── 예외 케이스: 이전/새 노드가 둘 다 없음 → 아무것도 하지 않음 ─────
  // 예) 빈 화면에 대해 같은 빈 상태를 다시 diff 하면 패치가 없어야 해.
  if (
    (oldNode === null || oldNode === undefined) &&
    (newNode === null || newNode === undefined)
  ) {
    return patches;
  }

  // ── 케이스 1: 이전 노드가 없음 → 새로 만들어야 함 ──────────────────
  // 예) 처음에 아무것도 없다가 <div>가 생겼을 때
  if (oldNode === null || oldNode === undefined) {
    patches.push({
      type: 'create',     // "새로 만들어!" 라는 명령 종류
      parentEl: parentEl, // 어디에 붙일지 (부모 요소)
      vNode: newNode,     // 어떤 모양으로 만들지 (새 VNode)
    });
    // 더 볼 것이 없으니 바로 반환
    return patches;
  }

  // ── 케이스 2: 새 노드가 없음 → 기존 것을 지워야 함 ────────────────
  // 예) 화면에 있던 <p>가 사라져야 할 때
  if (newNode === null || newNode === undefined) {
    patches.push({
      type: 'remove',     // "이거 지워!" 라는 명령 종류
      el: existingEl,     // 지울 실제 DOM 요소 (i번째 자식을 정확히 가리킴)
    });
    return patches;
  }

  // ── 케이스 3 & 4: 둘 다 텍스트(문자열)인 경우 ──────────────────────
  // VNode는 문자열일 수도 있어. 예) children: ['안녕'] 에서 '안녕'이 바로 문자열 텍스트 노드야.
  const isOldText = typeof oldNode === 'string';
  const isNewText = typeof newNode === 'string';

  if (isOldText && isNewText) {
    // 케이스 4: 텍스트 내용이 달라진 경우
    if (oldNode !== newNode) {
      patches.push({
        type: 'text',       // "텍스트 내용 바꿔!" 라는 명령 종류
        el: existingEl,     // 바꿀 실제 텍스트 노드 (i번째 자식을 정확히 가리킴)
        value: newNode,     // 새로운 텍스트 내용
      });
    }
    // 텍스트가 같으면 아무것도 안 해도 돼 → patches는 빈 배열
    return patches;
  }

  // ── 케이스 3: 한쪽은 텍스트, 한쪽은 엘리먼트 → 완전히 다른 종류 ──
  // 예) 'hello' 였다가 <div> 가 되거나, <div> 였다가 'hello' 가 된 경우
  if (isOldText !== isNewText) {
    patches.push({
      type: 'replace',    // "통째로 교체해!" 라는 명령 종류
      el: existingEl,     // 교체될 기존 실제 DOM (i번째 자식을 정확히 가리킴)
      vNode: newNode,     // 교체할 새 VNode
    });
    return patches;
  }

  // ── 케이스 3: 둘 다 엘리먼트인데 태그 종류가 다른 경우 ────────────
  // 예) <p> 였다가 <h2> 가 된 경우 → 통째로 바꿔야 함
  if (oldNode.type !== newNode.type) {
    patches.push({
      type: 'replace',    // "통째로 교체해!" 라는 명령 종류
      el: existingEl,     // 교체될 기존 실제 DOM (i번째 자식을 정확히 가리킴)
      vNode: newNode,     // 교체할 새 VNode
    });
    return patches;
  }

  // ── 여기까지 왔다면: 태그 종류가 같은 엘리먼트끼리 비교 ────────────
  // 예) <div class="old"> 와 <div class="new"> 처럼 태그는 같고 내용이 다른 경우

  // ── 케이스 5: props(속성)가 달라진 경우 ────────────────────────────
  // props 란? class, id, style 같은 HTML 속성들이야.
  // 예) { class: 'old' } → { class: 'new' } 로 바뀐 경우
  const hasPropsChanged = !arePropsSame(oldNode.props, newNode.props);
  if (hasPropsChanged) {
    patches.push({
      type: 'props',           // "속성 바꿔!" 라는 명령 종류
      el: existingEl,          // 속성을 바꿀 실제 DOM 요소
      oldProps: oldNode.props, // 이전 속성 목록
      newProps: newNode.props, // 새로운 속성 목록
    });
  }

  // ── 자식들도 재귀적으로 비교 ──────────────────────────────────────
  // 재귀란? 함수가 자기 자신을 다시 호출하는 것이야.
  // 예) <div> 안에 <p> 가 있고, <p> 안에 텍스트가 있을 때
  //     <div> 비교 → <p> 비교 → 텍스트 비교 순서로 점점 깊이 들어가는 거야.
  const oldChildren = oldNode.children || [];
  const newChildren = newNode.children || [];

  // 두 배열 중 더 긴 쪽의 길이만큼 반복해야 빠진 자식도 감지할 수 있어
  const childCount = Math.max(oldChildren.length, newChildren.length);

  for (let i = 0; i < childCount; i++) {
    // i번째 이전 자식 (없으면 null)
    const oldChild = oldChildren[i] !== undefined ? oldChildren[i] : null;
    // i번째 새로운 자식 (없으면 null)
    const newChild = newChildren[i] !== undefined ? newChildren[i] : null;

    // i번째 실제 DOM 자식을 정확히 구해서 넘겨줘.
    // existingEl이 null이면 자식도 없으니 null로 처리해.
    const childEl = existingEl && existingEl.childNodes[i] !== undefined ? existingEl.childNodes[i] : null;

    // 자식에 대해 diff를 재귀 호출 → 자식의 패치 목록을 받아옴
    // childEl을 existingEl로 넘겨줘서 i번째 자식을 정확히 가리키게 함
    const childPatches = diff(oldChild, newChild, existingEl, childEl);

    // 자식의 패치 목록을 전체 패치 목록에 합쳐줘
    childPatches.forEach((patch) => patches.push(patch));
  }

  return patches;
}


// ─────────────────────────────────────────────
// 내부 헬퍼: arePropsSame()
// ─────────────────────────────────────────────

/**
 * 두 props 객체가 완전히 같은지 확인하는 함수
 * @param {object} oldProps
 * @param {object} newProps
 * @returns {boolean}
 *
 * 예시)
 *   arePropsSame({ class: 'a' }, { class: 'a' }) → true
 *   arePropsSame({ class: 'a' }, { class: 'b' }) → false
 */
function arePropsSame(oldProps, newProps) {
  // Object.keys()는 객체의 키 목록을 배열로 돌려줘.
  // 예) Object.keys({ class: 'a', id: 'b' }) → ['class', 'id']
  const oldKeys = Object.keys(oldProps);
  const newKeys = Object.keys(newProps);

  // 키(속성 이름) 개수가 다르면 이미 다른 거야
  if (oldKeys.length !== newKeys.length) {
    return false;
  }

  // 모든 키를 하나씩 돌면서 값이 같은지 확인해
  for (let i = 0; i < oldKeys.length; i++) {
    const key = oldKeys[i];
    // 값이 하나라도 다르면 false 반환
    if (oldProps[key] !== newProps[key]) {
      return false;
    }
  }

  // 모든 키·값이 같으면 true
  return true;
}


// ─────────────────────────────────────────────
// patch()
// ─────────────────────────────────────────────

/**
 * patches 배열을 실제 DOM에 반영
 * @param {Array} patches - diff()의 반환값
 * @returns {void}
 */
function patch(patches) {
  // patches는 "해야 할 일 목록"이야.
  // 하나씩 꺼내서 종류(type)에 따라 다른 작업을 수행해.
  patches.forEach(function (patch) {
    // patch.type 이 무엇이냐에 따라 다른 처리를 해
    switch (patch.type) {

      // ── 'create': 새 요소를 만들어서 부모에 붙이기 ────────────────
      case 'create': {
        // vdom.js의 createNode()를 사용해 VNode를 실제 DOM으로 만들어
        const newEl = createNode(patch.vNode);
        // 만든 DOM을 부모 요소 안에 붙여줘
        patch.parentEl.appendChild(newEl);
        console.log('DOM 생성:', patch.vNode);
        break;
      }

      // ── 'remove': 기존 요소를 화면에서 제거하기 ───────────────────
      case 'remove': {
        // el이 부모가 있을 때만 제거. 왜 ? JS내장함수인 removeChild()때문에. 부모야, 네 자식을 제거해. 그러므로 부모가 없을때 제거하면 오류가 뜸
        if (patch.el && patch.el.parentNode) {
          patch.el.parentNode.removeChild(patch.el);
          console.log('DOM 삭제:', patch.el);
        }
        break;
      }

      // ── 'replace': 기존 요소를 새 요소로 통째로 교체하기 ──────────
      case 'replace': {
        // 새 VNode로 실제 DOM 요소를 만들어
        const newEl = createNode(patch.vNode);
        // replaceChild(새것, 이전것) 으로 교체해
        if (patch.el && patch.el.parentNode) {
          patch.el.parentNode.replaceChild(newEl, patch.el);
          console.log('DOM 교체:', patch.vNode);
        }
        break;
      }

      // ── 'text': 텍스트 노드의 내용만 바꾸기 ──────────────────────
      case 'text': {
        // nodeValue는 텍스트 노드의 실제 문자열 값이야
        if (patch.el) {
          patch.el.nodeValue = patch.value;
          console.log('텍스트 변경:', patch.value);
        }
        break;
      }

      // ── 'props': 속성(class, id 등)만 업데이트하기 ────────────────
      case 'props': {
        applyProps(patch.el, patch.oldProps, patch.newProps);
        console.log('속성 변경:', patch.oldProps, '→', patch.newProps);
        break;
      }

      // ── 알 수 없는 타입이 들어온 경우 ─────────────────────────────
      default: {
        console.error('알 수 없는 패치 타입:', patch.type);
        break;
      }
    }
  });
}


// ─────────────────────────────────────────────
// 내부 헬퍼: applyProps()
// ─────────────────────────────────────────────

/**
 * 실제 DOM 요소의 속성을 oldProps → newProps 로 갱신
 * @param {Element} el
 * @param {object} oldProps
 * @param {object} newProps
 */
function applyProps(el, oldProps, newProps) {
  // 1단계: 사라진 속성 제거
  // 이전에는 있었는데 새로운 props에는 없는 속성은 지워야 해
  Object.keys(oldProps).forEach(function (key) {
    if (!(key in newProps)) {
      // removeAttribute()는 HTML 속성을 지워주는 함수야
      el.removeAttribute(key);
    }
  });

  // 2단계: 새로 추가되거나 바뀐 속성 적용
  // 새로운 props를 하나씩 돌면서 값이 달라진 것만 반영해
  Object.keys(newProps).forEach(function (key) {
    if (oldProps[key] !== newProps[key]) {
      // setAttribute(속성이름, 속성값) 으로 HTML 속성을 설정해
      el.setAttribute(key, newProps[key]);
    }
  });
}


// =============================================
// 테스트 케이스 (5개)
// 형식: given / when / then (실패 시 예외 발생)
// =============================================

function assertTest(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// 테스트 1: oldNode 없음 → create 패치 생성
function test_createPatch() {
  // given
  const oldNode = null;
  const newNode = { type: 'div', props: {}, children: [] };
  const parentEl = document.createElement('section');

  // when
  const patches = diff(oldNode, newNode, parentEl);

  // then
  assertTest(patches.length === 1, '패치가 1개여야 한다');
  assertTest(patches[0].type === 'create', '패치 타입이 create여야 한다');
  assertTest(patches[0].parentEl === parentEl, 'parentEl이 올바르게 전달돼야 한다');
  assertTest(patches[0].vNode === newNode, 'vNode가 newNode여야 한다');
}

// 테스트 2: newNode 없음 → remove 패치 생성
function test_removePatch() {
  // given
  const el = document.createElement('p');
  const oldNode = { type: 'p', props: {}, children: ['삭제될 노드'] };
  const newNode = null;
  const parentEl = document.createElement('div');
  parentEl.appendChild(el);

  // when
  // existingEl(el)을 직접 넘겨줘서 정확한 DOM 노드를 참조하게 함
  const patches = diff(oldNode, newNode, parentEl, el);

  // then
  assertTest(patches.length === 1, '패치가 1개여야 한다');
  assertTest(patches[0].type === 'remove', '패치 타입이 remove여야 한다');
  assertTest(patches[0].el === el, '삭제 대상 el이 정확히 일치해야 한다');
}

// 테스트 3: 타입 다름 → replace 패치 생성
function test_replacePatch() {
  // given
  const el = document.createElement('p');
  const oldNode = { type: 'p', props: {}, children: ['이전'] };
  const newNode = { type: 'h2', props: {}, children: ['이후'] };
  const parentEl = document.createElement('div');
  parentEl.appendChild(el);

  // when
  const patches = diff(oldNode, newNode, parentEl, el);

  // then
  assertTest(patches.length >= 1, '패치가 1개 이상이어야 한다');
  assertTest(patches[0].type === 'replace', '패치 타입이 replace여야 한다');
  assertTest(patches[0].vNode === newNode, 'vNode가 newNode여야 한다');
}

// 테스트 4: 텍스트 노드 다름 → text 패치 생성
function test_textPatch() {
  // given
  const textEl = document.createTextNode('이전 텍스트');
  const oldNode = '이전 텍스트';
  const newNode = '새로운 텍스트';
  const parentEl = document.createElement('div');
  parentEl.appendChild(textEl);

  // when
  const patches = diff(oldNode, newNode, parentEl, textEl);

  // then
  assertTest(patches.length === 1, '패치가 1개여야 한다');
  assertTest(patches[0].type === 'text', '패치 타입이 text여야 한다');
  assertTest(patches[0].value === '새로운 텍스트', '변경된 텍스트 값이 올바르게 들어가야 한다');
}

// 테스트 5: props 다름 → props 패치 생성
function test_propsPatch() {
  // given
  const el = document.createElement('div');
  el.setAttribute('class', 'old-class');
  const oldNode = { type: 'div', props: { class: 'old-class' }, children: [] };
  const newNode = { type: 'div', props: { class: 'new-class' }, children: [] };
  const parentEl = document.createElement('section');
  parentEl.appendChild(el);

  // when
  const patches = diff(oldNode, newNode, parentEl, el);

  // then
  assertTest(patches.length >= 1, '패치가 1개 이상이어야 한다');
  const propsPatch = patches.find((patch) => patch.type === 'props');
  assertTest(propsPatch !== undefined, 'props 패치가 존재해야 한다');
  assertTest(propsPatch.oldProps.class === 'old-class', 'oldProps가 올바르게 전달돼야 한다');
  assertTest(propsPatch.newProps.class === 'new-class', 'newProps가 올바르게 전달돼야 한다');
}

// 테스트 6: oldNode/newNode 둘 다 없음 → 빈 패치 반환
function test_emptyRootNoopPatch() {
  // given
  const parentEl = document.createElement('div');

  // when
  const patches = diff(null, null, parentEl);

  // then
  assertTest(patches.length === 0, '빈 루트 diff는 패치가 없어야 한다');
}

// 테스트 7: 같은 텍스트 → 패치 없음
// 텍스트가 바뀌지 않으면 아무 패치도 생성하면 안 된다
function test_sameTextNoPatch() {
  // given
  const textEl = document.createTextNode('변하지 않는 텍스트');
  const parentEl = document.createElement('div');
  parentEl.appendChild(textEl);

  // when
  const patches = diff('변하지 않는 텍스트', '변하지 않는 텍스트', parentEl, textEl);

  // then
  assertTest(patches.length === 0, '같은 텍스트는 패치가 없어야 한다');
}

// 테스트 8: 자식이 2개일 때 두 번째 자식만 제거 → 첫 번째 자식은 살아있어야 한다
// 이 테스트는 existingEl 버그를 재현한다.
// 이전에는 항상 parentEl.firstChild를 참조해서 잘못된 자식을 제거했었음.
function test_removeSecondChildOnly() {
  // given: p와 span 두 자식을 가진 실제 DOM
  const parentEl = document.createElement('div');
  const firstEl = document.createElement('p');
  const secondEl = document.createElement('span');
  parentEl.appendChild(firstEl);
  parentEl.appendChild(secondEl);

  const oldNode = {
    type: 'div', props: {}, children: [
      { type: 'p', props: {}, children: [] },
      { type: 'span', props: {}, children: [] },
    ],
  };
  const newNode = {
    type: 'div', props: {}, children: [
      { type: 'p', props: {}, children: [] },
      // span이 사라진 상태
    ],
  };

  // when
  const patches = diff(oldNode, newNode, parentEl, parentEl);
  patch(patches);

  // then: p는 살아있고 span만 사라져야 한다
  assertTest(parentEl.children.length === 1, '자식이 1개만 남아야 한다');
  assertTest(parentEl.children[0].tagName.toLowerCase() === 'p', '남은 자식이 p여야 한다');
}


// =============================================
// 엣지 케이스 테스트
// =============================================

// 엣지 케이스 1: oldNode와 newNode가 완전히 동일 → 패치가 하나도 없어야 한다
// 아무것도 안 바꿨는데 패치가 생기면 불필요한 DOM 조작이 일어나는 버그야
function test_edge_identicalNode_패치없음() {
  // given: 완전히 동일한 두 VNode
  const parentEl = document.createElement('div');
  const el = document.createElement('p');
  el.setAttribute('class', 'text');
  parentEl.appendChild(el);

  const oldNode = { type: 'p', props: { class: 'text' }, children: [] };
  const newNode = { type: 'p', props: { class: 'text' }, children: [] };

  // when
  const patches = diff(oldNode, newNode, parentEl, el);

  // then: 아무것도 안 바뀌었으니 패치가 0개여야 한다
  assertTest(patches.length === 0, '동일한 노드는 패치가 없어야 한다');
}

// 엣지 케이스 2: 자식이 추가되는 경우 → create 패치가 생겨야 한다
// oldChildren보다 newChildren이 많을 때 새 자식에 대한 create 패치가 생성되어야 해
function test_edge_childAdded_createPatch생성() {
  // given: 자식이 1개 → 2개로 늘어나는 상황
  const parentEl = document.createElement('div');
  const firstEl = document.createElement('p');
  parentEl.appendChild(firstEl);

  const oldNode = {
    type: 'div', props: {}, children: [
      { type: 'p', props: {}, children: [] },
    ],
  };
  const newNode = {
    type: 'div', props: {}, children: [
      { type: 'p', props: {}, children: [] },
      { type: 'span', props: {}, children: [] }, // 새로 추가된 자식
    ],
  };

  // when
  const patches = diff(oldNode, newNode, parentEl, parentEl);

  // then: 새 자식에 대한 create 패치가 있어야 한다
  const createPatch = patches.find(function (p) { return p.type === 'create'; });
  assertTest(createPatch !== undefined, '새 자식에 대한 create 패치가 있어야 한다');
  assertTest(createPatch.vNode.type === 'span', 'create 패치의 vNode가 span이어야 한다');
}

// 엣지 케이스 3: 3단계 깊이 중첩된 VNode → 재귀가 끝까지 내려가야 한다
// div > p > span > '텍스트' 구조에서 텍스트만 바뀌면 text 패치가 나와야 해
function test_edge_deepNested_재귀탐색() {
  // given: 3단계 중첩 실제 DOM 구성
  const parentEl = document.createElement('div');
  const pEl = document.createElement('p');
  const spanEl = document.createElement('span');
  const textEl = document.createTextNode('이전');
  spanEl.appendChild(textEl);
  pEl.appendChild(spanEl);
  parentEl.appendChild(pEl);

  const oldNode = {
    type: 'div', props: {}, children: [{
      type: 'p', props: {}, children: [{
        type: 'span', props: {}, children: ['이전'],
      }],
    }],
  };
  const newNode = {
    type: 'div', props: {}, children: [{
      type: 'p', props: {}, children: [{
        type: 'span', props: {}, children: ['이후'], // 텍스트만 바뀜
      }],
    }],
  };

  // when
  const patches = diff(oldNode, newNode, parentEl, parentEl);

  // then: 깊은 곳의 텍스트 변경이 text 패치로 잡혀야 한다
  const textPatch = patches.find(function (p) { return p.type === 'text'; });
  assertTest(textPatch !== undefined, '3단계 깊이의 텍스트 변경이 감지되어야 한다');
  assertTest(textPatch.value === '이후', 'text 패치의 값이 "이후"여야 한다');
}

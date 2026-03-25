// =============================================
// 담당: 정환 | diff.js
// 책임: diff(), patch()
// AI 규약 버전: v1.0
// =============================================

/**
 * 두 VNode를 비교해 patches 배열 반환
 * @param {VNode | string | null} oldNode
 * @param {VNode | string | null} newNode
 * @param {Node} parentEl - 실제 DOM 부모 노드
 * @returns {Array} patches
 *
 * 처리해야 할 5가지 케이스:
 *   1. oldNode 없음  → create
 *   2. newNode 없음  → remove
 *   3. 타입 다름     → replace
 *   4. 텍스트 다름   → text
 *   5. props 다름    → props  (같은 타입이면 자식도 재귀 탐색)
 */
function diff(oldNode, newNode, parentEl) {
  throw new Error('미구현: diff');
}

/**
 * patches 배열을 실제 DOM에 반영
 * @param {Array} patches - diff()의 반환값
 * @returns {void}
 */
function patch(patches) {
  throw new Error('미구현: patch');
}

// =============================================
// 테스트 케이스 (5개)
// 형식: given / when / then (console.assert 사용)
// =============================================

// 테스트 1: oldNode 없음 → create 패치 생성
function test_createPatch() {
  // given
  const oldNode = null;
  const newNode = { type: 'div', props: {}, children: [] };
  const parentEl = document.createElement('section');

  // when
  const patches = diff(oldNode, newNode, parentEl);

  // then
  console.assert(patches.length === 1, '패치가 1개여야 한다');
  console.assert(patches[0].type === 'create', '패치 타입이 create여야 한다');
  console.assert(patches[0].parentEl === parentEl, 'parentEl이 올바르게 전달돼야 한다');
  console.assert(patches[0].vNode === newNode, 'vNode가 newNode여야 한다');
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
  const patches = diff(oldNode, newNode, parentEl);

  // then
  console.assert(patches.length === 1, '패치가 1개여야 한다');
  console.assert(patches[0].type === 'remove', '패치 타입이 remove여야 한다');
}

// 테스트 3: 타입 다름 → replace 패치 생성
function test_replacePatch() {
  // given
  const oldNode = { type: 'p', props: {}, children: ['이전'] };
  const newNode = { type: 'h2', props: {}, children: ['이후'] };
  const parentEl = document.createElement('div');

  // when
  const patches = diff(oldNode, newNode, parentEl);

  // then
  console.assert(patches.length >= 1, '패치가 1개 이상이어야 한다');
  console.assert(patches[0].type === 'replace', '패치 타입이 replace여야 한다');
  console.assert(patches[0].vNode === newNode, 'vNode가 newNode여야 한다');
}

// 테스트 4: 텍스트 노드 다름 → text 패치 생성
function test_textPatch() {
  // given
  const oldNode = '이전 텍스트';
  const newNode = '새로운 텍스트';
  const parentEl = document.createElement('div');

  // when
  const patches = diff(oldNode, newNode, parentEl);

  // then
  console.assert(patches.length === 1, '패치가 1개여야 한다');
  console.assert(patches[0].type === 'text', '패치 타입이 text여야 한다');
  console.assert(patches[0].value === '새로운 텍스트', '변경된 텍스트 값이 올바르게 들어가야 한다');
}

// 테스트 5: props 다름 → props 패치 생성
function test_propsPatch() {
  // given
  const oldNode = { type: 'div', props: { class: 'old-class' }, children: [] };
  const newNode = { type: 'div', props: { class: 'new-class' }, children: [] };
  const parentEl = document.createElement('section');

  // when
  const patches = diff(oldNode, newNode, parentEl);

  // then
  console.assert(patches.length >= 1, '패치가 1개 이상이어야 한다');
  const propsPatch = patches.find((patch) => patch.type === 'props');
  console.assert(propsPatch !== undefined, 'props 패치가 존재해야 한다');
  console.assert(propsPatch.oldProps.class === 'old-class', 'oldProps가 올바르게 전달돼야 한다');
  console.assert(propsPatch.newProps.class === 'new-class', 'newProps가 올바르게 전달돼야 한다');
}

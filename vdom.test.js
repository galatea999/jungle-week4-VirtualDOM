// =============================================
// 담당: 팀 공통 | vdom.test.js
// 책임: domToVNode(), createNode() 화이트박스 테스트
// AI 규약 버전: v1.0
// =============================================

// ─────────────────────────────────────────────
// domToVNode() 화이트박스 테스트
// 내부 분기:
//   [1] nodeType === 3 (텍스트) + 내용 있음 → 문자열 반환
//   [2] nodeType === 3 (텍스트) + 공백만 있음 → null 반환
//   [3] nodeType !== 1 && !== 3 (주석 등) → null 반환
//   [4] nodeType === 1 (엘리먼트) → VNode 반환
//   [5] 속성(attributes) 있는 엘리먼트 → props 수집
//   [6] 자식 있는 엘리먼트 → children 재귀 변환
// ─────────────────────────────────────────────

// 테스트 1: [1번 분기] 텍스트 노드에 내용이 있으면 문자열을 그대로 반환한다
function test_domToVNode_텍스트노드_문자열반환() {
  // given: 텍스트 노드 생성
  const textNode = document.createTextNode('안녕하세요');

  // when
  const result = domToVNode(textNode);

  // then
  console.assert(result === '안녕하세요', '[domToVNode] 텍스트 노드는 문자열을 반환해야 한다');
  console.log('test_domToVNode_텍스트노드_문자열반환 완료');
}

// 테스트 2: [2번 분기] 공백·줄바꿈만 있는 텍스트 노드는 null을 반환한다
function test_domToVNode_공백텍스트노드_null반환() {
  // given: 공백과 줄바꿈만 있는 텍스트 노드
  const textNode = document.createTextNode('   \n   ');

  // when
  const result = domToVNode(textNode);

  // then
  console.assert(result === null, '[domToVNode] 공백 텍스트 노드는 null을 반환해야 한다');
  console.log('test_domToVNode_공백텍스트노드_null반환 완료');
}

// 테스트 3: [3번 분기] 주석 노드(nodeType 8)는 null을 반환한다
function test_domToVNode_주석노드_null반환() {
  // given: 주석 노드는 nodeType === 8 이라 1도 3도 아님
  const commentNode = document.createComment('이건 주석이야');

  // when
  const result = domToVNode(commentNode);

  // then
  console.assert(result === null, '[domToVNode] 주석 노드는 null을 반환해야 한다');
  console.log('test_domToVNode_주석노드_null반환 완료');
}

// 테스트 4: [4번 분기] 일반 엘리먼트는 올바른 VNode 구조를 반환한다
function test_domToVNode_엘리먼트_VNode구조반환() {
  // given
  const el = document.createElement('div');

  // when
  const vNode = domToVNode(el);

  // then: VNode의 3가지 필드가 모두 있어야 한다
  console.assert(vNode.type === 'div', '[domToVNode] type이 div여야 한다');
  console.assert(typeof vNode.props === 'object', '[domToVNode] props가 객체여야 한다');
  console.assert(Array.isArray(vNode.children), '[domToVNode] children이 배열이어야 한다');
  console.log('test_domToVNode_엘리먼트_VNode구조반환 완료');
}

// 테스트 5: [5번 분기] 속성이 있는 엘리먼트는 props를 올바르게 수집한다
function test_domToVNode_속성있는엘리먼트_props수집() {
  // given: class와 id 속성을 가진 엘리먼트
  const el = document.createElement('div');
  el.setAttribute('class', 'card');
  el.setAttribute('id', 'wrap');

  // when
  const vNode = domToVNode(el);

  // then
  console.assert(vNode.props['class'] === 'card', '[domToVNode] class 속성이 올바르게 수집되어야 한다');
  console.assert(vNode.props['id'] === 'wrap', '[domToVNode] id 속성이 올바르게 수집되어야 한다');
  console.assert(Object.keys(vNode.props).length === 2, '[domToVNode] props 개수가 2개여야 한다');
  console.log('test_domToVNode_속성있는엘리먼트_props수집 완료');
}

// 테스트 6: [6번 분기] 자식이 있는 엘리먼트는 children을 재귀 변환한다
function test_domToVNode_자식있는엘리먼트_children재귀변환() {
  // given: div 안에 p 안에 텍스트가 있는 2단계 구조
  const parent = document.createElement('div');
  const child = document.createElement('p');
  child.textContent = '내용';
  parent.appendChild(child);

  // when
  const vNode = domToVNode(parent);

  // then: 자식 VNode가 올바르게 변환되어야 한다
  console.assert(vNode.children.length === 1, '[domToVNode] 자식이 1개여야 한다');
  console.assert(vNode.children[0].type === 'p', '[domToVNode] 자식 type이 p여야 한다');
  console.assert(vNode.children[0].children[0] === '내용', '[domToVNode] 손자 텍스트가 올바르게 변환되어야 한다');
  console.log('test_domToVNode_자식있는엘리먼트_children재귀변환 완료');
}


// ─────────────────────────────────────────────
// createNode() 화이트박스 테스트
// 내부 분기:
//   [1] typeof vNode === 'string' → createTextNode
//   [2] 엘리먼트 VNode → createElement
//   [3] props 있음 → setAttribute 반복
//   [4] children 있음 → appendChild 재귀
// ─────────────────────────────────────────────

// 테스트 7: [1번 분기] 문자열이 들어오면 텍스트 노드를 만든다
function test_createNode_문자열입력_텍스트노드생성() {
  // given
  const vNode = '안녕하세요';

  // when
  const node = createNode(vNode);

  // then: nodeType 3이 텍스트 노드야
  console.assert(node.nodeType === 3, '[createNode] 텍스트 노드여야 한다 (nodeType 3)');
  console.assert(node.textContent === '안녕하세요', '[createNode] 텍스트 내용이 올바르게 설정되어야 한다');
  console.log('test_createNode_문자열입력_텍스트노드생성 완료');
}

// 테스트 8: [2번 분기] VNode → 올바른 태그의 엘리먼트 생성
function test_createNode_VNode_태그생성() {
  // given
  const vNode = { type: 'p', props: {}, children: [] };

  // when
  const el = createNode(vNode);

  // then
  console.assert(el.tagName.toLowerCase() === 'p', '[createNode] 태그가 p여야 한다');
  console.log('test_createNode_VNode_태그생성 완료');
}

// 테스트 9: [3번 분기] props가 있으면 setAttribute로 속성을 설정한다
function test_createNode_props있음_속성설정() {
  // given: class와 id를 가진 VNode
  const vNode = { type: 'div', props: { class: 'card', id: 'main' }, children: [] };

  // when
  const el = createNode(vNode);

  // then
  console.assert(el.getAttribute('class') === 'card', '[createNode] class 속성이 올바르게 설정되어야 한다');
  console.assert(el.getAttribute('id') === 'main', '[createNode] id 속성이 올바르게 설정되어야 한다');
  console.log('test_createNode_props있음_속성설정 완료');
}

// 테스트 10: [4번 분기] children이 있으면 자식 노드를 재귀적으로 생성해 붙인다
function test_createNode_children있음_자식생성() {
  // given: p 안에 텍스트가 있는 VNode
  const vNode = {
    type: 'p',
    props: {},
    children: ['내용'],
  };

  // when
  const el = createNode(vNode);

  // then
  console.assert(el.childNodes.length === 1, '[createNode] 자식이 1개여야 한다');
  console.assert(el.childNodes[0].nodeType === 3, '[createNode] 자식이 텍스트 노드여야 한다');
  console.assert(el.childNodes[0].textContent === '내용', '[createNode] 자식 텍스트가 올바르게 생성되어야 한다');
  console.log('test_createNode_children있음_자식생성 완료');
}

// 테스트 11: domToVNode → createNode 왕복 변환 (통합 검증)
// domToVNode로 변환한 VNode를 createNode로 다시 만들면 원본과 같아야 한다
function test_domToVNode_createNode_왕복변환() {
  // given: 속성과 자식을 가진 실제 DOM 엘리먼트
  const original = document.createElement('div');
  original.setAttribute('class', 'box');
  const child = document.createElement('span');
  child.textContent = '텍스트';
  original.appendChild(child);

  // when: DOM → VNode → DOM 순서로 왕복 변환
  const vNode = domToVNode(original);
  const restored = createNode(vNode);

  // then: 태그·속성·자식 텍스트가 모두 원본과 같아야 한다
  console.assert(restored.tagName.toLowerCase() === 'div', '[왕복변환] 태그가 div여야 한다');
  console.assert(restored.getAttribute('class') === 'box', '[왕복변환] class 속성이 보존되어야 한다');
  console.assert(restored.children[0].tagName.toLowerCase() === 'span', '[왕복변환] 자식 태그가 span이어야 한다');
  console.assert(restored.children[0].textContent === '텍스트', '[왕복변환] 자식 텍스트가 보존되어야 한다');
  console.log('test_domToVNode_createNode_왕복변환 완료');
}


// =============================================
// 엣지 케이스 테스트
// =============================================

// 엣지 케이스 1: props가 {} 빈 객체인 엘리먼트 → domToVNode의 props도 빈 객체여야 한다
function test_edge_domToVNode_속성없는엘리먼트_빈props() {
  // given: 아무 속성도 없는 엘리먼트
  const el = document.createElement('div');

  // when
  const vNode = domToVNode(el);

  // then: props가 빈 객체여야 한다 (undefined나 null이 아닌 것도 확인)
  console.assert(typeof vNode.props === 'object', '[엣지] props가 객체여야 한다');
  console.assert(Object.keys(vNode.props).length === 0, '[엣지] 속성 없는 엘리먼트는 props가 빈 객체여야 한다');
  console.log('test_edge_domToVNode_속성없는엘리먼트_빈props 완료');
}

// 엣지 케이스 2: children이 [] 빈 배열인 VNode → 자식 노드 없는 엘리먼트 생성
function test_edge_createNode_빈children_자식없음() {
  // given: children이 빈 배열인 VNode
  const vNode = { type: 'div', props: {}, children: [] };

  // when
  const el = createNode(vNode);

  // then: 자식이 0개여야 한다
  console.assert(el.childNodes.length === 0, '[엣지] children이 빈 배열이면 자식이 없어야 한다');
  console.log('test_edge_createNode_빈children_자식없음 완료');
}

// 엣지 케이스 3: 공백이 섞인 텍스트 노드 → trim 후 내용이 있으면 문자열 반환
// 앞뒤에 공백이 있어도 내용이 있으면 null이 아니라 trim된 문자열을 반환해야 해
function test_edge_domToVNode_공백섞인텍스트_trim후반환() {
  // given: 앞뒤에 공백이 있는 텍스트 노드
  const textNode = document.createTextNode('  안녕  ');

  // when
  const result = domToVNode(textNode);

  // then: trim된 문자열이 반환되어야 한다
  console.assert(result === '안녕', '[엣지] 앞뒤 공백은 trim되어야 한다');
  console.log('test_edge_domToVNode_공백섞인텍스트_trim후반환 완료');
}

// 엣지 케이스 4: 자식이 여러 개인 VNode → 순서대로 모두 생성되어야 한다
function test_edge_createNode_자식여러개_순서보장() {
  // given: 자식이 3개인 VNode
  const vNode = {
    type: 'ul',
    props: {},
    children: [
      { type: 'li', props: {}, children: ['첫째'] },
      { type: 'li', props: {}, children: ['둘째'] },
      { type: 'li', props: {}, children: ['셋째'] },
    ],
  };

  // when
  const el = createNode(vNode);

  // then: 자식이 3개이고 순서가 맞아야 한다
  console.assert(el.children.length === 3, '[엣지] 자식이 3개여야 한다');
  console.assert(el.children[0].textContent === '첫째', '[엣지] 첫 번째 자식이 올바르게 생성되어야 한다');
  console.assert(el.children[1].textContent === '둘째', '[엣지] 두 번째 자식이 올바르게 생성되어야 한다');
  console.assert(el.children[2].textContent === '셋째', '[엣지] 세 번째 자식이 올바르게 생성되어야 한다');
  console.log('test_edge_createNode_자식여러개_순서보장 완료');
}

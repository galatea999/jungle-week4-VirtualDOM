// =============================================
// 담당: 팀 공통 | app.test.js
// 책임: app.js 순수 함수 + 상태 관리 화이트박스 테스트
// AI 규약 버전: v1.0
// =============================================

function assertTest(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ─────────────────────────────────────────────
// 테스트 헬퍼: 전역 상태를 초기화하는 함수
// app.js의 전역 변수(history, historyIdx, currentVNode)를
// 테스트마다 깨끗하게 리셋해야 각 테스트가 서로 영향을 안 줘.
// ─────────────────────────────────────────────
function resetAppState() {
  history = [];
  historyIdx = -1;
  currentVNode = null;
}


// ─────────────────────────────────────────────
// cloneVNode() 화이트박스 테스트
// 내부 분기:
//   [1] null / undefined → 그대로 반환
//   [2] 일반 VNode → JSON 깊은 복사
// ─────────────────────────────────────────────

// 테스트 1: [1번 분기] null 입력 → null 반환
function test_cloneVNode_null입력_null반환() {
  // given
  const input = null;

  // when
  const result = cloneVNode(input);

  // then
  assertTest(result === null, '[cloneVNode] null 입력 시 null을 반환해야 한다');
  console.log('test_cloneVNode_null입력_null반환 완료');
}

// 테스트 2: [2번 분기] VNode를 복사하면 원본과 내용은 같되 참조는 다르다 (깊은 복사)
function test_cloneVNode_깊은복사_원본불변() {
  // given
  const original = { type: 'div', props: { class: 'card' }, children: ['내용'] };

  // when
  const cloned = cloneVNode(original);

  // then: 내용은 같아야 한다
  assertTest(cloned.type === 'div', '[cloneVNode] type이 복사되어야 한다');
  assertTest(cloned.props.class === 'card', '[cloneVNode] props가 복사되어야 한다');

  // then: 복사본을 수정해도 원본은 바뀌지 않아야 한다 (깊은 복사 검증)
  cloned.props.class = '변경됨';
  assertTest(original.props.class === 'card', '[cloneVNode] 복사본 수정이 원본에 영향을 주면 안 된다');
  console.log('test_cloneVNode_깊은복사_원본불변 완료');
}


// ─────────────────────────────────────────────
// escapeHtml() 화이트박스 테스트
// 내부 처리: & → &amp; / < → &lt; / > → &gt;
// XSS 방지를 위한 함수야.
// ─────────────────────────────────────────────

// 테스트 3: & < > 세 문자가 모두 올바르게 이스케이프된다
function test_escapeHtml_특수문자이스케이프() {
  // given: XSS 위험 문자들
  const input = '<script>alert("XSS")</script> & 기타';

  // when
  const result = escapeHtml(input);

  // then
  assertTest(result.includes('&lt;'), '[escapeHtml] <가 &lt;로 이스케이프되어야 한다');
  assertTest(result.includes('&gt;'), '[escapeHtml] >가 &gt;로 이스케이프되어야 한다');
  assertTest(result.includes('&amp;'), '[escapeHtml] &가 &amp;로 이스케이프되어야 한다');
  assertTest(!result.includes('<script>'), '[escapeHtml] 원본 <script> 태그가 남아있으면 안 된다');
  console.log('test_escapeHtml_특수문자이스케이프 완료');
}


// ─────────────────────────────────────────────
// getHtmlStringFromVNode() 화이트박스 테스트
// 내부 분기:
//   [1] null / undefined → 빈 문자열
//   [2] string → escapeHtml 적용
//   [3] props의 value가 false / null → 속성 제외
//   [4] props의 value가 true → 속성명만 출력
//   [5] 일반 props → key="value" 형식
//   [6] children → 재귀 변환 후 이어붙임
// ─────────────────────────────────────────────

// 테스트 4: [1번 분기] null → 빈 문자열 반환
function test_getHtmlStringFromVNode_null입력_빈문자열() {
  // given
  const vNode = null;

  // when
  const result = getHtmlStringFromVNode(vNode);

  // then
  assertTest(result === '', '[getHtmlStringFromVNode] null 입력 시 빈 문자열을 반환해야 한다');
  console.log('test_getHtmlStringFromVNode_null입력_빈문자열 완료');
}

// 테스트 5: [2번 분기] 문자열 VNode → XSS 이스케이프된 텍스트 반환
function test_getHtmlStringFromVNode_문자열_이스케이프() {
  // given: XSS 위험 문자가 포함된 텍스트
  const vNode = '<위험>';

  // when
  const result = getHtmlStringFromVNode(vNode);

  // then: < > 가 이스케이프되어야 한다
  assertTest(result === '&lt;위험&gt;', '[getHtmlStringFromVNode] 문자열은 이스케이프되어야 한다');
  console.log('test_getHtmlStringFromVNode_문자열_이스케이프 완료');
}

// 테스트 6: [3번 분기] props의 value가 false이면 해당 속성을 출력하지 않는다
function test_getHtmlStringFromVNode_false속성_제외() {
  // given: disabled가 false인 VNode
  const vNode = { type: 'button', props: { disabled: false }, children: [] };

  // when
  const result = getHtmlStringFromVNode(vNode);

  // then: disabled 속성이 HTML에 포함되면 안 된다
  assertTest(result === '<button></button>', '[getHtmlStringFromVNode] false 속성은 출력되면 안 된다');
  console.log('test_getHtmlStringFromVNode_false속성_제외 완료');
}

// 테스트 7: [4번 분기] props의 value가 true이면 속성명만 출력한다
function test_getHtmlStringFromVNode_true속성_속성명만출력() {
  // given: checked가 true인 VNode
  const vNode = { type: 'input', props: { checked: true }, children: [] };

  // when
  const result = getHtmlStringFromVNode(vNode);

  // then: checked 속성명만 들어가야 한다 (값 없이)
  assertTest(result.includes('checked'), '[getHtmlStringFromVNode] true 속성은 속성명만 출력되어야 한다');
  assertTest(!result.includes('checked="'), '[getHtmlStringFromVNode] true 속성에 ="..." 형식이 붙으면 안 된다');
  console.log('test_getHtmlStringFromVNode_true속성_속성명만출력 완료');
}

// 테스트 8: [5번+6번 분기] 일반 VNode → 올바른 HTML 문자열 생성
function test_getHtmlStringFromVNode_일반VNode_HTML문자열생성() {
  // given: class 속성과 텍스트 자식을 가진 VNode
  const vNode = {
    type: 'p',
    props: { class: 'text' },
    children: ['내용'],
  };

  // when
  const result = getHtmlStringFromVNode(vNode);

  // then
  assertTest(result === '<p class="text">내용</p>', '[getHtmlStringFromVNode] HTML 문자열이 올바르게 생성되어야 한다');
  console.log('test_getHtmlStringFromVNode_일반VNode_HTML문자열생성 완료');
}


// ─────────────────────────────────────────────
// pushHistory() 화이트박스 테스트
// 내부 분기:
//   [1] 정상 추가 → history 배열에 쌓임, historyIdx 증가
//   [2] 중간 위치에서 추가 → 이후 이력 잘림 (브랜칭)
// ─────────────────────────────────────────────

// 테스트 9: [1번 분기] pushHistory 호출 시 history에 추가되고 historyIdx가 증가한다
function test_pushHistory_정상추가() {
  // given: 상태 초기화
  resetAppState();
  const vNode = { type: 'div', props: {}, children: [] };

  // when
  pushHistory(vNode);

  // then
  assertTest(history.length === 1, '[pushHistory] history에 1개가 추가되어야 한다');
  assertTest(historyIdx === 0, '[pushHistory] historyIdx가 0이 되어야 한다');
  console.log('test_pushHistory_정상추가 완료');
}

// 테스트 10: [2번 분기] 중간 위치에서 pushHistory 호출 시 이후 이력이 잘린다
// 예) A → B → C 순서로 히스토리가 있을 때 B로 뒤로간 후 D를 추가하면
//     A → B → D 가 되어야 해. (C는 사라짐)
function test_pushHistory_중간위치_이후이력잘림() {
  // given: A, B, C 3개의 이력이 있고 B 위치(index 1)에 있는 상황
  resetAppState();
  const vNodeA = { type: 'div', props: {}, children: ['A'] };
  const vNodeB = { type: 'div', props: {}, children: ['B'] };
  const vNodeC = { type: 'div', props: {}, children: ['C'] };
  const vNodeD = { type: 'div', props: {}, children: ['D'] };

  pushHistory(vNodeA); // historyIdx = 0
  pushHistory(vNodeB); // historyIdx = 1
  pushHistory(vNodeC); // historyIdx = 2

  // 뒤로가기 → B 위치로 이동
  historyIdx = 1;

  // when: B 위치에서 새 VNode D를 추가
  pushHistory(vNodeD);

  // then: C가 사라지고 A, B, D 만 남아야 한다
  assertTest(history.length === 3, '[pushHistory] 이후 이력이 잘려 총 3개여야 한다');
  assertTest(historyIdx === 2, '[pushHistory] historyIdx가 2여야 한다');
  assertTest(history[2].vNode.children[0] === 'D', '[pushHistory] 마지막 이력이 D여야 한다');
  console.log('test_pushHistory_중간위치_이후이력잘림 완료');
}


// ─────────────────────────────────────────────
// restoreHistory() 화이트박스 테스트
// 내부 분기:
//   [1] 범위 밖 인덱스 → 아무것도 안 함
//   [2] 정상 인덱스 → currentVNode, historyIdx 갱신
// ─────────────────────────────────────────────

// 테스트 11: [1번 분기] 범위 밖 인덱스로 restoreHistory 호출 시 상태가 변하지 않는다
function test_restoreHistory_범위밖인덱스_무시() {
  // given: 이력 1개짜리 상태
  resetAppState();
  pushHistory({ type: 'div', props: {}, children: [] });
  const prevIdx = historyIdx; // 0

  // when: 존재하지 않는 인덱스(99) 로 복원 시도
  restoreHistory(99);

  // then: 상태가 바뀌지 않아야 한다
  assertTest(historyIdx === prevIdx, '[restoreHistory] 범위 밖 인덱스는 무시되어야 한다');
  console.log('test_restoreHistory_범위밖인덱스_무시 완료');
}

// 테스트 12: [1번 분기] 음수 인덱스로 restoreHistory 호출 시 상태가 변하지 않는다
function test_restoreHistory_음수인덱스_무시() {
  // given
  resetAppState();
  pushHistory({ type: 'div', props: {}, children: [] });

  // when
  restoreHistory(-1);

  // then
  assertTest(historyIdx === 0, '[restoreHistory] 음수 인덱스는 무시되어야 한다');
  console.log('test_restoreHistory_음수인덱스_무시 완료');
}


// =============================================
// 엣지 케이스 테스트
// =============================================

// 엣지 케이스 1: history가 비어있을 때 onBackClick 호출 → 상태 변화 없어야 한다
// historyIdx가 -1인 상태에서 뒤로가기를 누르면 restoreHistory(-2)가 호출되는데
// 범위 밖이므로 아무것도 안 해야 해
function test_edge_onBackClick_history비어있음_무반응() {
  // given: 히스토리가 비어있는 초기 상태
  resetAppState();
  // historyIdx === -1, history === []

  // when: 뒤로가기 버튼 클릭 (historyIdx - 1 = -2)
  onBackClick();

  // then: 상태 변화 없어야 한다
  assertTest(historyIdx === -1, '[엣지] 빈 히스토리에서 뒤로가기 해도 historyIdx가 -1이어야 한다');
  assertTest(history.length === 0, '[엣지] 빈 히스토리에서 뒤로가기 해도 history가 비어있어야 한다');
  console.log('test_edge_onBackClick_history비어있음_무반응 완료');
}

// 엣지 케이스 2: 마지막 위치에서 onForwardClick 호출 → 상태 변화 없어야 한다
function test_edge_onForwardClick_마지막위치_무반응() {
  // given: 이력이 2개이고 마지막(index 1)에 있는 상태
  resetAppState();
  pushHistory({ type: 'div', props: {}, children: ['A'] });
  pushHistory({ type: 'div', props: {}, children: ['B'] });
  // historyIdx === 1 (마지막)

  // when: 앞으로가기 버튼 클릭
  onForwardClick();

  // then: historyIdx가 그대로여야 한다
  assertTest(historyIdx === 1, '[엣지] 마지막 위치에서 앞으로가기 해도 historyIdx가 바뀌면 안 된다');
  console.log('test_edge_onForwardClick_마지막위치_무반응 완료');
}

// 엣지 케이스 3: pushHistory를 연속으로 여러 번 호출 → historyIdx가 정확히 증가해야 한다
function test_edge_pushHistory_연속다중추가_idx정확() {
  // given
  resetAppState();

  // when: 5번 연속으로 pushHistory 호출
  for (let i = 0; i < 5; i++) {
    pushHistory({ type: 'div', props: {}, children: [String(i)] });
  }

  // then: historyIdx가 4(마지막 인덱스)이고 history가 5개여야 한다
  assertTest(history.length === 5, '[엣지] 5번 추가하면 history가 5개여야 한다');
  assertTest(historyIdx === 4, '[엣지] 5번 추가하면 historyIdx가 4여야 한다');
  console.log('test_edge_pushHistory_연속다중추가_idx정확 완료');
}

// 엣지 케이스 4: 빈 문자열 입력 → getVNodeFromInput이 null을 반환해야 한다
// 사용자가 textarea를 완전히 비우고 Patch를 누르는 상황
function test_edge_getVNodeFromInput_빈문자열_null반환() {
  // given: 완전히 빈 문자열
  const emptyInput = '';

  // when
  const result = getVNodeFromInput(emptyInput);

  // then: null이 반환되어야 한다 (빈 화면 처리)
  assertTest(result === null, '[엣지] 빈 문자열은 null VNode를 반환해야 한다');
  console.log('test_edge_getVNodeFromInput_빈문자열_null반환 완료');
}

// 엣지 케이스 5: cloneVNode에 undefined 입력 → undefined 반환해야 한다
function test_edge_cloneVNode_undefined입력_undefined반환() {
  // given
  const input = undefined;

  // when
  const result = cloneVNode(input);

  // then
  assertTest(result === undefined, '[엣지] undefined 입력 시 undefined를 반환해야 한다');
  console.log('test_edge_cloneVNode_undefined입력_undefined반환 완료');
}

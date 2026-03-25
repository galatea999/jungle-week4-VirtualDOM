// =============================================
// 담당: 세인 | app.js
// 책임: onPatchClick(), onBackClick(), onForwardClick()
// AI 규약 버전: v1.0
// =============================================

// 전역 상태
let history = [];       // VNode 스냅샷 배열
let historyIdx = -1;    // 현재 위치 인덱스
let currentVNode = null;

/**
 * Patch 버튼 클릭 시
 * 1. domToVNode(테스트영역)으로 newVNode 생성
 * 2. diff(currentVNode, newVNode, 실제영역)로 patches 획득
 * 3. patch(patches)로 실제영역 DOM 업데이트
 * 4. history에 newVNode push, currentVNode 갱신
 * 5. historyIdx 업데이트
 */
function onPatchClick() {
  throw new Error('미구현: onPatchClick');
}

/**
 * 뒤로가기 버튼
 * history[historyIdx - 1]로 이동
 * 실제영역 + 테스트영역 모두 해당 VNode 상태로 변경
 */
function onBackClick() {
  throw new Error('미구현: onBackClick');
}

/**
 * 앞으로가기 버튼
 * history[historyIdx + 1]로 이동
 */
function onForwardClick() {
  throw new Error('미구현: onForwardClick');
}

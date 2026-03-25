// =============================================
// 담당: 은재 | vdom.js
// 책임: domToVNode(), createNode()
// AI 규약 버전: v1.0
// =============================================

/**
 * 실제 DOM 노드 → VNode 변환
 * @param {Node} domNode
 * @returns {VNode | string}
 *
 * 예시)
 *   domToVNode(document.querySelector('div'))
 *   → { type: 'div', props: { class: 'wrap' }, children: [...] }
 *
 *   텍스트 노드일 경우 문자열 그대로 반환
 *   → '안녕하세요'
 */
function domToVNode(domNode) {
  throw new Error('미구현: domToVNode');
}

/**
 * VNode → 실제 DOM 노드 생성
 * @param {VNode | string} vNode
 * @returns {Node}
 *
 * 예시)
 *   createNode({ type: 'p', props: {}, children: ['내용'] })
 *   → <p>내용</p> (실제 DOM Element)
 */
function createNode(vNode) {
  throw new Error('미구현: createNode');
}

// =============================================
// 담당: 은재 | vdom.js
// 책임: domToVNode(), createNode()
// AI 규약 버전: v1.0
// =============================================

/**
 * 실제 DOM 노드 → VNode 변환
 * @param {Node} domNode
 * @returns {VNode | string | null}
 *
 * 예시)
 *   domToVNode(document.querySelector('div'))
 *   → { type: 'div', props: { class: 'wrap' }, children: [...] }
 *
 *   텍스트 노드일 경우 문자열 그대로 반환
 *   → '안녕하세요'
 */
function domToVNode(domNode) {
  // 텍스트 노드 처리 (nodeType 3)
  if (domNode.nodeType === 3) {
    const text = domNode.textContent.trim();
    // 공백·줄바꿈만 있는 텍스트 노드는 무시
    if (text === '') return null;
    return text;
  }

  // 엘리먼트 노드(nodeType 1)만 처리 — 주석 등 그 외 타입 무시
  if (domNode.nodeType !== 1) return null;

  const type = domNode.tagName.toLowerCase();

  // 속성(props) 수집
  const props = {};
  for (const attr of domNode.attributes) {
    props[attr.name] = attr.value;
  }

  // 자식 노드 재귀 변환 후 null 제거
  const children = Array.from(domNode.childNodes)
    .map((child) => domToVNode(child))
    .filter((child) => child !== null);

  return { type, props, children };
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
  // 문자열이면 텍스트 노드 생성
  if (typeof vNode === 'string') {
    return document.createTextNode(vNode);
  }

  const el = document.createElement(vNode.type);

  // 속성(props) 적용
  for (const [key, value] of Object.entries(vNode.props)) {
    el.setAttribute(key, value);
  }

  // 자식 노드 재귀 생성 후 추가
  vNode.children.forEach((child) => {
    el.appendChild(createNode(child));
  });

  return el;
}

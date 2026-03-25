# Virtual DOM Diff

> 바닐라 JavaScript로 구현한 Virtual DOM Diff 시각화 게임

---

## 프로젝트 개요

DOM 객체를 Virtual DOM 형태로 표현하고, Diff 알고리즘으로 변경 전후를 비교해 바뀐 내용을 시각적으로 확인할 수 있는 **'개발자 키우기' 게임**입니다.

---

## Virtual DOM 사용 이유

실제 DOM은 요소 하나만 바꿔도 브라우저가 레이아웃을 재계산하는 **Reflow**와, 이를 바탕으로 화면을 다시 그리는 **Repaint**를 수행합니다. 변경이 발생할 때마다 DOM을 직접 조작하면 이런 비용이 반복되기 때문에 비효율적입니다.

원래 DOM 객체는 이벤트 리스너나 렌더링 엔진과 관련된 무거운 브라우저 기능을 포함하고 있습니다. 하지만 변경 전후를 비교하는 데는 구조와 데이터만 있으면 충분하므로, 이 프로젝트에서는 이런 기능을 제거한 순수 JavaScript 객체 형태의 **Virtual DOM**으로 UI 상태를 표현합니다.

변경 처리는 다음 두 단계로 나누어 진행합니다.

1. **비교(Diff)**: 이전 VNode와 새 VNode를 재귀적으로 비교해 무엇이 바뀌었는지 `patches` 배열로 정리합니다.
2. **적용(Patch)**: 계산된 `patches`를 실제 DOM에 반영해 불필요한 DOM 조작을 최소화합니다.

---

## VNode 구조

VNode는 태그명, 속성, 자식 노드를 담는 순수 JavaScript 객체입니다.

```js
{
  type: string,    // 태그명. 예) 'div', 'p', 'h2'
  props: object,   // 속성. 예) { class: 'card', id: 'wrap' }
  children: Array  // 자식. 각 요소는 VNode 또는 string(텍스트)
}
```

부모-자식 관계가 반복되는 트리 구조이기 때문에, Diff 알고리즘을 재귀적으로 호출하여 트리의 모든 노드를 탐색합니다.

---

## Diff 알고리즘

Diff 알고리즘은 이전 VNode와 새 VNode를 재귀적으로 비교해 변경 내용과 대상 노드 정보를 `patches` 배열로 수집합니다. 이 과정에서 상황을 총 5가지 케이스로 분류합니다.

### 5가지 케이스

| 상황 | patch 타입 |
|------|-----------|
| 이전 노드 없음 | `create` |
| 새 노드 없음 | `remove` |
| 태그 타입이 다름 | `replace` |
| 텍스트 내용이 다름 | `text` |
| props가 다름 (같은 타입) | `props` + 자식 재귀 탐색 |

이렇게 분류된 변경 내용은 `patches` 배열에 담기고, `patch(patches)` 함수가 이를 인자로 받아 실제 DOM에 순서대로 반영합니다.

### patches 배열 스펙

```js
{ type: 'create',  parentEl: Node, vNode: VNode }
{ type: 'remove',  el: Node }
{ type: 'replace', el: Node, vNode: VNode }
{ type: 'text',    el: Node, value: string }
{ type: 'props',   el: Node, oldProps: object, newProps: object }
```

---

## 주요 쟁점

### 1. 인덱스 비교 vs key-prop 비교

인덱스 방식은 위치 기준으로 old/new 자식을 짝짓기 때문에, 리스트 순서가 바뀌면 내용이 같아도 전부 replace로 처리된다.

```
인덱스 방식: [A, B, C] → [C, A, B]  →  replace × 3
key-prop 방식: [A, B, C] → [C, A, B]  →  patch 0개
```

이 프로젝트는 `props.key` 값을 기준으로 같은 노드를 찾아 재귀 diff하는 **key-prop 방식**을 사용한다.
매칭되지 않은 old 노드는 `remove`, 매칭 대상 없는 new 노드는 `create`로 처리한다.
key가 없는 노드는 인덱스 순서로 폴백한다.

### 2. MutationObserver — 실제 DOM 변화 감지

diff가 예측한 변경 계획과 브라우저가 실제로 감지한 DOM 변화를 나란히 보여준다.
실제 DOM 감지에는 브라우저 내장 API인 **MutationObserver**를 사용한다.

구현 시 콜백의 비동기 특성으로 인해 변화 목록이 비어있는 타이밍 문제가 있었다.
이를 콜백을 기다리지 않고 큐에 쌓인 레코드를 즉시 꺼내는 방식으로 해결했다.

### 3. VNode가 source of truth

HTML 문자열을 직접 생성하면 Diff에 활용하기 위해 다시 VNode로 변환하는 불필요한 과정이 생긴다.
때문에 **VNode를 먼저 만들고**, 실제 DOM 렌더링과 텍스트 출력 모두 VNode에서 파생시키는 방식을 사용했다.

```
VNode 생성
  ├─ createNode()             → real-area에 실제 DOM으로 렌더링
  ├─ domToVNode()             → diff 기준점 (currentVNode) 으로 사용
  └─ getHtmlStringFromVNode() → test-area에 HTML 텍스트로 표시
```

---

## 테스트케이스 및 엣지케이스

| 구분 | 케이스 |
|------|--------|
| 기본 | 텍스트 변경, props 변경, 노드 추가/제거 |
| 구조 변경 | 태그 타입 교체 (replace), 자식 수 증감 |
| 리스트 | 순서 변경(key 있음 vs 없음), 중간 삽입/삭제 |
| 엣지 | 빈 VNode, null/undefined 노드, void 태그(`<br>`, `<input>` 등) |
| 레벨업 | 스킬/프로젝트/강점/약점 섹션 동적 추가·제거 |


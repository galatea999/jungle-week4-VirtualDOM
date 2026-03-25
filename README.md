# Virtual DOM Diff

> 바닐라 JS로 구현한 Virtual DOM 비교(Diff) 및 패치(Patch) 시스템

팀: 은재 · 정환 · 세인

---

## 프로젝트 개요

React 같은 프레임워크가 내부적으로 사용하는 **Virtual DOM Diff 알고리즘**을 직접 구현합니다.
실제 DOM을 직접 조작하는 대신, JavaScript 객체(VNode)로 UI 상태를 표현하고 변경 전후를 비교해 **최소한의 DOM 조작**만 수행합니다.

---

## 왜 Virtual DOM이 필요한가

실제 DOM은 조작 비용이 크다. 요소 하나를 바꿔도 브라우저는 레이아웃 계산(Reflow)과 화면 다시 그리기(Repaint)를 수행한다.
Virtual DOM은 이 문제를 두 단계로 분리한다:

1. **비교(Diff)**: 이전 VNode와 새 VNode를 JavaScript 레벨에서 재귀적으로 비교해 *무엇이 바뀌었는지* patches 배열로 정리
2. **적용(Patch)**: 계산된 patches만 실제 DOM에 반영 → 불필요한 DOM 조작 최소화

---

## VNode 구조

```js
{
  type: string,    // 태그명. 예) 'div', 'p', 'h2'
  props: object,   // 속성. 예) { class: 'card', id: 'wrap' }
  children: Array  // 자식. 각 요소는 VNode 또는 string(텍스트)
}
```

---

## Diff 알고리즘

두 VNode를 재귀적으로 비교해 patches 배열을 반환한다.

### 5가지 케이스

| 상황 | patch 타입 |
|------|-----------|
| 이전 노드 없음 | `create` |
| 새 노드 없음 | `remove` |
| 태그 타입이 다름 | `replace` |
| 텍스트 내용이 다름 | `text` |
| props가 다름 (같은 타입) | `props` + 자식 재귀 탐색 |

### patches 배열 스펙

```js
{ type: 'create',  parentEl: Node, vNode: VNode }
{ type: 'remove',  el: Node }
{ type: 'replace', el: Node, vNode: VNode }
{ type: 'text',    el: Node, value: string }
{ type: 'props',   el: Node, oldProps: object, newProps: object }
```

### 자식 비교: key-prop 방식

단순 인덱스 기반 비교는 리스트 순서가 바뀌면 모든 노드를 replace로 처리한다.

```
// 인덱스 방식: [A, B, C] → [C, A, B]
// 결과: replace×3 (실제로는 아무것도 안 바뀌었는데)
```

이 프로젝트는 `props.key`를 기준으로 같은 노드를 찾는 **key-prop 방식**을 사용한다.
key가 없는 노드는 인덱스 순서로 폴백한다.

```
// key 방식: [A, B, C] → [C, A, B]  (각 노드에 key 있음)
// 결과: patch 0개 (내용이 같으므로)
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

HTML 문자열을 직접 생성하지 않고 **VNode 객체를 먼저 만든 뒤** DOM과 HTML 문자열을 파생시킨다.

```
VNode → 실제 DOM 렌더링 (real-area)
     → diff 기준점 (currentVNode)
     → HTML 문자열 표시 (test-area)
```

VNode를 원본으로 삼으면 diff 가능, 직렬화 가능, DOM과 독립적으로 테스트 가능하다는 장점이 있다.

### 4. domToVNode의 역할

페이지 로드 시 실제 DOM에서 VNode를 역으로 추출해 diff의 기준점으로 삼는다.
이후 상태 변경이 발생할 때마다 이 VNode와 새 VNode를 비교해 최소 변경 patches를 계산한다.

---

## 테스트케이스 및 엣지케이스

| 구분 | 케이스 |
|------|--------|
| 기본 | 텍스트 변경, props 변경, 노드 추가/제거 |
| 구조 변경 | 태그 타입 교체 (replace), 자식 수 증감 |
| 리스트 | 순서 변경(key 있음 vs 없음), 중간 삽입/삭제 |
| 엣지 | 빈 VNode, null/undefined 노드, void 태그(`<br>`, `<input>` 등) |
| 레벨업 | 스킬/프로젝트/강점/약점 섹션 동적 추가·제거 |


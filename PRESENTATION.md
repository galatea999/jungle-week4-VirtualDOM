# 발표 시나리오 — Virtual DOM Diff

---

## 1. 프로젝트 소개

안녕하세요, 저희 팀은 **Virtual DOM Diff 알고리즘**을 바닐라 자바스크립트로 직접 구현한 프로젝트를 발표하겠습니다.

저희가 이 주제를 선택한 이유는, React나 Vue 같은 프레임워크를 쓸 때 "내부에서 뭔가 효율적으로 DOM을 업데이트한다"는 걸 알면서도 정확히 어떻게 동작하는지 직접 구현해본 적이 없었기 때문입니다.

이 프로젝트에서는 외부 라이브러리 없이, JavaScript 객체로 UI 상태를 표현하고, 변경 전후를 비교해 최소한의 DOM 조작만 수행하는 시스템을 만들었습니다.

팀 구성은 은재, 정환, 세인 세 명이고, 각자 게임 상태 관리, Diff/Patch 로직, UI 렌더링 파이프라인을 분담했습니다.

---

## 2. VDOM 구조와 필요한 이유

### 왜 DOM 직접 조작이 느린가

웹 브라우저에서 DOM 요소를 하나 바꾸면, 단순히 그 값만 바뀌는 게 아닙니다.
브라우저는 변경된 요소를 기준으로 **Reflow**(레이아웃 재계산)와 **Repaint**(화면 다시 그리기)를 수행합니다.
요소가 많을수록, 변경이 잦을수록 이 비용이 쌓입니다.

그래서 나온 아이디어가 **Virtual DOM**입니다.
실제 DOM을 직접 건드리는 대신, 먼저 JavaScript 객체로 UI 상태를 표현합니다.
그 객체를 **VNode**라고 부르고, 구조는 이렇습니다:

```js
{
  type: 'div',
  props: { class: 'card' },
  children: [
    { type: 'h1', props: {}, children: ['김은재'] },
    '텍스트도 그냥 string으로 들어갑니다'
  ]
}
```

type은 HTML 태그 이름, props는 속성 객체, children은 자식 배열입니다.
자식 안에 또 VNode가 들어갈 수 있어서 **재귀 트리 구조**입니다.

이 객체 비교는 DOM 조작보다 훨씬 빠릅니다. JavaScript 레벨에서 그냥 값을 비교하는 거니까요.
결국 "무엇이 바뀌었는지"를 먼저 계산하고, 실제로 바뀐 부분만 DOM에 적용하는 방식입니다.

---

## 3. Diff 알고리즘 설명

### 전체 흐름

Diff 알고리즘은 이전 VNode와 새 VNode를 받아서, "어떤 DOM 조작이 필요한가"를 **patches 배열**로 반환합니다.

```
diff(oldNode, newNode) → patches 배열
patch(patches)         → 실제 DOM 반영
```

patches 배열의 각 항목은 다섯 가지 타입 중 하나입니다:

| 타입 | 의미 |
|------|------|
| `create` | 새 노드를 만들어서 붙여라 |
| `remove` | 이 노드를 제거해라 |
| `replace` | 이 노드를 통째로 교체해라 |
| `text` | 텍스트 내용만 바꿔라 |
| `props` | 속성만 업데이트해라 |

### 재귀 구조

diff는 루트 노드부터 시작해서 자식을 순서대로 비교하고, 그 자식의 자식도 비교합니다.
트리 전체를 깊이 우선으로 내려가는 재귀 함수입니다.

```
diff(root)
 └─ diff(child1)
 │    └─ diff(grandchild)
 └─ diff(child2)
```

중요한 점은, diff 단계에서는 DOM을 건드리지 않는다는 겁니다.
오로지 "무엇이 바뀌어야 하는지"만 계산해서 배열로 모아두고, patch 단계에서 한번에 적용합니다.

### 자식 비교: key-prop 방식

자식 목록을 비교하는 방법에 핵심 설계 결정이 있었습니다. 자세한 내용은 5번 쟁점 파트에서 다루겠습니다.

---

## 4. 시연

*(직접 화면 보여주며 진행)*

### 4-1. 기능 소개

저희 프로젝트는 개발자 성장 게임을 소재로 합니다.
코딩하기, 사이드 프로젝트, CS 공부, 야근 버튼을 눌러서 경험치를 쌓고 레벨업하는 구조입니다.
버튼을 누를 때마다 게임 상태가 바뀌고, 그 상태 변화를 Virtual DOM Diff로 처리합니다.

화면은 세 영역으로 나뉩니다:
- **VDOM 패널**: 현재 VNode를 HTML 형태로 보여주며, 바뀐 줄은 노란색, 새로 추가된 줄은 초록색으로 표시됩니다
- **PATCH 패널**: Diff가 계산한 예상 변경 계획과, 실제 DOM에서 감지된 변화를 나란히 보여줍니다
- **히스토리 패널**: 이전 상태로 되돌리거나 앞으로 이동할 수 있습니다

### 4-2. 초기 렌더링 구조

페이지를 처음 열면 이런 순서로 동작합니다:

```
game.js가 VNode 생성
    → createNode()로 real-area에 실제 DOM 렌더링
    → domToVNode()로 그 DOM을 다시 VNode로 변환 → currentVNode
    → getHtmlStringFromVNode()로 HTML 문자열 변환 → test-area에 표시
```

VNode를 source of truth로 삼고, DOM과 텍스트 출력 모두 VNode에서 파생합니다.

### 4-3. DIFF 계획 vs 실제 DOM 감지

*(버튼 눌러서 보여주기)*

왼쪽 "DIFF 계획"은 diff 알고리즘이 예측한 변경 내용이고,
오른쪽 "실제 DOM 감지"는 브라우저의 MutationObserver API가 실제로 감지한 변화입니다.

두 결과가 일치하면 diff 알고리즘이 정확하게 동작하고 있다는 뜻입니다.
MutationObserver는 뒤에서 자세히 설명하겠습니다.

### 4-4. 히스토리

*(뒤로가기/앞으로가기 보여주기)*

Patch를 적용할 때마다 히스토리가 쌓입니다.
무한정 쌓이면 메모리 문제가 있을 수 있어서 최신 10개까지만 유지합니다.
뒤로가기로 과거 상태로 이동한 뒤 새 Patch를 하면, 그 이후 "미래 히스토리"는 브라우저 히스토리처럼 잘라냅니다.

### 4-5. 레벨업 시 구조 변화

*(레벨업 상황 보여주기)*

레벨이 올라가면 단순히 텍스트만 바뀌는 게 아닙니다.
없던 섹션이 생기고(강점, 프로젝트), 있던 섹션이 사라지기도 합니다(약점).
VDOM 패널에서 초록색으로 추가된 노드들을 확인할 수 있고,
PATCH 패널에서 create/remove 패치가 발생하는 것을 볼 수 있습니다.

### 4-6. 테스트 기능

*(textarea 직접 수정 보여주기)*

test-area에 HTML을 직접 수정하고 Patch 버튼을 누르면,
수정된 HTML을 파싱해서 새 VNode를 만들고 diff를 실행합니다.
이 방식으로 다양한 변경 시나리오를 직접 테스트할 수 있습니다.

---

## 5. 주요 쟁점

### 쟁점 1: 인덱스 비교 방식의 문제점 → key-prop 해결

자식 노드 목록을 비교할 때 가장 단순한 방식은 **인덱스(위치) 기준**으로 짝짓는 겁니다.
첫 번째 old 자식 ↔ 첫 번째 new 자식, 두 번째 ↔ 두 번째, 이런 식으로요.

문제는 리스트 순서가 바뀌면 실제로 내용이 같아도 전부 replace로 처리된다는 겁니다.

```
기존: [A, B, C]
변경: [C, A, B]

인덱스 방식 결과: replace × 3
→ 실제로는 아무 내용도 안 바뀌었는데 DOM 조작 3번 발생
```

저희는 이를 **key-prop 방식**으로 해결했습니다.
각 노드의 `props.key` 값을 기준으로 같은 노드를 찾아 재귀 diff합니다.

구현은 이렇습니다:
1. old 자식들을 `key → { child, domEl }` 맵으로 인덱싱
2. new 자식 순서대로 key로 매칭
3. 매칭된 쌍끼리 재귀 diff → 내용이 같으면 patch 0개
4. 매칭 안 된 old 노드 → `remove`, 매칭 대상 없는 new 노드 → `create`

```
key 방식 결과: patch 0개
→ 노드가 같은 key를 가지고 있으면 이동만 된 것으로 인식
```

key가 없는 노드는 인덱스 순서로 폴백합니다.

### 쟁점 2: MutationObserver — 실제 DOM 변화 감지 원리

MutationObserver는 브라우저가 기본으로 지원하는 Web API입니다.
별도 라이브러리 없이 `new MutationObserver(callback)` 으로 사용할 수 있습니다.

```js
const observer = new MutationObserver(function(mutationList) {
  // DOM이 바뀔 때마다 여기가 실행됩니다
});

observer.observe(targetNode, {
  childList: true,    // 자식 추가/제거 감지
  subtree: true,      // 하위 트리 전체
  attributes: true,   // 속성 변경 감지
  characterData: true // 텍스트 내용 변경 감지
});
```

**여기서 중요한 타이밍 문제가 있었습니다.**

MutationObserver의 콜백은 **비동기**(마이크로태스크)로 실행됩니다.
즉, `patch()`를 호출한 직후 동기 코드가 이어서 실행되는 동안에는 콜백이 아직 실행되지 않아서, mutations 배열이 비어있는 상태입니다.

```js
patch(patches);
// 이 시점에서 domMutations는 비어있음!
updatePatchPanel(patches, domMutations); // ← 실제 DOM 감지가 0개로 표시됨
```

이걸 `takeRecords()` 로 해결했습니다.
이 메서드는 콜백을 기다리지 않고 **큐에 쌓인 레코드를 동기적으로 꺼내옵니다.**

```js
patch(patches);
observer.takeRecords().forEach(function(m) { domMutations.push(m); });
observer.disconnect();
// 이제 domMutations에 실제 변화가 담겨 있음
```

### 쟁점 3: VNode를 source of truth로 삼은 이유

처음에는 HTML 문자열을 직접 생성하는 방식으로 시작했습니다.
하지만 이 방식은 diff를 적용하려면 결국 HTML을 다시 파싱해서 VNode로 변환해야 한다는 문제가 있었습니다.

그래서 **VNode 객체를 원본**으로 삼고, DOM과 HTML 문자열을 모두 VNode에서 파생시키는 구조로 바꿨습니다.

```
VNode → createNode()          → 실제 DOM (real-area)
     → domToVNode()           → currentVNode (diff 기준점)
     → getHtmlStringFromVNode → HTML 문자열 (test-area 표시용)
```

이렇게 하면:
- diff는 항상 VNode끼리 비교하므로 일관성이 유지됩니다
- HTML 파싱 오류 가능성이 없습니다
- VNode는 DOM에 종속되지 않아서 테스트하기 쉽습니다

---

## 6. 테스트케이스 소개 및 엣지케이스

저희가 고려한 테스트케이스는 크게 다섯 범주입니다.

### 기본 변경

가장 기본적인 케이스들입니다:
- 텍스트 내용만 바뀌는 경우 → `text` patch 1개
- class나 id 같은 props만 바뀌는 경우 → `props` patch 1개
- 자식 노드가 추가되는 경우 → `create` patch
- 자식 노드가 제거되는 경우 → `remove` patch

### 구조 변경

- `<div>` 가 `<span>`으로 태그 타입이 바뀌는 경우 → `replace` patch
  - 이때 자식 노드도 함께 통째로 교체됩니다. 타입이 다르면 하위 비교 자체가 의미 없기 때문입니다.

### 리스트 비교

- key가 있는 리스트 순서 변경 → patch 0개 (내용 동일)
- key가 없는 리스트 순서 변경 → 위치 기준으로 비교하여 replace 다수 발생
- 리스트 중간에 항목 삽입/삭제

이 비교를 통해 key 사용의 효과를 직접 확인할 수 있습니다.

### 엣지케이스

- **빈 VNode**: `children: []` 인 경우, 자식 비교 루프가 실행되지 않아야 합니다
- **null/undefined 노드**: oldNode나 newNode가 없는 경우 처리
- **void 태그**: `<br>`, `<img>`, `<input>` 같이 닫는 태그가 없는 태그는 `</br>` 처럼 출력하면 안 되므로 별도로 처리했습니다

### 게임 레벨업 시나리오

레벨업은 단순 텍스트 변경이 아니라 **섹션 자체가 추가되거나 사라지는** 구조 변경이 포함됩니다:
- 레벨 1→2: 프로젝트 섹션 새로 등장 → `create`
- 레벨 1→3: 약점 섹션 사라짐 + 강점 섹션 등장 → `remove` + `create`
- 스킬 목록 항목 추가

이 케이스가 실제 사용 시나리오에서 diff 알고리즘의 정확성을 가장 잘 보여줍니다.

---

이상으로 발표를 마치겠습니다. 감사합니다.

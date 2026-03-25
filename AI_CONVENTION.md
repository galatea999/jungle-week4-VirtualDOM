# AI 규약 (팀 전체 공통 — 모든 AI가 이 규약을 따를 것)

> 은재·정환·세인 세 명이 각자 다른 AI를 사용하기 때문에 코드 통일성을 위해 정한 팀 규약

## 언어

- 코드 내 주석: 한국어
- 변수명·함수명: 영어 camelCase
- console.log 디버그 메시지: 한국어

## 코드 스타일

- 들여쓰기: 스페이스 2칸
- 문자열: 작은따옴표(`''`) 사용
- 세미콜론: 항상 붙임
- 함수 선언: `function` 키워드 사용 (화살표 함수 X — 호이스팅 필요)
  - 단, 콜백·배열 메서드 내부는 화살표 함수 허용

## 네이밍

- VNode 관련 변수: `oldNode` / `newNode` / `vNode` (약어 금지)
- 실제 DOM 관련 변수: `el` / `parentEl` / `realEl`
- patches 배열 아이템: `patch` (단수)
- Boolean 변수: `is~` / `has~` 접두사

## 에러 처리

- 미구현 함수: `throw new Error('미구현: 함수명')`
- 예외 처리: try-catch 사용, catch 블록에 `console.error('설명', error)` 포함

## 금지 사항

- `innerHTML` 직접 조작 금지 (XSS 위험)
- `eval()` 사용 금지
- `var` 사용 금지 (`let` / `const`만 허용)
- 외부 라이브러리 import 금지 (Vanilla JS만)

## AI 행동 규약

- 내 요청 범위를 벗어난 파일은 절대 수정하지 말 것 (은재: 모든 파일 / 정환: diff.js만 / 세인: app.js·index.html만)
- 구현 전에 반드시 입출력 예시를 먼저 보여주고 확인받을 것
- 불확실한 부분은 임의로 결정하지 말고 물어볼 것
- 코드 수정 시 변경된 부분과 이유를 반드시 설명할 것

## 공유 인터페이스 (파일 간 계약 — 절대 변경 금지)

### VNode 구조

```js
{
  type: string,       // 태그명. 예) 'div', 'p', 'h2'
  props: object,      // 속성. 예) { class: 'card', id: 'wrap' }
  children: Array     // 자식. 각 요소는 VNode 또는 string(텍스트)
}
```

### patches 배열 (diff → patch 간 전달)

patches 배열의 각 아이템은 아래 5가지 타입 중 하나:

```js
{ type: 'create',  parentEl: Node, vNode: VNode }
{ type: 'remove',  el: Node }
{ type: 'replace', el: Node, vNode: VNode }
{ type: 'text',    el: Node, value: string }
{ type: 'props',   el: Node, oldProps: object, newProps: object }
```

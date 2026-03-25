// =============================================
// 담당: 은재 | game.js
// 책임: 게임 상태 관리 + 프로필 HTML 생성
// AI 규약 버전: v1.0
// =============================================

// 성장 단계 정의
// hireReward: 취업하기 시 받는 골드
const LEVELS = [
  {
    level: 1,
    levelName: '코딩 첫날',
    levelIcon: '🌱',
    career: 0,
    maxExp: 100,
    hireReward: 0,
    skills: [{ name: 'HTML', stars: 1 }],
    projects: [],
    weaknesses: ['구글링 없이 코드 못 씀', '변수명 전부 a, b, c'],
    strengths: []
  },
  {
    level: 2,
    levelName: '주니어 개발자',
    levelIcon: '💻',
    career: 1,
    maxExp: 200,
    hireReward: 150,
    skills: [
      { name: 'HTML', stars: 2 },
      { name: 'CSS', stars: 2 },
      { name: 'JavaScript', stars: 1 }
    ],
    projects: ['투두리스트'],
    weaknesses: ['변수명 전부 a, b, c'],
    strengths: []
  },
  {
    level: 3,
    levelName: '미드레벨 개발자',
    levelIcon: '🔥',
    career: 3,
    maxExp: 300,
    hireReward: 400,
    skills: [
      { name: 'HTML', stars: 3 },
      { name: 'CSS', stars: 3 },
      { name: 'JavaScript', stars: 3 },
      { name: 'React', stars: 2 },
      { name: 'TypeScript', stars: 1 }
    ],
    projects: ['투두리스트', '날씨 앱'],
    weaknesses: [],
    strengths: ['코드 리뷰 가능']
  },
  {
    level: 4,
    levelName: '시니어 개발자',
    levelIcon: '⚡',
    career: 5,
    maxExp: 500,
    hireReward: 800,
    skills: [
      { name: 'HTML', stars: 4 },
      { name: 'CSS', stars: 4 },
      { name: 'JavaScript', stars: 5 },
      { name: 'React', stars: 4 },
      { name: 'TypeScript', stars: 3 },
      { name: 'Node.js', stars: 3 },
      { name: 'Docker', stars: 2 }
    ],
    projects: ['투두리스트', '날씨 앱', '사내 관리 시스템'],
    weaknesses: [],
    strengths: ['코드 리뷰 가능', '주니어 멘토링']
  },
  {
    level: 5,
    levelName: '테크리드',
    levelIcon: '🏆',
    career: 8,
    maxExp: 999,
    hireReward: 2000,
    skills: [
      { name: 'HTML', stars: 5 },
      { name: 'CSS', stars: 5 },
      { name: 'JavaScript', stars: 5 },
      { name: 'React', stars: 5 },
      { name: 'TypeScript', stars: 5 },
      { name: 'Node.js', stars: 4 },
      { name: 'Docker', stars: 4 },
      { name: 'Kubernetes', stars: 3 },
      { name: '시스템 설계', stars: 3 }
    ],
    projects: ['투두리스트', '날씨 앱', '사내 관리 시스템', '오픈소스 라이브러리'],
    weaknesses: [],
    strengths: ['코드 리뷰 가능', '주니어 멘토링', '기술 의사결정', '장애 대응 리더']
  }
];

// 액션별 골드 비용
const ACTION_COST = {
  coding: 10,
  project: 20,
  study: 15,
  overtime: 30
};

// 게임 상태
let gameState = {
  levelIdx: 0,
  exp: 0,
  gold: 100
};

// 버튼을 눌렀지만 아직 Patch 안 한 상태 여부
let isPendingPatch = false;

// 버튼 누르기 직전 상태 스냅샷 (다른 버튼으로 교체 시 복원용)
let gameStateSnapshot = null;

// 별 표시 문자열 생성
// 예) starsToString(3) → '★★★☆☆'
function starsToString(count) {
  let result = '';

  for (let i = 0; i < 5; i++) {
    result += i < count ? '★' : '☆';
  }

  return result;
}

// 현재 레벨 정보 반환
function getCurrentLevel() {
  return LEVELS[gameState.levelIdx];
}

// 게임 상태 기반 프로필 HTML 생성
function generateProfileHTML() {
  const lvl = getCurrentLevel();
  const exp = gameState.exp;

  // 기술 스택 li 목록
  let skillsHtml = '';
  lvl.skills.forEach((skill) => {
    skillsHtml += '    <li>' + skill.name + ' ' + starsToString(skill.stars) + '</li>\n';
  });

  // 프로젝트 li 목록
  let projectsHtml = '';
  if (lvl.projects.length > 0) {
    projectsHtml += '  <h3>완성한 프로젝트</h3>\n';
    projectsHtml += '  <ul class="projects">\n';
    lvl.projects.forEach((proj) => {
      projectsHtml += '    <li>' + proj + '</li>\n';
    });
    projectsHtml += '  </ul>\n';
  }

  // 약점 li 목록
  let weaknessesHtml = '';
  if (lvl.weaknesses.length > 0) {
    weaknessesHtml += '  <h3>약점</h3>\n';
    weaknessesHtml += '  <ul class="weaknesses">\n';
    lvl.weaknesses.forEach((w) => {
      weaknessesHtml += '    <li class="bad">' + w + '</li>\n';
    });
    weaknessesHtml += '  </ul>\n';
  }

  // 강점 li 목록
  let strengthsHtml = '';
  if (lvl.strengths.length > 0) {
    strengthsHtml += '  <h3>강점</h3>\n';
    strengthsHtml += '  <ul class="strengths">\n';
    lvl.strengths.forEach((s) => {
      strengthsHtml += '    <li class="good">' + s + '</li>\n';
    });
    strengthsHtml += '  </ul>\n';
  }

  let html = '';
  html += '<div class="profile">\n';
  html += '  <h1>김은재</h1>\n';
  html += '  <h2 class="level level-' + lvl.level + '">' + lvl.levelIcon + ' ' + lvl.levelName + '</h2>\n';
  html += '  <p class="career">경력 ' + lvl.career + '년차</p>\n';
  html += '  <p class="gold">💰 ' + gameState.gold + ' G</p>\n';
  html += '  <p class="hire-info">퇴직 보상: ' + lvl.hireReward + ' G</p>\n';
  html += '  <div class="exp-bar">\n';
  html += '    <progress value="' + exp + '" max="' + lvl.maxExp + '"></progress>\n';
  html += '    <span>' + exp + ' / ' + lvl.maxExp + ' EXP</span>\n';
  html += '  </div>\n';
  html += '  <h3>기술 스택</h3>\n';
  html += '  <ul class="skills">\n';
  html += skillsHtml;
  html += '  </ul>\n';
  html += projectsHtml;
  html += weaknessesHtml;
  html += strengthsHtml;
  html += '</div>';

  return html;
}

// 경험치 추가 + 레벨업 체크
function addExp(amount) {
  const lvl = getCurrentLevel();
  gameState.exp += amount;

  // 레벨업 조건: 경험치 달성 + 다음 레벨 존재
  if (gameState.exp >= lvl.maxExp && gameState.levelIdx < LEVELS.length - 1) {
    gameState.levelIdx += 1;
    gameState.exp = 0;
    return true;
  }

  // 최대 레벨이면 경험치 초과 방지
  if (gameState.levelIdx >= LEVELS.length - 1 && gameState.exp > lvl.maxExp) {
    gameState.exp = lvl.maxExp;
  }

  return false;
}

// 패치 대기 상태 해제 (app.js의 onPatchClick에서 호출)
function resetPendingPatch() {
  isPendingPatch = false;
  gameStateSnapshot = null;
}

// 게임 액션 공통 처리
// 스냅샷 복원(필요 시) → 골드 차감 → 확률 판정 → 경험치 추가 → 테스트 영역 갱신
function executeGameAction(expAmount, successRate, actionName, cost) {
  // 이미 패치 대기 중이면 스냅샷으로 복원 후 새 액션으로 교체
  if (isPendingPatch && gameStateSnapshot) {
    gameState.levelIdx = gameStateSnapshot.levelIdx;
    gameState.exp = gameStateSnapshot.exp;
    gameState.gold = gameStateSnapshot.gold;
  }

  // 현재 상태를 스냅샷으로 저장
  gameStateSnapshot = {
    levelIdx: gameState.levelIdx,
    exp: gameState.exp,
    gold: gameState.gold
  };

  // 골드 부족 체크
  if (gameState.gold < cost) {
    console.log(actionName + ' 불가! 골드 부족 (보유: ' + gameState.gold + 'G / 필요: ' + cost + 'G)');
    gameStateSnapshot = null;
    return;
  }

  // 골드 차감 (실패해도 소비)
  gameState.gold -= cost;

  // 확률 판정
  const roll = Math.random() * 100;
  const isSuccess = roll < successRate;

  if (!isSuccess) {
    console.log(actionName + ' 실패! -' + cost + 'G (성공 확률: ' + successRate + '%)');
    updateTestAreaWithGameState();
    isPendingPatch = true;
    return;
  }

  const isLevelUp = addExp(expAmount);
  updateTestAreaWithGameState();
  isPendingPatch = true;

  console.log(actionName + ' 성공! +' + expAmount + ' EXP, -' + cost + 'G (확률: ' + successRate + '%)');

  if (isLevelUp) {
    console.log('레벨업! ' + getCurrentLevel().levelIcon + ' ' + getCurrentLevel().levelName);
  }
}


// 게임 액션: 코딩하기 (+20 EXP, 10G, 성공률 90%)
function onCodingClick() {
  executeGameAction(20, 90, '코딩하기', ACTION_COST.coding);
}

// 게임 액션: 사이드 프로젝트 (+30 EXP, 20G, 성공률 70%)
function onProjectClick() {
  executeGameAction(30, 70, '사이드 프로젝트', ACTION_COST.project);
}

// 게임 액션: CS 공부 (+25 EXP, 15G, 성공률 80%)
function onStudyClick() {
  executeGameAction(25, 80, 'CS 공부', ACTION_COST.study);
}

// 게임 액션: 야근 (+50 EXP, 30G, 성공률 40%)
function onOvertimeClick() {
  executeGameAction(50, 40, '야근', ACTION_COST.overtime);
}

// 취업하기: 현재 레벨 비례 골드 획득 + 1단계로 리셋
function onHireClick() {
  // 패치 대기 중이면 스냅샷으로 복원 후 새 액션으로 교체
  if (isPendingPatch && gameStateSnapshot) {
    gameState.levelIdx = gameStateSnapshot.levelIdx;
    gameState.exp = gameStateSnapshot.exp;
    gameState.gold = gameStateSnapshot.gold;
  }

  // 현재 상태 스냅샷 저장
  gameStateSnapshot = {
    levelIdx: gameState.levelIdx,
    exp: gameState.exp,
    gold: gameState.gold
  };

  const lvl = getCurrentLevel();
  const reward = lvl.hireReward;

  gameState.gold += reward;
  gameState.levelIdx = 0;
  gameState.exp = 0;

  console.log('취업 완료! +' + reward + 'G (보유: ' + gameState.gold + 'G) → 다시 코딩 첫날부터!');

  updateTestAreaWithGameState();
  isPendingPatch = true;
}

// 게임 상태를 테스트 영역에 반영
function updateTestAreaWithGameState() {
  const testArea = document.getElementById('test-area');

  if (!testArea) {
    return;
  }

  testArea.value = generateProfileHTML();
}

// 게임 상태 스냅샷 반환 (히스토리 저장용)
function getGameState() {
  return {
    levelIdx: gameState.levelIdx,
    exp: gameState.exp,
    gold: gameState.gold
  };
}

// 게임 상태 복원 (히스토리 복원용)
function restoreGameState(snapshot) {
  if (!snapshot) {
    return;
  }

  gameState.levelIdx = snapshot.levelIdx;
  gameState.exp = snapshot.exp;
  gameState.gold = snapshot.gold;
}

// 게임 초기화 (app.js의 initializeApp에서 호출)
function initializeGame() {
  gameState = {
    levelIdx: 0,
    exp: 0,
    gold: 100
  };

  return generateProfileHTML();
}

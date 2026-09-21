import {demo} from './playback-demo.js';
export default {id:'design', title:'시작', parameters:{layout:'fullscreen'}};
export const Overview = {name:'디자인 시스템 둘러보기', render() {
  const page = document.createElement('main'); page.className = 'gallery';
  page.innerHTML = `
    <header class="masthead"><a href="#top" class="brand">submeta <span>design</span></a><span class="release-tag">DESIGN SYSTEM · 01</span></header>
    <section class="hero" id="top"><p class="kicker">LESS FRICTION. MORE FOCUS.</p><h1>영상에 집중하고,<br><span>설정은 자연스럽게.</span></h1><p class="lede">같은 원칙, 같은 컴포넌트.<br>실제 제품에 연결된 디자인을 직접 조작해 보세요.</p><div class="hero-links"><a href="#try">재생 설정 체험하기 <span>↗</span></a><a href="#states">상태별 화면 보기 <span>↓</span></a></div></section>
    <section id="try" class="showcase"><div class="section-heading"><div><p class="kicker">01 / IN CONTEXT</p><h2>영상 아래의 작은 도구</h2></div><span class="pill">실제 제품 UI 공유</span></div><div class="lesson"><div class="lesson-art"><div class="lesson-lines"></div><span>PLAYBACK PRESETS</span><strong>한 번 정한 흐름,<br>다음 영상까지.</strong><p>1.25× &nbsp; / &nbsp; 한국어 자막</p><div class="progress-line"></div></div><div id="live-panel"></div><div class="lesson-footer"><span>Submeta 재생 설정</span><span>저장·플레이어 응답은 데모입니다.</span></div></div></section>
    <section class="principles"><article><span>01</span><h3>콘텐츠를 먼저</h3><p>조용한 중립색과 명확한 위계.<br>도구는 필요한 만큼만 드러납니다.</p></article><article><span>02</span><h3>예측 가능한 조작</h3><p>같은 기능은 같은 표현으로.<br>키보드로도 흐름이 이어집니다.</p></article><article><span>03</span><h3>정직한 상태</h3><p>저장 중과 실패를 구분하고,<br>다음에 할 일을 안내합니다.</p></article></section>
    <section id="states"><div class="section-heading"><div><p class="kicker">02 / EVERY STATE MATTERS</p><h2>잘될 때도, 기다릴 때도.</h2></div><p>세 화면 모두 같은 컴포넌트입니다.</p></div><div class="state-stack"><article><div class="state-label"><h3>준비됨</h3><span>READY</span></div><div id="ready-panel"></div></article><article><div class="state-label"><h3>불러오는 중</h3><span>LOADING</span></div><div id="loading-panel"></div></article><article><div class="state-label"><h3>저장 실패</h3><span>ERROR</span></div><div id="error-panel"></div></article></div></section>
    <section class="foundation"><div><p class="kicker">03 / FOUNDATIONS</p><h2>색보다 먼저, 의미.</h2><p>배경·본문·경계·포커스·상태를 이름으로 정의합니다.<br>하나의 원본이 제품과 사례에 함께 적용됩니다.</p></div><div class="swatches"></div></section>
    <section class="theme-section"><div class="section-heading"><div><p class="kicker">04 / SAME RULES, TWO THEMES</p><h2>문맥은 달라도, 규칙은 같게.</h2></div></div><div id="light-panel"></div></section>
    <section class="before-section"><div class="section-heading"><div><p class="kicker">05 / BEFORE</p><h2>출발점도 남겨두었습니다.</h2></div><p>P0에서 촬영한 기존 제품 화면</p></div><details><summary>이전 화면 펼쳐보기</summary><img src="/evidence/p0/desktop.png" alt="디자인 시스템 적용 전 기존 재생 설정 화면" loading="lazy"></details></section>
    <footer class="gallery-footer"><span>Submeta · 디자인의 기준을 실행 가능한 코드로.</span><span>GIF 편집기 적용은 다음 단계입니다.</span></footer>`;
  for (const [id, args] of [['live-panel',{}],['ready-panel',{expanded:true}],['loading-panel',{scenario:'loading'}],['error-panel',{scenario:'error'}],['light-panel',{theme:'light',expanded:true}]]) page.querySelector('#'+id).append(demo(args));
  const labels = {'surface.canvas':'배경','surface.field':'입력','text.primary':'본문','focus.ring':'포커스','status.error':'오류'};
  for (const [key, label] of Object.entries(labels)) {
    const item = document.createElement('div'); item.className = 'swatch';
    const chip = document.createElement('span'); chip.style.background = SubmetaUI.tokens[key];
    const title = document.createElement('strong'); title.textContent = label;
    const value = document.createElement('code'); value.textContent = key;
    item.append(chip,title,value);page.querySelector('.swatches').append(item);
  }
  return page;
}};

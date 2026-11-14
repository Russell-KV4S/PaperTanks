<script lang="ts">
  import { CAMPAIGN_LEVELS } from '../lib/data/levels';
  import { THEMES } from '../lib/data/themes';
  import type { Difficulty } from '../lib/engine/types';
  import { gameStore } from '../lib/stores/gameStore';

  let showCampaignSheet = $state(false);
  let showHowTo = $state(false);
  let skirmishDiff = $state<Difficulty>('medium');

  const theme = $derived(THEMES[$gameStore.themeId]);
  const completedCount = $derived(Object.keys($gameStore.levelGrades).length);
</script>

<div
  class="cover-screen"
  style="background-color: {theme.paperBg}; color: {theme.hudText};"
>
  <!-- Background notebook lines -->
  <div
    class="ruled-bg"
    style="
      background-image: repeating-linear-gradient(
        to bottom,
        transparent,
        transparent 27px,
        {theme.ruleLineColor} 28px
      );
    "
  ></div>
  <div class="margin-line" style="background: {theme.marginLineColor};"></div>
  <div class="holes">
    <span class="hole" style="background: {theme.holePunchColor}; border-color: {theme.holePunchRing};"></span>
    <span class="hole" style="background: {theme.holePunchColor}; border-color: {theme.holePunchRing};"></span>
    <span class="hole" style="background: {theme.holePunchColor}; border-color: {theme.holePunchRing};"></span>
  </div>

  <div class="cover-content">
    <!-- Composition Label Header -->
    <div
      class="label-box"
      style="background: {theme.cardBg}; border-color: {theme.hudText};"
    >
      <div class="era-badge" style="color: {theme.p2Ink};">1986 PENCIL-FLICK ARCADE</div>
      <h1 class="hand-title main-title" style="color: {theme.p1Ink};">PAPER TANKS</h1>
      <p class="subtitle">Fold the sheet. Snap the #2. Leave graphite scars.</p>

      <!-- Hand-drawn SVG tank doodle -->
      <svg class="doodle-tanks" viewBox="0 0 240 54" aria-hidden="true">
        <g stroke={theme.p1Ink} stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <rect x="18" y="20" width="32" height="20" rx="2" />
          <rect x="14" y="16" width="40" height="5" rx="1" />
          <rect x="14" y="39" width="40" height="5" rx="1" />
          <circle cx="34" cy="30" r="6" />
          <line x1="40" y1="30" x2="62" y2="26" stroke-width="3" />
        </g>
        <path
          d="M 68 26 Q 118 14 166 28"
          stroke={theme.graphiteColor}
          stroke-width="2.2"
          stroke-dasharray="5 4"
          fill="none"
        />
        <g stroke={theme.p2Ink} stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <rect x="186" y="20" width="32" height="20" rx="2" />
          <rect x="182" y="16" width="40" height="5" rx="1" />
          <rect x="182" y="39" width="40" height="5" rx="1" />
          <circle cx="202" cy="30" r="6" />
          <line x1="196" y1="30" x2="174" y2="33" stroke-width="3" />
        </g>
      </svg>
    </div>

    {#if !showCampaignSheet && !showHowTo}
      <div class="mode-stack">
        <button
          class="paper-btn primary-btn"
          style="background: {theme.cardBg}; color: {theme.p1Ink};"
          onclick={() => (showCampaignSheet = true)}
        >
          <span class="btn-title">1P STUDY HALL (CAMPAIGN)</span>
          <span class="btn-sub">{completedCount}/10 Periods Graded</span>
        </button>

        <button
          class="paper-btn primary-btn"
          style="background: {theme.cardBg}; color: {theme.p2Ink};"
          onclick={() => gameStore.startPassAndPlay()}
        >
          <span class="btn-title">2P LUNCH TABLE (PASS &amp; PLAY)</span>
          <span class="btn-sub">Face-to-face on one sheet</span>
        </button>

        <div
          class="skirmish-card"
          style="background: {theme.cardBg}; border-color: {theme.hudText};"
        >
          <div class="skirmish-top">
            <span class="btn-title">SKIRMISH (QUICK DUEL)</span>
            <div class="diff-pills">
              {#each ['easy', 'medium', 'hard'] as diff}
                <button
                  class="diff-pill"
                  class:active={skirmishDiff === diff}
                  style="
                    border-color: {theme.p1Ink};
                    background: {skirmishDiff === diff ? theme.p1Ink : 'transparent'};
                    color: {skirmishDiff === diff ? theme.cardBg : theme.p1Ink};
                  "
                  onclick={() => (skirmishDiff = diff as Difficulty)}
                >
                  {diff.toUpperCase()}
                </button>
              {/each}
            </div>
          </div>
          <button
            class="paper-btn launch-skirmish"
            style="background: {theme.paperBg}; color: {theme.hudText};"
            onclick={() => gameStore.startSkirmish(skirmishDiff)}
          >
            DEAL RANDOM SHEET →
          </button>
        </div>

        <div class="bottom-row">
          <button
            class="paper-btn small-btn"
            style="background: {theme.cardBg}; color: {theme.hudAccent};"
            onclick={() => gameStore.setShowSupporterModal(true)}
          >
            ★ THEMES &amp; DECALS
          </button>
          <button
            class="paper-btn small-btn"
            style="background: {theme.cardBg}; color: {theme.hudText};"
            onclick={() => (showHowTo = true)}
          >
            ? HOW TO FLICK
          </button>
        </div>
      </div>
    {:else if showCampaignSheet}
      <div
        class="campaign-sheet"
        style="background: {theme.cardBg}; border-color: {theme.p1Ink};"
      >
        <div class="sheet-header">
          <h2 class="hand-title">STUDY HALL — 10 PERIODS</h2>
          <button
            class="back-chip"
            style="border-color: {theme.hudText}; color: {theme.hudText};"
            onclick={() => (showCampaignSheet = false)}
          >
            ← BACK
          </button>
        </div>

        <div class="level-list">
          {#each CAMPAIGN_LEVELS as lvl}
            {@const unlocked = lvl.id <= $gameStore.highestLevelUnlocked}
            {@const grade = $gameStore.levelGrades[lvl.id]}
            <button
              class="level-row"
              disabled={!unlocked}
              style="
                border-color: {unlocked ? theme.p1Ink : 'rgba(128,128,128,0.3)'};
                color: {unlocked ? theme.hudText : 'rgba(128,128,128,0.6)'};
              "
              onclick={() => gameStore.startCampaignLevel(lvl.id)}
            >
              <div class="lvl-left">
                <span class="lvl-num">P{lvl.id}</span>
                <div>
                  <div class="lvl-name">{lvl.name}</div>
                  <div class="lvl-opp">{lvl.opponent.name}</div>
                </div>
              </div>
              <div class="lvl-right">
                {#if grade}
                  <span class="grade-stamp" style="color: {theme.p2Ink}; border-color: {theme.p2Ink};">
                    {grade}
                  </span>
                {:else if unlocked}
                  <span class="play-tag" style="color: {theme.p1Ink};">PLAY →</span>
                {:else}
                  <span>LOCKED</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {:else if showHowTo}
      <div
        class="campaign-sheet"
        style="background: {theme.cardBg}; border-color: {theme.hudText};"
      >
        <div class="sheet-header">
          <h2 class="hand-title">HOW TO PENCIL-FLICK</h2>
          <button
            class="back-chip"
            style="border-color: {theme.hudText}; color: {theme.hudText};"
            onclick={() => (showHowTo = false)}
          >
            ← BACK
          </button>
        </div>
        <ul class="howto-list">
          <li><strong>1. Pick a Blue Unit:</strong> Tap any Tank, Bunker (2 HP), or Radar Dish on your half.</li>
          <li><strong>2. Pull Back the #2 Pencil:</strong> Drag backward to aim &amp; set flick power (or switch to Direct Flick in Menu).</li>
          <li><strong>3. Snap &amp; Skid:</strong> Release to streak graphite across the paper.</li>
          <li><strong>4. Read the Page:</strong> Light doodles deflect shots. Pink erasers stop lead dead. The center fold crease nudges slow shots!</li>
        </ul>
      </div>
    {/if}
  </div>
</div>

<style>
  .cover-screen {
    position: relative;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    display: flex;
    justify-content: center;
    padding: max(18px, env(safe-area-inset-top)) 16px max(18px, env(safe-area-inset-bottom)) 46px;
  }

  .ruled-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
  }

  .margin-line {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 38px;
    width: 2px;
    pointer-events: none;
  }

  .holes {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    pointer-events: none;
  }

  .hole {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1.5px solid;
  }

  .cover-content {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin: auto 0;
  }

  .label-box {
    border: 2.5px solid;
    border-radius: 10px;
    padding: 14px 16px 10px;
    text-align: center;
    box-shadow: 4px 5px 0 rgba(0, 0, 0, 0.18);
  }

  .era-badge {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  .main-title {
    margin: 4px 0 4px;
    font-size: 34px;
    line-height: 1.05;
    letter-spacing: 0.03em;
  }

  .subtitle {
    margin: 0 0 8px;
    font-size: 12px;
    opacity: 0.85;
  }

  .doodle-tanks {
    width: 100%;
    max-width: 230px;
    height: 48px;
  }

  .mode-stack {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .primary-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    text-align: left;
  }

  .btn-title {
    font-size: 14px;
    font-weight: 800;
  }

  .btn-sub {
    font-size: 11px;
    opacity: 0.8;
    font-weight: 600;
  }

  .skirmish-card {
    border: 2px solid;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.18);
  }

  .skirmish-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .diff-pills {
    display: flex;
    gap: 4px;
  }

  .diff-pill {
    border: 1.5px solid;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 10px;
    font-weight: 800;
  }

  .launch-skirmish {
    padding: 8px 10px;
    font-size: 13px;
  }

  .bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .small-btn {
    font-size: 12px;
    padding: 10px 8px;
  }

  .campaign-sheet {
    border: 2.5px solid;
    border-radius: 10px;
    padding: 14px;
    box-shadow: 4px 5px 0 rgba(0, 0, 0, 0.2);
  }

  .sheet-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .sheet-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .back-chip {
    background: transparent;
    border: 1.8px solid;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 800;
  }

  .level-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
    max-height: 50vh;
    overflow-y: auto;
    padding-right: 2px;
  }

  .level-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1.8px solid;
    border-radius: 6px;
    padding: 8px 10px;
    background: transparent;
    text-align: left;
  }

  .level-row:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .lvl-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .lvl-num {
    font-weight: 900;
    font-size: 13px;
    min-width: 28px;
  }

  .lvl-name {
    font-weight: 800;
    font-size: 13px;
  }

  .lvl-opp {
    font-size: 11px;
    opacity: 0.78;
  }

  .lvl-right {
    font-size: 11px;
    font-weight: 800;
  }

  .grade-stamp {
    border: 2px solid;
    border-radius: 50%;
    padding: 2px 7px;
    font-size: 12px;
    transform: rotate(-8deg);
    display: inline-block;
  }

  .howto-list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 9px;
    font-size: 12.5px;
    line-height: 1.45;
  }
</style>

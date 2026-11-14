<script lang="ts">
  import { BUY_ME_A_COFFEE_CONFIGURED, BUY_ME_A_COFFEE_URL } from '../lib/config';
  import { DECAL_STYLES, THEMES } from '../lib/data/themes';
  import type { DecalStyle, ThemeId } from '../lib/engine/types';
  import { gameStore } from '../lib/stores/gameStore';

  const currentTheme = $derived(THEMES[$gameStore.themeId]);
  const themeList = Object.values(THEMES);

  function pickTheme(id: ThemeId) {
    gameStore.setTheme(id);
  }

  function pickDecal(id: DecalStyle) {
    gameStore.setDecal(id);
  }

  function openTipJar() {
    window.open(BUY_ME_A_COFFEE_URL, '_blank', 'noopener,noreferrer');
  }
</script>

<div class="modal-backdrop" role="dialog" aria-modal="true">
  <div
    class="supporter-card"
    style="background: {currentTheme.cardBg}; color: {currentTheme.hudText}; border-color: {currentTheme.cardBorder};"
  >
    <div class="top-bar">
      <h2 class="hand-title">PAPER, INK &amp; TIP JAR</h2>
      <button
        class="close-btn"
        style="border-color: {currentTheme.hudText}; color: {currentTheme.hudText};"
        onclick={() => gameStore.setShowSupporterModal(false)}
      >
        DONE
      </button>
    </div>

    <div
      class="promo-box"
      style="border-color: {currentTheme.p1Ink}; background: {currentTheme.paperBg};"
    >
      <div class="promo-title hand-title" style="color: {currentTheme.p1Ink};">
        100% FREE — ZERO ADS, ZERO PAYWALLS
      </div>
      <p class="promo-copy">
        Every paper theme, decal set, and game mode is free for everyone. Enjoying Paper Tanks? Optional tips help fuel future updates (no extra perks unlocked).
      </p>
      {#if BUY_ME_A_COFFEE_CONFIGURED}
        <button
          class="paper-btn unlock-btn"
          style="background: {currentTheme.cardBg}; color: {currentTheme.p2Ink};"
          onclick={openTipJar}
        >
          ☕ BUY ME A COFFEE (OPTIONAL TIP)
        </button>
      {:else}
        <div class="tip-hint" style="color: {currentTheme.hudText};">
          Tip jar URL configurable in <code>src/lib/config.ts</code>
        </div>
      {/if}
    </div>

    <div class="section-label">NOTEBOOK PAPER THEME</div>
    <div class="grid-list">
      {#each themeList as t}
        {@const active = $gameStore.themeId === t.id}
        <button
          class="option-tile"
          style="
            border-color: {active ? currentTheme.p1Ink : 'rgba(128,128,128,0.4)'};
            background: {t.paperBg};
            color: {t.hudText};
          "
          onclick={() => pickTheme(t.id)}
        >
          <div class="tile-head">
            <strong>{t.name}</strong>
            {#if active}
              <span class="tag">ACTIVE</span>
            {/if}
          </div>
          <div class="tile-sub">{t.tagline}</div>
          <div class="swatches">
            <span class="dot" style="background: {t.p1Ink};"></span>
            <span class="dot" style="background: {t.p2Ink};"></span>
            <span class="dot" style="background: {t.pencilPaint};"></span>
          </div>
        </button>
      {/each}
    </div>

    <div class="section-label">HAND-DRAWN UNIT DECALS</div>
    <div class="decal-list">
      {#each DECAL_STYLES as d}
        {@const active = $gameStore.decalStyle === d.id}
        <button
          class="decal-row"
          style="
            border-color: {active ? currentTheme.p1Ink : 'rgba(128,128,128,0.35)'};
            color: {currentTheme.hudText};
          "
          onclick={() => pickDecal(d.id)}
        >
          <div>
            <strong>{d.name}</strong>
            <div class="tile-sub">{d.description}</div>
          </div>
          <span class="tag">{active ? 'EQUIPPED' : 'SELECT'}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 18, 25, 0.58);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
    z-index: 40;
  }

  .supporter-card {
    width: 100%;
    max-width: 390px;
    max-height: 88vh;
    overflow-y: auto;
    border: 2.5px solid;
    border-radius: 10px;
    padding: 14px;
    box-shadow: 6px 8px 0 rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .top-bar h2 {
    margin: 0;
    font-size: 19px;
  }

  .close-btn {
    background: transparent;
    border: 1.8px solid;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 12px;
    font-weight: 800;
  }

  .promo-box {
    border: 2px dashed;
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .promo-title {
    font-size: 13.5px;
    font-weight: 900;
  }

  .promo-copy {
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
  }

  .unlock-btn {
    padding: 8px 10px;
    font-size: 12px;
  }

  .tip-hint {
    font-size: 11px;
    opacity: 0.78;
  }

  .section-label {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    opacity: 0.8;
    margin-top: 2px;
  }

  .grid-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .option-tile {
    border: 2px solid;
    border-radius: 7px;
    padding: 9px 10px;
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .tile-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }

  .tile-sub {
    font-size: 11px;
    opacity: 0.8;
  }

  .swatches {
    display: flex;
    gap: 5px;
    margin-top: 3px;
  }

  .dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.25);
  }

  .tag {
    font-size: 10px;
    font-weight: 800;
  }

  .decal-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .decal-row {
    background: transparent;
    border: 1.8px solid;
    border-radius: 6px;
    padding: 8px 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    text-align: left;
    font-size: 12px;
  }
</style>

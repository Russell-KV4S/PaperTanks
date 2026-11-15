<script lang="ts">
  import { THEMES } from '../lib/data/themes';
  import type { MatchStats } from '../lib/engine/types';
  import { gameStore } from '../lib/stores/gameStore';

  interface Props {
    stats: MatchStats;
  }

  let { stats }: Props = $props();

  const theme = $derived(THEMES[$gameStore.themeId]);
  const accuracy = $derived(
    stats.p1Shots > 0 ? Math.round((stats.p1Hits / stats.p1Shots) * 100) : 0
  );
  const canAdvance = $derived(
    stats.mode === 'campaign' &&
      stats.winner === 'p1' &&
      stats.levelId !== undefined &&
      stats.levelId < 10
  );
</script>

<div class="modal-backdrop" role="dialog" aria-modal="true">
  <div
    class="report-card"
    style="background: {theme.cardBg}; color: {theme.hudText}; border-color: {theme.cardBorder};"
  >
    <div
      class="grade-circle hand-title"
      style="color: {theme.p2Ink}; border-color: {theme.p2Ink}; background: {theme.cardBg};"
    >
      {#if stats.mode === 'pass_and_play'}
        {stats.winner === 'p1' ? 'P1' : 'P2'}
      {:else}
        {stats.grade}
      {/if}
    </div>

    <h2 class="hand-title modal-heading">
      {#if stats.mode === 'pass_and_play'}
        {stats.winner === 'p1' ? 'BLUE INK WINS!' : 'RED INK WINS!'}
      {:else if stats.winner === 'p1'}
        PAGE CLEARED!
      {:else}
        PAPER CRUMPLED!
      {/if}
    </h2>

    <p class="teacher-note hand-title" style="color: {theme.p2Ink};">
      "{stats.mode === 'pass_and_play'
        ? 'Lunch bell rings! Flip the sheet for a rematch.'
        : stats.teacherNote}"
    </p>

    <div class="stats-grid">
      <div class="stat-row">
        <span>Blue Shots / Hits</span>
        <strong>{stats.p1Shots} / {stats.p1Hits} ({accuracy}%)</strong>
      </div>
      <div class="stat-row">
        <span>Red Shots / Hits</span>
        <strong>{stats.p2Shots} / {stats.p2Hits}</strong>
      </div>
      <div class="stat-row">
        <span>Blue Surviving</span>
        <strong>{stats.p1Remaining} / {stats.p1Total}</strong>
      </div>
    </div>

    <div class="modal-actions">
      {#if canAdvance && stats.levelId}
        <button
          class="paper-btn"
          style="background: {theme.paperBg}; color: {theme.p1Ink};"
          onclick={() => gameStore.startCampaignLevel(stats.levelId! + 1)}
        >
          NEXT PERIOD (STAGE {stats.levelId + 1}) →
        </button>
      {/if}

      <button
        class="paper-btn"
        style="background: {theme.paperBg}; color: {theme.hudText};"
        onclick={() => gameStore.restartMatch()}
      >
        REMATCH ON FRESH PAPER
      </button>

      <button
        class="paper-btn"
        style="background: {theme.paperBg}; color: {theme.p2Ink};"
        onclick={() => gameStore.returnToTitle()}
      >
        BACK TO NOTEBOOK COVER
      </button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 18, 25, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 30;
  }

  .report-card {
    position: relative;
    width: 100%;
    max-width: 350px;
    border: 2.5px solid;
    border-radius: 10px;
    padding: 22px 18px 18px;
    box-shadow: 6px 8px 0 rgba(0, 0, 0, 0.28);
  }

  .grade-circle {
    position: absolute;
    top: -16px;
    right: 14px;
    width: 64px;
    height: 64px;
    border: 3.5px solid;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 900;
    transform: rotate(-12deg);
    box-shadow: 2px 3px 0 rgba(0, 0, 0, 0.16);
  }

  .modal-heading {
    margin: 0 48px 6px 0;
    font-size: 22px;
  }

  .teacher-note {
    margin: 0 0 14px;
    font-size: 13px;
    line-height: 1.35;
  }

  .stats-grid {
    border-top: 1.5px dashed rgba(128, 128, 128, 0.45);
    border-bottom: 1.5px dashed rgba(128, 128, 128, 0.45);
    padding: 8px 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
  }

  .modal-actions {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 16px;
  }
</style>

<template>
  <div class="title-bar">
    <div class="title-bar-drag">
      <span class="app-title">PlantMarker</span>
    </div>
    <div class="title-bar-controls">
      <button class="control-btn" @click="minimize" title="最小化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="2" y1="6" x2="10" y2="6" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
      <button class="control-btn" @click="maximize" title="最大化">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
      <button class="control-btn close" @click="close" title="关闭">
        <svg width="12" height="12" viewBox="0 0 12 12">
          <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5" />
          <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
function minimize() {
  window.electronAPI.minimize()
}

function maximize() {
  window.electronAPI.maximize()
}

function close() {
  window.electronAPI.close()
}
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  background: #151528;
  border-bottom: 1px solid #2a2a4a;
  -webkit-app-region: drag;
  user-select: none;
}

.title-bar-drag {
  flex: 1;
  padding-left: 12px;
}

.app-title {
  font-size: 12px;
  color: #888;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.title-bar-controls {
  display: flex;
  -webkit-app-region: no-drag;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 32px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;
}

.control-btn:hover {
  background: #2a2a4a;
  color: #ddd;
}

.control-btn.close:hover {
  background: #c42b1c;
  color: #fff;
}
</style>

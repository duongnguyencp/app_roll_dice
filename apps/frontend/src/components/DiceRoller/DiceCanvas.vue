<template>
  <div class="dice-canvas-wrap" data-testid="dice-canvas-wrap">
    <div ref="container" class="dice-canvas"></div>

    <!-- Rolled-face overlay: visible after animation completes -->
    <Transition name="result-pop">
      <div
        v-if="showOverlay && props.rolledFace !== null"
        class="dice-result-overlay"
        data-testid="dice-result-number"
      >
        <span class="dice-result-badge">{{ props.rolledFace }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'

const props = defineProps<{ rolling: boolean; rolledFace: number | null }>()
const emit = defineEmits<{ animationDone: [] }>()

// Show the number overlay once animation is done
const showOverlay = ref(false)

const container = ref<HTMLDivElement>()

let renderer: THREE.WebGLRenderer
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let cube: THREE.Mesh
let animFrameId: number
let rollStart = 0
const ROLL_DURATION = 2200 // ms
// Local flag: true from when rolling starts until animation completes.
// We cannot rely on props.rolling because the parent sets it false when the API
// returns (which is much faster than the 2200ms animation).
let isAnimatingRoll = false

// Smooth settle-to-face after roll
let settleStart = 0
const SETTLE_DURATION = 600 // ms
let settleFrom = new THREE.Euler()
let settleTo = new THREE.Euler()
let settling = false

// Face N → Euler rotation so that face N points toward camera (+Z)
// BoxGeometry face order: +X(0), -X(1), +Y(2), -Y(3), +Z(4), -Z(5)
// Materials: [face1, face2, face3, face4, face5, face6] → indices 0-5
const FACE_ROTATIONS: Record<number, [number, number, number]> = {
  1: [0, -Math.PI / 2, 0],          // +X face → face camera
  2: [0,  Math.PI / 2, 0],          // -X face → face camera
  3: [-Math.PI / 2, 0, 0],          // +Y face → face camera
  4: [ Math.PI / 2, 0, 0],          // -Y face → face camera
  5: [0, 0, 0],                      // +Z face → already facing camera
  6: [0, Math.PI, 0],               // -Z face → face camera
}

function targetRotationForFace(face: number): THREE.Euler {
  const r = FACE_ROTATIONS[face]
  if (r) return new THREE.Euler(r[0], r[1], r[2])
  // For face > 6: keep current rotation, just settle visually
  return new THREE.Euler(cube.rotation.x, cube.rotation.y, cube.rotation.z)
}

function init() {
  const el = container.value!
  // Fallback dimensions for headless/JSDOM environments where clientWidth = 0
  const w = el.clientWidth || 400
  const h = el.clientHeight || 280

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0f0f1a)

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100)
  camera.position.set(0, 0, 5)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(w, h)
  renderer.setPixelRatio(window.devicePixelRatio)
  el.appendChild(renderer.domElement)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xa855f7, 1.2)
  dir.position.set(3, 5, 3)
  scene.add(dir)
  const dir2 = new THREE.DirectionalLight(0x7c3aed, 0.8)
  dir2.position.set(-3, -2, -3)
  scene.add(dir2)

  // Dice geometry
  const geo = new THREE.BoxGeometry(1.8, 1.8, 1.8, 1, 1, 1)

  // Face textures
  const materials = [1, 2, 3, 4, 5, 6].map((n) => {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 256

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, 256, 256)

    // Border
    ctx.strokeStyle = '#7c3aed'
    ctx.lineWidth = 8
    ctx.strokeRect(4, 4, 248, 248)

    // Number
    ctx.fillStyle = '#e2e8f0'
    ctx.font = 'bold 120px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(n), 128, 128)

    return new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(canvas) })
  })

  cube = new THREE.Mesh(geo, materials)
  scene.add(cube)

  animate(0)
}

let idleAngle = 0

function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
function lerpEuler(from: THREE.Euler, to: THREE.Euler, t: number): THREE.Euler {
  return new THREE.Euler(
    from.x + (to.x - from.x) * t,
    from.y + (to.y - from.y) * t,
    from.z + (to.z - from.z) * t,
  )
}

function animate(time: number) {
  animFrameId = requestAnimationFrame(animate)

  if (isAnimatingRoll && rollStart > 0) {
    const elapsed = time - rollStart
    const progress = Math.min(elapsed / ROLL_DURATION, 1)
    const eased = easeOutCubic(progress)
    const speed = (1 - eased) * 0.2 + 0.002
    cube.rotation.x += speed * 12
    cube.rotation.y += speed * 9
    cube.rotation.z += speed * 6

    if (progress >= 1) {
      rollStart = 0
      isAnimatingRoll = false
      emit('animationDone')
    }
  } else if (settling && settleStart > 0) {
    const elapsed = time - settleStart
    const t = Math.min(elapsed / SETTLE_DURATION, 1)
    const eased = easeOutCubic(t)
    const r = lerpEuler(settleFrom, settleTo, eased)
    cube.rotation.set(r.x, r.y, r.z)
    if (t >= 1) {
      settling = false
      showOverlay.value = true
    }
  } else if (!settling && !isAnimatingRoll) {
    // Idle gentle rotation
    idleAngle += 0.005
    cube.rotation.x = Math.sin(idleAngle * 0.7) * 0.3
    cube.rotation.y = idleAngle
  }

  renderer.render(scene, camera)
}

watch(
  () => props.rolling,
  (val) => {
    if (val) {
      rollStart = performance.now()
      isAnimatingRoll = true
      showOverlay.value = false
      settling = false
    }
  }
)

watch(
  () => props.rolledFace,
  (face) => {
    if (face !== null && !props.rolling && cube) {
      // Trigger settle-to-face tween
      settleFrom = new THREE.Euler(cube.rotation.x, cube.rotation.y, cube.rotation.z)
      settleTo = targetRotationForFace(face)
      settleStart = performance.now()
      settling = true
      showOverlay.value = false
    }
    if (face === null) {
      showOverlay.value = false
      settling = false
    }
  }
)

function onResize() {
  if (!container.value) return
  const w = container.value.clientWidth || 400
  const h = container.value.clientHeight || 280
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  init()
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animFrameId)
  renderer.dispose()
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped>
.dice-canvas-wrap {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
}
.dice-canvas {
  width: 100%;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
}

/* Overlay badge */
.dice-result-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.dice-result-badge {
  background: rgba(124, 58, 237, 0.92);
  border: 3px solid #a855f7;
  border-radius: 50%;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 900;
  color: #fff;
  box-shadow: 0 0 32px rgba(168, 85, 247, 0.8), 0 0 8px rgba(0,0,0,0.6);
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
}

/* Transition */
.result-pop-enter-active  { transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.result-pop-leave-active  { transition: all 0.2s ease-in; }
.result-pop-enter-from    { opacity: 0; transform: scale(0.4); }
.result-pop-leave-to      { opacity: 0; transform: scale(0.4); }
</style>

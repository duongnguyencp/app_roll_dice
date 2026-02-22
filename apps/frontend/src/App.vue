<template>
  <nav class="nav">
    <div class="container nav-inner">
      <RouterLink to="/" class="nav-brand">🎲 Dice Reward</RouterLink>
      <div class="nav-links">
        <RouterLink to="/" class="nav-link">Gieo xúc xắc</RouterLink>
        <RouterLink to="/history" class="nav-link">Lịch sử</RouterLink>
        <RouterLink to="/manage" class="nav-link">Quản lý</RouterLink>
      </div>
    </div>
  </nav>

  <main class="container">
    <RouterView />
  </main>
</template>

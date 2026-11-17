/**
 * assets.config.js
 * Cấu hình đường dẫn tài nguyên hình ảnh cho 9 chế độ trò chơi làm bài tập.
 *
 * Quy tắc:
 * - Khai báo đường dẫn tĩnh tới thư mục `public/assets/modes/<mode>/`.
 * - Khi có file ảnh thật đặt đúng đường dẫn, <GameSprite> sẽ hiển thị ảnh thật.
 * - Khi chưa có file ảnh (404 hoặc không tìm thấy), <GameSprite> tự động render
 *   fallback SVG/CSS tương ứng, hoàn toàn không gây lỗi giao diện.
 */

export const GAME_ASSETS = {
  // 1. Đua xe (Lớp 3)
  race: {
    bg: '/assets/modes/race/bg.png',
    carRed: '/assets/modes/race/car-red.png',
    carBlue: '/assets/modes/race/car-blue.png',
    carGreen: '/assets/modes/race/car-green.png',
    carOrange: '/assets/modes/race/car-orange.png',
    finishFlag: '/assets/modes/race/finish-flag.png',
    trophy: '/assets/modes/race/trophy.png',
  },

  // 2. Leo tháp (Lớp 1)
  tower: {
    bg: '/assets/modes/tower/waterfall-bg.png',
    hero: '/assets/modes/tower/dino-climb.png',
    heroHappy: '/assets/modes/tower/dino-happy.png',
    heroSad: '/assets/modes/tower/dino-sad.png',
    lock: '/assets/modes/tower/lock.png',
    flag: '/assets/modes/tower/flag.png',
  },

  // 3. Hái quả (Lớp 2)
  fruit: {
    bg: '/assets/modes/fruit/tree-bg.png',
    hero: '/assets/modes/fruit/squirrel-climb.png',
    heroHappy: '/assets/modes/fruit/squirrel-happy.png',
    heroSad: '/assets/modes/fruit/squirrel-sad.png',
    apple: '/assets/modes/fruit/apple.png',
    flag: '/assets/modes/fruit/flag.png',
  },

  // 4. Săn kho báu (Lớp 4)
  treasure: {
    bg: '/assets/modes/treasure/map-bg.png',
    chestClosed: '/assets/modes/treasure/chest-closed.png',
    chestOpen: '/assets/modes/treasure/chest-open.png',
    key: '/assets/modes/treasure/key.png',
    coin: '/assets/modes/treasure/coin.png',
  },

  // 5. Du hành vũ trụ (Lớp 5)
  space: {
    bg: '/assets/modes/space/space-bg.png',
    rocket: '/assets/modes/space/rocket.png',
    astronaut: '/assets/modes/space/astronaut.png',
    planet1: '/assets/modes/space/planet-1.png',
    planet2: '/assets/modes/space/planet-2.png',
  },

  // 6. Chuỗi lửa (Lớp 6)
  streak: {
    bg: '/assets/modes/streak/lava-bg.png',
    flameLow: '/assets/modes/streak/flame-low.png',
    flameMed: '/assets/modes/streak/flame-med.png',
    flameMax: '/assets/modes/streak/flame-max.png',
  },

  // 7. Đánh trùm (Lớp 7)
  boss: {
    bg: '/assets/modes/boss/dungeon-bg.png',
    dragon: '/assets/modes/boss/dragon.png',
    knight: '/assets/modes/boss/knight.png',
    knightAttack: '/assets/modes/boss/knight-attack.png',
  },

  // 8. Chinh phục bản đồ (Lớp 8)
  map: {
    bg: '/assets/modes/map/island-bg.png',
    compass: '/assets/modes/map/compass.png',
    flag: '/assets/modes/map/flag.png',
  },

  // 9. Vượt tốc (Lớp 9)
  speed: {
    bg: '/assets/modes/speed/speed-bg.png',
    speedometer: '/assets/modes/speed/speedometer.png',
    lightning: '/assets/modes/speed/lightning.png',
  },
};

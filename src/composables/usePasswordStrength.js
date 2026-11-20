import { computed } from "vue";

/**
 * Composable tính toán độ mạnh mật khẩu theo 4 tiêu chí realtime
 * @param {import('vue').Ref<string>} passwordRef Ref mật khẩu
 */
export function usePasswordStrength(passwordRef) {
  const criteria = computed(() => {
    const pwd = passwordRef.value || "";
    return {
      hasLength: pwd.length >= 8,
      hasUpperAndLower: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(pwd),
    };
  });

  // Điểm số từ 0 đến 4
  const score = computed(() => {
    const pwd = passwordRef.value || "";
    if (!pwd) return 0;
    if (pwd.length < 6) return 1;

    let points = 0;
    if (criteria.value.hasLength) points++;
    if (criteria.value.hasUpperAndLower) points++;
    if (criteria.value.hasNumber) points++;
    if (criteria.value.hasSpecial) points++;

    return Math.max(1, points);
  });

  // Nhãn hiển thị độ mạnh
  const label = computed(() => {
    const pwd = passwordRef.value || "";
    if (!pwd) return "Chưa nhập";
    switch (score.value) {
      case 1:
        return "Yếu";
      case 2:
        return "Trung bình";
      case 3:
        return "Khá mạnh";
      case 4:
        return "Mạnh";
      default:
        return "Yếu";
    }
  });

  // Màu sắc tương ứng theo thiết kế
  const color = computed(() => {
    const pwd = passwordRef.value || "";
    if (!pwd) return "#CBD5E1";
    switch (score.value) {
      case 1:
        return "#D93F3F"; // Đỏ (Yếu)
      case 2:
        return "#FFB84D"; // Cam (Trung bình)
      case 3:
        return "#2E9E6B"; // Xanh lá (Khá mạnh)
      case 4:
        return "#1B5F7B"; // Xanh đậm teal (Mạnh)
      default:
        return "#D93F3F";
    }
  });

  // Kiểm tra tính hợp lệ tối thiểu để submit (ít nhất 6 ký tự)
  const isValid = computed(() => {
    const pwd = passwordRef.value || "";
    return pwd.length >= 6;
  });

  return {
    criteria,
    score,
    label,
    color,
    isValid,
  };
}

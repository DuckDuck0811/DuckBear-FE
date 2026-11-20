import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import "vuetify/styles";

/**
 * Cấu hình theme Vuetify cho DuckBear (Light + Dark)
 * Màu theo thiết kế:
 * - primary: #22708F (Teal đậm thương hiệu)
 * - secondary: #2F7BF5 (Xanh dương)
 * - accent: #FFB84D (Vàng cam)
 * - success: #2E9E6B (Xanh lá)
 * - error: #D93F3F (Đỏ)
 */
export const duckbearLight = {
  dark: false,
  colors: {
    primary: "#22708F",
    secondary: "#2F7BF5",
    accent: "#FFB84D",
    success: "#2E9E6B",
    warning: "#FFB84D",
    error: "#D93F3F",
    info: "#2F7BF5",
    background: "#F4F8FA",
    surface: "#FFFFFF",
    "on-background": "#1D2939",
    "on-surface": "#1D2939",
    "on-primary": "#FFFFFF",
    "on-secondary": "#FFFFFF",
    // Bổ sung màu mở rộng cho các badge
    orange: "#FF9F43",
    yellow: "#FFC83D",
    green: "#2BC48A",
    pink: "#FF6B9A",
    purple: "#7C5CFC",
    cyan: "#00C7E6",
  },
};

export const duckbearDark = {
  dark: true,
  colors: {
    primary: "#3DA4C9",
    secondary: "#4E8FFF",
    accent: "#FFC266",
    success: "#38B27B",
    warning: "#FFC266",
    error: "#E85B5B",
    info: "#4E8FFF",
    background: "#0E1821",
    surface: "#172430",
    "on-background": "#EDF2F7",
    "on-surface": "#EDF2F7",
    "on-primary": "#FFFFFF",
    "on-secondary": "#FFFFFF",
    orange: "#FFB066",
    yellow: "#FFD566",
    green: "#38B27B",
    pink: "#FF8AB2",
    purple: "#987EFC",
    cyan: "#33D4EB",
  },
};

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "duckbearLight",
    themes: {
      duckbearLight,
      duckbearDark,
    },
  },
  defaults: {
    VBtn: {
      rounded: "pill",
      elevation: 0,
      class: "text-none font-weight-bold",
    },
    VCard: {
      rounded: "xl",
      elevation: 0,
    },
    VTextField: {
      variant: "outlined",
      rounded: "xl",
      density: "comfortable",
      color: "primary",
    },
    VSelect: {
      variant: "outlined",
      rounded: "lg",
      density: "comfortable",
      color: "primary",
    },
    VTextarea: {
      variant: "outlined",
      rounded: "lg",
      density: "comfortable",
      color: "primary",
    },
    VChip: {
      rounded: "pill",
    },
    VDialog: {
      rounded: "xl",
    },
    VExpansionPanels: {
      rounded: "xl",
      elevation: 0,
    },
    VAlert: {
      rounded: "xl",
    },
  },
});

export default vuetify;

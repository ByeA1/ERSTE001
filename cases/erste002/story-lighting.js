const light = (position, target, intensity, angle, color = "#ffffff") => ({
  position,
  target,
  intensity,
  angle,
  color,
});

export const LIGHT_NAMES = ["key", "fill", "rim", "focus"];
const off = light([0.2, 0.14, 0.12], [0, 0, 0], 0, 24);

export const LIGHT_PRESETS = {
  Studio: {
    ambient: 1.1,
    lights: {
      key: light([-0.35, 0.55, 0.43], [0, 0, 0], 5.2, 44, "#fff7ee"),
      fill: light([0.36, 0.25, 0.27], [0, 0, 0], 2.3, 49, "#eaf1ff"),
      rim: light([0.26, 0.35, -0.4], [0, 0, 0], 4.9, 43),
      focus: off,
    },
  },
  Ergonomics: {
    ambient: 0.85,
    lights: {
      key: light([0.32, 0.2, 0.25], [0, 0, 0.05], 5.4, 42, "#fff5eb"),
      fill: light([-0.32, 0.15, 0.32], [0, 0, 0.02], 2.8, 46, "#e5efff"),
      rim: light([-0.24, 0.36, -0.3], [0, 0, -0.035], 5.1, 42),
      focus: off,
    },
  },
  Assembly: {
    ambient: 1.45,
    lights: {
      key: light([-0.32, 0.52, 0.46], [0, 0.05, 0], 5.5, 53),
      fill: light([0.42, -0.26, 0.3], [0, 0.04, 0], 4.2, 49, "#eaf2ff"),
      rim: light([0.27, 0.3, -0.42], [0, 0.04, 0], 6, 48),
      focus: off,
    },
  },
  Structural: {
    ambient: 0.43,
    lights: {
      key: light([0.28, 0.27, 0.25], [0, 0.05, 0], 1.7, 49),
      fill: light([-0.21, -0.23, 0.32], [0, 0.04, 0], 1.65, 50, "#eaf1ff"),
      rim: light([-0.26, 0.16, -0.33], [0, 0.05, 0], 1.6, 45),
      focus: light([0.23, -0.1, 0.15], [0, 0.05, 0], 5.2, 24),
    },
  },
};

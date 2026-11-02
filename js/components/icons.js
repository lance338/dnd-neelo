/** Inline UI icons (stroke style, currentColor). */
const s = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

export const Icons = {
  back: s('<path d="M15 5l-7 7 7 7"/>'),
  replay: s('<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>'),
  sound: s('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>'),
  mute: s('<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M17 9l5 6M22 9l-5 6"/>'),
  sliders: s('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  play: '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M7 4l13 8-13 8z" fill="currentColor"/></svg>',
  star: `<svg viewBox="0 0 48 48"><path d="M24 3l6.2 13.3 14.6 1.8-10.8 10 2.9 14.4L24 35.4 11.1 42.5 14 28.1 3.2 18.1l14.6-1.8z" fill="#FFD84A" stroke="#E8912E" stroke-width="3" stroke-linejoin="round"/><path d="M17 17l3-1" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>`,
};

// A short confetti celebration in the brand colours. Skipped for people who ask their device for less motion.
export async function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const { default: confetti } = await import("canvas-confetti"); // loaded only when it is needed
  const colors = ["#0f766e", "#f97316", "#14b8a6", "#fdba74"];
  const end = Date.now() + 1500;

  // Two streams from the bottom corners, aimed at the middle
  const burst = () => {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors });
    if (Date.now() < end) requestAnimationFrame(burst);
  };
  burst();
}

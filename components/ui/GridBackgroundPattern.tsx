export default function GridBackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--c-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--c-border) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--c-bg)] via-transparent to-[var(--c-bg)]" />
    </div>
  );
}

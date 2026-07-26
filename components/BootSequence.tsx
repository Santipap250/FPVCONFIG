export default function BootSequence() {
  return (
    <div className="boot-overlay" aria-hidden="true">
      <div className="boot-scanline" />
      <div className="boot-lines font-hud">
        <p className="boot-line boot-line-1">OBIXCONFIG // SYSTEM BOOT</p>
        <p className="boot-line boot-line-2">SENSORS.......... OK</p>
        <p className="boot-line boot-line-3">TELEMETRY LINK.... ESTABLISHED</p>
        <p className="boot-line boot-line-4">6 INSTRUMENTS..... ONLINE</p>
      </div>
    </div>
  );
}

export default function AnimatedBackground() {
  return (
    <div aria-hidden="true" className="app-background">
      <div className="app-background__aurora app-background__aurora--green" />
      <div className="app-background__aurora app-background__aurora--violet" />
      <div className="app-background__aurora app-background__aurora--cyan" />
      <div className="app-background__aurora app-background__aurora--amber" />

      <div className="app-background__mesh" />
      <div className="app-background__grid" />
      <div className="app-background__scan" />
      <div className="app-background__noise" />
      <div className="app-background__vignette" />

      <span className="app-background__orb app-background__orb--one" />
      <span className="app-background__orb app-background__orb--two" />
      <span className="app-background__orb app-background__orb--three" />
      <span className="app-background__orb app-background__orb--four" />
    </div>
  );
}

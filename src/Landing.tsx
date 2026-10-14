import "./landing.css";
export default function Landing() {
  return (
    <div className="landing">
      <main>
        <div className="truck-scene">
          <img
            src="/coffee-truck.png"
            alt="Minimalist Coffee Truck"
            fetchPriority="high"
          />
          <div className="road">
            <div>
              {Array.from({ length: 20 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
          </div>
        </div>
        <div className="landing-copy">
          <h1>Busy Brewing ...</h1>
          <p>Chasing the perfect shot.</p>
          <div className="coming">
            <hr />
            <span>Coming to your neighborhood soon</span>
          </div>
        </div>
      </main>
      <div className="paper" />
    </div>
  );
}

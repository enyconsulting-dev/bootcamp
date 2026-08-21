"use client";

import { useEffect, useState } from "react";

const earlyBirdDeadline = new Date("2026-09-03T23:59:00+01:00").getTime();

function getTimeLeft() {
  const distance = Math.max(0, earlyBirdDeadline - Date.now());
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1_000) % 60),
    closed: distance === 0,
  };
}

function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (timeLeft.closed) {
    return <p className="countdown-closed">Enrollment closed</p>;
  }

  return (
    <div className="countdown" aria-label="Time remaining until early-bird pricing ends">
      {[
        [timeLeft.days, "days"],
        [timeLeft.hours, "hours"],
        [timeLeft.minutes, "minutes"],
        [timeLeft.seconds, "seconds"],
      ].map(([value, label]) => (
        <span className="countdown-unit" key={label}>
          <strong>{String(value).padStart(2, "0")}</strong>
          <small>{label}</small>
        </span>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Enrollment is open <span /> Kickoff: Sept 5 <span /> Classes: Sept 7</p>
          <div className="hero-copy">
            <p className="kicker">The 30-Day Consulting Offer Bootcamp</p>
            <h1>You have the expertise. <em>You&apos;re just missing the offer.</em></h1>
            <p className="hero-lede">In 30 days, package what you know into a consulting offer that lands real clients, with a system, a community, and a coach holding you accountable every step.</p>
            <p className="urgency">Early-bird enrollment closes September 3rd. Don&apos;t pay more than you have to.</p>
            <div className="timer-panel">
              <p>Early-bird price ends in <span>WAT</span></p>
              <Countdown />
            </div>
            <a className="cta" href="#enrollment">Enroll now <span>Claim your early-bird spot</span></a>
            <p className="microcopy">Choose your currency at checkout: USD $47 or NGN ₦25,000</p>
          </div>
          <blockquote>&ldquo;$12,000 client. Week 5.&rdquo;<cite>Bootcamp graduate</cite></blockquote>
        </div>
        <div className="trust-strip"><span>100,000+ professionals trained</span><span>90+ countries</span><span>95% land a client within 90 days</span></div>
      </section>

      <section className="video-section">
        <div className="section-heading"><p className="section-label">A message from Eno</p><h2>Before you read another word, watch this first.</h2><p>Three minutes to understand who this is for, what you&apos;ll walk away with, and why now is the moment to stop waiting.</p></div>
        <div className="video-placeholder" role="img" aria-label="Video placeholder"><div className="play-button">▶</div><p>Welcome to the bootcamp</p><small>Video embed coming in Phase 2</small></div>
      </section>

      <section className="next-section" id="enrollment"><p className="section-label">Phase 1 foundation</p><h2>The offer comes next.</h2><p>The page foundation is live. Phase 2 will add the complete curriculum, testimonials, instructor profiles, pricing checkout, guarantee, FAQ, and closing CTA once the founder placeholders and payment links are confirmed.</p></section>
    </main>
  );
}

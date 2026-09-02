"use client";

import { FormEvent, useEffect, useState } from "react";

const enrollmentDate = new Date("2026-09-15T00:00:00+01:00").getTime();
const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const weeks: [string, string, string, string, string, string[]][] = [
  ["01", "POSITION", "Days 1-7", "Positioning Statement + Problem Set", "Stop thinking like an employee and start thinking like a consultant. Define the expertise you are monetizing, the client with the expensive problem, and the statement that makes the right person say: this is exactly what I need.", ["Consulting mindset shift", "Niche and ideal client definition", "Decision-maker problems", "Your first positioning statement draft"]],
  ["02", "PACKAGE", "Days 8-14", "One-Page Consulting Offer", "Turn your expertise into a defined consulting service with a clear scope, a specific promise, and a price built for ROI rather than what feels safe.", ["Packaged service design", "Outcome-based scope", "Value pricing versus hourly", "Offer statement and one-page build"]],
  ["03", "VALIDATE", "Days 15-21", "10-15 Conversations + Revised Offer", "Find out if real people will pay before you spend on ads or outreach. Run structured validation conversations, read genuine signals, and refine from evidence.", ["Market conversation versus sales call", "Who to approach and how", "The 7-question script", "Reading signals and refining"]],
  ["04", "PROVE & PITCH", "Days 22-30", "3-Minute Offer Pitch Delivered Live", "Rebuild your LinkedIn profile around your consulting offer, then deliver your three-minute pitch live with direct feedback before taking it to a real client.", ["Consultant positioning on LinkedIn", "Headline and summary", "Three-minute offer pitch", "Live delivery and feedback"]],
];

const benefits: string[][] = [
  ["30", "30 Days of Training + Tasks", "Short focused training and one specific task every day. You do not just learn; you execute."],
  ["LIVE", "Live Coaching Every Saturday", "Ask questions, get unstuck, and have your work reviewed in real time."],
  ["AI", "AI Tools Throughout", "Use Claude, ChatGPT, and our custom tools to build faster, write cleaner, and move smarter."],
  ["KIT", "Templates and Sprints", "Done-for-you worksheets and weekly deliverables that keep your build moving."],
  ["CO", "Cohort Community", "Build alongside professionals at the same stage, with accountability and feedback."],
  ["PITCH", "Live Capstone", "Deliver your three-minute offer pitch and get direct coaching before a real client call."],
];

const reasons: string[][] = [
  ["Early access", "Enroll before the public and get the first chance to join the cohort."],
  ["Lowest price", "The waitlist-only early-bird price is the lowest this bootcamp will ever be offered."],
  ["Bonus delivered now", "Your waitlist bonus lands in your inbox the moment you sign up."],
  ["First look", "See the full curriculum before general enrollment opens."],
  ["Priority notification", "Know the second doors open. No refreshing and no missed window."],
];

function getTimeLeft() {
  const distance = Math.max(0, enrollmentDate - Date.now());
  return [Math.floor(distance / 86400000), Math.floor(distance / 3600000) % 24, Math.floor(distance / 60000) % 60, Math.floor(distance / 1000) % 60];
}

function Countdown() {
  const [time, setTime] = useState(getTimeLeft());
  useEffect(() => { const timer = window.setInterval(() => setTime(getTimeLeft()), 1000); return () => window.clearInterval(timer); }, []);
  return <div className="waitlist-countdown" aria-label="Time until enrollment opens">{time.map((value, index) => <span key={index}><strong>{String(value).padStart(2, "0")}</strong><small>{["days", "hours", "minutes", "seconds"][index]}</small></span>)}</div>;
}

function Video() {
  const [playing, setPlaying] = useState(false);
  const videoUrl = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL;
  return <div className="waitlist-video">{playing && videoUrl ? <iframe src={videoUrl} title="A message from Eno" allow="autoplay; encrypted-media" allowFullScreen /> : <button type="button" onClick={() => videoUrl && setPlaying(true)} className="video-poster"><span className="video-play">Play</span><strong>A message from Eno</strong><small>{videoUrl ? "Under 3 minutes. Press play." : "Eno's recorded welcome video will be connected before launch."}</small></button>}</div>;
}

export default function WaitlistPage() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", country: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/waitlist`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.detail || "We could not save your spot. Please try again."); }
      window.location.assign("/enroll");
    } catch (submissionError) { setError(submissionError instanceof Error ? submissionError.message : "Something went wrong. Please try again."); setSubmitting(false); }
  }

  return <main className="waitlist-page">
    <section className="waitlist-hero"><div className="waitlist-hero-inner"><p className="waitlist-eyebrow">Waitlist now open <i /> Enrollment opens September 15th <i /> Early-bird for waitlist members only</p><p className="waitlist-kicker">30-Day Consulting Offer Bootcamp</p><h1>You have the expertise.<br />You&apos;re missing the offer.<br /><em>Let&apos;s fix that in 30 days with AI.</em></h1><p className="waitlist-lede">Join the free waitlist and get 48-hour early-bird access when enrollment opens, at the lowest price this bootcamp will ever be offered. Plus your waitlist bonus lands in your inbox the moment you sign up.</p><div className="enrollment-clock"><p>Enrollment opens in</p><Countdown /><small>September 15th, 2026</small></div><a className="waitlist-cta" href="#waitlist-form">Join the free waitlist <b>-&gt;</b><small>Get first access and the best price.</small></a></div><div className="trust-strip waitlist-trust"><span>100,000+ trained</span><span>90+ countries</span><span>95% land a client in 90 days</span><span>Founded by Eno Eka</span></div></section>

    <section className="waitlist-section waitlist-video-section"><div className="waitlist-heading"><p className="waitlist-label">A message from Eno</p><h2>Before you read another word - watch this.</h2><p>Eno recorded a short message for you. It will tell you exactly who this is for, what changes in 30 days, and why winning consultants are not more qualified - they are better packaged.</p></div><Video /><p className="video-caption">Press play. This reframes everything.</p></section>

    <section className="waitlist-section problem-section"><div className="waitlist-heading left"><p className="waitlist-label dark">Let&apos;s be honest</p><h2>You&apos;re the go-to expert. So why are less-experienced people landing the clients?</h2></div><div className="prose"><p>You&apos;re the person your company calls when it matters. Your colleagues lean on you. Your boss depends on you. Your friends text you for advice on the exact problems companies pay consultants $10,000, $25,000, even $50,000 to solve.</p><p>You&apos;ve spent years building expertise that is genuinely valuable. And yet you keep watching someone with less experience land the consulting contract, sign the client, and get paid the fee.</p><p className="pivot">Because they packaged what they know into an offer - and you haven&apos;t yet.</p><p>Right now, your expertise is sitting in one of three places:</p><ul className="gold-list"><li><b>Trapped in a salary</b> - your employer pays a fraction of the value you create</li><li><b>Given away for free</b> - in conversations that never convert to income</li><li><b>Hidden in your head</b> - because no one showed you how to sell what you know</li></ul><p>This is not a skill problem. This is a packaging problem. And it is 100% fixable. In 30 days, that is exactly what we do together.</p></div><a className="waitlist-cta coral-dark" href="#waitlist-form">Join the free waitlist <b>-&gt;</b><small>Enrollment opens September 15th.</small></a></section>

    <section className="waitlist-section promise-section"><div className="waitlist-heading"><p className="waitlist-label">One focus. One outcome.</p><h2>In 30 days, you will have a consulting offer that can land real clients.</h2><p>Not a rough idea. Not a LinkedIn bio tweak. A real, packaged offer with a defined niche, clear promise, confident price, and proof that your market wants it.</p></div><ul className="promise-list">{["A positioning statement that tells the right client why you are the one to hire", "A one-page consulting offer, packaged, priced, and ready to present", "Evidence from real market conversations that your offer solves a paid problem", "A LinkedIn profile rebuilt around your consulting offer", "A three-minute offer pitch delivered live, with feedback"].map((item) => <li key={item}>{item}</li>)}</ul><p className="promise-close">This is not a course you watch. This is a build.</p></section>

    <section className="waitlist-section curriculum-section"><div className="waitlist-heading"><p className="waitlist-label dark">The 30-day curriculum</p><h2>Here&apos;s exactly what you build - week by week.</h2><p>Every week has a theme, daily training, daily tasks, and one real deliverable you submit.</p></div><div className="waitlist-week-grid">{weeks.map(([number, title, days, deliverable, text, bullets]) => <article className="waitlist-week" key={number}><span className="week-number">{number}</span><p className="week-meta">{days} / {title}</p><h3>{deliverable}</h3><p>{text}</p><ul>{(bullets as string[]).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><strong>Deliverable: {deliverable}</strong></article>)}</div><article className="capstone-card"><p className="waitlist-label">Capstone - graduation</p><h3>Saturday, October 31</h3><p>Graduate with an offer that is positioned, packaged, validated, and ready to present to real clients.</p></article><a className="waitlist-cta coral-dark" href="#waitlist-form">Join the free waitlist <b>-&gt;</b></a></section>

    <section className="waitlist-section benefits-section"><div className="waitlist-heading"><p className="waitlist-label dark">Everything inside the bootcamp</p><h2>This isn&apos;t just a course. It&apos;s a 30-day consulting launch system.</h2></div><div className="benefit-grid">{benefits.map(([icon, title, text]) => <article key={title}><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

    <section className="waitlist-section deal-section"><div className="waitlist-heading"><p className="waitlist-label dark">The waitlist deal</p><h2>The best price before anyone else gets it.</h2><p>When enrollment opens, waitlist members get a private 48-hour link before the public knows enrollment is open.</p></div><div className="price-blocks"><article><span>International / USD</span><del>$97</del><strong>$47</strong><b>Save $50</b><small>September 15th - September 22nd</small></article><article><span>Nigeria / NGN</span><del>NGN 53,750</del><strong>NGN 26,875</strong><b>Save NGN 26,875</b><small>September 15th - September 22nd</small></article></div><p className="urgency-line">After September 22nd, the early-bird price is gone. No exceptions and no extensions.</p><a className="waitlist-cta coral-dark" href="#waitlist-form">Join the free waitlist - lock in your early-bird price <b>-&gt;</b><small>No payment now. No obligation.</small></a></section>

    <section className="waitlist-section reasons-section"><div className="waitlist-heading"><p className="waitlist-label dark">Why join now</p><h2>Five reasons to be on this list before September 15th.</h2></div><div className="reason-list">{reasons.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div><a className="waitlist-cta coral-dark" href="#waitlist-form">Join the free waitlist <b>-&gt;</b></a></section>

    <section className="waitlist-section proof-section"><div className="waitlist-heading"><p className="waitlist-label dark">What people say</p><h2>They had the expertise too. Here&apos;s what happened when they used it.</h2></div><div className="testimonial-grid">{["From thinking about it to a packaged offer - in weeks.", "The live coaching made the difference.", "She stopped giving her expertise away for free.", "$12,000 client. Week 5. - Bootcamp graduate", "From employee to consultant with a validated offer.", "Two discovery calls booked before graduation."].map((quote) => <blockquote key={quote}><span>Testimonial placeholder</span><p>{quote}</p></blockquote>)}</div><div className="trust-bar">100,000+ professionals trained / 90+ countries / 95% land a client in 90 days</div></section>

    <section className="waitlist-section instructors-section"><div className="waitlist-heading"><p className="waitlist-label dark">Your instructors</p><h2>Built by someone who&apos;s done it. Led by someone who&apos;ll be there every week.</h2></div><div className="instructor-cards"><article><div className="instructor-avatar">EE</div><p className="waitlist-label dark">Founder</p><h3>Eno Eka</h3><p>CEO, ENY Consulting Inc. and founder of Consulting School and Business Analysis School. Eno has trained over 100,000 professionals across 90+ countries and led a $6 billion digital transformation in Canada.</p><p>She built this bootcamp for talented professionals who have not yet packaged what they know.</p></article><article><div className="instructor-avatar coach-avatar">CO</div><p className="waitlist-label dark">Lead cohort coach</p><h3>Coach Jojo</h3><p>Your coach will know your name, know your offer, and push you to finish what you started. Coach bio and professional headshot will be added before launch.</p></article></div></section>

    <section className="waitlist-form-section" id="waitlist-form"><div className="waitlist-heading"><p className="waitlist-label">Save your spot</p><h2>Join the free waitlist - and get your bonus right now.</h2><p>It is free, takes 30 seconds, and your waitlist bonus lands in your inbox the moment you submit.</p></div><form onSubmit={submit} className="waitlist-form">{[["first_name", "First name"], ["last_name", "Last name"], ["email", "Email address"], ["country", "Country"], ["phone", "Phone (WhatsApp)"]].map(([name, label]) => <label key={name}>{label}<input required name={name} type={name === "email" ? "email" : "text"} value={form[name as keyof typeof form]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /></label>)}{error && <p className="form-error" role="alert">{error}</p>}<button className="waitlist-cta" disabled={submitting}>{submitting ? "Saving your spot..." : "Join the waitlist - it is free"}<small>No payment now. Your information is private.</small></button></form><div className="form-trust">100,000+ trained / 90+ countries / 95% success rate / Founded by Eno Eka</div></section>
    <footer className="waitlist-footer">30-Day Consulting Offer Bootcamp / A product of ENY Consulting Inc. / <a href="mailto:support@businessanalysisschool.com">support@businessanalysisschool.com</a></footer>
  </main>;
}

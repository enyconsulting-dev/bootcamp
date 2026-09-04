"use client";

import { useEffect, useState } from "react";

const enrollmentDate = new Date("2026-09-15T00:00:00+01:00").getTime();
const earlyBirdDeadline = new Date("2026-09-22T23:59:00+01:00").getTime();
const checkoutLinks = {
  usdEarlyBird: process.env.NEXT_PUBLIC_USD_EARLY_BIRD_URL || "#checkout-placeholder",
  usdRegular: process.env.NEXT_PUBLIC_USD_REGULAR_URL || "#checkout-placeholder",
  ngnEarlyBird: process.env.NEXT_PUBLIC_NGN_EARLY_BIRD_URL || "#checkout-placeholder",
  ngnRegular: process.env.NEXT_PUBLIC_NGN_REGULAR_URL || "#checkout-placeholder",
};

type Currency = "USD" | "NGN";
const weeks: [string, string, string, string, string, string, string[]][] = [
  ["01", "POSITION", "Days 1-7", "Saturday, October 3", "Positioning Statement + Problem Set", "Stop thinking like an employee and start thinking like a consultant. Define the expertise you are monetizing, the client with the expensive problem, and the statement that makes the right decision-maker say: I need to talk to this person.", ["Consulting mindset shift - from tasks to outcomes", "Niche selection and ideal client definition", "Identifying your decision-maker", "The three problems you solve", "Your positioning statement - drafted and refined"]],
  ["02", "PACKAGE", "Days 8-14", "Saturday, October 10", "One-Page Consulting Offer", "Turn your expertise into a defined consulting service with a clear scope, a specific promise, and a price built for ROI, not what feels safe.", ["Turning expertise into a packaged service", "Outcome-based packaging and scope design", "Value pricing versus hourly", "Writing your offer statement", "Building your one-page consulting offer"]],
  ["03", "VALIDATE", "Days 15-21", "Saturday, October 17", "10-15 Conversations Logged + Revised Offer", "Find out if real people in your target market will pay before you spend a dollar on ads, outreach, or content. Refine from evidence, not assumption.", ["Market conversation versus sales call", "Who to approach in your network", "The 7-question validation script", "Reading a buying signal versus politeness", "Refining your offer from what you hear"]],
  ["04", "PROVE & PITCH", "Days 22-30", "Saturday, October 24", "3-Minute Offer Pitch Delivered Live", "Rebuild your LinkedIn profile around your consulting offer, then develop and deliver your three-minute pitch live with direct feedback.", ["Rebuilding LinkedIn around your offer", "Consultant headline and summary", "Developing your three-minute pitch", "Live delivery with real-time feedback"]],
];
const included = [
  ["30", "30 Days of Daily Training + Tasks", "A focused training and specific task every day. Each day builds on the last."],
  ["LIVE", "Live Coaching Every Saturday", "Four live sessions on October 3, 10, 17, and 24, with your offer on the table."],
  ["GO", "Live Orientation", "Thursday, October 1 at 7PM WAT. Meet your coach and cohort before the first session."],
  ["KIT", "Templates, Worksheets + Sprints", "Done-for-you materials and structured deliverables that keep you building."],
  ["CO", "Cohort Community", "Build in real time with professionals at exactly the same stage."],
  ["AI", "AI Tools Integration", "Use Claude, ChatGPT, and other tools at every stage. No technical background required."],
  ["PITCH", "Live Capstone + Feedback", "Deliver your three-minute offer pitch and receive direct coaching before a real client."],
  ["GRAD", "Graduation", "Finish with a positioned, packaged, validated offer ready to present."],
];
const faqs = [
  ["Is this self-paced or do I have to show up live?", "Both - and that is intentional. Daily training and tasks are self-paced. Live coaching happens every Saturday in October, with replays available if you cannot attend."],
  ["How much time does this actually take?", "Less than one hour per day for the daily training and task, plus four three-hour Saturday sessions."],
  ["What if I have never consulted before?", "If you have three or more years of professional experience, you have what it takes. You need expertise, not previous consulting experience."],
  ["What exactly happens during Week 3?", "You run 10-15 market validation conversations using a structured seven-question script, then refine your offer from genuine market evidence."],
  ["What does the LinkedIn work cover?", "Your headline, summary, featured section, and experience framing are rebuilt around your consulting offer. Content strategy and SEO are outside this bootcamp."],
  ["How does payment work?", "Payment accepted in USD and NGN via Stripe and Paystack."],
  ["Can I get a one-on-one session?", "Yes. You can add an optional one-on-one session with the coach for a fee. Email support@businessanalysisschool.com for more information"],
  ["What is your refund policy?", "There are no refunds once enrollment is complete because digital access and bonuses are delivered immediately. See the guarantee for our do-the-work commitment."],
  ["What happens immediately after I enroll?", "You receive a confirmation email with your login details and access to the bootcamp platform."],
  ["What if I miss a live session?", "Replays are available. Live attendance is strongly encouraged for feedback, accountability, and breakthroughs."],
];

function useCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof document === "undefined") return "USD";
    return document.cookie.match(/(?:^|; )visitor-country=([^;]+)/)?.[1] === "NG" ? "NGN" : "USD";
  });
  useEffect(() => {
    const detected = document.cookie.match(/(?:^|; )visitor-country=([^;]+)/)?.[1] === "NG" ? "NGN" : "USD";
    setCurrency(detected);
    document.documentElement.dataset.currency = detected;
  }, []);
  return currency;
}

function Countdown() {
  const [distance, setDistance] = useState(Math.max(0, earlyBirdDeadline - Date.now()));
  useEffect(() => { const timer = window.setInterval(() => setDistance(Math.max(0, earlyBirdDeadline - Date.now())), 1000); return () => window.clearInterval(timer); }, []);
  if (!distance) return <p className="countdown-closed">Early-bird has closed</p>;
  const values = [Math.floor(distance / 86400000), Math.floor(distance / 3600000) % 24, Math.floor(distance / 60000) % 60, Math.floor(distance / 1000) % 60];
  return <div className="countdown" aria-label="Time until early-bird closes">{values.map((value, index) => <span className="countdown-unit" key={index}><strong>{String(value).padStart(2, "0")}</strong><small>{["days", "hours", "minutes", "seconds"][index]}</small></span>)}</div>;
}

function EnrollmentButton({ currency, className = "cta" }: { currency: Currency; className?: string }) {
  const [open, setOpen] = useState(() => Date.now() >= enrollmentDate);
  const early = Date.now() < earlyBirdDeadline;
  useEffect(() => { const timer = window.setInterval(() => setOpen(Date.now() >= enrollmentDate), 1000); return () => window.clearInterval(timer); }, []);
  const price = currency === "NGN" ? (early ? "NGN 26,875" : "NGN 53,750") : early ? "$47" : "$97";
  const href = !open ? "#pricing" : currency === "NGN" ? (early ? checkoutLinks.ngnEarlyBird : checkoutLinks.ngnRegular) : (early ? checkoutLinks.usdEarlyBird : checkoutLinks.usdRegular);
  return <a className={className} href={href}>{open ? `Enroll now - ${price}` : "Notify me when enrollment opens"}<span>{open ? "Secure hosted checkout" : "Enrollment opens September 15th"}</span></a>;
}

export default function EnrollmentSalesPage() {
  const currency = useCurrency();
  const label = currency === "NGN" ? "NGN" : "USD";
  const earlyPrice = currency === "NGN" ? "NGN 26,875" : "$47";
  const regularPrice = currency === "NGN" ? "NGN 53,750" : "$97";
  return <main className="sales-page">
    <div className="sales-banner">You&apos;re on the waitlist. Here&apos;s your early look - enrollment opens September 15th. Early-bird: {earlyPrice} - closes September 22nd.</div>
    <section className="sales-hero"><div className="sales-hero-inner"><p className="sales-eyebrow">Waitlist members only <i /> Early-bird access <i /> Enrollment opens September 15th</p><p className="sales-kicker">30-Day Consulting Offer Bootcamp</p><h1>You&apos;re on the list.<br /><em>But wait!.<p>Guess what you just unlocked?</p></em></h1>                      
    <section className="" aria-setsize={600}><b><p>An early access to grab your seat in the bootcamp for 50% off & get our Profitable Consulting Masterclass plus workbook for free ( Value- $27)</p></b></section>
    
    
    
    
    
    <div className="sales-price-card"><span>{label} early-bird price</span><strong>{earlyPrice}</strong><del>{regularPrice}</del><small>Early-bird closes September 22nd</small><Countdown /></div><EnrollmentButton currency={currency} /><p className="sales-microcopy">Your local price is shown automatically. Secure checkout.</p></div><div className="trust-strip sales-trust"><span>100,000+ professionals trained</span><span>90+ countries</span><span>95% land a client in 90 days</span><span>Secure checkout</span></div></section>

    <section className="sales-section sales-video"><div className="sales-heading"><p className="sales-label">From Eno - watch this first</p><h2>You&apos;re on the waitlist. Before you read the rest, watch this.</h2><p>Eno recorded a short message specifically for waitlist members. Under three minutes. Worth every second.</p></div><div className="sales-video-frame">
          <iframe src="https://player.vimeo.com/video/1223428650?badge=0&autopause=0&player_id=0&app_id=58479&title=0&byline=0&portrait=0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerPolicy="strict-origin-when-cross-origin" title="UPDATED LANDING PAGE BOOTCAMP VIDEO 3" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 'none' }}></iframe>
        </div>
        <script src="https://player.vimeo.com/api/player.js"></script><p className="sales-caption">Watch before you read anything else. It changes how you see what you already have.</p><p className="">When enrollment opens on September 15th, you&apos;ll have 48 hours to enroll at the early-bird price before the public knows enrollment is open. This page shows you exactly what you&apos;re enrolling in.</p></section>

    <section className="sales-section sales-problem"><div className="sales-heading left"><p className="sales-label dark">The real problem</p><h2>You&apos;re the go-to expert. So why are less-experienced people landing the clients?</h2></div><div className="sales-prose"><p>Someone in your network - less experienced, less qualified, with a fraction of your track record - just announced a new consulting client. And you are still giving the same advice for free.</p><p>They are not smarter. They packaged what they know into an offer. That is the entire gap.</p><ul>{["Trapped in a salary - your employer captures a fraction of the value you create", "Given away for free - conversations that feel like consulting but never convert", "Hidden in your head - because no one showed you how to price what you know"].map((item) => <li key={item}>{item}</li>)}</ul><p className="sales-pivot">This is a packaging problem. And it is 100% fixable in 30 days.</p></div><EnrollmentButton currency={currency} className="cta coral-dark" /></section>

    <section className="sales-section sales-promise"><div className="sales-heading"><p className="sales-label">One focus. One outcome.</p><h2>In 30 days, you will have a consulting offer that can land real clients.</h2><p>A real, packaged offer with a defined niche, a positioning statement, a confident price, and evidence from real market conversations.</p></div><ul className="promise-list">{["A positioning statement that tells the right client why you are the one to hire", "A one-page consulting offer, packaged, priced, and ready to present", "Logged evidence from 10-15 validation conversations", "A LinkedIn profile rebuilt around your consulting offer", "A three-minute offer pitch delivered live with direct feedback"].map((item) => <li key={item}>{item}</li>)}</ul><p className="promise-close">This is not a course you watch and forget. This is a build.</p></section>

    <section className="sales-section sales-curriculum"><div className="sales-heading"><p className="sales-label dark">The 30-day curriculum</p><h2>Here&apos;s exactly what you build, week by week.</h2><p>Every week has a theme, daily training, daily tasks, and one real deliverable you submit.</p></div><div className="sales-week-grid">{weeks.map(([number, title, days, date, deliverable, text, bullets]) => <article className="sales-week" key={number}><span className="sales-week-number">{number}</span><p className="sales-week-meta">{days} / {title}</p><p className="sales-session">{date}</p><h3>{deliverable}</h3><p>{text}</p><ul>{(bullets as string[]).map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><strong>Deliverable: {deliverable}</strong></article>)}</div><article className="sales-capstone"><p className="sales-label">Capstone - graduation</p><h3>Saturday, October 31</h3><p>Four sessions. Four deliverables. One validated consulting offer ready to present to real clients.</p></article><div className="sales-chain">{["Waitlist", "Enroll", "Orientation", "Session 1", "Sessions 2-4", "Graduation"].map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>)}</div><EnrollmentButton currency={currency} className="cta coral-dark" /></section>

    <section className="sales-section sales-included"><div className="sales-heading"><p className="sales-label dark">Everything included</p><h2>This isn&apos;t just a course. It&apos;s a 30-day consulting launch system.</h2></div><div className="sales-included-grid">{included.map(([icon, title, text]) => <article key={title}><span>{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}<article className="order-bump"></article></div></section>

    <section className="sales-section sales-timeline"><div className="sales-heading"><p className="sales-label">The timeline</p><h2>Here&apos;s exactly how the next 60 days unfold.</h2><p>No confusion. No surprises. A clear path from where you are now to a validated consulting offer.</p></div><div className="sales-map">{[["NOW", "You&apos;re on the waitlist", "Your early-bird link arrives first."], ["SEP 15", "Enrollment opens", `Your private link unlocks ${earlyPrice}.`], ["SEP 22", "Early-bird closes", `Regular pricing begins at ${regularPrice}.`], ["OCT 1", "Live orientation", "7PM WAT with your coach and cohort."], ["OCT 3", "Session 1 - Position", "The build begins."], ["OCT 31", "Graduation", "You cross the finish line."]].map(([date, title, text]) => <article key={date}><strong>{date}</strong><h3>{title}</h3><p>{text}</p></article>)}</div><EnrollmentButton currency={currency} /></section>

    <section className="sales-section sales-fit"><div className="sales-heading"><p className="sales-label dark">Is this for you?</p><h2>Let&apos;s be honest about who gets the most out of this bootcamp.</h2></div><div className="sales-fit-grid"><article><h3>This is for you if...</h3><ul>{["You have 5+ years of professional experience", "You have been thinking about consulting for months or years", "You want to build income alongside your job", "You want structure, a coach, and a cohort", "You are willing to commit to daily tasks and four live Saturdays", "You are ready to work from anywhere in the world"].map((item) => <li key={item}>{item}</li>)}</ul></article><article><h3>This is not for you if...</h3><ul>{["You want a get-rich-quick scheme", "You have fewer than 3 years of experience and no defined expertise", "You are not willing to do the daily work", "You want someone else to build your consulting business", "You already land clients consistently"].map((item) => <li key={item}>{item}</li>)}</ul></article></div></section>

    <section className="sales-section sales-proof"><div className="sales-heading"><p className="sales-label dark">What people say</p><h2>They had the expertise too. Here&apos;s what happened when they packaged it.</h2></div><div className="sales-testimonials">{[1, 2, 3, 4, 5, 6].map((number) => <figure className="sales-testimonial-image" key={number}><img src={`/Feedback_${number}.png`} alt={`Participant feedback from live masterclass, testimonial ${number}`} loading="lazy" /></figure>)}</div><div className="trust-bar">100,000+ professionals trained / 90+ countries / 95% land a client in 90 days</div><EnrollmentButton currency={currency} className="cta coral-dark" /></section>

    <section className="sales-section sales-instructors"><div className="sales-heading"><p className="sales-label dark">Meet your instructors</p><h2>Built by someone who&apos;s done it. Led by someone who&apos;ll be there every week.</h2></div><div className="sales-instructor-grid"><article><img src="/eno_headshot.jpeg" alt="Eno Eka" /><p className="sales-label dark">Founder</p><h3>Eno Eka</h3><p>CEO, ENY Consulting Inc. and founder of Consulting School and Business Analysis School. Eno has trained over 100,000 professionals across 90+ countries and led a $6 billion digital transformation in Canada.</p><p>Her voice is direct. Her standards are high. Her results speak for themselves.</p></article><article><img src="/coach_jojo.jpeg" alt="Coach Jojo" /><p className="sales-label dark">Lead cohort coach</p><h3>Coach Jojo</h3><p>Coach Jojo is the person who will know your name, know your offer, and push you to finish what you started.</p></article></div></section>

    <section className="sales-section sales-pricing" id="pricing"><div className="sales-heading"><p className="sales-label dark">Your investment</p><h2>Lock in your early-bird rate before September 22nd.</h2><p>The early-bird price is available to waitlist members from September 15th to September 22nd only.</p></div><div className="sales-price-card"><span>{label} enrollment / secure checkout</span><del>{regularPrice}</del><strong>{earlyPrice}</strong><small>Early-bird price - September 15th-22nd only</small><ul>{["30 days of daily training and daily tasks", "Live coaching every Saturday", "Live orientation - October 1, 7PM WAT", "Templates, worksheets, and execution sprints", "Cohort community access", "AI tools integration", "Capstone and graduation", "Waitlist online course bonus"].map((item) => <li key={item}>{item}</li>)}</ul><EnrollmentButton currency={currency} /><p className="disclaimer">Results mentioned are not typical. Individual results will vary by experience, effort, and market conditions.</p></div></section>

    <section className="sales-section sales-guarantee"><div className="sales-narrow"><p className="sales-label dark">Our promise to you</p><h2>Do the work. Get the result. That&apos;s the deal.</h2><p>If you attend orientation, complete the four weekly deliverables, show up for at least three live sessions, and deliver your capstone pitch - and still do not have a packaged offer you are confident presenting - contact support within seven days of graduation and we will work with you personally to get you there.</p><div className="guarantee-box"><strong>Show up. Build. Graduate.</strong><p>We do not offer refunds for people who do not do the work. We offer results for people who do.</p></div><p className="support">Questions? <a href="mailto:support@businessanalysisschool.com">support@businessanalysisschool.com</a></p></div></section>

    <section className="sales-section sales-faq"><div className="sales-heading"><p className="sales-label dark">Questions? We&apos;ve got answers.</p><h2>Everything you need to know before you enroll.</h2></div><div className="sales-faq-grid">{faqs.map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}</div></section>

    <section className="sales-section sales-closing"><div className="sales-narrow"><p className="sales-label">This is your moment</p><h2>Your expertise is worth more than a salary. It&apos;s time to prove it.</h2><p>You have watched people with less experience land the clients because they packaged what they know. That ends in 30 days.</p><ul className="promise-list">{["A positioning statement that makes the right client say: I need to talk to this person", "A one-page consulting offer, packaged and priced", "Evidence from real validation conversations", "A LinkedIn profile positioned for consulting", "A three-minute offer pitch delivered live"].map((item) => <li key={item}>{item}</li>)}</ul><div className="sales-closing-price"><span>{label}</span><strong>{earlyPrice}</strong><del>{regularPrice}</del></div><Countdown /><EnrollmentButton currency={currency} /><p className="sales-legal">Results mentioned are not typical. Individual results will vary by experience, effort, and market conditions. The 30-Day Consulting Offer Bootcamp is a product of ENY Consulting Inc.</p></div></section>
    <footer className="sales-footer">30-Day Consulting Offer Bootcamp / A product of ENY Consulting Inc. / <a href="mailto:support@businessanalysisschool.com">support@businessanalysisschool.com</a>WhatsApp: 09085515969, 09085516252, 09169994482, 09169994483, 09085539380, +15873288469</footer>
  </main>;
}

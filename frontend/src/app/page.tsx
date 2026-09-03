"use client";

import { useEffect, useState } from "react";
import WaitlistPage from "./WaitlistPage";

const earlyBirdDeadline = new Date("2026-09-22T23:59:00+01:00").getTime();
const checkoutLinks = {
  usdEarlyBird: process.env.NEXT_PUBLIC_USD_EARLY_BIRD_URL || "#checkout-placeholder",
  usdRegular: process.env.NEXT_PUBLIC_USD_REGULAR_URL || "#checkout-placeholder",
  usdVip: process.env.NEXT_PUBLIC_USD_VIP_URL || "#checkout-placeholder",
  ngnEarlyBird: process.env.NEXT_PUBLIC_NGN_EARLY_BIRD_URL || "#checkout-placeholder",
  ngnRegular: process.env.NEXT_PUBLIC_NGN_REGULAR_URL || "#checkout-placeholder",
  ngnVip: process.env.NEXT_PUBLIC_NGN_VIP_URL || "#checkout-placeholder",
};

type Currency = "USD" | "NGN";
const weeks = [
  { icon: "01", title: "Position", days: "Days 1–7", deliverable: "Positioning Statement + Problem Set", text: "Define the expertise you are monetizing, identify the client with the expensive problem you solve, and write a positioning statement that makes the right person say: this is exactly what I need.", bullets: ["Consulting mindset shift", "Niche and ideal client definition", "Decision-maker problems", "Your first positioning statement"] },
  { icon: "02", title: "Package", days: "Days 8–14", deliverable: "One-Page Consulting Offer", text: "Turn your expertise into a defined consulting service with a clear scope, a specific promise, and a price built for ROI.", bullets: ["Packaged service design", "Outcome-based scope", "Value pricing versus hourly", "Your one-page offer"] },
  { icon: "03", title: "Validate", days: "Days 15–21", deliverable: "10–15 Conversations + Revised Offer", text: "Run real market validation conversations before spending on ads or outreach, then refine your offer from evidence rather than assumption.", bullets: ["Market conversation versus sales call", "Who to approach and how", "The 7-question script", "Reading signals and refining"] },
  { icon: "04", title: "Prove & Pitch", days: "Days 22–30", deliverable: "3-Minute Offer Pitch Delivered Live", text: "Rebuild your LinkedIn profile around your consulting offer and deliver your three-minute pitch live with direct feedback.", bullets: ["Consultant positioning on LinkedIn", "Headline and summary", "Three-minute offer pitch", "Live delivery and feedback"] },
];
const included = [
  ["30", "Daily training + tasks", "A short focused training and a specific task every day for 30 days."], ["LIVE", "Saturday coaching", "Live feedback and answers from your coach, with your name on it."], ["GO", "Kickoff call", "Meet your coach and cohort before Day 1 and hit the ground running."], ["KIT", "Templates + worksheets", "Done-for-you materials and execution sprints that cut your build time."], ["CO", "Cohort community", "Accountability partners and peers building in real time alongside you."], ["AI", "AI tools integration", "Use Claude, ChatGPT, Lovable and more to build faster."], ["CALL", "Capstone mock calls", "Practice a real-world client scenario and get direct feedback."], ["GRAD", "Graduation", "Finish with a certificate, a complete offer, and momentum to launch."],
];
const faqs = [
  ["Is this self-paced or do I have to show up live?", "Both. Daily training is self-paced, while Saturday coaching is live. Replays are available, but the breakthroughs happen when you show up and get feedback."], ["How much time does this actually take?", "Less than one hour per day for the training and task, plus a 60–90 minute Saturday live session."], ["What if I have never consulted before?", "If you have three or more years of professional experience, you have what it takes. The bootcamp teaches you to package and sell that expertise."], ["What is the difference between standard and VIP?", "VIP adds a personal hot-seat offer review, a graded workbook with feedback, and a premium template pack."], ["How does payment work?", "Your local currency is selected automatically and checkout is handled securely by our payment partner."], ["What is your refund policy?", "There are no refunds after enrollment because access and bonuses are delivered immediately. Our commitment is to help participants who complete the work and still need to finish their offer."], ["What happens immediately after I enroll?", "You receive login details, the Starter Kit bonus, and cohort community access. Kickoff is September 5 and classes begin September 7."], ["What if I miss a live session?", "Replays will be available, though live attendance is strongly encouraged for feedback and accountability."], ["Do I need prior AI experience?", "No. We show you how to use tools like Claude and ChatGPT in the context of each task."], ["How do I reach support?", "Email support@businessanalysisschool.com. The team typically responds within 24 business hours."],
];

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
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

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

function useEarlyBirdStatus() {
  const [isEarlyBird, setIsEarlyBird] = useState(() => Date.now() < earlyBirdDeadline);
  useEffect(() => {
    const timer = window.setInterval(() => setIsEarlyBird(Date.now() < earlyBirdDeadline), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return isEarlyBird;
}

function useEnrollmentOpen() {
  const enrollmentDate = new Date("2026-09-15T00:00:00+01:00").getTime();
  const [isOpen, setIsOpen] = useState(() => Date.now() >= enrollmentDate);
  useEffect(() => {
    const timer = window.setInterval(() => setIsOpen(Date.now() >= enrollmentDate), 1000);
    return () => window.clearInterval(timer);
  }, [enrollmentDate]);
  return isOpen;
}

function useVisitorCurrency(): Currency {
  const [currency, setCurrency] = useState<Currency>(() => {
    if (typeof document === "undefined") return "USD";
    return document.cookie.match(/(?:^|; )visitor-country=([^;]+)/)?.[1] === "NG" ? "NGN" : "USD";
  });
  useEffect(() => {
    const country = document.cookie.match(/(?:^|; )visitor-country=([^;]+)/)?.[1];
    const visitorCurrency = country === "NG" ? "NGN" : "USD";
    setCurrency(visitorCurrency);
    document.documentElement.dataset.currency = visitorCurrency;
  }, []);
  return currency;
}

function Cta({ children = "Enroll now" }: { children?: React.ReactNode }) {
  const currency = useVisitorCurrency();
  return <a className="cta" href="#pricing">{children}<span>{currency === "NGN" ? "Early-bird: ₦26,875 · Nigeria" : "Early-bird: $47 · International"}</span></a>;
}

export function EnrollmentPage() {
  const currency = useVisitorCurrency();
  return (
    <main>
      <section className="hero">
        <div className="hero-inner">
          <p className="eyebrow">Waitlist members only <span /> Enrollment opens September 15th <span /> Early-bird access</p>
          <div className="hero-copy">
            <p className="kicker">The 30-Day Consulting Offer Bootcamp</p>
            <h1>You have the expertise. <em>You&apos;re just missing the offer.</em></h1>
            <p className="hero-lede">In 30 days, package what you know into a consulting offer that lands real clients, with a system, a community, and a coach holding you accountable every step.</p>
            <p className="urgency">Waitlist members get the lowest price before the public.</p>
            <div className="timer-panel">
              <p>Early-bird price ends in <span>WAT</span></p>
              <Countdown />
            </div>
            <Cta>Enroll now · Start your build</Cta>
            <p className="microcopy">Your local enrollment price is shown below · Secure hosted checkout</p>
          </div>
          <blockquote>&ldquo;$12,000 client. Week 5.&rdquo;<cite>Bootcamp graduate</cite></blockquote>
        </div>
        <div className="trust-strip"><span>100,000+ professionals trained</span><span>90+ countries</span><span>95% land a client within 90 days</span></div>
      </section>

      <section className="video-section">
        <div className="section-heading"><p className="section-label">A message from Eno</p><h2>Before you read another word, watch this first.</h2><p>Three minutes to understand who this is for, what you&apos;ll walk away with, and why now is the moment to stop waiting.</p></div>
        <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
          <iframe src="https://player.vimeo.com/video/1223442001?badge=0&autopause=0&player_id=0&app_id=58479" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerPolicy="strict-origin-when-cross-origin" title="UPDATED LANDING PAGE BOOTCAMP VIDEO 2" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 'none' }}></iframe>
        </div>
        <script src="https://player.vimeo.com/api/player.js"></script>
      </section>

      <section className="curriculum-section" id="curriculum"><div className="section-heading"><p className="section-label">The 30-day curriculum</p><h2>Here&apos;s exactly what you&apos;ll build, week by week.</h2><p>Every week has a theme, daily training, and a real deliverable. By Day 30, the four deliverables combine into your complete consulting launch package.</p></div><div className="week-grid">{weeks.map((week) => <article className="week-card" key={week.icon}><div className="week-number">{week.icon}</div><p className="week-days">{week.days}</p><h3>{week.title}</h3><p>{week.text}</p><ul>{week.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><strong>Deliverable: {week.deliverable}</strong></article>)}</div><div className="capstone"><p className="section-label">Capstone · Graduation</p><h3>Saturday, October 10, 2026</h3><p>Pitch a real scenario, run paired mock discovery calls, and get direct feedback from your coach before taking this to a real client.</p></div><Cta>Enroll now · Build this in 30 days</Cta></section>

      <section className="included-section"><div className="section-heading"><p className="section-label">Everything included</p><h2>This isn&apos;t just a course. It&apos;s a consulting launch system.</h2></div><div className="included-grid">{included.map(([icon, title, text]) => <article className="included-item" key={title}><div className="item-icon">{icon}</div><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

      <section className="timeline-section"><div className="section-heading"><p className="section-label">The timeline</p><h2>Here&apos;s exactly how the next 40 days unfold.</h2></div><div className="timeline">{[["Sept 1", "Enrollment opens", "Secure your spot and receive the Starter Kit."], ["Sept 3", "Early-bird closes", "Price moves to $97 / ₦35,000 at midnight."], ["Sept 5", "Live kickoff call", "Meet your coach and cohort."], ["Sept 7", "Day 1 begins", "Your first training and task land."], ["Oct 10", "Graduation & demo day", "Finish with an offer ready for real clients."]].map(([date, title, text]) => <div className="timeline-item" key={date}><strong>{date}</strong><h3>{title}</h3><p>{text}</p></div>)}</div><Cta>Reserve my spot</Cta></section>

      <section className="fit-section"><div className="section-heading"><p className="section-label">Is this for you?</p><h2>Let&apos;s be clear about who gets the most out of this bootcamp.</h2></div><div className="fit-grid"><div className="fit-card for"><h3>This is for you if...</h3><ul>{["You have 3+ years of professional experience", "You have been thinking about consulting for months or years", "You want to build income alongside your job", "You want structure, accountability, and a coach", "You are ready to use AI to move faster", "You are in Nigeria or anywhere in the world and ready to work"].map((x) => <li key={x}>{x}</li>)}</ul></div><div className="fit-card not"><h3>This is not for you if...</h3><ul>{["You want a get-rich-quick scheme", "You have less than 3 years of experience and no defined expertise", "You will not commit one hour a day and Saturday sessions", "You want someone else to do the work", "You already land consulting clients consistently"].map((x) => <li key={x}>{x}</li>)}</ul></div></div></section>

      <section className="testimonials-section"><div className="section-heading"><p className="section-label">What people are saying</p><h2>They had the expertise too. Here&apos;s what happened when they packaged it.</h2></div><div className="quote-grid">{["$12,000 client. Week 5.", "In 30 days, I had an offer, a LinkedIn profile that reflects my expertise, and two discovery calls booked.", "The live Saturday sessions alone are worth 10x the price. The feedback changed how I positioned my entire offer.", "I had a $5,000/month offer sitting in my head. I just hadn&apos;t packaged it.", "The accountability structure and community pushed me to actually finish.", "I went from I don&apos;t know if I&apos;m ready to running a live mock discovery call."].map((quote, index) => <blockquote className="quote-card" key={quote}><p>&ldquo;{quote}&rdquo;</p><cite>Bootcamp participant · Testimonial placeholder {index + 1}</cite></blockquote>)}</div><div className="trust-bar">100,000+ professionals trained · 90+ countries · 95% land a client within 90 days</div></section>

      <section className="instructors-section"><div className="section-heading"><p className="section-label">Your instructors</p><h2>Built by someone who&apos;s done it. Taught by someone who&apos;ll be there every day.</h2></div><div className="instructor-grid"><article><div className="portrait"><img src="/eno_headshot.jpeg" alt="Eno Eka" /></div><p className="section-label">Founder</p><h3>Eno Eka</h3><p>CEO of ENY Consulting Inc. and founder of Consulting School and Business Analysis School. Eno has trained over 100,000 professionals across 90+ countries and led a $6 billion digital transformation.</p><p>She built this bootcamp for talented professionals who are giving their expertise away because they have not packaged what they know.</p></article><article><div className="portrait coach"><img src="/coach_jojo.jpeg" alt="Coach Jojo" /></div><p className="section-label">Lead cohort coach</p><h3>Coach Jojo</h3><p>Coach bio and professional headshot will be added before launch. Coach Jojo leads the live cohort, reviews your work, and helps you finish what you started.</p></article></div></section>

      <PricingSection />

      <section className="guarantee-section"><div className="narrow"><p className="section-label">Our promise to you</p><h2>Do the work. Get the result. That&apos;s the deal.</h2><p>Attend kickoff, complete the four weekly deliverables, show up for at least three Saturday sessions, and submit your capstone. If you still do not have a packaged offer you are confident presenting, contact support within seven days of graduation and we will work with you personally to get there.</p><div className="guarantee-box"><strong>Show up. Build. Graduate.</strong><p>We do not offer refunds for people who do not do the work. We offer results for people who do.</p></div><p className="support">Questions? <a href="mailto:support@businessanalysisschool.com">support@businessanalysisschool.com</a></p></div></section>

      <section className="faq-section"><div className="section-heading"><p className="section-label">Questions? We&apos;ve got answers.</p><h2>Everything you need to know before you enroll.</h2></div><div className="faq-grid">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>

      <section className="closing-section"><div className="narrow"><p className="section-label">This is your moment</p><h2>Your expertise is worth more than a salary. It&apos;s time to prove it.</h2><p>You have watched people with less experience land the clients, contracts, and fees because they packaged what they know. That ends in 30 days.</p><p>By October 10th, you will have a consulting offer that is packaged, priced, and ready for real clients, plus the authority and outreach system to put it in front of them.</p><div className="final-prices"><span>USD <strong>$47</strong> <small>was $97</small></span><span>NGN <strong>₦25,000</strong> <small>was ₦35,000</small></span></div><Countdown /><Cta>Enroll now · Start your build</Cta><p className="microcopy">After enrollment: access, Starter Kit, and community invitation arrive immediately.</p></div></section>
      <footer><p>30-Day Consulting Offer Bootcamp · A product of ENY Consulting Inc.</p><a href="mailto:support@businessanalysisschool.com">support@businessanalysisschool.com</a><span><a href="#top">Back to top</a> · Privacy policy and terms coming before launch</span></footer>
    </main>
  );
}

export default function Home() {
  return <WaitlistPage />;
}

function PricingSection() {
  const isEarlyBird = useEarlyBirdStatus();
  const isEnrollmentOpen = useEnrollmentOpen();
  const currency = useVisitorCurrency();
  const usdPrice = isEarlyBird ? "$47" : "$97";
  const ngnPrice = isEarlyBird ? "₦26,875" : "₦53,750";
  const usdUrl = isEnrollmentOpen ? (isEarlyBird ? checkoutLinks.usdEarlyBird : checkoutLinks.usdRegular) : "#pricing";
  const ngnUrl = isEnrollmentOpen ? (isEarlyBird ? checkoutLinks.ngnEarlyBird : checkoutLinks.ngnRegular) : "#pricing";
  const priceLabel = !isEnrollmentOpen ? "Enrollment opens September 15th" : isEarlyBird ? "Early-bird price · Ends September 22nd" : "Regular enrollment price";
  return <section className="pricing-section" id="pricing"><div className="section-heading"><p className="section-label">Your investment · {currency === "NGN" ? "Nigeria" : "International"}</p><h2>Enroll Now. {isEarlyBird ? "Lock in your early-bird rate." : "Enrollment is at the regular rate."}</h2><p>{isEarlyBird ? "Price increases at midnight on September 3rd." : "Early-bird enrollment has closed."}</p></div><div className="pricing-grid"><article className="price-card"><p className="section-label">International enrollment</p><p className="processor">Checkout via Stripe</p><p className="was">{isEarlyBird ? "$97" : ""}</p><p className="price">{usdPrice}</p><p className="price-note">{priceLabel}</p><ul>{["30 days of daily training + tasks", "Live Saturday coaching", "Templates and worksheets", "Cohort community", "AI tools integration", "Capstone mock calls + graduation", "Starter Kit bonus"].map((x) => <li key={x}>{x}</li>)}</ul><a className="cta" href={usdUrl}>Enroll for {usdPrice} <span>Secure USD checkout</span></a><a className="vip-link" href={checkoutLinks.usdVip}>Add VIP upgrade · +$47</a><div className="vip">Hot-seat review, graded workbook, premium templates</div></article><article className="price-card"><p className="section-label">Nigeria enrollment</p><p className="processor">Checkout via Paystack</p><p className="was">{isEarlyBird ? "₦35,000" : ""}</p><p className="price">{ngnPrice}</p><p className="price-note">{priceLabel}</p><ul>{["30 days of daily training + tasks", "Live Saturday coaching", "Templates and worksheets", "Cohort community", "AI tools integration", "Capstone mock calls + graduation", "Starter Kit bonus"].map((x) => <li key={x}>{x}</li>)}</ul><a className="cta" href={ngnUrl}>Enroll for {ngnPrice} <span>Secure NGN checkout</span></a><a className="vip-link" href={checkoutLinks.ngnVip}>Add VIP upgrade · +₦15,000</a><div className="vip">Hot-seat review, graded workbook, premium templates</div></article></div><p className="disclaimer">Results mentioned are not typical. Individual results will vary based on experience, effort, and market conditions.</p></section>;
}

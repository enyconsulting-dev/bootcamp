import Link from "next/link";

type ThankYouPageProps = {
  searchParams: Promise<{
    currency?: string;
    vip?: string;
    session_id?: string;
  }>;
};

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const params = await searchParams;
  const currency = params.currency?.toUpperCase() === "NGN" ? "NGN" : "USD";
  const isVip = params.vip === "true";
  const hasSession = Boolean(params.session_id);

  return (
    <main className="thank-you-page">
      <section className="thank-you-card" aria-labelledby="thank-you-heading">
        <p className="section-label">You&apos;re in</p>
        <div className="success-mark" aria-hidden="true">✓</div>
        <h1 id="thank-you-heading">Your next chapter starts here.</h1>
        <p className="thank-you-lede">
          Thank you for enrolling in the 30-Day Consulting Offer Bootcamp.
          {isVip ? " Your VIP Challenge Upgrade is included." : " Your bootcamp access is being prepared."}
        </p>

        <div className="next-steps">
          <div><span>01</span><div><h2>Check your inbox</h2><p>Your confirmation, login details, and the 6-Figure Offer Starter Kit will arrive there.</p></div></div>
          <div><span>02</span><div><h2>Join the cohort</h2><p>Your community invitation and access instructions will follow shortly.</p></div></div>
          <div><span>03</span><div><h2>Mark the dates</h2><p>Kickoff: Saturday, September 5. Classes begin Monday, September 7. Graduation: October 10.</p></div></div>
        </div>

        <div className="order-status">
          <span>Payment route</span>
          <strong>{currency === "NGN" ? "Paystack · NGN" : "Hosted checkout · USD"}</strong>
          <small>{hasSession ? "Confirmation received" : "Confirmation is being matched to your enrollment"}</small>
        </div>
        <p className="support">Need help? <a href="mailto:support@businessanalysisschool.com">Contact support</a></p>
        <Link className="return-link" href="/">Return to the bootcamp</Link>
      </section>
    </main>
  );
}
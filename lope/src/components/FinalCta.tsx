export default function FinalCta() {
  return (
    <section className="py-[90px] text-center">
      <div className="wrap reveal">
        <h2 className="text-[clamp(32px,5vw,52px)] tracking-[-0.03em]">
          Curiosity is the hardest yard.
          <br />
          Lope walks it with you.
        </h2>
        <p className="mx-auto mt-[18px] max-w-[46ch] text-lg text-ink-soft">
          Meet the guide that turns "maybe someday" into a start date.
        </p>
        <div className="mt-8 flex justify-center">
          <a className="btn btn-primary" href="#meet">
            Find your path <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

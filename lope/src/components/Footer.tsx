import { BrandMark } from "./Header";

export default function Footer() {
  return (
    <footer className="border-t border-line pb-[46px] pt-[30px] text-[13px] text-ink-faint">
      <div className="wrap">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 font-bold tracking-tight text-ink">
            <BrandMark />
            <span>
              Lope{" "}
              <small className="font-medium tracking-normal text-ink-faint">
                · GCU Enrollment Concierge
              </small>
            </span>
          </div>
          <span>An AI-powered enrollment platform concept</span>
        </div>
        <p className="mt-2.5 max-w-[62ch] leading-normal">
          Concept prototype for demonstration only. Not an official Grand Canyon
          University product or enrollment channel. Programs, costs, timelines,
          and outcomes shown are illustrative examples generated to demonstrate
          the experience — they are not quotes, offers, or guarantees. No
          personal information is collected, stored, or transmitted; everything
          you type stays in your browser.
        </p>
      </div>
    </footer>
  );
}

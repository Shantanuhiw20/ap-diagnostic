import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Document-grade styling, distinct from the conversational Markdown
// component used in chat: bigger type, a black-and-yellow table treatment,
// generous spacing. This is meant to look like something printed, not
// something typed.
const components: Components = {
  h1: (props) => (
    <h2
      className="mt-8 mb-3 border-b-2 border-ey-black pb-2 font-[var(--font-display)] text-xl font-extrabold text-ey-black first:mt-0"
      {...props}
    />
  ),
  h2: (props) => (
    <h3
      className="mt-8 mb-3 border-b-2 border-ey-black pb-2 font-[var(--font-display)] text-xl font-extrabold text-ey-black first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h4
      className="mt-5 mb-2 font-[var(--font-display)] text-sm font-bold tracking-wide text-ey-grey-700 uppercase first:mt-0"
      {...props}
    />
  ),
  p: (props) => <p className="mb-3 leading-relaxed text-ey-charcoal last:mb-0" {...props} />,
  strong: (props) => <strong className="font-semibold text-ey-black" {...props} />,
  em: (props) => <em className="text-ey-grey-700 italic" {...props} />,
  ul: (props) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-ey-charcoal" {...props} />,
  ol: (props) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 text-ey-charcoal" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="font-medium text-ey-black underline decoration-ey-yellow decoration-2 underline-offset-2"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded bg-ey-grey-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ey-black" {...props} />
  ),
  pre: (props) => (
    <pre className="mb-4 overflow-x-auto rounded-lg bg-ey-grey-100 p-3 text-[0.85em]" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="mb-4 border-l-4 border-ey-yellow bg-ey-grey-100 py-2 pl-4 text-ey-grey-700 italic" {...props} />
  ),
  table: (props) => (
    <div className="mb-5 overflow-x-auto rounded-lg border border-ey-grey-200">
      <table className="w-full border-collapse text-left text-[13px]" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-ey-black" {...props} />,
  // Plain solid colour, not the opacity-slash syntax: Tailwind v4 compiles
  // `/NN` opacity modifiers to `color-mix(in oklab, ...)`, which html2canvas
  // (used for the PDF export) cannot parse and throws on.
  tr: (props) => <tr className="even:bg-ey-grey-100" {...props} />,
  th: (props) => (
    <th
      className="border-b-4 border-ey-yellow px-3 py-2.5 font-[var(--font-display)] text-[11px] font-bold tracking-wide whitespace-nowrap text-ey-white uppercase"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border-b border-ey-grey-200 px-3 py-2.5 align-top text-ey-charcoal" {...props} />
  ),
  hr: () => <hr className="my-8 border-ey-grey-200" />,
};

export function ReportMarkdown({ children }: { children: string }) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

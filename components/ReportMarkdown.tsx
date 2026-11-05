import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Implements the visual specification in context/sample-data/design.md:
// - Full-width ey-charcoal (#2E2E38) section header bands with bold white type
// - Tables with ey-yellow (#FFE600) header row, black bold text, plain white body
//   rows with full cell grid borders (no alternating row striping), tabular-nums
// - Highlight / callout block in ey-grey-light (#F2F2F2)
const components: Components = {
  h1: (props) => (
    <h2
      className="mt-6 mb-4 border-b-2 border-ey-black pb-2 font-[var(--font-display)] text-xl font-extrabold text-ey-black first:mt-0"
      {...props}
    />
  ),
  h2: (props) => (
    <h3
      className="mt-8 mb-4 rounded-sm bg-ey-charcoal px-4 py-2.5 font-[var(--font-display)] text-base font-extrabold tracking-wide text-ey-white uppercase first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h4
      className="mt-5 mb-2 font-[var(--font-display)] text-sm font-bold tracking-wide text-ey-black uppercase first:mt-0"
      {...props}
    />
  ),
  p: (props) => <p className="mb-3 leading-relaxed text-ey-charcoal last:mb-0" {...props} />,
  strong: (props) => <strong className="font-bold text-ey-black" {...props} />,
  em: (props) => <em className="text-ey-grey-700 italic" {...props} />,
  ul: (props) => <ul className="mb-4 ml-5 list-disc space-y-1.5 text-ey-charcoal" {...props} />,
  ol: (props) => <ol className="mb-4 ml-5 list-decimal space-y-2 text-ey-charcoal" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="font-medium text-ey-black underline decoration-ey-yellow decoration-2 underline-offset-2"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded bg-ey-grey-light px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-ey-black" {...props} />
  ),
  pre: (props) => (
    <pre className="mb-4 overflow-x-auto rounded bg-ey-grey-light p-3 text-[0.85em]" {...props} />
  ),
  blockquote: (props) => (
    <blockquote
      className="mb-4 rounded-sm border-l-4 border-ey-yellow bg-ey-grey-light px-4 py-3 text-ey-black not-italic"
      {...props}
    />
  ),
  table: (props) => (
    <div className="mb-6 overflow-x-auto border border-ey-grey-400">
      <table className="w-full border-collapse text-left text-[13px] tabular-nums" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-ey-yellow" {...props} />,
  tr: (props) => <tr className="bg-white" {...props} />,
  th: (props) => (
    <th
      className="border border-ey-grey-400 bg-ey-yellow px-3.5 py-2.5 font-[var(--font-display)] text-[11px] font-extrabold tracking-wider whitespace-nowrap text-ey-black uppercase"
      {...props}
    />
  ),
  td: (props) => (
    <td className="border border-ey-grey-200 bg-white px-3.5 py-2.5 align-top leading-relaxed text-ey-charcoal" {...props} />
  ),
  hr: () => <hr className="my-6 border-ey-grey-200" />,
};

export function ReportMarkdown({ children }: { children: string }) {
  return (
    <div className="text-[14.5px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}


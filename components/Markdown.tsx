import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: (props) => (
    <h2
      className="mt-4 mb-2 font-[var(--font-display)] text-lg font-extrabold text-ey-black first:mt-0"
      {...props}
    />
  ),
  h2: (props) => (
    <h3
      className="mt-4 mb-2 font-[var(--font-display)] text-base font-extrabold text-ey-black first:mt-0"
      {...props}
    />
  ),
  h3: (props) => (
    <h4
      className="mt-3 mb-1 font-[var(--font-display)] text-sm font-bold tracking-wide text-ey-grey-700 uppercase first:mt-0"
      {...props}
    />
  ),
  p: (props) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />,
  strong: (props) => <strong className="font-semibold text-ey-black" {...props} />,
  ul: (props) => <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />,
  ol: (props) => <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => (
    <a
      className="font-medium text-ey-black underline decoration-ey-yellow decoration-2 underline-offset-2 hover:decoration-4"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded bg-ey-grey-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ey-black" {...props} />
  ),
  pre: (props) => (
    <pre className="mb-3 overflow-x-auto rounded-lg bg-ey-grey-100 p-3 text-[0.85em]" {...props} />
  ),
  blockquote: (props) => (
    <blockquote className="mb-3 border-l-2 border-ey-yellow pl-4 text-ey-grey-700 italic" {...props} />
  ),
  table: (props) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="border-b-2 border-ey-black" {...props} />,
  th: (props) => (
    <th className="px-3 py-2 font-[var(--font-display)] font-bold whitespace-nowrap text-ey-black" {...props} />
  ),
  td: (props) => <td className="border-b border-ey-grey-200 px-3 py-2 align-top" {...props} />,
  hr: () => <hr className="my-4 border-ey-grey-200" />,
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

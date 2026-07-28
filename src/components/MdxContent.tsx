import { MDXRemote } from "next-mdx-remote/rsc";
import Link from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

// Maps raw markdown elements to the site's own typography — matches the
// prose treatment used elsewhere (about/privacy pages): font-manrope
// headings, zinc-toned body text, accent links.
const components = {
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="font-manrope font-bold text-2xl md:text-3xl text-white uppercase tracking-tight mt-16 mb-6" {...props} />
  ),
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="font-manrope font-bold text-xl md:text-2xl text-white uppercase tracking-tight mt-12 mb-4" {...props} />
  ),
  p: (props: HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-zinc-400 leading-relaxed mb-6" {...props} />
  ),
  a: ({ href = "", ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const isExternal = /^https?:\/\//.test(href);
    return isExternal ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:text-white transition-colors" {...props} />
    ) : (
      <Link href={href} className="text-accent underline underline-offset-4 hover:text-white transition-colors" {...props} />
    );
  },
  ul: (props: HTMLAttributes<HTMLUListElement>) => (
    <ul className="list-none space-y-3 mb-6" {...props} />
  ),
  li: ({ children, ...props }: HTMLAttributes<HTMLLIElement>) => (
    <li className="flex gap-3 text-zinc-400 leading-relaxed" {...props}>
      <span className="text-accent mt-0.5">›</span>
      <span>{children}</span>
    </li>
  ),
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="border-l-2 border-accent pl-6 my-8 text-zinc-300 italic leading-relaxed" {...props} />
  ),
  code: (props: HTMLAttributes<HTMLElement>) => (
    <code className="bg-surface-mid text-accent px-1.5 py-0.5 text-sm font-mono" {...props} />
  ),
  pre: (props: HTMLAttributes<HTMLPreElement>) => (
    <pre className="ghost bg-surface-low p-6 overflow-x-auto text-sm font-mono text-zinc-300 mb-6" {...props} />
  ),
  strong: (props: HTMLAttributes<HTMLElement>) => <strong className="text-white font-bold" {...props} />,
};

export default function MdxContent({ source }: { source: string }) {
  return <MDXRemote source={source} components={components} />;
}

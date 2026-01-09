import ReactMarkdown from "react-markdown"

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      skipHtml
      components={{
        a: ({ children, href, ...props }) => {
          const childText = Array.isArray(children) ? children[0] : children
          const isCitation = typeof childText === 'string' && /^\[\d+\]$/.test(childText)
          return (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={isCitation
                ? "inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 mx-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 rounded hover:bg-blue-200 dark:hover:bg-blue-800 no-underline transition-colors align-middle"
                : "text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
              }
            >
              {children}
            </a>
          )
        },
        p: ({ children }) => (
          <p className="my-4 leading-7">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="my-4 pl-6 space-y-2 list-disc">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 pl-6 space-y-2 list-decimal">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-7 pl-2">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        h1: ({ children }) => (
          <h1 className="text-lg font-semibold mt-6 mb-3 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-base font-semibold mt-5 mb-2 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-4 mb-2 text-foreground">{children}</h3>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-muted-foreground/30 pl-4 my-4 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

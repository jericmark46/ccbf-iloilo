import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { isRichHtml, sanitizeRich } from '../../lib/richText';

export function Markdown({ children, className }) {
  return (
    <div className={cn('prose-church', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href = '', children: linkChildren, ...props }) => {
            const internal = href.startsWith('/') && !href.startsWith('//');
            if (internal) {
              return (
                <Link to={href} {...props}>
                  {linkChildren}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noreferrer noopener" {...props}>
                {linkChildren}
              </a>
            );
          },
          img: ({ src = '', alt = '' }) => (
            <img src={src} alt={alt} loading="lazy" className="my-6 w-full rounded-3xl border border-line" />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function RichContent({ children = '', className }) {
  const navigate = useNavigate();
  const html = useMemo(() => (isRichHtml(children) ? sanitizeRich(children) : null), [children]);

  if (!children?.trim()) return null;

  if (html === null) return <Markdown className={className}>{children}</Markdown>;

  const onClick = (event) => {
    const anchor = event.target.closest?.('a');
    const href = anchor?.getAttribute('href');
    if (href?.startsWith('/') && !href.startsWith('//')) {
      event.preventDefault();
      navigate(href);
    }
  };

  return (
    <div
      className={cn('prose-church rich-content', className)}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

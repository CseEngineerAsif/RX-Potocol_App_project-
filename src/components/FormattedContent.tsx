import React, { useMemo } from 'react';
import { sanitizeRichText, formatInitialRichText } from '../utils/sanitize';

interface FormattedContentProps {
  content: string;
  variant?: 'text' | 'warning';
  className?: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({
  content,
  variant = 'text',
  className = '',
}) => {
  const sanitizedHtml = useMemo(() => {
    if (!content) return '';
    return sanitizeRichText(formatInitialRichText(content));
  }, [content]);

  if (!sanitizedHtml) {
    return <span className="text-slate-400 italic">No content</span>;
  }

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A' || target.closest('a')) {
      e.stopPropagation();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`rich-text-content ${
        variant === 'warning'
          ? 'text-amber-950 dark:text-amber-100 font-medium'
          : 'text-slate-700 dark:text-slate-200'
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};


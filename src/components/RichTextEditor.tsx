import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  RemoveFormatting,
  X,
  Check,
} from 'lucide-react';
import { sanitizeRichText, formatInitialRichText } from '../utils/sanitize';

interface RichTextEditorProps {
  value: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  variant?: 'text' | 'warning';
  minHeight?: string;
  maxHeight?: string;
  id?: string;
}

interface FormatStates {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  bulletList: boolean;
  numberedList: boolean;
  isHeading1: boolean;
  isHeading2: boolean;
  isLink: boolean;
}

interface MenuPosition {
  top: number;
  left: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content...',
  variant = 'text',
  minHeight = '140px',
  maxHeight = '460px',
  id,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);
  const savedSelectionRangeRef = useRef<Range | null>(null);

  const [isEmpty, setIsEmpty] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({ top: 0, left: 0 });

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [activeLinkNode, setActiveLinkNode] = useState<HTMLAnchorElement | null>(null);

  const [formatStates, setFormatStates] = useState<FormatStates>({
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    numberedList: false,
    isHeading1: false,
    isHeading2: false,
    isLink: false,
  });

  // Check if content is blank
  const checkIsEmpty = (html: string) => {
    const stripped = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    return stripped.length === 0;
  };

  // Synchronize external value with editor innerHTML
  useEffect(() => {
    if (!editorRef.current) return;

    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    const currentDomHtml = editorRef.current.innerHTML;
    const formatted = formatInitialRichText(value || '');

    if (currentDomHtml !== formatted) {
      editorRef.current.innerHTML = formatted;
      setIsEmpty(checkIsEmpty(formatted));
    }
  }, [value]);

  // Helper to find ancestor tag
  const findParentTag = (node: Node | null, tagNames: string[]): HTMLElement | null => {
    let curr = node;
    while (curr && curr !== editorRef.current) {
      if (curr.nodeType === Node.ELEMENT_NODE) {
        const el = curr as HTMLElement;
        if (tagNames.includes(el.tagName.toLowerCase())) {
          return el;
        }
      }
      curr = curr.parentNode;
    }
    return null;
  };

  // Save current selection range inside the editor
  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const anchor = selection.anchorNode;
      if (anchor && editorRef.current.contains(anchor)) {
        savedSelectionRangeRef.current = selection.getRangeAt(0).cloneRange();
      }
    }
  }, []);

  // Restore current selection range before executing commands
  const restoreSelection = useCallback(() => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;

    if (selection.rangeCount > 0 && selection.anchorNode && editorRef.current.contains(selection.anchorNode)) {
      return;
    }

    if (savedSelectionRangeRef.current) {
      try {
        selection.removeAllRanges();
        selection.addRange(savedSelectionRangeRef.current);
      } catch {
        editorRef.current.focus();
      }
    } else {
      editorRef.current.focus();
    }
  }, []);

  // Collision-aware positioning calculation
  const updateMenuPosition = useCallback(() => {
    if (!editorRef.current) return;
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      if (!linkModalOpen) {
        setIsMenuVisible(false);
      }
      return;
    }

    const anchorNode = selection.anchorNode;
    if (!anchorNode || !editorRef.current.contains(anchorNode)) {
      if (!linkModalOpen) {
        setIsMenuVisible(false);
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    if (!selectedText && !linkModalOpen) {
      setIsMenuVisible(false);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && !linkModalOpen) {
      setIsMenuVisible(false);
      return;
    }

    // Save selection
    savedSelectionRangeRef.current = range.cloneRange();

    // Viewport dimensions (taking virtual viewport / mobile keyboard into account)
    const vpWidth = window.visualViewport?.width || window.innerWidth;
    const vpHeight = window.visualViewport?.height || window.innerHeight;
    const vpTop = window.visualViewport?.offsetTop || 0;
    const vpLeft = window.visualViewport?.offsetLeft || 0;

    // Detect touch / mobile environment
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 768);

    // Dynamic measurement of menu dimensions
    const menuWidth = menuRef.current?.offsetWidth || (linkModalOpen ? 320 : 410);
    const menuHeight = menuRef.current?.offsetHeight || (linkModalOpen ? 120 : 48);
    const margin = 10;
    const estimatedNativeMenuHeight = 52; // Height of iOS/Android native Copy/Paste callout bar

    // Horizontal position: Center on selection, then clamp within viewport boundaries
    const selectionCenter = rect.left + rect.width / 2;
    let left = selectionCenter - menuWidth / 2;
    const minLeft = vpLeft + margin;
    const maxLeft = vpLeft + vpWidth - menuWidth - margin;
    left = Math.max(minLeft, Math.min(maxLeft, left));

    // Vertical position calculation with Native Menu Collision Avoidance:
    let top = 0;

    if (isTouch) {
      /**
       * Mobile / Touch Strategy:
       * The mobile OS natively places its Copy/Paste/Select All callout bar immediately ABOVE the selection top.
       * 
       * 1. PREFERRED: Place custom formatting menu BELOW the selection (rect.bottom + 14px).
       *    Layout:
       *      [ Native Copy/Paste Bar ] (Above selection)
       *      [ Selected Text ]
       *      [ Custom Formatting Menu ] (Below selection)
       *    --> Result: Zero overlap! Both menus are fully visible and independently accessible.
       * 
       * 2. If space BELOW the selection is tight (e.g. selection is near bottom of viewport / keyboard up):
       *    Check if there is room ABOVE the native callout bar (rect.top - nativeHeight - menuHeight - 10px).
       *    If so, place custom menu above the native bar.
       * 
       * 3. Fallback: If both are tight, dock cleanly at safe bottom or top margin of viewport.
       */
      const spaceBelow = vpTop + vpHeight - (rect.bottom + 14 + menuHeight);
      const spaceAboveNative = rect.top - estimatedNativeMenuHeight - menuHeight - 12 - vpTop;

      if (spaceBelow >= 0) {
        // Option 1: Place below selection
        top = rect.bottom + 14;
      } else if (spaceAboveNative >= 0) {
        // Option 2: Place above native menu
        top = rect.top - estimatedNativeMenuHeight - menuHeight - 10;
      } else {
        // Option 3: Viewport clamp (dock near bottom above keyboard or near top)
        if (rect.top - vpTop > vpHeight / 2) {
          top = Math.max(vpTop + margin, rect.top - menuHeight - estimatedNativeMenuHeight);
        } else {
          top = Math.min(vpTop + vpHeight - menuHeight - margin, rect.bottom + 10);
        }
      }
    } else {
      /**
       * Desktop / Mouse Strategy:
       * Native copy/paste callouts do not appear on standard text drag selection (only on right click).
       * Prefer placing directly above the selection, or flip below if near top of window.
       */
      const spaceAbove = rect.top - menuHeight - 12 - vpTop;
      if (spaceAbove >= 0) {
        top = rect.top - menuHeight - 12;
      } else {
        top = rect.bottom + 12;
      }
    }

    // Safety clamp within viewport top & bottom
    const minTop = vpTop + margin;
    const maxTop = vpTop + vpHeight - menuHeight - margin;
    top = Math.max(minTop, Math.min(maxTop, top));

    setMenuPosition({ top, left });
    setIsMenuVisible(true);
  }, [linkModalOpen]);

  // Update active formatting states based on selection
  const updateFormatStates = useCallback(() => {
    saveSelection();
    if (!editorRef.current) return;

    try {
      const selection = window.getSelection();
      let isH1 = false;
      let isH2 = false;
      let isLnk = false;

      if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
        const anchor = selection.anchorNode;
        const blockNode = findParentTag(anchor, ['h1', 'h2', 'p', 'div']);
        if (blockNode) {
          const tag = blockNode.tagName.toLowerCase();
          isH1 = tag === 'h1';
          isH2 = tag === 'h2';
        }

        const linkEl = findParentTag(anchor, ['a']) as HTMLAnchorElement | null;
        if (linkEl) {
          isLnk = true;
        }
      }

      setFormatStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        bulletList: document.queryCommandState('insertUnorderedList'),
        numberedList: document.queryCommandState('insertOrderedList'),
        isHeading1: isH1,
        isHeading2: isH2,
        isLink: isLnk,
      });
    } catch {
      // Ignore queryCommandState fallback errors
    }

    updateMenuPosition();
  }, [saveSelection, updateMenuPosition]);

  // Dispatch change upwards
  const emitChange = () => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    const sanitized = sanitizeRichText(rawHtml);
    const empty = checkIsEmpty(sanitized);
    setIsEmpty(empty);

    isInternalChangeRef.current = true;
    onChange(empty ? '' : sanitized);
    updateFormatStates();
  };

  // Handle format button execution without destroying user text selection
  const executeCommand = (command: string, arg?: string) => {
    restoreSelection();
    document.execCommand(command, false, arg);
    emitChange();
  };

  // Toggle Heading Level (H1 or H2)
  const toggleHeading = (level: 'h1' | 'h2') => {
    restoreSelection();
    const isCurrentlyActive = level === 'h1' ? formatStates.isHeading1 : formatStates.isHeading2;
    const targetTag = isCurrentlyActive ? '<p>' : `<${level}>`;
    document.execCommand('formatBlock', false, targetTag);
    emitChange();
  };

  // Clear Formatting from current selection / block
  const clearFormatting = () => {
    restoreSelection();
    // 1. Remove inline styles
    document.execCommand('removeFormat', false, undefined);
    // 2. Remove links
    document.execCommand('unlink', false, undefined);
    // 3. Reset heading blocks back to normal paragraph
    if (formatStates.isHeading1 || formatStates.isHeading2) {
      document.execCommand('formatBlock', false, '<p>');
    }
    // 4. Reset lists if inside a list
    if (formatStates.bulletList) {
      document.execCommand('insertUnorderedList', false, undefined);
    }
    if (formatStates.numberedList) {
      document.execCommand('insertOrderedList', false, undefined);
    }
    emitChange();
  };

  // Open Link Dialog near selection
  const openLinkModal = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    let selectedStr = '';
    let existingLink: HTMLAnchorElement | null = null;

    if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      savedSelectionRangeRef.current = range.cloneRange();
      selectedStr = range.toString();
      existingLink = findParentTag(selection.anchorNode, ['a']) as HTMLAnchorElement | null;
    } else if (savedSelectionRangeRef.current) {
      selectedStr = savedSelectionRangeRef.current.toString();
    }

    if (existingLink) {
      setActiveLinkNode(existingLink);
      setLinkText(existingLink.textContent || '');
      setLinkUrl(existingLink.getAttribute('href') || '');
    } else {
      setActiveLinkNode(null);
      setLinkText(selectedStr);
      setLinkUrl('');
    }

    setLinkModalOpen(true);
    setIsMenuVisible(true);
  };

  // Apply Link
  const applyLink = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editorRef.current) return;

    let targetUrl = linkUrl.trim();
    if (!targetUrl) {
      setLinkModalOpen(false);
      return;
    }

    // Auto prepend https:// if missing protocol and looks like a URL
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    // Safety: forbid javascript: URLs
    if (/^javascript:/i.test(targetUrl)) {
      setLinkModalOpen(false);
      return;
    }

    const displayText = linkText.trim() || targetUrl;

    if (activeLinkNode && editorRef.current.contains(activeLinkNode)) {
      activeLinkNode.setAttribute('href', targetUrl);
      activeLinkNode.textContent = displayText;
    } else {
      restoreSelection();
      const linkHtml = `<a href="${targetUrl}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
    }

    setLinkModalOpen(false);
    setActiveLinkNode(null);
    emitChange();
  };

  // Remove existing link
  const removeLink = () => {
    if (activeLinkNode && editorRef.current?.contains(activeLinkNode)) {
      const parent = activeLinkNode.parentNode;
      while (activeLinkNode.firstChild) {
        parent?.insertBefore(activeLinkNode.firstChild, activeLinkNode);
      }
      parent?.removeChild(activeLinkNode);
      emitChange();
    } else {
      restoreSelection();
      document.execCommand('unlink');
      emitChange();
    }
    setLinkModalOpen(false);
    setActiveLinkNode(null);
  };

  // Handle keyboard shortcuts (Ctrl/Cmd + Z, Y, B, I, U, K)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          executeCommand('redo');
        } else {
          e.preventDefault();
          executeCommand('undo');
        }
      } else if (key === 'y') {
        e.preventDefault();
        executeCommand('redo');
      } else if (key === 'b') {
        e.preventDefault();
        executeCommand('bold');
      } else if (key === 'i') {
        e.preventDefault();
        executeCommand('italic');
      } else if (key === 'u') {
        e.preventDefault();
        executeCommand('underline');
      } else if (key === 'k') {
        e.preventDefault();
        openLinkModal();
      }
    }
  };

  // Handle typing/input in contentEditable
  const handleInput = () => {
    emitChange();
  };

  // Handle Paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    if (text) {
      const lines = text.split(/\r?\n/);
      if (lines.length > 1) {
        const html = lines
          .map((line) => {
            const trimmed = line.trim();
            return trimmed ? `<p>${trimmed}</p>` : '<p><br></p>';
          })
          .join('');
        document.execCommand('insertHTML', false, html);
      } else {
        document.execCommand('insertText', false, text);
      }
      handleInput();
    }
  };

  // Selection change listener for desktop & mobile
  useEffect(() => {
    const handleSelection = () => {
      // Small timeout allows browser selection coords to stabilize after mouseup/touchend
      setTimeout(() => {
        updateFormatStates();
      }, 30);
    };

    const handleScrollOrResize = () => {
      if (isMenuVisible) {
        updateMenuPosition();
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleScrollOrResize);
      window.visualViewport.addEventListener('scroll', handleScrollOrResize);
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelection);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleScrollOrResize);
        window.visualViewport.removeEventListener('scroll', handleScrollOrResize);
      }
    };
  }, [updateFormatStates, updateMenuPosition, isMenuVisible]);

  const isWarning = variant === 'warning';

  // Formatting button styling inside the contextual floating menu
  const getMenuButtonClass = (isActive: boolean = false) => {
    const base =
      'flex items-center justify-center min-w-[36px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] px-2 py-1.5 rounded-xl transition-all touch-manipulation cursor-pointer select-none text-xs font-semibold';
    if (isActive) {
      return `${base} bg-blue-600 text-white shadow-xs`;
    }
    return `${base} text-slate-200 hover:text-white hover:bg-slate-800/80 active:bg-slate-700`;
  };

  return (
    <div className="relative w-full">
      {/* Clean Editor Container with No Permanent Toolbar */}
      <div
        className={`rounded-2xl border transition-all relative flex flex-col ${
          isWarning
            ? 'bg-amber-50/40 border-amber-200/90 dark:bg-amber-950/20 dark:border-amber-800/70 focus-within:ring-2 focus-within:ring-amber-500/50 focus-within:border-amber-400'
            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-400'
        }`}
      >
        {/* Editable Content Area */}
        <div
          id={id}
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onKeyUp={updateFormatStates}
          onMouseUp={updateFormatStates}
          onTouchEnd={updateFormatStates}
          onFocus={updateFormatStates}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          data-empty={isEmpty}
          style={{ minHeight, maxHeight }}
          className={`rich-text-editor flex-1 p-4 text-sm outline-none focus:outline-none overflow-y-auto overscroll-contain rounded-2xl ${
            isWarning
              ? 'text-amber-950 dark:text-amber-100 font-medium'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        />
      </div>

      {/* Floating Contextual Formatting Menu (Appears ONLY on text selection) */}
      {isMenuVisible && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 9999,
          }}
          onMouseDown={(e) => {
            // Prevent dropping selection when interacting with the menu container
            e.preventDefault();
            e.stopPropagation();
          }}
          className="animate-in fade-in zoom-in-95 duration-100 ease-out select-none"
        >
          {/* Link Popover Mode */}
          {linkModalOpen ? (
            <div className="bg-slate-900/98 text-white border border-slate-700/90 shadow-2xl backdrop-blur-md rounded-2xl p-3 min-w-[300px] sm:min-w-[340px] max-w-[calc(100vw-24px)] space-y-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                  {activeLinkNode ? 'Edit Link' : 'Add Link'}
                </span>
                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setLinkModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyLink(e);
                    } else if (e.key === 'Escape') {
                      setLinkModalOpen(false);
                    }
                  }}
                  placeholder="https://example.com"
                  autoFocus
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                {activeLinkNode && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={removeLink}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-950/50 rounded-lg mr-auto cursor-pointer"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    Unlink
                  </button>
                )}
                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setLinkModalOpen(false)}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={applyLink}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply
                </button>
              </div>
            </div>
          ) : (
            /* Contextual Formatting Options Pill */
            <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md rounded-2xl p-1 sm:p-1.5 flex items-center gap-0.5 max-w-[calc(100vw-24px)] overflow-x-auto no-scrollbar touch-pan-x">
              {/* Undo */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => executeCommand('undo')}
                className={getMenuButtonClass(false)}
                title="Undo"
                aria-label="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>

              {/* Redo */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => executeCommand('redo')}
                className={getMenuButtonClass(false)}
                title="Redo"
                aria-label="Redo"
              >
                <Redo2 className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="h-5 w-px bg-slate-700/80 mx-0.5 shrink-0" />

              {/* Bold */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => executeCommand('bold')}
                className={getMenuButtonClass(formatStates.bold)}
                title="Bold (Ctrl+B)"
                aria-label="Format Bold"
              >
                <Bold className="w-4 h-4" />
              </button>

              {/* Italic */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => executeCommand('italic')}
                className={getMenuButtonClass(formatStates.italic)}
                title="Italic (Ctrl+I)"
                aria-label="Format Italic"
              >
                <Italic className="w-4 h-4" />
              </button>

              {/* Underline */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => executeCommand('underline')}
                className={getMenuButtonClass(formatStates.underline)}
                title="Underline (Ctrl+U)"
                aria-label="Format Underline"
              >
                <UnderlineIcon className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="h-5 w-px bg-slate-700/80 mx-0.5 shrink-0" />

              {/* H1 */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => toggleHeading('h1')}
                className={getMenuButtonClass(formatStates.isHeading1)}
                title="Heading 1"
                aria-label="Heading 1"
              >
                <span className="text-xs font-bold">H1</span>
              </button>

              {/* H2 */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => toggleHeading('h2')}
                className={getMenuButtonClass(formatStates.isHeading2)}
                title="Heading 2"
                aria-label="Heading 2"
              >
                <span className="text-xs font-bold">H2</span>
              </button>

              {/* Divider */}
              <div className="h-5 w-px bg-slate-700/80 mx-0.5 shrink-0" />

              {/* Bullet List */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => executeCommand('insertUnorderedList')}
                className={getMenuButtonClass(formatStates.bulletList)}
                title="Bullet List"
                aria-label="Bullet List"
              >
                <List className="w-4 h-4" />
              </button>

              {/* Numbered List */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => executeCommand('insertOrderedList')}
                className={getMenuButtonClass(formatStates.numberedList)}
                title="Numbered List"
                aria-label="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              {/* Divider */}
              <div className="h-5 w-px bg-slate-700/80 mx-0.5 shrink-0" />

              {/* Link */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={openLinkModal}
                className={getMenuButtonClass(formatStates.isLink)}
                title="Link"
                aria-label="Link"
              >
                <LinkIcon className="w-4 h-4" />
              </button>

              {/* Clear Formatting */}
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={clearFormatting}
                className={getMenuButtonClass(false)}
                title="Clear Formatting (Tx)"
                aria-label="Clear Formatting"
              >
                <RemoveFormatting className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

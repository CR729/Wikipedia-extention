import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface HighlightTooltip {
  x: number;
  y: number;
  text: string;
}

const STORAGE_KEY_PREFIX = 'wikitube-highlights-';

const WikiHighlighter: React.FC = () => {
  const [tooltip, setTooltip] = useState<HighlightTooltip | null>(null);
  
  const getStorageKey = () => `${STORAGE_KEY_PREFIX}${window.location.pathname}`;

  // --- 1. Load Highlights on Page Load ---
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedHighlights = JSON.parse(localStorage.getItem(getStorageKey()) || '[]');
      if (savedHighlights.length > 0) {
        applyHighlightsToDOM(savedHighlights);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // --- 2. Detect User Selection ---
  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if ((event.target as HTMLElement).closest('.wikitube-highlight-btn')) {
        return;
      }

      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed) {
        setTooltip(null);
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        setTooltip(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (rect.width === 0 && rect.height === 0) return;

      setTooltip({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY - 45,
        text: text
      });
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // --- 3. HELPER: Remove Existing Highlights ---
  const removeHighlightsFromDOM = () => {
    const contentBody = document.getElementById('bodyContent');
    if (!contentBody) return;

    // Find all existing highlight spans
    const existingSpans = contentBody.querySelectorAll('.wikitube-highlight');
    
    existingSpans.forEach(span => {
      const parent = span.parentNode;
      if (parent) {
        // Replace the span with a plain text node containing its content
        const textNode = document.createTextNode(span.textContent || '');
        parent.replaceChild(textNode, span);
        // Normalize joins adjacent text nodes back together so future searches work
        parent.normalize(); 
      }
    });
  };

  // --- 4. Save Logic (Replace Mode) ---
  const saveHighlight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!tooltip) return;

    // 1. Clear DOM: Remove old highlights visually
    removeHighlightsFromDOM();

    // 2. Clear Storage: Overwrite with the NEW text only
    const currentKey = getStorageKey();
    const newSaved = [tooltip.text]; // Array with only the new item
    localStorage.setItem(currentKey, JSON.stringify(newSaved));
    
    // 3. Apply New: Highlight the new text
    applyHighlightsToDOM(newSaved);

    // 4. Cleanup UI
    window.getSelection()?.removeAllRanges();
    setTooltip(null);
  };

  /**
   * Scans DOM and highlights occurrences.
   */
  const applyHighlightsToDOM = (textsToHighlight: string[]) => {
    const contentBody = document.getElementById('bodyContent');
    const extensionRoot = document.getElementById('wikitube-extension-root');
    
    if (!contentBody) return;

    textsToHighlight.forEach(searchText => {
      if (!searchText) return;

      const walker = document.createTreeWalker(
        contentBody, 
        NodeFilter.SHOW_TEXT, 
        {
          acceptNode: (node) => {
            if (extensionRoot && extensionRoot.contains(node)) return NodeFilter.FILTER_REJECT;
            if (node.parentElement?.className === 'wikitube-highlight') return NodeFilter.FILTER_REJECT;
            if (!node.nodeValue?.trim()) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );

      const nodesToProcess: { node: Text; indices: number[] }[] = [];
      let currentNode = walker.nextNode();

      while (currentNode) {
        const nodeValue = currentNode.nodeValue;
        if (nodeValue && nodeValue.includes(searchText)) {
          const indices: number[] = [];
          let startIndex = 0;
          let index = nodeValue.indexOf(searchText, startIndex);

          while (index !== -1) {
            indices.push(index);
            startIndex = index + searchText.length;
            index = nodeValue.indexOf(searchText, startIndex);
          }
          
          if (indices.length > 0) {
            nodesToProcess.push({ node: currentNode as Text, indices });
          }
        }
        currentNode = walker.nextNode();
      }

      nodesToProcess.reverse().forEach(({ node, indices }) => {
        indices.reverse().forEach(index => {
          node.splitText(index + searchText.length);
          const matchNode = node.splitText(index);
          
          const span = document.createElement('span');
          span.className = 'wikitube-highlight';
          span.style.backgroundColor = '#fff740';
          span.style.color = '#000';
          span.textContent = matchNode.textContent;
          
          node.parentNode?.replaceChild(span, matchNode);
        });
      });
    });
  };

  if (!tooltip) return null;

  return createPortal(
    <div
      className="wikitube-highlight-btn"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={saveHighlight}
      style={{
        position: 'absolute',
        top: tooltip.y,
        left: tooltip.x,
        zIndex: 10000,
        backgroundColor: '#202124',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '14px',
        fontFamily: 'sans-serif',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        pointerEvents: 'auto',
      }}
    >
      <span>🖍️</span>
      <span>Highlight</span>
    </div>,
    document.body
  );
};

export default WikiHighlighter;
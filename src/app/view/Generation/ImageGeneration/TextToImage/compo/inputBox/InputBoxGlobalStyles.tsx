"use client";

import React from "react";

/** Global CSS for spell-check, placeholders, history grid, dropdowns — unchanged from monolithic InputBox. */
export function InputBoxGlobalStyles() {
  return (
    <style jsx global>{`
      /* Remove underline from placeholder across browsers */
      textarea::placeholder {
        text-decoration: none !important;
      }
      textarea::-webkit-input-placeholder {
        text-decoration: none !important;
      }
      textarea:-ms-input-placeholder {
        text-decoration: none !important;
      }
      textarea::-ms-input-placeholder {
        text-decoration: none !important;
      }

      /* Keep default browser spellcheck underlines without forcing decoration */
      textarea[spellcheck="true"] {
        text-decoration: none;
      }

      /* Placeholder for contentEditable */
      [contenteditable][data-placeholder]:empty::before {
        content: attr(data-placeholder);
        color: rgba(255, 255, 255, 0.5);
        pointer-events: none;
      }

      /* Smooth fade-in-up animation for new generations */
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
      }

      /* Prevent layout shift - ensure flex items don't shrink or grow */
      .flex.flex-wrap > * {
        flex-shrink: 0 !important;
        flex-grow: 0 !important;
      }

      /* Masonry cards */
      .image-item {
        display: inline-block;
        width: 100%;
        min-width: 0;
        position: relative;
        break-inside: avoid;
        -webkit-column-break-inside: avoid;
        page-break-inside: avoid;
        margin-bottom: 4px;
      }

      @media (min-width: 768px) {
        .image-item {
          width: 100%;
          margin-bottom: 12px;
        }
      }

      /* Masonry columns preserve each image's natural ratio. */
      .image-grid {
        column-count: 2;
        column-gap: 4px;
      }

      @media (min-width: 768px) {
        .image-grid {
          column-count: 5;
          column-gap: 12px;
        }
      }

      @media (min-width: 1024px) {
        .image-grid {
          column-count: 6;
          column-gap: 4px;
          transition: column-gap 0.5s ease-in-out;
        }

        .assistant-open .image-grid {
          column-count: 5;
        }

        .image-item {
          margin-bottom: 4px;
        }
      }

      /* Allow dropdowns to overflow scrollable containers */
      .dropdown-container {
        overflow: visible !important;
        position: relative;
      }

      .dropdown-container > div[class*="absolute"] {
        position: absolute !important;
        z-index: 9999 !important;
      }
    `}</style>
  );
}

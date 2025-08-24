/**
 * floating.js v1.0 | Custom floating hover boxes
 * 
 * {% sethover name:<name> %}
 * hover content
 * {% endsethover %}
 * 
 * {% hover name:<name> %}
 * display text
 * {% endhover %}
 * 
 * {% explain <display> %}
 * content (hover text)
 * {% endexplain %}
 */

'use strict';

// Global storage for hover content
const hoverContent = {};

// Helper function to generate a unique ID for each hover element
function generateUniqueId() {
    return 'hover-' + Math.random().toString(36).substring(2, 11);
}

// Process the hover content to ensure it displays correctly with enhanced formatting
function processHoverContent(content, hexo) {
    if (!content || content.trim() === '') {
        return '';
    }

    // Render the content with markdown
    const rendered = hexo.render.renderSync({ text: content, engine: 'markdown' });

    // For hover content, we want to keep the structure but optimize it for tooltips
    // Remove outer <p> tags only if there's just one paragraph
    // This preserves formatting for multi-paragraph content
    if (rendered.match(/<p>.*?<\/p>/gs)?.length === 1) {
        return rendered.replace(/^\s*<p>([\s\S]*)<\/p>\s*$/, '$1');
    }

    return rendered;
}

// sethover tag: stores content for later use
function sethover(ctx) {
    return function (args, content) {
        args = ctx.args.map(args, ['name'])
        // Extract name parameter
        let name = args.name;

        if (name) {
            // Store the processed content with the name as key
            hoverContent[name] = processHoverContent(content, ctx);
        }

        // This tag doesn't output anything visible
        return '';
    };
}

// hover tag: references stored content by name
function hover(ctx) {
    return function (args, content) {
        args = ctx.args.map(args, ['name'])
        // Extract name parameter
        let name = args.name;

        if (!name || !hoverContent[name]) {
            return `<span style="color:red">Error: No hover content found for name '${name}'.</span>`;
        }

        const uniqueId = generateUniqueId();
        const displayText = processHoverContent(content, ctx);
        const storedContent = hoverContent[name];

        // Instead of using a div inside the custom element, we'll use data attributes
        // and generate the hover content with JavaScript later
        let result = `<span id="${uniqueId}" class="floating-hover-target" data-hover-content="${encodeURIComponent(storedContent)}">${displayText}</span>`;

        return result;
    };
}

// explain tag: simpler version that doesn't need pre-stored content
function explain(ctx) {
    return function (args, content) {
        // Extract content parameter
        args = ctx.args.map(args, [''], ['display'])
        let hoverText = content;

        if (!hoverText) {
            return `<span style="color:red">Error: No content provided in explain tag.</span>`;
        }

        const uniqueId = generateUniqueId();
        let displayText = processHoverContent(args.display, ctx);
        const processedHoverText = processHoverContent(hoverText, ctx);

        // Use data attributes instead of nested divs
        let result = `<span id="${uniqueId}" class="floating-hover-target" data-hover-content="${encodeURIComponent(processedHoverText)}">${displayText}</span>`;

        return result;
    };
}

// Add CSS styles to the page
function injectCSS(hexo) {
    hexo.extend.injector.register('head_end', () => {
        return `<style>
      /* Apply styles to the hover target class */
      .floating-hover-target {
        font-weight: 500;
        position: relative;
        display: inline;
        cursor: help;
        background: linear-gradient(to bottom, transparent 0%, transparent 90%, rgba(var(--theme-color), 0.3) 90%, rgba(var(--theme-color), 0.3) 100%);
        padding: 0 2px;
        border-radius: 2px;
        transition: all 0.2s ease;
        color: var(--text-color, #333);
        border-bottom: 1px dotted rgba(var(--theme-color, 0, 0, 0), 0.5);
        text-decoration: none;
        outline-style: dashed;
      }
      
      .floating-hover-target:hover {
        background: linear-gradient(to bottom, rgba(var(--theme-color), 0.08) 0%, rgba(var(--theme-color), 0.08) 90%, rgba(var(--theme-color), 0.5) 90%, rgba(var(--theme-color), 0.5) 100%);
      }
      
      .floating-hover-target::after {
        content: var(--hover-indicator, "");
        font-size: 0.85em;
        vertical-align: super;
        opacity: 0.6;
        margin-left: 1px;
        transition: opacity 0.2s ease;
      }
      
      /* Different indicator styles - can be set via CSS variables */
      :root {
        --hover-indicator: ""; /* Default indicator */
      }
      
      .floating-hover-content {
        position: fixed;  /* Changed from absolute to fixed */
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        background-color: var(--card-background, #fff);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10), 0 4px 8px -4px rgba(0, 0, 0, 0.12);
        padding: 16px 20px;
        width: max-content;
        max-width: 380px;
        z-index: 9999;  /* Increased z-index value */
        left: 0;
        top: 0;  /* Will be set dynamically by JS */
        overflow-y: auto;
        max-height: 400px;
        border: 1px solid rgba(0, 0, 0, 0.06);
        font-weight: normal;
        color: var(--text-color, #333);
        font-size: 0.95em;
        line-height: 1.6;
        pointer-events: auto;  /* Ensures hover content can be interacted with */
        backdrop-filter: blur(4px);
      }
      
      .floating-hover-content::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        background-color: var(--card-background, #fff);
        transform: rotate(45deg);
        z-index: -1; /* Place behind the content */
      }
      
      /* Arrow positioning based on hover position */
      .floating-hover-content.positioned-bottom::before {
        top: -6px;
        left: 20px;
        border-left: 1px solid rgba(0, 0, 0, 0.06);
        border-top: 1px solid rgba(0, 0, 0, 0.06);
      }
      
      .floating-hover-content.positioned-top::before {
        bottom: -6px;
        left: 20px;
        border-right: 1px solid rgba(0, 0, 0, 0.06);
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
      }
      
      .floating-hover-content.positioned-right::before {
        left: auto;
        right: 20px;
      }
      
      .floating-hover-content p {
        margin: 0.8em 0;
      }
      
      .floating-hover-content p:first-child {
        margin-top: 0;
      }
      
      .floating-hover-content p:last-child {
        margin-bottom: 0;
      }
      
      /* Show hover content when target is hovered */
      .floating-hover-target:hover .floating-hover-content {
        visibility: visible;
        opacity: 1;
      }
      
      /* Improve the indicator appearance on hover */
      .floating-hover-target:hover::after {
        opacity: 1;
      }
      
      /* Dark mode adjustments */
      @media (prefers-color-scheme: dark), (html[data-theme='dark']) {
        .floating-hover-content {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15), 0 3px 6px -4px rgba(0, 0, 0, 0.25);
        }
      }
      
      /* Fix position for hover boxes on smaller screens */
      @media (max-width: 768px) {
        .floating-hover-content {
          max-width: 85vw; /* Limit width on mobile */
        }
        
        /* Don't center the hover boxes on mobile as they're now positioned from JS */
        .floating-hover-content.positioned-centered::before {
          left: 50%;
          margin-left: -6px;
        }
        
        /* Adjust the info indicator to be more prominent on mobile */
        .floating-hover-target::after {
          font-size: 0.9em;
          opacity: 0.8;
        }
      }
      
      /* Make the hover content work with touch devices */
      @media (pointer: coarse) {
        .floating-hover-target {
          -webkit-tap-highlight-color: rgba(0,0,0,0);
        }
        
        /* Give feedback when tapping */
        .floating-hover-target:active {
          background: linear-gradient(to bottom, transparent 0%, transparent 90%, rgba(var(--theme-color), 0.7) 90%, rgba(var(--theme-color), 0.7) 100%);
        }
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Create a container for all hover content elements at the document root
        const hoverContainer = document.createElement('div');
        hoverContainer.id = 'floating-hover-container';
        hoverContainer.style.position = 'fixed';
        hoverContainer.style.top = '0';
        hoverContainer.style.left = '0';
        hoverContainer.style.width = '0';
        hoverContainer.style.height = '0';
        hoverContainer.style.overflow = 'visible';
        hoverContainer.style.pointerEvents = 'none'; // Don't interfere with page interaction
        hoverContainer.style.zIndex = '9999';
        document.body.appendChild(hoverContainer);
        
        // Create the hover content elements dynamically
        const hoverTargets = document.querySelectorAll('.floating-hover-target');
        
        // Track currently active hover element
        let activeHover = null;
        
        hoverTargets.forEach(target => {
          const hoverContent = target.getAttribute('data-hover-content');
          
          if (!hoverContent) return;
          
          // Create hover content div but append it to the container instead of the target
          const hoverDiv = document.createElement('div');
          hoverDiv.className = 'floating-hover-content';
          hoverDiv.innerHTML = decodeURIComponent(hoverContent);
          hoverDiv.style.pointerEvents = 'auto'; // Make the hover content interactive
          hoverContainer.appendChild(hoverDiv);
          
          // Store a reference to the hover div on the target
          target.hoverDiv = hoverDiv;
          
          // Position hover content based on target position
          function positionHoverContent() {
            const targetRect = target.getBoundingClientRect();
            const hoverRect = hoverDiv.getBoundingClientRect();
            const padding = 16; // Safe distance from viewport edges
            
            // Reset any previous positioning
            hoverDiv.style.left = '';
            hoverDiv.style.right = '';
            hoverDiv.style.top = '';
            hoverDiv.style.bottom = '';
            
            // Remove any previous position classes
            hoverDiv.classList.remove('positioned-left', 'positioned-right', 'positioned-top', 'positioned-bottom');
            
            // Default positioning below the target
            hoverDiv.style.left = targetRect.left + 'px';
            hoverDiv.style.top = (targetRect.bottom + 8) + 'px';
            
            // After setting the initial position, get the hover dimensions
            const updatedHoverRect = hoverDiv.getBoundingClientRect();
            
            // Check if the hover would go off the right edge of the screen
            if (updatedHoverRect.right > window.innerWidth - padding) {
              // Align the right edge of the hover with the right edge of the target
              hoverDiv.style.left = 'auto';
              hoverDiv.style.right = (window.innerWidth - targetRect.right) + 'px';
              hoverDiv.classList.add('positioned-right');
            } else {
              hoverDiv.classList.add('positioned-left');
            }
            
            // Check if the hover would go off the bottom of the screen
            if (updatedHoverRect.bottom > window.innerHeight - padding) {
              // Position above the target instead
              hoverDiv.style.top = 'auto';
              hoverDiv.style.bottom = (window.innerHeight - targetRect.top + 8) + 'px';
              hoverDiv.classList.add('positioned-top');
            } else {
              hoverDiv.classList.add('positioned-bottom');
            }
            
            // Update the arrow position
            const arrowPosition = hoverDiv.classList.contains('positioned-top') ? 'bottom' : 'top';
            hoverDiv.style.setProperty('--arrow-position', arrowPosition);
          }
          
          // Show hover content on mouseenter
          target.addEventListener('mouseenter', function() {
            // Hide any previously shown hover content
            if (activeHover && activeHover !== hoverDiv) {
              activeHover.style.visibility = 'hidden';
              activeHover.style.opacity = '0';
            }
            
            // Set this as the active hover
            activeHover = hoverDiv;
            
            // Position and show the hover content
            hoverDiv.style.visibility = 'visible';
            positionHoverContent();
            
            // Trigger fade-in animation
            setTimeout(() => {
              hoverDiv.style.opacity = '1';
            }, 10);
          });
          
          // Hide hover content on mouseleave
          target.addEventListener('mouseleave', function(e) {
            // Check if the mouse moved to the hover content itself
            if (e.relatedTarget === hoverDiv || hoverDiv.contains(e.relatedTarget)) {
              return;
            }
            
            hoverDiv.style.opacity = '0';
            
            setTimeout(() => {
              if (hoverDiv.style.opacity === '0') {
                hoverDiv.style.visibility = 'hidden';
                activeHover = null;
              }
            }, 300); // Match the transition duration
          });
          
          // Add mouseleave event to the hover content to hide it when mouse leaves
          hoverDiv.addEventListener('mouseleave', function(e) {
            // Check if the mouse moved back to the target
            if (e.relatedTarget === target || target.contains(e.relatedTarget)) {
              return;
            }
            
            hoverDiv.style.opacity = '0';
            
            setTimeout(() => {
              if (hoverDiv.style.opacity === '0') {
                hoverDiv.style.visibility = 'hidden';
                activeHover = null;
              }
            }, 300); // Match the transition duration
          });
        });
        
        // Update hover positions on window resize
        window.addEventListener('resize', function() {
          if (activeHover) {
            const target = Array.from(hoverTargets).find(t => t.hoverDiv === activeHover);
            if (target) {
              const hoverDiv = target.hoverDiv;
              const targetRect = target.getBoundingClientRect();
              const padding = 16;
              
              // Update position logic here similar to positionHoverContent function
              hoverDiv.style.left = targetRect.left + 'px';
              hoverDiv.style.top = (targetRect.bottom + 8) + 'px';
              
              const updatedHoverRect = hoverDiv.getBoundingClientRect();
              
              if (updatedHoverRect.right > window.innerWidth - padding) {
                hoverDiv.style.left = 'auto';
                hoverDiv.style.right = (window.innerWidth - targetRect.right) + 'px';
              }
              
              if (updatedHoverRect.bottom > window.innerHeight - padding) {
                hoverDiv.style.top = 'auto';
                hoverDiv.style.bottom = (window.innerHeight - targetRect.top + 8) + 'px';
              }
            }
          }
        });
        
        // Close hover content when clicking elsewhere on the page
        document.addEventListener('click', function(event) {
          if (activeHover && !event.target.closest('.floating-hover-target') && 
              !event.target.closest('.floating-hover-content')) {
            activeHover.style.opacity = '0';
            
            setTimeout(() => {
              activeHover.style.visibility = 'hidden';
              activeHover = null;
            }, 300);
          }
        });
      });
    </script>`;
    });
}

injectCSS(ctx);
hexo.extend.tag.register('sethover', sethover, true)
hexo.extend.tag.register('hover', hover, true)
hexo.extend.tag.register('explain', explain, true)
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

const Tooltip = ({ children, content, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();

      // Position tooltip
      switch (position) {
        case 'top':
          tooltip.style.bottom = `${window.innerHeight - rect.top + 8}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = 'translateX(-50%)';
          break;
        case 'bottom':
          tooltip.style.top = `${rect.bottom + 8}px`;
          tooltip.style.left = `${rect.left + rect.width / 2}px`;
          tooltip.style.transform = 'translateX(-50%)';
          break;
        case 'left':
          tooltip.style.right = `${window.innerWidth - rect.left + 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.transform = 'translateY(-50%)';
          break;
        case 'right':
          tooltip.style.left = `${rect.right + 8}px`;
          tooltip.style.top = `${rect.top + rect.height / 2}px`;
          tooltip.style.transform = 'translateY(-50%)';
          break;
      }
    }
  }, [isVisible, position]);

  return (
    <div className={`relative inline-block ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="inline-block"
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
          >
            <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl border border-gray-700 max-w-xs">
              {content}
              <div
                className={`absolute w-2 h-2 bg-gray-800 border-gray-700 rotate-45 ${
                  position === 'top'
                    ? 'bottom-[-4px] left-1/2 -translate-x-1/2 border-r border-b'
                    : position === 'bottom'
                    ? 'top-[-4px] left-1/2 -translate-x-1/2 border-l border-t'
                    : position === 'left'
                    ? 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t'
                    : 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b'
                }`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const HelpIcon = ({ content, position = 'top' }) => {
  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        className="inline-flex items-center justify-center text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        aria-label="Help"
      >
        <HelpCircle size={16} />
      </button>
    </Tooltip>
  );
};

export default Tooltip;


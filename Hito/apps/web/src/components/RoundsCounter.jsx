
import React from 'react';
import { Minus, Plus } from 'lucide-react';

const RoundsCounter = ({ value, onChange }) => {
  const handleDecrement = () => {
    if (value > 1) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < 10) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center justify-between bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl overflow-hidden h-[54px]">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= 1}
        className="w-16 h-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--red)] hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--text)] active:scale-[0.95]"
        aria-label="Decrease rounds"
      >
        <Minus className="w-5 h-5" />
      </button>
      
      <div className="flex-1 text-center font-bold text-xl text-[var(--text)]">
        {value}
      </div>
      
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= 10}
        className="w-16 h-full flex items-center justify-center text-[var(--text)] hover:bg-[var(--red)] hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[var(--text)] active:scale-[0.95]"
        aria-label="Increase rounds"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

export default RoundsCounter;

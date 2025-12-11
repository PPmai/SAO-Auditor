'use client';

import { useState, useEffect, useRef } from 'react';

interface SiteHealthProps {
  score: number;
  errors: number;
  warnings: number;
  notices: number;
}

export default function SiteHealth({ score, errors, warnings, notices }: SiteHealthProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [activeTicks, setActiveTicks] = useState<number[]>([]);
  const totalTicks = 24;
  const hasAnimated = useRef(false);

  useEffect(() => {
    // Reset animation when score changes
    hasAnimated.current = false;
    setDisplayScore(0);
    setActiveTicks([]);
  }, [score]);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    // Count up animation for score
    let currentNum = 0;
    const step = Math.ceil(score / 40);
    const countInterval = setInterval(() => {
      currentNum += step;
      if (currentNum >= score) {
        currentNum = score;
        clearInterval(countInterval);
      }
      setDisplayScore(currentNum);
    }, 20);

    // Calculate ticks to fill
    const ticksToFill = Math.round((score / 100) * totalTicks);

    // Staggered tick activation
    for (let i = 0; i < ticksToFill; i++) {
      setTimeout(() => {
        setActiveTicks((prev) => [...prev, i]);
      }, i * 35);
    }

    return () => {
      clearInterval(countInterval);
    };
  }, [score, totalTicks]);

  // Get color gradient based on score tier
  const getTickGradient = (targetScore: number) => {
    if (targetScore < 35) {
      // Bright Red
      return 'linear-gradient(180deg, #FF4444 0%, #CC0000 100%)';
    } else if (targetScore >= 36 && targetScore <= 60) {
      // Orange (existing)
      return 'linear-gradient(180deg, #FF8A00 0%, #FF5722 100%)';
    } else if (targetScore >= 61 && targetScore <= 79) {
      // Yellow
      return 'linear-gradient(180deg, #FFD700 0%, #FFA500 100%)';
    } else {
      // Green (80+)
      return 'linear-gradient(180deg, #27AE60 0%, #2ECC71 100%)';
    }
  };

  const getTickShadow = (targetScore: number) => {
    if (targetScore < 35) {
      // Bright Red shadow
      return '0 0 10px rgba(204, 0, 0, 0.4)';
    } else if (targetScore >= 36 && targetScore <= 60) {
      // Orange shadow
      return '0 0 10px rgba(255, 87, 34, 0.3)';
    } else if (targetScore >= 61 && targetScore <= 79) {
      // Yellow shadow
      return '0 0 10px rgba(255, 215, 0, 0.3)';
    } else {
      // Green shadow (80+)
      return '0 0 10px rgba(46, 204, 113, 0.3)';
    }
  };

  return (
    <div className="rounded-3xl p-8 shadow-lg bg-white w-full lg:w-2/3">
      {/* Header */}
      <div className="flex justify-between items-center mb-2.5">
        <h3 className="text-xl font-extrabold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
          Site Health
        </h3>
        <div className="text-gray-400 text-2xl leading-none cursor-pointer hover:text-gray-900 transition-colors" style={{ lineHeight: '0.5' }}>
          •••
        </div>
      </div>

      {/* Gauge Container */}
      <div className="relative w-[260px] h-[140px] mx-auto my-5 overflow-hidden">
        <div className="relative w-full h-[260px]">
          {/* Ticks */}
          {Array.from({ length: totalTicks }).map((_, i) => {
            const rotation = -90 + (180 / (totalTicks - 1)) * i;
            const isActive = activeTicks.includes(i);
            const tickStyle: React.CSSProperties = {
              position: 'absolute',
              width: '8px',
              height: isActive ? '40px' : '35px',
              backgroundColor: isActive ? 'transparent' : '#EDF1F5',
              left: '50%',
              top: 0,
              marginLeft: '-4px',
              transformOrigin: isActive ? '50% 135px' : '50% 130px',
              transform: `rotate(${rotation}deg)`,
              borderRadius: '4px',
              transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              background: isActive ? getTickGradient(score) : undefined,
              boxShadow: isActive ? getTickShadow(score) : undefined,
            };

            return <div key={i} className="tick" style={tickStyle} />;
          })}
        </div>

        {/* Score Overlay */}
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <div className="text-[56px] font-extrabold text-gray-900 leading-none" style={{ letterSpacing: '-2px' }}>
            {displayScore}%
          </div>
          <div className="text-sm font-semibold text-gray-500 mt-1">Audit Score</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between mt-6 pt-6 border-t-2 border-gray-100">
        <div className="text-center flex-1">
          <div
            className="inline-block px-3 py-1 rounded-xl mb-1.5 text-base font-bold"
            style={{
              background: 'rgba(255, 106, 85, 0.1)',
              color: '#FF6A55',
            }}
          >
            {errors}
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Errors
          </div>
        </div>
        <div className="text-center flex-1">
          <div
            className="inline-block px-3 py-1 rounded-xl mb-1.5 text-base font-bold"
            style={{
              background: 'rgba(255, 179, 35, 0.1)',
              color: '#FFB323',
            }}
          >
            {warnings}
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Warnings
          </div>
        </div>
        <div className="text-center flex-1">
          <div
            className="inline-block px-3 py-1 rounded-xl mb-1.5 text-base font-bold"
            style={{
              background: 'rgba(45, 156, 219, 0.1)',
              color: '#2D9CDB',
            }}
          >
            {notices}
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Notices
          </div>
        </div>
      </div>
    </div>
  );
}


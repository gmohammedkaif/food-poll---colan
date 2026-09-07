import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import biryaniImg from '../../assets/food/biryani.jpg';
import parottaImg from '../../assets/food/parotta.jpg';
import chapatiImg from '../../assets/food/chapati.jpg';
import lemonRiceImg from '../../assets/food/lemon_rice.jpg';
import curdRiceImg from '../../assets/food/curd_rice.jpg';

export interface FoodDish {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  tag: string;
  image: string;
  isVeg: boolean;
  voteScore: string;
}

// 4 Primary workplace dining dishes requested by user (1 dish per lateral face)
const PRIMARY_DISHES: FoodDish[] = [
  {
    id: 'biryani',
    name: 'Chicken Biryani',
    subtitle: 'Fragrant basmati layered with spiced chicken, mint & saffron',
    category: 'Chef Special',
    tag: 'Top Pick',
    image: biryaniImg,
    isVeg: false,
    voteScore: '84% Vote',
  },
  {
    id: 'parotta',
    name: 'Parotta',
    subtitle: 'Golden-crisp flaky South Indian layered parotta with spicy salna',
    category: 'Daily Special',
    tag: 'Popular',
    image: parottaImg,
    isVeg: true,
    voteScore: '82% Vote',
  },
  {
    id: 'chapati',
    name: 'Chapati',
    subtitle: 'Warm whole wheat soft homestyle phulkas served fresh',
    category: 'Daily Comfort',
    tag: 'Healthy',
    image: chapatiImg,
    isVeg: true,
    voteScore: '78% Vote',
  },
  {
    id: 'lemon-rice',
    name: 'Lemon Rice',
    subtitle: 'Golden turmeric rice with roasted crunchy peanuts & curry leaves',
    category: 'Traditional South',
    tag: 'Authentic',
    image: lemonRiceImg,
    isVeg: true,
    voteScore: '71% Vote',
  },
];

// Top and bottom faces
const TOP_DISH: FoodDish = {
  id: 'curd-rice',
  name: 'Curd Rice',
  subtitle: 'Cooling seasoned curd rice with pomegranate & mustard tempering',
  category: 'Light & Fresh',
  tag: 'Everyday Classic',
  image: curdRiceImg,
  isVeg: true,
  voteScore: '76% Vote',
};

const BOTTOM_DISH: FoodDish = {
  id: 'office-spread',
  name: 'Office Lunch Spread',
  subtitle: 'Fresh hot catering prepared daily for Colan team members',
  category: 'Colan Cafeteria',
  tag: 'Daily Fresh',
  image: parottaImg,
  isVeg: true,
  voteScore: '80% Vote',
};

export const FoodCube3D: React.FC = () => {
  // Current active face index (0: Biryani, 1: Chapati, 2: Lemon Rice, 3: Curd Rice)
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [sliceTwist, setSliceTwist] = useState(0);

  // Free-drag rotational state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Spring animation transition state
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsAutoPlaying(false);
    }
  }, []);

  // Pogo / Rubik's rhythmic 90-degree step rotation timer
  useEffect(() => {
    if (!isAutoPlaying || isDragging) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setActiveIdx((prev) => (prev + 1) % PRIMARY_DISHES.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isAutoPlaying, isDragging]);

  // Manual navigation handlers
  const handleNext = () => {
    setIsTransitioning(true);
    setDragOffset({ x: 0, y: 0 });
    setActiveIdx((prev) => (prev + 1) % PRIMARY_DISHES.length);
  };

  const handlePrev = () => {
    setIsTransitioning(true);
    setDragOffset({ x: 0, y: 0 });
    setActiveIdx((prev) => (prev - 1 + PRIMARY_DISHES.length) % PRIMARY_DISHES.length);
  };

  const handleSelect = (index: number) => {
    setIsTransitioning(true);
    setDragOffset({ x: 0, y: 0 });
    setActiveIdx(index);
  };

  const handleTwist = () => {
    setSliceTwist((prev) => prev + 90);
  };

  // Mouse / Touch Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setIsTransitioning(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragOffset((prev) => ({
      x: prev.x + dx * 0.5,
      y: Math.max(-40, Math.min(40, prev.y - dy * 0.4)),
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap back or align to nearest 90-degree angle
    setIsTransitioning(true);
  };

  // Cube dimensions
  const cubeSize = 310;
  const half = cubeSize / 2;

  // Base Y angle is -90 * activeIdx so the selected dish rotates directly to the front face!
  const targetY = -activeIdx * 90 + dragOffset.x;
  const targetX = -14 + dragOffset.y; // Isometric tilt so top face and 3D depth are visible

  const currentDish = PRIMARY_DISHES[activeIdx];

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-between select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={(e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const dx = e.touches[0].clientX - dragStart.x;
        const dy = e.touches[0].clientY - dragStart.y;
        setDragOffset((prev) => ({
          x: prev.x + dx * 0.5,
          y: Math.max(-40, Math.min(40, prev.y - dy * 0.4)),
        }));
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }}
      onTouchEnd={handleMouseUp}
    >
      {/* Ambient Lighting Layers */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[360px] h-[360px] bg-blue-600/15 rounded-full blur-[100px]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[280px] h-[280px] bg-orange-500/[0.08] rounded-full blur-[90px]" />
      </div>

      {/* Top Header Pill & Step Indicator */}
      <div className="relative z-20 w-full flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-blue-300">Today's Food Polling</span>
        </div>

        {/* 4 Dish Navigation Pills (Biryani, Chapati, Lemon Rice, Curd Rice) */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 p-1 rounded-full backdrop-blur-md">
          {PRIMARY_DISHES.map((dish, i) => {
            const isActive = i === activeIdx;
            return (
              <button
                key={dish.id}
                type="button"
                onClick={() => handleSelect(i)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {i === 0 ? 'Biryani' : i === 1 ? 'Chapati / Parotta' : i === 2 ? 'Lemon Rice' : 'Curd Rice'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D CUBE STAGE */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          if (e.touches.length === 1) {
            setIsDragging(true);
            setIsTransitioning(false);
            setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
          }
        }}
        className="relative z-10 w-full flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing min-h-[380px]"
        style={{ perspective: '1100px' }}
      >
        {/* Dynamic Ground Shadow */}
        <div
          className="absolute bottom-6 w-[260px] h-[32px] rounded-[100%] bg-blue-950/80 blur-xl pointer-events-none transition-transform duration-700"
          style={{
            transform: `scale(${1 + (activeIdx % 2 === 0 ? 0.08 : -0.05)})`,
          }}
        />

        {/* 3D CUBE CONTAINER */}
        <div
          className="relative preserve-3d"
          style={{
            width: `${cubeSize}px`,
            height: `${cubeSize}px`,
            transform: `rotateX(${targetX}deg) rotateY(${targetY}deg)`,
            transition: isTransitioning
              ? 'transform 900ms cubic-bezier(0.34, 1.45, 0.55, 1)'
              : 'none',
          }}
        >
          {/* Inner Dark Core Chassis */}
          <div
            className="absolute inset-0 bg-[#060B14] rounded-3xl border border-white/[0.08] shadow-2xl preserve-3d pointer-events-none"
            style={{ transform: 'scale3d(0.96, 0.96, 0.96)' }}
          />

          {/* ========================================================
              FACE 0 (Front, 0deg): BIRYANI
             ======================================================== */}
          <div
            className="absolute inset-0 preserve-3d rounded-3xl overflow-hidden bg-[#0A1224] border-2 border-white/20 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(0deg) translateZ(${half}px)`,
              backfaceVisibility: 'visible',
            }}
          >
            <HeroDishFace dish={PRIMARY_DISHES[0]} />
          </div>

          {/* ========================================================
              FACE 1 (Right, 90deg): CHAPATI / PAROTTA
             ======================================================== */}
          <div
            className="absolute inset-0 preserve-3d rounded-3xl overflow-hidden bg-[#0A1224] border-2 border-white/20 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(90deg) translateZ(${half}px)`,
              backfaceVisibility: 'visible',
            }}
          >
            <HeroDishFace dish={PRIMARY_DISHES[1]} />
          </div>

          {/* ========================================================
              FACE 2 (Back, 180deg): LEMON RICE
             ======================================================== */}
          <div
            className="absolute inset-0 preserve-3d rounded-3xl overflow-hidden bg-[#0A1224] border-2 border-white/20 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(180deg) translateZ(${half}px)`,
              backfaceVisibility: 'visible',
            }}
          >
            <HeroDishFace dish={PRIMARY_DISHES[2]} />
          </div>

          {/* ========================================================
              FACE 3 (Left, 270deg): CURD RICE
             ======================================================== */}
          <div
            className="absolute inset-0 preserve-3d rounded-3xl overflow-hidden bg-[#0A1224] border-2 border-white/20 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateY(270deg) translateZ(${half}px)`,
              backfaceVisibility: 'visible',
            }}
          >
            <HeroDishFace dish={PRIMARY_DISHES[3]} />
          </div>

          {/* ========================================================
              FACE 4 (Top, 90deg X): PANEER BUTTER MASALA
             ======================================================== */}
          <div
            className="absolute inset-0 preserve-3d rounded-3xl overflow-hidden bg-[#0A1224] border-2 border-white/20 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateX(90deg) translateZ(${half}px)`,
              backfaceVisibility: 'visible',
            }}
          >
            <HeroDishFace dish={TOP_DISH} />
          </div>

          {/* ========================================================
              FACE 5 (Bottom, -90deg X): SOUTH INDIAN THALI
             ======================================================== */}
          <div
            className="absolute inset-0 preserve-3d rounded-3xl overflow-hidden bg-[#0A1224] border-2 border-white/20 shadow-[0_0_35px_rgba(0,0,0,0.7)] backdrop-blur-xl"
            style={{
              width: `${cubeSize}px`,
              height: `${cubeSize}px`,
              transform: `rotateX(-90deg) translateZ(${half}px)`,
              backfaceVisibility: 'visible',
            }}
          >
            <HeroDishFace dish={BOTTOM_DISH} />
          </div>
        </div>
      </div>

      {/* ACTIVE DISH CARD / SPOTLIGHT BAR */}
      <div className="relative z-20 w-full px-2 py-1">
        <div className="p-3 rounded-2xl bg-[#091326]/90 border border-white/[0.12] backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.6)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md">
              <img
                src={currentDish.image}
                alt={currentDish.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white leading-tight">
                  {currentDish.name}
                </h3>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    currentDish.isVeg
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}
                >
                  {currentDish.isVeg ? 'Veg' : 'Non-Veg'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                {currentDish.subtitle}
              </p>
            </div>
          </div>

          {/* Controls: Prev, Play/Pause, Next */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95"
              title="Previous Dish"
              aria-label="Previous Dish"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className="p-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-all active:scale-95"
              title={isAutoPlaying ? 'Pause Auto-Rotation' : 'Play Auto-Rotation'}
              aria-label={isAutoPlaying ? 'Pause Auto-Rotation' : 'Play Auto-Rotation'}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all active:scale-95"
              title="Next Dish"
              aria-label="Next Dish"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for rendering ONE bold hero dish filling the cube face
const HeroDishFace: React.FC<{ dish: FoodDish }> = ({ dish }) => {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-3 select-none">
      {/* Full-bleed Food Image */}
      <img
        src={dish.image}
        alt={dish.name}
        className="absolute inset-0 w-full h-full object-cover brightness-100 contrast-105"
        loading="eager"
      />

      {/* Rubik's Cube 3x3 Tactile Grid Overlay */}
      {/* Subtle fine glass grooves across the image giving the authentic Rubik's puzzle structure */}
      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="border border-black/25 shadow-[inset_0_0_8px_rgba(0,0,0,0.3)]"
          />
        ))}
      </div>

      {/* Deep gradient overlays for legible typography */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060C18]/90 via-black/20 to-black/60 pointer-events-none" />

      {/* Top Bar with Category & Dietary Badges */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
          <span
            className={`w-2 h-2 rounded-full ${
              dish.isVeg ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-orange-500 shadow-[0_0_8px_#f97316]'
            }`}
          />
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white">
            {dish.isVeg ? 'Pure Veg' : 'Non-Veg'}
          </span>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-blue-600/70 border border-blue-400/40 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
          {dish.tag}
        </div>
      </div>

      {/* Bottom Bar: Bold Dish Name & Vote Highlight */}
      <div className="relative z-10 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
          {dish.category}
        </div>
        <h2 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md leading-tight">
          {dish.name}
        </h2>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-300 font-medium">
            Daily Lunch Poll
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/20 border border-orange-500/40 text-[11px] font-bold text-orange-300">
            <Flame className="w-3 h-3 text-orange-400" />
            {dish.voteScore}
          </span>
        </div>
      </div>

      {/* Specular corner highlight */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

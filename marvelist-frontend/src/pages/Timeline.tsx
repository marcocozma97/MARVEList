import { useState, useRef, useEffect } from 'react';
import { useNavigationType } from 'react-router-dom';
import { useWatchState } from '../hooks/useWatchState';
import { readPageState, usePageState, useScrollMemory, writePageState } from '../hooks/usePageMemory';
import PhaseList from '../components/PhaseList';
import HeroCharacters from '../components/HeroCharacters';

import mcuBg from '../assets/mcu.jpg';
import marvelFanBg from '../assets/MARVEL FAN.jpg';
import marvelGodBg from '../assets/MARVEL GOD.jpg';

import { groupByPhase, matchesVisionOrder, type VisionOrder } from '../utils/ordering';

const Timeline = () => {
  // Filtro e ricerca restano salvati quando si apre un titolo e si torna indietro
  const [activeFilter, setActiveFilter] = usePageState<VisionOrder>('timeline_filter', 'MCU');
  const [searchQuery, setSearchQuery] = usePageState('timeline_search', '');

  const watch = useWatchState();
  const { mediaList, isLoading, error } = watch;

  const navigationType = useNavigationType();
  const [focusId] = useState(() => navigationType === 'POP' ? readPageState<number | null>('timeline_focus', null) : null);
  useEffect(() => { writePageState('timeline_focus', null); }, []);

  // Tornando da un titolo si riparte dal punto in cui si era, appena le card sono caricate
  useScrollMemory('timeline', !isLoading, focusId !== null);

  useEffect(() => {
    if (isLoading || focusId === null) return;
    const frame = requestAnimationFrame(() => {
      document.querySelector(`[data-media-id="${focusId}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' });
    });
    return () => cancelAnimationFrame(frame);
  }, [isLoading, focusId]);

  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const stops = [
    { id: 'MCU' as VisionOrder, label: 'MCU', percent: 0 },
    { id: 'FAN' as VisionOrder, label: 'Marvel Fan', percent: 50 },
    { id: 'GOD' as VisionOrder, label: 'Marvel GOD', percent: 100 },
  ];

  const currentPercent = dragPercent !== null
    ? dragPercent
    : (activeFilter === 'MCU' ? 0 : activeFilter === 'FAN' ? 50 : 100);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updateSlider(e.clientX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const closest = stops.reduce((prev, curr) =>
      Math.abs(curr.percent - (dragPercent || 0)) < Math.abs(prev.percent - (dragPercent || 0)) ? curr : prev
    );

    setActiveFilter(closest.id);
    setDragPercent(null);
  };

  const updateSlider = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    let newPercent = ((clientX - rect.left) / rect.width) * 100;
    if (newPercent < 0) newPercent = 0;
    if (newPercent > 100) newPercent = 100;
    setDragPercent(newPercent);
  };

  // Frecce sinistra/destra sullo slider per chi usa la tastiera
  const handleSliderKey = (e: React.KeyboardEvent) => {
    const index = stops.findIndex(s => s.id === activeFilter);
    if (e.key === 'ArrowRight' && index < stops.length - 1) setActiveFilter(stops[index + 1].id);
    if (e.key === 'ArrowLeft' && index > 0) setActiveFilter(stops[index - 1].id);
  };

  // Durante il trascinamento il personaggio cambia già quando si passa la metà tra due fermate
  const stopFromPercent = (percent: number): VisionOrder => percent < 25 ? 'MCU' : percent < 75 ? 'FAN' : 'GOD';

  const filteredMedia = mediaList.filter(media =>
    matchesVisionOrder(media, activeFilter) && media.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  // Ordine di visione esplicito (fase, poi posizione nel JSON): non ci fidiamo dell'ordine del backend
  const groups = groupByPhase(filteredMedia);

  const getThemeConfig = () => {
    switch (activeFilter) {
      case 'MCU': return { accent: '#ed1d24', accentText: '#ff8a8a', accentRgb: '237, 29, 36', contrast: '#ffffff' };
      case 'FAN': return { accent: '#ffc107', accentText: '#ffe066', accentRgb: '255, 193, 7', contrast: '#1a1200' };
      case 'GOD': return { accent: '#0dcaf0', accentText: '#8ef0ff', accentRgb: '13, 202, 240', contrast: '#03161c' };
    }
  };
  const theme = getThemeConfig();
  const themeStyle = { '--accent': theme.accent, '--accent-text': theme.accentText, '--accent-rgb': theme.accentRgb, '--accent-contrast': theme.contrast } as React.CSSProperties;

  return (
    <div className="timeline-page" style={themeStyle}>

      <div className="timeline-hero">

        <div className={`timeline-hero-bg ${activeFilter === 'MCU' ? 'active' : ''}`} style={{ backgroundImage: `url("${mcuBg}")` }}></div>
        <div className={`timeline-hero-bg ${activeFilter === 'FAN' ? 'active' : ''}`} style={{ backgroundImage: `url("${marvelFanBg}")` }}></div>
        <div className={`timeline-hero-bg ${activeFilter === 'GOD' ? 'active' : ''}`} style={{ backgroundImage: `url("${marvelGodBg}")` }}></div>

        <div className="timeline-hero-content">
          <h1 className="timeline-hero-title">
            <span className="timeline-hero-kicker">Seleziona l'</span>
            <span className="timeline-hero-block">Ordine di Visione</span>
          </h1>

          {/* Personaggi a 8 bit che cambiano con lo slider */}
          <HeroCharacters level={dragPercent !== null ? stopFromPercent(dragPercent) : activeFilter} />

          <div
            className={`timeline-slider ${isDragging ? 'dragging' : ''}`}
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-label="Ordine di visione"
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={stops.findIndex(s => s.id === activeFilter)}
            aria-valuetext={stops.find(s => s.id === activeFilter)?.label}
            onKeyDown={handleSliderKey}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div className="timeline-track">
              <div className="timeline-progress" style={{ width: `${currentPercent}%` }}></div>
            </div>

            {stops.map(stop => (
              <div
                key={stop.id}
                className={`timeline-stop ${currentPercent >= stop.percent ? 'passed' : ''} ${activeFilter === stop.id && !isDragging ? 'active' : ''}`}
                style={{ left: `${stop.percent}%` }}
                onClick={(e) => { e.stopPropagation(); setActiveFilter(stop.id); }}
              >
                <div className="timeline-dot"></div>
                <span className="timeline-label">{stop.label}</span>
              </div>
            ))}

            <div className="timeline-thumb" style={{ left: `${currentPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="container timeline-body">

        {isLoading && (
          <div className="page-loader-inline">
            <div className="spinner-border text-danger" role="status"></div>
            <p>Caricamento protocolli in corso...</p>
          </div>
        )}

        {error && <div className="alert-marvel">{error}</div>}

        {!isLoading && !error && (
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              type="search"
              className="search-input"
              placeholder="Cerca un film o una serie TV..."
              aria-label="Cerca un film o una serie TV"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {!isLoading && !error && (
          <PhaseList groups={groups} watch={watch} memoryKey="timeline_phases" forceOpen={!!searchQuery} emptyText="Nessun titolo trovato per questo livello di visione." />
        )}

      </div>
    </div>
  );
};

export default Timeline;

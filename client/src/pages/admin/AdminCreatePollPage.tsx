import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useToast } from '../../components/ui/Toast.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { DatePicker } from '../../components/ui/DatePicker.js';
import { TimePicker } from '../../components/ui/TimePicker.js';
import { Food, ResultsVisibility } from '../../types/index.js';

import {
  ArrowLeft,
  Plus,
  Trash2,
  Utensils,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';

interface CustomOption {
  foodName: string;
  foodImage: string;
  description: string;
}

export const AdminCreatePollPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const getTodayLocal = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getNextFiveMinutes = () => {
    const now = new Date();
    const h = now.getHours();
    const m = Math.ceil(now.getMinutes() / 5) * 5;
    if (m >= 60) {
      return `${String((h + 1) % 24).padStart(2, '0')}:00`;
    }
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const getDefaultEndTime = (startStr: string) => {
    const [h, m] = startStr.split(':').map(Number);
    let endH = h + 1;
    let endM = m + 30;
    if (endM >= 60) {
      endH += 1;
      endM -= 60;
    }
    endH = endH % 24;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  };

  const todayLocal = getTodayLocal();
  const initialMinTime = getNextFiveMinutes();

  const getInitialStartTime = () => {
    if ('11:00' >= initialMinTime) {
      return '11:00';
    }
    return initialMinTime;
  };

  const [title, setTitle] = useState("Today's Lunch Poll");
  const [description, setDescription] = useState("Choose your meal preference for today's lunch catering.");
  const [pollDate, setPollDate] = useState(todayLocal);
  const [startTime, setStartTime] = useState(getInitialStartTime);
  const [endTime, setEndTime] = useState(() => getDefaultEndTime(getInitialStartTime()));
  const [allowVoteChange, setAllowVoteChange] = useState(true);
  const [resultsVisibility] = useState<ResultsVisibility>('VOTER_NAMES_VISIBLE');
  const [sendAnnouncement, setSendAnnouncement] = useState(true);

  // Food Catalog state
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Custom Options state
  const [customOptions, setCustomOptions] = useState<CustomOption[]>([]);
  const [showCustomSection, setShowCustomSection] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customImage, setCustomImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const isToday = pollDate === todayLocal;
  const currentMinTime = getNextFiveMinutes();
  const startPickerMinTime = isToday ? currentMinTime : undefined;

  const endPickerMinTime = useMemo(() => {
    const [sh, sm] = startTime.split(':').map(Number);
    let nextM = sm + 5;
    let nextH = sh;
    if (nextM >= 60) {
      nextH = (nextH + 1) % 24;
      nextM -= 60;
    }
    return `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
  }, [startTime]);

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const [sh, sm] = newStart.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      setEndTime(getDefaultEndTime(newStart));
    }
  };

  const handlePollDateChange = (newDate: string) => {
    setPollDate(newDate);
    if (newDate === todayLocal) {
      const minNow = getNextFiveMinutes();
      if (startTime < minNow) {
        setStartTime(minNow);
        setEndTime(getDefaultEndTime(minNow));
      }
    }
  };

  // Food Catalog Query - consumes Food[]
  const { data: catalogFoods = [] } = useQuery({
    queryKey: ['catalogFoods'],
    queryFn: async () => {
      const res = await api.get('/foods');
      const data = res.data.data;
      return (Array.isArray(data) ? data : data?.foods || []) as Food[];
    },
  });


  // Tap-to-toggle selection handler for adjacent cards
  const toggleFoodSelection = (foodId: string) => {
    setSelectedFoodIds((prev) =>
      prev.includes(foodId) ? prev.filter((id) => id !== foodId) : [...prev, foodId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);

    try {
      const res = await api.post('/foods/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCustomImage(res.data.data.url);
      success('Image Uploaded', 'Custom dish photo uploaded successfully.');
    } catch (err: any) {
      error('Upload Failed', err.response?.data?.message || 'Could not upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddCustomOption = () => {
    if (!customName.trim()) {
      error('Dish Name Required', 'Please enter a name for the custom option.');
      return;
    }
    if (!customImage.trim()) {
      error('Image Required', 'Please provide an image URL or upload a photo.');
      return;
    }
    setCustomOptions((prev) => [
      ...prev,
      {
        foodName: customName.trim(),
        foodImage: customImage.trim(),
        description: customDesc.trim(),
      },
    ]);
    setCustomName('');
    setCustomDesc('');
    setCustomImage('');
    setShowCustomSection(false);
    success('Option Added', 'Custom dish added to poll choices.');
  };

  const handleRemoveCustomOption = (index: number) => {
    setCustomOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const selectedFromCatalog = catalogFoods
    .filter((f) => selectedFoodIds.includes(f._id))
    .map((f) => ({
      foodId: f._id,
      foodName: f.name,
      foodImage: f.imageUrl,
      description: f.description || '',
    }));

  const totalSelectedCount = selectedFromCatalog.length + customOptions.length;

  const validate = (): boolean => {
    if (!title.trim()) {
      error('Validation Error', 'Poll title is required.');
      return false;
    }
    if (!pollDate) {
      error('Validation Error', 'Poll date is required.');
      return false;
    }
    if (!startTime || !endTime) {
      error('Validation Error', 'Start time and end time are required.');
      return false;
    }
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      error('Invalid Schedule', 'Voting cutoff time must be after the start time.');
      return false;
    }
    if (totalSelectedCount < 2) {
      error('Options Required', 'Please select at least 2 food dishes for voting.');
      return false;
    }
    return true;
  };

  const createPollMutation = useMutation({
    mutationFn: async () => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);

      const startAtDate = new Date(`${pollDate}T00:00:00`);
      startAtDate.setHours(sh, sm, 0, 0);

      const endAtDate = new Date(`${pollDate}T00:00:00`);
      endAtDate.setHours(eh, em, 0, 0);

      const allOptions = [
        ...selectedFromCatalog,
        ...customOptions.map((co) => ({
          foodName: co.foodName,
          foodImage: co.foodImage,
          description: co.description,
        })),
      ];

      const payload = {
        title: title.trim(),
        description: description.trim(),
        pollDate,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        status: 'OPEN',
        initialStatus: 'OPEN',
        allowVoteChange,
        resultsVisibility,
        options: allOptions,
      };

      const res = await api.post('/polls', payload);
      return res.data;
    },
    onSuccess: (resData) => {
      success('Poll Created Successfully', resData.message || 'Poll has been launched.');
      queryClient.invalidateQueries({ queryKey: ['adminPolls'] });
      queryClient.invalidateQueries({ queryKey: ['adminActivePolls'] });
      queryClient.invalidateQueries({ queryKey: ['activePoll'] });
      navigate('/admin/polls');
    },
    onError: (err: any) => {
      error('Creation Failed', err.response?.data?.message || 'Could not create poll.');
    },
  });

  const isCreating = createPollMutation.isPending;

  // Pagination & Carousel for dishes (4 per view in a clean single row)
  const ITEMS_PER_PAGE = 4;
  const [pageIndex, setPageIndex] = useState(0);

  const filteredCatalogFoods = useMemo(() => {
    return catalogFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (f.category && f.category.toLowerCase().includes(catalogSearch.toLowerCase()))
    );
  }, [catalogFoods, catalogSearch]);

  // Reset to first page if search changes
  useEffect(() => {
    setPageIndex(0);
  }, [catalogSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredCatalogFoods.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(pageIndex, totalPages - 1);

  const visibleCatalogFoods = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredCatalogFoods.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCatalogFoods, currentPage]);

  const handlePrevPage = () => {
    setPageIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <Link
          to="/admin/polls"
          className="w-10 h-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Create New Poll
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Set up today's lunch options for employees
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-card space-y-8">
        {/* Row 1: Date, Start Time, End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Date
            </label>
            <DatePicker
              value={pollDate}
              onChange={handlePollDateChange}
              minDate={todayLocal}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Start Time
            </label>
            <TimePicker
              value={startTime}
              onChange={handleStartTimeChange}
              minTime={startPickerMinTime}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              End Time
            </label>
            <TimePicker
              value={endTime}
              onChange={(val) => setEndTime(val)}
              minTime={endPickerMinTime}
            />
          </div>
        </div>

        {/* Row 2: Poll Title */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Poll Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Today's Lunch Poll"
            />
          </div>
        </div>

        {/* Row 3: ADJACENT SMALL CARDS GRID (TAP TO TOGGLE) */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wider">
                  Menu Food Options
                </h2>
                <span
                  className={clsx(
                    'text-xs font-bold px-2.5 py-0.5 rounded-full border',
                    totalSelectedCount >= 2
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  )}
                >
                  {totalSelectedCount} selected {totalSelectedCount < 2 && '(min 2)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Tap on any dish card to select or deselect it for today's voting.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-36 sm:w-48">
                <Input
                  placeholder="Filter dishes..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                />
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200/80 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-xs"
                    aria-label="Previous dishes"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2 font-mono select-none">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all shadow-xs"
                    aria-label="Next dishes"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ADJACENT SMALL CARDS GRID (4 PER ROW WITH < > CONTROLS) */}
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {visibleCatalogFoods.map((food) => {
                const isSelected = selectedFoodIds.includes(food._id);

                return (
                  <div
                    key={food._id}
                    onClick={() => toggleFoodSelection(food._id)}
                    className={clsx(
                      'group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-200 text-left select-none outline-none cursor-pointer',
                      isSelected
                        ? 'bg-blue-50/60 border-2 border-blue-600 shadow-md scale-[1.01]'
                        : 'bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-card-hover opacity-75 hover:opacity-100'
                    )}
                  >
                    {/* Top Image Container */}
                    <div className="relative w-full h-28 bg-slate-100 overflow-hidden shrink-0">
                      {food.imageUrl ? (
                        <img
                          src={food.imageUrl}
                          alt={food.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as any).style.display = 'none'; }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Utensils className="w-6 h-6 opacity-40" />
                        </div>
                      )}

                      {/* Checkmark Badge */}
                      {isSelected ? (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Selected</span>
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white/80 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center" />
                      )}
                    </div>

                    {/* Body: Dish Name + Category */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className={clsx(
                          'text-xs font-extrabold tracking-tight truncate leading-tight',
                          isSelected ? 'text-blue-950' : 'text-slate-900'
                        )}>
                          {food.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 truncate">
                          {food.category || 'Lunch'}
                        </span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100/80">
                        <span className={clsx(
                          'text-[10px] font-bold block text-center py-1 rounded-lg transition-colors',
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700'
                        )}>
                          {isSelected ? 'Included ✓' : 'Tap to Add'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state if search returns nothing */}
            {visibleCatalogFoods.length === 0 && (
              <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No dishes match "{catalogSearch}".</p>
              </div>
            )}

            {/* Floating Left/Right navigation buttons for quick paging */}
            {totalPages > 1 && (
              <>
                {currentPage > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevPage}
                    aria-label="Previous dishes"
                    className="hidden lg:flex absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all z-10 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentPage < totalPages - 1 && (
                  <button
                    type="button"
                    onClick={handleNextPage}
                    aria-label="Next dishes"
                    className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-md text-slate-700 items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all z-10 cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPageIndex(idx)}
                  className={clsx(
                    'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
                    idx === currentPage
                      ? 'w-6 bg-blue-600'
                      : 'w-2 bg-slate-200 hover:bg-slate-300'
                  )}
                  aria-label={`Page ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Custom Dish Cards (If any added) */}
          {customOptions.length > 0 && (
            <div className="space-y-2 pt-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Custom Added Dishes
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {customOptions.map((opt, idx) => (
                  <div
                    key={`${opt.foodName}-${idx}`}
                    className="relative flex flex-col rounded-2xl overflow-hidden border-2 border-blue-600 bg-blue-50/60 shadow-md text-left"
                  >
                    <div className="relative w-full h-28 bg-slate-100 overflow-hidden">
                      <img
                        src={opt.foodImage}
                        alt={opt.foodName}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as any).style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomOption(idx)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md hover:bg-rose-700"
                        title="Remove custom dish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="p-3">
                      <h4 className="text-xs font-extrabold text-blue-950 truncate">
                        {opt.foodName}
                      </h4>
                      <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                        Custom Dish
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expandable Custom Dish Creator */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowCustomSection(!showCustomSection)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 p-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Food Option (one-off dish)</span>
              {showCustomSection ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showCustomSection && (
              <div className="mt-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-scale-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Dish Name *
                    </label>
                    <Input
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Special Paneer Tikka"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Photo URL or Upload *
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={customImage}
                        onChange={(e) => setCustomImage(e.target.value)}
                        placeholder="https://ik.imagekit.io/... or paste URL"
                      />
                      <label className="cursor-pointer shrink-0 inline-flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingImage ? '...' : 'Upload'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <input
                    type="text"
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Short description of the dish..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setShowCustomSection(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="xs"
                    onClick={handleAddCustomOption}
                  >
                    Add Dish to Poll
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 4: Additional Settings */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wider">
            Additional Settings
          </h2>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={sendAnnouncement}
                onChange={(e) => setSendAnnouncement(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Send announcement to all employees</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={allowVoteChange}
                onChange={(e) => setAllowVoteChange(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span>Allow employees to update their vote before cutoff</span>
            </label>
          </div>
        </div>

        {/* Row 5: Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => navigate('/admin/polls')}
            disabled={isCreating}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            className="min-w-[150px] shadow-md shadow-blue-600/20"
            onClick={() => {
              if (validate()) {
                createPollMutation.mutate();
              }
            }}
            isLoading={isCreating}
          >
            Create Poll
          </Button>
        </div>
      </div>
    </div>
  );
};

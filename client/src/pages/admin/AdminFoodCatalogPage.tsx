import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../utils/api.js';
import { useToast } from '../../components/ui/Toast.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal.js';
import { Food } from '../../types/index.js';

import {
  PlusCircle,
  Search,
  Utensils,
  Edit2,
  Trash2,
  Upload,
} from 'lucide-react';

export const AdminFoodCatalogPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deletingFood, setDeletingFood] = useState<Food | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['foods'],
    queryFn: async () => {
      const res = await api.get('/foods');
      return res.data.data as Food[];
    },
  });

  const filteredFoods = foods.filter((f) => {
    return (
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.category && f.category.toLowerCase().includes(search.toLowerCase())) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const openCreateModal = () => {
    setEditingFood(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setCategory('');
    setModalOpen(true);
  };

  const openEditModal = (food: Food) => {
    setEditingFood(food);
    setName(food.name);
    setDescription(food.description || '');
    setImageUrl(food.imageUrl);
    setCategory(food.category || '');
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const res = await api.post('/foods/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.data.url);
      success('Image Uploaded', 'Dish photo uploaded via ImageKit.');
    } catch (err: any) {
      error('Upload Failed', err.response?.data?.message || 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingFood) {
        return (await api.put(`/foods/${editingFood._id}`, {
          name: name.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          category: category.trim(),
        })).data;
      }
      return (await api.post('/foods', {
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        category: category.trim(),
      })).data;
    },
    onSuccess: (resData) => {
      setModalOpen(false);
      success('Catalog Updated', resData.message || (editingFood ? 'Dish updated.' : 'New food item added.'));
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      queryClient.invalidateQueries({ queryKey: ['catalogFoods'] });
    },
    onError: (err: any) => {
      error('Save Error', err.response?.data?.message || 'Failed to save food item.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/foods/${id}`)).data,
    onSuccess: (resData) => {
      setDeletingFood(null);
      success('Food Removed', resData.message || 'Food item removed from catalog.');
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      queryClient.invalidateQueries({ queryKey: ['catalogFoods'] });
    },
    onError: (err: any) => {
      error('Delete Error', err.response?.data?.message || 'Failed to delete food item.');
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
            Food Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage your office dishes used in daily dining polls.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} leftIcon={<PlusCircle className="w-4 h-4" />}>
          Add New Dish
        </Button>
      </div>

      {/* Search Input */}
      <div className="w-full sm:max-w-xs">
        <Input
          placeholder="Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        />
      </div>

      {/* Grid of Food Items - Visually focused on food */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-200 shadow-card animate-pulse" />
          ))}
        </div>
      ) : filteredFoods.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-card p-8">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Utensils className="w-8 h-8 opacity-50" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 font-display">
            {search ? 'No foods match your search' : 'Food Catalog is Empty'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'Try searching with a different keyword.'
              : 'Add dishes here to quickly reuse them when creating daily lunch polls.'}
          </p>
          {!search && (
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateModal}
              className="mt-5"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Add First Dish
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredFoods.map((food) => (
            <div
              key={food._id}
              className="flex flex-col bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all group"
            >
              {/* Food Image */}
              <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
                {food.imageUrl ? (
                  <img
                    src={food.imageUrl}
                    alt={food.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Utensils className="w-10 h-10 opacity-40" />
                  </div>
                )}
              </div>

              {/* Food Content: Name, Short description, Edit, Delete */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                    {food.name}
                  </h3>
                  {food.description ? (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {food.description}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-1">No description.</p>
                  )}
                </div>

                {/* Edit & Delete Actions matching prompt */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openEditModal(food)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>

                  <button
                    onClick={() => setDeletingFood(food)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFood ? 'Edit Dish' : 'Add New Dish'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saveMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!name.trim()) {
                  error('Validation Error', 'Dish name is required.');
                  return;
                }
                if (!imageUrl.trim()) {
                  error('Validation Error', 'Image URL is required.');
                  return;
                }
                saveMutation.mutate();
              }}
              isLoading={saveMutation.isPending}
            >
              {editingFood ? 'Save Changes' : 'Add Dish'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Dish Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken Biryani"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Aromatic spices with seasoned meat and fragrant rice..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Dish Photo *
            </label>
            <div className="space-y-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/... or paste image URL"
              />
              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {imageUrl && (
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Image Ready</span>
                )}
              </div>
            </div>
          </div>

          {imageUrl && (
            <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as any).style.display = 'none'; }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletingFood}
        onClose={() => setDeletingFood(null)}
        onConfirm={() => deletingFood && deleteMutation.mutate(deletingFood._id)}
        title="Delete Food Item"
        description={`Are you sure you want to delete "${deletingFood?.name}" from your catalog?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

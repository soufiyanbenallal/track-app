import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Tag {
  id: string;
  name: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
  onSave: (tag: Omit<Tag, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const TagModal: React.FC<TagModalProps> = ({
  open,
  onOpenChange,
  tag,
  onSave
}) => {
  const [form, setForm] = useState({
    name: '',
    color: '#3B82F6',
    isArchived: false
  });

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];

  useEffect(() => {
    if (tag) {
      setForm({
        name: tag.name,
        color: tag.color,
        isArchived: tag.isArchived
      });
    } else {
      setForm({
        name: '',
        color: '#3B82F6',
        isArchived: false
      });
    }
  }, [tag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {tag ? 'Edit Tag' : 'New Tag'}
          </DialogTitle>
          <DialogDescription>
            {tag ? 'Edit tag information' : 'Add a new tag'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tag name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.color === color ? 'border-slate-800 scale-110' : 'border-slate-300 hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm({ ...form, color })}
                />
              ))}
            </div>
            <Input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full h-10"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {tag ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TagModal; 
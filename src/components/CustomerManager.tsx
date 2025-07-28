import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, User, Mail, Phone, MapPin } from 'lucide-react';
import { Loading } from '@/components/ui/loading';

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerManagerProps {
  onCustomerSelect?: (customer: Customer) => void;
  selectedCustomer?: Customer | null;
}

const CustomerManager = ({ onCustomerSelect, selectedCustomer }: CustomerManagerProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      if (window.electronAPI) {
        const customerList = await window.electronAPI.getCustomers();
        setCustomers(customerList);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (window.electronAPI) {
        if (editingCustomer) {
          await window.electronAPI.updateCustomer({
            ...editingCustomer,
            ...formData
          });
          alert('Customer updated successfully');
        } else {
          await window.electronAPI.createCustomer({
            ...formData,
            isArchived: false
          });
          alert('Customer created successfully');
        }
        
        await loadCustomers();
        resetForm();
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      alert('Error saving customer');
    }
  };

  const handleDelete = async (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?\n\n⚠️ Warning: All tasks associated with this customer will also be permanently deleted.')) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.deleteCustomer(customerId);
          await loadCustomers();
          alert('Customer and all associated tasks deleted successfully');
        }
      } catch (error: any) {
        console.error('Error deleting customer:', error);
        const errorMessage = error?.message || 'Error deleting customer';
        alert(errorMessage);
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setEditingCustomer(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading text="Loading customers..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Customers</h3>
        <Button 
          size="sm"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'New Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer ? 'Edit customer details' : 'Create a new customer'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerAddress">Address</Label>
              <Input
                id="customerAddress"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Complete address"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Customers List */}
      <div className="space-y-1">
        {customers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-3">
              <p className="text-muted-foreground mb-4">No customers created</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first customer
              </Button>
            </CardContent>
          </Card>
        ) : (
          customers.map(customer => (
            <Card 
              key={customer.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCustomer?.id === customer.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : ''
              }`}
              onClick={() => onCustomerSelect?.(customer)}
            >
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{customer.name}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {customer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-32">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(customer.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerManager; 
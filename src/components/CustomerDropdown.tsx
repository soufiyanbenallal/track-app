import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Plus, Search, User } from 'lucide-react';

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

interface CustomerDropdownProps {
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
  customers: Customer[];
  onCreateCustomer: () => void;
}

const CustomerDropdown: React.FC<CustomerDropdownProps> = ({
  selectedCustomer,
  onCustomerSelect,
  customers,
  onCreateCustomer
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter customers based on search query
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => 
      !customer.isArchived &&
      (customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       customer.id.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [customers, searchQuery]);

  const handleCustomerSelect = (customer: Customer) => {
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    onCustomerSelect(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={isOpen}
          className="flex items-center justify-between border-0 bg-transparent p-2 min-w-40"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: selectedCustomer ? '#3b82f6' : '#6b7280' }}
            />
            <span className={`truncate text-sm ${selectedCustomer ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
              {selectedCustomer ? selectedCustomer.name : 'Select customer...'}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 bg-slate-900 border-slate-700" 
        align="start"
      >
        {/* Search */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="max-h-60 overflow-y-auto">
          {/* Clear selection option */}
          <button
            onClick={handleClearSelection}
            className="w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors border-b border-slate-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              <span className="text-sm text-slate-400 italic">
                No customer
              </span>
            </div>
          </button>

          {filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => handleCustomerSelect(customer)}
              className={`w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors ${
                selectedCustomer?.id === customer.id ? 'bg-blue-900/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">
                    {customer.name}
                  </div>
                  {customer.email && (
                    <div className="text-xs text-slate-400 truncate">
                      {customer.email}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
          
          {/* No results */}
          {filteredCustomers.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400">No customers found</p>
            </div>
          )}
        </div>

        {/* Create Customer Button */}
        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={() => {
              onCreateCustomer();
              setIsOpen(false);
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-600"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create customer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CustomerDropdown; 
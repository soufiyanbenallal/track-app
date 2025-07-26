import React, { useState, useMemo, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Plus, Search } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
  customerId?: string;
  customerName?: string;
  notionDatabaseId?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectDropdownProps {
  selectedProject: Project | null;
  onProjectSelect: (project: Project | null) => void;
  projects: Project[];
  onCreateProject: () => void;
  onCustomerChange?: (customerId: string | undefined) => void;
}

const ProjectDropdown: React.FC<ProjectDropdownProps> = ({
  selectedProject,
  onProjectSelect,
  projects,
  onCreateProject,
  onCustomerChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Group projects by customer
  const groupedProjects = useMemo(() => {
    const filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: { [key: string]: Project[] } = {};

    filtered.forEach(project => {
      const customerName = project.customerName || 'NO CLIENT';
      if (!groups[customerName]) {
        groups[customerName] = [];
      }
      groups[customerName].push(project);
    });

    return groups;
  }, [projects, searchQuery]);

  const handleProjectSelect = (project: Project | null) => {
    onProjectSelect(project);
    // Automatically set the customer if project has one
    if (onCustomerChange && project?.customerId) {
      onCustomerChange(project.customerId);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const TriggerButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    ({ className, ...props }, ref) => (
      <button
        ref={ref}
        className="flex items-center justify-between border-0 bg-transparent p-2 min-w-60"
        {...props}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: selectedProject?.color || '#6b7280' }}
          />
          {selectedProject?.customerName && (
            <span className="text-sm text-slate-400">
              {selectedProject?.customerName} :
            </span>
          )}
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {selectedProject?.name || 'Select project'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
      </button>
    )
  );
  TriggerButton.displayName = 'TriggerButton';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <TriggerButton />
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-slate-900 border-slate-700 shadow-xl"
        align="start"
        sideOffset={8}
      >
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by project, task or client"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="max-h-64 overflow-y-auto">
          {Object.entries(groupedProjects).map(([clientName, clientProjects]) => {
            if (clientProjects.length === 0) return null;
            
            return (
              <div key={clientName}>
                {/* Client Header */}
                <div className="px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                    {clientName}
                  </h3>
                </div>
                
                {/* Projects */}
                {clientProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectSelect(project)}
                    className={`w-full px-4 py-3 text-left hover:bg-slate-800 transition-colors ${
                      selectedProject?.id === project.id ? 'bg-purple-900/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-sm text-white">
                        {project.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
          
          {/* No results */}
          {Object.values(groupedProjects).every(group => group.length === 0) && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400">No projects found</p>
            </div>
          )}
        </div>

        {/* Create Project Button */}
        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={() => {
              onCreateProject();
              setIsOpen(false);
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-purple-400 border border-slate-600"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create project
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProjectDropdown; 
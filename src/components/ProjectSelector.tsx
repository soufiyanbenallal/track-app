import React from 'react';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProject: Project | null;
  onProjectSelect: (project: Project) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProject,
  onProjectSelect,
}) => {
  return (
    <div className="project-selector">
      <select
        value={selectedProject?.id || ''}
        onChange={(e) => {
          const project = projects.find(p => p.id === e.target.value);
          if (project) {
            onProjectSelect(project);
          }
        }}
        className="project-select"
      >
        <option value="">Sélectionner un projet</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      
      {selectedProject && (
        <div className="selected-project">
          <div 
            className="project-color" 
            style={{ backgroundColor: selectedProject.color }}
          ></div>
          <span>{selectedProject.name}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector; 
import React from 'react';

interface TaskFormProps {
  onSubmit: (description: string) => void;
  onCancel: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSubmit, onCancel }) => {
  const [description, setDescription] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim()) {
      onSubmit(description.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form">
      <div className="form-group">
        <label htmlFor="task-description">Description de la tâche</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez ce que vous allez faire..."
          rows={3}
          required
        />
      </div>
      
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn btn-primary" disabled={!description.trim()}>
          Démarrer
        </button>
      </div>
    </form>
  );
};

export default TaskForm; 
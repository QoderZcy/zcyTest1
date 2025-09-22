import React, { useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { useNotes } from './hooks/useNotes';
import { NoteForm } from './components/NoteForm';
import { SearchBar } from './components/SearchBar';
import { NotesGrid } from './components/NotesGrid';
import { StatsPanel } from './components/StatsPanel';
import type { Note } from './types/note';
import './App.css';

function App() {
  const {
    notes,
    allTags,
    filter,
    stats,
    setFilter,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsFormOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsFormOpen(true);
  };

  const handleSaveNote = (noteData: any) => {
    if (editingNote) {
      updateNote(editingNote.id, noteData);
    } else {
      createNote(noteData);
    }
    setIsFormOpen(false);
    setEditingNote(null);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingNote(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <StickyNote size={28} className="app-icon" />
            <h1>便签管理系统</h1>
          </div>
          
          <button
            onClick={handleCreateNote}
            className="btn btn-primary create-btn"
          >
            <Plus size={20} />
            新建便签
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="content-wrapper">
          <div className="top-section">
            <StatsPanel stats={stats} />
            <SearchBar
              filter={filter}
              onFilterChange={setFilter}
              allTags={allTags}
            />
          </div>
          
          <div className="notes-section">
            <NotesGrid
              notes={notes}
              onEditNote={handleEditNote}
              onDeleteNote={deleteNote}
            />
          </div>
        </div>
      </main>

      <NoteForm
        note={editingNote}
        isOpen={isFormOpen}
        onSave={handleSaveNote}
        onCancel={handleCancelForm}
      />
    </div>
  );
}

export default App;

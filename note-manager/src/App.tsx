import React, { useState } from 'react';
import { Plus, StickyNote } from 'lucide-react';
import { useNotes } from './hooks/useNotes';
import { NoteForm } from './components/NoteForm';
import { SearchBar } from './components/SearchBar';
import { NotesGrid } from './components/NotesGrid';
import { StatsPanel } from './components/StatsPanel';
import { LoginForm } from './components/LoginForm';
import { UserMenu } from './components/UserMenu';
import { useAuth } from './contexts/AuthContext';
import type { Note } from './types/note';
import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
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

  // 如果正在加载认证状态，显示加载界面
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  // 如果未登录，显示登录表单
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <StickyNote size={28} className="app-icon" />
            <h1>便签管理系统</h1>
          </div>
          
          <div className="header-actions">
            <button
              onClick={handleCreateNote}
              className="btn btn-primary create-btn"
            >
              <Plus size={20} />
              新建便签
            </button>
            <UserMenu />
          </div>
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

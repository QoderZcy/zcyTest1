import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { LibraryLayout } from './components/LibraryLayout';
import { LibraryDashboard } from './components/LibraryDashboard';
import { BookCatalog } from './components/BookCatalog';
import { BookDetails } from './components/BookDetails';
import { MemberManagement } from './components/MemberManagement';
import { CheckoutInterface } from './components/CheckoutInterface';
import { ReturnInterface } from './components/ReturnInterface';
import { RenewalInterface } from './components/RenewalInterface';
import { useAuth } from './contexts/AuthContext';
import { Book, Member } from './types/library';
import { UserRole } from './types/library';
import './App.css';

// Main Library Management Application Component
const MainApp: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showBookDetails, setShowBookDetails] = useState(false);
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    // Close any open modals when changing sections
    setShowBookDetails(false);
    setShowMemberDetails(false);
    setSelectedBook(null);
    setSelectedMember(null);
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setShowBookDetails(true);
  };

  const handleBookEdit = (book: Book | null) => {
    // TODO: Implement book editing modal
    console.log('Edit book:', book);
  };

  const handleBookDelete = (book: Book) => {
    // TODO: Implement book deletion confirmation
    console.log('Delete book:', book);
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };

  const handleMemberEdit = (member: Member | null) => {
    // TODO: Implement member editing modal
    console.log('Edit member:', member);
  };

  const handleMemberDelete = (member: Member) => {
    // TODO: Implement member deletion confirmation
    console.log('Delete member:', member);
  };

  const renderMainContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <LibraryDashboard />;
        
      case 'catalog':
      case 'catalog-browse':
        return (
          <BookCatalog
            onBookSelect={handleBookSelect}
            onBookEdit={handleBookEdit}
            onBookDelete={handleBookDelete}
          />
        );
        
      case 'catalog-manage':
        return (
          <BookCatalog
            onBookSelect={handleBookSelect}
            onBookEdit={handleBookEdit}
            onBookDelete={handleBookDelete}
            selectionMode={true}
          />
        );
        
      case 'members':
      case 'members-list':
        return (
          <MemberManagement
            onMemberSelect={handleMemberSelect}
            onMemberEdit={handleMemberEdit}
            onMemberDelete={handleMemberDelete}
          />
        );
        
      case 'members-manage':
        return (
          <MemberManagement
            onMemberSelect={handleMemberSelect}
            onMemberEdit={handleMemberEdit}
            onMemberDelete={handleMemberDelete}
          />
        );
        
      case 'checkout':
        return <CheckoutInterface />;
        
      case 'return':
        return <ReturnInterface />;
        
      case 'renewals':
        return <RenewalInterface />;
        
      case 'reports':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reports & Analytics</h3>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
        
      case 'settings':
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
        
      default:
        return <LibraryDashboard />;
    }
  };

  return (
    <>
      <LibraryLayout
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
      >
        {renderMainContent()}
      </LibraryLayout>

      {/* Book Details Modal */}
      {showBookDetails && selectedBook && (
        <BookDetails
          book={selectedBook}
          onClose={() => {
            setShowBookDetails(false);
            setSelectedBook(null);
          }}
          onEdit={handleBookEdit}
          onDelete={handleBookDelete}
          onCheckout={(book) => {
            console.log('Checkout book:', book);
            // TODO: Navigate to checkout interface with pre-selected book
          }}
          onReserve={(book) => {
            console.log('Reserve book:', book);
            // TODO: Implement reservation functionality
          }}
        />
      )}

      {/* Member Details Modal - TODO: Implement MemberDetails component */}
      {showMemberDetails && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {selectedMember.firstName} {selectedMember.lastName}
              </h2>
              <button
                onClick={() => {
                  setShowMemberDetails(false);
                  setSelectedMember(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600">
              Member details component coming soon...
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// Root Application Component
function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <MainApp />
      </AuthGuard>
    </AuthProvider>
  );
}

export default App;

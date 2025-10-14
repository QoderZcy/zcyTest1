import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { BlogProvider } from './contexts/BlogContext'
import AppRoutes from './routes/AppRoutes'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <BlogProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </BlogProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
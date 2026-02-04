import './App.css';
import { Routes, Route } from 'react-router-dom';
import './Components/Style.css';
import Home from './Components/Home';
import Landing from './Components/Landing';
import Navbar from './Components/Navbar';
import ViewCroom from './Components/ViewCroom';
import MarkAtt from './Components/MarkAtt';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Landing />} />

      {/* Protected routes with Navbar */}
      <Route
        path="/home"
        element={
          <>
            <Navbar />
            <Home />
          </>
        }
      />
      <Route
        path="/view/:id"
        element={
          <>
            <Navbar />
            <ViewCroom />
          </>
        }
      />
      <Route
        path="/markatt/:id"
        element={
          <>
            <Navbar />
            <MarkAtt />
          </>
        }
      />

      {/* Fallback route (optional) */}
      <Route
        path="*"
        element={
          <>
            <Navbar />
            <h2 style={{ textAlign: 'center', marginTop: '50px' }}>
              404 - Page Not Found
            </h2>
          </>
        }
      />
    </Routes>
  );
}

export default App;

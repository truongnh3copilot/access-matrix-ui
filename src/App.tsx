import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AccessMatrix } from './pages/AccessMatrix';
import { AccessRequests } from './pages/AccessRequests';
import { UserManagement } from './pages/UserManagement';
import { DataSourceManagement } from './pages/DataSourceManagement';
import { AuditLog } from './pages/AuditLog';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"              element={<Dashboard />}            />
          <Route path="/access-matrix" element={<AccessMatrix />}         />
          <Route path="/requests"      element={<AccessRequests />}        />
          <Route path="/users"         element={<UserManagement />}       />
          <Route path="/data-sources"  element={<DataSourceManagement />} />
          <Route path="/audit"         element={<AuditLog />}             />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

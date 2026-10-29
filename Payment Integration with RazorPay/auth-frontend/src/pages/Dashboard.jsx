import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 480, margin: '60px auto' }}>
      <h2>Welcome, {user.name}</h2>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>

      <p>
        <Link to="/payments">Plans and payments</Link>
      </p>

      {user.role === 'admin' && (
        <p>
          <Link to="/admin/users">Manage users</Link>
        </p>
      )}

      <button onClick={logout}>Logout</button>
    </div>
  );
}
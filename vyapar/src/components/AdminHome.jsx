import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaSignOutAlt } from 'react-icons/fa';
import '../styles/AdminHome.css';
import 'bootstrap/dist/css/bootstrap.min.css';

const AdminHome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const navOptions = [
    { label: 'Add Product', path: '/adminproduct' },
    { label: 'View Product', path: '/adminview' },
    { label: 'Admin Dashboard', path: '/admin-dashboard' },
    { label: 'Add Meta Details', path: '/productMeta' },
    { label: 'Meta Details', path: '/viewMeta' },
    { label: 'Order Details', path: '/vieworder' },
    {label: 'send orders', path: '/admindetails'}
  ];

  const handleBoxClick = (path) => {
    navigate(path);
  };

  return (
    <div className="container-fluid p-3">
      <nav className="navbar bg-light shadow-sm p-3 rounded d-flex justify-content-between align-items-center mb-4">
        <span className="navbar-brand fw-bold fs-4 text-primary">CORE FOUR / Admin</span>
        <div className="d-flex align-items-center gap-2">
          
          <FaSignOutAlt
            className="text-danger ms-3 cursor-pointer"
            size={20}
            onClick={handleLogout}
            title="Logout"
            style={{ cursor: 'pointer' }}
          />
        </div>
      </nav>

      <div className="row g-4 justify-content-center">
        {navOptions.map((item, idx) => (
          <div
            key={idx}
            className="col-10 col-sm-6 col-md-4 col-lg-3"
            onClick={() => handleBoxClick(item.path)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card shadow-sm text-center h-100 p-4 hover-scale">
              <div className="card-body">
                <h5 className="card-title text-dark">{item.label}</h5>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminHome;

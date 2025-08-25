import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import adminAxiosInstance from '../utils/adminAxiosInstance';

const AddProductMeta = () => {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    product: '',
    manufactureDate: '',
    expiryDate: '',
    deliveryDate: '',
    deliveryTime: '',
  });
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const api = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!token) return navigate('/');
    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== 'admin') return navigate('/');
      fetchProducts();
    } catch {
      navigate('/');
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await adminAxiosInstance.get(`${api}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setErrorMsg('Failed to fetch product list');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product) {
      setErrorMsg('Please select a product');
      return;
    }

    try {
      const res = await adminAxiosInstance.post(`${api}/api/addMeta`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setSuccessMsg('Product metadata added successfully!');
        setFormData({
          product: '',
          manufactureDate: '',
          expiryDate: '',
          deliveryDate: '',
          deliveryTime: '',
        });
      }
    } catch (err) {
      console.error('Error adding product metadata:', err);
      const errMsg =
        err?.response?.data?.error || 'Failed to add product metadata';
      setErrorMsg(errMsg);
    } finally {
      setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Add Product Metadata</h2>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="mb-3">
          <label className="form-label">Product</label>
          <select
  name="product"
  value={formData.product}
  onChange={handleChange}
  required
  className="form-select"
>
  <option value="">Select Product</option>
  {Array.isArray(products) && products.map((p) => (
    <option key={p._id} value={p._id}>
      {p.title}
    </option>
  ))}
</select>
        </div>

        <div className="mb-3">
          <label className="form-label">Manufacture Date</label>
          <input
            type="date"
            name="manufactureDate"
            value={formData.manufactureDate}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Delivery Date</label>
          <input
            type="date"
            name="deliveryDate"
            value={formData.deliveryDate}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Delivery Time</label>
          <input
            type="time"
            name="deliveryTime"
            value={formData.deliveryTime}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Add Metadata
        </button>
      </form>
    </div>
  );
};

export default AddProductMeta;

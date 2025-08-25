import React, { useRef, useState, useEffect } from 'react';
import { FaSignOutAlt, FaPlus, FaTrash } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import adminAxiosInstance from '../utils/adminAxiosInstance';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/AdminAddProduct.css'; // Only if needed for custom tweaks

const AdminAddProduct = () => {
  const descriptionRef = useRef(null);
  const navigate = useNavigate();

  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [shopStocks, setShopStocks] = useState([{ vendor: '', shopName: '', quantity: 0, unit: 'kg' }]);
  const [toastMessage, setToastMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);

  const api = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return redirectToLogin("Access denied. Please log in as admin.");

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "admin") return redirectToLogin("Access denied. Admins only.");
    } catch {
      return redirectToLogin("Invalid token.");
    }

    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await adminAxiosInstance.get(`${api}/api/vendors`, {
        headers: { "authorization": `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setVendors(res.data.vendors || []);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const redirectToLogin = (message) => {
    setToastMessage(message);
    setShowErrorToast(true);
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const handleImageChange = (e) => setImage(e.target.files[0]);

  const handleShopStockChange = (index, field, value) => {
    const updated = [...shopStocks];
    updated[index][field] = value;

    if (field === "vendor") {
      const selectedVendor = vendors.find(v => v._id === value);
      updated[index].shopName = selectedVendor ? selectedVendor.name : "";
    }

    setShopStocks(updated);
  };

  const addShopStockField = () => {
    setShopStocks([...shopStocks, { vendor: '', shopName: '', quantity: 0, unit: 'kg' }]);
  };

  const removeShopStockField = (index) => {
    const updated = shopStocks.filter((_, i) => i !== index);
    setShopStocks(updated);
  };

  const resetForm = () => {
    setProductName('');
    setPrice('');
    setCategory('');
    setOfferDescription('');
    setDescription('');
    setImage(null);
    setShopStocks([{ vendor: '', shopName: '', quantity: 0, unit: 'kg' }]);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", productName);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("price", price);
    formData.append("offerDescription", offerDescription);
    if (image) formData.append("image", image);
    formData.append("shopStocks", JSON.stringify(shopStocks));

    try {
      const response = await adminAxiosInstance.post(`${api}/api/addProduct`, formData, {
        headers: { "authorization": `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setToastMessage(response.data.message || "Product added successfully!");
      setShowSuccessToast(true);
      resetForm();
    } catch (error) {
      setToastMessage(error.response?.data?.message || "Failed to add product.");
      setShowErrorToast(true);
    }

    setTimeout(() => setShowSuccessToast(false), 2000);
    setTimeout(() => setShowErrorToast(false), 2000);
  };

  return (
    <div className="container-fluid min-vh-100 bg-light">
      {showSuccessToast && <div className="alert alert-success mt-2">{toastMessage}</div>}
      {showErrorToast && <div className="alert alert-danger mt-2">{toastMessage}</div>}

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
        <span className="navbar-brand">CORE FOUR / Admin</span>
        <button className="btn btn-outline-light ms-auto" onClick={handleLogout}>
          <FaSignOutAlt className="me-1" /> Logout
        </button>
      </nav>

      <div className="row">
        <aside className="col-md-3 col-lg-2 bg-white border-end py-4">
          <ul className="nav flex-column">
            <li className="nav-item"><Link to="/adminview" className="nav-link">View Product</Link></li>
            <li className="nav-item"><Link to="/admindetials" className="nav-link">View Details</Link></li>
            <li className="nav-item"><a href="#" className="nav-link">Sales Graph</a></li>
          </ul>
        </aside>

        <main className="col-md-9 col-lg-10 p-4">
          <h2 className="mb-4">Add Product</h2>
          <form onSubmit={handleAddProduct}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Product Name</label>
                <input type="text" className="form-control" value={productName} onChange={(e) => setProductName(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Price</label>
                <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select category</option>
                <option value="fruits">Fruits</option>
                <option value="vegetables">Vegetables</option>
                <option value="greens">Greens</option>
                <option value="grocery">Grocery</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Offer Description (Optional)</label>
              <input type="text" className="form-control" value={offerDescription} onChange={(e) => setOfferDescription(e.target.value)} />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
            </div>

            {/* Shop Stock Section */}
            <div className="mb-3">
              <label className="form-label">Stock by Shop</label>
              {shopStocks.map((stock, index) => (
                <div key={index} className="row g-2 mb-2 align-items-end">
                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={stock.vendor}
                      onChange={(e) => handleShopStockChange(index, 'vendor', e.target.value)}
                      required
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor._id} value={vendor._id}>{vendor.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
  <input
    type="number"
    className="form-control"
    value={stock.quantity}
    onChange={(e) => handleShopStockChange(index, 'quantity', e.target.value)}
    required
  />
</div>

                  <div className="col-md-3">
                    <select className="form-select" value={stock.unit} onChange={(e) => handleShopStockChange(index, 'unit', e.target.value)} required>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="mg">mg</option>
                      <option value="box">box</option>
                      <option value="bunch">bunch</option>
                      <option value="pack">pack</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    {shopStocks.length > 1 && (
                      <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeShopStockField(index)}>
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary mt-2" onClick={addShopStockField}>
                <FaPlus className="me-1" /> Add Shop
              </button>
            </div>

            <div className="mb-3">
              <label className="form-label">Product Image</label>
              <input type="file" className="form-control" accept="image/*" onChange={handleImageChange} id="image" />
            </div>

            <button type="submit" className="btn btn-success w-100">Add Product</button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AdminAddProduct;

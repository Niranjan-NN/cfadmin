import React, { useEffect, useState } from "react";
import { FaSearch, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import styles from "./AdminViewDetails.module.css";
import adminAxiosInstance from "../utils/adminAxiosInstance";

const AdminViewOrder = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [groupedOrders, setGroupedOrders] = useState({});
  const [selectedStatus, setSelectedStatus] = useState("All");
  const api = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  const updateOrderStatus = (orderId, newStatus) => {
  const token = localStorage.getItem("adminToken");
  adminAxiosInstance
    .put(`${api}/api/order/update/${orderId}`, { status: newStatus }, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(() => {
      // ✅ Update orders list
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      );

      // ✅ Update groupedOrders immediately
      setGroupedOrders((prevGrouped) => {
        const updatedGrouped = {};
        for (const [shopName, shopOrders] of Object.entries(prevGrouped)) {
          updatedGrouped[shopName] = shopOrders.map((order) =>
            order._id === orderId ? { ...order, status: newStatus } : order
          );
        }
        return updatedGrouped;
      });
    })
    .catch((err) => console.error("Failed to update status", err));
};


  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/login");
      return;
    }

    adminAxiosInstance
      .get(`${api}/api/order/all`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const allOrders = res.data || [];
        setOrders(allOrders);

        const grouped = {};
        allOrders.forEach((order) => {
          order.items.forEach((item) => {
            const shop = item.shopName || "Unknown Shop";
            if (!grouped[shop]) grouped[shop] = [];
            grouped[shop].push(order);
          });
        });
        setGroupedOrders(grouped);
        
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
      });
      
  },
  [navigate, api]);

  const filteredGroupedOrders = Object.fromEntries(
    Object.entries(groupedOrders).map(([shopName, shopOrders]) => [
      shopName,
      selectedStatus === "All"
        ? shopOrders
        : shopOrders.filter((order) => order.status === selectedStatus),
    ])
  );

  return (
    <div className={styles.container}>
      {/* Navbar */}
      <header className={styles.header}>
        <nav className={styles.navbar}>
          <div className={styles.navbarBrand}>CORE FOUR / Admin</div>
          <div className={styles.navbarSearch}>
            <input
              type="text"
              placeholder="Search for products, orders, users..."
              className={styles.searchInput}
            />
            <FaSearch className={styles.searchIcon} />
          </div>
          <div className={styles.navbarIcons}>
            <FaSignOutAlt
              onClick={handleLogout}
              className={styles.logoutIcon}
              title="Logout"
            />
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <ul>
            <li><Link to="/adminview">View Products</Link></li>
            <li><Link to="/admindetials">View Orders</Link></li>
            <li><Link to="/adminusers">View Users</Link></li>
            <li><a href="#">Sales Report</a></li>
          </ul>
        </div>

        {/* Filter */}
        <section className={styles.bookingSection}>
          <div className={styles.filterBar}>
            <h2>Orders by Shop</h2>
            <div>
              <label>Status: </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {Object.keys(filteredGroupedOrders).length > 0 ? (
            Object.entries(filteredGroupedOrders).map(([shopName, shopOrders]) =>
              shopOrders.length > 0 ? (
                <div key={shopName} className={styles.shopGroup}>
                  <div className={styles.shopHeader}>
                    <h3>{shopName}</h3>
                  </div>
                  <table className={styles.orderTable}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Address</th>
                        <th>Items</th>
                        <th>Total (₹)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopOrders.map((order) => (
                        <tr key={order._id}>
                          <td>{order._id}</td>
                          <td>{order.user?.name || "Unknown"}</td>
                          <td>{new Date(order.createdAt).toLocaleDateString(
                            "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
                          )}</td>
                          <td>
                            {order.address ? (
                              <>
                                {order.address.fullName} <br />
                                {order.address.locationDetails} <br />
                                {order.address.city}, {order.address.state} - {order.address.pincode} <br />
                                📞 {order.address.mobileNumber}
                              </>
                            ) : "No Address"}
                          </td>
                          <td>
                            {order.items.map((i, idx) => (
                              <div key={idx}>
                                {i.product?.title || "Product"} (x{i.quantity})
                              </div>
                            ))}
                          </td>
                          <td>₹{order.totalPrice}</td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null
            )
          ) : (
            <p>No orders found</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminViewOrder;

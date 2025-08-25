import React, { useEffect, useState } from 'react';
import { FaSearch, FaSignOutAlt } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';
import styles from './AdminViewDetails.module.css';
import adminAxiosInstance from '../utils/adminAxiosInstance';

const AdminViewDetails = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [groupedOrders, setGroupedOrders] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const api = import.meta.env.VITE_API_URL;

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/");
  };

  // ✅ Send WhatsApp message to vendor
  const sendWhatsAppMessage = (shopName, shopOrders, vendorNumber) => {
    const pendingOrders = shopOrders.filter(o => o.status === "Pending");
    if (pendingOrders.length === 0) {
      alert("No pending orders to send.");
      return;
    }

    if (!vendorNumber) {
      alert("Vendor phone number not found.");
      return;
    }

    let message = `Orders for ${shopName}\n\n`;
    pendingOrders.forEach((order) => {
      message += `Order ID: ${order._id}\n`;
      message += `Customer: ${order.user?.name || "Unknown"}\n`;
      message += `Date: ${new Date(order.createdAt).toLocaleDateString(
        "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
      )}\n`;
      message += `Items:\n`;
      order.items.forEach((i, idx) => {
        message += `${idx + 1}. ${i.product?.title || "Product"} (x${i.quantity})\n`;
      });
      message += `Total: Rs ${order.totalPrice}\n`;
      message += `Status: ${order.status}\n\n`;
    });

    // Open WhatsApp
    const whatsappURL = `https://wa.me/${vendorNumber}?text=${encodeURIComponent(message.trim())}`;
    window.open(whatsappURL, "_blank");

    // Auto-update status to "sent"
    const token = localStorage.getItem("adminToken");
    adminAxiosInstance
      .put(`${api}/api/order/bulk-status`, {
        orderIds: pendingOrders.map(o => o._id),
        status: "sent"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        // ✅ Update orders and groupedOrders state without reload
        setOrders(prev =>
          prev.map(o =>
            pendingOrders.some(po => po._id === o._id)
              ? { ...o, status: "sent" }
              : o
          )
        );

        setGroupedOrders(prevGrouped => {
          const updatedGrouped = { ...prevGrouped };
          updatedGrouped[shopName] = updatedGrouped[shopName].map(order =>
            pendingOrders.some(po => po._id === order._id)
              ? { ...order, status: "sent" }
              : order
          );
          return updatedGrouped;
        });

        setSelectedOrder(prev =>
          prev && pendingOrders.some(po => po._id === prev._id)
            ? { ...prev, status: "sent" }
            : prev
        );
      })
      .catch(err => console.error("Failed to update order statuses", err));
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/login");
      return;
    }

    adminAxiosInstance
      .get(`${api}/api/order/all`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const allOrders = res.data || [];

        // Flatten orders into per-shop entries
        const ordersPerShop = allOrders.flatMap(order =>
          order.items.map(item => ({
            ...order,
            shopName: item.shopName,
            vendorNumber: item.vendorNumber || null, // ✅ keep vendor number here
            items: [item]
          }))
        );

        // Group by shopName
        const groupedByShop = ordersPerShop.reduce((acc, order) => {
          const shopName = order.shopName || "Unknown Shop";
          if (!acc[shopName]) acc[shopName] = [];
          acc[shopName].push(order);
          return acc;
        }, {});

        setOrders(ordersPerShop);
        setGroupedOrders(groupedByShop);

        if (ordersPerShop.length > 0) {
          setSelectedOrder(ordersPerShop[0]);
        }
      })
      .catch(err => {
        console.error("Error fetching orders:", err);
      });
  }, [navigate, api]);

  const updateOrderStatus = (orderId, newStatus) => {
    const token = localStorage.getItem("adminToken");
    adminAxiosInstance
      .put(`${api}/api/order/${orderId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        setOrders(prev =>
          prev.map(o => (o._id === orderId ? { ...o, status: newStatus } : o))
        );

        setGroupedOrders(prevGrouped => {
          const updatedGrouped = {};
          for (const shop in prevGrouped) {
            updatedGrouped[shop] = prevGrouped[shop].map(o =>
              o._id === orderId ? { ...o, status: newStatus } : o
            );
          }
          return updatedGrouped;
        });

        setSelectedOrder(prev =>
          prev && prev._id === orderId ? { ...prev, status: newStatus } : prev
        );
      })
      .catch(err => console.error("Failed to update status", err));
  };

  return (
    <div className={styles.container}>
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

        {/* Orders Table */}
        <section className={styles.bookingSection}>
          <h2>Latest Orders (Grouped by Shop)</h2>
          {Object.keys(groupedOrders).length > 0 ? (
            Object.entries(groupedOrders).map(([shop, shopOrders]) => (
              <div key={shop} className={styles.shopBlock}>
                <div className={styles.shopHeader}>
                  <h3>{shop}</h3>
                  <button
                    className={styles.whatsappBtn}
                    onClick={() =>
                      sendWhatsAppMessage(
                        shop,
                        shopOrders,
                        shopOrders[0]?.vendorNumber // ✅ now vendor number is available directly
                      )
                    }
                  >
                    📩 Send to WhatsApp
                  </button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Order No.</th>
                      <th>Customer Name</th>
                      <th>Order Date</th>
                      <th>Total (₹)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopOrders.map((order, index) => (
                      <tr
                        key={order._id}
                        onClick={() => setSelectedOrder(order)}
                        className={
                          selectedOrder?._id === order._id ? styles.activeRow : ""
                        }
                      >
                        <td>{order.orderNumber || index + 1}</td>
                        <td>{order.user?.name}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString(
                          "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
                        )}</td>
                        <td>{order.totalPrice}</td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="sent">Sent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <p>No orders found</p>
          )}
        </section>

        {/* Order Details Panel */}
        <aside className={styles.invoiceSection}>
          <h2>Order Details</h2>
          {selectedOrder ? (
            <div className={styles.invoiceDetails}>
              <img
                src={selectedOrder.user?.profilePic || "profile-pic.jpg"}
                alt="Profile"
              />
              <div className={styles.invoiceInfo}>
                <h3>{selectedOrder.user?.name}</h3>
                <p>{selectedOrder.user?.email}</p>
                <p><strong>Shop:</strong> {selectedOrder.shopName}</p>
              </div>

              <div className={styles.description}>
                <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                <p>
                  <strong>Products:</strong>{" "}
                  {selectedOrder.items?.map(i =>
                    `${i.product?.title} (x${i.quantity})`
                  ).join(", ")}
                </p>
                <p><strong>Total Amount:</strong> ₹{selectedOrder.totalPrice}</p>
                <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus || "N/A"}</p>
                <p><strong>Shipping Status:</strong> {selectedOrder.status}</p>
                {selectedOrder.address && (
                  <div className={styles.addressBlock}>
                    <strong>Delivery Address:</strong>
                    <p>{selectedOrder.address.locationDetails}, {selectedOrder.address.landmark}</p>
                    <p>{selectedOrder.address.city}</p>
                    <p>{selectedOrder.address.state} - {selectedOrder.address.pincode}</p>
                    <p>📞 {selectedOrder.address.mobileNumber}</p>
                  </div>
                )}
              </div>

              <p className={styles.invoiceUpdate}>
                Order status updated on{" "}
                {new Date(selectedOrder.updatedAt).toLocaleDateString(
                  "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }
                )}
              </p>

              <div className={styles.invoiceActions}>
                <button className={styles.accept}>Accept</button>
                <button className={styles.saveSend}>Save & Send</button>
              </div>
            </div>
          ) : (
            <p>Select an order to view details</p>
          )}
        </aside>
      </main>
    </div>
  );
};

export default AdminViewDetails;

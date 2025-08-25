const Order = require("../Model/order");
const Cart = require("../Model/cart");
const Address = require("../Model/Address");

// Place an order
const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, addressId, deliveryDays = 5 } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Group cart items by shop
    const shopOrders = {};
    for (const item of cart.items) {
      // Pick the shop name from product data
      const shopName = item.product.shopStocks?.[0]?.shopName || "Unknown Shop";

      if (!shopOrders[shopName]) {
        shopOrders[shopName] = [];
      }

      shopOrders[shopName].push({
        product: item.product._id,
        quantity: item.quantity,
        shopName
      });
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const createdOrders = [];

    for (const shopName in shopOrders) {
      const shopItems = shopOrders[shopName];
      const totalPrice = shopItems.reduce((sum, item) => {
        const productData = cart.items.find(c => String(c.product._id) === String(item.product));
        return sum + (productData.product.price * item.quantity);
      }, 0);

      const newOrder = new Order({
        user: userId,
        address,
        items: shopItems,
        totalPrice,
        paymentMethod,
        deliveryDate,
        status: "Pending"
      });

      await newOrder.save();
      createdOrders.push(newOrder);
    }

    // Clear cart after all orders are created
    await Cart.findOneAndDelete({ user: userId });

    res.status(201).json({ message: "Orders placed successfully", orders: createdOrders });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};


// Get user orders
// Get user orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .populate("items.product")
      .populate("address");

    // Inject shopName into each order item
    const formattedOrders = orders.map(order => {
      const itemsWithShop = order.items.map(item => ({
        ...item.toObject(),
        shopName: item.product?.shopStocks?.[0]?.shopName || "Unknown Shop"
      }));
      return {
        ...order.toObject(),
        items: itemsWithShop
      };
    });

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};

// Get all orders (Admin only)
// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: "items.product",
        populate: {
          path: "shopStocks.vendor",
          model: "Vendor",
          select: "phoneNumber"
        }
      })
      .populate({ path: "user", select: "-password" })
      .populate("address");

    const formattedOrders = orders.map(order => {
      const itemsWithShop = order.items.map(item => {
        // ✅ match the correct shopStock based on shopName
        const matchedStock = item.product?.shopStocks?.find(
          s => s.shopName === item.shopName
        );

        return {
          ...item.toObject(),
          shopName: item.shopName || matchedStock?.shopName || "Unknown Shop",
          vendorNumber: matchedStock?.vendor?.phoneNumber
            ? `+${matchedStock.vendor.phoneNumber.replace(/^\+?/, "")}`
            : null
        };
      });

      return { ...order.toObject(), items: itemsWithShop };
    });

    res.status(200).json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
};




// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
};
const bulkUpdateOrderStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;

    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { status } }
    );

    res.status(200).json({ message: "Orders updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update orders" });
  }
};

// Cancel order (User)
const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params; // Get orderId from URL params
        const userId = req.user.id;
    
        const order = await Order.findOne({ _id: orderId, user: userId });
        if (!order) return res.status(404).json({ message: "Order not found" });
    
        if (order.status !== "Pending") {
          return res.status(400).json({ message: "Cannot cancel processed order" });
        }
    
        order.status = "Cancelled";
        await order.save();
    
        res.status(200).json({ message: "Order cancelled successfully", order });
      } catch (error) {
        res.status(500).json({ error: "Something went wrong" });
      }
    };

module.exports = {placeOrder,getAllOrders,getUserOrders,updateOrderStatus,cancelOrder,bulkUpdateOrderStatus}
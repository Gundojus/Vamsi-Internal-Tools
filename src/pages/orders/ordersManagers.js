import React, { useState, useEffect } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Icon,
  Box,
  Section,
  Strong,
  Input,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { MdCreate, MdDeleteSweep, MdNoteAdd } from "react-icons/md";
import { useHistory } from "react-router-dom";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import { deleteOrderById } from "../utils/firebaseConfig";
import { NavBar } from "../utils/navbar";
import Footer from "../utils/footer";

// Fetch orders from Firebase Realtime Database and sort them by datetime
const fetchOrders = (setOrders) => {
  const db = getDatabase();
  const ordersRef = dbRef(db, "vamsi/orders");

  onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const ordersArray = Object.keys(data).map((key) => ({
        uuid: key,
        ...data[key],
      }));

      // Sort descending by combined orderCreationDate + orderCreationTime
      ordersArray.sort((a, b) => {
        const dateA = new Date(`${a.orderCreationDate} ${a.orderCreationTime}`);
        const dateB = new Date(`${b.orderCreationDate} ${b.orderCreationTime}`);
        return dateB - dateA; // Newest first
      });

      setOrders(ordersArray);
    }
  });
};

// Function to delete an order and reload the page
const deleteOrder = async (uuid) => {
  try {
    await deleteOrderById(uuid);
    window.location.reload();
  } catch (error) {
    console.error("Error deleting order: ", error);
    alert("Failed to delete the order. Please try again.");
  }
};

export default () => {
  const [orders, setOrders] = useState([]);              // All fetched orders
  const [searchTerm, setSearchTerm] = useState("");      // Text‐search filter
  const [statusFilters, setStatusFilters] = useState({   // Which statuses are shown
    "Pre-press" : true,
    "Press" : true,
    "Post-press" : true,
    "Delivered" : true,
    "Payment Pending" : true,
    "Payment Received" : true
  });
  const history = useHistory();

  // Fetch all orders on component mount (already sorted)
  useEffect(() => {
    fetchOrders(setOrders);
  }, []);

  // Navigate to edit page
  const editOrder = (uuid) => {
    history.push(`/orders/edit?uuid=${uuid}`);
  };

  // Confirm and delete
  const handleDelete = (uuid) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      deleteOrder(uuid);
    }
  };

  // Normalize phone number by removing non-digit characters
  const normalizePhoneNumberFn = (phone) => {
    return String(phone).replace(/\D/g, "");
  };

  // Handle toggling a checkbox for a status filter
  const toggleStatus = (statusKey) => {
    setStatusFilters((prev) => ({
      ...prev,
      [statusKey]: !prev[statusKey],
    }));
  };

  // Filter orders based on search term AND status checkbox settings
  const filteredOrders = orders.filter((order) => {
    // 1) Only include if order.progress is one of the checked statuses
    if (!statusFilters[order.progress]) {
      return false;
    }

    // 2) Then check text search (customer_name or phone number)
    try {
      const nameField = String(order.customer_name || "")
        .toLowerCase()
        .trim();
      const term = String(searchTerm || "").toLowerCase().trim();
      const nameMatch = nameField.includes(term);

      const phoneField = String(order.phone_number || order.phone || "");
      const normalizedPhoneField = normalizePhoneNumberFn(phoneField);
      const normalizedSearchTerm = normalizePhoneNumberFn(term);

      let phoneMatch = false;
      if (normalizedSearchTerm !== "") {
        phoneMatch = normalizedPhoneField.includes(normalizedSearchTerm);
      }

      // Keep if either nameMatch or phoneMatch
      return nameMatch || phoneMatch;
    } catch (error) {
      console.error("Error filtering orders:", error);
      return false;
    }
  });

  // Decide color based on status
const getStatusColor = (progress) => {
  switch (progress) {
    case "Pre-press":
      return "#ff4d4d"; // Bright red (start)

    case "Press":
      return "#ff7518"; // Reddish-orange

    case "Post-press":
      return "#ffaa00"; // Orange

    case "Delivered":
      return "#ffd700"; // Yellow

    case "Payment Pending":
      return "#c0c000"; // Yellow-green (waiting)

    case "Payment Received":
      return "#31a931"; // Green (final/complete)

    default:
      return "#ff0000"; // Default red for unknown statuses
  }
};



  const addOrder = () => {
    history.push("/orders/add");
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-managers"} />
      <Helmet>
        <title>Orders Manager</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>

      <NavBar role={sessionStorage.getItem("role")} current={"Orders"} />

      <Section padding="90px 0 100px 0" quarkly-title="Orders-Manager">
        <Text
          margin="0px 0px 20px 0px"
          text-align="center"
          font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
          color="--dark"
          sm-margin="0px 0px 30px 0px"
        >
          Orders
        </Text>

        <Icon
          category="md"
          icon={MdNoteAdd}
          onClick={() => addOrder()}
          size="32px"
          align-self="flex-end"
          margin="16px 0px 16px 0px"
          style={{ cursor: "pointer" }}
        />

        {/* ─── Search Bar + Status Filter Bar ─── */}
        <Box
          display="flex"
          flex-direction="column"
          align-items="center"
          margin="0px 0px 20px 0px"
        >
          {/* Search Input */}
          <Box
            display="flex"
            justify-content="center"
            align-items="center"
            width="100%"
          >
            <Input
              type="text"
              placeholder="Search by customer name or phone number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              width="50%"
              padding="8px 12px"
              border="1px solid #ccc"
              border-radius="4px"
              margin-right="10px"
            />
          </Box>

          {/* Status Filter Checkboxes */}
          <Box
            display="flex"
            justify-content="center"
            align-items="center"
            margin="10px 0px 0px 0px"
          >
            {["Pre-press",
    "Press",
    "Post-press",
    "Delivered",
    "Payment Pending",
    "Payment Received"].map((statusKey) => (
              <Box
                key={statusKey}
                display="flex"
                align-items="center"
                margin="0px 15px"
              >
                <input
                  type="checkbox"
                  id={`filter-${statusKey}`}
                  checked={statusFilters[statusKey]}
                  onChange={() => toggleStatus(statusKey)}
                  style={{ marginRight: "6px" }}
                />
                <label htmlFor={`filter-${statusKey}`}>
                  <Text font="--lead" color="--dark">
                    {statusKey}
                  </Text>
                </label>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ─── Table Header & Rows ─── */}
        <Box
          min-width="1200px"
          overflow="auto"
          margin="0 auto"
          padding="0 10px"
        >
          {/* Header Row */}
          <Box
            display="flex"
            justify-content="space-between"
            align-items="center"
            padding="10px"
            border-width="0 0 2px 0"
            border-style="solid"
            border-color="#d1d7de"
            margin="0px 0px 10px 0px"
          >
            {/* S. No. Column */}
            <Text width="5%" text-align="center" font="--lead" color="--dark">
              <Strong>S. No.</Strong>
            </Text>

            <Text width="20%" text-align="center" font="--lead" color="--dark">
              <Strong>Order Time</Strong>
            </Text>
            <Text width="25%" text-align="center" font="--lead" color="--dark">
              <Strong>Customer Name</Strong>
            </Text>
            <Text width="15%" text-align="center" font="--lead" color="--dark">
              <Strong>Status</Strong>
            </Text>
            <Text width="10%" text-align="center" font="--lead" color="--dark">
              <Strong>Pieces</Strong>
            </Text>
            <Text width="20%" text-align="center" font="--lead" color="--dark">
              <Strong>Deadline</Strong>
            </Text>
            <Text width="5%" text-align="center" font="--lead" color="--dark">
              <Strong>Edit</Strong>
            </Text>
            <Text width="5%" text-align="center" font="--lead" color="--dark">
              <Strong>Delete</Strong>
            </Text>
          </Box>

          {/* Order Rows */}
          {filteredOrders.length > 0 ? (
            <Box>
              {filteredOrders.map((order, index) => (
                <Box
                  key={order.uuid}
                  display="flex"
                  justify-content="space-between"
                  align-items="center"
                  padding="10px"
                  border-width="0 0 1px 0"
                  border-style="solid"
                  border-color="#d1d7de"
                  background="#ffffff"
                  margin="0px 0px 10px 0px"
                >
                  {/* S. No. */}
                  <Text
                    width="5%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color="--dark"
                  >
                    {index + 1}
                  </Text>

                  {/* Order Time */}
                  <Text
                    width="20%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color="--dark"
                  >
                    {order.orderCreationDate} / {order.orderCreationTime}
                  </Text>

                  {/* Customer Name */}
                  <Text
                    width="25%"
                    text-align="center"
                    font="normal 500 28px/1.2 --fontFamily-serifGeorgia"
                    color="--dark"
                  >
                    {order.customer_name}
                  </Text>

                  {/* Status with Conditional Color */}
                  <Text
                    width="15%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color={getStatusColor(order.progress)}
                  >
                    <Strong>{order.progress}</Strong>
                  </Text>

                  {/* Pieces */}
                  <Text
                    width="10%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color="--dark"
                  >
                    {order.pieces?.number_of_pieces || "N/A"}
                  </Text>

                  {/* Deadline */}
                  <Text
                    width="20%"
                    text-align="center"
                    font="normal 400 16px/1.5 -apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"
                    color="--dark"
                  >
                    {order.deadline_formatted || "N/A"}
                  </Text>

                  {/* Edit Icon */}
                  <Box
                    width="5%"
                    display="flex"
                    justify-content="center"
                    align-items="center"
                  >
                    <Icon
                      category="md"
                      icon={MdCreate}
                      size="32px"
                      margin="0px"
                      onClick={() => editOrder(order.uuid)}
                      style={{ cursor: "pointer" }}
                    />
                  </Box>

                  {/* Delete Icon */}
                  <Box
                    width="5%"
                    display="flex"
                    justify-content="center"
                    align-items="center"
                  >
                    <Icon
                      category="md"
                      icon={MdDeleteSweep}
                      size="32px"
                      margin="0px"
                      onClick={() => handleDelete(order.uuid)}
                      style={{ cursor: "pointer" }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Text>No orders available</Text>
          )}
        </Box>
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
};

import React, { useState, useEffect } from "react";
import theme from "theme";
import { Theme, Text, Input, Box, Section, Hr } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { fetchOrderById } from "../utils/firebaseConfig"; // Import the function to fetch order data from Firebase
import { useLocation } from "react-router-dom";
import ProgressBar from "@ramonak/react-progress-bar"; // Import ProgressBar
import Footer from "../utils/footer";
// Helper function to extract UUID from the URL
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

// Function to get progress color based on status
const getProgressColor = (progress) => {
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



export default () => {
  const query = useQuery();
  const uuid = query.get("uuid"); // Extract UUID from URL
  const [orderData, setOrderData] = useState(null); // To store the fetched order data
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null); // Add error state

  // Fetch order details on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (uuid) {
          fetchOrderById(uuid, (data) => {
            if (data) {
              setOrderData(data); // Set the fetched data into state
            } else {
              setError("Order not found.");
            }
            setLoading(false);
          });
        } else {
          setError("Invalid order UUID.");
          setLoading(false);
        }
      } catch (err) {
        setError("Error fetching order data.");
        setLoading(false);
      }
    };

    fetchData();
  }, [uuid]);

  // Show loading message if data is not yet fetched
  if (loading) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"orders-view"} />
        <Text>Loading order details...</Text>
      </Theme>
    );
  }

  if (error) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"orders-view"} />
        <Text>{error}</Text> {/* Display error if occurred */}
      </Theme>
    );
  }

  // Map the progress to numeric values for progress bar
  const progressLevels = {
    Pending: 0,
    "In Progress": 50,
    Completed: 100,
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"orders-view"} />
      <Helmet>
        <title>View Order</title><link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>

      <Section padding="90px 0 100px 0" quarkly-title="View-Order">
        <Box
          display="flex"
          align-items="center"
          justify-content="center"
          position="relative"
        >
          <Text
            margin="0px 0px 20px 0px"
            text-align="center"
            font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
            color="--dark"
            sm-margin="0px 0px 30px 0px"
          >
            Order Details
          </Text>
        </Box>

        {/* Customer Information Section */}
        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          <Text margin="15px 0px 15px 0px">Customer Name</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.customer_name || ""}
            readOnly
          />

          <Text margin="15px 0px 15px 0px">Phone Number</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.phone_number || ""}
            readOnly
          />
        </Box>

        {/* Horizontal Rule */}
        <Hr
          min-height="10px"
          min-width="100%"
          margin="15px 0px 15px 0px"
          border-color="--color-darkL2"
          width="1200px"
        />

        {/* Order Information Section */}
        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          <Text margin="15px 0px 15px 0px">Order Creation Date</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.orderCreationDate || ""}
            readOnly
          />

          <Text margin="15px 0px 15px 0px">Order Creation Time</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.orderCreationTime || ""}
            readOnly
          />

          <Text margin="15px 0px 15px 0px">Deadline</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            value={orderData.deadline_raw || ""}
            readOnly
          />
        </Box>

        {/* Horizontal Rule */}
        <Hr
          min-height="10px"
          min-width="100%"
          margin="15px 0px 15px 0px"
          border-color="--color-darkL2"
          width="1200px"
        />

        {/* Pieces Information Section */}
        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          <Text margin="15px 0px 15px 0px">Pieces</Text>
          {orderData.pieces?.details?.map((piece, index) => (
            <Box key={index} display="flex" align-items="center" margin="5px 0">
              <Text width="200px">{piece.type}</Text>
              <Text>Quantity: {piece.quantity}</Text>
            </Box>
          ))}
        </Box>

        {/* Horizontal Rule */}
        <Hr
          min-height="10px"
          min-width="100%"
          margin="15px 0px 15px 0px"
          border-color="--color-darkL2"
          width="1200px"
        />

        {/* Progress Section */}
        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          <Text margin="15px 0px 15px 0px">Progress</Text>
          <ProgressBar
            completed={progressLevels[orderData.progress] || 0}
            bgColor={getProgressColor(orderData.progress)}
            labelAlignment="center"
            labelColor="#ffffff"
            width="50%"
          />
        </Box>
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
};

import React, { useState, useEffect } from "react";
import { Box, Text, Theme, Section, Hr } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import theme from "theme";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./mobile-month-view.css";
import { fetchOrdersByDate } from "../utils/firebaseConfig";
import { NavBar } from "../utils/navbar";
import Footer from "../utils/footer";

const CalendarPage = () => {
  const [myEvents, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [toastMessage, setToastMessage] = useState(null);

  // Function to format date as YYYY-MM-DD based on local timezone
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = `0${date.getMonth() + 1}`.slice(-2); // Months are zero-based
    const day = `0${date.getDate()}`.slice(-2);
    return `${year}-${month}-${day}`;
  };

  // Function to determine the color based on progress status
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
  // Function to load orders for all dates in the current month
  const loadEventsForMonth = async (date) => {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Generate all dates in the current month in 'YYYY-MM-DD' format
    const datesInMonth = [];
    for (
      let d = new Date(startOfMonth);
      d <= endOfMonth;
      d.setDate(d.getDate() + 1)
    ) {
      datesInMonth.push(formatDateLocal(new Date(d)));
    }

    // Fetch orders for each date
    const allOrders = [];
    for (const dateStr of datesInMonth) {
      const orders = await fetchOrdersByDate(dateStr);
      if (orders.length > 0) {
        allOrders.push(...orders);
      }
    }

    setEvents(allOrders);
  };

  useEffect(() => {
    // Load events when the component mounts and whenever the month changes
    loadEventsForMonth(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Function to filter events for the selected date
  const getEventsForDate = (date) => {
    const formattedDate = formatDateLocal(date); // "YYYY-MM-DD"
    return myEvents.filter((event) => event.deadline_raw === formattedDate);
  };

  // Function to handle date selection
  const onDateChange = (date) => {
    setSelectedDate(date);
    const events = getEventsForDate(date);
    // Filter out completed orders
    const pendingEvents = events.filter(
      (event) => event.progress !== "Payment Received"
    );
    if (pendingEvents.length > 0) {
      const totalPieces = pendingEvents.reduce(
        (sum, event) => sum + event.pieces.number_of_pieces,
        0
      );
      setToastMessage(
        `You have ${pendingEvents.length} pending order(s) with a total of ${totalPieces} piece(s) on ${date.toDateString()}`
      );
    } else {
      setToastMessage("No pending orders on this day");
    }
  };

  // Function to add markers on dates with pending or in-progress events
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const events = getEventsForDate(date);
      const hasPending = events.some(
        (event) => event.progress !== "Payment Received"
      );
      if (hasPending) {
        return (
          <Box
            width="8px"
            height="8px"
            borderRadius="50%"
            background="red"
            margin="0 auto"
            marginTop="2px"
          />
        );
      }
    }
    return null;
  };

  return (
    <Theme theme={theme}>
      <Helmet>
        <title>Calendar</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>

      {/* Navigation Header */}
      <NavBar role={sessionStorage.getItem("role")} current={"Calendar"} />

      {/* Main Calendar Content */}
      <Section padding="20px 0 20px 0">
        <Text
          font="normal 500 48px/1.2 --fontFamily-serifGeorgia"
          text-align="center"
        >
          Calendar
        </Text>

        <Box display="flex" flexDirection="column" alignItems="center">
          {/* Centered Calendar */}
          <Box display="flex" justifyContent="center" width="100%">
            <Calendar
              onChange={onDateChange}
              value={selectedDate}
              tileContent={tileContent}
              onActiveStartDateChange={({ activeStartDate }) =>
                loadEventsForMonth(activeStartDate)
              }
            />
          </Box>
        </Box>
      </Section>
      <Section padding="20px 0 0px 0">
        <Box display="flex" flexDirection="column" alignItems="center">
          {/* Conditionally render the table only if there are events */}
          {getEventsForDate(selectedDate).length > 0 && (
            <Box marginTop="30px" width="100%">
              <Box
                as="table"
                width="100%"
                borderCollapse="collapse"
                marginTop="30px"
              >
                <thead>
                  <tr>
                    <th style={{ padding: "10px", textAlign: "left" }}>
                      Customer Name
                    </th>
                    <th style={{ padding: "10px", textAlign: "left" }}>
                      Items
                    </th>
                    <th style={{ padding: "10px", textAlign: "left" }}>
                      Created On
                    </th>
                    <th style={{ padding: "10px", textAlign: "left" }}>
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getEventsForDate(selectedDate).map((event, index) => (
                    <tr key={index}>
                      <td style={{ padding: "10px", textAlign: "left" }}>
                        {event.customer_name}
                      </td>
                      <td style={{ padding: "10px", textAlign: "left" }}>
                        {event.pieces.number_of_pieces}
                      </td>
                      <td style={{ padding: "10px", textAlign: "left" }}>
                        {event.orderCreationDate}
                      </td>
                      <td
                        style={{
                          padding: "10px",
                          textAlign: "left",
                          color: getStatusColor(event.progress),
                        }}
                      >
                        {event.progress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          )}
        </Box>
        
        {/* Toast Notification */}
        {toastMessage && (
          <Box
            background="--color-lightD2"
            padding="10px"
            borderRadius="5px"
            textAlign="center"
            marginTop="20px"
            onClick={() => setToastMessage(null)} // Close toast on click
            cursor="pointer"
          >
            {toastMessage}
          </Box>
        )}
      </Section>
      
    </Theme>
  );
  
};

export default CalendarPage;

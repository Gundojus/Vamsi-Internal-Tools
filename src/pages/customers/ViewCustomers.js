// CustomersList.js

import React, { useState, useEffect } from "react";
import theme from "theme";
import { Theme, Text, Icon, Box, Section, Strong, Input } from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { MdCreate, MdDeleteSweep, MdPersonAdd } from "react-icons/md";
import { useHistory } from "react-router-dom";
import { getDatabase, ref as dbRef, onValue } from "firebase/database";
import { deleteCustomerById } from "../utils/firebaseConfig";
import { NavBar } from "../utils/navbar";

const fetchCustomers = (setCustomers) => {
  const db = getDatabase();
  const customersRef = dbRef(db, "vamsi/customers");

  onValue(customersRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const customersArray = Object.keys(data).map((key) => ({
        uuid: key,
        ...data[key],
      }));
      setCustomers(customersArray);
    } else {
      setCustomers([]); // No customers found
    }
  });
};

const deleteCustomer = async (uuid) => {
  try {
    await deleteCustomerById(uuid);
    window.location.reload(); // Reload the page after deletion
  } catch (error) {
    console.error("Error deleting customer: ", error);
    alert("Failed to delete the customer. Please try again.");
  }
};

export default () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const history = useHistory();

  // Fetch all customers on component mount
  useEffect(() => {
    fetchCustomers(setCustomers);
  }, []);

  // Handle editing a customer
  const editCustomer = (uuid) => {
    history.push(`/customers/edit?uuid=${uuid}`);
  };

  // Handle deleting a customer
  const handleDelete = (uuid) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer(uuid);
    }
  };

  // Navigate to Add Customer page
  const addCustomer = () => {
    history.push("/customers/add");
  };

  // Function to normalize phone numbers (remove non-digit characters)
  const normalizePhoneNumber = (phone) => {
    return String(phone).replace(/\D/g, "");
  };

  // Filter customers based on search term
  const filteredCustomers = customers.filter((customer) => {
    try {
      if (!customer) return false;

      const nameField = String(customer.name || "").toLowerCase().trim();
      const term = String(searchTerm || "").toLowerCase().trim();
      const nameMatch = nameField.includes(term);

      const phoneField = String(customer.phone || customer.phone_number || "");
      const normalizedPhoneField = normalizePhoneNumber(phoneField);
      const normalizedSearchTerm = normalizePhoneNumber(searchTerm);

      let phoneMatch = false;
      if (normalizedSearchTerm !== "") {
        phoneMatch = normalizedPhoneField.includes(normalizedSearchTerm);
      }

      return nameMatch || phoneMatch;
    } catch (error) {
      console.error("Error filtering customers:", error);
      return false;
    }
  });

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"customers-list"} />
      <Helmet>
        <title>Customers</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>

      <NavBar role={sessionStorage.getItem("role")} current={"View Customers"} />

      <Section padding="90px 0 100px 0" quarkly-title="Customers-List">
        <Text
          margin="0px 0px 20px 0px"
          text-align="center"
          font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
          color="--dark"
          sm-margin="0px 0px 30px 0px"
        >
          Customers
        </Text>
        <Icon
          category="md"
          icon={MdPersonAdd}
          onClick={() => addCustomer()}
          size="32px"
          align-self="flex-end"
          margin="16px 0px 16px 0px"
          style={{ cursor: "pointer" }}
        />

        {/* Search Box */}
        <Box display="flex" justify-content="center" margin="20px 0">
          <Input
            width="50%"
            placeholder="Search by name or phone number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            padding="10px"
            border-radius="7.5px"
            border="1px solid #ccc"
          />
        </Box>

        {/* Begin Fixed-Width Container with Desktop Dimensions and Scrolls */}
        <Box
          min-width="1200px" // Ensures the container doesn't shrink below 1200px
          overflow="auto" // Enables horizontal and vertical scrolling when content overflows
          margin="0 auto"
          padding="0 10px"
        >
          {/* Header Row */}
          <Box
            display="flex"
            align-items="center"
            padding="10px"
            border-width="0 0 2px 0"
            border-style="solid"
            border-color="#d1d7de"
            margin="0px 0px 10px 0px"
          >
            <Text flex="1" text-align="center" font="--lead" color="--dark">
              <Strong>Name</Strong>
            </Text>
            <Text flex="1" text-align="center" font="--lead" color="--dark">
              <Strong>Phone Number</Strong>
            </Text>
            <Text width="100px" text-align="center" font="--lead" color="--dark">
              <Strong>Edit</Strong>
            </Text>
            <Text width="100px" text-align="center" font="--lead" color="--dark">
              <Strong>Delete</Strong>
            </Text>
          </Box>

          {filteredCustomers.length > 0 ? (
            <Box>
              {filteredCustomers.map((customer) => (
                <Box
                  key={customer.uuid}
                  display="flex"
                  align-items="center"
                  padding="10px"
                  border-width="0 0 1px 0"
                  border-style="solid"
                  border-color="#d1d7de"
                  background="#ffffff"
                  margin="0px 0px 10px 0px"
                >
                  {/* Customer Name */}
                  <Text
                    flex="1"
                    text-align="center"
                    font="normal 500 24px/1.2 --fontFamily-serifGeorgia"
                    color="--dark"
                  >
                    {customer.name || customer.customer_name || "N/A"}
                  </Text>

                  {/* Phone Number */}
                  <Text
                    flex="1"
                    text-align="center"
                    font="normal 400 20px/1.5 --fontFamily-sans"
                    color="--dark"
                  >
                    {customer.countryCode || "N/A"} {customer.phone || customer.phone_number || "N/A"}
                  </Text>

                  {/* Edit Icon */}
                  <Box
                    width="100px" // Fixed width for adequate space
                    display="flex"
                    justify-content="center"
                    align-items="center"
                    padding="0 10px" // Adds space around the icon
                  >
                    <Icon
                      category="md"
                      icon={MdCreate}
                      size="32px"
                      onClick={() => editCustomer(customer.uuid)}
                      style={{ cursor: "pointer" }}
                    />
                  </Box>

                  {/* Delete Icon */}
                  <Box
                    width="100px" // Fixed width for adequate space
                    display="flex"
                    justify-content="center"
                    align-items="center"
                    padding="0 10px" // Adds space around the icon
                  >
                    <Icon
                      category="md"
                      icon={MdDeleteSweep}
                      size="32px"
                      onClick={() => handleDelete(customer.uuid)}
                      style={{ cursor: "pointer" }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Text text-align="center">No customers available</Text>
          )}
        </Box>
        {/* End Fixed-Width Container */}
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
};

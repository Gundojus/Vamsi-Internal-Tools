// Import necessary modules and components
import React, { useState, useRef } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Input,
  Box,
  Button,
  Section,
  Hr,
  Icon,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles"; // Firebase database imports
import { NavBar } from "../utils/navbar"; // Import your NavBar component
import {
  uploadImage,
  addCustomerToDatabase,
  deleteImageFromStorage, // Import delete function (to be implemented)
} from "../utils/firebaseConfig"; // Import the uploadImage function
import { MdDeleteSweep, MdArrowBack } from "react-icons/md"; // Import Delete Icon
import Footer from "../utils/footer";
import { useHistory } from "react-router-dom";

const generateUUID = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 7; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// The main component for adding a new customer
export default () => {
  const history = useHistory();
  // State variables for customer information
  const [customerName, setCustomerName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [images, setImages] = useState([]); // For storing measurement images

  // Function to handle file uploads for measurements
  const handleFileUpload = async (files) => {
    try {
      const uploadedImageUrls = await Promise.all(
        files.map((file) => uploadImage(file)) // Use uploadImage function from firebaseConfig.js
      );
      setImages((prevImages) => [...prevImages, ...uploadedImageUrls]); // Store URLs in state
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  // Function to handle deleting an image
  const handleDeleteImage = async (index) => {
    if (
      window.confirm(
        "Are you sure you want to delete this measurement image? This action cannot be undone."
      )
    ) {
      try {
        const imageToDelete = images[index];
        // Extract storage path from image URL
        const storagePath = extractStoragePathFromURL(imageToDelete); // Implement based on your URL structure
        if (storagePath) {
          await deleteImageFromStorage(storagePath); // Implement deleteImageFromStorage in firebaseConfig.js
        }
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image. Please try again.");
      }
    }
  };

  // Helper function to extract storage path from URL (Implementation depends on your storage setup)
  const extractStoragePathFromURL = (url) => {
    // Example implementation:
    // Assuming your Firebase storage URLs are structured as:
    // https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/path%2Fto%2Fimage.jpg?...
    // You need to extract 'path/to/image.jpg'
    try {
      const baseURL = "https://firebasestorage.googleapis.com/v0/b/your-app.appspot.com/o/";
      if (url.startsWith(baseURL)) {
        const encodedPath = url.substring(baseURL.length, url.indexOf("?"));
        return decodeURIComponent(encodedPath);
      }
      return null;
    } catch (error) {
      console.error("Error extracting storage path:", error);
      return null;
    }
  };

  // FileUploader component for uploading images
  const FileUploader = ({ handleFile }) => {
    const hiddenFileInput = useRef(null);

    const handleClick = () => {
      hiddenFileInput.current.click();
    };

    const handleChange = (event) => {
      const files = Array.from(event.target.files);
      handleFile(files);
    };

    return (
      <>
        <Button
          className="button-upload"
          onClick={handleClick}
          margin="20px 0"
          background="#cb7731"
          color="white"
          padding="10px 20px"
          border-radius="7.5px"
        >
          Upload Images
        </Button>
        <input
          type="file"
          onChange={handleChange}
          ref={hiddenFileInput}
          style={{ display: "none" }}
          multiple
          accept="image/*"
        />
      </>
    );
  };

  // Function to add the customer to Firebase Realtime Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !phoneNumber) {
      alert("Please fill in customer name and phone number");
      return;
    }
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;
    try {
      await addCustomerToDatabase(generateUUID(), customerName, countryCode, phoneNumber, images);
      // Reset form fields after successful submission
      setCustomerName("");
      setPhoneNumber("");
      setCountryCode("+91");
      setImages([]);
      alert("Customer added successfully!");
      history.push("/customers/view");
    } catch (error) {
      console.error("Error adding customer:", error);
      alert("Failed to add customer. Please try again.");
      history.push("/customers/view");
    }
  };

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"add-customer"} />
      <Helmet>
        <title>Add New Customer</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>

      {/* Navigation Bar */}
      <NavBar />

      <Section padding="90px 0 100px 0" quarkly-title="Add-Customer">
      
        <Box
          display="flex"
          align-items="center"
          justify-content="center"
          position="relative"
        >
          <Icon
            category="md"
            icon={MdArrowBack}
            size="40px"
            margin="16px"
            padding="0px 0px 16px 0px"
            onClick={() => history.push("/customers/view")}
            style={{ cursor: "pointer", position: "absolute", left: "0" }}
            aria-label="Back to Orders"
          />
          <Text
            margin="0px 0px 20px 0px"
            text-align="center"
            font="normal 500 56px/1.2 --fontFamily-serifGeorgia"
            color="--dark"
            sm-margin="0px 0px 30px 0px"
          >
            Add New Customer
          </Text>
        </Box>

        <Box min-width="100px" min-height="100px" padding="15px 0px 15px 0px">
          {/* Customer Name Input */}
          <Text margin="15px 0px 15px 0px">Customer Name</Text>
          <Input
            display="block"
            placeholder-color="LightGray"
            background="white"
            border-color="--color-darkL2"
            border-radius="7.5px"
            width="50%"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            aria-label="Customer Name"
          />

          {/* Phone Number Input */}
          <Text margin="15px 0px 15px 0px">Phone Number</Text>
          <Box
            min-width="100px"
            display="flex"
            align-items="center"
            padding="15px 0px 15px 0px"
          >
            <Input
              display="inline-block"
              background="white"
              value={countryCode}
              border-color="--color-darkL2"
              width="5%"
              padding="6px 8px"
              border-radius="7.5px"
              margin="0px 4px 0px 0px"
              required
              onChange={(e) => setCountryCode(e.target.value)}
              aria-label="Country Code"
            />
            <Input
              display="inline-block"
              background="white"
              border-color="--color-darkL2"
              border-radius="7.5px"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              aria-label="Phone Number"
            />
          </Box>

          {/* Measurements Upload */}
          <Text margin="15px 0px 15px 0px">Measurements</Text>
          <FileUploader handleFile={handleFileUpload} />
          {images.length > 0 && (
            <Box
              display="grid"
              grid-template-columns={`repeat(${Math.min(images.length, 4)}, 225px)`}
              grid-auto-rows="225px"
              grid-gap="15px"
              width={`${
                Math.min(images.length, 4) * 225 +
                (Math.min(images.length, 4) - 1) * 15
              }px`}
              overflow="auto"
              padding="15px"
              border="1px solid #ccc"
              margin="15px 0"
            >
              {images.map((image, index) => (
                <Box
                  key={index}
                  as="div"
                  position="relative" // To position the delete icon
                >
                  {/* Measurement Image Thumbnail */}
                  <Box
                    as="img"
                    src={image}
                    width="225px"
                    height="225px"
                    object-fit="cover"
                    border-radius="5px"
                    onClick={() => window.open(image, "_blank")}
                    style={{ cursor: "pointer" }}
                    alt={`Measurement Image ${index + 1}`}
                  />
                  {/* Delete Icon */}
                  <Icon
                    category="md"
                    icon={MdDeleteSweep}
                    size="24px"
                    color="#ff0000"
                    position="absolute"
                    top="5px"
                    right="5px"
                    onClick={() => handleDeleteImage(index)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                    }}
                    aria-label={`Delete Measurement Image ${index + 1}`}
                  />
                </Box>
              ))}
            </Box>
          )}

          {/* Horizontal Rule */}
          <Hr
            min-height="10px"
            min-width="100%"
            margin="15px 0px 15px 0px"
            border-color="--color-darkL2"
            width="1200px"
          />

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            margin="40px 0"
            background="#cb7731"
            color="white"
            padding="10px 20px"
            border-radius="7.5px"
            aria-label="Add Customer"
          >
            Add Customer
          </Button>
        </Box>
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
};

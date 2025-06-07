import React, { useState, useEffect, useRef } from "react";
import theme from "theme";
import {
  Theme,
  Text,
  Input,
  Hr,
  Box,
  Button,
  Section,
  Icon,
} from "@quarkly/widgets";
import { Helmet } from "react-helmet";
import { GlobalQuarklyPageStyles } from "global-page-styles";
import { MdDeleteSweep, MdArrowBack } from "react-icons/md";
import {
  fetchCustomerById,
  editCustomerById,
  uploadImage,
  deleteImageFromStorage,
} from "../utils/firebaseConfig";
import { useHistory, useLocation } from "react-router-dom";
import Footer from "../utils/footer";
const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

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
        onClick={handleClick}
        margin="40px 0"
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

export default () => {
  const history = useHistory();
  const query = useQuery();
  const uuid = query.get("uuid");
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [measurementUrls, setMeasurementUrls] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (uuid) {
          fetchCustomerById(uuid, (data) => {
            if (data) {
              setCustomerData(data);
              setMeasurementUrls(data.measurements || []);
            } else {
              setError("Customer not found or invalid UUID.");
            }
            setLoading(false);
          });
        } else {
          setError("Invalid customer UUID.");
          setLoading(false);
        }
      } catch (err) {
        setError("Error fetching customer data.");
        setLoading(false);
      }
    };
    fetchData();
  }, [uuid]);

  const handleFileUpload = async (files) => {
    try {
      const uploadedmeasurementUrls = await Promise.all(
        files.map((file) => uploadImage(file))
      );
      setMeasurementUrls((prevUrls) => [...prevUrls, ...uploadedmeasurementUrls]);
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    }
  };

  const handleDeleteImage = async (index) => {
    if (
      window.confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      try {
        const imageToDelete = measurementUrls[index];
        const storagePath = extractStoragePathFromURL(imageToDelete);
        if (storagePath) {
          await deleteImageFromStorage(storagePath);
        }
        const updatedImages = measurementUrls.filter((_, i) => i !== index);
        setMeasurementUrls(updatedImages);
      } catch (error) {
        console.error("Error deleting image:", error);
        alert("Failed to delete image. Please try again.");
      }
    }
  };

  const extractStoragePathFromURL = (url) => {
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

  const handleSaveCustomer = async () => {
    try {
      const updatedCustomerData = {
        ...customerData,
        measurements: measurementUrls,
      };
      console.log({updatedCustomerData});
      await editCustomerById(uuid, updatedCustomerData);
      alert("Customer updated successfully");
      history.push("/customers/view");
    } catch (err) {
      console.error("Error updating customer:", err);
      alert("Error updating customer. Please try again.");
    }
  };

  const openImageInModal = (url) => {
    setModalImageUrl(url);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalImageUrl("");
  };

  if (loading) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"edit-customer"} />
        <Helmet>
          <title>Edit Customer</title>
          <link
            rel={"shortcut icon"}
            href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
            type={"image/x-icon"}
          />
        </Helmet>
        <Section padding="90px 0 100px 0" quarkly-title="Edit-Customer">
          <Text>Loading...</Text>
        </Section>
      </Theme>
    );
  }

  if (error) {
    return (
      <Theme theme={theme}>
        <GlobalQuarklyPageStyles pageUrl={"edit-customer"} />
        <Helmet>
          <title>Edit Customer</title>
          <link
            rel={"shortcut icon"}
            href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
            type={"image/x-icon"}
          />
        </Helmet>
        <Section padding="90px 0 100px 0" quarkly-title="Edit-Customer">
          <Text>{error}</Text>
        </Section>
      </Theme>
    );
  }

  return (
    <Theme theme={theme}>
      <GlobalQuarklyPageStyles pageUrl={"edit-customer"} />
      <Helmet>
        <title>Edit Customer</title>
        <link
          rel={"shortcut icon"}
          href={"https://live.staticflickr.com/65535/54572815698_9a48e198df_b.jpg"}
          type={"image/x-icon"}
        />
      </Helmet>
      <Section padding="90px 0 100px 0" quarkly-title="Edit-Customer">
        <Box
          minWidth="1200px"
          overflow="auto"
          margin="0 auto"
          padding="0 10px"
        >
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
              Edit Customer
            </Text>
          </Box>
          <Box minWidth="100px" minHeight="100px" padding="15px 0px 15px 0px">
            <Text margin="15px 0px 15px 0px">Name</Text>
            <Input
              display="block"
              background="white"
              borderColor="--color-darkL2"
              borderRadius="7.5px"
              width="50%"
              value={customerData.name || ""}
              
              aria-label="Customer Name"
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />
            <Text margin="15px 0px 15px 0px">Phone Number</Text>
            <Input
              display="block"
              background="white"
              borderColor="--color-darkL2"
              borderRadius="7.5px"
              width="50%"
              value={customerData.countryCode + " " + customerData.phone || ""}
              
              aria-label="Phone Number"
            />
            <Hr margin="15px 0px 15px 0px" width="1200px" />
            <Text margin="15px 0px 15px 0px">Images</Text>
            <FileUploader handleFile={handleFileUpload} />
            {/* measurementUrls */}
            {measurementUrls.length > 0 && (
              <Box
                display="grid"
                grid-template-columns={`repeat(${Math.min(
                  measurementUrls.length,
                  4
                )}, 225px)`}
                grid-auto-rows="225px"
                grid-gap="15px"
                width={`${
                  Math.min(measurementUrls.length, 4) * 225 +
                  (Math.min(measurementUrls.length, 4) - 1) * 15
                }px`}
                overflow="auto"
                padding="15px"
                border="1px solid #ccc"
                margin="15px 0"
              >
                {measurementUrls.map((url, index) => (
                  <Box
                    key={index}
                    as="div"
                    position="relative" // To position the delete icon
                  >
                    {/* Image Thumbnail */}
                    <Box
                      as="img"
                      src={url}
                      width="225px"
                      height="225px"
                      object-fit="cover"
                      border-radius="5px"
                      onClick={() => openImageInModal(url)}
                      style={{ cursor: "pointer" }}
                      alt={`Order Image ${index + 1}`}
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
                      aria-label={`Delete Image ${index + 1}`}
                    />
                  </Box>
                ))}
              </Box>
            )}
            <Hr margin="15px 0px 15px 0px" width="1200px" />
            <Button
              onClick={handleSaveCustomer}
              margin="40px 0"
              background="#cb7731"
              color="white"
              padding="10px 20px"
              border-radius="7.5px"
            >
              Save Changes
            </Button>
          </Box>
        </Box>
        {modalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
            onClick={closeModal}
          >
            <img
              src={modalImageUrl}
              alt="Full Size"
              style={{ maxHeight: "90%", maxWidth: "90%" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </Section>
      {/* <Footer /> */}
    </Theme>
  );
};
